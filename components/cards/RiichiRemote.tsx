'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {ManualRiichiHost,ManualRiichiGuest} from '@/lib/mahjong/riichi-manual';
import type {RiichiRoomMessage,RiichiRoomPayload} from '@/lib/mahjong/riichi-room';
import RiichiPractice,{type RiichiRemoteSource} from './RiichiPractice';
import {readRiichiSave,writeRiichiSave,clearRiichiSave,type RiichiSave} from '@/lib/mahjong/riichi-save';
import {secureMultiplayerContext,insecureMultiplayerMessage} from '@/lib/network-context';
import {readManualSignal} from '@/lib/manual-rtc';
import {FourSeatSetup} from '@/components/remote/RoomKit';
import {useFourSeatLink} from '@/components/remote/useFourSeatLink';

export default function RiichiRemote({locale}:{locale:'zh'|'en'}){
  const zh=locale==='zh',host=useRef<ManualRiichiHost|null>(null),guest=useRef<ManualRiichiGuest|null>(null);
  const listener=useRef<((p:RiichiRoomPayload)=>void)|null>(null),epoch=useRef(0),requests=useRef(0);
  const [role,setRole]=useState<'none'|'host'|'guest'>('none'),[phase,setPhase]=useState<'idle'|'lobby'|'connecting'|'playing'|'finished'|'closed'>('idle'),[connected,setConnected]=useState([true,false,false,false]);
  const [offers,setOffers]=useState(['','','','']),[responses,setResponses]=useState(['','','','']),[invitation,setInvitation]=useState(''),[answer,setAnswer]=useState('');
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[version,setVersion]=useState(0),[confirm,setConfirm]=useState(false);
  const [saved,setSaved]=useState<RiichiSave|null>(null),[saveError,setSaveError]=useState(''),[replaceSave,setReplaceSave]=useState<'host'|'guest'|null>(null),[clearConfirm,setClearConfirm]=useState(false),[restoring,setRestoring]=useState(false);
  const guestRecovery=useRef<string|undefined>(undefined);
  const link=useFourSeatLink('riichi',zh),autoJoin=useRef(false);
  // Link mode reconnects by itself after a drop (screen lock, app switch): the host keeps the
  // room link and restarts the verified recovery; guests rejoin it; play resumes once all four are back.
  const autoTries=useRef(0),autoRun=useRef(false),played=useRef(false),[reconnectNote,setReconnectNote]=useState('');
  useEffect(()=>{let active=true;queueMicrotask(()=>{if(!active)return;try{setSaved(readRiichiSave(sessionStorage));}catch{setSaveError(zh?'无法读取本标签页存档；不要假定可以恢复。':'Cannot read this tab’s save; recovery is not assured.');}});return()=>{active=false;};},[zh]);
  function persist(){try{const checkpoint=host.current?.room.recoveryCheckpoint()??guest.current?.recoveryCheckpoint();if(!checkpoint)return;setSaved(writeRiichiSave(sessionStorage,host.current?'host':'guest',checkpoint));setSaveError('');}catch{setSaveError(zh?'本次进度保存失败！请保留页面，不要刷新；旧存档可能落后，恢复可能被拒绝。':'This update could not be saved! Keep this page open; an older save may be rejected during recovery.');}}
  function forget(){try{clearRiichiSave(sessionStorage);setSaved(null);setSaveError('');setClearConfirm(false);return true;}catch{setSaveError(zh?'无法清除本标签页存档，请检查浏览器站点数据设置。':'Could not clear this tab’s save. Check browser site-data settings.');return false;}}
  const source=useMemo<RiichiRemoteSource>(()=>({subscribe:fn=>{listener.current=fn;return()=>{if(listener.current===fn)listener.current=null;};},submit:(revision,choice)=>host.current?host.current.submit(++requests.current,revision,choice):!!guest.current?.submit(revision,choice)}),[]);
  useEffect(()=>()=>{epoch.current++;host.current?.close();guest.current?.close();},[]);
  function reset(keepRoom=false){if(!keepRoom)link.stop();epoch.current++;host.current?.close();guest.current?.close();host.current=null;guest.current=null;requests.current=0;setOffers(['','','','']);setResponses(['','','','']);setAnswer('');setInvitation('');setError('');setConfirm(false);setClearConfirm(false);setVersion(v=>v+1);setConnected([true,false,false,false]);}
  function receive(token:number,m:RiichiRoomMessage){
    if(token!==epoch.current)return;
    const p=m.payload;
    if(p.kind!=='lobby'&&p.kind!=='closed'&&p.kind!=='ack'){played.current=true;if(autoRun.current){autoRun.current=false;autoTries.current=0;setReconnectNote('');}}
    if(p.kind==='closed'&&link.mode==='link'&&(played.current||autoRun.current)){autoReconnect();return;}
    if(p.kind==='lobby'&&autoRun.current&&host.current&&p.connected.every(Boolean))queueMicrotask(()=>{if(token===epoch.current)host.current?.start();});
    if(p.kind==='lobby'){setConnected(p.connected);setPhase('lobby');setOffers(o=>o.map((v,i)=>p.connected[i]?'':v));setResponses(o=>o.map((v,i)=>p.connected[i]?'':v));setAnswer('');}
    if(p.kind==='state')setPhase('playing');
    if(p.kind==='finished')setPhase('finished');
    if(p.kind==='closed'){if(host.current)persist();setPhase('closed');setError(zh?'连接已结束，未完成的牌局不判胜。请保留四人各自本标签页存档，重新交换邀请恢复。':'Connection ended without a winner for an unfinished hand. Preserve each player’s tab save and exchange fresh invitations to recover.');}
    if(p.kind==='ack'&&!p.accepted)setError(zh?'操作未被接受。请勿重复点击；若无法继续，请保留存档并恢复原牌局。':'Action rejected. Do not repeat clicks; preserve the save and restore the original match if needed.');
    listener.current?.(p);
    if(p.kind==='checkpoint')persist();
  }
  function disconnected(token:number){
    if(token!==epoch.current)return;
    if(link.mode==='link'&&(played.current||autoRun.current)){autoReconnect();return;}
    if(host.current&&host.current.room.status!=='lobby')persist();
    setPhase('closed');setOffers(['','','','']);setResponses(['','','','']);setAnswer('');setError(zh?'直连断开或确认超时。当前牌面保留，但不能继续出牌。':'Disconnected or acknowledgement timed out. Tiles are retained; further actions are disabled.');
    listener.current?.({kind:'closed',reason:'player-left',player:0});
  }
  function createHost(checkpoint?:string,auto=false){
    if(!secureMultiplayerContext()){setError(insecureMultiplayerMessage(locale));return;}
    if(!checkpoint&&(saved||saveError)&&replaceSave!=='host'){setReplaceSave('host');return;}
    reset(auto);if(!auto){autoTries.current=0;setReconnectNote('');}played.current=false;autoRun.current=auto;guestRecovery.current=undefined;setRestoring(!!checkpoint);setReplaceSave(null);const token=epoch.current;setRole('host');setPhase('lobby');
    try{host.current=new ManualRiichiHost(m=>receive(token,m),id=>{if(token!==epoch.current)return;if(host.current?.room.status==='lobby'){setConnected(c=>c.map((v,i)=>i===id?false:v));setOffers(o=>o.map((v,i)=>i===id?'':v));setResponses(o=>o.map((v,i)=>i===id?'':v));}else disconnected(token);},undefined,checkpoint);}
    catch{setPhase('closed');setError(zh?'存档无效或版本不兼容，未创建恢复房间。原存档保留。':'Invalid or incompatible save. Recovery room not created; original save retained.');}
    if(link.mode==='link'&&host.current)void link.host(()=>token===epoch.current,()=>host.current,message=>{if(token===epoch.current){setError(message);setPhase('closed');}},{recovering:!!checkpoint,reuse:auto,onReturning:()=>autoReconnect()});
  }
  function restoreSaved(){if(!saved)return;if(saved.role==='host')createHost(saved.checkpoint);else{reset();guestRecovery.current=saved.checkpoint;setRestoring(true);setRole('none');setPhase('idle');if(link.mode==='link'&&link.hasStoredRoom())joinLink();}}
  function autoReconnect(){
    persist();
    let save:{role:'host'|'guest';checkpoint:string}|null=null;
    try{save=readRiichiSave(sessionStorage);}catch{/* fall through to a plain stop */}
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
      try{guest.current=new ManualRiichiGuest(m=>receive(token,m),()=>disconnected(token),()=>channel,checkpoint);}
      catch{channel.close();setPhase('closed');setError(zh?'存档无效或版本不兼容，未加入。原存档保留。':'Invalid or incompatible save; not joined. Original save retained.');}
    },message=>{if(token===epoch.current){setPhase('closed');setError(message);}},auto);
  }
  // Opening an invitation link joins straight away, unless this tab holds a saved match to protect.
  useEffect(()=>{
    if(!link.invited||autoJoin.current)return;autoJoin.current=true;
    let protectedSave=false;try{protectedSave=readRiichiSave(sessionStorage)!==null;}catch{protectedSave=true;}
    if(!protectedSave)queueMicrotask(joinLink);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[link.invited]);
  function joinGuest(){
    if(!secureMultiplayerContext()){setError(insecureMultiplayerMessage(locale));return;}
    const text=invitation,checkpoint=guestRecovery.current;
    try{readManualSignal(text,'riichi','offer');}catch{setReplaceSave(null);setError(zh?'邀请文本无效或不属于日式麻将；原存档仍保留。':'Invalid invitation or wrong game; the original save is still intact.');return;}
    if(!checkpoint&&(saved||saveError)&&replaceSave!=='guest'){setReplaceSave('guest');return;}
    reset();setReplaceSave(null);setRestoring(!!checkpoint);setRole('guest');setPhase('connecting');const token=epoch.current;
    void work(async()=>{try{guest.current=new ManualRiichiGuest(m=>receive(token,m),()=>disconnected(token),undefined,checkpoint);const value=await guest.current.answer(text);if(token===epoch.current)setAnswer(value);}catch(e){if(token===epoch.current)setPhase('closed');throw e;}});
  }
  async function work(action:()=>Promise<void>){const token=epoch.current;setBusy(true);setError('');try{await action();}catch{if(token===epoch.current){guest.current?.close();setError(zh?'连接文本无效、步骤不符或浏览器无法直连。检查是否粘贴完整，必要时取消后重试。':'Invalid connection text, wrong step or unavailable direct connection. Check the complete text; cancel and retry if needed.');}}finally{if(token===epoch.current)setBusy(false);}}
  async function copy(value:string){try{await navigator.clipboard.writeText(value);}catch{setError(zh?'无法自动复制，请选中文本框中的全部文字手动复制。':'Copy failed; select all text in the field and copy manually.');}}
  return <>
    <FourSeatSetup link={{mode:link.mode,onMode:mode=>{reset();setBusy(false);setRole('none');setPhase('idle');guestRecovery.current=undefined;setRestoring(false);setReplaceSave(null);link.setMode(mode);},code:link.code,note:link.note,entry:link.entry,onEntry:value=>{link.setEntry(value);setReplaceSave(null);},canJoin:link.canJoin,onJoin:()=>joinLink(),visitors:link.visitors,onAdmit:link.admit,onDeny:link.deny,reconnect:reconnectNote}} zh={zh} title={zh?'四人日式麻将':'Four-player riichi'} role={role} phase={phase} connected={connected} offers={offers} responses={responses} invitation={invitation} answer={answer} busy={busy} error={error}
      saved={!!saved} saveError={saveError} replaceSave={replaceSave} clearConfirm={clearConfirm} restoring={restoring} confirm={confirm}
      notes={<><p>{zh?'不需要注册。以下为邀请码方式的说明：它不经过任何后端或信令服务。房主与三位朋友分别交换一组文本；建议同一局域网。跨公网不保证连通，因为没有中继。不同设备都需能打开有效 HTTPS 网站：localhost 只属于当前设备，直接输入 http://局域网IP 也不具备刷新恢复所需的安全上下文。连接文本含网络连接信息，只私下发给同桌朋友。':'No registration. Code mode (described here) uses no backend or signaling service. The host exchanges a separate text pair with each of three friends. LAN is recommended; cross-network success is not guaranteed without relays. Each device needs a valid HTTPS site: localhost refers only to that device, and plain HTTP on a LAN IP lacks the secure context required for refresh recovery. Share connection text privately with your table only.'}</p><p>{zh?'房主浏览器保管牌墙并执行规则，请只和信任的人对局。这不是防作弊服务器，不涉及真钱。断线会冻结本场；原房主和三位来宾须保留各自标签页存档，重新交换邀请恢复。':'The trusted host browser owns the wall and rules. This is not a cheat-proof server or a money game. A disconnection freezes play. Recovery requires the original host and three guests, each with their tab save and fresh invitations.'}</p><p>{zh?'进入牌局后自动保存到本标签页 sessionStorage。房主存档含原始牌墙、完整操作记录和四席恢复凭证；来宾仅保存本席牌面与凭证。不要导出或分享存档。刷新后，房主先点“恢复本标签页牌局”，按原座位给三人分别生成新邀请；来宾也先恢复，再粘贴自己收到的新邀请。四人到齐后房主点“继续原牌局”，不会重新发牌。关闭标签页、清理数据或禁止存储可能导致丢失；不能换设备恢复。':'After play starts, progress is saved in this tab’s sessionStorage. The host save contains the original walls, full action log and four recovery credentials; a guest saves only their seat view and credential. Never export or share saves. After refresh, the host restores first and makes fresh invitations for the original seats. Guests restore before pasting their own new invitations. Once all four return, the host continues without a new deal. Closing the tab, clearing data or blocked storage can lose the save; device migration is unsupported.'}</p></>}
      onCreate={()=>createHost()} onLeave={()=>{if(!confirm){setConfirm(true);return;}reset();setBusy(false);setRole('none');setPhase('idle');}} onRestore={restoreSaved}
      onClear={()=>{if(!clearConfirm){setClearConfirm(true);return;}if(forget()){guestRecovery.current=undefined;setRestoring(false);}}}
      onOffer={id=>work(async()=>{const h=host.current!,token=epoch.current,value=await h.offer(id);if(token===epoch.current)setOffers(o=>o.map((v,i)=>i===id?value:v));})} onCopy={copy}
      onResponse={(id,value)=>setResponses(o=>o.map((v,i)=>i===id?value:v))} onFinish={id=>work(async()=>{await host.current!.finish(id,responses[id]);})}
      onCancelOffer={id=>{host.current?.cancelOffer(id);setOffers(o=>o.map((v,i)=>i===id?'':v));setResponses(o=>o.map((v,i)=>i===id?'':v));}} onStart={()=>{host.current?.start();}}
      onInvitation={value=>{setInvitation(value);setReplaceSave(null);}} onJoin={joinGuest}/>
    <RiichiPractice key={version} locale={locale} remote={source}/>
  </>;
}
