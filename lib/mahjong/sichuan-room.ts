import {newSichuanSession,applySichuanSession,sichuanSessionView,type SichuanSession} from './sichuan-session';
import {shuffledSichuanDeck} from './sichuan-teaching';
type SichuanView=ReturnType<typeof sichuanSessionView>;
import {validSichuanRequest,type SichuanRequest} from './sichuan-request';
import {newSichuanRecovery,appendSichuanRecovery,restoreSichuanRecovery,type SichuanRecovery} from './sichuan-recovery';

export type SichuanRoomPayload = {kind:'lobby';connected:boolean[]} | {kind:'view';view:SichuanView}
  | {kind:'ack';request:number;accepted:boolean} | {kind:'closed';player:number};
export type SichuanRoomMessage={v:1;game:'sichuan-four';match:string;recipient:number;sequence:number;payload:SichuanRoomPayload};
export type SichuanRoomRequest={v:1;game:'sichuan-four';match:string;request:number;move:SichuanRequest};
type Sender=(value:SichuanRoomMessage)=>void;
const newCredential=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
const credential=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);

/** A player's browser coordinates four trusted humans. No sockets or backend.
 * Transport pins each sender to a seat and reports async send failures via leave. */
export class SichuanRoom {
  private senders=new Map<number,Sender>();
  private sequences=[0,0,0,0];
  private requests=[0,0,0,0];
  private session:SichuanSession|null=null;
  private phase:'lobby'|'playing'|'closed'='lobby';
  private processing=false;
  private recovery:SichuanRecovery|null=null;
  private recoveryKeys=[newCredential(),newCredential(),newCredential(),newCredential()];
  private restored=false;
  private recoveryMatch:string;
  constructor(readonly match:string,host:Sender) {
    if(!/^[a-zA-Z0-9-]{12,80}$/.test(match))throw new Error('Invalid room identity');
    this.senders.set(0,host);
    this.recoveryMatch=match;
  }
  get status(){return this.phase;}
  get recoveryIdentity(){return this.recoveryMatch;}
  /** Host-only checkpoint for the recovery adapter. NEVER send to a guest. */
  recoveryArchive(){return this.recovery?JSON.stringify(this.recovery):null;}
  /** Only deliver one key over the already bound seat's private channel. */
  recoveryCredential(id:number){
    if(!Number.isInteger(id)||id<0||id>3)throw new Error('Invalid recovery seat');
    return this.recoveryKeys[id];
  }
  /** Host-private bundle. Keys and original wall must never be broadcast. */
  recoveryCheckpoint(){return this.recovery?JSON.stringify({version:1,game:'sichuan-room',previousMatch:this.recoveryMatch,keys:this.recoveryKeys,archive:this.recovery}):null;}
  static restoreCheckpoint(text:string,host:Sender){
    if(typeof text!=='string'||text.length>520_000)throw new Error('Invalid room checkpoint');
    const raw=JSON.parse(text);
    if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>!['version','game','previousMatch','keys','archive'].includes(k))||raw.version!==1||raw.game!=='sichuan-room'||
      typeof raw.previousMatch!=='string'||!/^[a-zA-Z0-9-]{12,80}$/.test(raw.previousMatch)||!Array.isArray(raw.keys)||raw.keys.length!==4||!raw.keys.every(credential)||new Set(raw.keys).size!==4)throw new Error('Invalid room checkpoint');
    const {archive,session}=restoreSichuanRecovery(JSON.stringify(raw.archive));
    // A fresh epoch invalidates delayed requests from every previous transport.
    const room=new SichuanRoom(crypto.randomUUID(),host);
    room.recovery=archive;room.session=session;room.recoveryKeys=[...raw.keys];room.restored=true;room.recoveryMatch=raw.previousMatch;
    return room;
  }
  /** Authenticate before joining a restored room; no private view on failure.
   * The guest supplies its last locally observed view. A host checkpoint must
   * contain that exact history prefix, not merely an equal numeric revision.
   */
  resume(id:number,key:string,lastView:string,sender:Sender){
    if(!this.restored||this.phase!=='lobby'||!this.recovery||!Number.isInteger(id)||id<1||id>3||this.senders.has(id)||
      !credential(key)||key!==this.recoveryKeys[id]||typeof lastView!=='string'||lastView.length>65536)return false;
    try{
      const seen=JSON.parse(lastView);
      if(!seen||!Number.isSafeInteger(seen.revision)||seen.revision<0||seen.revision>this.recovery.actions.length)return false;
      const prefix={...this.recovery,actions:this.recovery.actions.slice(0,seen.revision)};
      const {session}=restoreSichuanRecovery(JSON.stringify(prefix));
      if(JSON.stringify(sichuanSessionView(session,id))!==lastView)return false;
    }catch{return false;}
    this.sequences[id]=0;this.senders.set(id,sender);this.lobby();return this.senders.has(id);
  }
  join(seat:number,sender:Sender) {
    if(this.restored||this.phase!=='lobby'||!Number.isInteger(seat)||seat<1||seat>3||this.senders.has(seat))return false;
    this.sequences[seat]=0;this.senders.set(seat,sender);this.lobby();return this.senders.has(seat);
  }
  start(deck?:number[]) {
    if(this.phase!=='lobby'||this.senders.size!==4)return false;
    if(this.restored){if(deck!==undefined)return false;}
    else {
      const initial=deck??shuffledSichuanDeck();
      this.session=newSichuanSession(initial);this.recovery=newSichuanRecovery(initial);
    }
    this.phase='playing';
    this.processing=true;try{this.publish();}finally{this.processing=false;}
    return this.phase==='playing';
  }
  receive(seat:number,raw:unknown) {
    if(this.processing||this.phase!=='playing'||!this.session||!this.senders.has(seat)||!raw||typeof raw!=='object'||Array.isArray(raw))return false;
    const r=raw as Partial<SichuanRoomRequest>;
    if(r.v!==1||r.game!=='sichuan-four'||r.match!==this.match||!Number.isSafeInteger(r.request)||r.request!<1||!validSichuanRequest(r.move))return false;
    this.processing=true;
    try {
      let accepted=false;
      if(r.request!>this.requests[seat]) {
        this.requests[seat]=r.request!;
        try{
          const next=applySichuanSession(this.session,seat,r.move.revision,r.move.action);
          const recovery=appendSichuanRecovery(this.recovery!,seat,r.move);
          this.session=next;this.recovery=recovery;accepted=true;
        }catch{/* Refused moves never change rule state or recovery history. */}
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
      this.send(id,{kind:'view',view:sichuanSessionView(this.session,id)});
    }
  }
  private send(id:number,payload:SichuanRoomPayload) {
    const sender=this.senders.get(id);if(!sender)return;
    try{sender(JSON.parse(JSON.stringify({v:1,game:'sichuan-four',match:this.match,recipient:id,sequence:++this.sequences[id],payload})));}
    catch{this.leave(id);}
  }
}
