import {newMcrMatch,actMcrMatch,mcrMatchView,type McrMatch} from './mcr-match';
import {validMcrRequest,type McrRequest} from './mcr-request';

type Archive={version:1;game:'mcr-four';preset:'fixed-seat-four-winds-v1';identity:string;seed:number;actions:{seat:number;move:McrRequest}[]};
const MAX_ACTIONS=20000,MAX_TEXT=2000000;
const object=(v:unknown,keys:string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&Object.keys(v).every(k=>keys.includes(k));
const seat=(v:unknown):v is number=>Number.isInteger(v)&&Number(v)>=0&&Number(v)<4;
/** HOST PRIVATE: the initial seed determines every hidden wall in the match.
 * Never send this archive to guests, include it in invitations or expose it in
 * player views. Replaying validates legal history, not the host's honesty.
 * The version binds the deterministic rules/preset; incompatible rules require
 * migration or rejection, never importing claimed balances or settlements.
 */
export class McrRecoverySession{
 private session:McrMatch;
 private archive:Archive;
 constructor(identity:string,seed:number){
  if(typeof identity!=='string'||!/^[a-zA-Z0-9-]{12,80}$/.test(identity))throw new Error('Invalid MCR identity');
  this.session=newMcrMatch(seed);
  this.archive={version:1,game:'mcr-four',preset:'fixed-seat-four-winds-v1',identity,seed,actions:[]};
 }
 get identity(){return this.archive.identity;}
 view(id:number){return mcrMatchView(this.session,id);}
 viewAt(id:number,revision:number){
  if(!seat(id)||!Number.isSafeInteger(revision)||revision<0||revision>this.archive.actions.length)throw new Error('Unknown MCR revision');
  return McrRecoverySession.restore(JSON.stringify({...this.archive,actions:this.archive.actions.slice(0,revision)})).view(id);
 }
 apply(id:number,move:McrRequest){
  if(!seat(id)||!validMcrRequest(move)||this.archive.actions.length>=MAX_ACTIONS)throw new Error('Invalid MCR recovery action');
  const copy={revision:move.revision,choice:move.choice};
  const next=actMcrMatch(this.session,id,copy.revision,copy.choice);
  if(next.revision!==this.session.revision+1)throw new Error('Non-advancing MCR action');
  this.session=next;this.archive.actions.push({seat:id,move:copy});
 }
 checkpoint(){return JSON.stringify(this.archive);}
 static restore(text:string){
  if(typeof text!=='string'||text.length>MAX_TEXT)throw new Error('Oversized MCR archive');
  const v:unknown=JSON.parse(text);
  if(!object(v,['version','game','preset','identity','seed','actions'])||v.version!==1||v.game!=='mcr-four'||v.preset!=='fixed-seat-four-winds-v1'||typeof v.identity!=='string'||typeof v.seed!=='number'||!Array.isArray(v.actions)||v.actions.length>MAX_ACTIONS)throw new Error('Invalid MCR archive');
  const log=new McrRecoverySession(v.identity,v.seed);
  for(const entry of v.actions){
   if(!object(entry,['seat','move'])||!seat(entry.seat)||!validMcrRequest(entry.move))throw new Error('Invalid MCR archive action');
   log.apply(entry.seat,entry.move);
  }
  return log;
 }
}
