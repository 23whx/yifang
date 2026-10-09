import {structuralWaits} from './shape';
import {sichuanPatternValue} from './sichuan-patterns';
import {postSichuanPayments,refundSichuanKongs,type SichuanLedger,type SichuanPayment} from './sichuan-ledger';
import type {SichuanRound} from './sichuan-round';

/** Explicit table inputs, not inferred universal Sichuan conventions. Amounts
 * are practice points. The final UI must show these before the hand starts. */
export type SichuanWallRules={base:number;capMultiplier:number;missingSuitPenalty:number;retiredReceiveMissingPenalty:boolean};
export function settleSichuanWall(round:SichuanRound,ledger:SichuanLedger,event:string,rules:SichuanWallRules){
  if(round.phase!=='ended'||round.end!=='wall-empty'||round.wall.length!==0)throw new Error('Not an exhausted-wall ending');
  if(!Number.isSafeInteger(rules.base)||rules.base<1||!Number.isSafeInteger(rules.capMultiplier)||rules.capMultiplier<1||!Number.isSafeInteger(rules.missingSuitPenalty)||rules.missingSuitPenalty<1||typeof rules.retiredReceiveMissingPenalty!=='boolean'||!Number.isSafeInteger(rules.base*rules.capMultiplier))throw new Error('Invalid wall settlement rules');
  const checks=round.seats.map((p,seat)=>{
    if(p.retired)return {seat,status:'retired' as const,waits:[] as {tile:number;amount:number}[],maximum:0};
    const all=[...p.hand,...p.melds.flatMap(m=>m.tiles)];
    // Run shape validation even for forbidden suits, rather than bypass malformed hands.
    const tiles=structuralWaits(p.hand,p.melds,{variant:'sichuan',missingSuit:p.missing});
    if(p.hand.length!==13-3*p.melds.length)throw new Error('Invalid final concealed hand size');
    if(all.some(t=>Math.floor(t/9)===p.missing))return {seat,status:'missing-suit' as const,waits:[],maximum:0};
    const waits=tiles.map(tile=>({tile,amount:rules.base*Math.min(rules.capMultiplier,sichuanPatternValue([...p.hand,tile],p.melds,p.missing)!.multiplier)}));
    return {seat,status:waits.length?'ready' as const:'not-ready' as const,waits,maximum:Math.max(0,...waits.map(w=>w.amount))};
  });
  const payments:SichuanPayment[]=[];
  for(const payer of checks){
    if(payer.status==='missing-suit')for(const recipient of checks){
      if(recipient.status!=='missing-suit'&&(recipient.status!=='retired'||rules.retiredReceiveMissingPenalty))payments.push({from:payer.seat,to:recipient.seat,amount:rules.missingSuitPenalty,kind:'missing-suit'});
    }
    // Forbidden-suit seats pay their own penalty, not a second not-ready penalty.
    if(payer.status==='not-ready')for(const recipient of checks)if(recipient.status==='ready')payments.push({from:payer.seat,to:recipient.seat,amount:recipient.maximum,kind:'not-ready'});
  }
  const charged=postSichuanPayments(ledger,event,payments);
  const next=refundSichuanKongs(charged,`${event}:refund`,checks.filter(c=>c.status==='not-ready'||c.status==='missing-suit').map(c=>c.seat));
  return {checks,ledger:next};
}
