import { bestHand, cardText, categories, categoriesEn, rank, type Action } from './holdem';
import type { MultiView } from './holdem-multi-session';
/** Deliberately weak teaching opponent: receives only its own redacted view. */
export function multiTeachingAction(view:MultiView,roll=Math.random()):Action {
  const a=view.legal,own=view.cards[view.seat];
  if(!a||own.length!==2)throw new Error('Not an active player');
  const pair=rank(own[0])===rank(own[1]);
  if(pair&&a.canRaise&&roll<0.3)return {kind:'raise',to:Math.min(a.minTo,a.maxTo)};
  if(a.canCheck)return {kind:'check'};
  if(!pair&&a.call>40&&roll<0.25)return {kind:'fold'};
  return {kind:'call'};
}
export function multiResultText(v:MultiView,locale:'zh'|'en') {
  if(!v.over)return '';
  const zh=locale==='zh',lines:string[]=[];
  lines.push(zh?'按每个底池分别结算；只投入到相应额度且未弃牌的玩家有资格争夺该池。':'Each pot is settled separately; only non-folded players who contributed to its level are eligible.');
  v.pots.forEach((p,k)=>lines.push(zh?`${k===0?'主池':'边池 '+k}共 ${p.amount}：有资格座位 ${p.eligible.map(i=>i+1).join('、')}；获奖 ${p.winners.map(i=>`座位 ${i+1} 得 ${p.shares[i]}`).join('，')}。`:`${k===0?'Main pot':'Side pot '+k}: ${p.amount}; eligible seats ${p.eligible.map(i=>i+1).join(', ')}; awards ${p.winners.map(i=>`seat ${i+1}: ${p.shares[i]}`).join(', ')}.`));
  if(v.showdown)v.cards.forEach((cards,i)=>{
    if(cards.length!==2||v.folded[i])return;
    const best=bestHand([...cards,...v.community]);
    lines.push(zh?`座位 ${i+1}：${categories[best.score[0]]}，最佳五张 ${best.cards.map(cardText).join(' ')}；同牌型比较点数 ${best.score.slice(1).join('、')}。`:`Seat ${i+1}: ${categoriesEn[best.score[0]]}, best five ${best.cards.map(cardText).join(' ')}; tie-break ranks ${best.score.slice(1).join(', ')}.`);
  });
  else lines.push(zh?'其他玩家已弃牌，剩余玩家获奖，无需公开暗牌。':'Other players folded; the remaining player wins without revealing private hands.');
  lines.push(zh?'先比牌型，再依次比较点数，第一处不同决定大小；14 表示 A，A2345 顺子按 5 高。完全相同时平分，除不尽的整筹码按按钮左侧起的座位顺序分配。':'Compare category, then tie-break ranks in order; first difference wins. 14 means ace, but A2345 is five-high. Identical hands split; odd chips go clockwise from the button among winners.');
  lines.push(zh?`你本手获奖 ${v.awards[v.seat]}，退回无人跟注 ${v.refunds[v.seat]}，余额 ${v.stacks[v.seat]}，净变化 ${v.stacks[v.seat]-v.start[v.seat]}。退回自己的筹码不是额外赢利。`:`Your award ${v.awards[v.seat]}, uncalled refund ${v.refunds[v.seat]}, balance ${v.stacks[v.seat]}, net change ${v.stacks[v.seat]-v.start[v.seat]}. Returned chips are not additional profit.`);
  return lines.join('\n\n');
}
