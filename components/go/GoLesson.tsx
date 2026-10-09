"use client";
import { useState } from "react";
import GoBoard from "./GoBoard";
import ResultDialog from "@/components/ui/ResultDialog";
import { playGo, group } from "@/lib/go/rules";
import {
  goExercises,
  setupGoExercise,
  pointAt,
  pointName,
} from "@/content/go-exercises";
export default function GoLesson({ locale }: { locale: "zh" | "en" }) {
  const zh = locale === "zh",
    lang = zh ? 0 : 1;
  const [index, setIndex] = useState(0),
    [state, setState] = useState(() => setupGoExercise(goExercises[0]));
  const [done, setDone] = useState(false),
    [message, setMessage] = useState("");
  const [marks, setMarks] = useState<number[]>([]),
    [completed, setCompleted] = useState<string[]>([]);
  const exercise = goExercises[index];
  function choose(i: number) {
    setIndex(i);
    setState(setupGoExercise(goExercises[i]));
    setDone(false);
    setMessage("");
    setMarks([]);
  }
  function act(p: number) {
    if (done) return;
    if (p !== pointAt(exercise.target)) {
      setMessage(
        zh
          ? `你点的是 ${pointName(p)}。本例请点击 ${exercise.target}。`
          : `You chose ${pointName(p)}. Choose ${exercise.target} for this example.`,
      );
      return;
    }
    if (exercise.category === "liberties") {
      const liberties = [...group(state.board, p, 9).liberties].sort(
        (a, b) => a - b,
      );
      setMarks(liberties);
      setMessage(
        zh
          ? `共 ${liberties.length} 口气：${liberties.map((p) => pointName(p)).join("、")}。棋盘上已编号，同一空点只数一次。`
          : `${liberties.length} liberties: ${liberties.map((p) => pointName(p)).join(", ")}. Numbered on the board; count each once.`,
      );
    } else {
      const r = playGo(state, p);
      if (r.state) {
        setState(r.state);
        setMarks([...group(r.state.board, p, 9).liberties]);
        setMessage(
          zh
            ? `落子合法，提走 ${r.state.captures[0]} 枚白子。绿圈标出落子后黑棋的气。`
            : `Legal: captured ${r.state.captures[0]} White stones. Green markers show Black's resulting liberties.`,
        );
      } else
        setMessage(
          zh
            ? "落子被拒绝：没有气且不能提子。棋盘和轮次保持不变。"
            : "Rejected: no liberties and no capture. Board and turn stay unchanged.",
        );
    }
    setDone(true);
    setCompleted((v) => (v.includes(exercise.id) ? v : [...v, exercise.id]));
  }
  return (
    <section className="go-lesson">
      {done && <ResultDialog locale={locale} title={zh ? "本题完成（不是整盘获胜）" : "Exercise completed (not a full-game win)"} reason={`${message}\n\n${exercise.explanation[lang]}`} />}
      <h2>
        {zh
          ? "动手学围棋：14 个分解案例"
          : "Learn by doing: 14 guided examples"}
      </h2>
      <p>
        {zh
          ? "先读坐标：字母从左到右，数字从下到上。A8 是 A 列与第 8 行的交点，也就是左边第一列、从上往下第二个点。本站跳过字母 I，H 后是 J。棋子落在交叉点，不在格子里。"
          : "Letters run left to right; numbers bottom to top. A8 is the leftmost column, second point from the top on this 9×9 board. I is skipped: H is followed by J. Play on intersections, not inside squares."}
      </p>
      <nav
        className="go-lesson-tabs"
        aria-label={zh ? "练习主题" : "Exercise topics"}
      >
        {(["liberties", "capture", "suicide"] as const).map((category, i) => (
          <button
            key={category}
            aria-pressed={exercise.category === category}
            onClick={() =>
              choose(goExercises.findIndex((e) => e.category === category))
            }
          >
            {
              (zh
                ? ["数气与连接 · 6 例", "提子 · 4 例", "禁自杀与反例 · 4 例"]
                : ["Liberties · 6", "Captures · 4", "Suicide & exception · 4"])[
                i
              ]
            }
          </button>
        ))}
      </nav>
      <p>
        <a className="underline" href={`#step-${{ liberties: 'groups-liberties', capture: 'captures', suicide: 'legality' }[exercise.category]}`}>
          {zh ? "还不懂本组规则？先读对应文字，再回到顶部的跟做练习。" : "New to this rule? Read its explanation first, then return to guided practice at the top."}
        </a>
      </p>
      <div className="go-lesson-layout">
        <div>
          <label className="go-case-select">
            {zh ? "选择案例" : "Choose an example"}
            <select
              value={index}
              onChange={(e) => choose(Number(e.target.value))}
            >
              {goExercises.map((e, i) => (
                <option key={e.id} value={i}>
                  {i + 1}. {e.title[lang]}
                  {completed.includes(e.id) ? " ✓" : ""}
                </option>
              ))}
            </select>
          </label>
          <h3>
            {index + 1}. {exercise.title[lang]}
          </h3>
          <ol>
            <li>
              {zh
                ? "观察：先找黑白棋子，沿横竖方向检查空点。"
                : "Observe the stones and orthogonally adjacent empty points."}
            </li>
            <li>
              {exercise.category === "liberties"
                ? zh
                  ? `预测：${exercise.target} 所在棋块有几口气？先自己数，再点击显示编号。`
                  : `Predict the liberties of ${exercise.target}, then click it to reveal them.`
                : zh
                  ? `预测：黑在 ${exercise.target} 落子是否合法，会提走几子？想好后点击该点。`
                  : `Predict whether Black can play ${exercise.target} and how many stones it captures, then click it.`}
            </li>
            <li>
              {zh
                ? "验证后读解释；重置可回到落子前对照。"
                : "Read the explanation, then reset to compare the starting position."}
            </li>
          </ol>
          <p role="status" className="go-feedback">
            {message ||
              (zh
                ? "等待你尝试；这是指定一步的教学局面，不是自由对局。"
                : "Ready for your attempt. This is a one-step exercise, not a free game.")}
          </p>
          {done && (
            <div className="go-explanation">
              <h4>{zh ? "为什么？" : "Why?"}</h4>
              <p>{exercise.explanation[lang]}</p>
            </div>
          )}
          <div className="go-lesson-actions">
            <button onClick={() => choose(index)}>
              {zh ? "重置本例" : "Reset example"}
            </button>
            <button disabled={index === 0} onClick={() => choose(index - 1)}>
              {zh ? "上一例" : "Previous"}
            </button>
            <button
              disabled={index === goExercises.length - 1}
              onClick={() => choose(index + 1)}
            >
              {zh ? "下一例" : "Next"}
            </button>
          </div>
          <p>
            {zh
              ? `本次已完成 ${completed.length} / ${goExercises.length} 例`
              : `Completed ${completed.length} / ${goExercises.length}`}
          </p>
        </div>
        <div>
          <GoBoard
            state={state}
            locale={locale}
            onPoint={act}
            marks={marks}
            target={pointAt(exercise.target)}
          />
          <p className="go-board-caption">
            {zh
              ? "金框：操作点；绿圈数字：不同的气。每例都是黑先。"
              : "Gold outline: target. Green numbers: distinct liberties. Black to play."}
          </p>
        </div>
      </div>
    </section>
  );
}
