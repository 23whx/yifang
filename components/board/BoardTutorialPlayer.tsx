"use client";

import { useEffect, useRef, useState } from "react";
import Board, { HAND_NAMES } from "./Board";
import { loadFfish, type Ffish } from "@/lib/board/ffish";
import { VARIANTS, parseUci, type BoardGame, type Side } from "@/lib/board/variants";
import type { LocalizedTutorial } from "@/content/tutorials";
import type { Dict } from "@/lib/i18n";
import PlayIcon from "@/components/ui/PlayIcon";
import ResultDialog from "@/components/ui/ResultDialog";

interface Props {
  game: BoardGame;
  tutorial: LocalizedTutorial;
  dict: Dict;
  locale: "zh" | "en";
}

interface Frame {
  fen: string;
  lastMove: string | null;
  checked: string[];
  san: string;
  legal: string[];
  side: Side;
}

/** 棋类教程：左侧长文，右侧吸顶棋盘按步骤摆出局面、逐着演示 */
export default function BoardTutorialPlayer({
  game,
  tutorial,
  dict,
  locale,
}: Props) {
  const spec = VARIANTS[game];
  const ffish = useRef<Ffish | null>(null);
  const [active, setActive] = useState(0);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [ply, setPly] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [stepMs, setStepMs] = useState(1800);
  const [practice, setPractice] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [completion, setCompletion] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const playAfterBuild = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const step = tutorial.steps[active];

  // 计算当前步骤的全部帧：初始局面 + 每一着之后的局面
  useEffect(() => {
    let alive = true;
    const build = (f: Ffish) => {
      const pos = tutorial.steps[active].position;
      // Text-only chapters still show a real reference setup, not a perpetual loader.
      const b = pos ? new f.Board(game, pos.fen) : new f.Board(game);
      try {
      const notation = f.Notation[spec.notation];
      const out: Frame[] = [
        { fen: b.fen(), lastMove: null, checked: b.checkedPieces().trim().split(' ').filter(Boolean), san: "", legal: b.legalMoves().split(" ").filter(Boolean), side: b.fen().split(" ")[1] as Side },
      ];
      for (const mv of pos?.moves ?? []) {
        const san = b.sanMove(mv, notation);
        if (!b.push(mv)) throw new Error('Invalid tutorial move');
        out.push({
          fen: b.fen(),
          lastMove: mv,
          checked: b.checkedPieces().trim().split(" ").filter(Boolean),
          san,
          legal: b.legalMoves().split(" ").filter(Boolean),
          side: b.fen().split(" ")[1] as Side,
        });
      }
      setFrames(out);
      setPly(0);
      if (playAfterBuild.current) {
        playAfterBuild.current = false;
        setPlaying(out.length > 1);
      }
      } finally { b.delete(); }
    };
      (ffish.current ? Promise.resolve(ffish.current) : loadFfish()).then((f) => {
        if (!alive) return;
        ffish.current = f;
        build(f);
      }).catch(() => {
        if (!alive) return;
        playAfterBuild.current = false;
        setPlaying(false); setFrames([]); setLoadError(true);
      });
    return () => {
      alive = false;
    };
  }, [active, game, tutorial, spec.notation, loadAttempt]);

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setPlaying(false);
  };

  useEffect(() => {
    if (!playing) return;
    timer.current = setTimeout(() => {
      setPly((p) => {
        const next = Math.min(p + 1, frames.length - 1);
        if (next >= frames.length - 1) setPlaying(false);
        return next;
      });
    }, stepMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [playing, ply, frames.length, stepMs]);

  const goTo = (i: number, autoplay = false) => {
    stop();
    setFeedback("");
    setCompletion(null);
    setLoadError(false); setFrames([]);
    setPractice(false);
    setLoadAttempt(n=>n+1);
    playAfterBuild.current = autoplay;
    setActive(i);
  };

  const play = () => {
    if (frames.length <= 1) return;
    setCompletion(null);
    setPly(0);
    setPractice(false);
    setPlaying(true);
  };

  const frame = frames[Math.min(ply, frames.length - 1)];
  const orientation: Side = "w";
  const hasDemo = (step.position?.moves?.length ?? 0) > 0;
  const nextMove = step.position?.moves?.[ply];
  const target = nextMove ? parseUci(nextMove) : null;
  const dropName = target?.drop ? `${HAND_NAMES[target.drop.toLowerCase()]?.[locale] ?? target.drop} (${target.drop.toUpperCase()})` : "";
  const promotionName = target?.suffix === "+" ? (locale === "zh" ? "升级（成）" : "Promote") : ({ q: locale === "zh" ? "后" : "Queen", r: locale === "zh" ? "车" : "Rook", b: locale === "zh" ? "象" : "Bishop", n: locale === "zh" ? "马" : "Knight" } as Record<string, string>)[target?.suffix ?? ""];
  const moveInstruction = !target ? "" : target.drop
    ? (locale === "zh" ? `先点棋盘旁持驹区中的“${dropName}”，再点空格 ${target.to}，完成打入。括号内是棋谱缩写；按钮显示棋子名称。持驹是之前吃到、现在可以为自己使用的棋子。` : `Select ${dropName} in the pieces-in-hand area, then empty square ${target.to} to drop it. The letter is notation shorthand; the button shows the piece name. Pieces in hand are captured pieces now available to you.`)
    : (locale === "zh" ? `先点 ${target.from} 上的棋子，再点 ${target.to}。字母找列、数字找行。${promotionName ? `弹出选项时请选择“${promotionName}”。` : game === "shogi" ? "如果弹出升级选项，本步选择不成（不升级）。" : ""}` : `Select the piece on ${target.from}, then ${target.to}. The letter finds the file, the number the rank. ${promotionName ? `Choose ${promotionName} in the promotion options.` : game === "shogi" ? "If asked about promotion, choose not to promote for this move." : ""}`);

  // Learners already know board coordinates; engine notation introduces unexplained abbreviations.
  const readableMove = (move: string) => {
    const parsed = parseUci(move);
    if (!parsed) return move;
    if (parsed.drop) {
      const name = HAND_NAMES[parsed.drop.toLowerCase()]?.[locale] ?? parsed.drop;
      return locale === "zh" ? `${name}打入 ${parsed.to}` : `Drop ${name} on ${parsed.to}`;
    }
    const route = `${parsed.from} → ${parsed.to}`;
    if (parsed.suffix === "+") return `${route} · ${locale === "zh" ? "升级（成）" : "promote"}`;
    const names: Record<string, string> = locale === "zh"
      ? {q:"后",r:"车",b:"象",n:"马"} : {q:"queen",r:"rook",b:"bishop",n:"knight"};
    return names[parsed.suffix ?? ""]
      ? `${route} · ${locale === "zh" ? "升变为" : "promote to "}${names[parsed.suffix!]}` : route;
  };

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(400px,480px)]">
      {completion && <ResultDialog title={locale === "zh" ? "本组练习完成" : "Exercise complete"} reason={completion} locale={locale} />}
      <div className="min-w-0">
        <nav className="mb-10 border-t-2 border-ink">
          <p className="pt-3 text-xs font-bold tracking-[0.18em] text-ink-3 uppercase">
            {dict.contents}
          </p>
          <ol className="mt-3 grid gap-x-8 sm:grid-cols-2">
            {tutorial.steps.map((s, i) => (
              <li key={s.id}>
                <button
                  onClick={() => goTo(i)}
                  className={`flex w-full items-baseline gap-3 border-b border-rule py-2 text-left text-sm transition hover:text-vermilion ${
                    i === active ? "font-bold text-vermilion" : "text-ink-2"
                  }`}
                >
                  <span className="notation w-6 text-xs">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {s.title}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        {tutorial.steps.map((s, i) => (
          <section
            key={s.id}
            id={`step-${s.id}`}
            className="scroll-mt-24 border-t-2 border-ink py-10"
          >
            <button onClick={() => goTo(i)} className="group block text-left">
              <span
                className={`display inline-block px-2 text-[44px] leading-none ${i === active ? "bg-ochre text-ink" : "text-[#86602f]"}`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="mt-3 text-[28px] font-bold leading-tight group-hover:text-vermilion sm:text-[34px]">
                {s.title}
              </h2>
            </button>
            <div className="prose-yf mt-6">
              {s.body.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
            </div>
            {s.position?.moves && s.position.moves.length > 0 && (
              <div className="mt-8 grid gap-4 border-2 border-ink sm:grid-cols-[1fr_auto]">
                <div className="p-5">
                  <p className="text-xs font-bold tracking-[0.18em] text-ink-3 uppercase">
                    {dict.board.demoMoves}
                  </p>
                  <p className="notation mt-2 text-[20px] text-ink sm:text-[24px]">
                    {i === active && frames.length > 1
                      ? frames.slice(1).map((f, k) => (
                          <span
                            key={k}
                            className={`mr-3 ${k + 1 === ply ? "bg-ochre" : k + 1 < ply ? "" : "text-ink-3"}`}
                          >
                            {readableMove(f.lastMove!)}
                          </span>
                        ))
                      : s.position.moves.map(readableMove).join(" / ")}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (i === active) play();
                    else {
                      goTo(i, true);
                    }
                  }}
                  className="flex items-center justify-center gap-2 bg-ink px-8 py-4 text-sm font-bold text-paper transition hover:bg-vermilion sm:min-w-[140px]"
                >
                  <PlayIcon /> {dict.demo}
                </button>
              </div>
            )}
          </section>
        ))}
      </div>

      <aside className="order-first self-start lg:sticky lg:order-none lg:top-6">
        <div className="border-2 border-ink bg-paper">
          <div className="flex items-baseline justify-between border-b-2 border-ink px-4 py-3">
            <p className="text-sm font-bold">
              <span className="notation mr-2 bg-ochre px-1.5 py-0.5 text-ink">
                {String(active + 1).padStart(2, "0")}
              </span>
              {step.title}
            </p>
            {frames.length > 1 && (
              <span className="notation text-xs text-ink-3">
                {ply}/{frames.length - 1}
              </span>
            )}
          </div>
          <div className="p-3 sm:p-4">
            {frame ? (
              <Board
                spec={spec}
                fen={frame.fen}
                orientation={orientation}
                lastMove={frame.lastMove}
                checked={frame.checked}
                locale={locale}
                movable={practice && ply < frames.length - 1 ? frame.side : undefined}
                legalMoves={practice ? frame.legal : []}
                onMove={(move) => {
                  if (move !== step.position?.moves?.[ply]) {
                    setFeedback(locale === "zh" ? "这是合法走法，但不是本例的教学路线。请按下方起点和终点再试；棋盘没有改变。" : "That is legal, but outside this example. Retry the indicated move; the board has not changed.");
                    return;
                  }
                  setPly(ply + 1);
                  if (ply + 1 === frames.length - 1) setCompletion(locale === "zh" ? `你已正确完成“${step.title}”的 ${frames.length - 1} 步指定着法。${frames.at(-1)!.legal.length === 0 && frames.at(-1)!.checked.length > 0 ? "最后局面中，轮到走的一方被将军且没有合法应对，因此是将死。" : "本题目标是执行并理解这组着法，不代表一整盘棋已经分出胜负。"}\n\n${step.body.join("\n")}` : `You completed all ${frames.length - 1} assigned moves in “${step.title}”. ${frames.at(-1)!.legal.length === 0 && frames.at(-1)!.checked.length > 0 ? "The final side to move is in check with no legal reply: checkmate." : "This exercise teaches the sequence; it does not necessarily end a full game."}\n\n${step.body.join("\n")}`);
                  setFeedback(locale === "zh" ? "完成这一着。观察起点、终点，再换另一方行动。" : "Move completed. Inspect the origin and destination, then take the other side's turn.");
                }}
              />
            ) : (
              <div
                className="grid place-items-center text-sm text-ink-3"
                style={{ aspectRatio: `${spec.files} / ${spec.ranks}` }}
              >
                {loadError ? <div role="alert" className="space-y-3"><p>{locale==='zh'?'规则加载或演示校验失败，未播放不完整棋谱。文字教程仍可阅读。':'Rules loading or demonstration validation failed. No incomplete replay is shown; the written lesson remains available.'}</p><button className="btn-sign" onClick={()=>{setLoadError(false);setLoadAttempt(n=>n+1);}}>{locale==='zh'?'重试当前演示':'Retry this demonstration'}</button></div> : dict.board.loading}
              </div>
            )}
          </div>
          {hasDemo && <div className="space-y-3 border-t border-rule p-4 text-sm leading-7">
            <button className="btn-sign" onClick={() => { stop(); setCompletion(null); setPractice(!practice); setPly(0); setFeedback(""); }}>{practice ? (locale === "zh" ? "切回观看模式" : "Switch to watching") : (locale === "zh" ? "我来走 · 从初始局面练习" : "Try the moves · Start from setup")}</button>
            {practice && <p>{ply >= frames.length - 1 ? (locale === "zh" ? "本组着法完成。试着用自己的话解释每一步。" : "Sequence complete. Explain each move in your own words.") : `${locale === "zh" ? `轮到${spec.sideName[frame?.side ?? "w"].zh}。` : `${spec.sideName[frame?.side ?? "w"].en} to move. `}${moveInstruction}`}</p>}
            <p role="status">{feedback}</p>
          </div>}
          <div className="grid grid-cols-3 border-t-2 border-ink text-sm font-bold">
            <button
              aria-label={locale === "zh" ? "退回一着" : "Previous move"}
              onClick={() => {
                stop();
                setPly((p) => Math.max(0, p - 1));
                setCompletion(null);
              }}
              disabled={!hasDemo || ply === 0}
              className="border-r border-rule py-3 hover:bg-paper-2 disabled:opacity-40"
            >
              ←
            </button>
            <button
              onClick={playing ? stop : play}
              disabled={!hasDemo}
              className="flex items-center justify-center gap-2 bg-ink py-3 text-paper hover:bg-vermilion disabled:opacity-40"
            >
              <PlayIcon /> {playing ? dict.board.pause : dict.demo}
            </button>
            <button
              aria-label={locale === "zh" ? "前进一着" : "Next move"}
              onClick={() => {
                stop();
                setPly((p) => Math.min(frames.length - 1, p + 1));
              }}
              disabled={!hasDemo || ply >= frames.length - 1}
              className="border-l border-rule py-3 hover:bg-paper-2 disabled:opacity-40"
            >
              →
            </button>
          </div>
          <div className="border-t border-rule px-4 py-3 text-sm leading-7">
            <p aria-live="polite">
              {hasDemo
                ? ply === 0
                  ? locale === "zh"
                    ? "先观察初始局面，再用左右箭头逐着核对；高亮表示刚移动的起点和终点。"
                    : "Inspect the starting position, then step through with the arrows. Highlights show the last move's origin and destination."
                  : `${locale === "zh" ? "当前着法" : "Current move"}: ${frame?.lastMove ? readableMove(frame.lastMove) : ""}`
                : locale === "zh"
                  ? step.position ? "本节展示静态图例，没有自动走子。可在后续规则演示中逐着观察。" : "本节先读文字；棋盘仅供对照标准开局摆法，不是本节案例。选择后面的演示章节，再按提示练习。"
                  : step.position ? "This section shows a static diagram. Later rule demonstrations include move-by-move playback." : "Read this section first. The board is a reference starting setup, not a case for this section. Select a later demonstration to practise its moves."}
            </p>
            {hasDemo && (
              <label>
                {locale === "zh" ? "每着停留时间 " : "Time per move "}
                <select
                  value={stepMs}
                  onChange={(e) => setStepMs(Number(e.target.value))}
                  className="border border-rule p-2"
                >
                  <option value={1000}>1 s</option>
                  <option value={1800}>1.8 s</option>
                  <option value={2800}>2.8 s</option>
                </select>
              </label>
            )}
          </div>
          <div className="flex justify-between border-t-2 border-ink text-sm font-bold">
            <button
              onClick={() => goTo(Math.max(0, active - 1))}
              disabled={active === 0}
              className="px-4 py-3 hover:text-vermilion disabled:opacity-30"
            >
              ← {dict.prevStep}
            </button>
            <button
              onClick={() =>
                goTo(Math.min(tutorial.steps.length - 1, active + 1))
              }
              disabled={active === tutorial.steps.length - 1}
              className="px-4 py-3 hover:text-vermilion disabled:opacity-30"
            >
              {dict.nextStep} →
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
