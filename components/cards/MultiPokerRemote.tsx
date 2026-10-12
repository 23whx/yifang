'use client';
import {multiRemotePhase} from '@/lib/holdem-multi-session';
import {useEffect,useRef,useState} from 'react';
import {ManualPokerHost,ManualPokerGuest} from '@/lib/holdem-multi-manual';
import type {MultiRoomMessage} from '@/lib/holdem-multi-room';
import type {MultiView} from '@/lib/holdem-multi-session';
import type {PokerRequest} from '@/lib/holdem-remote';
import MultiPokerTable from './MultiPokerTable';
import {PokerInputGate} from '@/lib/holdem-input-gate';
import {readMultiPokerSave,writeMultiPokerSave,clearMultiPokerSave,type MultiPokerSave} from '@/lib/holdem-multi-save';
import {secureMultiplayerContext,insecureMultiplayerMessage} from '@/lib/network-context';
import {readManualSignal} from '@/lib/manual-rtc';
import {FourSeatSetup} from '@/components/remote/RoomKit';
import {useFourSeatLink} from '@/components/remote/useFourSeatLink';

export default function MultiPokerRemote({locale}:{locale:'zh'|'en'}){
  const zh=locale==='zh',host=useRef<ManualPokerHost|null>(null),guest=useRef<ManualPokerGuest|null>(null);
  const epoch=useRef(0),requests=useRef(0),gate=useRef(new PokerInputGate());
  const [view,setView]=useState<MultiView|null>(null),[pending,setPending]=useState(false);
  const [role,setRole]=useState<'none'|'host'|'guest'>('none'),[phase,setPhase]=useState<'idle'|'lobby'|'connecting'|'playing'|'finished'|'closed'>('idle'),[connected,setConnected]=useState([true,false,false,false]);
  const [offers,setOffers]=useState(['','','','']),[responses,setResponses]=useState(['','','','']),[invitation,setInvitation]=useState(''),[answer,setAnswer]=useState('');
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[confirm,setConfirm]=useState(false);
  const [saved,setSaved]=useState<MultiPokerSave|null>(null),[saveError,setSaveError]=useState(''),[replaceSave,setReplaceSave]=useState<'host'|'guest'|null>(null),[clearConfirm,setClearConfirm]=useState(false),[restoring,setRestoring]=useState(false);
  const guestRecovery=useRef<string|undefined>(undefined);
  const link=useFourSeatLink('holdem-four',zh),autoJoin=useRef(false);
  // Link mode reconnects by itself after a drop (screen lock, app switch): the host keeps the
  // room link and restarts the verified recovery; guests rejoin it; play resumes once all four are back.
  const autoTries=useRef(0),autoRun=useRef(false),played=useRef(false),[reconnectNote,setReconnectNote]=useState('');
  useEffect(()=>{let active=true;queueMicrotask(()=>{if(!active)return;try{setSaved(readMultiPokerSave(sessionStorage));}catch{setSaveError(zh?'无法读取本标签页存档；不要假定可以恢复。':'Cannot read this tab’s save; recovery is not assured.');}});return()=>{active=false;};},[zh]);
  function persist(){
    try{const checkpoint=host.current?.room.recoveryCheckpoint()??guest.current?.recoveryCheckpoint();if(!checkpoint)return;
      setSaved(writeMultiPokerSave(sessionStorage,host.current?'host':'guest',checkpoint));setSaveError('');}
    catch{setSaveError(zh?'本次进度保存失败！请保留页面，不要刷新；旧存档可能落后，恢复可能被拒绝。':'This update could not be saved! Keep this page open; an older save may be rejected during recovery.');}
  }
  function forget(){try{clearMultiPokerSave(sessionStorage);setSaved(null);setSaveError('');setClearConfirm(false);return true;}catch{setSaveError(zh?'无法清除本标签页存档，请检查浏览器站点数据设置。':'Could not clear this tab’s save. Check browser site-data settings.');return false;}}
  useEffect(()=>()=>{epoch.current++;host.current?.close();guest.current?.close();},[]);
  function reset(keepRoom=false){if(!keepRoom)link.stop();epoch.current++;host.current?.close();guest.current?.close();host.current=null;guest.current=null;requests.current=0;setOffers(['','','','']);setResponses(['','','','']);setAnswer('');setInvitation('');setError('');setConfirm(false);setClearConfirm(false);setView(null);gate.current=new PokerInputGate();setPending(false);setBusy(false);setConnected([true,false,false,false]);}
  function receive(token:number,m:MultiRoomMessage){
    if(token!==epoch.current)return;
    const p=m.payload;
    if(p.kind!=='lobby'&&p.kind!=='closed'&&p.kind!=='ack'){played.current=true;if(autoRun.current){autoRun.current=false;autoTries.current=0;setReconnectNote('');}}
    if(p.kind==='closed'&&link.mode==='link'&&(played.current||autoRun.current)){autoReconnect();return;}
    if(p.kind==='lobby'&&autoRun.current&&host.current&&p.connected.every(Boolean))queueMicrotask(()=>{if(token===epoch.current)host.current?.start();});
    if(p.kind==='lobby'){setConnected(p.connected);setPhase('lobby');setOffers(o=>o.map((v,i)=>p.connected[i]?'':v));setResponses(o=>o.map((v,i)=>p.connected[i]?'':v));setAnswer('');}
    if(p.kind==='view'&&!gate.current.closed){setView(p.view);setPhase(multiRemotePhase(p.view));gate.current.view();setPending(gate.current.pending);persist();}
    if(p.kind==='ack')gate.current.ack();
    if(p.kind==='closed'){if(host.current)persist();gate.current.close();setPending(false);setPhase('closed');setError(zh?'连接已结束，未完成的牌局不判胜。可以用双方原标签页存档恢复，需四人重新连接。':'Connection ended without awarding an unfinished hand. All four original tabs can reconnect using their saves.');}
    if(p.kind==='ack'&&!p.accepted)setError(zh?'操作未被接受。请勿重复点击；若无法继续，请退出重建房间。':'Action rejected. Do not repeat clicks; leave and recreate the room if play cannot continue.');
    
  }
  function disconnected(token:number){
    if(token!==epoch.current)return;
    if(link.mode==='link'&&(played.current||autoRun.current)){autoReconnect();return;}
    if(host.current&&host.current.room.status!=='lobby')persist();
    setPhase('closed');setOffers(['','','','']);setResponses(['','','','']);setAnswer('');setError(zh?'直连断开或确认超时。当前牌面保留，但不能继续出牌。':'Disconnected or acknowledgement timed out. Cards are retained; further actions are disabled.');
    gate.current.close();setPending(false);
  }
  function createHost(checkpoint?:string,auto=false){
    if(!secureMultiplayerContext()){setError(insecureMultiplayerMessage(locale));return;}
    if(!checkpoint&&(saved||saveError)&&replaceSave!=='host'){setReplaceSave('host');return;}
    reset(auto);if(!auto){autoTries.current=0;setReconnectNote('');}played.current=false;autoRun.current=auto;guestRecovery.current=undefined;setRestoring(!!checkpoint);setReplaceSave(null);const token=epoch.current;setRole('host');setPhase('lobby');
    try{host.current=new ManualPokerHost(m=>receive(token,m),id=>{if(token!==epoch.current)return;if(host.current?.room.status==='lobby'){setConnected(c=>c.map((v,i)=>i===id?false:v));setOffers(o=>o.map((v,i)=>i===id?'':v));setResponses(o=>o.map((v,i)=>i===id?'':v));}else disconnected(token);},undefined,checkpoint);}
    catch{setPhase('closed');setError(zh?'存档无效或版本不兼容，未创建恢复房间。原存档保留。':'Invalid or incompatible save. Recovery room not created; original save retained.');}
    if(link.mode==='link'&&host.current)void link.host(()=>token===epoch.current,()=>host.current,message=>{if(token===epoch.current){setError(message);setPhase('closed');}},{recovering:!!checkpoint,reuse:auto,onReturning:()=>autoReconnect()});
  }
  function restoreSaved(){if(!saved)return;if(saved.role==='host')createHost(saved.checkpoint);else{reset();guestRecovery.current=saved.checkpoint;setRestoring(true);setRole('none');setPhase('idle');if(link.mode==='link'&&link.hasStoredRoom())joinLink();}}
  function autoReconnect(){
    persist();
    let save:{role:'host'|'guest';checkpoint:string}|null=null;
    try{save=readMultiPokerSave(sessionStorage);}catch{/* fall through to a plain stop */}
    if(!save||autoTries.current>=3){epoch.current++;setReconnectNote('');setPhase('closed');setError(zh?'连接已断开，牌局已保存。各位保留本页，点“恢复上次牌局”即可接着打。':'Disconnected; the match is saved. Everyone keeps this page and chooses Restore previous match to continue.');return;}
    autoTries.current++;
    setReconnectNote(save.role==='host'?(zh?'有玩家暂时断线了（手机锁屏或切到其他应用时常见）。房间仍然有效，断线的玩家回到页面后会自动接上；四人到齐后自动继续原牌局。':'A player dropped out (common when a phone locks or switches apps). The room stays open; they reconnect automatically when they return, and the original match continues once all four are back.'):(zh?'连接中断了，正在自动重新连上房主……牌局已保存，四人到齐后会自动继续。':'Connection lost; reconnecting to the host automatically… The match is saved and continues once all four are back.'));
    if(save.role==='host'){createHost(save.checkpoint,true);return;}
    const resume=save.checkpoint;
    const go=()=>{guestRecovery.current=resume;setRestoring(true);joinLink(true);};
    // A hidden page cannot hold a connection on phones; rejoin when the player returns.
    if(typeof document==='undefined'||document.visibilityState==='visible'){go();return;}
    epoch.current++;const token=epoch.current;
    const back=()=>{if(document.visibilityState!=='visible')return;document.removeEventListener('visibilitychange',back);if(token===epoch.current)go();};
    document.addEventListener('visibilitychange',back);
  }
  function joinLink(auto=false){
    if(!secureMultiplayerContext()){setError(insecureMultiplayerMessage(locale));return;}
    const checkpoint=guestRecovery.current;
    if(!checkpoint&&(saved||saveError)&&replaceSave!=='guest'){setReplaceSave('guest');return;}
    reset();if(!auto){autoTries.current=0;setReconnectNote('');}played.current=false;autoRun.current=auto;setReplaceSave(null);setRestoring(!!checkpoint);setRole('guest');setPhase('connecting');const token=epoch.current;
    void link.join(()=>token===epoch.current,checkpoint,channel=>{
      try{guest.current=new ManualPokerGuest(m=>receive(token,m),()=>disconnected(token),()=>channel,checkpoint);}
      catch{channel.close();setPhase('closed');setError(zh?'存档无效或版本不兼容，未加入。原存档保留。':'Invalid or incompatible save; not joined. Original save retained.');}
    },message=>{if(token===epoch.current){setPhase('closed');setError(message);}},auto);
  }
  // Opening an invitation link joins straight away, unless this tab holds a saved match to protect.
  useEffect(()=>{
    if(!link.invited||autoJoin.current)return;autoJoin.current=true;
    let protectedSave=false;try{protectedSave=readMultiPokerSave(sessionStorage)!==null;}catch{protectedSave=true;}
    if(!protectedSave)queueMicrotask(joinLink);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[link.invited]);
  function joinGuest(){
    if(!secureMultiplayerContext()){setError(insecureMultiplayerMessage(locale));return;}
    const text=invitation,checkpoint=guestRecovery.current;
    try{readManualSignal(text,'holdem-four','offer');}catch{setReplaceSave(null);setError(zh?'邀请文本无效或不属于四人扑克；原存档仍保留。':'Invalid invitation or wrong game; the original save is still intact.');return;}
    if(!checkpoint&&(saved||saveError)&&replaceSave!=='guest'){setReplaceSave('guest');return;}
    reset();setReplaceSave(null);setRestoring(!!checkpoint);setRole('guest');setPhase('connecting');const token=epoch.current;
    void work(async()=>{try{guest.current=new ManualPokerGuest(m=>receive(token,m),()=>disconnected(token),undefined,checkpoint);const value=await guest.current.answer(text);if(token===epoch.current)setAnswer(value);}catch(e){if(token===epoch.current)setPhase('closed');throw e;}});
  }
  async function work(action:()=>Promise<void>){const token=epoch.current;setBusy(true);setError('');try{await action();}catch{if(token===epoch.current){guest.current?.close();setError(zh?'连接文本无效、步骤不符或浏览器无法直连。检查是否粘贴完整，必要时取消后重试。':'Invalid connection text, wrong step or unavailable direct connection. Check the complete text; cancel and retry if needed.');}}finally{if(token===epoch.current)setBusy(false);}}
  function submit(action:PokerRequest['action']){
    if(!view||phase!=='playing'||!gate.current.begin())return;
    setPending(true);setError('');
    const move={hand:view.hand,revision:view.revision,action};
    const sent=host.current?host.current.submit(++requests.current,move):guest.current?.submit(move);
    if(!sent){gate.current.failed();setPending(false);setError(zh?'操作未提交，请检查轮次和连接状态。':'Action not submitted. Check your turn and connection.');}
  }
  async function copy(value:string){try{await navigator.clipboard.writeText(value);}catch{setError(zh?'无法自动复制，请选中文本框中的全部文字手动复制。':'Copy failed; select all text in the field and copy manually.');}}
  return <>
    <FourSeatSetup link={{mode:link.mode,onMode:mode=>{reset();setBusy(false);setRole('none');setPhase('idle');guestRecovery.current=undefined;setRestoring(false);setReplaceSave(null);link.setMode(mode);},code:link.code,note:link.note,entry:link.entry,onEntry:value=>{link.setEntry(value);setReplaceSave(null);},canJoin:link.canJoin,onJoin:()=>joinLink(),visitors:link.visitors,onAdmit:link.admit,onDeny:link.deny,reconnect:reconnectNote}} zh={zh} title={zh?'四人德州扑克':'Four-player Texas Hold’em'} role={role} phase={phase} connected={connected} offers={offers} responses={responses} invitation={invitation} answer={answer} busy={busy} error={error}
      saved={!!saved} saveError={saveError} replaceSave={replaceSave} clearConfirm={clearConfirm} restoring={restoring} confirm={confirm}
      notes={<><p>{zh?'不需要注册。以下为邀请码方式的说明：它不经过任何后端或信令服务。房主与三位朋友分别交换一组文本；建议同一局域网。跨公网不保证连通，因为没有中继。不同设备都需能打开有效 HTTPS 网站：localhost 只属于当前设备，直接输入 http://局域网IP 也不具备刷新恢复所需的安全上下文。连接文本含网络连接信息，只私下发给同桌朋友。':'No registration. Code mode (described here) uses no backend or signaling service. The host exchanges a separate text pair with each of three friends. LAN is recommended; cross-network success is not guaranteed without relays. Each device needs a valid HTTPS site: localhost refers only to that device, and plain HTTP on a LAN IP lacks the secure context required for refresh recovery. Share connection text privately with your table only.'}</p><p>{zh?'房主浏览器保管牌堆并执行规则，请只和信任的人对局。这不是防作弊服务器，不涉及真钱。断线会冻结本场。原房主与三位来宾需各自保留本标签页存档，重新交换邀请后恢复。':'The trusted host browser owns the deck and rules. This is not a cheat-proof server or a money game. Disconnection freezes play. Recovery requires the original host and three guests, each with their tab’s save and fresh invitations.'}</p><p>{zh?'进入牌局后自动保存到本标签页 sessionStorage。房主存档含各手完整牌序和恢复凭证，来宾只保存本席牌面与凭证；不要导出或分享存档。刷新后先选“恢复本标签页牌局”。房主重新为原座位生成邀请，朋友先恢复，再粘贴自己的新邀请；四人到齐后房主点“继续原牌局”。关闭标签页、清理浏览器数据或存储被禁用时可能丢失，不能换设备恢复。':'After play starts, progress is saved in this tab’s sessionStorage. The host save contains the full deck order for each hand and credentials; a guest saves only their view and credential. Never export or share saves. After refresh choose “Restore this tab’s match.” The host makes fresh invitations for the original seats; guests restore first, then paste their own invitation. Once all return, the host continues the original match. Closing the tab, clearing data or blocked storage can lose the save. Device migration is not supported.'}</p></>}
      onCreate={()=>createHost()} onLeave={()=>{if(!confirm){setConfirm(true);return;}reset();setBusy(false);setRole('none');setPhase('idle');}} onRestore={restoreSaved}
      onClear={()=>{if(!clearConfirm){setClearConfirm(true);return;}if(forget()){guestRecovery.current=undefined;setRestoring(false);}}}
      onOffer={id=>work(async()=>{const h=host.current!,token=epoch.current,value=await h.offer(id);if(token===epoch.current)setOffers(o=>o.map((v,i)=>i===id?value:v));})} onCopy={copy}
      onResponse={(id,value)=>setResponses(o=>o.map((v,i)=>i===id?value:v))} onFinish={id=>work(async()=>{await host.current!.finish(id,responses[id]);})}
      onCancelOffer={id=>{host.current?.cancelOffer(id);setOffers(o=>o.map((v,i)=>i===id?'':v));setResponses(o=>o.map((v,i)=>i===id?'':v));}} onStart={()=>{host.current?.start();}}
      onInvitation={value=>{setInvitation(value);setReplaceSave(null);}} onJoin={joinGuest}/>
    {view&&<section className="mt-6 rounded-xl border-2 border-[#ae8550] bg-[#f3e7cd] p-4 text-[#392616] sm:p-6">
      <p className="mb-4 leading-7">{zh?'每人初始 200 个练习筹码，小盲 5、大盲 10，不涉及真钱。获胜方式：其他人都弃牌，或摊牌时你的五张牌组合最大。每手结算后，所有仍有筹码的人都确认才发下一手；筹码为零者旁观。':'Each player starts with 200 practice chips; blinds 5/10. No real money. Win when everyone else folds, or by the best five-card hand at showdown. All funded players must confirm the next hand; players with zero chips watch.'}</p>
      <MultiPokerTable view={view} locale={locale} disabled={phase!=='playing'||pending} onAction={submit}/>
      {pending&&<p role="status">{zh?'等待房主确认……':'Waiting for host acknowledgement…'}</p>}
      {view.over&&<><p className="mt-4">{zh?'已确认下一手的座位：':'Seats ready for next hand: '}{view.next.map((ready,i)=>ready?i+1:null).filter(Boolean).join(', ')||'—'}</p>
      <button className="rpg-button mt-3" disabled={phase!=='playing'||pending||view.next[view.seat]||view.stacks[view.seat]===0||view.stacks.filter(n=>n>0).length<2} onClick={()=>submit({kind:'next'})}>{zh?'我准备好，继续下一手':'Ready for the next hand'}</button>
      {view.stacks.filter(n=>n>0).length<2&&<p>{zh?'只剩一位玩家有筹码，本场结束。请离开后重新建房。':'Only one funded player remains. Match finished; leave and create a new room.'}</p>}</>}
    </section>}
  </>;
}
