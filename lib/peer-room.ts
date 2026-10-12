import type { DataConnection, Peer } from 'peerjs';
import type { BoardConnection } from './board/manual-connection';

/** Link-based friend rooms over the public PeerJS signaling service.
 * The service only relays the WebRTC handshake; match data then flows peer-to-peer
 * (or through PeerJS's default TURN relay when a direct path is impossible).
 * Phones suspend background tabs, which drops the signaling socket. The host
 * re-registers the same room id when it can; returning guests keep retrying while
 * the host is away, so a room stays usable for as long as the host page lives.
 * Every guest knocks first; the host (or its policy) decides who reaches the game.
 */
export type PeerRoomEvents = {
  onReady?: (code: string) => void;
  /** An admitted visitor: the game protocol starts on this connection. */
  onConnection?: (connection: BoardConnection, metadata: unknown, visitor: Visitor) => void;
  onReconnecting?: () => void;
  onFailure: (reason: PeerFailure) => void;
  /** Everyone currently opening the link or waiting at the door. */
  onVisitors?: (visitors: Visitor[]) => void;
  /** Decide a knock: let in, turn away as full, or ask the host. Default: admit. */
  policy?: (visitor: Visitor) => 'admit' | 'full' | 'ask';
};
/** A guest who opened the link. `resume` claims a returning player; the game's
 * recovery proof still verifies that claim before any state is shared. */
export type Visitor = { id: string; name: string; device: string; resume: boolean; state: 'connecting' | 'knocking' };
export type PeerFailure = 'service' | 'room-taken' | 'host-gone' | 'network' | 'browser' | 'no-room' | 'denied' | 'full';
export type PeerJoinEvents = {
  onOpen: (connection: BoardConnection) => void;
  onWaiting?: () => void;
  /** A fresh link keeps finding no host: the room may be gone, or the host briefly away. */
  onMissing?: () => void;
  /** Reached the host's page; waiting for the host to let us in. */
  onKnocking?: () => void;
  /** The room service answered; from here on we are looking for the host. */
  onService?: () => void;
  onFailure: (reason: PeerFailure) => void;
};
export const JOIN_RETRY_MS = 3000;
export const JOIN_LIMIT_MS = 5 * 60 * 1000;
const ATTEMPT_LIMIT_MS = 15000;
/** Google STUN is unreachable from mainland China and PeerJS TURN sits in Europe/US, so
 * list STUN servers reachable there first. Without a reflexive address, two devices on
 * different networks cannot find a path to each other. */
export const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: ['stun:stun.miwifi.com:3478', 'stun:stun.chat.bilibili.com:3478', 'stun:stun.cloudflare.com:3478'] },
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'], username: 'peerjs', credential: 'peerjsp' },
  ],
};
/** Silent attempts while the host is still registered: either the networks cannot connect,
 * or a phone host went to the background before the service noticed. Allow about a minute. */
const PATH_ATTEMPTS = 4;
/** A room service that never answers (blocked or unreachable network) must fail visibly. */
export const SERVICE_LIMIT_MS = 20000;
/** An open channel that never knocks is dropped from the host's list. */
const KNOCK_LIMIT_MS = 15000;
/** After this many misses a fresh link says the room may be gone, but keeps trying:
 * a phone host sending the link from a chat app is briefly offline too. */
const MISSING_ROOM_ATTEMPTS = 2;
/** A fresh link that never finds the host gives up after this long. */
export const FRESH_LIMIT_MS = 2 * 60 * 1000;
/** A knock the host never answers is turned away eventually. */
const DECISION_LIMIT_MS = 10 * 60 * 1000;
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

/** Short device description shown to the host, e.g. “iPhone · Safari”. */
export function deviceLabel(ua = typeof navigator === 'undefined' ? '' : navigator.userAgent) {
  const os = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : '';
  const app = /MicroMessenger/.test(ua) ? '微信' : / QQ\//.test(ua) || /MQQBrowser/.test(ua) ? 'QQ' : /EdgA?\//.test(ua) ? 'Edge'
    : /CriOS|Chrome\//.test(ua) ? 'Chrome' : /FxiOS|Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : '';
  return [os, app].filter(Boolean).join(' · ');
}
const clip = (value: unknown, max: number) => typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max) : '';
type Knock = { kind: 'yf-knock'; v: 1; name: string; device: string; resume: boolean };

