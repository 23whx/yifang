'use client';
import {useEffect,useRef,useState} from 'react';
import {RiichiSession,type RiichiSummary} from '@/lib/mahjong/riichi-session';
import type {RiichiDecision,RiichiSeatView,RiichiChoice} from '@/lib/mahjong/riichi-player';
import {fromRiichiTile} from '@/lib/mahjong/riichi-score';
import MahjongTile,{mahjongTiles} from './MahjongTile';
import ResultDialog from '@/components/ui/ResultDialog';
import {riichiTileCodes as codes,explainRiichiAwards,explainRiichiDraw} from '@/lib/mahjong/presentation';
import type {RiichiRoomPayload} from '@/lib/mahjong/riichi-room';
import {tileEnglish} from '@/content/guided-tables';
export type RiichiRemoteSource={subscribe:(listener:(payload:RiichiRoomPayload)=>void)=>()=>void;submit:(revision:number,choice:string)=>boolean};

function tileName(code:string){return mahjongTiles[fromRiichiTile(code.slice(0,2))];}

export default function RiichiPractice({locale,remote}:{locale:'zh'|'en';remote?:RiichiRemoteSource}){
  const zh=locale==='zh',session=useRef<RiichiSession|null>(null);
  const [view,setView]=useState<RiichiSeatView>(),[decision,setDecision]=useState<RiichiDecision>();
  const [running,setRunning]=useState(false),[summary,setSummary]=useState<RiichiSummary>();
  const [result,setResult]=useState<{title:string;reason:string;key:number;hand?:string}>(),[confirmStop,setConfirmStop]=useState(false);
  const serial=useRef(0);
  useEffect(()=>()=>session.current?.stop(),[]);
  const winds=zh?['东','南','西','北']:['East','South','West','North'];
  const player=(id:number)=>id===(remote&&view?view.ids[view.seat]:0)?(zh?'你':'You'):(remote?(zh?`玩家 ${id+1}`:`Player ${id+1}`):(zh?`电脑 ${id}`:`Computer ${id}`));
  const eventHandler=useRef<(event:Record<string,unknown>)=>void>(()=>{});
  useEffect(()=>{
    if(!remote)return;
    return remote.subscribe(p=>{
      if(p.kind==='state'){setView(p.view);setRunning(true);}
      if(p.kind==='decision')setDecision(p.decision);
      if(p.kind==='event')eventHandler.current(p.event);
      if(p.kind==='finished'){setSummary(p.summary);setRunning(false);setDecision(undefined);}
      if(p.kind==='closed'){setRunning(false);setDecision(undefined);}
      if(p.kind==='ack'&&!p.accepted)setDecision(undefined);
      if(p.kind==='checkpoint')setDecision(p.snapshot.decision??undefined);
    });
  },[remote]);
  useEffect(()=>{eventHandler.current=handleEvent;});
  function handleEvent(event:Record<string,unknown>){
      if(event.qipai)setResult(undefined);
      const win=event.hule as {l:number;baojia:number|null;shoupai:string;hupai:{name:string;fanshu:number|string}[];fu?:number;fanshu?:number;damanguan?:number;defen:number;fenpei:number[]}|undefined;
      const draw=event.pingju as {name:string;fenpei:number[]}|undefined;
      if(win||draw){
        const delta=(win||draw)!.fenpei.map((n,i)=>`${winds[i]} ${n>=0?'+':''}${n}`).join(' / ');
        const scoring=win?(win.damanguan?`${win.damanguan} ${zh?'倍役满：按特殊上限计分，不按普通符番计算。':'yakuman: special limit scoring, not ordinary fu/han.'}`:`${win.fu??0} ${zh?'符（牌型细节形成的基础分）':'fu (base value from hand details)'} / ${win.fanshu??0} ${zh?'番（役和奖励的计分级数）':'han (yaku and bonus value)'}`):'';
        setResult({key:++serial.current,hand:win?.shoupai,title:win?(zh?`${winds[win.l]}家和牌`:`${winds[win.l]} wins`):(zh?'本局流局':'Hand drawn'),reason:win?
          `${win.baojia===null?(zh?'自摸：赢家摸到了完成手牌的牌。':'Self draw: the winner drew the completing tile.'):(zh?`荣和：${winds[win.baojia]}家打出的牌完成了赢家的手牌。`:`Ron: a discard by ${winds[win.baojia]} completed the hand.`)}\n${explainRiichiAwards(win.hupai,locale)}\n${scoring}\n${zh?'和牌基本支付':'Base hand payment'}: ${win.defen} ${zh?'点；本场和桌面立直棒另计在下方变化中。':'points; honba and existing deposits are included separately in the changes below.'}\n${zh?'本次变化（按座风，不是固定玩家编号）':'Changes by wind, not fixed player ID'}: ${delta}\n${zh?'确认前余额尚未入账。关闭提示后可查看完整赢家手牌，再点击“确认结算，继续”。':'Balances are not posted until acknowledgement. Close to inspect the full winning hand, then confirm to continue.'}`:
          `${explainRiichiDraw(draw!.name,locale)}\n${zh?'分数变化':'Score changes'}: ${delta}\n${zh?'关闭提示后确认结算才会继续。':'Confirm after reviewing to continue.'}`});
      }
  }
  function start(){
    session.current?.stop();setView(undefined);setDecision(undefined);setResult(undefined);setSummary(undefined);setConfirmStop(false);setRunning(true);
    const game=new RiichiSession({onState:setView,onDecision:setDecision,onFinish:s=>{setSummary(s);setRunning(false);setDecision(undefined);},onEvent:handleEvent});session.current=game;game.start();
  }
  function act(choice:RiichiChoice){if(decision&&(remote?remote.submit(decision.revision,choice.id):session.current?.submit(decision.revision,choice.id)))setDecision(undefined);}
  function label(c:RiichiChoice){const labels:Record<RiichiChoice['kind'],string>=zh?{discard:'打出',riichi:'立直并打出',chi:'吃：连成顺子',pon:'碰：凑成三张相同',kan:'杠：四张相同',tsumo:'自摸和牌',ron:'荣和：用刚打出的牌和牌',abort:'九种九牌：申请重新开局',pass:'跳过，不吃碰和',continue:'确认结算，继续'}:{discard:'Discard',riichi:'Declare riichi and discard',chi:'Chi: sequence',pon:'Pon: triplet',kan:'Kan: four tiles',tsumo:'Win by self draw',ron:'Ron: win on this discard',abort:'Abort: nine terminal/honor types',pass:'Pass this claim',continue:'Confirm result and continue'};return labels[c.kind];}
  return <section className="mt-10 rounded-xl border-2 border-[#ae8550] bg-[#f3e7cd] p-4 text-[#392616] sm:p-6" aria-label={zh?'日式麻将自由练习':'Riichi free practice'}>
    <h2 className="text-2xl font-bold">{remote?(zh?'日式立直麻将 · 四人牌桌':'Japanese riichi · Four-player table'):(zh?'日式立直麻将 · 自由对局':'Japanese riichi · Free practice')}</h2>
    {remote?<p className="mt-3 max-w-[68ch] leading-7">{zh?'四位真人，每人起始 25,000 点。东风战结束时分数最多者获胜；每局普通和牌需四组加一对，并至少有一个役，宝牌不能单独算役。轮到你时点击手牌打出，吃碰和牌等选项只在合法时出现。每次结算后四人都要确认才继续。与本地日式练习使用同一规则：无赤五、允许副露断幺九、无双倍或累计役满、允许复合役满、无延长、庄家和牌或听牌连庄、负分结束。':'Four humans start with 25,000 points each. Highest score wins the East-round match. A usual winning hand needs four groups, a pair and at least one yaku; dora alone is insufficient. Click enabled tiles to discard; other actions appear only when legal. All four must acknowledge results. Same preset as local riichi: no red fives, open tanyao, no double/counted yakuman, combined yakuman, no extension, dealer repeats on win/ready hand, negative points end play.'}</p>:<>
    <p className="mt-3 max-w-[68ch] leading-7">{zh?'你和三位电脑玩家对局。每人起始 25,000 点，东风战结束时分数最多者获胜。每一局通常要凑齐四组牌和一对相同牌，并至少满足一个“役”才能和牌；宝牌本身不是役。这里不是上方的固定演示，每次都会重新洗牌。':'Play three local computers, starting at 25,000 points each. The highest score wins the East-round match. A usual winning hand has four groups and a pair, plus at least one qualifying yaku; dora alone is not a yaku. This is shuffled free play, separate from the fixed lesson above.'}</p>
    <details className="mt-3"><summary className="cursor-pointer py-3 font-bold">{zh?'先看操作方法与本桌规则':'Controls and table rules'}</summary><p className="max-w-[68ch] leading-7">{zh?'轮到你时，点击亮起的手牌打出一张；电脑会自动摸打。吃、碰、杠等按钮只有规则允许时出现，不想要可以跳过。立直会支付 1,000 点到桌面，并锁定手牌，之后通常只能打出刚摸到的牌。先完成零基础课程再尝试。此桌无赤五，允许断幺九副露，无累计役满和双倍役满，允许复合役满；东风战无延长，庄家和牌或听牌可连庄，负分结束。仅本地模拟，无账号、真钱或联网。':'On your turn, click an enabled tile to discard. Computers draw and discard automatically. Claims appear only when legal; pass to decline. Riichi deposits 1,000 points and locks your hand, usually forcing subsequent drawn-tile discards. Learn the basics first. No red fives; open tanyao; no counted/double yakuman; combined yakuman allowed. East-only, no extension; dealer repeats on win/ready hand; negative points end the match. Local simulation only: no accounts, money or networking.'}</p><a className="underline" href="/licenses/majiang-core.txt">{zh?'规则引擎开源许可':'Rules engine license'}</a></details>
    </>}
    {!remote&&!running&&<button className="rpg-button mt-4" onClick={start}>{zh?'开始新的日式对局':'Start a new riichi match'}</button>}
    {!remote&&running&&<button className="rpg-button mt-4" onClick={()=>{if(!confirmStop){setConfirmStop(true);return;}session.current?.stop();setRunning(false);setDecision(undefined);setConfirmStop(false);}}>{confirmStop?(zh?'确认退出本局（不结算）':'Confirm exit without settlement'):(zh?'退出对局':'Exit match')}</button>}
    {summary&&<p className="mt-4 font-bold" role="status">{zh?'全场结束':'Match finished'}：{summary.scores.map((n,id)=>`${player(id)} ${n} (${summary.ranks[id]})`).join(' · ')}</p>}
    {view&&<>
      <p className="mt-5 font-bold">{winds[view.roundWind]} {view.handNumber+1} · {view.honba} {zh?'本场':'honba'} · {zh?'剩余可摸':'Live tiles'} {view.remaining} · {zh?'立直棒':'Riichi pot'} {view.pot*1000}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">{view.ids.map((id,seat)=><div key={seat} className="min-w-0 rounded border border-[#ae8550] p-3"><h3 className="font-bold">{winds[seat]} · {player(id)} · {summary?.scores[id]??view.scores[id]} {zh?'点':'points'} {view.turn===seat?'◀':''}</h3><p className="text-sm">{id===view.ids[view.seat]?(zh?'你的手牌在下方':'Your hand is below'):`${zh?'暗牌':'Hidden tiles'} ${(view.hands[seat].match(/_/g)||[]).length}`}</p><p className="mt-2 text-sm">{zh?'弃牌（↗ 已被吃碰；★ 立直宣言牌）':'Discards (↗ claimed; ★ riichi declaration)'}：</p><div className="flex flex-wrap gap-1 text-sm">{view.rivers[seat].map((p,i)=><span key={i} className="flex flex-col items-center"><MahjongTile compact tile={tileName(p)} locale={locale}/><span>{/[+=-]/.test(p)?'↗':''}{p.includes('*')?'★':''}</span></span>)}</div>{view.hands[seat].split(',').slice(1).map((meld,i)=><div className="mt-2 flex flex-wrap" key={i}>{codes(meld).map((p,j)=><MahjongTile compact key={j} tile={tileName(p)} locale={locale}/>)}</div>)}</div>)}</div>
      <p className="mt-4" role="status">{decision?(zh?'轮到你操作。点击手牌出牌，或选择下方允许的动作。':'Your decision: discard an enabled tile or choose a legal action below.'):(running?(zh?'等待其他玩家……':'Waiting for other players…'):(zh?'对局已停止。':'Match stopped.'))}</p>
      <h3 className="mt-3 font-bold">{zh?'你的手牌（点击亮起的牌打出）':'Your hand (click an enabled tile to discard)'}</h3>
      <div className="mt-2 flex flex-wrap gap-1">{codes(view.hands[view.seat].split(',')[0]).map((p,i)=>{const c=decision?.choices.find(c=>c.kind==='discard'&&c.value?.slice(0,2)===p);return <button key={i} disabled={!c} onClick={()=>c&&act(c)} aria-label={`${zh?'打出':'Discard'} ${zh?tileName(p):tileEnglish(tileName(p))}`} className="rounded border-2 border-transparent p-1 enabled:border-[#ae8550] enabled:hover:bg-[#e9d7b6] disabled:cursor-default"><MahjongTile tile={tileName(p)} locale={locale}/></button>;})}</div>
      {result&&<div className="mt-4 rounded border-2 border-[#ae8550] p-3"><h3 className="font-bold">{result.title}</h3>{result.hand&&<><p>{zh?'赢家完整牌面（包含和牌张；各副露分组列出）':'Complete winning tiles, including the winning tile; called groups are separated'}</p><div className="mt-2 flex flex-wrap gap-4">{result.hand.split(',').map((group,i)=><div key={i} className="flex flex-wrap gap-1 border-b border-[#ae8550] pb-2">{codes(group).map((p,j)=><MahjongTile compact key={j} tile={tileName(p)} locale={locale}/>)}</div>)}</div></>}<p className="mt-3 whitespace-pre-line text-sm leading-7">{result.reason}</p></div>}
      <div className="mt-4 flex flex-wrap gap-3">{decision?.choices.filter(c=>c.kind!=='discard').map(c=>{const tiles=c.value?codes(c.value):[];return <button key={c.id} className="rpg-button" aria-label={`${label(c)}${tiles.length?` ${tiles.map(p=>zh?tileName(p):tileEnglish(tileName(p))).join(zh?'、':', ')}`:''}`} onClick={()=>act(c)}>{label(c)}{tiles.length>0&&<span className="ml-2 flex flex-wrap" aria-hidden="true">{tiles.map((p,i)=><MahjongTile compact onDark key={i} tile={tileName(p)} locale={locale}/>)}</span>}</button>;})}</div>
      <details className="mt-4"><summary className="cursor-pointer py-3">{zh?'宝牌指示牌（不是宝牌本身）':'Dora indicators (not the dora themselves)'}</summary><div className="flex flex-wrap">{view.indicators.map((p,i)=><MahjongTile key={i} tile={tileName(p)} locale={locale}/>)}</div></details>
    </>}
    {result&&<ResultDialog key={result.key} title={result.title} reason={result.reason} locale={locale}/>}
  </section>;
}
