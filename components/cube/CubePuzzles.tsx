"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import RubiksCube, { RubiksCubeHandle } from "./RubiksCube";
import { describeTurn } from "./useManualSteps";
import { dailyScramble, invertAlg, todayKey } from "@/lib/cube/alg";
import type { CubePuzzle } from "@/content/cube/puzzles";
import type { Dict } from "@/lib/i18n";

interface Props {
  puzzles: CubePuzzle[];
  dict: Dict;
  locale: "zh" | "en";
}

interface Current {
  id: string;
  title: string;
  setup: string;
  solution: string;
}

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

export default function CubePuzzles({ puzzles, dict, locale }: Props) {
  const cube = useRef<RubiksCubeHandle>(null);
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [current, setCurrent] = useState<Current | null>(null);
  const [busy, setBusy] = useState(false);
  const [moves, setMoves] = useState(0);
  const [startAt, setStartAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [solved, setSolved] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [solutionCursor, setSolutionCursor] = useState(0);
  const pendingStep = useRef<number | null>(null);
  // 还原判定要在动画结束后做，用 ref 避免闭包拿到旧值
  const live = useRef({ startAt: null as number | null, solved: false });

  const load = useCallback((c: Current) => {
    if (pendingStep.current !== null || cube.current?.isBusy()) return;
    setSolutionCursor(0);
    cube.current?.reset();
    cube.current?.applyInstant(c.setup);
    setCurrent(c);
    setMoves(0);
    setStartAt(null);
    setElapsed(0);
    setSolved(false);
    setShowSolution(false);
    live.current = { startAt: null, solved: false };
  }, []);

  const daily = useCallback(
    (key: string): Current => {
      const scramble = dailyScramble(key);
      return { id: "daily", title: `${dict.dailyPuzzle} · ${key}`, setup: scramble, solution: invertAlg(scramble) };
    },
    [dict.dailyPuzzle]
  );

  const onReady = useCallback(() => {
    const key = todayKey();
    setDateKey(key);
    load(daily(key));
  }, [daily, load]);

  useEffect(() => {
    if (startAt === null || solved) return;
    const id = setInterval(() => setElapsed(Date.now() - startAt), 50);
    return () => clearInterval(id);
  }, [startAt, solved]);

  const onUserMove = useCallback(() => {
    setMoves((m) => m + 1);
    if (live.current.startAt === null) {
      const t = Date.now();
      live.current.startAt = t;
      setStartAt(t);
    }
  }, []);

  const onBusyChange = useCallback((b: boolean) => {
    setBusy(b);
    if (!b && pendingStep.current !== null) { setSolutionCursor(pendingStep.current); pendingStep.current = null; }
    if (!b && live.current.startAt !== null && !live.current.solved && cube.current?.isSolved()) {
      live.current.solved = true;
      setSolved(true);
      setElapsed(Date.now() - live.current.startAt);
    }
  }, []);

  const openSolution = (c: Current) => {
    if (busy || pendingStep.current !== null || cube.current?.isBusy()) return;
    if (showSolution && current?.id === c.id) { setShowSolution(false); return; }
    load(c);
    setShowSolution(true);
  };
  const solutionTokens = current?.solution.trim().split(/\s+/) ?? [];
  const playSolution = () => {
    if (!current || busy || pendingStep.current !== null || cube.current?.isBusy() || solutionCursor >= solutionTokens.length) return;
    pendingStep.current = solutionCursor + 1;
    setBusy(true);
    cube.current?.play(solutionTokens[solutionCursor]);
  };

  const dailyCurrent = current?.id === "daily";

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(400px,480px)]">
      <div className="min-w-0">
        {/* 每日一题 */}
        <section className="border-t-2 border-ink py-10">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="display-cjk text-[clamp(32px,4vw,56px)]">{dict.dailyPuzzle}</h2>
            <p className="notation text-sm text-ink-3">{dateKey ?? "—"}</p>
          </div>
          <p className="prose-yf mt-4">{dict.dailyDesc}</p>
          <div className="mt-6 border-2 border-ink">
            <div className="p-5">
              <p className="text-xs font-bold tracking-[0.18em] text-ink-3 uppercase">{dict.scrambleLabel}</p>
              <p className="notation mt-2 text-[20px] leading-8 text-ink sm:text-[24px]">{dateKey ? dailyScramble(dateKey) : "…"}</p>
            </div>
            <div className="grid grid-cols-2 border-t-2 border-ink text-sm font-bold">
              <button
                onClick={() => dateKey && load(daily(dateKey))}
                disabled={busy || !dateKey}
                className={`py-3 hover:bg-paper-2 disabled:opacity-40 ${dailyCurrent ? "bg-ochre" : ""}`}
              >
                {dailyCurrent ? dict.reset : dict.load}
              </button>
              <button
                onClick={() => {
                  if (!dateKey) return;
                  openSolution(daily(dateKey));
                }}
                disabled={busy || !dateKey}
                className="border-l border-rule py-3 hover:bg-paper-2 disabled:opacity-40"
              >
                {dailyCurrent && showSolution ? dict.hideSolution : dict.showSolution}
              </button>
            </div>
          </div>
        </section>

        {/* 残局 */}
        <section className="border-t-2 border-ink py-10">
          <h2 className="display-cjk text-[clamp(32px,4vw,56px)]">{dict.endgames}</h2>
          <p className="prose-yf mt-4">{dict.endgamesDesc}</p>
          <ol className="mt-6 border-t-2 border-ink">
            {puzzles.map((p, i) => {
              const isCurrent = current?.id === p.id;
              return (
                <li key={p.id} className={`grid gap-3 border-b border-rule py-5 sm:grid-cols-[48px_1fr_auto] sm:items-center ${isCurrent ? "bg-paper-2" : ""}`}>
                  <span className="notation text-sm text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="text-lg font-bold">{p.title[locale]}</p>
                    <p className="mt-1 text-sm text-ink-2">{p.hint[locale]}</p>
                    <p className="mt-1 text-xs text-ink-3">
                      {p.solution.split(" ").length} {dict.stepsCount}
                    </p>
                  </div>
                  <div className="flex gap-2 text-sm font-bold">
                    <button
                      onClick={() => load({ id: p.id, title: p.title[locale], setup: p.setup, solution: p.solution })}
                      disabled={busy}
                      className={`btn-sign ${isCurrent ? "" : "btn-sign-outline"}`}
                    >
                      {isCurrent ? dict.reset : dict.load}
                    </button>
                    {isCurrent && (
                      <button disabled={busy} onClick={() => current && openSolution(current)} className="btn-sign btn-sign-outline">
                        {showSolution ? dict.hideSolution : dict.showSolution}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      {/* 吸顶魔方 */}
      <aside className="order-first sticky top-0 z-30 min-w-0 self-start lg:order-none lg:top-6">
        <div className="border-2 border-ink bg-paper">
          <div className="flex items-baseline justify-between gap-3 border-b-2 border-ink px-4 py-3">
            <p className="truncate text-sm font-bold">{current?.title ?? "…"}</p>
            <p className={`notation shrink-0 text-lg ${solved ? "bg-ochre px-1.5" : ""}`}>{fmt(elapsed)}</p>
          </div>
          <div className="ruled-fine relative h-[240px] sm:h-[400px]">
            <RubiksCube ref={cube} onBusyChange={onBusyChange} onUserMove={onUserMove} onReady={onReady} allowUserTurns={!showSolution} />
            {solved && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-3">
                <span className="bg-ink px-3 py-1 text-sm font-bold text-paper">
                  {dict.solved} · {moves} {dict.movesUnit}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between border-t-2 border-ink px-4 py-2 text-xs text-ink-3">
            <span>
              {dict.yourMoves} {moves} {dict.movesUnit}
            </span>
            <span className="hidden sm:inline">{dict.playHint}</span>
          </div>
          {showSolution && current && (
            <div className="border-t-2 border-ink p-4">
              <p className="text-sm" role="status">{locale === "zh" ? `逐步解答：已执行 ${solutionCursor}/${solutionTokens.length}。打开解答会重新摆好题目，每次点击只转一步，不计入独立解题成绩。` : `Step-by-step answer: ${solutionCursor}/${solutionTokens.length} completed. Opening the answer restores the puzzle setup. Each click makes one move; guided answers do not count as independent solves.`}</p>
              <p className="my-3 text-sm">{solutionCursor === solutionTokens.length ? (locale === "zh" ? "解答完成，魔方保留在完成状态。点击重置才会重新摆题。" : "Answer complete. The finished cube stays here until you reset it.") : describeTurn(solutionTokens[solutionCursor], locale === "zh")}</p>
              <p className="notation p-4 text-[16px] leading-7 sm:text-[18px]">{current.solution}</p>
              <button
                onClick={playSolution}
                disabled={busy || solutionCursor >= solutionTokens.length}
                className="flex items-center justify-center gap-2 bg-ink px-6 py-3 text-sm font-bold text-paper hover:bg-vermilion disabled:opacity-40"
              >
                {locale === "zh" ? "下一步" : "Next step"}: {solutionTokens[solutionCursor] ?? "✓"}
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