/** Hold incoming data until a consumer subscribes, so nothing sent right after the
 * channel opens is lost while the page wires up its protocol handlers. Until
 * release(), data goes to the door-keeping `control` handler instead. */
function gated(c: DataConnection) {
  const queue: unknown[] = [], listeners: ((value: unknown) => void)[] = [];
  let flushing = false, released = false, control: ((value: unknown) => void) | null = null;
  const flush = () => { flushing = false; while (queue.length) { const value = queue.shift(); listeners.forEach(listener => listener(value)); } };
  c.on('data', value => {
    if (!released) { control?.(value); return; }
    if (queue.length < 256) queue.push(value);
    // Deliver on a microtask: wrappers such as PokerPeerChannel subscribe in their
    // constructor, and their owner sets the real handler right after construction.
    if (listeners.length && !flushing) { flushing = true; queueMicrotask(flush); }
  });
  const view = {
    get open() { return c.open; },
    send(value: unknown) { void c.send(value); },
    close() { c.close(); },
    on(event: 'open' | 'close' | 'error' | 'data', listener: (value?: unknown) => void) {
      if (event !== 'data') { c.on(event as 'open', () => listener()); return view; }
      listeners.push(listener);
      if (queue.length && !flushing) { flushing = true; queueMicrotask(flush); }
      return view;
    },
  } as BoardConnection;
  return { view, control(fn: (value: unknown) => void) { control = fn; }, release() { released = true; } };
}
export function buffered(c: DataConnection): BoardConnection { const g = gated(c); g.release(); return g.view; }

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

export type HostRoom = { destroy(): void; admit(id: string): void; deny(id: string): void; update(events: PeerRoomEvents): void };

/** Host: register `code` and stay registered until destroy(). Visitors knock first;
 * `events.policy` or the host (admit/deny) decides who reaches the game protocol.
 * update() swaps the handlers so a reconnecting match keeps the same room link. */
export async function hostPeerRoom(code: string, initial: PeerRoomEvents): Promise<HostRoom> {
  let events = initial;
  const inert: HostRoom = { destroy() {}, admit() {}, deny() {}, update(next) { events = next; } };
  if (typeof RTCPeerConnection !== 'function') { events.onFailure('browser'); return inert; }
  const { Peer } = await import('peerjs');
  let destroyed = false;
  const peer = new Peer(code, { config: ICE_CONFIG });
  const unreachable = setTimeout(() => { if (destroyed || peer.open) return; destroyed = true; stop(); peer.destroy(); events.onFailure('service'); }, SERVICE_LIMIT_MS);
  const stop = keepRegistered(peer, () => !destroyed, () => events.onReconnecting?.());
  type Entry = { visitor: Visitor; c: DataConnection; gate: ReturnType<typeof gated>; timer?: ReturnType<typeof setTimeout> };
  const visitors = new Map<string, Entry>();
  const publish = () => events.onVisitors?.([...visitors.values()].map(v => ({ ...v.visitor })));
  const drop = (id: string) => { const v = visitors.get(id); if (!v) return; clearTimeout(v.timer); visitors.delete(id); publish(); };
  const admit = (id: string) => {
    const v = visitors.get(id);
    if (!v || destroyed || v.visitor.state !== 'knocking') return;
    drop(id);
    void v.c.send({ kind: 'yf-admit', v: 1 });
    v.gate.release();
    if (events.onConnection) events.onConnection(v.gate.view, v.c.metadata, v.visitor); else v.c.close();
  };
  const deny = (id: string, reason: 'host' | 'full') => {
    const v = visitors.get(id);
    if (!v) return;
    drop(id);
    if (v.c.open) void v.c.send({ kind: 'yf-deny', v: 1, reason });
    setTimeout(() => v.c.close(), 500);
  };
  const decide = (id: string) => {
    const v = visitors.get(id);
    if (!v || v.visitor.state !== 'knocking') return;
    const decision = events.policy?.(v.visitor) ?? 'admit';
    if (decision === 'admit') admit(id);
    else if (decision === 'full') deny(id, 'full');
  };
  peer.on('open', own => { clearTimeout(unreachable); if (!destroyed) events.onReady?.(own); });
  peer.on('connection', c => {
    if (destroyed) { c.close(); return; }
    const id = c.connectionId || crypto.randomUUID();
    const entry: Entry = { visitor: { id, name: '', device: '', resume: false, state: 'connecting' }, c, gate: gated(c) };
    visitors.set(id, entry); publish();
    // Channels that never open, or open and never knock, leave the list.
    entry.timer = setTimeout(() => { if (visitors.get(id) === entry) { drop(id); c.close(); } }, ATTEMPT_LIMIT_MS + KNOCK_LIMIT_MS);
    entry.gate.control(value => {
      const k = value as Partial<Knock> | null;
      if (visitors.get(id) !== entry || entry.visitor.state !== 'connecting' || !k || k.kind !== 'yf-knock' || k.v !== 1) { drop(id); c.close(); return; }
      clearTimeout(entry.timer);
      entry.visitor = { ...entry.visitor, name: clip(k.name, 24), device: clip(k.device, 40), resume: k.resume === true, state: 'knocking' };
      entry.timer = setTimeout(() => { if (visitors.get(id) === entry) deny(id, 'host'); }, DECISION_LIMIT_MS);
      publish();
      decide(id);
    });
    c.on('close', () => drop(id));
    c.on('error', () => { drop(id); c.close(); });
  });
  peer.on('error', error => {
    if (destroyed) return;
    if (retryable.has(error.type)) return; // keepRegistered handles socket loss
    events.onFailure(error.type === 'unavailable-id' ? 'room-taken' : error.type === 'browser-incompatible' ? 'browser' : 'service');
  });
  return {
    destroy() {
      clearTimeout(unreachable);
      if (destroyed) return;
      destroyed = true; stop();
      for (const v of visitors.values()) { clearTimeout(v.timer); v.c.close(); }
      visitors.clear(); peer.destroy();
    },
    admit,
    deny: id => deny(id, 'host'),
    /** Swap handlers; pending knocks are re-decided under the new policy. */
    update(next) { events = next; for (const id of [...visitors.keys()]) decide(id); publish(); },
  };
}

