import {newGo,playGo,scoreGo,type GoState} from './rules';
import {newReview,changeReview,reviewDone,type Review,type ReviewAction} from './review';
import {newMatch,changeMatch,type MatchState} from '../board/remote-match';

export type GoRecoveryAction={kind:'move';point:number|null}|{kind:'review';proposal:number;action:ReviewAction}|{kind:'resign'|'rematch'};
export type GoRecoveryEvent={seat:0|1;round:number;revision:number;action:GoRecoveryAction};
type Archive={version:1;game:'go';identity:string;events:GoRecoveryEvent[]};
const MAX_EVENTS=10000,MAX_TEXT=1500000;
function record(v:unknown,keys:string[]):v is Record<string,unknown>{return !!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&Object.keys(v).every(k=>keys.includes(k));}
function validAction(a:unknown):a is GoRecoveryAction{
 if(record(a,['kind','point'])&&a.kind==='move')return a.point===null||Number.isInteger(a.point)&&Number(a.point)>=0&&Number(a.point)<81;
 if(record(a,['kind']))return a.kind==='resign'||a.kind==='rematch';
 if(!record(a,['kind','proposal','action'])||a.kind!=='review'||!Number.isSafeInteger(a.proposal)||Number(a.proposal)<0)return false;
 return record(a.action,['kind'])&&(a.action.kind==='confirm'||a.action.kind==='resume')||record(a.action,['kind','point'])&&a.action.kind==='toggle'&&Number.isInteger(a.action.point)&&Number(a.action.point)>=0&&Number(a.action.point)<81;
}
/** Fixed current table: 9x9, positional superko, area score, White 7.5 komi.
 * Replays public actions, never a supplied board/history/score. Authentication
 * and agreement of the two original peers are separate transport duties.
 */
export class GoRecoverySession{
 private board:GoState=newGo();
 private review:Review=newReview();
 private match:MatchState=newMatch();
 private archive:Archive;
 constructor(identity:string){
  if(typeof identity!=='string'||!/^[a-zA-Z0-9-]{12,80}$/.test(identity))throw new Error('Invalid Go recovery identity');
  this.archive={version:1,game:'go',identity,events:[]};
 }
 view(){
  const ended=this.match.resigned!==null||reviewDone(this.review);
  const score=scoreGo(this.board,this.review.dead);
  return structuredClone({game:'go' as const,identity:this.archive.identity,revision:this.archive.events.length,board:this.board,review:this.review,match:this.match,ended,score,
   result:!ended?'*':this.match.resigned!==null?(this.match.resigned===0?'0-1':'1-0'):score.black>score.white?'1-0':'0-1'});
 }
 apply(value:GoRecoveryEvent){
  if(!record(value,['seat','round','revision','action'])||(value.seat!==0&&value.seat!==1)||value.round!==this.match.round||value.revision!==this.archive.events.length||this.archive.events.length>=MAX_EVENTS||!validAction(value.action))throw new Error('Invalid Go recovery event');
  const a=value.action;
  // Canonical objects make equivalent JSON produce identical transcripts.
  const action:GoRecoveryAction=a.kind==='move'?{kind:'move',point:a.point}:a.kind==='review'?{kind:'review',proposal:a.proposal,action:a.action.kind==='toggle'?{kind:'toggle',point:a.action.point}:{kind:a.action.kind}}:{kind:a.kind};
  const ended=this.match.resigned!==null||reviewDone(this.review);
  if(action.kind==='move'){
   if(ended||this.board.turn!==value.seat+1)throw new Error('Wrong Go move phase or seat');
   const next=playGo(this.board,action.point);
   if(!next.state)throw new Error('Illegal recovered Go move');
   this.board=next.state;if(this.board.passes>=2)this.review=newReview();
  }else if(action.kind==='review'){
   if(ended)throw new Error('Closed Go review');
   const next=changeReview(this.board,this.review,value.seat,action.action,action.proposal);
   this.review=next;if(next.resumed)this.board={...this.board,passes:0};
  }else{
   if(action.kind==='resign'&&ended||action.kind==='rematch'&&(!ended||this.match.rematch[value.seat]))throw new Error('Invalid Go match transition');
   const next=changeMatch(this.match,value.seat,action.kind,ended);
   if(next.round!==this.match.round){this.board=newGo();this.review=newReview();}
   this.match=next;
  }
  this.archive.events.push({seat:value.seat,round:value.round,revision:value.revision,action});
 }
 checkpoint(){return JSON.stringify(this.archive);}
 static restore(text:string){
  if(typeof text!=='string'||text.length>MAX_TEXT)throw new Error('Invalid Go checkpoint');
  const raw:unknown=JSON.parse(text);
  if(!record(raw,['version','game','identity','events'])||raw.version!==1||raw.game!=='go'||typeof raw.identity!=='string'||!Array.isArray(raw.events)||raw.events.length>MAX_EVENTS)throw new Error('Invalid Go checkpoint');
  const session=new GoRecoverySession(raw.identity);for(const e of raw.events)session.apply(e as GoRecoveryEvent);return session;
 }
}
