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
import {FourSeatSetup} from '@/components/remote/RoomKit';

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
  return <>
    <FourSeatSetup zh={zh} title={zh?'四川血战麻将 · 四人 · 手动直连':'Four-player Sichuan Blood Battle · Manual direct connection'} role={role} phase={phase} connected={connected} offers={offers} responses={responses} invitation={invitation} answer={answer} busy={busy} error={error}
      saved={!!saved} saveError={saveError} replaceSave={replaceSave} clearConfirm={clearConfirm} restoring={restoring} confirm={confirm}
      notes={<><p>{zh?'不需要注册，没有后端或信令服务。房主与三位朋友分别交换一组文本；建议同一局域网。跨公网不保证连通，因为没有中继。不同设备都需能打开有效 HTTPS 网站：localhost 只属于当前设备，直接输入 http://局域网IP 也不具备刷新恢复所需的安全上下文。连接文本含网络连接信息，只私下发给同桌朋友。':'No registration, backend or signaling service. The host exchanges a separate text pair with each of three friends. LAN is recommended; cross-network success is not guaranteed without relays. Each device needs a valid HTTPS site: localhost refers only to that device, and plain HTTP on a LAN IP lacks the secure context required for refresh recovery. Share connection text privately with your table only.'}</p><p>{zh?'房主浏览器保管牌堆并执行规则，请只和信任的人对局。这不是防作弊服务器，不涉及真钱。断线会冻结对局；恢复需要原房主和全部三位玩家各自保留本标签页存档，并重新交换连接文本。':'The trusted host owns the deck and rules; this is not a cheat-proof server or a money game. Disconnection freezes play. Recovery needs the original host and all three guests, each retaining their own tab’s save and exchanging fresh connection text.'}</p><p>{zh?'进入牌局后自动保存到本标签页 sessionStorage。房主存档含完整牌墙和恢复凭证，来宾只保存本席牌面与凭证；不要导出或分享存档。刷新后先选“恢复本标签页牌局”。房主重新为原座位生成邀请，朋友先恢复，再粘贴自己的新邀请；四人到齐后房主点“继续原牌局”。关闭标签页、清理浏览器数据或存储被禁用时可能丢失，不能换设备恢复。':'After play starts, progress is saved in this tab’s sessionStorage. The host save contains the full wall and credentials; a guest saves only their view and credential. Never export or share saves. After refresh choose “Restore this tab’s match.” The host makes fresh invitations for the original seats; guests restore first, then paste their own invitation. Once all return, the host continues the original match. Closing the tab, clearing data or blocked storage can lose the save. Device migration is not supported.'}</p></>}
      onCreate={()=>createHost()} onLeave={()=>{if(!confirm){setConfirm(true);return;}reset();setBusy(false);setRole('none');setPhase('idle');}} onRestore={restoreSaved}
      onClear={()=>{if(!clearConfirm){setClearConfirm(true);return;}if(forget()){guestRecovery.current=undefined;setRestoring(false);}}}
      onOffer={id=>work(async()=>{const h=host.current!,token=epoch.current,value=await h.offer(id);if(token===epoch.current)setOffers(o=>o.map((v,i)=>i===id?value:v));})} onCopy={copy}
      onResponse={(id,value)=>setResponses(o=>o.map((v,i)=>i===id?value:v))} onFinish={id=>work(async()=>{await host.current!.finish(id,responses[id]);})}
      onCancelOffer={id=>{host.current?.cancelOffer(id);setOffers(o=>o.map((v,i)=>i===id?'':v));setResponses(o=>o.map((v,i)=>i===id?'':v));}} onStart={()=>{host.current?.start();}}
      onInvitation={value=>{setInvitation(value);setReplaceSave(null);}} onJoin={joinGuest}/>
    {view&&<>
      <SichuanPractice locale={locale} remote={{view,disabled:phase!=='playing'||pending,onAction:submit}}/>
      {pending&&<p role="status">{zh?'等待房主确认……':'Waiting for host acknowledgement…'}</p>}
    </>}
  </>;
}
