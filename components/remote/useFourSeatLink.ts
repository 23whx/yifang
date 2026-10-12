'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { PokerPeerChannel } from '@/lib/holdem-peer-channel';
import type { BoardConnection } from '@/lib/board/manual-connection';
import { hostPeerRoom, joinPeerRoom, newRoomCode, readRoomCode, peerFailureMessage, deviceLabel, byeMessage, type HostRoom, type PeerRoomEvents, type Visitor, type LinkSession } from '@/lib/peer-room';
import { readNickname, useAttention, useTitleAlert } from './Visitors';
import { useLounge } from './Lounge';

const noSubscribe = () => () => {};
type Seated = { seatOpen(seat: number): boolean; offer(seat: number, channel: PokerPeerChannel): Promise<unknown> };
type HostOptions = {
  /** The room is a restored match: only returning players (resume) may enter. */
  recovering: boolean;
  /** Keep the current room link (automatic reconnection) instead of opening a new one. */
  reuse?: boolean;
  /** A returning player knocked while play still runs here: the caller restarts recovery. */
  onReturning?: () => void;
  /** A seated player left on purpose (said goodbye) while play was under way. */
  onLeft?: (seat: number, name: string) => void;
};
type Pending = { c: BoardConnection; metadata: unknown; visitor: Visitor; session: LinkSession };

/** Link mode for four-seat rooms: one invitation link for the whole table. Friends knock
 * and the host lets them in; returning players (after a drop or refresh) are let in
 * directly and the game's recovery proof checks them. A lobby shows who is seated,
 * their connection and chat; goodbyes (leaving, dissolving, removing) end things for
 * good instead of waiting for a reconnection. Codes stay as the service-free fallback. */
