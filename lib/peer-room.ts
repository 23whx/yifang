import type { DataConnection, Peer } from 'peerjs';
import type { BoardConnection } from './board/manual-connection';

/** Link-based friend rooms over the public PeerJS signaling service.
 * The service only relays the WebRTC handshake; match data then flows peer-to-peer
 * (or through PeerJS's default TURN relay when a direct path is impossible).
 * Phones suspend background tabs, which drops the signaling socket. The host
 * re-registers the same room id when it can; guests keep retrying while the host
 * is away, so a room stays usable for as long as the host page lives.
 */
export type PeerRoomEvents = {
  onReady?: (code: string) => void;
  onConnection?: (connection: BoardConnection, metadata: unknown) => void;
  onReconnecting?: () => void;
  onFailure: (reason: PeerFailure) => void;
};
export type PeerFailure = 'service' | 'room-taken' | 'host-gone' | 'network' | 'browser';
export type PeerJoinEvents = {
  onOpen: (connection: BoardConnection) => void;
  onWaiting?: () => void;
  onFailure: (reason: PeerFailure) => void;
};
export const JOIN_RETRY_MS = 3000;
export const JOIN_LIMIT_MS = 5 * 60 * 1000;
const ATTEMPT_LIMIT_MS = 15000;
const retryable = new Set(['network', 'server-error', 'socket-error', 'socket-closed', 'disconnected']);

export function newRoomCode(kind: string) {
  return `yf-${kind}-${Array.from(crypto.getRandomValues(new Uint8Array(6)), b => b.toString(16).padStart(2, '0')).join('')}`;
}
/** Accept a bare room code or an invitation link carrying ?room=. */
export function readRoomCode(value: string, kind: string) {
  let candidate = value.trim();
  if (candidate.length > 2048) return '';
  if (/^https?:\/\//i.test(candidate)) {
    try { candidate = new URL(candidate).searchParams.get('room') ?? ''; } catch { return ''; }
  }
  return new RegExp(`^yf-${kind}-[a-f0-9]{12}$`).test(candidate) ? candidate : '';
}
export function invitationLink(code: string) {
  const url = new URL(window.location.href);
  url.search = ''; url.hash = ''; url.searchParams.set('room', code);
  return url.toString();
}

/** Hold incoming data until a consumer subscribes, so nothing sent right after
 * the channel opens is lost while the page wires up its protocol handlers. */
export function buffered(c: DataConnection): BoardConnection {
  const queue: unknown[] = [], listeners: ((value: unknown) => void)[] = [];
  let flushing = false;
  const flush = () => { flushing = false; while (queue.length) { const value = queue.shift(); listeners.forEach(listener => listener(value)); } };
  c.on('data', value => {
    if (queue.length < 256) queue.push(value);
    // Deliver on a microtask: wrappers such as PokerPeerChannel subscribe in their
    // constructor, and their owner sets the real handler right after construction.
    if (listeners.length && !flushing) { flushing = true; queueMicrotask(flush); }
  });
  return {
    get open() { return c.open; },
    send(value) { void c.send(value); },
    close() { c.close(); },
    on(event: 'open' | 'close' | 'error' | 'data', listener: (value?: unknown) => void) {
      if (event !== 'data') { c.on(event as 'open', () => listener()); return this; }
      listeners.push(listener);
      if (queue.length && !flushing) { flushing = true; queueMicrotask(flush); }
      return this;
    },
  } as BoardConnection;
}

function keepRegistered(peer: Peer, alive: () => boolean, onReconnecting?: () => void) {
  let timer: ReturnType<typeof setTimeout> | undefined, delay = 1000;
  const attempt = () => {
    clearTimeout(timer);
    if (!alive() || peer.destroyed || !peer.disconnected) return;
    onReconnecting?.();
    timer = setTimeout(() => {
      if (!alive() || peer.destroyed || !peer.disconnected) return;
      try { peer.reconnect(); } catch { /* the next disconnected/error event retries */ }
      delay = Math.min(delay * 2, 10000);
    }, delay);
  };
  const visible = () => { if (document.visibilityState === 'visible') { delay = 1000; attempt(); } };
  peer.on('open', () => { delay = 1000; });
  peer.on('disconnected', attempt);
  const doc = typeof document === 'undefined' ? null : document;
  doc?.addEventListener('visibilitychange', visible);
  return () => { clearTimeout(timer); doc?.removeEventListener('visibilitychange', visible); };
}

