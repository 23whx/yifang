"use client";

import { useState } from "react";
import { bankerDraw, examples, exampleDeck, points, roundSteps, shuffledDeck, value, type Card } from "@/lib/baccarat";

export default function BaccaratTrainer({ locale }: { locale: "zh" | "en" }) {
  const zh = locale === "zh";
  const [steps, setSteps] = useState(() => roundSteps(exampleDeck(0)));
  const [index, setIndex] = useState(0);
  const [scenario, setScenario] = useState("0");
  const step = steps[index];
  const start = (choice: string) => {
    setScenario(choice); setIndex(0);
    setSteps(roundSteps(choice === "random" ? shuffledDeck() : exampleDeck(Number(choice))));
  };
  const hand = (cards: Card[], title: string) => <section className="min-w-0 rounded border-2 border-ink/30 bg-paper p-4 sm:p-6">
    <h3 className="text-xl font-bold">{title} · {cards.length ? `${points(cards)} ${zh ? "点" : "points"}` : "—"}</h3>
    <div className="my-5 flex min-h-28 gap-2" aria-label={title}>
      {cards.map(card => <div key={card.id} className={`flex h-28 w-20 flex-col items-center justify-center rounded-lg border border-ink/30 bg-[#fff8e8] shadow-sm ${"♥♦".includes(card.suit) ? "text-[#9b3026]" : "text-[#392616]"}`}>
        <span className="text-2xl font-bold">{({ 1: "A", 11: "J", 12: "Q", 13: "K" } as Record<number, string>)[card.rank] ?? card.rank}{card.suit}</span>
        <span className="mt-2 text-sm">{value(card)} {zh ? "点" : "pts"}</span>
      </div>)}
      {!cards.length && <p className="self-center text-ink-3">{zh ? "尚未发牌" : "No cards dealt"}</p>}
    </div>
    <p className="min-h-6 text-sm">{cards.length > 0 && `${cards.map(value).join(" + ")} = ${cards.reduce((n, c) => n + value(c), 0)} → ${points(cards)} ${zh ? "点（取个位）" : "points (last digit)"}`}</p>
  </section>;
  return <div className="mt-8 space-y-6 text-ink">
    <div className="border-l-4 border-vermilion pl-4 leading-7">
      <h2 className="text-2xl font-bold">{zh ? "百家乐 · 补牌规则训练台" : "Baccarat · Drawing rules trainer"}</h2>
      <p>{zh ? "仅作规则教学：无下注、无余额、无筹码。补牌由固定规则决定，不由玩家选择。随机练习每轮重新洗混 8 副牌，不模拟连续牌靴。" : "Rules education only: no bets, balances or chips. Fixed rules determine draws. Each random round shuffles eight fresh decks; this is not a continuous shoe simulation."}</p>
    </div>
    <label className="block font-semibold">{zh ? "选择教学案例" : "Choose an example"}
      <select value={scenario} onChange={e => start(e.target.value)} className="mt-2 block min-h-11 w-full max-w-xl rounded border border-ink/40 bg-paper px-3 text-ink">
        {examples.map((example, i) => <option key={i} value={i}>{example[locale]}</option>)}
        <option value="random">{zh ? "随机练习（8 副牌）" : "Random practice (8 decks)"}</option>
      </select>
    </label>
    <div className="grid gap-4 md:grid-cols-2">{hand(step.player, zh ? "闲 Player" : "Player")}{hand(step.banker, zh ? "庄 Banker" : "Banker")}</div>
    <div role="status" aria-live="polite" aria-atomic="true" className="min-h-28 rounded border border-ink/30 bg-paper p-5 leading-7">
      <p className="text-sm font-bold">{zh ? "步骤" : "Step"} {index + 1} / {steps.length}</p>
      <p>{step[locale]}</p>
    </div>
    <div className="flex flex-wrap gap-3">
      <button className="btn-sign btn-sign-outline min-h-11 disabled:opacity-40" disabled={index === 0} onClick={() => setIndex(i => i - 1)}>{zh ? "上一步" : "Previous"}</button>
      <button className="btn-sign min-h-11 disabled:opacity-40" disabled={index === steps.length - 1} onClick={() => setIndex(i => i + 1)}>{zh ? "下一步" : "Next"}</button>
      <button className="btn-sign btn-sign-outline min-h-11" onClick={() => setIndex(0)}>{zh ? "重看本轮" : "Replay round"}</button>
      <button className="btn-sign btn-sign-outline min-h-11" onClick={() => start("random")}>{zh ? "新随机练习" : "New random round"}</button>
    </div>
    <section className="space-y-4 border-t border-ink/30 pt-6 leading-7">
      <h3 className="text-xl font-bold">{zh ? "点数与补牌速查" : "Points and drawing reference"}</h3>
      <p>{zh ? "A 为 1 点，2–9 按牌面，10/J/Q/K 为 0 点；总和只取个位。先检查天然牌：任一方初始两张为 8/9 点，双方都停。否则闲 0–5 补、6–7 停；闲停时庄 0–5 补、6–7 停。闲补牌时，查下表。" : "A = 1; 2–9 = face value; 10/J/Q/K = 0. Keep the last digit of the sum. First check naturals: either initial hand at 8/9 stops both hands. Otherwise Player draws on 0–5 and stands on 6–7. If Player stands, Banker draws on 0–5 and stands on 6–7. If Player draws, use this table."}</p>
      <p className="font-semibold">{zh ? "列标题是闲第三张的点数，不是闲的总点数。补 = 补牌，停 = 停牌。表格可横向滚动。" : "Columns show Player’s third-card value, NOT Player’s total. D = draw; S = stand. Scroll the table horizontally."}</p>
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={zh ? "庄补牌表" : "Banker draw table"}>
        <table className="w-full min-w-[540px] border-collapse text-center text-sm">
          <caption className="pb-3 text-left">{zh ? "无天然牌且闲已补牌时适用" : "Applies only without naturals, after Player draws"}</caption>
          <thead><tr><th className="border border-ink/30 p-2">{zh ? "庄初始点数" : "Banker initial"}</th>{Array.from({ length: 10 }, (_, n) => <th className="border border-ink/30 p-2" scope="col" key={n}>{n}</th>)}</tr></thead>
          <tbody>{Array.from({ length: 8 }, (_, n) => <tr key={n}><th scope="row" className="border border-ink/30 p-2">{n}</th>{Array.from({ length: 10 }, (_, third) => <td className={`border border-ink/30 p-2 ${bankerDraw(n, third) ? "bg-ink/10 font-bold" : ""}`} key={third}>{bankerDraw(n, third) ? (zh ? "补" : "D") : (zh ? "停" : "S")}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <a className="text-sm underline" href="https://www.pacodeandbulletin.gov/Display/pacode?d=&file=/secure/pacode/data/058/chapter631a/chap631atoc.html" target="_blank" rel="noreferrer">{zh ? "规则来源：§631a.6、§631a.11（英文）" : "Rules source: §631a.6 and §631a.11"} ↗</a>
    </section>
  </div>;
}
