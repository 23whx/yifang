"use client";
import { useEffect, useRef, useState } from 'react';
import { loadFfish } from '@/lib/board/ffish';
import { TacticsSession } from '@/lib/board/tactics-session';
import { VARIANTS } from '@/lib/board/variants';
import type { TacticalLesson } from '@/content/board/tactics';
import Board from './Board';
import ResultDialog from '@/components/ui/ResultDialog';

export default function TacticsPlayer({lessons,locale}:{lessons:TacticalLesson[];locale:'zh'|'en'}) {
  const [selected,setSelected]=useState(()=>Math.max(0,lessons.findIndex(l=>!l.replayOnly)));
  if(!lessons.length) return null;
  return <section className="mb-12 space-y-5 border-b-2 border-ink pb-10">
    <h2 className="text-2xl font-bold">{locale==='zh'?'动手残局与逐步讲解':'Hands-on tactics and annotated steps'}</h2>
    <p className="max-w-[68ch] text-sm leading-7">{locale==='zh'?'以下是原创教学局面，不是历史对局。先看胜利目标，再点击棋子与目标格；不知道怎么走时可以切换到讲解回放。':'These are authored teaching positions, not historical games. Read the goal, then select a piece and destination. Switch to the annotated replay whenever you need help.'}</p>
    <label className="block">{locale==='zh'?'选择残局':'Choose a position'}<select className="ml-3 max-w-full border border-ink p-3" value={selected} onChange={e=>setSelected(Number(e.target.value))}>{lessons.map((l,i)=><option key={l.id} value={i}>{l.title[locale]}</option>)}</select></label>
    <Position key={lessons[selected].id} lesson={lessons[selected]} locale={locale}/>
  </section>;
}
function Position({lesson,locale}:{lesson:TacticalLesson;locale:'zh'|'en'}) {
  const zh=locale==='zh', session=useRef<TacticsSession|null>(null);
  const [state,setState]=useState<ReturnType<TacticsSession['snapshot']>|null>(null);
  const [error,setError]=useState(false);
  const [loadAttempt,setLoadAttempt]=useState(0);
  useEffect(()=>{
    let cancelled=false;
    loadFfish().then(f=>{
      if(cancelled) return;
      const s=new TacticsSession(new f.Board(lesson.game,lesson.fen),lesson);
      try {
        const initial=s.snapshot();
        session.current=s; setState(initial);
      } catch(error) { s.close(); throw error; }
    }).catch(()=>{if(!cancelled)setError(true);});
    return ()=>{cancelled=true;session.current?.close();session.current=null;};
  },[lesson,loadAttempt]);
  const refresh=()=>{if(session.current)setState(session.current.snapshot());};
  const reset=(mode:'practice'|'replay')=>{session.current?.reset(mode);refresh();};
  const explanation=state?.mode==='replay' && state.cursor>0 ? lesson.line[state.cursor-1].explanation[locale] : '';
  const winReason=state?.lastMove===lesson.line[0].move ? lesson.line[0].explanation[locale] : (zh?'你走出了另一个合法将杀：对方正被将军，且没有任何合法解将着法，因此你获胜。示范走法不是唯一允许的答案。':'You found another legal checkmate: the opponent is in check with no legal reply. You win. The demonstration is not the only accepted answer.');
  return <div className="grid gap-6 lg:grid-cols-[minmax(0,580px)_minmax(0,1fr)]">
    <div className="min-w-0">
      <p className="mb-4 font-bold leading-7">{lesson.goal[locale]}</p>
      {error&&<button className="btn-sign mb-3" onClick={()=>{setError(false);setLoadAttempt(n=>n+1);}}>{zh?'重新加载本题':'Reload this position'}</button>}
      {state ? <Board spec={VARIANTS[lesson.game]} fen={state.fen} orientation="w" movable={state.mode==='practice'&&!state.attempted?state.turn:undefined} legalMoves={state.legal} checked={state.checked} lastMove={state.lastMove} locale={locale} onMove={m=>{session.current?.attempt(m);refresh();}}/> : <p role="status">{error?(zh?'规则或题目加载失败，请点击“重新加载本题”。':'Rules or position failed to load. Choose Reload this position.'):(zh?'正在加载规则…':'Loading rules…')}</p>}
    </div>
    <div className="space-y-4 leading-8">
      <h3 className="text-xl font-bold">{lesson.title[locale]}</h3><p>{lesson.introduction[locale]}</p>
      {!lesson.replayOnly && <p>{zh?'点击自己的棋子，再点击标出的目标格。':'Select your piece, then a highlighted destination. '}{lesson.game==='shogi' && (zh?'若要把吃来的棋子放回棋盘（打入），先点棋盘下方自己保管的棋子（持驹），再点目标格。':'To place a captured piece back on the board (a drop), first select it from your pieces in hand below the board, then choose a destination. ')}{zh?'每次尝试保留结果，点“重新尝试”才复位。':'Each attempt stays visible until you restart.'}</p>}
      <div className="flex flex-wrap gap-3">{!lesson.replayOnly && <button className="btn-sign" disabled={!state} onClick={()=>reset('practice')}>{zh?'重新尝试':'Try again'}</button>}<button className="btn-sign btn-sign-outline" disabled={!state} onClick={()=>reset('replay')}>{lesson.replayOnly?(zh?'回到棋谱起点':'Restart replay'):(zh?'查看讲解回放':'View annotated replay')}</button></div>
      {state?.mode==='replay' && <><p>{zh?`示范进度 ${state.cursor} / ${lesson.line.length}，不会自动走下一步。`:`Replay ${state.cursor} / ${lesson.line.length}; advances only when you click.`}</p><div className="flex flex-wrap gap-3"><button className="btn-sign btn-sign-outline" disabled={state.cursor===0} onClick={()=>{session.current?.step(-1);refresh();}}>{zh?'上一步':'Previous step'}</button><button className="btn-sign" disabled={state.cursor===lesson.line.length} onClick={()=>{session.current?.step(1);refresh();}}>{zh?'下一步':'Next step'}</button></div><p role="status">{explanation || (zh?'起始局面。先找出目标棋子，再点击下一步。':'Starting position. Find the target pieces, then click Next step.')}</p></>}
      {state?.attempted && !state.replyVisible && <p role="status">{state.won?winReason:state.inCheck?(zh?'这步将军了，但对方仍有合法应对，还不是将杀。观察棋盘后重新尝试，或查看讲解。':'This gives check, but the opponent still has a legal reply: not checkmate. Inspect the position, retry or view the explanation.'):(zh?'这步合法，但没有将杀对方。棋盘保留供你观察；可以重新尝试或查看讲解。':'This move is legal but does not checkmate. The position stays for inspection; retry or view the explanation.')}</p>}
      {state?.attempted && !state.won && (state.replyVisible || state.legal.length>0) && <div className="space-y-3">
        <button className="btn-sign btn-sign-outline" onClick={()=>{if(state.replyVisible)session.current?.hideReply();else session.current?.showReply();refresh();}}>{state.replyVisible?(zh?'返回我走完后的局面':'Return to my attempted position'):(zh?'看看对方怎样应对':'Show one opponent reply')}</button>
        <p role="status">{state.replyVisible
          ? (zh?'现在棋盘停在对方应对之后，高亮的是对方刚走的一步。对方完成这一步后，自己的王／将没有受攻击，所以你的上一步没有把它将死。这只是一种合法应对，不一定是最强走法；点击返回，可对照前后棋子位置。':'The board now stays after one opponent reply; that move is highlighted. The opponent’s king is safe after this legal move, so your attempt was not checkmate. This is one legal reply, not necessarily the strongest. Return to compare the positions.')
          : (zh?'“将死”不只是攻击到王／将，还必须让对方没有任何合法办法摆脱攻击。点击按钮只演示对方一步，不会自动继续；观察王／将是否移动，攻击它的棋子是否被吃，或攻击路线是否被挡住。':'Checkmate means attacking the king AND leaving no legal escape. The button shows just one reply and never continues automatically. Look for a king move, capture of an attacker, or a piece blocking the attack.')}</p>
      </div>}
      {state?.won && <ResultDialog locale={locale} title={zh?'残局挑战成功':'Tactic solved'} reason={winReason}/>}
    </div>
  </div>;
}