/** Host: register `code` and stay registered until destroy(). */
export async function hostPeerRoom(code: string, events: PeerRoomEvents) {
  if (typeof RTCPeerConnection !== 'function') { events.onFailure('browser'); return { destroy() {} }; }
  const { Peer } = await import('peerjs');
  let destroyed = false;
  const peer = new Peer(code);
  const stop = keepRegistered(peer, () => !destroyed, events.onReconnecting);
  peer.on('open', own => { if (!destroyed) events.onReady?.(own); });
  peer.on('connection', c => { if (destroyed) c.close(); else events.onConnection?.(buffered(c), c.metadata); });
  peer.on('error', error => {
    if (destroyed) return;
    if (retryable.has(error.type)) return; // keepRegistered handles socket loss
    events.onFailure(error.type === 'unavailable-id' ? 'room-taken' : error.type === 'browser-incompatible' ? 'browser' : 'service');
  });
  return { destroy() { if (destroyed) return; destroyed = true; stop(); peer.destroy(); } };
}

/** Guest: connect to `code`, retrying while the host is temporarily away. */
export async function joinPeerRoom(code: string, metadata: Record<string, unknown>, events: PeerJoinEvents) {
  if (typeof RTCPeerConnection !== 'function') { events.onFailure('browser'); return { destroy() {} }; }
  const { Peer } = await import('peerjs');
  let destroyed = false, joined = false, retry: ReturnType<typeof setTimeout> | undefined, attemptTimer: ReturnType<typeof setTimeout> | undefined;
  let attemptConnection: DataConnection | undefined, attemptBuffer: BoardConnection | undefined;
  const started = Date.now();
  const peer = new Peer();
  const stop = keepRegistered(peer, () => !destroyed && !joined);
  const fail = (reason: PeerFailure) => { if (destroyed || joined) return; destroyed = true; clearTimeout(retry); clearTimeout(attemptTimer); stop(); peer.destroy(); events.onFailure(reason); };
  const again = () => {
    clearTimeout(attemptTimer); attemptConnection?.close(); attemptConnection = undefined;
    if (Date.now() - started > JOIN_LIMIT_MS) { fail('host-gone'); return; }
    events.onWaiting?.();
    clearTimeout(retry); retry = setTimeout(connect, JOIN_RETRY_MS);
  };
  const connect = () => {
    if (destroyed || joined || peer.destroyed) return;
    if (peer.disconnected) { again(); return; }
    // JSON framing matches the manual channel: undefined fields are dropped, never turned into null.
    const c = peer.connect(code, { reliable: true, metadata, serialization: 'json' });
    attemptConnection = c; attemptBuffer = buffered(c);
    // A present host whose network blocks every path never opens the channel.
    attemptTimer = setTimeout(() => { if (attemptConnection === c && !joined) again(); }, ATTEMPT_LIMIT_MS);
    c.on('open', () => {
      if (destroyed || joined || attemptConnection !== c) { c.close(); return; }
      joined = true; clearTimeout(attemptTimer); clearTimeout(retry); stop();
      events.onOpen(attemptBuffer!);
    });
    c.on('error', () => { if (attemptConnection === c && !joined) again(); });
  };
  peer.on('open', connect);
  peer.on('error', error => {
    if (destroyed || joined) return;
    if (error.type === 'peer-unavailable') { again(); return; }
    if (retryable.has(error.type)) return;
    fail(error.type === 'browser-incompatible' ? 'browser' : 'service');
  });
  return { destroy() { if (destroyed) return; destroyed = true; clearTimeout(retry); clearTimeout(attemptTimer); stop(); peer.destroy(); } };
}

export function peerFailureMessage(reason: PeerFailure, zh: boolean) {
  return ({
    service: zh ? '连不上房间服务。请检查网络后重试；若一直失败，可展开“连接说明”改用邀请码方式。' : 'Could not reach the room service. Check your network and retry, or open the connection notes and use invitation codes instead.',
    'room-taken': zh ? '房间号冲突，请重新创建房间。' : 'Room code collision. Please create the room again.',
    'host-gone': zh ? '等了 5 分钟仍找不到房主。房主可能已关闭页面；请让房主重新创建房间并发新的链接。' : 'The host could not be found for 5 minutes. They may have closed the page; ask them to create a new room and send a new link.',
    network: zh ? '双方的网络无法建立连接。可改用同一个 Wi-Fi，或展开“连接说明”改用邀请码方式。' : 'The two networks could not connect. Try the same Wi-Fi, or open the connection notes and use invitation codes.',
    browser: zh ? '这个浏览器不支持网页直连（WebRTC）。请改用最新版的 Chrome、Edge、Safari 或 Firefox；微信等应用内置浏览器请选择“在浏览器中打开”。' : 'This browser does not support direct web connections (WebRTC). Use a current Chrome, Edge, Safari or Firefox; in chat apps choose “Open in browser”.',
  } as Record<PeerFailure, string>)[reason];
}