export function useFourSeatLink(kind: string, zh: boolean) {
  const [mode, setMode] = useState<'link' | 'code'>('link');
  const [code, setCode] = useState('');
  const [note, setNote] = useState('');
  const [entry, setEntry] = useState<string | null>(null);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  // Shown while the table reconnects by itself, with a clock since the drop.
  const [reconnect, setReconnectText] = useState(''), [reconnectSince, setSince] = useState<number | null>(null);
  function setReconnect(text: string) { setReconnectText(text); setSince(since => text ? since ?? Date.now() : null); }
  const room = useRef<{ destroy(): void } | null>(null), hosting = useRef<HostRoom | null>(null), guestSession = useRef<LinkSession | null>(null);
  const codeRef = useRef(''), pending = useRef<Pending | null>(null), seatOf = useRef(new Map<string, number>());
  const invited = useSyncExternalStore(noSubscribe, () => readRoomCode(window.location.href, kind), () => '');
  const lounge = useLounge(zh, { name: readNickname(), device: deviceLabel() });
  useTitleAlert(visitors.filter(v => v.state === 'knocking').length, zh);
  useAttention(lounge.unread ? (zh ? `💬 新消息（${lounge.unread}）` : `💬 ${lounge.unread} new`) : null);
  useEffect(() => () => room.current?.destroy(), []);
  const roomKey = `yifang:${kind}:room:v1`;
  const seatLabel = (seat: number, name: string) => name || (zh ? `玩家 ${seat + 1}` : `Player ${seat + 1}`);
  function remember(value: string) { codeRef.current = value; try { sessionStorage.setItem(roomKey, value); } catch { /* reconnect still works while this page lives */ } }
  function stored() { try { return readRoomCode(sessionStorage.getItem(roomKey) ?? '', kind); } catch { return ''; } }
  function forgetRoom() { codeRef.current = ''; try { sessionStorage.removeItem(roomKey); } catch { /* best effort */ } }
  function stop() { room.current?.destroy(); room.current = null; hosting.current = null; pending.current = null; guestSession.current = null; setCode(''); setNote(''); setVisitors([]); }
  async function host(current: () => boolean, seats: () => Seated | null, onFailure: (message: string) => void, options: HostOptions) {
    const seat = (connection: BoardConnection, metadata: unknown, visitor: Visitor, session: LinkSession) => {
      const target = seats();
      const asked = (metadata as { seat?: unknown } | null)?.seat;
      // Seat synchronously: the channel's open handler must be wired before it can fire.
      const id = !current() || !target ? undefined : [...(typeof asked === 'number' ? [asked] : []), 1, 2, 3].find(n => target.seatOpen(n));
      if (id === undefined) {
        // A player came back while this side still runs the old table: restart recovery, then seat them.
        if (current() && options.onReturning && visitor.resume) { pending.current = { c: connection, metadata, visitor, session }; options.onReturning(); return; }
        connection.close(); return;
      }
      const key = `seat-${id}`, name = seatLabel(id, visitor.name);
      seatOf.current.set(visitor.id, id);
      lounge.hostAttach(key, session, visitor, id);
      let leftOnPurpose = false;
      session.onMessage(m => {
        if (m.kind !== 'yf-bye' || !current()) return;
        leftOnPurpose = true;
        lounge.hostDetach(key, true, byeMessage('left', zh, name));
        options.onLeft?.(id, name);
      });
      // Only the seat's current occupant may mark it offline; a removed player's late close must not.
      connection.on('close', () => { if (!leftOnPurpose && current() && seatOf.current.get(visitor.id) === id) lounge.hostDetach(key, false, zh ? `${name} 断线了` : `${name} disconnected`); });
      const channel = new PokerPeerChannel(connection);
      target!.offer(id, channel).catch(() => channel.close());
      // A friend who gave up mid-handshake must not hold the seat.
      setTimeout(() => { if (!connection.open) channel.close(); }, 20000);
    };
    const events: PeerRoomEvents = {
      onReady: own => { if (current()) { remember(own); setCode(own); lounge.hostOpen(); if (!options.reuse) setNote(''); } },
      onReconnecting: () => { if (current() && !options.reuse) setNote(zh ? '正在重新连上房间服务，房间仍然有效…' : 'Reconnecting to the room service; the room is still open…'); },
      onConnection: (connection, metadata, visitor, session) => seat(connection, metadata, visitor, session),
      onFailure: reason => {
        if (!current()) return;
        // After a refresh the old id may still be held briefly; fall back to a fresh link.
        if (reason === 'room-taken' && options.recovering && !options.reuse && stored()) { forgetRoom(); stop(); void host(current, seats, onFailure, options); return; }
        onFailure(peerFailureMessage(reason, zh));
      },
      onVisitors: setVisitors,
      // Returning players go straight to the verified recovery; newcomers wait for the host.
      policy: v => {
        if (v.resume) return 'admit';
        const target = seats();
        return options.recovering || !target || ![1, 2, 3].some(n => target.seatOpen(n)) ? 'full' : 'ask';
      },
      profile: { name: readNickname(), device: deviceLabel() },
    };
    if (options.reuse && hosting.current) {
      hosting.current.update(events);
      setCode(codeRef.current);
      const waiting = pending.current; pending.current = null;
      if (waiting) seat(waiting.c, waiting.metadata, waiting.visitor, waiting.session);
      return;
    }
    stop();
    const preferred = options.recovering ? stored() : '';
    const opened = await hostPeerRoom(preferred || newRoomCode(kind), events);
    if (current()) { room.current = opened; hosting.current = opened; } else opened.destroy();
  }
  async function join(current: () => boolean, checkpoint: string | undefined, onOpen: (channel: PokerPeerChannel) => void, onFailure: (message: string) => void, auto = false, onEnded?: (message: string) => void) {
    const target = checkpoint ? (codeRef.current || stored() || readRoomCode(entry ?? invited, kind)) : readRoomCode(entry ?? invited, kind);
    if (!target) { onFailure(zh ? '请粘贴房主发来的邀请链接。' : 'Paste the invitation link from the host.'); return; }
    stop();
    let seat: number | undefined, missing = false;
    try { if (checkpoint) seat = JSON.parse(checkpoint).seat; } catch { /* validated by the guest class */ }
    const looking = zh ? '已连上房间服务，正在寻找房主……如果房主暂时切到了其他应用，会自动重试。' : 'Room service reached; looking for the host… if they switched apps briefly, this retries automatically.';
    if (!auto) setNote(zh ? '正在连接房间服务…' : 'Connecting to the room service…');
    const opened = await joinPeerRoom(target, seat ? { seat } : {}, {
      onOpen: (connection, session, hostProfile) => {
        if (!current()) { connection.close(); return; }
        remember(target); if (!auto) setNote('');
        guestSession.current = session;
        lounge.guestAttach(session, hostProfile);
        session.onMessage(m => {
          if (!current()) return;
          // The host dissolved the room, removed us, or a player's exit ended the match: no reconnection.
          if (m.kind === 'yf-bye') { forgetRoom(); lounge.guestDetach('offline'); onEnded?.(byeMessage(m.reason, zh, m.name)); }
          else if (m.kind === 'yf-away') setNote(zh ? '房主离开了页面（可能在刷新或切到了其他应用），正在等房主回来…' : 'The host left the page (refreshing or switching apps); waiting for them…');
        });
        connection.on('close', () => { if (current() && !session.ended) lounge.guestDetach('offline'); });
        onOpen(new PokerPeerChannel(connection));
      },
      onService: () => { if (current() && !auto) setNote(looking); },
      onWaiting: () => { if (current() && !auto && !missing) setNote(looking); },
      onMissing: () => { if (!current() || auto) return; missing = true; setNote(zh ? '暂时找不到这个房间：房主可能已关闭页面，或暂时切到了其他应用。会继续自动尝试 2 分钟；一直找不到的话，请向房主要新的邀请链接。' : 'This room cannot be found right now: the host may have closed the page or briefly switched apps. Retrying automatically for 2 minutes; if it never appears, ask the host for a new link.'); },
      onKnocking: () => { if (current() && !auto) setNote(zh ? '已连上房主，正在等房主同意你加入……' : 'Reached the host; waiting for them to let you in…'); },
      onFailure: reason => { if (current()) { setNote(''); onFailure(peerFailureMessage(reason, zh)); } },
    }, { name: readNickname(), resume: !!checkpoint });
    if (current()) room.current = opened; else opened.destroy();
  }
  /** Leave on purpose. The host dissolves the room (optionally because a named player left);
   * a guest says goodbye. Goodbyes need a moment to leave before the peer goes away. */
  function leave(reason: 'host-left' | 'ended' = 'host-left', name?: string) {
    if (hosting.current) { const r = hosting.current; hosting.current = null; room.current = null; r.dissolve(reason, name); }
    else if (guestSession.current) { const s = guestSession.current, r = room.current; guestSession.current = null; room.current = null; s.bye('left'); setTimeout(() => r?.destroy(), 500); }
    forgetRoom(); lounge.clear(); stop();
  }
  function kick(visitorId: string) {
    const seat = seatOf.current.get(visitorId);
    const member = lounge.members.find(m => m.id === visitorId);
    seatOf.current.delete(visitorId);
    hosting.current?.kick(visitorId);
    if (seat !== undefined) lounge.hostDetach(`seat-${seat}`, true, zh ? `已将${seatLabel(seat, member?.name ?? '')}移出房间` : `Removed ${seatLabel(seat, member?.name ?? '')} from the room`);
  }
  return {
    mode, setMode, code, note, setNote, entry: entry ?? invited, setEntry, invited, canJoin: !!readRoomCode(entry ?? invited, kind),
    hasStoredRoom: () => !!stored(), forgetRoom, visitors, lounge, reconnect, reconnectSince, setReconnect,
    admit: (id: string) => hosting.current?.admit(id), deny: (id: string) => hosting.current?.deny(id), kick,
    host, join, stop, leave,
  };
}
