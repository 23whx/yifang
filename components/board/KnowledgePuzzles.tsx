"use client";
import { useState, useSyncExternalStore } from "react";
const subscribeDay = (notify: () => void) => {
  const timer = setInterval(notify, 60000);
  return () => clearInterval(timer);
};
const currentDay = () => new Date().toISOString().slice(0, 10);
import type { KnowledgePuzzle } from "@/content/board/library";
export default function KnowledgePuzzles({
  puzzles,
  locale,
  date,
}: {
  puzzles: KnowledgePuzzle[];
  locale: "zh" | "en";
  date: string;
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const today = useSyncExternalStore(subscribeDay, currentDay, () => date);
  const index =
    [...today].reduce((n, c) => n + c.charCodeAt(0), 0) % puzzles.length;
  const ordered = [puzzles[index], ...puzzles.filter((_, i) => i !== index)];
  return (
    <div className="max-w-3xl">
      <p className="text-sm mb-8">
        {locale === "zh" ? "今日规则挑战" : "Daily rules challenge"} · {today}{" "}
        UTC
      </p>
      {ordered.map((p, i) => (
        <section key={p.id} className="border-t border-ink py-8">
          <h2 className="text-xl font-bold">
            {i === 0 ? "✦" : "◇"} {p.question[locale]}
          </h2>
          <div className="grid gap-3 mt-5">
            {p.choices[locale].map((c, j) => (
              <button
                key={j}
                aria-pressed={answers[p.id] === j}
                className={`border px-4 py-3 text-left ${answers[p.id] === j ? "bg-ink text-paper" : ""}`}
                onClick={() => setAnswers((a) => ({ ...a, [p.id]: j }))}
              >
                {String.fromCharCode(65 + j)}. {c}
              </button>
            ))}
          </div>
          {answers[p.id] !== undefined && (
            <p role="status" className="mt-5 leading-7">
              {answers[p.id] === p.answer
                ? locale === "zh"
                  ? "答对了。"
                  : "Correct. "
                : locale === "zh"
                  ? "再想一想。"
                  : "Try again. "}
              {p.explanation[locale]}
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
