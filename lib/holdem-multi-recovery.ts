import {newMultiSession,applyMultiRequest,multiView,type MultiSession} from './holdem-multi-session';
import {validPokerRequest,type PokerRequest} from './holdem-remote';

type Entry={seat:number;move:PokerRequest;deck?:number[]};
type Archive={version:1;game:'holdem-four';identity:string;deck:number[];actions:Entry[]};
const MAX_ACTIONS=10000,MAX_TEXT=2000000;
function object(v:unknown,keys:string[]):v is Record<string,unknown>{return !!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&Object.keys(v).every(k=>keys.includes(k));}
function validDeck(v:unknown):v is number[]{return Array.isArray(v)&&v.length===52&&new Set(v).size===52&&v.every(c=>Number.isInteger(c)&&c>=0&&c<52);}
function strictMove(v:unknown):v is PokerRequest{
 if(!object(v,['hand','revision','action'])||!validPokerRequest(v))return false;
 return object(v.action,v.action.kind==='raise'?['kind','to']:['kind']);
}
/** HOST PRIVATE. Decks reveal all seats and must never enter guest messages,
 * views, URLs or invitations. Fixed four-seat 200-chip setup; balances, awards,
 * side pots and next-hand votes are recomputed. Valid replay is not peer auth.
 */
export class MultiPokerRecovery{
 private session:MultiSession;
 private archive:Archive;
 constructor(identity:string,deck:number[]){
  if(typeof identity!=='string'||!/^[a-zA-Z0-9-]{12,80}$/.test(identity)||!validDeck(deck))throw new Error('Invalid poker recovery setup');
  this.archive={version:1,game:'holdem-four',identity,deck:[...deck],actions:[]};
  this.session=newMultiSession([200,200,200,200],0,deck);
 }
 view(seat:number){return multiView(this.session,seat);}
 viewAt(seat:number,revision:number){
  if(!Number.isSafeInteger(revision)||revision<0||revision>this.archive.actions.length)throw new Error('Unknown poker revision');
  return MultiPokerRecovery.restore(JSON.stringify({...this.archive,actions:this.archive.actions.slice(0,revision)})).view(seat);
 }
 get identity(){return this.archive.identity;}
 /** Require a fresh full deck only on the final eligible next-hand vote.
  * Restore never falls back to randomness or imports already-settled chips. */
 apply(seat:number,move:PokerRequest,deck?:number[]){
  if(!Number.isInteger(seat)||seat<0||seat>3||!strictMove(move)||this.archive.actions.length>=MAX_ACTIONS)throw new Error('Invalid poker recovery action');
  const s=this.session;
  const startsHand=move.action.kind==='next'&&s.table.over&&!s.next[seat]&&s.table.stacks[seat]>0&&s.table.stacks.filter(n=>n>0).length>=2&&s.next.every((yes,i)=>yes||i===seat||s.table.stacks[i]===0);
  if(startsHand?!validDeck(deck):deck!==undefined)throw new Error('Missing or unexpected recovery deck');
  if(move.action.kind==='next'&&s.next[seat])throw new Error('Duplicate next-hand vote');
  const action:PokerRequest['action']=move.action.kind==='raise'?{kind:'raise',to:move.action.to}:{kind:move.action.kind};
  const copy:PokerRequest={hand:move.hand,revision:move.revision,action};
  const next=applyMultiRequest(s,seat,copy,deck);
  if(next.revision!==s.revision+1)throw new Error('Non-advancing recovery action');
  this.session=next;this.archive.actions.push({seat,move:copy,...(deck?{deck:[...deck]}:{})});
 }
 checkpoint(){return JSON.stringify(this.archive);}
 static restore(text:string){
  if(typeof text!=='string'||text.length>MAX_TEXT)throw new Error('Oversized poker archive');
  const v:unknown=JSON.parse(text);
  if(!object(v,['version','game','identity','deck','actions'])||v.version!==1||v.game!=='holdem-four'||typeof v.identity!=='string'||!validDeck(v.deck)||!Array.isArray(v.actions)||v.actions.length>MAX_ACTIONS)throw new Error('Invalid poker archive');
  const log=new MultiPokerRecovery(v.identity,v.deck);
  for(const entry of v.actions){
   if(!entry||!object(entry,'deck' in Object(entry)?['seat','move','deck']:['seat','move'])||typeof entry.seat!=='number'||!strictMove(entry.move)||('deck' in entry&&!validDeck(entry.deck)))throw new Error('Invalid poker archive entry');
   log.apply(entry.seat,entry.move,entry.deck as number[]|undefined);
  }
  return log;
 }
}
