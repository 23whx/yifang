"use client";
import { useEffect, useState } from "react";
import {
  chooseGoMove,
  group,
  newGo,
  playGo,
  scoreGo,
  type GoState,
} from "@/lib/go/rules";
import GoBoard from "./GoBoard";
import ResultDialog from "@/components/ui/ResultDialog";
export default function GoGame({ locale }: { locale: "zh" | "en" }) {
  const zh = locale === "zh";
  const [stack, setStack] = useState<GoState[]>([newGo()]),
    [mode, setMode] = useState("ai"),
    [error, setError] = useState(""),
    [dead, setDead] = useState<number[]>([]),
    [confirmed, setConfirmed] = useState(false);
  const s = stack[stack.length - 1],
    review = s.passes >= 2,
    thinking = mode === "ai" && s.turn === 2 && !review;
  function move(p: number | null) {
    const r = playGo(s, p);
    if (r.state) {
      setStack((v) => [...v, r.state!]);
      setError("");
    } else
      setError(
        zh
          ? {
              occupied: "此点已有棋子。",
              suicide: "不能自杀：这块棋没有气。",
              ko: "劫：不能重现之前的棋盘。",
              finished: "正在确认终局。",
            }[r.error!]
          : `Illegal move: ${r.error}`,
      );
  }
  useEffect(() => {
    if (!thinking) return;
    const timer = setTimeout(() => {
      const r = playGo(s, chooseGoMove(s));
      if (r.state)
        setStack((v) => (v[v.length - 1] === s ? [...v, r.state!] : v));
    }, 450);
    return () => clearTimeout(timer);
  }, [s, thinking]);
  function reset(size = s.size, nextMode = mode) {
    setStack([newGo(size)]);
    setDead([]);
    setConfirmed(false);
    setError("");
    setMode(nextMode);
  }
  const score = scoreGo(s, dead);
  const blackStones = s.board.filter((v, i) => v === 1 && !dead.includes(i)).length;
  const whiteStones = s.board.filter((v, i) => v === 2 && !dead.includes(i)).length;
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,640px)_1fr]">
      {confirmed && <ResultDialog locale={locale} title={zh ? `${score.black > score.white ? "黑" : "白"}方获胜 · 领先 ${Math.abs(score.black-score.white)} 分` : `${score.black > score.white ? "Black" : "White"} wins by ${Math.abs(score.black-score.white)}`} reason={zh ? `确认死子后采用面积计分：\n黑：${blackStones} 枚活子＋${score.black-blackStones} 个独占空点＝${score.black}。\n白：${whiteStones} 枚活子＋${score.white-whiteStones-7.5} 个独占空点＋7.5 贴目＝${score.white}。\n总分较高的一方获胜。提掉的棋子不再额外加分，双方不能独占的空点不计分。` : `Area scoring after dead-stone confirmation:\nBlack: ${blackStones} stones + ${score.black-blackStones} enclosed points = ${score.black}.\nWhite: ${whiteStones} stones + ${score.white-whiteStones-7.5} enclosed points + 7.5 komi = ${score.white}.\nThe higher total wins. Do not add captures again; neutral points score for neither.`} />}
      <GoBoard
        state={s}
        locale={locale}
        dead={dead}
        disabled={thinking || confirmed}
        onPoint={(p) => {
          if (review) {
            if (!s.board[p]) return;
            const stones = [...group(s.board, p, s.size).stones];
            setDead((v) =>
              v.includes(p)
                ? v.filter((x) => !stones.includes(x))
                : [...new Set([...v, ...stones])],
            );
          } else move(p);
        }}
      />
      <div className="space-y-5">
        <p role="status" className="border-2 border-ink p-4 font-bold">
          {confirmed
            ? zh
              ? `黑 ${score.black} · 白 ${score.white}，${score.black > score.white ? "黑" : "白"}胜`
              : `Black ${score.black} · White ${score.white}, ${score.black > score.white ? "Black" : "White"} wins`
            : review
              ? zh
                ? "双方停一手：请确认死子"
                : "Both passed: review dead stones"
              : thinking
                ? zh
                  ? "白方思考中…"
                  : "White is thinking…"
                : zh
                  ? `${s.turn === 1 ? "黑" : "白"}方落子`
                  : `${s.turn === 1 ? "Black" : "White"} to play`}
        </p>
        <div className="flex flex-wrap gap-2">
          {["ai", "local"].map((m) => (
            <button
              key={m}
              className={`btn-sign ${mode === m ? "" : "btn-sign-outline"}`}
              onClick={() => reset(s.size, m)}
            >
              {m === "ai"
                ? zh
                  ? "入门人机"
                  : "Beginner AI"
                : zh
                  ? "同屏双人"
                  : "Local two-player"}
            </button>
          ))}
        </div>
        <label className="block">
          {zh ? "棋盘大小" : "Board size"}{" "}
          <select
            className="border p-2"
            value={s.size}
            onChange={(e) => reset(Number(e.target.value))}
          >
            {[9, 13, 19].map((n) => (
              <option key={n} value={n}>
                {n} × {n}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm leading-7">
          {zh
            ? "面积计分 · 白贴 7.5 目 · 禁自杀 · 局面超级劫。AI 是用于入门练习的轻量对手。"
            : "Area scoring · 7.5 komi · No suicide · Positional superko. The lightweight AI is intended for beginner practice."}
        </p>
        {error && <p role="alert">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button
            className="btn-sign"
            disabled={thinking || review}
            onClick={() => move(null)}
          >
            {zh ? "停一手" : "Pass"}
          </button>
          <button
            className="btn-sign btn-sign-outline"
            disabled={stack.length < 2 || thinking || confirmed}
            onClick={() => {
              setStack((v) =>
                v.slice(0, Math.max(1, v.length - (mode === "ai" ? 2 : 1))),
              );
              setDead([]);
              setError("");
            }}
          >
            {zh ? "悔棋" : "Undo"}
          </button>
          <button className="btn-sign btn-sign-outline" onClick={() => reset()}>
            {zh ? "新局" : "New game"}
          </button>
        </div>
        {review && !confirmed && (
          <div className="border border-ink p-4 space-y-4">
            <p className="text-sm leading-7">
              {zh
                ? "死棋是双方同意无法救活、计分前移除的棋子。点击一枚会标记整块相连棋子，再点一次取消；有争议就继续下，不要靠猜。"
                : "Dead stones are groups both players agree cannot be saved and should be removed before scoring. Click a stone to mark its connected group; click again to cancel. If you disagree, resume play instead of guessing."}
            </p>
            <p className="text-sm font-bold" aria-live="polite">
              {zh ? "计分预览：黑方 " : "Score preview: Black "}{score.black}{zh ? " 分；白方 " : " points; White "}{score.white}{zh ? " 分（已含 7.5 分贴目）。这还不是最终结果。" : " points (including 7.5 komi). This is not the final result yet."}
            </p>
            <button className="btn-sign" onClick={() => setConfirmed(true)}>
              {zh ? "确认计分" : "Confirm score"}
            </button>
            <button
              className="btn-sign btn-sign-outline"
              onClick={() => {
                setStack((v) => [...v, { ...s, passes: 0 }]);
                setDead([]);
              }}
            >
              {zh ? "有争议，继续下" : "Resume play"}
            </button>
          </div>
        )}
        <p className="text-xs text-ink-3">
          {zh ? "已提子：黑" : "Captures: Black"} {s.captures[0]} ·{" "}
          {zh ? "白" : "White"} {s.captures[1]}
        </p>
        <button
          className="underline text-sm"
          onClick={() => {
            const letters = "abcdefghijklmnopqrstuvwxyz";
            const moves = stack
              .slice(1)
              .filter(
                (v, i) =>
                  v.board !== stack[i].board || v.passes > stack[i].passes,
              )
              .map(
                (v, i) =>
                  `;${i % 2 === 0 ? "B" : "W"}[${v.last === null ? "" : letters[v.last % s.size] + letters[Math.floor(v.last / s.size)]}]`,
              )
              .join("");
            const url = URL.createObjectURL(
              new Blob(
                [
                  `(;GM[1]FF[4]SZ[${s.size}]KM[7.5]RU[Area; positional superko]${moves})`,
                ],
                { type: "application/x-go-sgf" },
              ),
            );
            const a = document.createElement("a");
            a.href = url;
            a.download = "yifang-go.sgf";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          {zh ? "下载棋谱 SGF" : "Download SGF"}
        </button>
      </div>
    </div>
  );
}
