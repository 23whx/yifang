import type {Ffish,FfishBoard} from './ffish';
import {isBoardGame,type BoardGame} from './variants';
import {newMatch,changeMatch,type MatchState} from './remote-match';

export type BoardRecoveryAction={kind:'move';uci:string}|{kind:'resign'|'rematch'};
export type BoardRecoveryEvent={seat:0|1;round:number;revision:number;action:BoardRecoveryAction};
type Archive={version:1;game:BoardGame;identity:string;events:BoardRecoveryEvent[]};
const MAX_EVENTS=10000,MAX_TEXT=1500000;
function record(value:unknown,keys:string[]):value is Record<string,unknown>{
 return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&Object.keys(value).every(k=>keys.includes(k));
}
function validEvent(value:unknown):value is BoardRecoveryEvent{
 if(!record(value,['seat','round','revision','action'])||(value.seat!==0&&value.seat!==1)||!Number.isSafeInteger(value.round)||Number(value.round)<1||!Number.isSafeInteger(value.revision)||Number(value.revision)<0)return false;
 const a=value.action;
 return record(a,['kind','uci'])&&a.kind==='move'&&typeof a.uci==='string'&&/^[a-zA-Z0-9@+]{4,10}$/.test(a.uci)||
  record(a,['kind'])&&(a.kind==='resign'||a.kind==='rematch');
}

/** Public-information board games replay from the standard initial position.
 * Never import a claimed FEN/result or reset from FEN: move history is needed
 * for repetition, castling, en passant and shogi hands. This is rule validation,
 * NOT peer authentication. A transport must bind seats and verify both saves.
 * Owns a WASM board; callers must dispose it when replaced/unmounted.
 */
export class BoardRecoverySession {
 private board:FfishBoard;
 private match:MatchState=newMatch();
 private archive:Archive;
 private disposed=false;
 constructor(private rules:Ffish,game:BoardGame,identity:string){
  if(!isBoardGame(game)||typeof identity!=='string'||!/^[a-zA-Z0-9-]{12,80}$/.test(identity))throw new Error('Invalid board recovery identity');
  this.archive={version:1,game,identity,events:[]};this.board=new rules.Board(game);
 }
 private live(){if(this.disposed)throw new Error('Disposed board recovery');}
 view(){
  this.live();const over=this.board.isGameOver();
  return {game:this.archive.game,identity:this.archive.identity,revision:this.archive.events.length,
   match:{...this.match,rematch:[...this.match.rematch] as [boolean,boolean]},fen:this.board.fen(),moves:this.board.moveStack(),
   legal:this.board.legalMoves().trim().split(/\s+/).filter(Boolean),turn:this.board.turn(),
   ended:over||this.match.resigned!==null,result:this.match.resigned===null?this.board.result():this.match.resigned===0?'0-1':'1-0'};
 }
 apply(event:BoardRecoveryEvent){
  this.live();if(!validEvent(event)||event.revision!==this.archive.events.length||event.round!==this.match.round||this.archive.events.length>=MAX_EVENTS)throw new Error('Invalid board recovery event');
  // Canonical field order makes equivalent JSON produce the same recovery
  // transcript; never retain caller-owned action objects.
  const copy:BoardRecoveryEvent={seat:event.seat,round:event.round,revision:event.revision,
   action:event.action.kind==='move'?{kind:'move',uci:event.action.uci}:{kind:event.action.kind}};
  const ended=this.match.resigned!==null||this.board.isGameOver();
  if(copy.action.kind==='move'){
   if(ended||this.board.turn()!==(copy.seat===0)||!this.board.legalMoves().split(/\s+/).includes(copy.action.uci))throw new Error('Illegal recovered move');
   if(!this.board.push(copy.action.uci))throw new Error('Recovered move refused');
  }else{
   if(copy.action.kind==='resign'&&ended||copy.action.kind==='rematch'&&(!ended||this.match.rematch[copy.seat]))throw new Error('Invalid match transition');
   const next=changeMatch(this.match,copy.seat,copy.action.kind,ended);
   if(next.round!==this.match.round){const replacement=new this.rules.Board(this.archive.game);this.board.delete();this.board=replacement;}
   this.match=next;
  }
  this.archive.events.push(copy);
 }
 checkpoint(){this.live();return JSON.stringify(this.archive);}
 dispose(){if(this.disposed)return;this.disposed=true;this.board.delete();}
 static restore(rules:Ffish,text:string,expectedGame:BoardGame){
  if(typeof text!=='string'||text.length>MAX_TEXT)throw new Error('Invalid board checkpoint');
  const raw:unknown=JSON.parse(text);
  if(!record(raw,['version','game','identity','events'])||raw.version!==1||raw.game!==expectedGame||typeof raw.game!=='string'||!isBoardGame(raw.game)||typeof raw.identity!=='string'||!Array.isArray(raw.events)||raw.events.length>MAX_EVENTS)throw new Error('Invalid board checkpoint');
  const session=new BoardRecoverySession(rules,raw.game,raw.identity);
  try{for(const event of raw.events)session.apply(event as BoardRecoveryEvent);return session;}
  catch(error){session.dispose();throw error;}
 }
}
