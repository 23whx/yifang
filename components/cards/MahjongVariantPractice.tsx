"use client";

import { useRef, useState } from 'react';
import { getMahjongCourse } from '@/content/mahjong-variants';
import MahjongTile from './MahjongTile';

export default function MahjongVariantPractice({ slug, locale, supplementary = false }: { slug: string; locale: 'zh' | 'en'; supplementary?: boolean }) {
  const course = getMahjongCourse(slug);
  const [index, setIndex] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState(false);
  const [finished, setFinished] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const exercises = supplementary ? course?.supplementaryExercises : course?.exercises;
  if (!course || !exercises?.length) return null;
  const zh = locale === 'zh';
  const exercise = exercises[index];
  const completionId = `${slug}-${supplementary ? 'supplement' : 'core'}-complete`;
  const riichiPaid = slug === 'mahjong-riichi' && (index > 1 || (index === 1 && accepted));
  function restart() { setIndex(0); setAccepted(false); setError(false); setFinished(false); dialog.current?.close(); }
  return <section className="my-8 min-w-0 space-y-5 rounded-lg border-2 border-[#ae8550] bg-[#f3e7cd] p-4 text-[#392616] sm:p-6" aria-label={supplementary ? (zh ? '课后独立牌例练习' : 'Supplementary independent examples') : (zh ? '本规则跟做练习' : 'Ruleset-specific guided practice')}>
    <h2 className="text-2xl font-bold">{supplementary ? (zh ? '可选练习：逐例辨认等待与番种' : 'Optional practice: waits and scoring patterns') : (zh ? '手把手：完成这一副牌' : 'Guided practice: finish this hand')}</h2>
    {supplementary && <p className="leading-8">{zh ? '先完成基础清龙三步，再阅读上面的课后图解。本组每题会重新摆牌，不是同一局连续摸打；最后保留反例牌型供你复核，不表示宣告和牌。' : 'Complete the three-step Pure Straight exercise and read the supplementary diagrams above first. Each question resets the tiles: this is not one continuous hand. The final counterexample stays visible for review; completing it is not declaring a win.'}</p>}
    <p className="max-w-prose leading-8">{zh ? '这是固定教学案例，不是随机四人对战。每步先看牌和提示，再选择动作；选错不会改牌，选对后显示动作结果与原因，点击下一步才继续。' : 'This is a fixed teaching example, not a random four-player game. Inspect the tiles and choose an action. Wrong answers leave the hand unchanged. Correct answers show the result and reason; only Next step advances.'}</p>
    {slug === 'mahjong-riichi' && <p className="font-bold" aria-live="polite">{zh ? `你的教学点数：${riichiPaid ? 24000 : 25000}；桌上立直供托：${riichiPaid ? 1000 : 0}。不代表最终和牌结算。` : `Your teaching points: ${riichiPaid ? 24000 : 25000}; riichi pot: ${riichiPaid ? 1000 : 0}. This is not final win settlement.`}</p>}
    <p className="font-bold">{index+1}/{exercises.length} · {exercise.prompt[locale]}</p>
    {error&&exercise.hint&&<p role="status" className="leading-8">{zh?'提示：':'Hint: '}{exercise.hint[locale]}</p>}
    <p>{zh ? `${accepted ? '执行后' : '执行前'}手牌：${(accepted ? exercise.after : exercise.hand).length} 张` : `${accepted ? 'After' : 'Before'}: ${(accepted ? exercise.after : exercise.hand).length} tiles`}</p>
    <div className="flex flex-wrap gap-1">{(accepted ? exercise.after : exercise.hand).map((tile,i)=><MahjongTile key={`${index}-${i}-${tile}`} tile={tile} locale={locale}/>)}</div>
    <div className="flex flex-wrap gap-3">{exercise.choices.map((choice,i)=><button key={i} disabled={accepted || finished} className="btn-sign btn-sign-outline disabled:opacity-50" onClick={()=>{ if(i!==exercise.correct) {setError(true); return;} setAccepted(true);setError(false); }}>{choice[locale]}</button>)}</div>
    <div aria-live="polite" className="max-w-prose leading-8">{error && <p>{zh ? '这一步不对，牌没有改变。请再读本步提示，也可查看下方对应文字与配图。' : 'Not this action; the hand is unchanged. Read the prompt again or consult the illustrated lesson below.'}</p>}{accepted && <p>{exercise.explanation[locale]}</p>}</div>
    <div className="flex flex-wrap gap-3">
      <button disabled={!accepted || finished} className="btn-sign disabled:opacity-50" onClick={()=>{ if(index===exercises.length-1) {setFinished(true);dialog.current?.showModal();} else {setIndex(index+1);setAccepted(false);setError(false);} }}>{index===exercises.length-1 ? (zh ? '查看完成原因' : 'Review completion') : (zh ? '下一步' : 'Next step')}</button>
      <button className="btn-sign btn-sign-outline" onClick={restart}>{zh ? '重新练习' : 'Restart practice'}</button>
    </div>
    {finished && <p className="font-bold" role="status">{supplementary ? (zh ? '辨认练习完成，最后的反例保留在这里；不是一次和牌宣告。' : 'Recognition practice complete. The final counterexample remains; this is not a win declaration.') : (zh ? '本案例完成，完整牌型保留在这里。不是整场比赛获胜。' : 'Example complete. The finished hand stays here. This is not a match victory.')}</p>}
    <dialog ref={dialog} className="m-auto max-h-[85dvh] w-[min(92vw,600px)] overflow-y-auto rounded-lg border-2 border-[#ae8550] bg-[#f3e7cd] p-6 text-[#392616] backdrop:bg-black/60" aria-labelledby={completionId}>
      <h3 id={completionId} className="text-2xl font-bold">{supplementary ? (zh ? '辨认完成：复核最后的反例' : 'Recognition complete: review the counterexample') : (zh ? '练习完成：为什么可以和牌？' : 'Practice complete: why is this a legal win?')}</h3>
      <p className="my-5 leading-8">{exercises.at(-1)!.explanation[locale]}</p>
      <button className="btn-sign" onClick={()=>dialog.current?.close()}>{zh ? '明白了，保留完成牌型' : 'Understood; keep the finished hand'}</button>
    </dialog>
  </section>;
}
