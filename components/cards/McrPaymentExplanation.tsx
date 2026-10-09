import type {McrLedger} from '@/lib/mahjong/mcr-settlement';
import type {McrWinResult} from 'miaoda-game-mcr-mahjong-rules';
import {mcrPaymentSourceReason} from '@/lib/mahjong/mcr-result-copy';
import MahjongTile, {mahjongFlowers} from './MahjongTile';

/** Explain actual ledger transfers, not a second independent scoring display. */
export default function McrPaymentExplanation({hand,winResult,locale}:{hand:McrLedger['hands'][number];winResult:McrWinResult|null;locale:'zh'|'en'}){
  const zh=locale==='zh',r=hand.result,s=hand.settlement;
  return <section className="space-y-3 rounded border border-[#ae8550] bg-[#fff8e8] p-4">
    <h3 className="text-lg font-bold">{zh?'一步步看懂本手结算':'Understand this hand’s score, step by step'}</h3>
    {r.kind==='draw'?<p className="leading-8">{zh?'本手没有人和牌，不发生分数转移。每个人本手变化都是 0，之前累计的分数不变。':'Nobody won this hand, so no points change hands. Each player’s change is zero; previous totals remain unchanged.'}</p>:<>
      <ol className="list-decimal space-y-2 pl-6 leading-8">
        <li>{zh?`先检查门槛：不含花牌 ${s.nonFlowerPoints} 分，至少为 8，允许和牌。不是先把花分加上再判断。`:`Check eligibility first: ${s.nonFlowerPoints} points without flowers meet the minimum of 8. Flowers are not added before this check.`}</li>
        <li>{zh?`再加花分：${s.nonFlowerPoints} + ${s.flowerPoints} = ${s.totalPoints} 分。这是牌型与花牌的得分，不是赢家最终收入。`:`Then add flowers: ${s.nonFlowerPoints} + ${s.flowerPoints} = ${s.totalPoints} points. This is the hand value, not the winner’s total gain.`}</li>
        <li>{zh?`每位没和牌的玩家先支付 8 分基础分给座位 ${r.winner+1}。这笔“基础 8 分”与“八分起和门槛”是两件事。`:`Each non-winner pays 8 base points to seat ${r.winner+1}. This base payment is separate from the eight-point eligibility requirement.`}</li>
        <li>{winResult?mcrPaymentSourceReason(winResult,locale):(zh?'本手胜利来源暂无法核对；请以下方逐席付款记录为准。':'The winning route cannot be verified here; use the itemized payments below.')}</li>
      </ol>
      <div className="space-y-2">
        <h4 className="font-bold">{zh?'赢家本手实际花牌':'The winner’s actual flowers this hand'}</h4>
        {r.flowers.length?<div className="flex flex-wrap gap-3">{r.flowers.map(id=><div key={id} className="space-y-1"><MahjongTile tile={mahjongFlowers[id-34]} locale={locale} compact/><p className="text-center text-sm">+1 {zh?'分':'point'}</p></div>)}</div>:<p>{zh?'没有花牌，花分为 0。':'No flower tiles: zero flower points.'}</p>}
        <p className="text-sm leading-7">{zh?'这里只展示赢家的花牌。其他玩家的花牌不加到赢家分数里；花分仍不能用于凑足八分起和门槛。':'Only the winner’s flowers count here, not opponents’ flowers. Flower points still cannot satisfy the eight-point minimum.'}</p>
      </div>
      <ul className="space-y-2 leading-7">{s.transfers.map(p=><li key={p.from}>{zh?`座位 ${p.from+1} → 座位 ${p.to+1}：基础 ${p.baseline} + 牌值 ${p.handPoints} = 支付 ${p.amount} 分。`:`Seat ${p.from+1} → seat ${p.to+1}: base ${p.baseline} + hand value ${p.handPoints} = ${p.amount} points paid.`}</li>)}</ul>
    </>}
    <div className="grid gap-2 sm:grid-cols-2">{s.delta.map((n,id)=><p key={id}>{zh?`座位 ${id+1} 本手`:`Seat ${id+1} this hand`}: {n>0?'+':''}{n} {zh?'分':'points'}</p>)}</div>
    <p className="text-sm leading-7">{zh?'加号表示收到分数，减号表示付出分数。四人的变化相加为 0；这些只是本桌游戏分数，不是真钱，也不保存到账户。':'Plus means points received; minus means points paid. All four changes sum to zero. These are table game scores, not money or saved account balances.'}</p>
  </section>;
}
