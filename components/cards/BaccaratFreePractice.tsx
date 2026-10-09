"use client";

import { useState } from "react";
import { points, shuffledDeck, value, type Card } from "@/lib/baccarat";
import {
  advanceBaccaratPractice,
  commitBaccaratPractice,
  initialBaccaratPractice,
  nextBaccaratPractice,
  settleBaccaratPractice,
  type BaccaratSelection,
} from "@/lib/baccarat-practice";
import ResultDialog from "@/components/ui/ResultDialog";

const amount = (cents: number) => (cents / 100).toFixed(2).replace(/\.00$/, "");
const rank = (card: Card) => ({ 1: "A", 11: "J", 12: "Q", 13: "K" })[card.rank as 1 | 11 | 12 | 13] ?? card.rank;

export default function BaccaratFreePractice({ locale }: { locale: "zh" | "en" }) {
  const zh = locale === "zh";
  const [game, setGame] = useState(initialBaccaratPractice);
  const current = game.steps[game.stepIndex];
  const final = game.steps.at(-1);
  const player = final ? points(final.player) : 0;
  const banker = final ? points(final.banker) : 0;
  const winner: BaccaratSelection = player === banker ? "tie" : player > banker ? "player" : "banker";
  const labels = {
    player: zh ? "闲" : "Player",
    banker: zh ? "庄" : "Banker",
    tie: zh ? "和" : "Tie",
  };
  const net = game.returnedCents - game.stakeCents;
  const resultReason = zh
    ? `闲最终 ${player} 点，庄最终 ${banker} 点，所以牌的结果是“${labels[winner]}”。你在发牌前选了“${labels[game.selection]}”，投入 ${amount(game.stakeCents)} 个教学筹码。${winner === "tie" && game.selection !== "tie" ? "闲／庄遇和局时退还本金。" : game.selection === "banker" && winner === "banker" ? "选庄获胜：奖励按本金的 95% 计算，已扣除 5% 佣金。" : winner === "tie" && game.selection === "tie" ? "选和获胜：奖励为本金的 8 倍，另退本金。" : game.selection === winner ? "选闲获胜：奖励与本金等额，另退本金。" : "所选结果没出现，这笔投入不返还。"}本轮返还 ${amount(game.returnedCents)}（如有返还，已包含本金），相对本轮开始净变化 ${net >= 0 ? "+" : ""}${amount(net)}；当前余额 ${amount(game.balanceCents)}。`
    : `Player finished on ${player}, Banker on ${banker}: the card result is ${labels[winner]}. Before dealing you chose ${labels[game.selection]} and committed ${amount(game.stakeCents)} teaching credits. ${winner === "tie" && game.selection !== "tie" ? "A Player or Banker stake pushes on a tie: the original stake is returned." : game.selection === "banker" && winner === "banker" ? "A winning Banker selection earns 95% of the stake after the 5% commission." : winner === "tie" && game.selection === "tie" ? "A winning Tie selection earns 8 times the stake plus the original stake." : game.selection === winner ? "A winning Player selection earns an equal reward plus the original stake." : "The selected result did not occur, so the stake is not returned."} This round returned ${amount(game.returnedCents)} including any original stake; net change ${net >= 0 ? "+" : ""}${amount(net)}; available balance ${amount(game.balanceCents)}.`;

  const hand = (cards: Card[], name: string) => <section className="min-w-0 border border-ink/30 bg-paper p-3 sm:p-5">
    <h3 className="font-bold">{name} · {cards.length ? `${points(cards)} ${zh ? "点" : "points"}` : "—"}</h3>
    <div className="mt-3 flex min-h-24 flex-wrap gap-2" aria-label={name}>
      {cards.length ? cards.map(card => <div key={card.id} className={`flex h-24 w-[70px] flex-col items-center justify-center border border-ink/30 bg-[#fff8e8] ${"♥♦".includes(card.suit) ? "text-[#9b3026]" : "text-[#392616]"}`}>
        <strong className="text-xl">{rank(card)}{card.suit}</strong><span className="text-xs">{value(card)} {zh ? "点" : "pts"}</span>
      </div>) : <p className="self-center text-sm text-ink-3">{zh ? "尚未发牌" : "No cards dealt"}</p>}
    </div>
    {cards.length > 0 && <p className="mt-3 text-sm">{cards.map(value).join(" + ")} = {cards.reduce((sum, card) => sum + value(card), 0)} → {points(cards)} {zh ? "点（只看个位）" : "points (last digit)"}</p>}
  </section>;

  return <section className="mt-8 space-y-6 text-ink" aria-label={zh ? "百家乐自由练习" : "Baccarat free practice"}>
    <div className="border-l-4 border-vermilion pl-4 leading-7">
      <h2 className="text-2xl font-bold">{zh ? "百家乐 · 自由练习一整局" : "Baccarat · Practise a complete round"}</h2>
      <p>{zh ? "按顺序：选结果 → 选教学筹码 → 确认投入 → 逐张发牌 → 结算 → 核对余额。所有筹码仅用于教学，不能购买、提现或兑换；刷新页面会重置为 100。随机牌序不是获利预测，也不是连续牌靴。" : "Follow the whole sequence: choose a result → choose teaching credits → commit → deal one step at a time → settle → check the balance. Credits have no monetary value and cannot be bought, withdrawn or redeemed. Reloading resets to 100. Random rounds are not predictions or a continuous shoe."}</p>
    </div>
    <dl className="grid grid-cols-2 gap-3 border-y border-ink/30 py-4 sm:grid-cols-4" aria-label={zh ? "教学筹码账本" : "Teaching credit ledger"}>
      <div><dt className="text-sm">{zh ? "可用余额" : "Available"}</dt><dd className="text-2xl font-bold">{amount(game.balanceCents)}</dd></div>
      <div><dt className="text-sm">{zh ? "已投入待结算" : "Committed"}</dt><dd className="text-2xl font-bold">{amount(game.committedCents)}</dd></div>
      <div><dt className="text-sm">{zh ? "第几局" : "Round"}</dt><dd className="text-2xl font-bold">{game.round || "—"}</dd></div>
      <div><dt className="text-sm">{zh ? "当前选择" : "Selection"}</dt><dd className="text-xl font-bold">{labels[game.selection]}</dd></div>
    </dl>

    {game.phase === "choose" && <div className="space-y-5">
      <div><h3 className="font-bold">{zh ? "① 先选你认为最终会出现的结果" : "① Choose the result you think will occur"}</h3><p className="text-sm leading-7">{zh ? "闲和庄是两手牌的名字，不是你的身份。和表示双方最终点数相同；选哪项都不能控制发牌。" : "Player and Banker are names of two hands, not your identity. Tie means equal final totals. Your choice does not control the cards."}</p>
        <div className="mt-3 flex flex-wrap gap-2">{(["player", "banker", "tie"] as const).map(selection => <button key={selection} type="button" aria-pressed={game.selection === selection} className={`btn-sign min-h-11 ${game.selection === selection ? "" : "btn-sign-outline"}`} onClick={() => setGame(s => ({ ...s, selection }))}>{labels[selection]}</button>)}</div>
      </div>
      <div><h3 className="font-bold">{zh ? "② 再选投入多少教学筹码" : "② Choose how many teaching credits to commit"}</h3><p className="text-sm leading-7">{zh ? "选择金额还不会扣除余额；只有点“确认投入并准备发牌”才扣除。" : "Choosing an amount does not deduct it. Only confirming the stake does."}</p>
        <div className="mt-3 flex flex-wrap gap-2">{[500, 1000, 2000].map(stakeCents => <button key={stakeCents} type="button" aria-pressed={game.stakeCents === stakeCents} disabled={stakeCents > game.balanceCents} className={`btn-sign min-h-11 disabled:opacity-40 ${game.stakeCents === stakeCents ? "" : "btn-sign-outline"}`} onClick={() => setGame(s => ({ ...s, stakeCents }))}>{amount(stakeCents)}</button>)}</div>
      </div>
      <p className="border-l-2 border-ink/40 pl-3 text-sm leading-7">{zh ? `准备选“${labels[game.selection]}”，投入 ${amount(game.stakeCents)}；确认后余额将从 ${amount(game.balanceCents)} 变为 ${amount(game.balanceCents - game.stakeCents)}。` : `Draft: ${labels[game.selection]} for ${amount(game.stakeCents)}; after confirmation, available credits change from ${amount(game.balanceCents)} to ${amount(game.balanceCents - game.stakeCents)}.`}</p>
      <button type="button" disabled={game.stakeCents > game.balanceCents} className="btn-sign min-h-11 disabled:opacity-40" onClick={() => setGame(s => commitBaccaratPractice(s, shuffledDeck()))}>{zh ? "③ 确认投入并准备发牌" : "③ Commit and prepare to deal"}</button>
      {game.balanceCents < 500 && <p className="font-bold text-vermilion">{zh ? "余额不足 5 个教学筹码；可在下方重置。" : "Fewer than 5 credits remain; reset below to continue."}</p>}
    </div>}

    {game.phase !== "choose" && current && <div className="space-y-5">
      <p className="border-l-2 border-ink/40 pl-3 leading-7">{zh ? `你已选“${labels[game.selection]}”并投入 ${amount(game.stakeCents)}。此局发牌和结算前不能改选；闲、庄的补牌由规则自动决定。` : `You chose ${labels[game.selection]} and committed ${amount(game.stakeCents)}. You cannot change it during this round; fixed rules decide draws.`}</p>
      <div className="grid gap-3 md:grid-cols-2">{hand(current.player, zh ? "闲的牌" : "Player hand")}{hand(current.banker, zh ? "庄的牌" : "Banker hand")}</div>
      <div role="status" aria-live="polite" aria-atomic="true" className="border border-ink/30 bg-paper p-4 leading-7">
        <p className="text-sm font-bold">{zh ? "发牌步骤" : "Deal step"} {game.stepIndex + 1} / {game.steps.length}</p><p>{current[locale]}</p>
      </div>
      {game.phase === "deal" && (game.stepIndex < game.steps.length - 1
        ? <button type="button" className="btn-sign min-h-11" onClick={() => setGame(advanceBaccaratPractice)}>{zh ? "发下一张／继续规则判断" : "Deal next card / check next rule"} →</button>
        : <button type="button" className="btn-sign min-h-11" onClick={() => setGame(settleBaccaratPractice)}>{zh ? "④ 比较结果并结算" : "④ Compare and settle"} →</button>)}
      {game.phase === "settled" && <div className="space-y-4 border-t border-ink/30 pt-5">
        <p className="font-bold">{zh ? `已返还 ${amount(game.returnedCents)}，本轮净变化 ${net >= 0 ? "+" : ""}${amount(net)}；已投入归零。` : `Returned ${amount(game.returnedCents)}; net change ${net >= 0 ? "+" : ""}${amount(net)}; committed stake is now zero.`}</p>
        <p className="max-w-3xl leading-7">{resultReason}</p>
        <button type="button" className="btn-sign min-h-11" onClick={() => setGame(nextBaccaratPractice)}>{zh ? "⑤ 保留余额，开始下一局" : "⑤ Keep balance and start next round"} →</button>
        <ResultDialog title={game.selection === winner ? (zh ? "本轮所选结果获胜" : "Your selection won") : winner === "tie" && game.selection !== "tie" ? (zh ? "和局：退回投入" : "Tie: stake returned") : (zh ? "本轮所选结果未胜" : "Your selection did not win")} reason={resultReason} locale={locale} />
      </div>}
    </div>}
    <button type="button" className="btn-sign btn-sign-outline min-h-11" onClick={() => setGame(initialBaccaratPractice())}>{zh ? "重置全部教学筹码与局数" : "Reset all teaching credits and rounds"}</button>
  </section>;
}
