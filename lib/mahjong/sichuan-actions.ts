import {countsOf,decomposeHand,type Meld,type Suit} from './shape';

/** Host-owned rule inputs, never accepted directly from a guest request. */
export type SichuanSeat={hand:number[];melds:Meld[];missing:Suit;retired:boolean};
export type SichuanTurn={drawn:number|null;wallRemaining:number;passedWin:boolean;openingTurn?:boolean};
function check(s:SichuanSeat){
  if(![0,1,2].includes(s.missing)||typeof s.retired!=='boolean')throw new Error('Invalid seat state');
  // Shape validator also rejects chows, honors and invalid declared groups.
  decomposeHand(s.hand,s.melds,{variant:'sichuan',missingSuit:s.missing});
}
function missing(s:SichuanSeat){return s.hand.some(t=>Math.floor(t/9)===s.missing);}
function whole(s:SichuanSeat){return [...s.hand,...s.melds.flatMap(m=>m.tiles)];}
function turn(t:SichuanTurn){
  if(!Number.isInteger(t.wallRemaining)||t.wallRemaining<0||t.wallRemaining>55||typeof t.passedWin!=='boolean'||(t.drawn!==null&&(!Number.isInteger(t.drawn)||t.drawn<0||t.drawn>=27)))throw new Error('Invalid turn context');
}
export function sichuanDiscards(s:SichuanSeat):number[]{
  check(s);if(s.retired||s.hand.length!==14-3*s.melds.length)return [];
  const forced=missing(s);
  return [...new Set(s.hand)].filter(t=>!forced||Math.floor(t/9)===s.missing).sort((a,b)=>a-b);
}
/** Structural win candidates; the round still enforces timing, pass restrictions,
 * event bonuses and settlement. No Japanese yaku or furiten is imported. */
export function sichuanOwnOptions(s:SichuanSeat,t:SichuanTurn){
  check(s);turn(t);
  if(t.openingTurn!==undefined&&typeof t.openingTurn!=='boolean')throw new Error('Invalid opening context');
  const empty={discards:[] as number[],win:false,concealedKongs:[] as number[],addedKongs:[] as number[]};
  if(s.retired||s.hand.length!==14-3*s.melds.length)return empty;
  if(t.drawn!==null&&!s.hand.includes(t.drawn))throw new Error('Drawn tile absent');
  const discards=sichuanDiscards(s),clear=!missing(s);
  const win=clear&&decomposeHand(s.hand,s.melds,{variant:'sichuan',missingSuit:s.missing}).length>0;
  // This preset requires clearing the missing suit before declaring any kong.
  // The dealer already has fourteen tiles after setup, without a draw event.
  // Only the host's initial turn may use that exception; a pung turn may not.
  if(!clear||t.wallRemaining===0||(t.drawn===null&&!(t.openingTurn&&s.melds.length===0)))return {...empty,discards,win};
  const counts=countsOf(s.hand);
  return {discards,win,concealedKongs:counts.flatMap((n,i)=>n===4?[i]:[]),
    // Timely added kong: only the just-drawn fourth tile, never a held spare.
    addedKongs:s.melds.flatMap((m,i)=>m.kind==='pung'&&m.tiles[0]===t.drawn?[i]:[])};
}
export function sichuanClaimOptions(s:SichuanSeat,tile:number,t:SichuanTurn){
  check(s);turn(t);
  if(!Number.isInteger(tile)||tile<0||tile>=27)throw new Error('Invalid discard');
  const empty={win:false,pung:false,kong:false};
  if(s.retired||s.hand.length!==13-3*s.melds.length||missing(s)||Math.floor(tile/9)===s.missing)return empty;
  const owned=countsOf(whole(s));
  if(owned[tile]===4)return empty; // A fifth physical copy cannot be claimed.
  const win=!t.passedWin&&decomposeHand([...s.hand,tile],s.melds,{variant:'sichuan',missingSuit:s.missing}).length>0;
  const count=s.hand.filter(x=>x===tile).length;
  return {win,pung:count>=2,kong:count===3&&t.wallRemaining>0};
}
export function discardSichuanTile(s:SichuanSeat,tile:number):SichuanSeat{
  if(!sichuanDiscards(s).includes(tile))throw new Error('Illegal discard');
  const hand=[...s.hand];hand.splice(hand.indexOf(tile),1);
  return {...s,hand,melds:s.melds.map(m=>({...m,tiles:[...m.tiles]}))};
}