/** Guest: connect to `code`, knock, and wait for the host to let us in.
 * A returning player (`resume`) keeps retrying while the host is away; a freshly
 * opened link that finds no host says so within seconds and gives up after two minutes. */
export async function joinPeerRoom(code: string, metadata: Record<string, unknown>, events: PeerJoinEvents, knock: { name?: string; resume?: boolean } = {}) {
  if (typeof RTCPeerConnection !== 'function') { events.onFailure('browser'); return { destroy() {} }; }
  const { Peer } = await import('peerjs');
  let destroyed = false, joined = false, retry: ReturnType<typeof setTimeout> | undefined, attemptTimer: ReturnType<typeof setTimeout> | undefined;
  let attemptConnection: DataConnection | undefined;
  const started = Date.now(), resume = knock.resume === true;
  let silentAttempts = 0, missing = 0, everFound = false;
  const peer = new Peer({ config: ICE_CONFIG });
  const stop = keepRegistered(peer, () => !destroyed && !joined);
  const fail = (reason: PeerFailure) => { if (destroyed || joined) return; destroyed = true; clearTimeout(retry); clearTimeout(attemptTimer); stop(); peer.destroy(); events.onFailure(reason); };
  const again = () => {
    clearTimeout(attemptTimer); attemptConnection?.close(); attemptConnection = undefined;
    if (!resume && !everFound && Date.now() - started > FRESH_LIMIT_MS) { fail('no-room'); return; }
    if (Date.now() - started > JOIN_LIMIT_MS) { fail('host-gone'); return; }
    events.onWaiting?.();
    clearTimeout(retry); retry = setTimeout(connect, JOIN_RETRY_MS);
  };
  const connect = () => {
    if (destroyed || joined || peer.destroyed) return;
    if (peer.disconnected) { again(); return; }
    // JSON framing matches the manual channel: undefined fields are dropped, never turned into null.
    const c = peer.connect(code, { reliable: true, metadata: { ...metadata, resume }, serialization: 'json' });
    const gate = gated(c);
    attemptConnection = c;
    let knocked = false;
    // A present host whose network blocks every path never opens the channel.
    attemptTimer = setTimeout(() => {
      if (attemptConnection !== c || joined || knocked) return;
      if (++silentAttempts >= PATH_ATTEMPTS) { attemptConnection = undefined; c.close(); fail('network'); return; }
      again();
    }, ATTEMPT_LIMIT_MS);
    gate.control(value => {
      const m = value as { kind?: unknown; v?: unknown; reason?: unknown } | null;
      if (!knocked || attemptConnection !== c || joined || !m || m.v !== 1) return;
      if (m.kind === 'yf-admit') {
        joined = true; clearTimeout(retry); stop(); gate.release();
        events.onOpen(gate.view);
      } else if (m.kind === 'yf-deny') {
        attemptConnection = undefined; fail(m.reason === 'full' ? 'full' : 'denied'); c.close();
      }
    });
    c.on('open', () => {
      if (destroyed || joined || attemptConnection !== c) { c.close(); return; }
      everFound = true; knocked = true; clearTimeout(attemptTimer);
      void c.send({ kind: 'yf-knock', v: 1, name: clip(knock.name, 24), device: deviceLabel(), resume } satisfies Knock);
      events.onKnocking?.();
    });
    // Closed before admission (host page went away): retry like an absent host.
    c.on('close', () => { if (attemptConnection === c && !joined && !destroyed) again(); });
    c.on('error', () => { if (attemptConnection === c && !joined) again(); });
  };
  let reached = false;
  const unreachable = setTimeout(() => { if (!reached) fail('service'); }, SERVICE_LIMIT_MS);
  peer.on('open', () => { if (!reached) { reached = true; clearTimeout(unreachable); events.onService?.(); } connect(); });
  peer.on('error', error => {
    if (destroyed || joined) return;
    if (error.type === 'peer-unavailable') {
      silentAttempts = 0;
      again();
      if (!resume && !everFound && ++missing >= MISSING_ROOM_ATTEMPTS) events.onMissing?.();
      return;
    }
    if (retryable.has(error.type)) return;
    fail(error.type === 'browser-incompatible' ? 'browser' : 'service');
  });
  return { destroy() { clearTimeout(unreachable); if (destroyed) return; destroyed = true; clearTimeout(retry); clearTimeout(attemptTimer); stop(); peer.destroy(); } };
}

