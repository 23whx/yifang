import type {Event} from '@kobalab/majiang-core';
import type {RiichiSummary} from './riichi-session';
import {RiichiRecoverySession,type RiichiRecoveryView} from './riichi-recovery';
import {validRecoveryKey} from '../recovery-auth';
import type {RiichiDecision,RiichiSeatView} from './riichi-player';

export type RiichiRoomPayload=
  |{kind:'lobby';connected:boolean[]}
  |{kind:'event';event:Event}
  |{kind:'state';view:RiichiSeatView}
  |{kind:'decision';decision:RiichiDecision}
  |{kind:'ack';request:number;accepted:boolean}
  |{kind:'finished';summary:RiichiSummary}
  |{kind:'checkpoint';snapshot:RiichiRecoveryView}
  |{kind:'closed';reason:'player-left'|'host-left';player:number};
export type RiichiRoomMessage={v:1;game:'riichi';match:string;recipient:number;sequence:number;payload:RiichiRoomPayload};
export type RiichiRoomAction={v:1;game:'riichi';match:string;request:number;revision:number;choice:string};
type Sender=(message:RiichiRoomMessage)=>void;
const newKey=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');

/** Host-browser coordinator for four humans. It does not open a socket or use a
 * backend. A transport must assign one connection to a seat and call receive
 * with THAT bound seat; ignore any seat identity asserted by remote payloads.
 * Senders must use ordered/reliable channels; asynchronous failures call leave.
 * The host is trusted: this is not a cheat-proof server or a money game. */
