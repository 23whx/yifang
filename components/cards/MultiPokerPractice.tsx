"use client";
import { useRef, useState } from 'react';
import { applyMultiRequest, multiView, newMultiSession, type MultiSession } from '@/lib/holdem-multi-session';
import { multiTeachingAction } from '@/lib/holdem-multi-teaching';
import type { Action } from '@/lib/holdem';
import MultiPokerTable from './MultiPokerTable';
export default function MultiPokerPractice({locale}:{locale:'zh'|'en'}) {
  const zh=locale==='zh',current=useRef<MultiSession|null>(null),[session,setSession]=useState<MultiSession|null>(null),[error,setError]=useState(''),[confirm,setConfirm]=useState(false);
  const publish=(s:MultiSession|null)=>{current.current=s;setSession(s);setError('');setConfirm(false);};
  function action(seat:number,a:Action) {const s=current.current;if(!s)return;try{publish(applyMultiRequest(s,seat,{hand:s.hand,revision:s.revision,action:a}));}catch{setError(zh?'这次操作或金额不合法。请按当前跟注额、最小加注额操作，或选择合法的全下。':'Invalid action or amount. Use the current call/minimum raise, or a legal all-in.');}}
  function next() {let s=current.current;if(!s?.table.over)return;try{const players=s.table.stacks.flatMap((v,i)=>v>0?[i]:[]);for(const seat of players)s=applyMultiRequest(s,seat,{hand:s.hand,revision:s.revision,action:{kind:'next'}});publish(s);}catch{setError(zh?'剩余有筹码的玩家不足两位，请结束后重开练习。':'Fewer than two funded players remain. End and restart practice.');}}
  return <section className="my-8 space-y-5 border-2 border-[#ae8550] bg-paper p-4 sm:p-6"><h2 className="text-2xl font-bold">{zh?'四人随机练习 · 你与三位电脑':'Four-player random practice · you and three computers'}</h2><p className="max-w-[68ch] leading-8">{zh?'每位从 200 教学筹码开始，小盲 5、大盲 10，无真实金钱、账号或抽水。你固定在座位 1。电脑只读取自己的底牌，是简单陪练，不代表高水平对手。为方便观察，每次点击“电脑行动一步”才推进一位电脑；不是自动演示或固定答案。':'Each seat starts with 200 teaching chips, blinds 5/10, no money, account or rake. You are seat 1. Computers see only their own cards and are simple practice opponents. Press “One computer action” to advance one opponent at a time; hands are random, not fixed demonstrations.'}</p>
    {!session?<button className="btn-sign" onClick={()=>publish(newMultiSession())}>{zh?'开始四人练习':'Start four-player practice'}</button>:<>
      <MultiPokerTable view={multiView(session,0)} locale={locale} onAction={a=>action(0,a)}/>
      {!session.table.over&&session.table.actor!==0&&<button className="btn-sign" onClick={()=>{const s=current.current;if(s&&!s.table.over&&s.table.actor!==0)action(s.table.actor,multiTeachingAction(multiView(s,s.table.actor)));}}>{zh?'电脑行动一步':'One computer action'}</button>}
      {session.table.over&&<button className="btn-sign" disabled={session.table.stacks.filter(v=>v>0).length<2} onClick={next}>{zh?'下一手：保留余额，电脑同意继续':'Next hand: retain balances; computers agree'}</button>}
      <button className="btn-sign btn-sign-outline ml-3" onClick={()=>{if(confirm)publish(null);else setConfirm(true);}}>{confirm?(zh?'确认结束并清空本次练习':'Confirm end and clear practice'):(zh?'结束练习':'End practice')}</button>
      {confirm&&<button className="btn-sign btn-sign-outline ml-3" onClick={()=>setConfirm(false)}>{zh?'取消':'Cancel'}</button>}
    </>}{error&&<p role="alert">{error}</p>}</section>;
}