export function peerFailureMessage(reason: PeerFailure, zh: boolean) {
  return ({
    service: zh ? '连不上房间服务（PeerJS 公共服务）。你的网络可能无法访问它，例如部分地区或公司网络会屏蔽。请换个网络（如手机流量）重试，或展开“连接说明”改用邀请码方式。' : 'Could not reach the room service (the PeerJS public service). Your network may block it, as some regions and workplaces do. Try another network such as mobile data, or open the connection notes and use invitation codes instead.',
    'room-taken': zh ? '房间号冲突，请重新创建房间。' : 'Room code collision. Please create the room again.',
    'host-gone': zh ? '等了 5 分钟仍找不到房主。房主可能已关闭页面；请让房主重新创建房间并发新的链接。' : 'The host could not be found for 5 minutes. They may have closed the page; ask them to create a new room and send a new link.',
    network: zh ? '找到了房间，但一直连不上房主：房主可能切到了其他应用，或双方的网络打不通。请确认房主停在对战页面，再点“加入房间”；仍不行就让两台设备连同一个 Wi-Fi，在微信、QQ 里打开的请改用 Safari 或 Chrome。' : 'The room exists but the host never answered: they may have switched apps, or the two networks cannot reach each other. Make sure the host is on the game page and choose Join room again; if it still fails, use the same Wi-Fi, and open the link in Safari or Chrome rather than a chat app.',
    browser: zh ? '这个浏览器不支持网页直连（WebRTC）。请改用最新版的 Chrome、Edge、Safari 或 Firefox；微信等应用内置浏览器请选择“在浏览器中打开”。' : 'This browser does not support direct web connections (WebRTC). Use a current Chrome, Edge, Safari or Firefox; in chat apps choose “Open in browser”.',
    'no-room': zh ? '2 分钟内都找不到这个房间：房主可能已关闭页面，或链接已失效。请向房主要新的邀请链接。' : 'This room could not be found for 2 minutes: the host may have closed the page, or the link has expired. Ask the host for a new invitation link.',
    denied: zh ? '房主拒绝了你的加入。' : 'The host declined your request to join.',
    full: zh ? '这个房间已满，或对局已经开始。' : 'This room is full or the match has already started.',
  } as Record<PeerFailure, string>)[reason];
}
