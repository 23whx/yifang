import {ManualRTC} from '../manual-rtc';
import {RiichiRoomHost,type RiichiRoomMessage} from './riichi-room';
import {validRiichiPayload} from './riichi-wire';

import {recoveryProof,verifyRecoveryProof,validRecoveryKey,validRecoveryChallenge,type RecoveryChallenge} from '../recovery-auth';

type Channel=Pick<ManualRTC,'offer'|'answer'|'finish'|'send'|'close'|'onopen'|'ondata'|'onclose'|'onerror'|'open'>;
type Factory=(host:boolean)=>Channel;
const native:Factory=host=>new ManualRTC('riichi',host);
type Welcome={kind:'riichi-welcome';v:1;match:string;seat:number;recoveryKey?:string;recoveryMatch:string};
export type RiichiGuestRecovery={version:1;game:'riichi-guest';match:string;seat:number;key:string;lastView:string};
export function readRiichiGuestRecovery(text:string):RiichiGuestRecovery{
  if(typeof text!=='string'||text.length>62000)throw new Error('Invalid guest recovery');
  const v=JSON.parse(text);
  if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!['version','game','match','seat','key','lastView'].includes(k))||v.version!==1||v.game!=='riichi-guest'||
    typeof v.match!=='string'||!/^[a-zA-Z0-9-]{12,80}$/.test(v.match)||!seat(v.seat)||v.seat===0||!validRecoveryKey(v.key)||typeof v.lastView!=='string'||v.lastView.length>60000||
    !validRiichiPayload({kind:'checkpoint',snapshot:JSON.parse(v.lastView)},v.seat))throw new Error('Invalid guest recovery');
  return v;
}
const seat=(n:unknown):n is number=>Number.isInteger(n)&&Number(n)>=0&&Number(n)<4;

/** Three independently exchanged offers: each binds one guest to the host.
 * No signaling/STUN/TURN service is used by the default native channel factory.
 * A fresh instance is required after a played match is closed. */
export class ManualRiichiHost {
  private channels=new Map<number,Channel>();
  private disposed=false;
  private previousMatch?:string;
  readonly room:RiichiRoomHost;
  constructor(onMessage:(message:RiichiRoomMessage)=>void,private onDisconnect:(seat:number)=>void,private create:Factory=native,checkpoint?:string){
    this.room=checkpoint?RiichiRoomHost.restoreCheckpoint(checkpoint,onMessage):new RiichiRoomHost(crypto.randomUUID(),onMessage);
    if(checkpoint)this.previousMatch=this.room.recoveryIdentity;
  }
  async offer(id:number){
    if(this.disposed||this.room.status!=='lobby'||!seat(id)||id===0||this.channels.has(id))throw new Error('Seat unavailable');
    const channel=this.create(true);this.channels.set(id,channel);
    let challenge:RecoveryChallenge|undefined,authenticated=false,authenticating=false;
    let timer:ReturnType<typeof setTimeout>|undefined;
    const welcome=()=>channel.send({kind:'riichi-welcome',v:1,match:this.room.match,seat:id,recoveryKey:this.previousMatch?undefined:this.room.recoveryCredential(id),recoveryMatch:this.room.recoveryIdentity} satisfies Welcome);
    channel.onopen=()=>{
      if(this.disposed||this.channels.get(id)!==channel){channel.close();return;}
      try{
        if(this.previousMatch){
          challenge={game:'riichi',previousMatch:this.previousMatch,match:this.room.match,seat:id,nonce:Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('')};
          timer=setTimeout(()=>channel.close(),15000);
          void recoveryProof(this.room.recoveryCredential(id),challenge,'host').then(proof=>{
            if(!this.disposed&&this.channels.get(id)===channel)channel.send({kind:'riichi-recovery-challenge',v:1,challenge,proof});
          }).catch(()=>channel.close());
        }else{
          welcome();authenticated=true;
          if(!this.room.join(id,m=>channel.send(m)))channel.close();
        }
      }catch{channel.close();}
    };
    channel.ondata=value=>{
      if(this.disposed||this.channels.get(id)!==channel)return;
      if(authenticated){this.room.receive(id,value);return;}
      if(!challenge||authenticating||!value||typeof value!=='object'||Array.isArray(value)){channel.close();return;}
      const v=value as Record<string,unknown>;
      if(v.kind!=='riichi-recovery-proof'||v.v!==1||typeof v.lastView!=='string'||v.lastView.length>60000){channel.close();return;}
      authenticating=true;
      void verifyRecoveryProof(this.room.recoveryCredential(id),challenge,'guest',v.proof,v.lastView).then(ok=>{
        if(this.disposed||this.channels.get(id)!==channel)return;
        if(!ok){channel.close();return;}
        const queued:RiichiRoomMessage[]=[];
        const sender=(m:RiichiRoomMessage)=>authenticated?channel.send(m):queued.push(m);
        if(!this.room.resume(id,this.room.recoveryCredential(id),v.lastView as string,sender)){channel.close();return;}
        clearTimeout(timer);welcome();authenticated=true;queued.forEach(m=>channel.send(m));
      }).catch(()=>channel.close());
    };
    channel.onclose=()=>{
      clearTimeout(timer);
      if(this.channels.get(id)!==channel)return;
      this.channels.delete(id);
      if(!this.disposed)this.onDisconnect(id);
      this.room.leave(id);
      if(this.room.status==='closed')this.close();
    };
    channel.onerror=()=>channel.close();
    try{return await channel.offer();}catch(error){channel.close();throw error;}
  }
  async finish(id:number,response:string){
    const channel=this.channels.get(id);
    if(this.disposed||!channel)throw new Error('No offer for seat');
    await channel.finish(response);
  }
  cancelOffer(id:number){if(this.room.status!=='lobby')return false;const channel=this.channels.get(id);if(!channel)return false;channel.close();return true;}
  start(){return !this.disposed&&this.room.start();}
  submit(request:number,revision:number,choice:string){return !this.disposed&&this.room.receive(0,{v:1,game:'riichi',match:this.room.match,request,revision,choice});}
  close(){
    if(this.disposed)return;this.disposed=true;this.room.leave(0);
    const channels=[...this.channels.values()];this.channels.clear();channels.forEach(c=>c.close());
  }
}

