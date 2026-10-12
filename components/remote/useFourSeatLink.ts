'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { PokerPeerChannel } from '@/lib/holdem-peer-channel';
import { hostPeerRoom, joinPeerRoom, newRoomCode, readRoomCode, peerFailureMessage } from '@/lib/peer-room';

const noSubscribe = () => () => {};
type Seated = { seatOpen(seat: number): boolean; offer(seat: number, channel: PokerPeerChannel): Promise<unknown> };

/** Link mode for four-seat rooms: one invitation link for the whole table. Friends
 * opening it take the next free seat; on recovery each guest asks for its original seat.
 * The manual code exchange stays available as the service-free fallback. */
export function useFourSeatLink(kind: string, zh: boolean) {
  const [mode, setMode] = useState<'link' | 'code'>('link');
  const [code, setCode] = useState('');
  const [note, setNote] = useState('');
  const [entry, setEntry] = useState<string | null>(null);
  const room = useRef<{ destroy(): void } | null>(null);
  const invited = useSyncExternalStore(noSubscribe, () => readRoomCode(window.location.href, kind), () => '');
  useEffect(() => () => room.current?.destroy(), []);
  function stop() { room.current?.destroy(); room.current = null; setCode(''); setNote(''); }
  async function host(current: () => boolean, seats: () => Seated | null, onFailure: (message: string) => void) {
    stop();
    const opened = await hostPeerRoom(newRoomCode(kind), {
      onReady: own => { if (current()) { setCode(own); setNote(''); } },
      onReconnecting: () => { if (current()) setNote(zh ? '正在重新连上房间服务，房间仍然有效…' : 'Reconnecting to the room service; the room is still open…'); },
      onConnection: (connection, metadata) => {
        const target = seats();
        const asked = (metadata as { seat?: unknown } | null)?.seat;
        // Seat synchronously: the channel's open handler must be wired before it can fire.
        const seat = !current() || !target ? undefined : [...(typeof asked === 'number' ? [asked] : []), 1, 2, 3].find(id => target.seatOpen(id));
        if (seat === undefined) { connection.close(); return; }
        const channel = new PokerPeerChannel(connection);
        target!.offer(seat, channel).catch(() => channel.close());
        // A friend who gave up mid-handshake must not hold the seat.
        setTimeout(() => { if (!connection.open) channel.close(); }, 20000);
      },
      onFailure: reason => { if (current()) onFailure(peerFailureMessage(reason, zh)); },
    });
    if (current()) room.current = opened; else opened.destroy();
  }
  async function join(current: () => boolean, checkpoint: string | undefined, onOpen: (channel: PokerPeerChannel) => void, onFailure: (message: string) => void) {
    const target = readRoomCode(entry ?? invited, kind);
    if (!target) { onFailure(zh ? '请粘贴房主发来的邀请链接。' : 'Paste the invitation link from the host.'); return; }
    stop();
    let seat: number | undefined;
    try { if (checkpoint) seat = JSON.parse(checkpoint).seat; } catch { /* validated by the guest class */ }
    setNote(zh ? '正在连接房主……如果房主暂时切到了其他应用，会自动重试，最多等 5 分钟。' : 'Connecting to the host… if they switched apps briefly, this retries automatically for up to 5 minutes.');
    const opened = await joinPeerRoom(target, seat ? { seat } : {}, {
      onOpen: connection => { if (!current()) { connection.close(); return; } setNote(''); onOpen(new PokerPeerChannel(connection)); },
      onFailure: reason => { if (current()) { setNote(''); onFailure(peerFailureMessage(reason, zh)); } },
    });
    if (current()) room.current = opened; else opened.destroy();
  }
  return { mode, setMode, code, note, entry: entry ?? invited, setEntry, invited, canJoin: !!readRoomCode(entry ?? invited, kind), host, join, stop };
}
