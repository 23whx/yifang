"use client";

import { useState } from "react";
import RubiksCube from "./RubiksCube";
import { invertAlg } from "@/lib/cube/alg";
import type { LocalizedTutorial } from "@/content/tutorials";
import type { Dict } from "@/lib/i18n";
import { useManualSteps, describeTurn } from "./useManualSteps";
import CubeFaceGuide from './CubeFaceGuide';

interface Props {
  tutorial: LocalizedTutorial;
  dict: Dict;
  locale: "zh" | "en";
}

export default function TutorialPlayer({ tutorial, dict, locale }: Props) {
  const { cube, cursor, busy, ready, prepare, move, onReady, onBusyChange } = useManualSteps();
  const [active, setActive] = useState(0);
  const [restoring, setRestoring] = useState(false);
  const step = tutorial.steps[active];
  const forward = step.alg?.trim().split(/\s+/).filter(Boolean) ?? [];
  const reverse = step.alg ? invertAlg(step.alg).split(/\s+/) : [];
  const tokens = restoring ? [...forward, ...reverse] : forward;
  const zh = locale === "zh";
  const fromSolved = ["notation", "cube-first-lesson", "patterns"].includes(tutorial.slug);
  const orientation = tutorial.slug.startsWith('cfop') || tutorial.slug === 'beginner-lbl' ? 'yellow-up' : 'white-up';
  const setup = (alg?: string) => alg && !fromSolved ? invertAlg(alg) : "";
  const goTo = (i: number) => {
    if (!ready || busy || !prepare(setup(tutorial.steps[i].alg))) return;
    setActive(i);
    setRestoring(false);
  };
  const setupCase = () => { if (ready && !busy && prepare(setup(step.alg))) setRestoring(false); };

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(400px,480px)]">
      {/* 目录 + 正文：刊物式长文 */}
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
                className={`display inline-block px-2 text-[64px] leading-none ${i === active ? "bg-ochre text-ink" : "text-ink"}`}
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
            {s.alg && (
              <div className="mt-8 grid gap-4 border-2 border-ink sm:grid-cols-[1fr_auto]">
                <div className="p-5">
                  <p className="text-xs font-bold tracking-[0.18em] text-ink-3 uppercase">
                    {dict.algLabel}
                  </p>
                  <p className="notation mt-2 text-[28px] text-ink sm:text-[34px]">
                    {s.alg}
                  </p>
                  {s.algNote && (
                    <p className="mt-2 text-sm text-ink-2">{s.algNote}</p>
                  )}
                </div>
                <button
                  onClick={() => goTo(i)}
                  disabled={!ready || busy}
                  className="flex items-center justify-center gap-2 bg-ink px-8 py-4 text-sm font-bold text-paper transition hover:bg-vermilion sm:min-w-[140px]"
                >
                  {zh ? "选择此案例（不自动播放）" : "Select case (manual steps)"}
                </button>
              </div>
            )}
          </section>
        ))}
      </div>

      {/* 吸顶魔方：纸白格线板 */}
      <aside className="order-first min-w-0 self-start lg:sticky lg:order-none lg:top-6">
        <div className="border-2 border-ink bg-paper">
          <div className="flex items-baseline justify-between border-b-2 border-ink px-4 py-3">
            <p className="text-sm font-bold">
              <span className="notation mr-2 bg-ochre px-1.5 py-0.5 text-ink">
                {String(active + 1).padStart(2, "0")}
              </span>
              {step.title}
            </p>
            {busy && (
              <span className="text-xs text-ink-3">{dict.playing}…</span>
            )}
          </div>
          <div className="ruled-fine h-[240px] sm:h-[400px]">
            <RubiksCube ref={cube} colorOrientation={orientation} onReady={() => { onReady(); prepare(setup(step.alg)); }} onBusyChange={onBusyChange} allowUserTurns={false} />
          </div>
          {orientation === 'yellow-up' && <p className="border-t border-rule p-4 text-sm leading-7">{zh ? '本课固定拿法：黄中心朝上、白中心朝下、绿中心朝前、橙中心朝右。按中心颜色判断方向，不按角块颜色判断。' : 'Fixed grip: yellow center up, white down, green front, orange right. Centers identify the faces, not corner colors.'}</p>}
          <CubeFaceGuide algorithm={`${setup(step.alg)} ${tokens.slice(0,cursor).join(' ')}`} orientation={orientation} locale={locale}/>
          {step.alg && (
            <div className="border-t border-rule p-4 text-sm leading-7">
              <p>
                {fromSolved
                  ? zh
                    ? "本案例从还原态开始。每次只转一步；图案案例的终点是图案，不会自动还原。"
                    : "Starts solved. Each click makes one move; pattern cases finish on the pattern, with no automatic reset."
                  : zh
                    ? "公式摆例：由该公式的逆序构造，只说明这一特定局面；不代表任意打乱都适用。"
                    : "This case is constructed using the inverse algorithm. It demonstrates one specific setup, not every scramble."}
              </p>
              {restoring && <p className="font-bold">{zh ? "反向还原：倒着读原公式，并反转每一步方向；半圈仍是半圈。" : "Undo: read the original moves backwards and reverse each direction; half-turns stay half-turns."}<br/><span className="notation">{reverse.join(' ')}</span></p>}
              <p className="font-bold" aria-live="polite">
                {busy
                  ? zh
                    ? "正在转动；已完成"
                    : "Turning; completed"
                  : zh
                    ? "已执行"
                    : "Applied"}{" "}
                {restoring ? cursor - forward.length : cursor}/{restoring ? reverse.length : tokens.length} ·{" "}
                {cursor === (restoring ? forward.length : 0)
                  ? zh
                    ? "初始局面"
                    : "Initial position"
                  : tokens[cursor - 1]}
              </p>
              <p>{describeTurn(tokens[cursor], zh)}</p>
              {cursor === tokens.length && !busy && <p role="status" className="font-bold">{restoring
                ? (zh ? "反向还原完成：六个面各自为同一种颜色。结果保留，不会自动重开。" : "Undo complete: each of the six faces has one color. The result stays here.")
                : (zh ? "案例完成，结果保留。" : "Case complete; the result stays here.")}</p>}
              {!restoring && cursor === forward.length && !busy && (fromSolved
                ? <button className="btn-sign my-2" disabled={!ready} onClick={() => setRestoring(true)}>{zh ? "学习反向还原（点击后仍需逐步操作）" : "Learn to undo (manual steps)"}</button>
                : <p>{zh ? "本案例已经还原为六面纯色，无需反向操作。反着执行会回到原先的打乱局面；重新开始可再次练习正向还原。" : "This case is already solved. Reversing it would scramble it again. Restart to practise the solution again."}</p>)}
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn-sign btn-sign-outline"
                  disabled={!ready || busy || cursor === (restoring ? forward.length : 0)}
                  onClick={() => move(invertAlg(tokens[cursor - 1]), cursor - 1)}
                >
                  {zh ? "退一步" : "Back one"}
                </button>
                <button
                  className="btn-sign"
                  disabled={!ready || busy || cursor >= tokens.length}
                  onClick={() => move(tokens[cursor], cursor + 1)}
                >
                  {zh ? "下一步" : "Next step"}: {tokens[cursor] ?? "✓"}
                </button>
              </div>
            </div>
          )}
          <div className="border-t-2 border-ink p-4">
            <button onClick={setupCase} disabled={!ready || busy} className="btn-sign btn-sign-outline">{zh ? "重新开始" : "Restart"}</button>
            <p className="mt-3 text-sm">{zh ? "点击「下一步」才会执行下一次转动。拖动仅改变观察角度，不会转乱魔方。选章节只摆出起点，不会播放公式。" : "Only Next step executes a move. Dragging changes the viewing angle, not the layers. Selecting a section prepares its starting position without playing it."}</p>
          </div>
          <div className="flex justify-between border-t-2 border-ink text-sm font-bold">
            <button
              onClick={() => goTo(Math.max(0, active - 1))}
              disabled={!ready || busy || active === 0}
              className="px-4 py-3 hover:text-vermilion disabled:opacity-30"
            >
              ← {zh ? "上一节" : "Previous section"}
            </button>
            <button
              onClick={() =>
                goTo(Math.min(tutorial.steps.length - 1, active + 1))
              }
              disabled={!ready || busy || active === tutorial.steps.length - 1}
              className="px-4 py-3 hover:text-vermilion disabled:opacity-30"
            >
              {zh ? "下一节" : "Next section"} →
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
