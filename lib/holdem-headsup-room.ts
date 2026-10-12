import type {PokerView} from './holdem-remote';
import {HeadsUpPokerRecovery} from './holdem-headsup-recovery';
import {shuffle} from './holdem';
import { validPokerRequest, type PokerRequest } from './holdem-remote';
import {validRecoveryKey} from './recovery-auth';

export type HeadsUpRoomPayload = {kind:'lobby';connected:boolean[]} | {kind:'view';view:PokerView}
  | {kind:'ack';request:number;accepted:boolean} | {kind:'closed';player:number};
export type HeadsUpRoomMessage={v:1;game:'holdem-two';match:string;recipient:number;sequence:number;payload:HeadsUpRoomPayload};
export type HeadsUpRoomRequest={v:1;game:'holdem-two';match:string;request:number;move:PokerRequest};
type Sender=(value:HeadsUpRoomMessage)=>void;
const newCredential=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');

/** A player's browser coordinates two trusted humans. No sockets or backend.
 * Transport pins each sender to a seat and reports async send failures via leave. */
export class HeadsUpPokerRoom {
  private senders=new Map<number,Sender>();
  private sequences=[0,0];
  private requests=[0,0];
  private session:HeadsUpPokerRecovery|null=null;
  private phase:'lobby'|'playing'|'closed'='lobby';
  private processing=false;
  private keys=[newCredential(),newCredential()];
  private restored=false;
  constructor(readonly match:string,host:Sender) {
    if(!/^[a-zA-Z0-9-]{12,80}$/.test(match))throw new Error('Invalid room identity');
    this.senders.set(0,host);
  }
  get status(){return this.phase;}
  get recoveryIdentity(){return this.session?.identity??this.match;}
  /** Only deliver the selected seat's credential on its bound private channel. */
  recoveryCredential(seat:number){if(!Number.isInteger(seat)||seat<0||seat>1)throw new Error('Invalid recovery seat');return this.keys[seat];}
  /** Host-private: all credentials and hidden cards. Never send to guests. */
  recoveryCheckpoint(){if(!this.session)throw new Error('Match not started');return JSON.stringify({version:1,game:'holdem-two-room',keys:this.keys,archive:JSON.parse(this.session.checkpoint())});}
  static restoreCheckpoint(text:string,host:Sender){
    if(typeof text!=='string'||text.length>2020000)throw new Error('Invalid poker room checkpoint');
    const raw=JSON.parse(text);
    if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).length!==4||Object.keys(raw).some(k=>!['version','game','keys','archive'].includes(k))||raw.version!==1||raw.game!=='holdem-two-room'||!Array.isArray(raw.keys)||raw.keys.length!==2||!raw.keys.every(validRecoveryKey)||new Set(raw.keys).size!==2)throw new Error('Invalid poker room checkpoint');
    const session=HeadsUpPokerRecovery.restore(JSON.stringify(raw.archive));
    const room=new HeadsUpPokerRoom(crypto.randomUUID(),host);room.session=session;room.keys=[...raw.keys];room.restored=true;return room;
  }
  /** Called by authenticated transport only. A seat must retain its credential
   * and exact locally observed prefix, not just a claimed revision/balance. */
  resume(seat:number,key:string,lastView:string,sender:Sender){
    if(!this.restored||this.phase!=='lobby'||!this.session||!Number.isInteger(seat)||seat<1||seat>1||this.senders.has(seat)||!validRecoveryKey(key)||key!==this.keys[seat]||typeof lastView!=='string'||lastView.length>65536)return false;
    try{const seen=JSON.parse(lastView);if(!seen||JSON.stringify(this.session.viewAt(seat as 0|1,seen.revision))!==lastView)return false;}catch{return false;}
    this.sequences[seat]=0;this.senders.set(seat,sender);this.lobby();return this.senders.has(seat);
  }
  /** Host-private: full decks. Never include in send/payload or guest exports. */
  recoveryArchive(){if(!this.session)throw new Error('Match not started');return this.session.checkpoint();}
  join(seat:number,sender:Sender) {
    if(this.restored||this.phase!=='lobby'||!Number.isInteger(seat)||seat<1||seat>1||this.senders.has(seat))return false;
    this.sequences[seat]=0;this.senders.set(seat,sender);this.lobby();return this.senders.has(seat);
  }
  start(deck?:number[]) {
    if(this.phase!=='lobby'||this.senders.size!==2)return false;
    if(this.restored){if(deck!==undefined)return false;}
    else this.session=new HeadsUpPokerRecovery(this.match,deck??shuffle());
    this.phase='playing';
    this.processing=true;try{this.publish();}finally{this.processing=false;}
    return this.phase==='playing';
  }
  receive(seat:number,raw:unknown,deck?:number[]) {
    if(this.processing||this.phase!=='playing'||!this.session||!this.senders.has(seat)||!raw||typeof raw!=='object'||Array.isArray(raw))return false;
    const r=raw as Partial<HeadsUpRoomRequest>;
    if(r.v!==1||r.game!=='holdem-two'||r.match!==this.match||!Number.isSafeInteger(r.request)||r.request!<1||!validPokerRequest(r.move))return false;
    this.processing=true;
    try {
      let accepted=false;
      if(r.request!>this.requests[seat]) {
        this.requests[seat]=r.request!;
        try{
          const view=this.session.view(seat as 0|1),move=r.move;
          if(move.hand!==view.hand||move.revision!==view.revision)throw new Error('Stale request');
          // A repeat consent is idempotent, not another journal entry.
          if(move.action.kind==='next'&&view.over&&view.stacks[seat]>0&&view.stacks.filter(n=>n>0).length>=2&&view.next[seat])accepted=true;
          else{
            const startsHand=move.action.kind==='next'&&view.over&&view.stacks[seat]>0&&view.stacks.filter(n=>n>0).length>=2&&view.next.every((yes,i)=>yes||i===seat||view.stacks[i]===0);
            this.session.apply(seat,move,startsHand?(deck??shuffle()):undefined);accepted=true;
          }
        }catch{/* Refused moves never change rule state or private journal. */}
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
  private lobby(){for(const id of [...this.senders.keys()])this.send(id,{kind:'lobby',connected:[0,1].map(i=>this.senders.has(i))});}
  private publish() {
    if(!this.session)return;
    for(const id of [...this.senders.keys()]) {
      if(this.phase!=='playing')break;
      this.send(id,{kind:'view',view:this.session.view(id as 0|1)});
    }
  }
  private send(id:number,payload:HeadsUpRoomPayload) {
    const sender=this.senders.get(id);if(!sender)return;
    try{sender(JSON.parse(JSON.stringify({v:1,game:'holdem-two',match:this.match,recipient:id,sequence:++this.sequences[id],payload})));}
    catch{this.leave(id);}
  }
}
