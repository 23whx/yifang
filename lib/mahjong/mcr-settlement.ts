import {isMcrFlower} from './mcr-setup';

/** Host-only settlement boundary. `nonFlowerPoints` must come from the MCR
 * scorer AFTER exclusions and win-context evaluation, never a guest request.
 * This does not detect fans, prove a legal hand or arbitrate simultaneous claims.
 * EMA MCR Green Book: non-winners pay eight baseline points; discard source pays
 * the hand value, while every opponent pays that value for self-draw.
 */
export type McrWinValue={nonFlowerPoints:number;flowers:readonly number[]};
export type McrResult={kind:'draw'}|({kind:'win';winner:number;from:number;selfDraw:boolean}&McrWinValue);
export type McrTransfer={from:number;to:number;baseline:8;handPoints:number;amount:number};
export type McrSettlement={eligible:boolean;nonFlowerPoints:number;flowerPoints:number;totalPoints:number;transfers:McrTransfer[];delta:number[]};
export type McrLedger={balances:number[];hands:{id:string;result:McrResult;settlement:McrSettlement}[]};
const seat=(n:number)=>Number.isInteger(n)&&n>=0&&n<4;
function value(v:McrWinValue){
  if(!Number.isSafeInteger(v.nonFlowerPoints)||v.nonFlowerPoints<0||v.flowers.length>8||v.flowers.some(t=>!isMcrFlower(t))||new Set(v.flowers).size!==v.flowers.length)throw new Error('Invalid MCR hand value');
  const total=v.nonFlowerPoints+v.flowers.length;
  if(!Number.isSafeInteger(total)||!Number.isSafeInteger(3*(8+total)))throw new Error('MCR point overflow');
  return total;
}
export function mcrSettlement(result:McrResult):McrSettlement{
  if(result.kind==='draw')return {eligible:false,nonFlowerPoints:0,flowerPoints:0,totalPoints:0,transfers:[],delta:[0,0,0,0]};
  if(result.kind!=='win'||!seat(result.winner)||!seat(result.from)||typeof result.selfDraw!=='boolean'||(result.selfDraw?result.from!==result.winner:result.from===result.winner))throw new Error('Invalid MCR win source');
  const totalPoints=value(result),eligible=result.nonFlowerPoints>=8;
  const transfers:McrTransfer[]=eligible?[0,1,2,3].filter(id=>id!==result.winner).map(from=>{
    const handPoints=result.selfDraw||from===result.from?totalPoints:0;
    return {from,to:result.winner,baseline:8,handPoints,amount:8+handPoints};
  }):[];
  const delta=[0,0,0,0];for(const t of transfers){delta[t.from]-=t.amount;delta[t.to]+=t.amount;}
  return {eligible,nonFlowerPoints:result.nonFlowerPoints,flowerPoints:result.flowers.length,totalPoints,transfers,delta};
}
export function newMcrLedger():McrLedger{return {balances:[0,0,0,0],hands:[]};}
/** Exactly once per hand; a draw also consumes the hand identity. Points may be
 * negative and are ephemeral table scores, not account balances or money. */
export function settleMcrHand(ledger:McrLedger,id:string,result:McrResult):McrLedger{
  if(!/^[a-zA-Z0-9:-]{1,80}$/.test(id)||ledger.hands.some(h=>h.id===id))throw new Error('Invalid or already settled hand');
  if(ledger.balances.length!==4||ledger.balances.some(n=>!Number.isSafeInteger(n)))throw new Error('Invalid MCR balances');
  const settlement=mcrSettlement(result);
  if(result.kind==='win'&&!settlement.eligible)throw new Error('Eight non-flower points required');
  const balances=ledger.balances.map((n,i)=>n+settlement.delta[i]);
  if(balances.some(n=>!Number.isSafeInteger(n)))throw new Error('MCR balance overflow');
  return {balances,hands:[...structuredClone(ledger.hands),{id,result:structuredClone(result),settlement}]};
}
