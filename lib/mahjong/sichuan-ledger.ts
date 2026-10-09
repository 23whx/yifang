export type SichuanPaymentKind='discard-win'|'self-draw'|'kong'|'kong-refund'|'not-ready'|'missing-suit'|'kong-transfer';
export type SichuanPayment={from:number;to:number;amount:number;kind:SichuanPaymentKind;refundOf?:number};
export type SichuanLedger={balances:number[];entries:(SichuanPayment&{id:number;event:string})[];events:string[]};
const kinds:SichuanPaymentKind[]=['discard-win','self-draw','kong','kong-refund','not-ready','missing-suit','kong-transfer'];
const seat=(id:number)=>Number.isInteger(id)&&id>=0&&id<4;
export function newSichuanLedger():SichuanLedger{return {balances:[0,0,0,0],entries:[],events:[]};}
/** Points, not money or owned chips: negative balances are legitimate losses.
 * Apply a whole event atomically; event identity prevents double settlement. */
export function postSichuanPayments(s:SichuanLedger,event:string,payments:readonly SichuanPayment[]):SichuanLedger{
  if(!/^[a-zA-Z0-9:-]{1,80}$/.test(event)||s.events.includes(event)||payments.length>64)throw new Error('Invalid or repeated settlement');
  const balances=[...s.balances],entries=s.entries.map(e=>({...e}));
  for(const p of payments){
    if(!seat(p.from)||!seat(p.to)||p.from===p.to||!Number.isSafeInteger(p.amount)||p.amount<=0||!kinds.includes(p.kind))throw new Error('Invalid payment');
    if(p.kind==='kong-refund'){
      const original=entries.find(e=>e.id===p.refundOf);
      if(!original||original.kind!=='kong'||original.from!==p.to||original.to!==p.from||original.amount!==p.amount||entries.some(e=>e.refundOf===original.id))throw new Error('Invalid or repeated kong refund');
    }else if(p.refundOf!==undefined)throw new Error('Unexpected refund reference');
    balances[p.from]-=p.amount;balances[p.to]+=p.amount;
    if(balances.some(n=>!Number.isSafeInteger(n)))throw new Error('Point overflow');
    entries.push({id:entries.length,event,from:p.from,to:p.to,amount:p.amount,kind:p.kind,...(p.refundOf===undefined?{}:{refundOf:p.refundOf})});
  }
  return {balances,entries,events:[...s.events,event]};
}
/** Refund only gains received by the specified non-ready/forbidden-suit seats;
 * return each gain to its original payer, even if that payer has since won. */
export function refundSichuanKongs(s:SichuanLedger,event:string,recipients:readonly number[]):SichuanLedger{
  if(recipients.some(id=>!seat(id))||new Set(recipients).size!==recipients.length)throw new Error('Invalid refund seats');
  const refunded=new Set(s.entries.flatMap(e=>e.refundOf===undefined?[]:[e.refundOf]));
  const payments=s.entries.filter(e=>e.kind==='kong'&&recipients.includes(e.to)&&!refunded.has(e.id)).map(e=>({from:e.to,to:e.from,amount:e.amount,kind:'kong-refund' as const,refundOf:e.id}));
  return postSichuanPayments(s,event,payments);
}
/** Host scoring chooses the amount. This function only assigns valid payers:
 * retired players are omitted; discard wins charge only the discarder. */
export function sichuanWinPayments(active:readonly number[],winners:readonly {seat:number;amount:number}[],from:number,selfDraw:boolean):SichuanPayment[]{
  if(active.length<2||active.length>4||new Set(active).size!==active.length||active.some(id=>!seat(id))||!active.includes(from)||!winners.length||new Set(winners.map(w=>w.seat)).size!==winners.length||winners.some(w=>!active.includes(w.seat)||!Number.isSafeInteger(w.amount)||w.amount<=0)||(selfDraw?(winners.length!==1||winners[0].seat!==from):winners.some(w=>w.seat===from)))throw new Error('Invalid winning payment context');
  return winners.flatMap(w=>(selfDraw?active.filter(id=>id!==w.seat):[from]).map(payer=>({from:payer,to:w.seat,amount:w.amount,kind:selfDraw?'self-draw' as const:'discard-win' as const})));
}
