"use client";
import { useState } from "react";
import { baccaratCases, baccaratGuide, holdemGuide, mahjongGuide } from "@/content/guided-tables";
import MahjongTile, { mahjongTiles } from "./MahjongTile";
import ResultDialog from "@/components/ui/ResultDialog";

export default function GuidedTableLesson({ game, locale }: { game: "baccarat" | "holdem" | "mahjong"; locale: "zh" | "en" }) {
  const zh = locale === "zh";
  const [caseIndex, setCaseIndex] = useState(0), [index, setIndex] = useState(0), [feedback, setFeedback] = useState("");
  const [complete, setComplete] = useState(false);
  const steps = game === "baccarat" ? baccaratGuide(caseIndex) : game === "holdem" ? holdemGuide() : mahjongGuide();
  const step = steps[index], scene = step.scene;
  function reset(choice = caseIndex) { setCaseIndex(choice); setIndex(0); setComplete(false); setFeedback(""); }
  function act(choice: number) {
    if (complete) return;
    if (choice !== step.correct) { setFeedback(step.feedback[locale]); return; }
    setFeedback(zh ? "这一步已完成。观察牌面和数值的变化，再读下一步。" : "Step completed. Inspect the changed cards and numbers before the next action.");
    if (index === steps.length - 1) setComplete(true); else setIndex(index + 1);
  }
  const tiles = (items: string[]) => <div className="mt-3 flex flex-wrap gap-2">{items.length ? items.map((item, i) => game === "mahjong" ? <MahjongTile key={i} tile={item} locale={locale} /> : <span key={i} className={`inline-flex min-h-16 min-w-11 items-center justify-center rounded border border-ink/40 bg-[#fff8e8] px-3 text-lg font-bold ${/[♥♦]/.test(item) ? "text-[#9b3026]" : "text-[#392616]"}`}>{item === "?" ? (zh ? "牌背" : "Face down") : item}</span>) : <span className="text-sm text-ink-3">{game === "mahjong" ? (zh ? "尚无麻将牌" : "No tiles yet") : (zh ? "尚无牌张" : "No cards yet")}</span>}</div>;
  const resultTitle = game === "mahjong" ? (zh ? "练习完成：四组加一对" : "Exercise complete: four sets and a pair") : game === "holdem" ? (zh ? "你赢了这手教学牌" : "You won this teaching hand") : scene.balance! > 100 ? (zh ? "本例所选结果获胜" : "Your selection won") : scene.balance === 100 ? (zh ? "本例和局：本金退回" : "Tie: stake returned") : (zh ? "练习完成，本笔投入未获胜" : "Exercise complete; this stake lost");
  const resultReason = game === "mahjong" ? (zh ? "你的 14 张牌可以分成：一二三万／四五六万／二三四筒／六七八条／东东。前四组都是同花色连续三张，叫顺子；最后两张相同的东风是对子。因此完成了‘四组加一对’的本题目标。\n\n最后一张东风是你自己摸到的。不过，本练习只检查牌型结构；正式宣布和牌还要满足所选地区规则的起和条件。" : "Your 14 tiles split into characters 123 / characters 456 / dots 234 / bamboo 678 / East-East. Each of the first four groups is three consecutive ranks in one suit, called a sequence. The two identical East tiles are a pair. That completes this exercise's four-sets-and-a-pair goal.\n\nYou drew the last East yourself. This exercise checks structure only; a real winning declaration must also meet the chosen regional rules.") : game === "holdem" ? (zh ? "你的一对 A 大于对方的一对 Q，因此获得底池 20。你的最终余额 110，对方 90。底池包含你投入的 10，所以净增加是 10，不是 20。" : "Your pair of aces beats the opponent's pair of queens, winning the 20-chip pot. Final balances: you 110, opponent 90. Your own 10 was in the pot, so net gain is 10, not 20.") : steps.slice(-3).map(s => s.instruction[locale]).join("\n\n");
  return <section className="my-10 space-y-5 rounded border-2 border-ink/40 bg-paper p-4 sm:p-6" aria-label={zh ? "手把手操作课" : "Guided hands-on lesson"}>
    <h2 className="text-2xl font-bold">{zh ? "手把手操作课 · 每一步由你完成" : "Hands-on lesson · Your actions, step by step"}</h2>
    {complete && <ResultDialog title={resultTitle} reason={resultReason} locale={locale} />}
    <p className="max-w-3xl leading-7">{game === "mahjong" ? (zh ? "先读当前任务，再亲手摸牌或选择要打出的牌。白代表白板，东代表东风，万、筒、条是三种数字牌花色。案例只教基本组合，不包含下注或地区计分；答错会解释并让你重试。" : "Read each task, then draw or select a discard. White Dragon and East are honours; characters, dots and bamboo are numbered suits. This example teaches basic combinations, not betting or regional scoring. Wrong answers explain and let you retry.") : (zh ? "先读下方当前任务，再操作牌张或按钮。做错会解释，不会扣额外筹码。固定牌序只是教学案例，不是预测或获利方法；模拟筹码不可购买、提现、兑换，重新练习自动重置。" : "Read the task before acting. Incorrect choices explain without extra deductions. These arranged examples are not predictions or profit strategies. Teaching credits cannot be bought, withdrawn or redeemed; resetting restores the starting state.")}</p>
    {game === "baccarat" && <label className="block font-bold">{zh ? "从第一局开始，逐渐学习结算差异" : "Begin with example 1, then compare settlements"}<select className="mt-2 block min-h-11 w-full rounded border border-ink/40 bg-paper p-2" value={caseIndex} onChange={e => reset(Number(e.target.value))}>{baccaratCases.map((c, i) => <option key={i} value={i}>{c[locale]}</option>)}</select></label>}
    {game === "baccarat" && caseIndex > 0 && <p className="max-w-3xl leading-7">{zh ? "本例接着第一例学习，不重复认花色和牌面名称；还不熟悉时，请在上方选择第一局。每个案例重新从100教学筹码开始，牌序也重新摆好，不是上一局接着发牌。" : "This example builds on example 1 without repeating suit and rank recognition. Select example 1 above if those are unfamiliar. Each example resets to 100 teaching credits and a separate deck setup; it does not continue the previous deal."}</p>}
    {scene.balance !== undefined && <dl className="flex flex-wrap gap-6 border-y border-ink/30 py-4" aria-label={zh ? "教学账本" : "Teaching ledger"}>
      <div><dt>{zh ? "我的可用余额" : "My available balance"}</dt><dd className="text-2xl font-bold">{scene.balance}</dd></div>
      {scene.committed !== undefined && <div><dt>{zh ? "已投入待结算" : "Unsettled stake"}</dt><dd className="text-2xl font-bold">{scene.committed}</dd></div>}
      {scene.opponentBalance !== undefined && <div><dt>{zh ? "对方余额" : "Opponent balance"}</dt><dd className="text-2xl font-bold">{scene.opponentBalance}</dd></div>}
      {scene.pot !== undefined && <div><dt>{zh ? "底池" : "Pot"}</dt><dd className="text-2xl font-bold">{scene.pot}</dd></div>}
      {scene.selected && <div><dt>{zh ? "本例选择" : "Selection"}</dt><dd className="font-bold">{scene.selected[locale]}</dd></div>}
    </dl>}
    <div className="grid gap-6 sm:grid-cols-2">
      <div><h3 className="font-bold">{game === "baccarat" ? (zh ? "闲的牌" : "Player hand") : (zh ? `我的手牌（${scene.hand.length} 张）` : `My hand (${scene.hand.length})`)}</h3>{tiles(scene.hand)}</div>
      {game !== "mahjong" && <div><h3 className="font-bold">{game === "baccarat" ? (zh ? "庄的牌" : "Banker hand") : (zh ? "对方底牌：摊牌前不能看" : "Opponent: hidden until showdown")}</h3>{tiles(scene.other)}</div>}
    </div>
    {game === "holdem" && <div><h3 className="font-bold">{zh ? "公共牌：双方共同使用" : "Community cards: shared by both"}</h3>{tiles(scene.shared)}</div>}
    {scene.discarded && <div><h3 className="font-bold">{zh ? "我的弃牌区" : "My discards"}</h3>{tiles(scene.discarded)}</div>}
    <div className="border-l-4 border-vermilion pl-4" aria-live="polite" aria-atomic="true">
      <p className="text-sm">{zh ? "步骤" : "Step"} {index + 1} / {steps.length}</p>
      <h3 className="mt-2 text-xl font-bold">{complete ? (zh ? "本案例完成，可以独立复述流程了" : "Example complete: explain the sequence yourself") : step.title[locale]}</h3>
      <p className="mt-3 max-w-3xl leading-8">{step.instruction[locale]}</p>
    </div>
    <div className="flex flex-wrap gap-3">{step.options.map((option, i) => <button key={i} aria-label={option[locale]} disabled={complete} className={game === "mahjong" && mahjongTiles.includes(option.zh) ? "rounded-lg border-2 border-transparent p-1 hover:border-[#803d2b] focus-visible:outline-2 focus-visible:outline-[#803d2b] disabled:opacity-40" : "btn-sign min-h-11 disabled:opacity-40"} onClick={() => act(i)}>{game === "mahjong" && mahjongTiles.includes(option.zh) ? <MahjongTile tile={option.zh} locale={locale} /> : option[locale]}</button>)}</div>
    <p role="status" className="min-h-7 font-semibold text-vermilion">{feedback}</p>
    <div className="flex flex-wrap gap-3 border-t border-ink/30 pt-4">
      <button className="btn-sign btn-sign-outline" disabled={index === 0} onClick={() => { setIndex(index - 1); setComplete(false); setFeedback(zh ? "回看已恢复该步骤前的牌面和账本，不是正式对局的撤注功能。" : "Review restores the prior teaching snapshot; this is not a real-game cancellation."); }}>{zh ? "回看上一步" : "Review previous step"}</button>
      <button className="btn-sign btn-sign-outline" onClick={() => reset()}>{zh ? "重开本案例" : "Restart example"}</button>
      <a className="btn-sign btn-sign-outline" href={`/${locale}/${game}/learn/${game}-first-lesson#written-lesson`}>{zh ? "回到文字讲解" : "Read the written lesson"}</a>
    </div>
  </section>;
}
