import {newMcrSession,actMcrSession,mcrSessionView,closeMcrSession,type McrSession} from './mcr-session';
import {newMcrLedger,settleMcrHand,type McrLedger,type McrResult} from './mcr-settlement';
export type McrMatch={revision:number;hand:number;nextSeed:number;session:McrSession;ledger:McrLedger};
const ids=['seat-1','seat-2','seat-3','seat-4'];
const winds=['E','S','W','N'] as const;
/** A finished hand is not a finished match: the final four confirmations matter. */
export function mcrRemotePhase(view: {complete:boolean}): 'playing'|'finished' {
  return view.complete ? 'finished' : 'playing';
}
// Private deterministic seed stream; never include it in a player view.
const stepSeed=(seed:number)=>(Math.imul(seed,1664525)+1013904223)>>>0;
export function newMcrMatch(seed:number):McrMatch{return {revision:0,hand:0,nextSeed:stepSeed(seed),session:newMcrSession(seed),ledger:newMcrLedger()};}
/** Fixed-seat online four-winds preset: dealer advances every hand, including a
 * dealer win or a draw. No physical tournament seat-swap ceremony is simulated.
 * The fourth acknowledgement enables Next but never silently deals new tiles. */
export function mcrMatchView(s:McrMatch,id:number){
  const v=mcrSessionView(s.session,id),confirmed=s.session.confirmed.every(Boolean);
  return {...v,revision:s.revision,hand:s.hand+1,balances:[...s.ledger.balances],
    history:s.ledger.hands.map(h=>({id:h.id,result:structuredClone(h.result),settlement:structuredClone(h.settlement)})),
    complete:s.hand===15&&s.session.round.phase==='finished'&&confirmed,
    canNext:!s.session.closed&&s.hand<15&&s.session.round.phase==='finished'&&confirmed};
}
export function actMcrMatch(s:McrMatch,id:number,revision:number,choice:number|'confirm'|'next'):McrMatch{
  if(revision!==s.revision||s.session.closed)throw new Error('Closed or stale match');
  const v=mcrMatchView(s,id); // Also validates the sender seat.
  if(choice==='next'){
    if(!v.canNext)throw new Error('All four must confirm before next hand');
    const hand=s.hand+1;
    return {...s,revision:s.revision+1,hand,nextSeed:stepSeed(s.nextSeed),session:newMcrSession(s.nextSeed,hand%4,winds[Math.floor(hand/4)])};
  }
  const session=actMcrSession(s.session,id,s.session.revision,choice);
  let ledger=s.ledger;
  if(s.session.round.phase!=='finished'&&session.round.phase==='finished'){
    const win=session.round.winResult;
    const result:McrResult=win?{kind:'win',winner:ids.indexOf(win.winnerId),from:ids.indexOf(win.discarderId??win.winnerId),selfDraw:win.winMethod==='self-draw',nonFlowerPoints:win.analysis.nonFlowerTotal,
      flowers:session.round.flowers[win.winnerId].map(t=>34+['plum','orchid','bamboo','chrysanthemum','spring','summer','autumn','winter'].indexOf(t.face))}:{kind:'draw'};
    ledger=settleMcrHand(ledger,`hand:${s.hand+1}`,result);
    // Independent payment calculation must agree with the round's score.
    if(win&&ids.some((key,i)=>ledger.hands.at(-1)!.settlement.delta[i]!==win.settlement.deltas[key]))throw new Error('Round/match scoring disagreement');
  }
  return {...s,revision:s.revision+1,session,ledger};
}
export function closeMcrMatch(s:McrMatch):McrMatch{return s.session.closed?s:{...s,revision:s.revision+1,session:closeMcrSession(s.session)};}