/** Guest connection identity is assigned once by the offer's host, then every
 * envelope must retain it. Ordered WebRTC must not skip or replay sequences. */
export class ManualRiichiGuest {
  private channel:Channel;
  private welcome?:Welcome;
  private sequence=0;
  private request=0;
  private pending?:{request:number;timer:ReturnType<typeof setTimeout>};
  private disposed=false;
  private recovery?:RiichiGuestRecovery;
  private challenge?:RecoveryChallenge;
  private hostVerified=false;
  private lastView?:string;
  constructor(private onMessage:(message:RiichiRoomMessage)=>void,private onDisconnect:()=>void,create:Factory=native,checkpoint?:string){
    if(checkpoint)this.recovery=readRiichiGuestRecovery(checkpoint);
    this.channel=create(false);
    this.channel.ondata=value=>this.receive(value);
    this.channel.onerror=()=>this.close();
    this.channel.onclose=()=>this.close();
  }
  get identity(){return this.welcome?{match:this.welcome.match,seat:this.welcome.seat}:undefined;}
  recoveryCheckpoint(){return this.welcome&&this.lastView?JSON.stringify({version:1,game:'riichi-guest',match:this.welcome.recoveryMatch,seat:this.welcome.seat,key:this.welcome.recoveryKey!,lastView:this.lastView} satisfies RiichiGuestRecovery):this.recovery?JSON.stringify(this.recovery):null;}
  async answer(offer:string){if(this.disposed)throw new Error('Closed');return this.channel.answer(offer);}
  private receive(value:unknown){
    if(this.disposed)return;
    if(!value||typeof value!=='object'||Array.isArray(value)){this.close();return;}
    const v=value as Record<string,unknown>;
    if(!this.welcome){
      if(v.kind==='riichi-recovery-challenge'){
        if(this.challenge||!this.recovery||v.v!==1||!validRecoveryChallenge(v.challenge)||v.challenge.game!=='riichi'||v.challenge.previousMatch!==this.recovery.match||v.challenge.seat!==this.recovery.seat){this.close();return;}
        const challenge=v.challenge;this.challenge=challenge;
        void verifyRecoveryProof(this.recovery.key,challenge,'host',v.proof).then(async ok=>{
          if(this.disposed)return;if(!ok){this.close();return;}
          const proof=await recoveryProof(this.recovery!.key,challenge,'guest',this.recovery!.lastView);
          if(this.disposed)return;this.hostVerified=true;
          this.channel.send({kind:'riichi-recovery-proof',v:1,proof,lastView:this.recovery!.lastView});
        }).catch(()=>this.close());return;
      }
      if(v.kind!=='riichi-welcome'||v.v!==1||typeof v.match!=='string'||!/^[a-zA-Z0-9-]{12,80}$/.test(v.match)||!seat(v.seat)||v.seat===0||(!this.recovery&&!validRecoveryKey(v.recoveryKey))||typeof v.recoveryMatch!=='string'||!/^[a-zA-Z0-9-]{12,80}$/.test(v.recoveryMatch)||
        (this.recovery&&(!this.hostVerified||v.match!==this.challenge?.match||v.seat!==this.recovery.seat||v.recoveryKey!==undefined||v.recoveryMatch!==this.recovery.match))){this.close();return;}
      this.welcome={kind:'riichi-welcome',v:1,match:v.match,seat:v.seat,recoveryKey:this.recovery?.key??v.recoveryKey as string,recoveryMatch:v.recoveryMatch};return;
    }
    if(v.v!==1||v.game!=='riichi'||v.match!==this.welcome.match||v.recipient!==this.welcome.seat||!Number.isSafeInteger(v.sequence)||v.sequence!==this.sequence+1||!v.payload||typeof v.payload!=='object'){
      this.close();return;
    }
    const payload=v.payload as Record<string,unknown>;
    if(!validRiichiPayload(payload,this.welcome.seat)){this.close();return;}
    if(payload.kind==='ack'){
      if(!this.pending||payload.request!==this.pending.request){this.close();return;}
      clearTimeout(this.pending.timer);this.pending=undefined;
    }
    this.sequence=Number(v.sequence);
    if(payload.kind==='checkpoint')this.lastView=JSON.stringify(payload.snapshot);
    this.onMessage(JSON.parse(JSON.stringify(v)) as RiichiRoomMessage);
    if(payload.kind==='closed')this.close();
  }
  submit(revision:number,choice:string){
    if(this.disposed||this.pending||!this.welcome||!this.channel.open||!Number.isSafeInteger(revision)||revision<1||typeof choice!=='string'||!choice.length||choice.length>40)return false;
    const request=++this.request;
    this.pending={request,timer:setTimeout(()=>this.close(),15000)};
    try{this.channel.send({v:1,game:'riichi',match:this.welcome.match,request,revision,choice});return request;}
    catch{this.close();return false;}
  }
  close(){if(this.disposed)return;this.disposed=true;if(this.pending)clearTimeout(this.pending.timer);this.pending=undefined;this.channel.close();this.onDisconnect();}
}
