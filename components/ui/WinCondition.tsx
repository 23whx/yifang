import { winConditions } from "@/content/win-conditions";
import type { GameSlug } from "@/content/games";
export default function WinCondition({ game, locale }: { game: GameSlug; locale: "zh" | "en" }) {
  const item = winConditions[game];
  return <section className="my-6 max-w-4xl space-y-3 rounded border-2 border-[#ae8550] bg-[#f3e7cd] p-5 text-[#392616] sm:p-6" aria-label={locale === "zh" ? "胜利条件" : "Winning condition"}>
    <h2 className="text-2xl font-bold">{locale === "zh" ? "先知道：怎样才算赢？" : "First: what counts as winning?"}</h2>
    <p className="leading-8">{item.rule[locale]}</p><p className="leading-8">{item.example[locale]}</p><p className="border-t border-[#ae8550]/40 pt-3 text-sm leading-7">{item.practice[locale]}</p>
  </section>;
}
