'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { Peer, DataConnection } from 'peerjs';
import { bestHand, cardText, categories, categoriesEn, rankText } from '@/lib/holdem';
import { type PokerView, type PokerRequest } from '@/lib/holdem-remote';
import { PokerPeerChannel } from '@/lib/holdem-peer-channel';
import { roomCode } from '@/lib/board/remote-match';
import ResultDialog from '@/components/ui/ResultDialog';
import { ManualHeadsUpPokerHost, ManualHeadsUpPokerGuest } from '@/lib/holdem-headsup-manual';
import type { HeadsUpRoomMessage } from '@/lib/holdem-headsup-room';
import { readHeadsUpPokerSave, writeHeadsUpPokerSave, clearHeadsUpPokerSave, type HeadsUpPokerSave } from '@/lib/holdem-headsup-save';
import {secureMultiplayerContext,insecureMultiplayerMessage} from '@/lib/network-context';
import {readManualSignal} from '@/lib/manual-rtc';

const noSubscribe = () => () => {};


export default function HoldemRemote({ locale }: { locale: 'zh' | 'en' }) {
  const zh = locale === 'zh';
  const text = (cn: string, en: string) => zh ? cn : en;
  const invited = useSyncExternalStore(noSubscribe, () => roomCode(new URLSearchParams(location.search).get('room') ?? '', 'holdem'), () => '');
  const [entry, setEntry] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'waiting' | 'connected' | 'error'>('idle');
  const [error, setError] = useState('');
  const [view, setView] = useState<PokerView | null>(null);
  const [pending, setPending] = useState(false);
  const [raise, setRaise] = useState('20');
  const peer = useRef<Peer | null>(null);
  const connection = useRef<Pick<DataConnection, 'open' | 'send' | 'close'> | null>(null);
  const manualHost = useRef<ManualHeadsUpPokerHost | null>(null);
  const manualGuest = useRef<ManualHeadsUpPokerGuest | null>(null);
  const manualRequest = useRef(0);
  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);
  const [saved, setSaved] = useState<HeadsUpPokerSave | null>(null);
  const [saveError, setSaveError] = useState('');
  const [clearArmed, setClearArmed] = useState(false);
  const [replaceIntent, setReplaceIntent] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualStep, setManualStep] = useState<'idle' | 'preparing' | 'offer' | 'answer' | 'connecting'>('idle');
  const [signalOut, setSignalOut] = useState('');
  const [signalIn, setSignalIn] = useState('');
  const [manualFeedback, setManualFeedback] = useState<{message:string;error:boolean}|null>(null);
  const latest = useRef<PokerView | null>(null);
  const generation = useRef(0);
  const active = useRef(false);
  const [isHostSeat, setIsHostSeat] = useState(false);
  const pendingRef = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function dispose() {
    generation.current++;
    active.current = false;
    readyRef.current = false;
    if (timer.current) clearTimeout(timer.current);
    connection.current?.close();
    peer.current?.destroy();
    connection.current = null;
    peer.current = null;
    pendingRef.current = false;
    manualHost.current?.close(); manualHost.current = null;
    manualGuest.current?.close(); manualGuest.current = null;
    manualRequest.current = 0;
  }
  useEffect(() => () => dispose(), []);
  useEffect(() => { let live=true;queueMicrotask(()=>{if(!live)return;try{setSaved(readHeadsUpPokerSave(sessionStorage));}catch{setSaveError(locale==='zh'?'存档无法读取；请勿假定刷新后可恢复。':'Save unavailable; do not rely on refresh recovery.');}});return()=>{live=false;}; }, [locale]);
  function persistManual() {
    try {
      const checkpoint=manualHost.current?.room.recoveryCheckpoint()??manualGuest.current?.recoveryCheckpoint();
      if(checkpoint){setSaved(writeHeadsUpPokerSave(sessionStorage,manualHost.current?'host':'guest',checkpoint));setSaveError('');}
    } catch { setSaveError(text('本次保存失败；请保持页面打开。旧存档可能落后，恢复时会重新校验。','Save failed. Keep the page open. An older save may be behind and must be checked during recovery.')); }
  }
  function clearSave() {
    if(!clearArmed){setClearArmed(true);return;}
    try{clearHeadsUpPokerSave(sessionStorage);setSaved(null);setClearArmed(false);setReplaceIntent(null);setSaveError('');}catch{setSaveError(text('无法确认存档已清除，请检查浏览器站点数据设置。','Could not confirm the save was cleared. Check browser site-data settings.'));}
  }
  function allowNew(intent:string) {
    if(!saved&&!saveError)return true;
    if(replaceIntent!==intent){setReplaceIntent(intent);const message=text('本标签页有原局存档或读取失败。若要开始新局，请再次点击同一个按钮；旧存档会保留到新局真正开始并成功保存后才被覆盖。','This tab has a saved match or its save could not be read. Click the same button again to start a new match. The old save stays until the new match starts and saves successfully.');if(intent.startsWith('manual-'))setManualFeedback({message,error:true});else setError(message);return false;}
    setReplaceIntent(null);setClearArmed(false);return true;
  }
  function manualMessage(message:HeadsUpRoomMessage,token:number) {
    if(token!==generation.current)return;
    const p=message.payload;
    if(p.kind==='lobby'){readyRef.current=p.connected.every(Boolean);setReady(readyRef.current);setStatus('waiting');if(readyRef.current&&timer.current)clearTimeout(timer.current);}
    if(p.kind==='view'){if(timer.current)clearTimeout(timer.current);active.current=true;setStatus('connected');accept(p.view);persistManual();}
    if(p.kind==='ack'){setPending(false);pendingRef.current=false;if(!p.accepted)setError(text('动作未执行，请按最新牌面重选。','Action not applied. Choose again from the current table.'));}
  }
  function fail(message: string, manual=false) {
    if(manualHost.current&&active.current)persistManual();
    dispose(); setStatus('error'); setPending(false); if(manual)setManualFeedback({message,error:true});else setError(message);
  }
  function accept(v: PokerView) {
    latest.current = v; setView(v); setPending(false); pendingRef.current = false;
    setRaise(String(v.legal ? Math.min(v.legal.minTo, v.legal.maxTo) : 20));
  }
  async function start(isHost: boolean) {
    if(!secureMultiplayerContext()){setError(insecureMultiplayerMessage(locale));return;}
    const target = roomCode(entry ?? invited, 'holdem');
    if (!isHost && !target) { setError(text('请输入正确的扑克房间码或邀请链接。', 'Enter a valid poker room code or invitation link.')); return; }
    if(!allowNew(isHost?'quick-host':'quick-guest'))return;
    dispose(); const token = generation.current;
    setReady(false);setRestoring(false);setClearArmed(false);
    setIsHostSeat(isHost); latest.current = null;
    setView(null); setPending(false); setCode(''); setError(''); setStatus('connecting');
    setManualFeedback(null);
    setManualStep('idle'); setSignalIn(''); setSignalOut('');
    const timedOut = () => { if (generation.current === token) fail(text('连接超时，未自动扣除筹码。请重新建房或更换网络。', 'Connection timed out. No automatic chip penalty. Try a new room or another network.')); };
    timer.current = setTimeout(timedOut, 25000);
    try {
      const { default: PeerClient } = await import('peerjs');
      if (token !== generation.current) return;
      const id = `yf-holdem-${Array.from(crypto.getRandomValues(new Uint8Array(6)), n => n.toString(16).padStart(2, '0')).join('')}`;
      const p = isHost ? new PeerClient(id) : new PeerClient();
      peer.current = p;
      const attach = (c: DataConnection) => {
        if (connection.current) { c.on('open', () => c.close()); return; }
        connection.current = c;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(timedOut, 25000);
        const closed=()=>{if(token===generation.current)fail(text('连接已断开；本手不自动判胜。请双方用本标签页存档恢复，并交换新的手动连接信息。','Disconnected; unfinished hands are not awarded. Both players should restore this tab’s save and exchange fresh manual connection information.'));};
        const create=()=>new PokerPeerChannel(c);
        if(isHost){
          const protocol=new ManualHeadsUpPokerHost(m=>manualMessage(m,token),closed,create);
          manualHost.current=protocol;
          void protocol.offer(1).catch(()=>{if(token===generation.current)fail(text('无法准备牌局连接。','Could not prepare the game connection.'));});
        }else manualGuest.current=new ManualHeadsUpPokerGuest(m=>manualMessage(m,token),closed,create);
      };
      p.on('open', own => {
        if (token !== generation.current) return;
        if (isHost) { setCode(own); setStatus('waiting'); if (timer.current) clearTimeout(timer.current); }
        else { setCode(target); attach(p.connect(target, { reliable: true })); }
      });
      p.on('connection', c => {
        if (token !== generation.current || !isHost) { c.on('open', () => c.close()); return; }
        attach(c);
      });
      p.on('error', e => { if (token === generation.current) fail(`${text('连接失败', 'Connection failed')}: ${e.type}`); });
    } catch { if (token === generation.current) fail(text('无法启动连接服务，请重试。', 'Could not start the connection service. Please retry.')); }
  }
  function act(action: PokerRequest['action']) {
    if (!active.current || !latest.current || pendingRef.current) return;
    setError('');
    const request: PokerRequest = { hand: latest.current.hand, revision: latest.current.revision, action };
    if(manualHost.current){manualHost.current.submit(++manualRequest.current,request);return;}
    if(manualGuest.current){pendingRef.current=true;setPending(true);if(!manualGuest.current.submit(request)){pendingRef.current=false;setPending(false);}return;}
  }

  async function startManual(isHost: boolean, recovery?:HeadsUpPokerSave) {
    if(!secureMultiplayerContext()){setManualFeedback({message:insecureMultiplayerMessage(locale),error:true});return;}
    if (['connecting', 'waiting', 'connected'].includes(status)) return;
    if(!isHost){try{readManualSignal(signalIn,'holdem-two','offer');}catch{setReplaceIntent(null);setManualFeedback({message:text('邀请文本无效或不属于双人扑克；原存档仍保留。','Invalid invitation or wrong game; the original save is still intact.'),error:true});return;}}
    if(!recovery&&!allowNew(isHost?'manual-host':'manual-guest'))return;
    setManualOpen(true);
    dispose(); const token = generation.current;
    setReady(false);setRestoring(!!recovery);setClearArmed(false);setReplaceIntent(null);
    setIsHostSeat(isHost); latest.current = null;
    setView(null); setPending(false); setCode(''); setError(''); setStatus('connecting');
    setManualFeedback(null);
    setSignalOut(''); setManualStep('preparing');
    try {
      const closed=()=>{if(token===generation.current)fail(text('直连已断开。未完成的手牌不自动判胜。请双方用原存档恢复，并重新交换邀请和回应。','Connection closed; unfinished hands are not awarded. Both players should restore their original saves and exchange fresh invitation and response.'),true);};
      let output:string;
      if(isHost){const link=new ManualHeadsUpPokerHost(m=>manualMessage(m,token),closed,undefined,recovery?.checkpoint);manualHost.current=link;output=await link.offer(1);}
      else{const link=new ManualHeadsUpPokerGuest(m=>manualMessage(m,token),closed,undefined,recovery?.checkpoint);manualGuest.current=link;output=await link.answer(signalIn);}
      if (token !== generation.current) return;
      setSignalOut(output); setManualStep(isHost ? 'offer' : 'answer');
      if (!active.current) setStatus('waiting');
    } catch { if (token === generation.current) fail(text('连接信息不正确或浏览器无法直连。请确认同一局域网、双方打开 HTTPS 网站，并重新生成完整信息。', 'Invalid connection information or WebRTC unavailable. Check the same LAN, open HTTPS pages on both devices, and generate fresh complete information.'),true); }
  }
  async function finishManual() {
    if (!manualHost.current || manualStep !== 'offer') return;
    const token = generation.current;
    setManualStep('connecting'); setManualFeedback(null);
    try {
      await manualHost.current.finish(1,signalIn);
      if (token !== generation.current || active.current || readyRef.current) return;
      timer.current = setTimeout(() => { if (token === generation.current) fail(text('未能直连。检查局域网隔离、防火墙或重新交换信息；不会自动切换公共服务。', 'Could not connect. Check LAN isolation/firewall or exchange fresh information. No automatic public-service fallback.'),true); }, 25000);
    } catch { if (token === generation.current) { setManualStep('offer'); setManualFeedback({message:text('回应信息无效或不属于本次邀请，请重新粘贴。', 'Invalid response or wrong invitation. Paste the matching response.'),error:true}); } }
  }
  async function copyManual() {
    try { await navigator.clipboard.writeText(signalOut); setManualFeedback({message:text('已复制完整连接信息。', 'Complete connection information copied.'),error:false}); }
    catch { setManualFeedback({message:text('请手动全选下方输出信息并复制。', 'Select and copy all of the output manually.'),error:true}); }
  }
  async function copy(invitation: boolean) {
    const url = new URL(location.href); url.search = ''; url.searchParams.set('room', code);
    try { await navigator.clipboard.writeText(invitation ? url.href : code); setError(text('已复制。', 'Copied.')); }
    catch { setError(text('复制失败，请手动选择房间码复制。', 'Copy failed. Select and copy the room code manually.')); }
  }
  const busy = ['connecting', 'waiting', 'connected'].includes(status);
  const cards = (list: number[], hidden = false) => <div className="my-3 flex flex-wrap gap-2">{list.map((c, i) => <span key={i} aria-label={hidden ? text('未公开的手牌', 'Hidden card') : cardText(c)} className={`grid h-24 w-16 place-items-center rounded border border-[#ae8550] bg-[#fff8e8] text-xl font-bold ${!hidden && /[♥♦]/.test(cardText(c)) ? 'text-[#9b3026]' : 'text-[#392616]'}`}>{hidden ? '?' : cardText(c)}</span>)}</div>;
  const a = view?.legal;
  const winning = view?.winner === view?.seat;
  let reason = '';
  if (view?.over) {
    reason = text('一方弃牌，另一方获得底池；双方手牌仍保密。', 'One player folded; the other wins the pot. Private cards stay hidden.');
    if (view.showdown) {
      const own = bestHand([...view.ownCards, ...view.community]), opponent = bestHand([...view.opponentCards, ...view.community]);
      reason = text(`你的最佳五张：${own.cards.map(cardText).join(' ')}（${categories[own.score[0]]}）。\n对手最佳五张：${opponent.cards.map(cardText).join(' ')}（${categories[opponent.score[0]]}）。\n先比较牌型，再依次比较点数：你 ${own.score.slice(1).map(rankText).join('、')}；对手 ${opponent.score.slice(1).map(rankText).join('、')}。第一处不同决定大小；完全相同平分。A 通常最大，A2345 顺子按 5 高算。`, `Your best five: ${own.cards.map(cardText).join(' ')} (${categoriesEn[own.score[0]]}).\nOpponent: ${opponent.cards.map(cardText).join(' ')} (${categoriesEn[opponent.score[0]]}).\nCompare category, then tie-breakers in order: you ${own.score.slice(1).map(rankText).join(', ')}; opponent ${opponent.score.slice(1).map(rankText).join(', ')}. The first difference decides; identical hands split. Ace is high except in A2345.`);
    }
    reason += text(`\n\n你获得底池 ${view.awarded[view.seat]}，余额 ${view.stacks[view.seat]}，本手净变化 ${view.stacks[view.seat] - view.start[view.seat]}。无人跟上的投入会退回，不算赢利。`, `\n\nYour pot award: ${view.awarded[view.seat]}; balance: ${view.stacks[view.seat]}; net change: ${view.stacks[view.seat] - view.start[view.seat]}. Unmatched contributions are refunded, not winnings.`);
  }
  return <section className="space-y-6">
    <aside className="space-y-3 border border-[#ae8550] bg-[#f3e7cd] p-4 leading-7" aria-label={text('双人手动直连存档','Heads-up manual connection save')}>
      <h2 className="text-xl font-bold">{text('刷新后继续原局','Continue after a refresh')}</h2>
      <p>{text('快捷房间和手动直连均支持此存档；恢复统一使用下方手动直连，不需要再次联系快捷连接服务。开局后自动保存在当前标签页：房主保存原牌序与操作，朋友只保存自己的可见牌面。双方刷新后，房主先恢复并发送新邀请；朋友把邀请粘贴到“收到的信息”，再点恢复并发回回应；房主应用回应后点击继续。','Both quick rooms and manual connections support saves. Recovery uses Manual LAN connection below, without contacting the quick connection service again. Once play starts, this tab saves the host’s deck and actions or the guest’s own view. After refreshing, the host restores and sends a fresh invitation. The guest pastes it into Received information, restores and returns the response. The host applies it and chooses Continue.')}</p>
      <p>{text('只与信任的朋友连接。不要分享存档。关闭标签页、清理浏览器数据或更换设备可能无法恢复。','Connect only with trusted friends. Never share saves. Closing the tab, clearing browser data or changing devices may prevent recovery.')}</p>
      {saved?<><p role="status">{text(`本标签页已保存：${saved.role==='host'?'房主':'朋友'}。`,`Saved in this tab: ${saved.role}.`)}</p><div className="flex flex-wrap gap-3"><button className="rpg-button" disabled={busy||(saved.role==='guest'&&!signalIn.trim())} onClick={()=>startManual(saved.role==='host',saved)}>{text('恢复本标签页原局','Restore this tab’s match')}</button><button className="rpg-button" disabled={busy} onClick={clearSave}>{clearArmed?text('确认清除原局存档','Confirm clear saved match'):text('清除本标签页存档','Clear this tab’s save')}</button>{clearArmed&&<button className="rpg-button" onClick={()=>setClearArmed(false)}>{text('取消清除','Cancel clear')}</button>}</div></>:<p>{text('本标签页暂无可用存档。','No available save in this tab.')}</p>}
      {saveError&&<p role="alert">{saveError}</p>}
      {!saved&&saveError&&<div className="flex flex-wrap gap-3"><button className="rpg-button" disabled={busy} onClick={clearSave}>{clearArmed?text('确认清除原局存档','Confirm clear saved match'):text('清除本标签页存档','Clear this tab’s save')}</button>{clearArmed&&<button className="rpg-button" onClick={()=>setClearArmed(false)}>{text('取消清除','Cancel clear')}</button>}</div>}
    </aside>
    <div className="space-y-4 border border-[#ae8550] p-4 sm:p-6">
      <h2 className="text-2xl font-bold">{text('双人扑克 · 好友房间', 'Heads-up poker · Friend room')}</h2>
      <p className="text-sm leading-7">{text('此快捷房间仅在你点击创建或加入后使用 PeerJS 公共信令；其默认配置还会尝试第三方 STUN，并可能使用 TURN 中继传输对局数据。它不是完全无服务的直连，也不保证一定能点对点连接。不同设备应通过有效 HTTPS 打开网站，以支持安全恢复；想避免这些外部服务，请使用下方“局域网手动直连”。', 'Only after you create or join, this quick room uses public PeerJS signaling. Its default configuration also tries third-party STUN and may relay match data through TURN. This is not a fully service-free connection or a guarantee of peer-to-peer transport. Each device should open a valid HTTPS site for secure recovery; to avoid these external services, use Manual LAN connection below.')}</p>
      <ol className="list-decimal space-y-2 pl-5 leading-7"><li>{text('一人创建房间，把房间码或邀请链接发给另一人。', 'One person creates a room and shares the code or invitation.')}</li><li>{text('朋友粘贴房间码或链接，点击加入。双方连接后，房主确认开始发牌，每人 200 个练习筹码。', 'Your friend pastes it and joins. Once both connect, the host confirms Deal cards; each starts with 200 practice chips.')}</li><li>{text('轮到你才能行动。一手结束后双方同意才发下一手；筹码延续，小盲 5、大盲 10 轮换。筹码输光后本场结束。', 'Act only on your turn. Both players agree before the next hand; balances carry over and 5/10 blinds swap. The match ends when a player runs out.')}</li></ol>
      <p className="text-sm leading-7">{text('仅练习，不涉及真钱；没有自动重连。房主浏览器负责洗牌与判定，需要信任房主，这不是防作弊服务器。127.0.0.1 / localhost 不能让远方朋友访问，异地需要已部署的网站；某些网络可能无法连接。', 'Practice only, no real money or automatic reconnection. The host browser deals and adjudicates: trust your host; this is not a cheat-proof server. A distant friend needs a deployed website, not your localhost URL; some networks may be unable to connect.')}</p>
      <div className="flex flex-wrap gap-3"><button className="rpg-button" disabled={busy} onClick={() => start(true)}>{text('创建房间', 'Create room')}</button><input className="min-h-11 min-w-0 max-w-full flex-1 border border-[#ae8550] p-2" aria-label={text('房间码或邀请链接', 'Room code or invitation')} value={entry ?? invited} onChange={e => {setEntry(e.target.value);setReplaceIntent(null);}} disabled={busy}/><button className="rpg-button" disabled={busy} onClick={() => start(false)}>{text('加入房间', 'Join room')}</button><button className="rpg-button" disabled={status === 'idle'} onClick={() => { dispose(); setStatus('idle'); setCode(''); setView(null); setPending(false); setError(''); setManualFeedback(null); setManualStep('idle'); setSignalIn(''); setSignalOut(''); }}>{text('离开房间', 'Leave room')}</button></div>
      {code && <div className="flex flex-wrap items-center gap-3"><code className="break-all">{code}</code><button className="rpg-button" onClick={() => copy(false)}>{text('复制房间码', 'Copy room code')}</button><button className="rpg-button" onClick={() => copy(true)}>{text('复制邀请链接', 'Copy invitation')}</button></div>}
      <p role="status">{status === 'connected' ? (pending ? text('正在等待动作确认…', 'Waiting for acknowledgement…') : view?.over ? text('本手已结束', 'Hand complete') : a ? text('轮到你了', 'Your turn') : text('等待对手行动', 'Waiting for opponent')) : status === 'waiting' ? (ready ? text('双方已连接，请房主确认开始或继续原局。', 'Both connected. Waiting for the host to start or continue the saved match.') : manualStep === 'offer' ? text('邀请已生成：发给朋友，然后在此粘贴朋友的回应。', 'Invitation ready: send it to your friend, then paste their response here.') : manualStep === 'answer' ? text('回应已生成：发回房主，等待房主应用回应。', 'Response ready: send it to the host and wait for them to apply it.') : manualStep === 'connecting' ? text('正在尝试局域网直连…', 'Attempting a direct LAN connection…') : text('房间已创建，等待朋友加入。', 'Room created. Waiting for your friend.')) : status === 'connecting' ? text('正在连接…', 'Connecting…') : status === 'error' ? text('连接已停止', 'Connection stopped') : text('尚未加入房间', 'Not in a room')}</p>
      {error && <p role="alert" className="leading-7">{error}</p>}
    </div>
    <details open={manualOpen} onToggle={e=>setManualOpen(e.currentTarget.open)} className="space-y-4 border border-[#ae8550] p-4 sm:p-6">
      <summary className="cursor-pointer text-xl font-bold">{text('局域网手动直连 · 不使用信令服务器', 'Manual LAN connection · No signaling server')}</summary>
      <p className="leading-7">{text('此模式不联系 PeerJS、STUN 或 TURN。不同设备先通过有效 HTTPS 打开网站并接入同一局域网；localhost 只能在本机预览，http://局域网IP 不具备刷新恢复所需的安全上下文。连接信息不能代替网页地址。访客 Wi-Fi 隔离、防火墙或浏览器地址保护可能阻止直连，不保证异地可用。', 'This mode contacts no PeerJS, STUN or TURN service. Each device must first open a valid HTTPS site on the same LAN. Localhost is only for this device; plain HTTP on a LAN IP lacks the secure context required for refresh recovery. Connection text does not serve the website. Guest Wi-Fi isolation, firewalls or browser address protection can block direct connections; cross-network access is not guaranteed.')}</p>
      <ol className="list-decimal space-y-2 pl-5 leading-7">
        <li>{text('房主点“生成邀请信息”，把完整输出发给朋友。不要关闭此页面。', 'Host: generate an invitation and send the complete output to your friend. Keep this page open.')}</li>
        <li>{text('朋友粘贴到“收到的信息”，点“生成回应信息”，把新输出完整发回房主。', 'Friend: paste it into Received information, generate a response, and send the complete new output back.')}</li>
        <li>{text('房主把回应粘贴到“收到的信息”，点“应用回应并连接”。双方连接后，房主再点击“开始发牌”或“继续原局”；看到“轮到你了”或“等待对手行动”才进入牌局。', 'Host: paste the response into Received information and apply it. Once both are connected, the host must choose Deal cards or Continue saved match. Your turn or Waiting for opponent confirms play has begun.')}</li>
      </ol>
      <p className="text-sm">{text('信息只对本次页面有效，可能包含网络地址，请只发给受邀朋友，不要公开发布。取消或换模式请点“离开房间”。', 'Information is valid for this session and may contain network addresses. Share only with your invited friend. Choose Leave room to cancel or change modes.')}</p>
      <label className="block">{text('收到的信息', 'Received information')}<textarea className="mt-2 min-h-28 w-full border border-[#ae8550] p-3 font-mono text-xs" maxLength={65536} value={signalIn} onChange={e => {setSignalIn(e.target.value);setReplaceIntent(null);}} disabled={status === 'connected' || manualStep === 'preparing'} /></label>
      <div className="flex flex-wrap gap-3">
        <button className="rpg-button" disabled={busy} onClick={() => startManual(true)}>{text('生成邀请信息', 'Generate invitation')}</button>
        <button className="rpg-button" disabled={busy || !signalIn.trim()} onClick={() => startManual(false)}>{text('生成回应信息', 'Generate response')}</button>
        <button className="rpg-button" disabled={manualStep !== 'offer' || status !== 'waiting' || !signalIn.trim()} onClick={finishManual}>{text('应用回应并连接', 'Apply response and connect')}</button>
      </div>
      {manualFeedback&&<p role={manualFeedback.error?'alert':'status'} className={`leading-7 ${manualFeedback.error?'font-bold text-[#803d2b]':''}`}>{manualFeedback.message}</p>}
      {manualStep === 'preparing' && status === 'connecting' && <p role="status">{text('正在收集连接信息…', 'Gathering connection information…')}</p>}
      {signalOut && <><label className="block">{text('发给朋友的完整信息', 'Complete information to send')}<textarea readOnly className="mt-2 min-h-28 w-full border border-[#ae8550] p-3 font-mono text-xs" value={signalOut}/></label><button className="rpg-button" onClick={copyManual}>{text('复制完整信息', 'Copy complete information')}</button></>}
    </details>
    {ready&&status==='waiting'&&<div className="space-y-3 border border-[#ae8550] p-4"><p role="status">{text('双方已连接。请房主确认开始或继续原局。','Both players connected. The host must confirm Start or Continue.')}</p>{isHostSeat&&<button className="rpg-button" onClick={()=>{if(!manualHost.current?.start())setError(text('尚不能开始，请确认双方连接。','Cannot start yet. Check both connections.'));}}>{restoring?text('双方已连接，继续原局','Both connected — continue saved match'):text('双方已连接，开始发牌','Both connected — deal cards')}</button>}</div>}
    {view && <div className="space-y-5 border-2 border-[#ae8550] bg-[#f3e7cd] p-4 sm:p-6">
      <h2 className="text-xl font-bold">{text(`第 ${view.hand} 手 · 你是玩家${view.seat + 1}`, `Hand ${view.hand} · You are Player ${view.seat + 1}`)}</h2>
      <p>{text('阶段：', 'Street: ')}{(zh ? ['翻牌前（先看两张手牌）', '翻牌（三张公共牌）', '转牌（第四张公共牌）', '河牌（第五张公共牌）'] : ['Preflop', 'Flop', 'Turn', 'River'])[view.street]} · {text('底池', 'Pot')} {view.committed[0] + view.committed[1]} {view.over && text('（已分配）', '(awarded)')}</p>
      <p>{text('玩家一余额', 'Player 1 balance')}: {view.stacks[0]} · {text('玩家二余额', 'Player 2 balance')}: {view.stacks[1]} · {text('按钮 / 小盲玩家', 'Button / small blind player')} {view.button + 1}</p>
      <div aria-label={text('对手手牌', 'Opponent cards')}><h3>{text('对手的两张手牌', 'Opponent’s two cards')}</h3>{cards(view.opponentCards.length ? view.opponentCards : [0, 0], !view.opponentCards.length)}</div>
      <div aria-label={text('公共牌', 'Community cards')}><h3>{text('公共牌：双方都可以用', 'Community cards: shared by both players')}</h3>{view.community.length ? cards(view.community) : <p>{text('尚未发出公共牌。', 'No community cards yet.')}</p>}</div>
      <div aria-label={text('你的手牌', 'Your cards')}><h3>{text('你的两张手牌', 'Your two cards')}</h3>{cards(view.ownCards)}</div>
      <p>{text(`本轮你已投入 ${view.streetBet[view.seat]}，对手已投入 ${view.streetBet[1 - view.seat]}。`, `This street: you contributed ${view.streetBet[view.seat]}, opponent ${view.streetBet[1 - view.seat]}.`)}</p>
      {!view.over && <fieldset disabled={status !== 'connected' || pending || !a} className="space-y-4 disabled:opacity-60"><legend className="font-bold">{text('选择这一步', 'Choose your action')}</legend><div className="flex flex-wrap gap-3"><button className="rpg-button" onClick={() => act({ kind: 'fold' })}>{text('弃牌：放弃本手', 'Fold: give up this hand')}</button>{a?.canCheck ? <button className="rpg-button" onClick={() => act({ kind: 'check' })}>{text('过牌：不投入，交给对手', 'Check: add nothing')}</button> : <button className="rpg-button" onClick={() => act({ kind: 'call' })}>{text(`跟注：补 ${a?.call ?? '…'}`, `Call: add ${a?.call ?? '…'}`)}</button>}</div>{a?.canRaise && <div className="space-y-3"><label className="block">{text(`本轮加到（至少 ${a.minTo}，最多 ${a.maxTo}；不足最小值只能全下）`, `Raise-to total (minimum ${a.minTo}, maximum ${a.maxTo}; below minimum only when all-in)`)}<input className="ml-2 min-h-11 w-28 border border-[#ae8550] p-2" type="number" min={1} max={a.maxTo} step={1} value={raise} onChange={e => setRaise(e.target.value)}/></label><p>{text('“加到”是这一轮的总投入，不是另外再交这个数。', 'Raise-to means your total for this street, not an additional payment.')}</p><div className="flex flex-wrap gap-3"><button className="rpg-button" onClick={() => act({ kind: 'raise', to: Number(raise) })}>{text('确认加到', 'Confirm raise-to')}</button><button className="rpg-button" onClick={() => act({ kind: 'raise', to: a.maxTo })}>{text('全下：投入剩余筹码', 'All-in: commit remaining chips')}</button></div></div>}</fieldset>}
      {view.over && <><ResultDialog key={view.hand} locale={locale} title={view.winner === 'tie' ? text('平分底池', 'Split pot') : winning ? text('你赢得本手', 'You won this hand') : text('对手赢得本手', 'Opponent won this hand')} reason={reason}/><p className="whitespace-pre-line leading-8">{reason}</p>{view.stacks.every(n => n > 0) ? <><p>{text(`下一手同意情况：你${view.next[view.seat] ? '已同意' : '未同意'}，对手${view.next[1 - view.seat] ? '已同意' : '未同意'}。`, `Next hand: you ${view.next[view.seat] ? 'ready' : 'not ready'}, opponent ${view.next[1 - view.seat] ? 'ready' : 'not ready'}.`)}</p><button className="rpg-button" disabled={status !== 'connected' || pending || view.next[view.seat]} onClick={() => act({ kind: 'next' })}>{text('同意下一手', 'Agree to next hand')}</button></> : <p>{text('有玩家筹码归零，本场结束。想重新练习，请离开后创建新房间。', 'A player has no chips: match over. Leave and create a new room to practice again.')}</p>}</>}
      <details open><summary className="cursor-pointer font-bold">{text('本手记录：每一步为什么扣筹码', 'Hand log: every chip movement')}</summary><ol className="mt-3 list-decimal space-y-2 pl-5 leading-7">{view.log.map((line, i) => <li key={i}>{line[locale]}</li>)}</ol></details>
    </div>}
  </section>;
}
