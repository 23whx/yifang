import type {BoardConnection} from './manual-connection';
import type {Ffish} from './ffish';
import {replayRecovery,type RecoveryGame} from './recovery-replay';
import {BoardRecoveryAgreement,proposeBoardRecovery,validBoardRecoveryChallenge,type BoardRecoveryChallenge} from './recovery-agreement';
import {validRecoveryKey} from '../recovery-auth';

const CHUNK=16000,MAX_PACKET=4000000;
type Packet=Record<string,unknown>;
/** Recovery-only phase of an already selected fresh BoardConnection.
 * Caller forwards data here until onReady, then uses the normal game protocol.
 * Never sends the stored bearer key. Board histories are public information.
 * Stop-and-wait chunks retain ManualRTC's 64KB frame/backpressure limits.
 */
export class BoardRecoveryChannel {
 private stopped=false;
 private complete=false;
 private phase='new';
 private timer?:ReturnType<typeof setTimeout>;
 private agreement?:BoardRecoveryAgreement;
 private challenge?:BoardRecoveryChallenge;
 private incoming?:{id:string;total:number;parts:string[];size:number};
 private outgoing?:{id:string;parts:string[];index:number;resolve:()=>void;reject:(e:Error)=>void};
 private processing=Promise.resolve();
 private own:string;
 private identity:string;
 constructor(private connection:BoardConnection,private rules:Ffish|null,private game:RecoveryGame,private role:'host'|'guest',private secret:string,checkpoint:string,
  private onReady:(checkpoint:string,epoch:string)=>void,private onFailure:()=>void){
  if(!validRecoveryKey(secret)||(role!=='host'&&role!=='guest'))throw new Error('Invalid recovery credentials');
  const s=replayRecovery(rules,game,checkpoint);
  this.own=s.checkpoint;this.identity=s.identity;
 }
 open(){
  if(this.phase!=='new'||this.stopped)return this.fail();
  this.phase=this.role==='host'?'guest-record':'hello';
  this.timer=setTimeout(()=>this.fail(),30000);
  if(this.role==='host'){
   const epoch=crypto.randomUUID();this.agreement=new BoardRecoveryAgreement(this.secret,this.role,this.game,this.identity,epoch);
   this.challenge={game:this.game,identity:this.identity,epoch,hostNonce:this.agreement.nonce,guestNonce:'',hostDigest:'',guestDigest:'',agreedDigest:''};
   void this.send({kind:'hello',game:this.game,identity:this.identity,epoch,nonce:this.agreement.nonce}).catch(()=>this.fail());
  }
 }
 receive(raw:unknown){
  if(this.stopped||this.complete)return;
  try{
   if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('Invalid recovery frame');
   const v=raw as Packet;
   if(v.tag!=='board-recovery-v1'||typeof v.id!=='string'||!/^[a-zA-Z0-9-]{12,80}$/.test(v.id))throw new Error('Invalid recovery envelope');
   if(v.kind==='ack'){
    const out=this.outgoing;if(!out||v.id!==out.id||v.index!==out.index)throw new Error('Unexpected recovery acknowledgement');
    if(++out.index===out.parts.length){this.outgoing=undefined;out.resolve();}else this.sendPart();
    return;
   }
   if(v.kind!=='chunk'||!Number.isSafeInteger(v.index)||!Number.isSafeInteger(v.total)||Number(v.total)<1||Number(v.total)>250||typeof v.data!=='string'||v.data.length<1||v.data.length>CHUNK)throw new Error('Invalid recovery chunk');
   if(!this.incoming){if(v.index!==0)throw new Error('Missing recovery start');this.incoming={id:v.id,total:Number(v.total),parts:[],size:0};}
   const input=this.incoming;
   if(input.id!==v.id||input.total!==v.total||input.parts.length!==v.index||Number(v.index)>=input.total)throw new Error('Recovery chunk out of order');
   input.parts.push(v.data);input.size+=v.data.length;if(input.size>MAX_PACKET)throw new Error('Recovery packet too large');
   this.connection.send({tag:'board-recovery-v1',kind:'ack',id:v.id,index:v.index});
   if(input.parts.length===input.total){
    this.incoming=undefined;const packet:unknown=JSON.parse(input.parts.join(''));
    if(!packet||typeof packet!=='object'||Array.isArray(packet))throw new Error('Invalid recovery packet');
    this.processing=this.processing.then(()=>this.handle(packet as Packet)).catch(()=>this.fail());
   }
  }catch{this.fail();}
 }
 private send(packet:Packet){
  if(this.stopped||this.outgoing)return Promise.reject(new Error('Recovery send unavailable'));
  const text=JSON.stringify(packet);if(text.length>MAX_PACKET)return Promise.reject(new Error('Recovery packet too large'));
  const parts:string[]=[];for(let i=0;i<text.length;i+=CHUNK)parts.push(text.slice(i,i+CHUNK));
  return new Promise<void>((resolve,reject)=>{this.outgoing={id:crypto.randomUUID(),parts,index:0,resolve,reject};this.sendPart();});
 }
 private sendPart(){
  const out=this.outgoing;if(!out)return;
  try{this.connection.send({tag:'board-recovery-v1',kind:'chunk',id:out.id,index:out.index,total:out.parts.length,data:out.parts[out.index]});}catch{this.fail();}
 }
 private async handle(v:Packet){
  if(this.stopped||this.complete)return;
  if(this.role==='guest'&&this.phase==='hello'&&v.kind==='hello'){
   if(v.game!==this.game||v.identity!==this.identity||typeof v.epoch!=='string'||!validRecoveryKey(v.nonce))throw new Error('Recovery hello mismatch');
   this.agreement=new BoardRecoveryAgreement(this.secret,'guest',this.game,this.identity,v.epoch);
   this.phase='host-proof';
   this.challenge={game:this.game,identity:this.identity,epoch:v.epoch,hostNonce:v.nonce,guestNonce:this.agreement.nonce,hostDigest:'',guestDigest:'',agreedDigest:''};
   await this.send({kind:'guest-record',nonce:this.agreement.nonce,checkpoint:this.own});return;
  }
  if(this.role==='host'&&this.phase==='guest-record'&&v.kind==='guest-record'){
   if(!validRecoveryKey(v.nonce)||typeof v.checkpoint!=='string')throw new Error('Invalid guest record');
   // The host-owned epoch is retained by the agreement and checked in prepare.
   const p=await proposeBoardRecovery(this.rules,this.game,this.own,v.checkpoint);
   if(p.identity!==this.identity)throw new Error('Wrong original match');
   const c={...this.challenge!,game:this.game,identity:this.identity,hostNonce:this.agreement!.nonce,guestNonce:v.nonce,hostDigest:p.hostDigest,guestDigest:p.guestDigest,agreedDigest:p.agreedDigest};
   await this.agreement!.prepare(this.rules,c,this.own,v.checkpoint);
   const proof=await this.agreement!.proof();if(this.stopped)return;
   this.challenge=c;this.phase='guest-proof';await this.send({kind:'host-proof',challenge:c,checkpoint:this.own,proof});return;
  }
  if(this.role==='guest'&&this.phase==='host-proof'&&v.kind==='host-proof'){
   if(!validBoardRecoveryChallenge(v.challenge)||typeof v.checkpoint!=='string'||v.challenge.hostNonce!==this.challenge?.hostNonce)throw new Error('Invalid host proposal');
   await this.agreement!.prepare(this.rules,v.challenge,v.checkpoint,this.own);
   if(!await this.agreement!.acceptPeer(v.proof))throw new Error('Host proof rejected');
   const proof=await this.agreement!.proof();if(this.stopped)return;
   this.challenge=v.challenge;this.phase='ready';await this.send({kind:'guest-proof',proof});return;
  }
  if(this.role==='host'&&this.phase==='guest-proof'&&v.kind==='guest-proof'){
   if(!await this.agreement!.acceptPeer(v.proof))throw new Error('Guest proof rejected');
   if(this.stopped)return;this.phase='finishing';await this.send({kind:'ready',digest:this.challenge!.agreedDigest});this.finish();return;
  }
  if(this.role==='guest'&&this.phase==='ready'&&v.kind==='ready'&&v.digest===this.challenge!.agreedDigest){this.finish();return;}
  throw new Error('Unexpected recovery packet');
 }
 private finish(){if(this.stopped||this.complete)return;const text=this.agreement!.confirmedCheckpoint();this.complete=true;clearTimeout(this.timer);this.secret='';this.onReady(text,this.challenge!.epoch);}
 private fail(){if(this.stopped||this.complete)return;this.stop();this.connection.close();this.onFailure();}
 stop(){this.stopped=true;clearTimeout(this.timer);this.secret='';this.incoming=undefined;const out=this.outgoing;this.outgoing=undefined;out?.reject(new Error('Recovery stopped'));}
}
