import {sichuanSessionView,type SichuanSessionAction} from './sichuan-session';
import type {Suit} from './shape';
export type SichuanView=ReturnType<typeof sichuanSessionView>;
/** Called only when starting a new practice, never during rendering. */
export function shuffledSichuanDeck(){
  const deck=Array.from({length:108},(_,i)=>i%27);
  for(let i=107;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
  return deck;
}
/** Weak practice partner; receives ONLY its own projected view. */
export function sichuanTeachingAction(v:SichuanView):SichuanSessionAction|null{
  if(v.closed)return null;
  if(v.stage==='setup'){
    const s=v.setup,id=s.seat;
    if(s.phase==='exchange'&&!s.exchangeChosen[id])return {kind:'exchange',tiles:[0,1,2].map(suit=>s.hand.filter(t=>Math.floor(t/9)===suit)).find(h=>h.length>=3)!.slice(0,3)};
    if(s.phase==='missing'&&!s.missingChosen[id]){const counts=[0,1,2].map(suit=>s.hand.filter(t=>Math.floor(t/9)===suit).length);return {kind:'missing',suit:counts.indexOf(Math.min(...counts)) as Suit};}
    return null;
  }
  const r=v.round;
  if(r.phase==='result'&&!v.confirmed[r.seat])return {kind:'ack'};
  if(r.claim?.reply===null){const o=r.claim.options;return {kind:'claim',choice:o.win?'win':o.kong?'kong':o.pung?'pung':'pass'};}
  if(r.canDraw)return {kind:'draw'};
  if(!r.legal)return null;
  const o=r.legal;if(o.win)return {kind:'win'};
  if(o.concealedKongs.length)return {kind:'concealed-kong',tile:o.concealedKongs[0]};
  if(o.addedKongs.length)return {kind:'added-kong',meld:o.addedKongs[0]};
  const hand=r.players[r.seat].hand;
  const strength=(t:number)=>hand.filter(x=>x===t).length*3+hand.filter(x=>Math.floor(x/9)===Math.floor(t/9)&&Math.abs(x-t)<=2).length;
  return {kind:'discard',tile:[...o.discards].sort((a,b)=>strength(a)-strength(b)||a-b)[0]};
}
