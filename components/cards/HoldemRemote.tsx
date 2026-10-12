'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { bestHand, cardText, categories, categoriesEn, rankText } from '@/lib/holdem';
import { type PokerView, type PokerRequest } from '@/lib/holdem-remote';
import { PokerPeerChannel } from '@/lib/holdem-peer-channel';
import { hostPeerRoom, joinPeerRoom, newRoomCode, peerFailureMessage } from '@/lib/peer-room';
import { LinkShare } from '@/components/remote/RoomKit';
import { roomCode } from '@/lib/board/remote-match';
import ResultDialog from '@/components/ui/ResultDialog';
import { ManualHeadsUpPokerHost, ManualHeadsUpPokerGuest } from '@/lib/holdem-headsup-manual';
import type { HeadsUpRoomMessage } from '@/lib/holdem-headsup-room';
import { readHeadsUpPokerSave, writeHeadsUpPokerSave, clearHeadsUpPokerSave, type HeadsUpPokerSave } from '@/lib/holdem-headsup-save';
import {secureMultiplayerContext,insecureMultiplayerMessage} from '@/lib/network-context';
import {readManualSignal} from '@/lib/manual-rtc';
import { RoomHeader, RoleCard, Steps, SignalOutput, RoomNotes, RoomAlert, type StepState } from '@/components/remote/RoomKit';

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
  const peer = useRef<{ destroy(): void } | null>(null);
  const [linkMode, setLinkMode] = useState<'link' | 'code'>('link');
  const [linkNote, setLinkNote] = useState('');
  const autoJoin = useRef(false);
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
    peer.current?.destroy();
    peer.current = null;
    pendingRef.current = false;
    manualHost.current?.close(); manualHost.current = null;
    manualGuest.current?.close(); manualGuest.current = null;
    manualRequest.current = 0;
  }
  useEffect(() => () => dispose(), []);
  // Opening an invitation link joins straight away, unless this tab holds a saved match to protect.
  useEffect(() => {
    if (!invited || autoJoin.current) return;
    autoJoin.current = true;
    let protectedSave = false;
    try { protectedSave = readHeadsUpPokerSave(sessionStorage) !== null; } catch { protectedSave = true; }
    if (!protectedSave) queueMicrotask(() => { void start(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invited]);
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
  async function start(isHost: boolean, recovery?: HeadsUpPokerSave) {
    if(!secureMultiplayerContext()){setError(insecureMultiplayerMessage(locale));return;}
    const target = roomCode(entry ?? invited, 'holdem');
    if (!isHost && !target) { setError(text('请粘贴房主发来的邀请链接。', 'Paste the invitation link from the host.')); return; }
    if(!recovery&&!allowNew(isHost?'quick-host':'quick-guest'))return;
    dispose(); const token = generation.current;
    setReady(false);setRestoring(!!recovery);setClearArmed(false);setReplaceIntent(null);
    setIsHostSeat(isHost); latest.current = null;
    setView(null); setPending(false); setCode(''); setError(''); setStatus('connecting');
    setManualFeedback(null); setLinkNote('');
    setManualStep('idle'); setSignalIn(''); setSignalOut('');
    const closed=()=>{if(token===generation.current)fail(text('连接已断开；本手不自动判胜。请双方点“恢复上次牌局”，房主把新的邀请链接发给朋友即可接着打。','Disconnected; unfinished hands are not awarded. Both players choose Restore previous match and the host sends a new invitation link.'));};
    try {
      if (isHost) {
        const protocol = new ManualHeadsUpPokerHost(m => manualMessage(m, token), () => {
          // A friend who drops before play starts frees the seat; the room stays open.
          if (token === generation.current && !active.current && protocol.room.status === 'lobby') return;
          closed();
        }, undefined, recovery?.checkpoint);
        manualHost.current = protocol;
        const room = await hostPeerRoom(newRoomCode('holdem'), {
          onReady: own => { if (token !== generation.current) return; setCode(own); setLinkNote(''); setStatus(s => s === 'connecting' ? 'waiting' : s); },
          onReconnecting: () => { if (token === generation.current && !active.current) setLinkNote(text('正在重新连上房间服务，房间仍然有效…', 'Reconnecting to the room service; the room is still open…')); },
          onConnection: c => {
            if (token !== generation.current || !protocol.seatOpen(1)) { c.close(); return; }
            const channel = new PokerPeerChannel(c);
            protocol.offer(1, channel).catch(() => channel.close());
            setTimeout(() => { if (!c.open) channel.close(); }, 20000);
          },
          onFailure: reason => { if (token === generation.current) fail(peerFailureMessage(reason, zh)); },
        });
        if (token !== generation.current) { room.destroy(); return; }
        peer.current = room;
      } else {
        setCode(target);
        setLinkNote(text('正在连接房间服务…', 'Connecting to the room service…'));
        const room = await joinPeerRoom(target, {}, {
          onService: () => { if (token === generation.current) setLinkNote(text('已连上房间服务，正在寻找房主……如果房主暂时切到了其他应用，会自动重试，最多等 5 分钟。', 'Room service reached; looking for the host… if they switched apps briefly, this retries automatically for up to 5 minutes.')); },
          onOpen: c => {
            if (token !== generation.current) { c.close(); return; }
            setLinkNote('');
            const channel = new PokerPeerChannel(c);
            try { manualGuest.current = new ManualHeadsUpPokerGuest(m => manualMessage(m, token), closed, () => channel, recovery?.checkpoint); }
            catch { channel.close(); fail(text('存档无效或版本不兼容，未加入。原存档保留。', 'Invalid or incompatible save; not joined. Original save retained.')); }
          },
          onFailure: reason => { if (token === generation.current) fail(peerFailureMessage(reason, zh)); },
        });
        if (token !== generation.current) { room.destroy(); return; }
        peer.current = room;
      }
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
  const quick = code !== '' || manualStep === 'idle';
  const statusText = status === 'connected' ? (pending ? text('正在等待动作确认…', 'Waiting for acknowledgement…') : view?.over ? text('本手已结束', 'Hand complete') : a ? text('轮到你了', 'Your turn') : text('等待对手行动', 'Waiting for opponent'))
    : status === 'waiting' ? (ready ? text('双方已连接，请房主确认开始或继续原局', 'Both connected — waiting for the host to start or continue') : manualStep === 'offer' ? text('邀请码已生成：发给朋友，再粘贴朋友的回复码', 'Invitation ready: send it, then paste your friend’s reply code') : manualStep === 'answer' ? text('回复码已生成：发回给房主，等房主连接', 'Reply ready: send it to the host and wait') : manualStep === 'connecting' ? text('正在尝试局域网直连…', 'Attempting a direct LAN connection…') : text('房间已创建，等待朋友加入', 'Room created — waiting for your friend'))
    : status === 'connecting' ? text('正在连接…', 'Connecting…') : status === 'error' ? text('连接已停止', 'Connection stopped') : text('尚未连接', 'Not connected');
  const tone = status === 'connected' ? 'ok' : status === 'error' ? 'warn' : status === 'idle' ? 'idle' : 'busy';
  const hostSteps: { label: string; state: StepState; body?: ReactNode }[] = [
    { label: text('生成邀请码', 'Create an invitation code'), state: signalOut ? 'done' : 'now', body: !signalOut ? <p>{text('正在生成，通常几秒钟…', 'Creating it — usually a few seconds…')}</p> : undefined },
    { label: text('把邀请码发给朋友，再粘贴朋友发回的回复码', 'Send the invitation, then paste your friend’s reply code'), state: manualStep === 'offer' ? 'now' : manualStep === 'connecting' || ready ? 'done' : 'todo', body: manualStep === 'offer' ? <>
      <SignalOutput label={text('你的邀请码（整段复制发给朋友，它不是网址）', 'Your invitation code (send all of it; it is not a web address)')} value={signalOut} copyLabel={text('复制邀请码', 'Copy invitation code')} onCopy={copyManual} />
      <label className="block text-sm font-bold">{text('粘贴朋友发回的回复码', 'Paste your friend’s reply code')}<textarea className="room-field" rows={3} maxLength={65536} value={signalIn} onChange={e => setSignalIn(e.target.value)} /></label>
      <div><button className="rpg-button" disabled={status !== 'waiting' || !signalIn.trim()} onClick={finishManual}>{text('使用回复码连接', 'Connect with reply code')}</button></div>
    </> : undefined },
    { label: text('连接成功后开始发牌', 'Deal once connected'), state: manualStep === 'connecting' || ready ? 'now' : 'todo' },
  ];
  const guestSteps: { label: string; state: StepState; body?: ReactNode }[] = [
    { label: text('生成回复码', 'Create your reply code'), state: signalOut ? 'done' : 'now', body: !signalOut ? <p>{text('正在生成，通常几秒钟…', 'Creating it — usually a few seconds…')}</p> : undefined },
    { label: text('把回复码发回给房主，等房主连接', 'Send the reply code back and wait for the host'), state: ready ? 'done' : signalOut ? 'now' : 'todo', body: signalOut && !ready ? <SignalOutput label={text('你的回复码（整段复制发给房主）', 'Your reply code (send all of it to the host)')} value={signalOut} copyLabel={text('复制回复码', 'Copy reply code')} onCopy={copyManual} /> : undefined },
    { label: text('等房主发牌', 'Wait for the host to deal'), state: ready ? 'now' : 'todo' },
  ];
  return <section className="space-y-6">
    <div className="room">
      <RoomHeader title={text('双人德州扑克 · 好友房', 'Heads-up poker · Friend room')} lead={busy ? undefined : text('一人开房、一人加入。每人 200 个练习筹码，小盲 5、大盲 10，不涉及真钱。', 'One player opens the room, the other joins. Each starts with 200 practice chips, blinds 5/10. No real money.')} tone={tone}>{statusText}</RoomHeader>
      {error && <RoomAlert>{error}</RoomAlert>}
      {saveError && <RoomAlert>{saveError}</RoomAlert>}
      {manualFeedback && (manualFeedback.error ? <RoomAlert>{manualFeedback.message}</RoomAlert> : <p role="status" className="text-sm font-bold">{manualFeedback.message}</p>)}
      {!busy && (saved || saveError) && <div className="room-banner" aria-label={text('上次的牌局', 'Previous match')}>
        <p className="room-banner-title">{saved ? text(`本标签页已保存上次的牌局（你是${saved.role === 'host' ? '房主' : '朋友'}）`, `This tab has a saved match (you were the ${saved.role})`) : text('存档读取失败', 'The save could not be read')}</p>
        {saved && linkMode === 'link' && <p>{saved.role === 'host' ? text('想接着打：点“恢复上次牌局”，把新的邀请链接发给原来的朋友；朋友连上后点“继续原局”。', 'To continue: choose Restore previous match and send the new invitation link to the same friend; continue once they connect.') : text('想接着打：先把房主发来的新邀请链接粘贴到下方“邀请链接”框，再点“恢复上次牌局”。', 'To continue: paste the host’s new invitation link into the Invitation link box below, then choose Restore previous match.')}</p>}
        {saved && linkMode === 'code' && <p>{saved.role === 'host' ? text('想接着打：点“恢复上次牌局”，把新的邀请码发给原来的朋友，再粘贴他发回的回复码，最后点“继续原局”。', 'To continue: choose Restore previous match, send the new invitation to the same friend, paste their reply, then choose Continue.') : text('想接着打：先在下方“朋友邀请我”里粘贴房主发来的新邀请码，再点“恢复上次牌局”，把生成的回复码发回给房主。', 'To continue: paste the host’s new invitation under “A friend invited me” below, then choose Restore previous match and send the reply back.')}</p>}
        <div className="room-actions">
          {saved && <button className="rpg-button" disabled={saved.role === 'guest' && (linkMode === 'link' ? !!!roomCode(entry ?? invited, 'holdem') : !signalIn.trim())} onClick={() => linkMode === 'link' ? start(saved.role === 'host', saved) : startManual(saved.role === 'host', saved)}>{text('恢复上次牌局', 'Restore previous match')}</button>}
          <button className="room-link" onClick={clearSave}>{clearArmed ? text('确认删除存档（无法撤销）', 'Confirm delete (cannot be undone)') : text('删除这个存档', 'Delete this save')}</button>
          {clearArmed && <button className="room-link" onClick={() => setClearArmed(false)}>{text('取消删除', 'Keep the save')}</button>}
        </div>
      </div>}
      {!busy && linkMode === 'link' && <div className="room-roles">
        <RoleCard badge={text('房主', 'Host')} title={text('我来开房', 'Open a room')} steps={[text('点“创建房间”，得到邀请链接', 'Create a room to get an invitation link'), text('把链接发给朋友（微信、短信都行）', 'Send the link to your friend by any chat app'), text('朋友打开链接就自动进房，由你发牌', 'Your friend joins by opening it; you deal')]}>
          <button className="rpg-button" onClick={() => start(true)}>{replaceIntent === 'quick-host' ? text('确认创建新房', 'Confirm new room') : text('创建房间', 'Create room')}</button>
        </RoleCard>
        <RoleCard badge={text('朋友', 'Guest')} title={text('朋友邀请我', 'A friend invited me')} steps={[text('直接打开房主发来的链接，会自动加入', 'Open the host’s link — you join automatically'), text('或把链接粘贴到下面，点“加入房间”', 'Or paste the link below and choose Join room'), text('等房主发牌', 'Wait for the host to deal')]}>
          <label className="block text-sm font-bold">{text('邀请链接', 'Invitation link')}<input className="room-field" placeholder="https://…?room=…" value={entry ?? invited} onChange={e => { setEntry(e.target.value); setReplaceIntent(null); }} /></label>
          <button className="rpg-button" disabled={!!!roomCode(entry ?? invited, 'holdem')} onClick={() => start(false)}>{replaceIntent === 'quick-guest' ? text('确认加入新房', 'Confirm joining new room') : text('加入房间', 'Join room')}</button>
        </RoleCard>
      </div>}
      {!busy && linkMode === 'code' && <div className="room-roles">
        <RoleCard badge={text('房主', 'Host')} title={text('我来开房', 'Open a room')} steps={[text('生成邀请码，发给朋友', 'Create an invitation code and send it'), text('粘贴朋友发回的回复码', 'Paste the reply code your friend sends back'), text('连接成功后由你发牌', 'Deal the first hand once connected')]}>
          <button className="rpg-button" onClick={() => startManual(true)}>{replaceIntent === 'manual-host' ? text('确认创建新房', 'Confirm new room') : text('生成邀请码', 'Create invitation code')}</button>
        </RoleCard>
        <RoleCard badge={text('朋友', 'Guest')} title={text('朋友邀请我', 'A friend invited me')} steps={[text('粘贴房主发来的邀请码', 'Paste the host’s invitation code'), text('生成回复码，发回给房主', 'Create a reply code and send it back'), text('等房主发牌', 'Wait for the host to deal')]}>
          <label className="block text-sm font-bold">{text('粘贴房主发来的邀请码', 'Paste the host’s invitation code')}<textarea className="room-field" rows={3} maxLength={65536} value={signalIn} onChange={e => { setSignalIn(e.target.value); setReplaceIntent(null); }} /></label>
          <button className="rpg-button" disabled={!signalIn.trim()} onClick={() => startManual(false)}>{replaceIntent === 'manual-guest' ? text('确认加入新房', 'Confirm joining new room') : text('生成回复码', 'Create reply code')}</button>
        </RoleCard>
      </div>}
      {busy && !quick && status !== 'connected' && <Steps items={isHostSeat ? hostSteps : guestSteps} />}
      {busy && quick && isHostSeat && code && status !== 'connected' && !ready && <LinkShare zh={zh} code={code} title={text('房间已开好，把邀请链接发给朋友', 'Room ready — send the invitation link to your friend')} body={text('朋友打开链接就会自动进房。你可以切去微信等应用发链接，房间在这个页面开着期间一直有效，回来后会自动接上。', 'Your friend joins by opening the link. You can switch to a chat app to send it; the room stays open as long as this page is open.')} onCopied={value => { void navigator.clipboard.writeText(value).then(() => setManualFeedback({ message: text('邀请链接已复制，发给朋友吧。', 'Invitation link copied — send it to your friend.'), error: false }), () => setManualFeedback({ message: text('复制失败，请手动复制房间链接。', 'Copy failed; copy the link manually.'), error: true })); }} />}
      {busy && linkNote && status !== 'connected' && <p role="status" className="room-progress">{linkNote}</p>}
      {ready && status === 'waiting' && isHostSeat && <div><button className="rpg-button" onClick={() => { if (!manualHost.current?.start()) setError(text('尚不能开始，请确认双方连接。', 'Cannot start yet. Check both connections.')); }}>{restoring ? text('双方已连接，继续原局', 'Both connected — continue saved match') : text('双方已连接，开始发牌', 'Both connected — deal cards')}</button></div>}
      {status !== 'idle' && status !== 'error' && <div><button className="room-link" onClick={() => { dispose(); setStatus('idle'); setCode(''); setView(null); setPending(false); setError(''); setManualFeedback(null); setManualStep('idle'); setSignalIn(''); setSignalOut(''); }}>{text('离开房间', 'Leave room')}</button></div>}
      {!busy && <RoomNotes summary={text('连接说明与常见问题', 'Connection notes and troubleshooting')}>
        <p>{linkMode === 'link' ? text('当前为邀请链接方式：通过 PeerJS 公共服务转交连接信息（其默认配置还会尝试第三方 STUN，必要时经 TURN 中继），连上后牌局数据在双方之间传送。如果一直连不上（例如该服务在你的网络被屏蔽），可在下方改用“邀请码 + 回复码”。', 'Link mode: the PeerJS public service passes on connection details (its defaults also try third-party STUN and may relay through TURN); once connected, match data travels between the two players. If it never connects (for example the service is blocked on your network), switch to invitation + reply codes below.') : text('当前为邀请码方式：不联系任何外部服务，双方各发一次代码。', 'Code mode: no external service; each side sends one code.')}</p>
        <label className="block"><span className="font-bold">{text('连接方式', 'Connection method')}</span><select className="room-field" value={linkMode} onChange={e => { setReplaceIntent(null); setManualFeedback(null); setError(''); setLinkMode(e.target.value as 'link' | 'code'); }}><option value="link">{text('邀请链接 · 朋友打开即进房（推荐）', 'Invitation link · friend joins by opening it (recommended)')}</option><option value="code">{text('邀请码 + 回复码 · 不经过任何服务', 'Invitation + reply codes · no service involved')}</option></select></label>
        <p>{text('邀请码方式不联系 PeerJS、STUN 或 TURN。不同设备先通过有效 HTTPS 打开网站并接入同一局域网；localhost 只能在本机预览，http://局域网IP 不具备刷新恢复所需的安全上下文。访客 Wi-Fi 隔离、防火墙或浏览器地址保护可能阻止直连，不保证异地可用。', 'Invitation codes contact no PeerJS, STUN or TURN service. Each device must first open a valid HTTPS site on the same LAN. Localhost is only for this device; plain HTTP on a LAN IP lacks the secure context required for refresh recovery. Guest Wi-Fi isolation, firewalls or browser address protection can block direct connections; cross-network access is not guaranteed.')}</p>
        <p>{text('仅供练习，不涉及真钱。房主浏览器负责洗牌与判定，需要信任房主，这不是防作弊服务器。一手结束后双方都同意才发下一手；筹码延续，小盲 5、大盲 10 轮换，有人筹码输光本场结束。', 'Practice only, no real money. The host browser deals and adjudicates: trust your host; this is not a cheat-proof server. Both players agree before each next hand; balances carry over, 5/10 blinds alternate, and the match ends when someone runs out.')}</p>
        <p>{text('刷新或断线后：开局后会自动保存在当前标签页，房主保存原牌序与操作，朋友只保存自己的可见牌面。双方保留原标签页，按上方“上次的牌局”提示重新交换一次邀请码和回复码即可继续。不要分享存档；关闭标签页、清理浏览器数据或更换设备可能无法恢复。', 'After a refresh or disconnect: once play starts this tab saves the host’s deck and actions or the guest’s own view. Keep both original tabs and follow the Previous match prompt to swap a fresh invitation and reply. Never share saves; closing the tab, clearing browser data or changing devices may prevent recovery.')}</p>
      </RoomNotes>}
    </div>
    {view && <div className="space-y-5 border-2 border-[#ae8550] bg-[#f3e7cd] p-4 sm:p-6">
      <h2 className="text-xl font-bold">{text(`第 ${view.hand} 手 · 你是玩家${view.seat + 1}`, `Hand ${view.hand} · You are Player ${view.seat + 1}`)}</h2>
      <p>{text('阶段：', 'Street: ')}{(zh ? ['翻牌前（先看两张手牌）', '翻牌（三张公共牌）', '转牌（第四张公共牌）', '河牌（第五张公共牌）'] : ['Preflop', 'Flop', 'Turn', 'River'])[view.street]} · {text('底池', 'Pot')} {view.committed[0] + view.committed[1]} {view.over && text('（已分配）', '(awarded)')}</p>
      <p>{text('玩家一余额', 'Player 1 balance')}: {view.stacks[0]} · {text('玩家二余额', 'Player 2 balance')}: {view.stacks[1]} · {text('按钮 / 小盲玩家', 'Button / small blind player')} {view.button + 1}</p>
      <div aria-label={text('对手手牌', 'Opponent cards')}><h3>{text('对手的两张手牌', 'Opponent’s two cards')}</h3>{cards(view.opponentCards.length ? view.opponentCards : [0, 0], !view.opponentCards.length)}</div>
      <div aria-label={text('公共牌', 'Community cards')}><h3>{text('公共牌：双方都可以用', 'Community cards: shared by both players')}</h3>{view.community.length ? cards(view.community) : <p>{text('尚未发出公共牌。', 'No community cards yet.')}</p>}</div>
      <div aria-label={text('你的手牌', 'Your cards')}><h3>{text('你的两张手牌', 'Your two cards')}</h3>{cards(view.ownCards)}</div>
      <p>{text(`本轮你已投入 ${view.streetBet[view.seat]}，对手已投入 ${view.streetBet[1 - view.seat]}。`, `This street: you contributed ${view.streetBet[view.seat]}, opponent ${view.streetBet[1 - view.seat]}.`)}</p>
      {!view.over && !a && <p role="status" className="font-bold">{pending ? text('正在等待动作确认…', 'Waiting for acknowledgement…') : text('等待对手行动…', 'Waiting for your opponent…')}</p>}{!view.over && a && <fieldset disabled={status !== 'connected' || pending || !a} className="space-y-4 disabled:opacity-60"><legend className="font-bold">{text('选择这一步', 'Choose your action')}</legend><div className="flex flex-wrap gap-3"><button className="rpg-button" onClick={() => act({ kind: 'fold' })}>{text('弃牌：放弃本手', 'Fold: give up this hand')}</button>{a?.canCheck ? <button className="rpg-button" onClick={() => act({ kind: 'check' })}>{text('过牌：不投入，交给对手', 'Check: add nothing')}</button> : <button className="rpg-button" onClick={() => act({ kind: 'call' })}>{text(`跟注：补 ${a?.call ?? '…'}`, `Call: add ${a?.call ?? '…'}`)}</button>}</div>{a?.canRaise && <div className="space-y-3"><label className="block">{text(`本轮加到（至少 ${a.minTo}，最多 ${a.maxTo}；不足最小值只能全下）`, `Raise-to total (minimum ${a.minTo}, maximum ${a.maxTo}; below minimum only when all-in)`)}<input className="ml-2 min-h-11 w-28 border border-[#ae8550] p-2" type="number" min={1} max={a.maxTo} step={1} value={raise} onChange={e => setRaise(e.target.value)}/></label><p>{text('“加到”是这一轮的总投入，不是另外再交这个数。', 'Raise-to means your total for this street, not an additional payment.')}</p><div className="flex flex-wrap gap-3"><button className="rpg-button" onClick={() => act({ kind: 'raise', to: Number(raise) })}>{text('确认加到', 'Confirm raise-to')}</button><button className="rpg-button" onClick={() => act({ kind: 'raise', to: a.maxTo })}>{text('全下：投入剩余筹码', 'All-in: commit remaining chips')}</button></div></div>}</fieldset>}
      {view.over && <><ResultDialog key={view.hand} locale={locale} title={view.winner === 'tie' ? text('平分底池', 'Split pot') : winning ? text('你赢得本手', 'You won this hand') : text('对手赢得本手', 'Opponent won this hand')} reason={reason}/><p className="whitespace-pre-line leading-8">{reason}</p>{view.stacks.every(n => n > 0) ? <><p>{text(`下一手同意情况：你${view.next[view.seat] ? '已同意' : '未同意'}，对手${view.next[1 - view.seat] ? '已同意' : '未同意'}。`, `Next hand: you ${view.next[view.seat] ? 'ready' : 'not ready'}, opponent ${view.next[1 - view.seat] ? 'ready' : 'not ready'}.`)}</p><button className="rpg-button" disabled={status !== 'connected' || pending || view.next[view.seat]} onClick={() => act({ kind: 'next' })}>{text('同意下一手', 'Agree to next hand')}</button></> : <p>{text('有玩家筹码归零，本场结束。想重新练习，请离开后创建新房间。', 'A player has no chips: match over. Leave and create a new room to practice again.')}</p>}</>}
      <details open><summary className="cursor-pointer font-bold">{text('本手记录：每一步为什么扣筹码', 'Hand log: every chip movement')}</summary><ol className="mt-3 list-decimal space-y-2 pl-5 leading-7">{view.log.map((line, i) => <li key={i}>{line[locale]}</li>)}</ol></details>
    </div>}
  </section>;
}
