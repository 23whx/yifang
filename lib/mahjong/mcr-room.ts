import {mcrMatchView} from './mcr-match';
import {McrRecoverySession} from './mcr-recovery';
type McrView=ReturnType<typeof mcrMatchView>;
import {validMcrRequest,type McrRequest} from './mcr-request';
import {validRecoveryKey} from '../recovery-auth';

export type McrRoomPayload = {kind:'lobby';connected:boolean[]} | {kind:'view';view:McrView}
  | {kind:'ack';request:number;accepted:boolean} | {kind:'closed';player:number};
export type McrRoomMessage={v:1;game:'mcr-four';match:string;recipient:number;sequence:number;payload:McrRoomPayload};
export type McrRoomRequest={v:1;game:'mcr-four';match:string;request:number;move:McrRequest};
type Sender=(value:McrRoomMessage)=>void;
const newCredential=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');

/** A player's browser coordinates four trusted humans. No sockets or backend.
 * Transport pins each sender to a seat and reports async send failures via leave. */
export class McrRoom {
  private senders=new Map<number,Sender>();
  private sequences=[0,0,0,0];
  private requests=[0,0,0,0];
  private session:McrRecoverySession|null=null;
  private phase:'lobby'|'playing'|'closed'='lobby';
  private processing=false;
  private keys=[newCredential(),newCredential(),newCredential(),newCredential()];
  private restored=false;
  constructor(readonly match:string,host:Sender) {
    if(!/^[a-zA-Z0-9-]{12,80}$/.test(match))throw new Error('Invalid room identity');
    this.senders.set(0,host);
  }
  get status(){return this.phase;}
  get recoveryIdentity(){return this.session?.identity??this.match;}
  /** Host-only: deliver just one seat's credential on its bound private channel. */
  recoveryCredential(seat:number){if(!Number.isInteger(seat)||seat<0||seat>3)throw new Error('Invalid recovery seat');return this.keys[seat];}
  /** All secrets and deterministic wall history: never send to a guest. */
  recoveryCheckpoint(){if(!this.session)throw new Error('Match not started');return JSON.stringify({version:1,game:'mcr-four-room',keys:this.keys,archive:JSON.parse(this.session.checkpoint())});}
  static restoreCheckpoint(text:string,host:Sender){
    if(typeof text!=='string'||text.length>2020000)throw new Error('Invalid MCR checkpoint');
    const raw=JSON.parse(text);
    if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).length!==4||Object.keys(raw).some(k=>!['version','game','keys','archive'].includes(k))||raw.version!==1||raw.game!=='mcr-four-room'||!Array.isArray(raw.keys)||raw.keys.length!==4||!raw.keys.every(validRecoveryKey)||new Set(raw.keys).size!==4)throw new Error('Invalid MCR checkpoint');
    const session=McrRecoverySession.restore(JSON.stringify(raw.archive));
    const room=new McrRoom(crypto.randomUUID(),host);room.session=session;room.keys=[...raw.keys];room.restored=true;return room;
  }
  /** Transport must authenticate before calling. Only the exact original
   * seat projection at an observed history prefix can rejoin this frozen room. */
  resume(seat:number,key:string,lastView:string,sender:Sender){
    if(!this.restored||this.phase!=='lobby'||!this.session||!Number.isInteger(seat)||seat<1||seat>3||this.senders.has(seat)||!validRecoveryKey(key)||key!==this.keys[seat]||typeof lastView!=='string'||lastView.length>60000)return false;
    try{const seen=JSON.parse(lastView);if(!seen||JSON.stringify(this.session.viewAt(seat,seen.revision))!==lastView)return false;}catch{return false;}
    this.sequences[seat]=0;this.senders.set(seat,sender);this.lobby();return this.senders.has(seat);
  }
  /** Host-private seed and all actions. Never include in messages or views. */
  recoveryArchive(){if(!this.session)throw new Error('Match not started');return this.session.checkpoint();}
  join(seat:number,sender:Sender) {
    if(this.restored||this.phase!=='lobby'||!Number.isInteger(seat)||seat<1||seat>3||this.senders.has(seat))return false;
    this.sequences[seat]=0;this.senders.set(seat,sender);this.lobby();return this.senders.has(seat);
  }
  start(seed?:number) {
    if(this.phase!=='lobby'||this.senders.size!==4)return false;
    if(this.restored){if(seed!==undefined)return false;}
    else this.session=new McrRecoverySession(this.match,seed??crypto.getRandomValues(new Uint32Array(1))[0]);
    this.phase='playing';
    this.processing=true;try{this.publish();}finally{this.processing=false;}
    return this.phase==='playing';
  }
  receive(seat:number,raw:unknown) {
    if(this.processing||this.phase!=='playing'||!this.session||!this.senders.has(seat)||!raw||typeof raw!=='object'||Array.isArray(raw))return false;
    const r=raw as Partial<McrRoomRequest>;
    if(Object.keys(r).some(k=>!['v','game','match','request','move'].includes(k))||r.v!==1||r.game!=='mcr-four'||r.match!==this.match||!Number.isSafeInteger(r.request)||r.request!<1||!validMcrRequest(r.move))return false;
    this.processing=true;
    try {
      let accepted=false;
      if(r.request!>this.requests[seat]) {
        this.requests[seat]=r.request!;
        try{this.session.apply(seat,r.move);accepted=true;}catch{/* Refused moves never change rule state or journal. */}
      }
      this.send(seat,{kind:'ack',request:r.request!,accepted});
      if(this.phase==='playing')this.publish();
      return accepted;
    } finally {this.processing=false;}
  }
  leave(seat:number) {
    if(this.phase==='closed'||!this.senders.has(seat))return;
    if(this.phase==='lobby'&&seat!==0){this.senders.delete(seat);this.lobby();return;}
    this.phase='closed';
    for(const id of [...this.senders.keys()])this.send(id,{kind:'closed',player:seat});
    this.senders.clear();
    // Keep the last state untouched: departure is not a fold or a chip award.
  }
  private lobby(){for(const id of [...this.senders.keys()])this.send(id,{kind:'lobby',connected:[0,1,2,3].map(i=>this.senders.has(i))});}
  private publish() {
    if(!this.session)return;
    for(const id of [...this.senders.keys()]) {
      if(this.phase!=='playing')break;
      this.send(id,{kind:'view',view:this.session.view(id)});
    }
  }
  private send(id:number,payload:McrRoomPayload) {
    const sender=this.senders.get(id);if(!sender)return;
    try{sender(JSON.parse(JSON.stringify({v:1,game:'mcr-four',match:this.match,recipient:id,sequence:++this.sequences[id],payload})));}
    catch{this.leave(id);}
  }
}
