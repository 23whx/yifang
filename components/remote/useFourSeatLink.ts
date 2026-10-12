'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { PokerPeerChannel } from '@/lib/holdem-peer-channel';
import type { BoardConnection } from '@/lib/board/manual-connection';
import { hostPeerRoom, joinPeerRoom, newRoomCode, readRoomCode, peerFailureMessage, type HostRoom, type PeerRoomEvents, type Visitor } from '@/lib/peer-room';
import { readNickname, useTitleAlert } from './Visitors';

const noSubscribe = () => () => {};
type Seated = { seatOpen(seat: number): boolean; offer(seat: number, channel: PokerPeerChannel): Promise<unknown> };
type HostOptions = {
  /** The room is a restored match: only returning players (resume) may enter. */
  recovering: boolean;
  /** Keep the current room link (automatic reconnection) instead of opening a new one. */
  reuse?: boolean;
  /** A returning player knocked while play still runs here: the caller restarts recovery. */
  onReturning?: () => void;
};

/** Link mode for four-seat rooms: one invitation link for the whole table. Friends knock
 * and the host lets them in; returning players (after a drop or refresh) are let in
 * directly and the game's recovery proof checks them. Codes stay as the fallback. */
export function useFourSeatLink(kind: string, zh: boolean) {
  const [mode, setMode] = useState<'link' | 'code'>('link');
  const [code, setCode] = useState('');
  const [note, setNote] = useState('');
  const [entry, setEntry] = useState<string | null>(null);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const room = useRef<{ destroy(): void } | null>(null), hosting = useRef<HostRoom | null>(null);
  const codeRef = useRef(''), pending = useRef<{ c: BoardConnection; metadata: unknown } | null>(null);
  const invited = useSyncExternalStore(noSubscribe, () => readRoomCode(window.location.href, kind), () => '');
  useTitleAlert(visitors.filter(v => v.state === 'knocking').length, zh);
  useEffect(() => () => room.current?.destroy(), []);
  const roomKey = `yifang:${kind}:room:v1`;
  function remember(value: string) { codeRef.current = value; try { sessionStorage.setItem(roomKey, value); } catch { /* reconnect still works while this page lives */ } }
  function stored() { try { return readRoomCode(sessionStorage.getItem(roomKey) ?? '', kind); } catch { return ''; } }
  function stop() { room.current?.destroy(); room.current = null; hosting.current = null; pending.current = null; setCode(''); setNote(''); setVisitors([]); }
  async function host(current: () => boolean, seats: () => Seated | null, onFailure: (message: string) => void, options: HostOptions) {
    const seat = (connection: BoardConnection, metadata: unknown) => {
      const target = seats();
      const asked = (metadata as { seat?: unknown } | null)?.seat;
      // Seat synchronously: the channel's open handler must be wired before it can fire.
      const id = !current() || !target ? undefined : [...(typeof asked === 'number' ? [asked] : []), 1, 2, 3].find(n => target.seatOpen(n));
      if (id === undefined) {
        // A player came back while this side still runs the old table: restart recovery, then seat them.
        if (current() && options.onReturning && (metadata as { resume?: unknown } | null)?.resume === true) { pending.current = { c: connection, metadata }; options.onReturning(); return; }
        connection.close(); return;
      }
      const channel = new PokerPeerChannel(connection);
      target!.offer(id, channel).catch(() => channel.close());
      // A friend who gave up mid-handshake must not hold the seat.
      setTimeout(() => { if (!connection.open) channel.close(); }, 20000);
    };
    const events: PeerRoomEvents = {
      onReady: own => { if (current()) { remember(own); setCode(own); if (!options.reuse) setNote(''); } },
      onReconnecting: () => { if (current() && !options.reuse) setNote(zh ? '正在重新连上房间服务，房间仍然有效…' : 'Reconnecting to the room service; the room is still open…'); },
      onConnection: (connection, metadata) => seat(connection, metadata),
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
    };
    if (options.reuse && hosting.current) {
      hosting.current.update(events);
      setCode(codeRef.current);
      const waiting = pending.current; pending.current = null;
      if (waiting) seat(waiting.c, waiting.metadata);
      return;
    }
    stop();
    const preferred = options.recovering ? stored() : '';
    const opened = await hostPeerRoom(preferred || newRoomCode(kind), events);
    if (current()) { room.current = opened; hosting.current = opened; } else opened.destroy();
  }
  function forgetRoom() { codeRef.current = ''; try { sessionStorage.removeItem(roomKey); } catch { /* best effort */ } }
  async function join(current: () => boolean, checkpoint: string | undefined, onOpen: (channel: PokerPeerChannel) => void, onFailure: (message: string) => void, auto = false) {
    const target = checkpoint ? (codeRef.current || stored() || readRoomCode(entry ?? invited, kind)) : readRoomCode(entry ?? invited, kind);
    if (!target) { onFailure(zh ? '请粘贴房主发来的邀请链接。' : 'Paste the invitation link from the host.'); return; }
    stop();
    let seat: number | undefined, missing = false;
    try { if (checkpoint) seat = JSON.parse(checkpoint).seat; } catch { /* validated by the guest class */ }
    const looking = zh ? '已连上房间服务，正在寻找房主……如果房主暂时切到了其他应用，会自动重试。' : 'Room service reached; looking for the host… if they switched apps briefly, this retries automatically.';
    if (!auto) setNote(zh ? '正在连接房间服务…' : 'Connecting to the room service…');
    const opened = await joinPeerRoom(target, seat ? { seat } : {}, {
      onOpen: connection => { if (!current()) { connection.close(); return; } remember(target); if (!auto) setNote(''); onOpen(new PokerPeerChannel(connection)); },
      onService: () => { if (current() && !auto) setNote(looking); },
      onWaiting: () => { if (current() && !auto && !missing) setNote(looking); },
      onMissing: () => { if (!current() || auto) return; missing = true; setNote(zh ? '暂时找不到这个房间：房主可能已关闭页面，或暂时切到了其他应用。会继续自动尝试 2 分钟；一直找不到的话，请向房主要新的邀请链接。' : 'This room cannot be found right now: the host may have closed the page or briefly switched apps. Retrying automatically for 2 minutes; if it never appears, ask the host for a new link.'); },
      onKnocking: () => { if (current() && !auto) setNote(zh ? '已连上房主，正在等房主同意你加入……' : 'Reached the host; waiting for them to let you in…'); },
      onFailure: reason => { if (current()) { setNote(''); onFailure(peerFailureMessage(reason, zh)); } },
    }, { name: readNickname(), resume: !!checkpoint });
    if (current()) room.current = opened; else opened.destroy();
  }
  return {
    mode, setMode, code, note, setNote, entry: entry ?? invited, setEntry, invited, canJoin: !!readRoomCode(entry ?? invited, kind),
    hasStoredRoom: () => !!stored(), forgetRoom, visitors,
    admit: (id: string) => hosting.current?.admit(id), deny: (id: string) => hosting.current?.deny(id),
    host, join, stop,
  };
}
