import { compare } from './holdem';

export type PotAward = { amount:number; cap:number; contributors:number[]; eligible:number[]; winners:number[]; shares:number[] };
/** Educational no-rake integer chips, clockwise seats; button itself is last for odd chips. */
export function settlePots(committed:number[], folded:boolean[], scores:(number[]|null)[], button:number) {
  const n=committed.length;
  if(n<2||n>9||folded.length!==n||scores.length!==n||!Number.isInteger(button)||button<0||button>=n||
    committed.some(v=>!Number.isSafeInteger(v)||v<0)||!Number.isSafeInteger(committed.reduce((a,b)=>a+b,0))||
    folded.some(v=>typeof v!=='boolean')||folded.every(Boolean)) throw new Error('Invalid pot inputs');
  for(let i=0;i<n;i++) if(!folded[i] && (!scores[i]?.length || scores[i]!.some(v=>!Number.isSafeInteger(v)||v<0))) throw new Error('Missing valid live hand rank');
  const awards=Array(n).fill(0) as number[], refunds=Array(n).fill(0) as number[], pots:PotAward[]=[];
  const levels=[...new Set(committed.filter(v=>v>0))].sort((a,b)=>a-b);
  let previous=0;
  for(const cap of levels) {
    const contributors=committed.flatMap((v,i)=>v>=cap?[i]:[]);
    const amount=(cap-previous)*contributors.length; previous=cap;
    if(contributors.length===1) {
      if(folded[contributors[0]]) throw new Error('Unmatched folded contribution must be normalized before settlement');
      refunds[contributors[0]]+=amount; continue;
    }
    const eligible=contributors.filter(i=>!folded[i]);
    if(!eligible.length) throw new Error('Orphan side pot: invalid betting history');
    let winners=[eligible[0]];
    for(const i of eligible.slice(1)) {
      const result=compare(scores[i]!,scores[winners[0]]!);
      if(result>0) winners=[i]; else if(result===0) winners.push(i);
    }
    const order=(i:number)=>(i-button-1+n)%n;
    winners.sort((a,b)=>order(a)-order(b));
    const shares=Array(n).fill(0) as number[], base=Math.floor(amount/winners.length), extra=amount%winners.length;
    winners.forEach((i,k)=>{shares[i]=base+(k<extra?1:0);awards[i]+=shares[i];});
    pots.push({amount,cap,contributors,eligible,winners,shares});
  }
  return {pots,awards,refunds};
}
