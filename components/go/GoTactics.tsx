"use client";
import { useState } from 'react';
import { goTactics, goReplay, setupGoTactic, type GoTactic } from '@/content/go-tactics';
import { pointAt, pointName } from '@/content/go-exercises';
import { group, playGo } from '@/lib/go/rules';
import GoBoard from './GoBoard';
import ResultDialog from '@/components/ui/ResultDialog';

export default function GoTactics({locale}:{locale:'zh'|'en'}) {
  const [selected,setSelected]=useState(0), lang=locale==='zh'?0:1;
  return <section className="mb-12 space-y-5 border-b-2 border-ink pb-10">
    <h2 className="text-2xl font-bold">{lang===0?'动手提子与讲解回放':'Capture practice and annotated replay'}</h2>
    <p className="max-w-[68ch] leading-8">{lang===0?'练习目标是在局部提走指定白棋，不是赢下一整盘。完整对局需要双方结束落子、核对死活并按所选规则计分；多提一子不等于自动获胜。':'These local exercises ask you to capture White, not win an entire game. Whole-game results require ending play, agreeing on dead stones and scoring under the selected rules. One capture is not an automatic win.'}</p>
    <label className="block">{lang===0?'选择练习':'Choose exercise'}<select className="ml-3 max-w-full border border-ink p-3" value={selected} onChange={e=>setSelected(Number(e.target.value))}>{goTactics.map((t,i)=><option key={t.id} value={i}>{t.title[lang]}</option>)}</select></label>
    <Exercise key={goTactics[selected].id} tactic={goTactics[selected]} locale={locale}/>
  </section>;
}
function Exercise({tactic,locale}:{tactic:GoTactic;locale:'zh'|'en'}) {
  const zh=locale==='zh',lang=zh?0:1;
  const [state,setState]=useState(()=>setupGoTactic(tactic));
  const [mode,setMode]=useState<'practice'|'replay'>(tactic.replayOnly?'replay':'practice');
  const [cursor,setCursor]=useState(0),[attempted,setAttempted]=useState(false),[error,setError]=useState('');
  const won=attempted&&state.captures[0]===tactic.captures&&tactic.white.every(p=>state.board[pointAt(p)]===0);
  const liberties=[...group(state.board,pointAt(tactic.white[0]),9).liberties].map(p=>pointName(p)).sort();
  function reset(next:'practice'|'replay') { setState(setupGoTactic(tactic));setMode(next);setCursor(0);setAttempted(false);setError(''); }
  function place(p:number) {
    if(mode!=='practice'||attempted) return;
    const next=playGo(state,p);
    if(!next.state) {setError(zh?'这里不能合法落子：可能已有棋子、落下后无气，或重复局面。棋盘没有变化，请选其它空点。':'Illegal placement: occupied, suicide or repeated position. The board is unchanged; choose another empty point.');return;}
    setState(next.state);setAttempted(true);setError('');
  }
  function step(next:number) {
    if(mode!=='replay'||next<0||next>tactic.line.length)return;
    setState(goReplay(tactic,next));setCursor(next);
  }
  const explanation=mode==='replay'&&cursor>0?tactic.line[cursor-1].explanation[lang]:'';
  const reason=tactic.line[tactic.line.length-1].explanation[lang]+(zh?' 这是练习成功，不是整局胜利。':' This completes the exercise, not the whole game.');
  return <div className="grid gap-6 lg:grid-cols-[minmax(0,580px)_minmax(0,1fr)]">
    <div className="min-w-0"><p className="mb-4 font-bold leading-7">{zh?`目标：提走局部 ${tactic.captures} 枚白子。`:`Goal: capture ${tactic.captures} local white stone(s).`}</p><GoBoard state={state} locale={locale} disabled={mode==='replay'||attempted} onPoint={place}/></div>
    <div className="space-y-4 leading-8">
      <h3 className="text-xl font-bold">{tactic.title[lang]}</h3>
      <p>{zh?'字母表示竖列，数字表示横排，例如 E5 是 E 列与第 5 排的交叉点。点击空交叉点落子，不是点击方格。气只算横竖相邻空点；相连棋子共享气，斜角不算。':'Letters label columns and numbers label rows: E5 is their intersection. Place on an empty intersection, not inside a square. Liberties are orthogonally adjacent empty points, shared by connected stones; diagonals do not count.'}</p>
      <p role="status">{zh?`以 ${tactic.white[0]} 为起点的白棋块：${liberties.length} 口气${liberties.length?'，位于 '+liberties.join('、'):'（已被提走）'}。黑方已提 ${state.captures[0]} 子。`:`White string at ${tactic.white[0]}: ${liberties.length} liberties${liberties.length?' at '+liberties.join(', '):' (captured)'}. Black has captured ${state.captures[0]}.`}</p>
      <div className="flex flex-wrap gap-3">{!tactic.replayOnly&&<button className="btn-sign" onClick={()=>reset('practice')}>{zh?'重新尝试':'Try again'}</button>}<button className="btn-sign btn-sign-outline" onClick={()=>reset('replay')}>{zh?'从头看讲解':'Replay from start'}</button></div>
      {mode==='replay'&&<><p>{zh?`回放 ${cursor} / ${tactic.line.length}，点击才走下一步。`:`Replay ${cursor} / ${tactic.line.length}; click to advance.`}</p><div className="flex flex-wrap gap-3"><button className="btn-sign btn-sign-outline" disabled={cursor===0} onClick={()=>step(cursor-1)}>{zh?'上一步':'Previous step'}</button><button className="btn-sign" disabled={cursor===tactic.line.length} onClick={()=>step(cursor+1)}>{zh?'下一步':'Next step'}</button></div><p role="status">{explanation||(zh?'先数白棋的气，再点击下一步。':'Count White’s liberties before clicking Next.')}</p></>}
      {error&&<p role="alert">{error}</p>}
      {attempted&&<p role="status">{won?reason:(zh?'落子合法，但没有完成提子目标。看看白棋还剩哪些气，再重新尝试。':'Legal move, but the capture goal is unmet. Inspect White’s remaining liberties and retry.')}</p>}
      {won&&<ResultDialog locale={locale} title={zh?'提子练习成功':'Capture exercise complete'} reason={reason}/>}
    </div>
  </div>;
}