export class RiichiRoomHost {
  private senders=new Map<number,Sender>();
  private sequence=[0,0,0,0];
  private requests=[0,0,0,0];
  private session:RiichiRecoverySession|null=null;
  private keys=[newKey(),newKey(),newKey(),newKey()];
  private restored=false;
  private processing=false;
  private phase:'lobby'|'playing'|'finished'|'closed'='lobby';
  constructor(readonly match:string,hostSender:Sender){
    if(!/^[a-zA-Z0-9-]{12,80}$/.test(match))throw new Error('Invalid match identity');
    this.senders.set(0,hostSender);
  }
  get status(){return this.phase;}
  get recoveryIdentity(){return this.session?.identity??this.match;}
  recoveryCredential(seat:number){if(!Number.isInteger(seat)||seat<0||seat>3)throw new Error('Invalid seat');return this.keys[seat];}
  recoveryCheckpoint(){if(!this.session)throw new Error('Match not started');return JSON.stringify({version:1,game:'riichi-four-room',keys:this.keys,archive:JSON.parse(this.session.checkpoint())});}
  static restoreCheckpoint(text:string,host:Sender){
    if(typeof text!=='string'||text.length>2020000)throw new Error('Oversized riichi checkpoint');
    const v=JSON.parse(text);
    if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).length!==4||Object.keys(v).some(k=>!['version','game','keys','archive'].includes(k))||v.version!==1||v.game!=='riichi-four-room'||!Array.isArray(v.keys)||v.keys.length!==4||!v.keys.every(validRecoveryKey)||new Set(v.keys).size!==4)throw new Error('Invalid riichi checkpoint');
    const session=RiichiRecoverySession.restore(JSON.stringify(v.archive));
    const room=new RiichiRoomHost(crypto.randomUUID(),host);room.session=session;room.keys=[...v.keys];room.restored=true;return room;
  }
  /** Called only after transport authentication; verify the original private
   * seat projection, not caller-claimed scores or a replacement player's ID. */
  resume(seat:number,key:string,lastView:string,sender:Sender){
    if(!this.restored||this.phase!=='lobby'||!this.session||!Number.isInteger(seat)||seat<1||seat>3||this.senders.has(seat)||!validRecoveryKey(key)||key!==this.keys[seat]||typeof lastView!=='string'||lastView.length>60000)return false;
    try{const seen=JSON.parse(lastView);if(!seen||JSON.stringify(this.session.viewAt(seat,seen.revision))!==lastView)return false;}catch{return false;}
    this.senders.set(seat,sender);this.lobby();return this.senders.has(seat);
  }
  join(seat:number,sender:Sender){
    if(this.restored||this.phase!=='lobby'||!Number.isInteger(seat)||seat<1||seat>3||this.senders.has(seat))return false;
    this.senders.set(seat,sender);this.lobby();return this.senders.has(seat);
  }
  start(){
    if(this.phase!=='lobby'||this.senders.size!==4)return false;
    this.processing=true;
    try{
      if(!this.session)this.session=new RiichiRecoverySession(this.match);
      this.phase=this.session.status==='finished'?'finished':'playing';
      if(this.restored){
        this.session.takeMessages();
        for(let id=0;id<4&&this.status!=='closed';id++){
          const v=this.session.view(id);
          if(v.event)this.send(id,{kind:'event',event:v.event});
          if(v.view)this.send(id,{kind:'state',view:v.view});
          if(v.decision)this.send(id,{kind:'decision',decision:v.decision});
          if(v.summary)this.send(id,{kind:'finished',summary:v.summary});
        }
      }else this.publishMessages();
      this.publishCheckpoints();return this.status!=='closed';
    }finally{this.processing=false;}
  }
  receive(boundSeat:number,input:unknown):boolean {
    if(this.processing||this.phase!=='playing'||!this.session||!this.senders.has(boundSeat)||!input||typeof input!=='object'||Array.isArray(input))return false;
    const msg=input as Partial<RiichiRoomAction>;
    if(Object.keys(msg).some(k=>!['v','game','match','request','revision','choice'].includes(k))||msg.v!==1||msg.game!=='riichi'||msg.match!==this.match||!Number.isSafeInteger(msg.request)||msg.request!<1||!Number.isSafeInteger(msg.revision)||msg.revision!<1||typeof msg.choice!=='string'||msg.choice.length>40)return false;
    if(msg.request!<=this.requests[boundSeat]){
      this.send(boundSeat,{kind:'ack',request:msg.request!,accepted:false});
      this.send(boundSeat,{kind:'checkpoint',snapshot:this.session.view(boundSeat)});
      return false;
    }
    this.requests[boundSeat]=msg.request!;
    this.processing=true;
    try{
      let accepted=false;
      try{this.session.apply(boundSeat,msg.revision!,msg.choice);accepted=true;}catch{
        if(this.session.status==='closed'){this.leave(0);return false;}
      }
      if(accepted){if(this.session.status==='finished')this.phase='finished';this.publishMessages();}
      this.send(boundSeat,{kind:'ack',request:msg.request!,accepted});
      this.publishCheckpoints();return accepted;
    }finally{this.processing=false;}
  }
  leave(seat:number){
    if(!this.senders.has(seat)||this.phase==='closed')return;
    if(this.phase==='lobby'&&seat!==0){this.senders.delete(seat);this.lobby();return;}
    this.phase='closed';
    this.broadcast({kind:'closed',reason:seat===0?'host-left':'player-left',player:seat});
    this.senders.clear();
  }
  private lobby(){this.broadcast({kind:'lobby',connected:[0,1,2,3].map(id=>this.senders.has(id))});}
  private publishMessages(){for(const m of this.session!.takeMessages()){if(this.phase==='closed')break;this.send(m.seat,m.payload);}}
  private publishCheckpoints(){if(!this.session||this.phase==='closed')return;for(const id of this.senders.keys())this.send(id,{kind:'checkpoint',snapshot:this.session.view(id)});}
  private broadcast(payload:RiichiRoomPayload){for(const id of this.senders.keys())this.send(id,payload);}
  private send(id:number,payload:RiichiRoomPayload){
    const sender=this.senders.get(id);if(!sender)return;
    // Every recipient gets a detached value: UI/transport mutation cannot touch
    // rule objects or another recipient. Never broadcast state/event snapshots.
    try{sender(JSON.parse(JSON.stringify({v:1,game:'riichi',match:this.match,recipient:id,sequence:++this.sequence[id],payload})));}
    catch{this.leave(id);}
  }
}
