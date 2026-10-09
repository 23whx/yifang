"use client";
import { useState } from "react";
import RubiksCube from "./RubiksCube";

import { useManualSteps, describeTurn } from "./useManualSteps";

const tasks = [
  { zh: "从还原态开始。R 是右面顺时针四分之一圈，先亲手点 R。", en: "Start solved. R turns the right face clockwise one quarter-turn. Press R.", options: ["R", "U", "F"], answer: "R" },
  { zh: "右层已经转动。现在用反方向 R′ 撤销，不要转另一面。", en: "The right layer turned. Undo with R′, not a different face.", options: ["U'", "R'", "F'"], answer: "R'" },
  { zh: "已回到还原态。U2 是上层半圈，请点 U2；它相当于连续两个 U。", en: "Solved again. U2 turns the top layer halfway, equivalent to two U turns. Press U2.", options: ["U", "R2", "U2"], answer: "U2" },
  { zh: "再转上层半圈便回到原样。选择 U2；半圈的逆转仍可写 U2。", en: "Another half-turn of the top restores the cube. Choose U2; a half-turn is its own inverse.", options: ["F2", "U2", "R'"], answer: "U2" },
];
export default function CubeFirstPractice({ locale }: { locale: "zh" | "en" }) {
  const { cube, cursor: index, busy, ready, onReady, onBusyChange, move, prepare } = useManualSteps();
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const zh = locale === "zh", task = tasks[Math.min(index, tasks.length - 1)];
  return <section className="my-8 grid gap-6 rounded border-2 border-ink/30 bg-paper p-4 lg:grid-cols-2">
    <div className="h-[320px] min-w-0"><RubiksCube ref={cube} onReady={onReady} onBusyChange={onBusyChange} allowUserTurns={false} /></div>
    <div className="space-y-4 self-center leading-8">
      <h2 className="text-2xl font-bold">{zh ? "跟做：转动与逆转" : "Try it: turns and inverses"}</h2>
      <p>{zh ? "先保持视角不变，先选择答案，再点「下一步」转一层。拖动只改变观察角度。答错不会悄悄替你完成动作。" : "Keep the view steady and select an answer, then press Next step for one layer turn. Dragging changes only the view. Wrong answers do not silently complete a move."}</p>
      <p aria-live="polite">{index === tasks.length ? (zh ? "四步完成：R 和 R′ 互相撤销，两次 U2 也恢复原样。检查六个面，再进入下面的部件和公式课程。" : "Complete: R and R′ cancel, as do two U2 turns. Inspect all faces, then continue to the parts and notation lessons below.") : task[locale]}</p>
      <div className="flex flex-wrap gap-3">{task.options.map(option => <button key={option} className="btn-sign" disabled={!ready || busy || index === tasks.length} onClick={() => {
        if (option !== task.answer) { setSelected(""); setMessage(zh ? `这里需要 ${task.answer}。字母选面，撇号反转，2 表示半圈。请重试，魔方未改变。` : `Choose ${task.answer}: the letter selects a face, prime reverses it, and 2 means a half-turn. Retry; the cube has not changed.`); return; }
        setSelected(option); setMessage(zh ? "选对了。请点击「下一步」执行，魔方暂时保持不动。" : "Correct. Press Next step to execute; the cube has not moved yet.");
      }}>{option.replace("'", "′")}</button>)}</div>
      <p>{index < tasks.length ? describeTurn(task.answer, zh) : (zh ? "练习完成，结果停留在这里，不会自动重开。" : "Practice complete. The result stays here; it will not restart automatically.")}</p>
      <p role="status">{message}</p>
      <button className="btn-sign" disabled={!ready || busy || index === tasks.length || selected !== task.answer} onClick={() => { move(selected, index + 1); setSelected(""); setMessage(zh ? "只执行这一步，转完后停住。观察完成后再选择下一步的答案。" : "One move only, then stop. Observe before choosing the next answer."); }}>{zh ? "下一步" : "Next step"} ({Math.min(index + 1, tasks.length)}/{tasks.length})</button>
      <button className="btn-sign btn-sign-outline" disabled={!ready || busy} onClick={() => { prepare(); setSelected(""); setMessage(""); }}>{zh ? "重开四步练习" : "Restart the four steps"}</button>
    </div>
  </section>;
}
