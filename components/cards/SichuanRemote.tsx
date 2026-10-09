'use client';
import {sichuanRemotePhase} from '@/lib/mahjong/sichuan-session';
import {useEffect,useRef,useState} from 'react';
import {ManualSichuanHost,ManualSichuanGuest} from '@/lib/mahjong/sichuan-manual';
import type {SichuanRoomMessage} from '@/lib/mahjong/sichuan-room';
import type {SichuanView} from '@/lib/mahjong/sichuan-teaching';
import type {SichuanRequest} from '@/lib/mahjong/sichuan-request';
import SichuanPractice from './SichuanPractice';
import {PokerInputGate} from '@/lib/holdem-input-gate';
import {readSichuanSave,writeSichuanSave,clearSichuanSave,type SichuanSave} from '@/lib/mahjong/sichuan-save';
import {secureMultiplayerContext,insecureMultiplayerMessage} from '@/lib/network-context';
import {readManualSignal} from '@/lib/manual-rtc';

export default function SichuanRemote({locale}:{locale:'zh'|'en'}){
  const zh=locale==='zh',host=useRef<ManualSichuanHost|null>(null),guest=useRef<ManualSichuanGuest|null>(null);
  const epoch=useRef(0),requests=useRef(0),gate=useRef(new PokerInputGate());
  const [view,setView]=useState<SichuanView|null>(null),[pending,setPending]=useState(false);
  const [role,setRole]=useState<'none'|'host'|'guest'>('none'),[phase,setPhase]=useState<'idle'|'lobby'|'connecting'|'playing'|'finished'|'closed'>('idle'),[connected,setConnected]=useState([true,false,false,false]);
  const [offers,setOffers]=useState(['','','','']),[responses,setResponses]=useState(['','','','']),[invitation,setInvitation]=useState(''),[answer,setAnswer]=useState('');
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[confirm,setConfirm]=useState(false);
  const [saved,setSaved]=useState<SichuanSave|null>(null),[saveError,setSaveError]=useState(''),[replaceSave,setReplaceSave]=useState<'host'|'guest'|null>(null),[clearConfirm,setClearConfirm]=useState(false),[restoring,setRestoring]=useState(false);
  const guestRecovery=useRef<string|undefined>(undefined);
  useEffect(()=>{let active=true;queueMicrotask(()=>{if(!active)return;try{setSaved(readSichuanSave(sessionStorage));}catch{setSaveError(zh?'无法读取本标签页存档；不要假定可以恢复。':'Cannot read this tab’s save; recovery is not assured.');}});return()=>{active=false;};},[zh]);
  function persist(){
    try{const checkpoint=host.current?.room.recoveryCheckpoint()??guest.current?.recoveryCheckpoint();if(!checkpoint)return;
      setSaved(writeSichuanSave(sessionStorage,host.current?'host':'guest',checkpoint));setSaveError('');}
    catch{setSaveError(zh?'本次进度保存失败！请保留页面，不要刷新；旧存档可能落后，恢复可能被拒绝。':'This update could not be saved! Keep this page open; an older save may be rejected during recovery.');}
  }
  function forget(){try{clearSichuanSave(sessionStorage);setSaved(null);setSaveError('');setClearConfirm(false);return true;}catch{setSaveError(zh?'无法清除本标签页存档，请检查浏览器站点数据设置。':'Could not clear this tab’s save. Check browser site-data settings.');return false;}}
  useEffect(()=>()=>{epoch.current++;host.current?.close();guest.current?.close();},[]);
  function reset(){epoch.current++;host.current?.close();guest.current?.close();host.current=null;guest.current=null;requests.current=0;setOffers(['','','','']);setResponses(['','','','']);setAnswer('');setInvitation('');setError('');setConfirm(false);setClearConfirm(false);setView(null);gate.current=new PokerInputGate();setPending(false);setBusy(false);setConnected([true,false,false,false]);}
  function receive(token:number,m:SichuanRoomMessage){
    if(token!==epoch.current)return;
    const p=m.payload;
    if(p.kind==='lobby'){setConnected(p.connected);setPhase('lobby');setOffers(o=>o.map((v,i)=>p.connected[i]?'':v));setResponses(o=>o.map((v,i)=>p.connected[i]?'':v));setAnswer('');}
    if(p.kind==='view'&&!gate.current.closed){setView(p.view);setPhase(sichuanRemotePhase(p.view));gate.current.view();setPending(gate.current.pending);persist();}
    if(p.kind==='ack')gate.current.ack();
    if(p.kind==='closed'){if(host.current)persist();gate.current.close();setPending(false);setPhase('closed');setError(zh?'连接已结束，未完成的牌局不判胜。可用本标签页存档尝试恢复，四人需要重新交换邀请。':'Connection ended without awarding an unfinished hand. Try this tab’s save; all four players must exchange fresh invitations.');}
    if(p.kind==='ack'&&!p.accepted)setError(zh?'操作未被接受。请勿重复点击；若无法继续，请退出重建房间。':'Action rejected. Do not repeat clicks; leave and recreate the room if play cannot continue.');
    
  }
  function disconnected(token:number){
    if(token!==epoch.current)return;
    if(host.current&&host.current.room.status!=='lobby')persist();
    setPhase('closed');setOffers(['','','','']);setResponses(['','','','']);setAnswer('');setError(zh?'直连断开或确认超时。当前牌面保留，但不能继续出牌。':'Disconnected or acknowledgement timed out. Cards are retained; further actions are disabled.');
    gate.current.close();setPending(false);
  }
  function createHost(checkpoint?:string){
    if(!secureMultiplayerContext()){setError(insecureMultiplayerMessage(locale));return;}
    if(!checkpoint&&(saved||saveError)&&replaceSave!=='host'){setReplaceSave('host');return;}
    reset();guestRecovery.current=undefined;setRestoring(!!checkpoint);setReplaceSave(null);const token=epoch.current;setRole('host');setPhase('lobby');
    try{host.current=new ManualSichuanHost(m=>receive(token,m),id=>{if(token!==epoch.current)return;if(host.current?.room.status==='lobby'){setConnected(c=>c.map((v,i)=>i===id?false:v));setOffers(o=>o.map((v,i)=>i===id?'':v));setResponses(o=>o.map((v,i)=>i===id?'':v));}else disconnected(token);},undefined,checkpoint);}
    catch{setPhase('closed');setError(zh?'存档无效或版本不兼容，未创建恢复房间。原存档保留。':'Invalid or incompatible save. Recovery room not created; original save retained.');}
  }
  function restoreSaved(){if(!saved)return;if(saved.role==='host')createHost(saved.checkpoint);else{reset();guestRecovery.current=saved.checkpoint;setRestoring(true);setRole('none');setPhase('idle');}}
  function joinGuest(){
    if(!secureMultiplayerContext()){setError(insecureMultiplayerMessage(locale));return;}
    const text=invitation,checkpoint=guestRecovery.current;
    try{readManualSignal(text,'sichuan-four','offer');}catch{setReplaceSave(null);setError(zh?'邀请文本无效或不属于四川麻将；原存档仍保留。':'Invalid invitation or wrong game; the original save is still intact.');return;}
    if(!checkpoint&&(saved||saveError)&&replaceSave!=='guest'){setReplaceSave('guest');return;}
    reset();setReplaceSave(null);setRestoring(!!checkpoint);setRole('guest');setPhase('connecting');const token=epoch.current;
    void work(async()=>{try{guest.current=new ManualSichuanGuest(m=>receive(token,m),()=>disconnected(token),undefined,checkpoint);const value=await guest.current.answer(text);if(token===epoch.current)setAnswer(value);}catch(e){if(token===epoch.current)setPhase('closed');throw e;}});
  }
  async function work(action:()=>Promise<void>){const token=epoch.current;setBusy(true);setError('');try{await action();}catch{if(token===epoch.current){guest.current?.close();setError(zh?'连接文本无效、步骤不符或浏览器无法直连。检查是否粘贴完整，必要时取消后重试。':'Invalid connection text, wrong step or unavailable direct connection. Check the complete text; cancel and retry if needed.');}}finally{if(token===epoch.current)setBusy(false);}}
  function submit(action:SichuanRequest['action']){
    if(!view||phase!=='playing'||!gate.current.begin())return;
    setPending(true);setError('');
    const move={revision:view.revision,action};
    const sent=host.current?host.current.submit(++requests.current,move):guest.current?.submit(move);
    if(!sent){gate.current.failed();setPending(false);setError(zh?'操作未提交，请检查轮次和连接状态。':'Action not submitted. Check your turn and connection.');}
  }
  async function copy(value:string){try{await navigator.clipboard.writeText(value);}catch{setError(zh?'无法自动复制，请选中文本框中的全部文字手动复制。':'Copy failed; select all text in the field and copy manually.');}}
  const field='mt-2 block min-h-24 w-full min-w-0 rounded border border-[#ae8550] bg-[#fff8e8] p-3 font-mono text-xs';
  return <>
    <section className="rounded-xl border-2 border-[#ae8550] bg-[#f3e7cd] p-4 text-[#392616] sm:p-6">
      <h2 className="text-2xl font-bold">{zh?'四川血战麻将 · 四人 · 手动直连':'Four-player Sichuan Blood Battle · Manual direct connection'}</h2>
      <p className="mt-3 max-w-[68ch] leading-7">{zh?'不需要注册，没有后端或信令服务。房主与三位朋友分别交换一组文本；建议同一局域网。跨公网不保证连通，因为没有中继。不同设备都需能打开有效 HTTPS 网站：localhost 只属于当前设备，直接输入 http://局域网IP 也不具备刷新恢复所需的安全上下文。连接文本含网络连接信息，只私下发给同桌朋友。':'No registration, backend or signaling service. The host exchanges a separate text pair with each of three friends. LAN is recommended; cross-network success is not guaranteed without relays. Each device needs a valid HTTPS site: localhost refers only to that device, and plain HTTP on a LAN IP lacks the secure context required for refresh recovery. Share connection text privately with your table only.'}</p>
      <p className="mt-2 text-sm leading-6">{zh?'房主浏览器保管牌堆并执行规则，请只和信任的人对局。这不是防作弊服务器，不涉及真钱。断线会冻结对局；恢复需要原房主和全部三位玩家各自保留本标签页存档，并重新交换连接文本。':'The trusted host owns the deck and rules; this is not a cheat-proof server or a money game. Disconnection freezes play. Recovery needs the original host and all three guests, each retaining their own tab’s save and exchanging fresh connection text.'}</p>
      <aside className="mt-4 rounded border border-[#ae8550] p-4" aria-label={zh?'本标签页恢复':'This tab’s recovery'}>
        <h3 className="font-bold">{zh?'刷新前先知道':'Before refreshing'}</h3>
        <p className="mt-2 max-w-[68ch] text-sm leading-7">{zh?'进入牌局后自动保存到本标签页 sessionStorage。房主存档含完整牌墙和恢复凭证，来宾只保存本席牌面与凭证；不要导出或分享存档。刷新后先选“恢复本标签页牌局”。房主重新为原座位生成邀请，朋友先恢复，再粘贴自己的新邀请；四人到齐后房主点“继续原牌局”。关闭标签页、清理浏览器数据或存储被禁用时可能丢失，不能换设备恢复。':'After play starts, progress is saved in this tab’s sessionStorage. The host save contains the full wall and credentials; a guest saves only their view and credential. Never export or share saves. After refresh choose “Restore this tab’s match.” The host makes fresh invitations for the original seats; guests restore first, then paste their own invitation. Once all return, the host continues the original match. Closing the tab, clearing data or blocked storage can lose the save. Device migration is not supported.'}</p>
        <p className="mt-2 text-sm" role="status">{saved?(zh?'本标签页已有存档（不代表其他三人也已保存）。':'This tab has a save (this does not confirm the other three players saved).'):(zh?'尚无已保存的牌局。':'No saved match yet.')}</p>
        {saveError&&<p role="alert" className="mt-2 font-bold text-[#803d2b]">{saveError}</p>}
        {saved&&(role==='none'||phase==='closed'||phase==='finished')&&<button disabled={busy} className="rpg-button mt-3" onClick={restoreSaved}>{zh?'恢复本标签页牌局':'Restore this tab’s match'}</button>}
        {(saved||saveError)&&(role==='none'||phase==='closed'||phase==='finished')&&<button disabled={busy} className="rpg-button mt-3 ml-2" onClick={()=>{if(!clearConfirm){setClearConfirm(true);return;}if(forget()){guestRecovery.current=undefined;setRestoring(false);}}}>{clearConfirm?(zh?'确认清除，无法撤销':'Confirm permanent removal'):(zh?'清除本标签页存档':'Clear this tab’s save')}</button>}
        {restoring&&<p className="mt-3 font-bold">{phase==='playing'||phase==='finished'?(zh?'已恢复原牌局，保留原座位、牌面和进度。':'Original match restored, including seats, cards and progress.'):(zh?'恢复模式：保持原座位，等待重新连接；不会重新发牌。':'Recovery mode: keep your original seat and reconnect. No new deal.')}</p>}
      </aside>
      {replaceSave&&<p role="alert" className="mt-3 font-bold text-[#803d2b]">{zh?'再次点击同一个按钮确认新局。旧存档会保留到新局真正开始并成功保存后才被覆盖；也可恢复原牌局。':'Click the same button again to confirm. The old save stays until the new match starts and saves successfully; you can still restore it.'}</p>}
      {(role==='none'||phase==='closed'||phase==='finished')&&<button disabled={busy} className="rpg-button mt-4" onClick={()=>createHost()}>{replaceSave==='host'?(zh?'确认创建新房':'Confirm new room'):(zh?'创建四人房间':'Create four-player room')}</button>}
      {role!=='none'&&phase!=='closed'&&<button className="rpg-button ml-3 mt-4" onClick={()=>{if(!confirm){setConfirm(true);return;}reset();setBusy(false);setRole('none');setPhase('idle');}}>{confirm?(zh?'确认离开，停止本场':'Confirm leave and stop match'):(zh?'离开房间':'Leave room')}</button>}
      <p className="mt-4" role="status">{zh?'连接状态':'Connection status'}: {({idle:zh?'尚未连接':'Not connected',lobby:zh?'等候四人到齐':'Waiting for four players',connecting:zh?'等待房主应用回复':'Waiting for host to apply answer',playing:zh?'对局中':'Playing',finished:zh?'本场结束':'Match finished',closed:zh?'已关闭':'Closed'})[phase]}</p>
      {role==='guest'&&phase==='lobby'&&<p className="mt-2 max-w-[68ch] leading-7" role="status">{zh?'你已加入房间，加入步骤已完成。请保持本页打开；其他玩家到齐后，由房主开始对局。':'You have joined the room. Keep this page open; the host will start the match when all four players are connected.'}</p>}
      {error&&<p role="alert" className="mt-3 font-bold text-[#803d2b]">{error}</p>}
      {role==='host'&&phase==='lobby'&&<>
        <p className="mt-4 leading-7">{zh?'房主是玩家 1。依次为玩家 2、3、4 生成邀请，分别私发。每位朋友生成自己的回复后，把回复粘回对应玩家的框，再应用。不能把同一份邀请发给三个人。':'Host is Player 1. Generate separate invitations for Players 2, 3 and 4. Each friend returns an answer; paste it in that same player’s field and apply it. Do not reuse one invitation for all three.'}</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">{[1,2,3].map(id=><div key={id} className="min-w-0 rounded border border-[#ae8550] p-3"><h3 className="font-bold">{zh?'玩家':'Player'} {id+1} · {connected[id]?(zh?'已连接':'Connected'):(zh?'未连接':'Not connected')}</h3>{!connected[id]&&<>
          <button disabled={busy||!!offers[id]} className="rpg-button mt-3" onClick={()=>work(async()=>{const h=host.current!,token=epoch.current,value=await h.offer(id);if(token===epoch.current)setOffers(o=>o.map((v,i)=>i===id?value:v));})}>{zh?'生成邀请':'Generate invitation'} {id+1}</button>
          {offers[id]&&<><label className="mt-3 block">{zh?'发给玩家':'Send to Player'} {id+1}<textarea readOnly aria-label={`${zh?'邀请':'Invitation'} ${id+1}`} className={field} value={offers[id]}/></label><button className="rpg-button mt-2" onClick={()=>copy(offers[id])}>{zh?'复制邀请':'Copy invitation'} {id+1}</button><label className="mt-3 block">{zh?'粘贴该玩家回复':'Paste this player’s answer'}<textarea maxLength={65536} aria-label={`${zh?'回复':'Answer'} ${id+1}`} className={field} value={responses[id]} onChange={e=>setResponses(o=>o.map((v,i)=>i===id?e.target.value:v))}/></label><button disabled={busy||!responses[id]} className="rpg-button mt-2" onClick={()=>work(async()=>{await host.current!.finish(id,responses[id]);})}>{zh?'应用回复':'Apply answer'} {id+1}</button></>}
          {offers[id]&&<button disabled={busy} className="mt-3 inline-flex min-h-11 items-center rounded px-2 text-left underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#803d2b]" onClick={()=>{host.current?.cancelOffer(id);setOffers(o=>o.map((v,i)=>i===id?'':v));setResponses(o=>o.map((v,i)=>i===id?'':v));}}>{zh?'取消此邀请':'Cancel this invitation'}</button>}
        </>}</div>)}</div>
        <button disabled={!connected.every(Boolean)||busy} className="rpg-button mt-4" onClick={()=>{host.current?.start();}}>{restoring?(zh?'四人到齐，继续原牌局':'All four ready — continue original match'):(zh?'四人到齐，开始对局':'All four ready — start match')}</button>
      </>}
      {(role==='none'||phase==='closed'||(role==='guest'&&phase==='connecting'))&&<div className="mt-5 max-w-[68ch]"><h3 className="font-bold">{zh?'作为朋友加入':'Join as a guest'}</h3><p className="leading-7">{zh?'1. 粘贴房主单独给你的邀请。2. 生成回复并发回房主。3. 等房主应用回复，四人到齐后由房主开局。':'1. Paste your personal invitation. 2. Generate an answer and return it to the host. 3. Wait for the host to apply it and start with all four players.'}</p><textarea disabled={role==='guest'&&phase!=='closed'} maxLength={65536} aria-label={zh?'房主邀请':'Host invitation'} className={field} value={invitation} onChange={e=>{setInvitation(e.target.value);setReplaceSave(null);}}/><button disabled={busy||!invitation||(role==='guest'&&phase!=='closed')} className="rpg-button mt-3" onClick={joinGuest}>{replaceSave==='guest'?(zh?'确认加入新房':'Confirm joining new room'):(zh?'生成我的回复':'Generate my answer')}</button>{answer&&<><textarea aria-label={zh?'我的回复':'My answer'} readOnly className={field} value={answer}/><button className="rpg-button mt-2" onClick={()=>copy(answer)}>{zh?'复制我的回复':'Copy my answer'}</button></>}</div>}
    </section>
    {view&&<>
      <SichuanPractice locale={locale} remote={{view,disabled:phase!=='playing'||pending,onAction:submit}}/>
      {pending&&<p role="status">{zh?'等待房主确认……':'Waiting for host acknowledgement…'}</p>}
    </>}
  </>;
}
