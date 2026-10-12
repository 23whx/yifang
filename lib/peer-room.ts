import type { DataConnection, Peer } from 'peerjs';
import type { BoardConnection } from './board/manual-connection';

/** Link-based friend rooms over the public PeerJS signaling service.
 * The service only relays the WebRTC handshake; match data then flows peer-to-peer
 * (or through PeerJS's default TURN relay when a direct path is impossible).
 *
 * Every connection has two layers. Before admission, the guest knocks and the host
 * (or its policy) decides. After admission, a small session layer rides beside the
 * game protocol: heartbeats (fast drop detection and latency), chat, presence
 * (away/bye/kick) and the host's roster. Session messages carry `kind: 'yf-…'` and
 * never reach the game protocol; game messages never reach the session layer.
 */
export type Profile = { name: string; device: string };
/** What a guest learns on admission: the host's profile and its own roster id. */
export type Welcome = Profile & { you: string };
export type ByeReason = 'left' | 'host-left' | 'kicked' | 'ended';
export type RosterEntry = { id: string; name: string; device: string; role: 'host' | 'guest'; seat?: number; status: 'online' | 'away' | 'offline'; rtt?: number | null };
export type SessionMessage =
  | { kind: 'yf-chat'; v: 1; text: string; from?: string; seat?: number }
  | { kind: 'yf-bye'; v: 1; reason: ByeReason; name?: string }
  | { kind: 'yf-away'; v: 1 }
  | { kind: 'yf-name'; v: 1; name: string }
  | { kind: 'yf-roster'; v: 1; people: RosterEntry[] };
export type PeerRoomEvents = {
  onReady?: (code: string) => void;
  /** An admitted visitor: the game protocol starts on this connection. */
  onConnection?: (connection: BoardConnection, metadata: unknown, visitor: Visitor, session: LinkSession) => void;
  onReconnecting?: () => void;
  onFailure: (reason: PeerFailure) => void;
  /** Everyone currently opening the link or waiting at the door. */
  onVisitors?: (visitors: Visitor[]) => void;
  /** Decide a knock: let in, turn away as full, or ask the host. Default: admit. */
  policy?: (visitor: Visitor) => 'admit' | 'full' | 'ask';
  /** Shown to admitted guests. */
  profile?: Profile;
};
/** A guest who opened the link. `resume` claims a returning player; the game's
 * recovery proof still verifies that claim before any state is shared. */
export type Visitor = { id: string; name: string; device: string; resume: boolean; state: 'connecting' | 'knocking' };
export type PeerFailure = 'service' | 'room-taken' | 'host-gone' | 'network' | 'browser' | 'no-room' | 'denied' | 'full';
export type PeerJoinEvents = {
  onOpen: (connection: BoardConnection, session: LinkSession, host: Welcome) => void;
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
/** How long a returning player keeps trying to reach a vanished host. */
export const JOIN_LIMIT_MS = 2 * 60 * 1000;
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
/** Heartbeat: a peer silent for DEAD_MS is treated as gone (a locked phone, a dead network). */
export const PING_MS = 3000;
export const DEAD_MS = 12000;
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

/** Short device description shown to others, e.g. “iPhone · Safari”. */
export function deviceLabel(ua = typeof navigator === 'undefined' ? '' : navigator.userAgent) {
  const os = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : '';
  const app = /MicroMessenger/.test(ua) ? '微信' : / QQ\//.test(ua) || /MQQBrowser/.test(ua) ? 'QQ' : /EdgA?\//.test(ua) ? 'Edge'
    : /CriOS|Chrome\//.test(ua) ? 'Chrome' : /FxiOS|Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : '';
  return [os, app].filter(Boolean).join(' · ');
}
/** Strip control characters and bound length for anything another player typed. */
export const clip = (value: unknown, max: number) => typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max) : '';
export const CHAT_MAX = 120;
type Knock = { kind: 'yf-knock'; v: 1; name: string; device: string; resume: boolean };
const isSessionKind = (value: unknown) => !!value && typeof value === 'object' && !Array.isArray(value) && typeof (value as { kind?: unknown }).kind === 'string' && (value as { kind: string }).kind.startsWith('yf-');

/** The session layer of one admitted connection. Heartbeats run in both directions:
 * replies are event-driven, so a throttled background timer on one side never
 * makes the other side give up while the page is alive. */
export class LinkSession {
  rtt: number | null = null;
  ended = false;
  private last = Date.now();
  private timer: ReturnType<typeof setInterval> | undefined;
  private listeners = new Set<(message: SessionMessage) => void>();
  private rttListeners = new Set<(rtt: number) => void>();
  private away = () => this.send({ kind: 'yf-away', v: 1 });
  constructor(private c: DataConnection) {
    this.timer = setInterval(() => this.tick(), PING_MS);
    // Best effort: a closing or refreshing page says so before it disappears.
    if (typeof window !== 'undefined') window.addEventListener('pagehide', this.away);
    c.on('close', () => this.stop());
  }
  /** Any traffic (game or session) proves the other side is alive. */
  seen() { this.last = Date.now(); }
  handle(value: Record<string, unknown>) {
    this.seen();
    if (value.v !== 1) return;
    if (value.kind === 'yf-ping') { this.send({ kind: 'yf-pong', v: 1, t: value.t }); return; }
    if (value.kind === 'yf-pong') {
      if (typeof value.t === 'number' && Number.isFinite(value.t)) { this.rtt = Math.max(0, Math.round(Date.now() - value.t)); this.rttListeners.forEach(fn => fn(this.rtt!)); }
      return;
    }
    let message: SessionMessage | null = null;
    if (value.kind === 'yf-chat') { const text = clip(value.text, CHAT_MAX); if (text) message = { kind: 'yf-chat', v: 1, text, from: clip(value.from, 24) || undefined, seat: typeof value.seat === 'number' && Number.isInteger(value.seat) ? value.seat : undefined }; }
    else if (value.kind === 'yf-bye' && ['left', 'host-left', 'kicked', 'ended'].includes(value.reason as string)) message = { kind: 'yf-bye', v: 1, reason: value.reason as ByeReason, name: clip(value.name, 24) || undefined };
    else if (value.kind === 'yf-away') message = { kind: 'yf-away', v: 1 };
    else if (value.kind === 'yf-name') message = { kind: 'yf-name', v: 1, name: clip(value.name, 24) };
    else if (value.kind === 'yf-roster' && Array.isArray(value.people)) {
      const people = value.people.slice(0, 8).flatMap((p: unknown) => {
        const r = p as Partial<RosterEntry> | null;
        if (!r || typeof r.id !== 'string') return [];
        return [{ id: clip(r.id, 64), name: clip(r.name, 24), device: clip(r.device, 40), role: r.role === 'host' ? 'host' as const : 'guest' as const,
          seat: typeof r.seat === 'number' && Number.isInteger(r.seat) ? r.seat : undefined,
          status: r.status === 'away' || r.status === 'offline' ? r.status : 'online' as const,
          rtt: typeof r.rtt === 'number' && Number.isFinite(r.rtt) ? Math.round(r.rtt) : null }];
      });
      message = { kind: 'yf-roster', v: 1, people };
    }
    if (message) { if (message.kind === 'yf-bye') this.ended = true; this.listeners.forEach(fn => fn(message!)); }
  }
  send(message: Record<string, unknown>) { if (this.c.open) { try { void this.c.send(message); } catch { /* the heartbeat notices a dead channel */ } } }
  onMessage(fn: (message: SessionMessage) => void) { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; }
  onRtt(fn: (rtt: number) => void) { this.rttListeners.add(fn); return () => { this.rttListeners.delete(fn); }; }
  chat(text: string, from?: string, seat?: number) { const t = clip(text, CHAT_MAX); if (t) this.send({ kind: 'yf-chat', v: 1, text: t, from, seat }); }
  /** Say goodbye on purpose (leaving, dissolving, kicking), then close. */
  bye(reason: ByeReason, name?: string) {
    if (this.ended) return;
    this.ended = true;
    this.send({ kind: 'yf-bye', v: 1, reason, name });
    setTimeout(() => this.c.close(), 300);
  }
  private tick() {
    if (!this.c.open) { this.stop(); return; }
    if (Date.now() - this.last > DEAD_MS) { this.stop(); this.c.close(); return; }
    this.send({ kind: 'yf-ping', v: 1, t: Date.now() });
  }
  stop() {
    clearInterval(this.timer); this.timer = undefined;
    if (typeof window !== 'undefined') window.removeEventListener('pagehide', this.away);
  }
}

/** Hold incoming data until a consumer subscribes, so nothing sent right after the
 * channel opens is lost while the page wires up its protocol handlers. Until
 * release(), data goes to the door-keeping `control` handler; afterwards session
 * messages go to the attached session and everything else to the game. */
function gated(c: DataConnection) {
  const queue: unknown[] = [], listeners: ((value: unknown) => void)[] = [];
  let flushing = false, released = false, control: ((value: unknown) => void) | null = null, session: LinkSession | null = null;
  const flush = () => { flushing = false; while (queue.length) { const value = queue.shift(); listeners.forEach(listener => listener(value)); } };
  c.on('data', value => {
    if (!released) { control?.(value); return; }
    if (session) { if (isSessionKind(value)) { session.handle(value as Record<string, unknown>); return; } session.seen(); }
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
  return {
    view,
    control(fn: (value: unknown) => void) { control = fn; },
    release(withSession = false) { released = true; if (withSession) session = new LinkSession(c); return session; },
  };
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

export type HostRoom = {
  destroy(): void;
  admit(id: string): void;
  deny(id: string): void;
  update(events: PeerRoomEvents): void;
  /** Close the room on purpose: every admitted guest is told why (the host left, or a named player's exit ended it). */
  dissolve(reason?: 'host-left' | 'ended', name?: string): void;
  /** Remove one admitted guest; they are told and do not reconnect. */
  kick(id: string): void;
  sessions(): { id: string; session: LinkSession; visitor: Visitor }[];
};

/** Host: register `code` and stay registered until destroy(). Visitors knock first;
 * `events.policy` or the host (admit/deny) decides who reaches the game protocol.
 * update() swaps the handlers so a reconnecting match keeps the same room link. */
export async function hostPeerRoom(code: string, initial: PeerRoomEvents): Promise<HostRoom> {
  let events = initial;
  const inert: HostRoom = { destroy() {}, admit() {}, deny() {}, update(next) { events = next; }, dissolve() {}, kick() {}, sessions: () => [] };
  if (typeof RTCPeerConnection !== 'function') { events.onFailure('browser'); return inert; }
  const { Peer } = await import('peerjs');
  let destroyed = false;
  const peer = new Peer(code, { config: ICE_CONFIG });
  const unreachable = setTimeout(() => { if (destroyed || peer.open) return; destroyed = true; stop(); peer.destroy(); events.onFailure('service'); }, SERVICE_LIMIT_MS);
  const stop = keepRegistered(peer, () => !destroyed, () => events.onReconnecting?.());
  type Entry = { visitor: Visitor; c: DataConnection; gate: ReturnType<typeof gated>; timer?: ReturnType<typeof setTimeout> };
  const visitors = new Map<string, Entry>();
  const admitted = new Map<string, { session: LinkSession; visitor: Visitor; c: DataConnection }>();
  const publish = () => events.onVisitors?.([...visitors.values()].map(v => ({ ...v.visitor })));
  const drop = (id: string) => { const v = visitors.get(id); if (!v) return; clearTimeout(v.timer); visitors.delete(id); publish(); };
  const admit = (id: string) => {
    const v = visitors.get(id);
    if (!v || destroyed || v.visitor.state !== 'knocking') return;
    drop(id);
    void v.c.send({ kind: 'yf-admit', v: 1, host: events.profile ?? { name: '', device: deviceLabel() }, you: id });
    const session = v.gate.release(true)!;
    admitted.set(id, { session, visitor: v.visitor, c: v.c });
    v.c.on('close', () => admitted.delete(id));
    if (events.onConnection) events.onConnection(v.gate.view, v.c.metadata, v.visitor, session); else v.c.close();
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
  const destroy = () => {
    clearTimeout(unreachable);
    if (destroyed) return;
    destroyed = true; stop();
    for (const v of visitors.values()) { clearTimeout(v.timer); v.c.close(); }
    for (const a of admitted.values()) a.session.stop();
    visitors.clear(); admitted.clear(); peer.destroy();
  };
  return {
    destroy,
    admit,
    deny: id => deny(id, 'host'),
    /** Swap handlers; pending knocks are re-decided under the new policy. */
    update(next) { events = next; for (const id of [...visitors.keys()]) decide(id); publish(); },
    dissolve(reason = 'host-left', name) {
      if (destroyed) return;
      for (const id of [...visitors.keys()]) deny(id, 'host');
      for (const a of admitted.values()) a.session.bye(reason, name);
      // Let the goodbyes leave before the peer goes away.
      setTimeout(destroy, 400);
    },
    kick(id) { admitted.get(id)?.session.bye('kicked'); admitted.delete(id); },
    sessions: () => [...admitted].map(([id, a]) => ({ id, session: a.session, visitor: a.visitor })),
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
      const m = value as { kind?: unknown; v?: unknown; reason?: unknown; host?: unknown; you?: unknown } | null;
      if (!knocked || attemptConnection !== c || joined || !m || m.v !== 1) return;
      if (m.kind === 'yf-admit') {
        joined = true; clearTimeout(retry); stop();
        const h = m.host as Partial<Profile> | undefined;
        const session = gate.release(true)!;
        events.onOpen(gate.view, session, { name: clip(h?.name, 24), device: clip(h?.device, 40), you: clip(m.you, 64) });
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
    'host-gone': zh ? '房主 2 分钟都没有回来，房间已解散。对局记录保存在本页，房主重新开房后可以点“恢复上次对局”接着下。' : 'The host did not come back within 2 minutes; the room has closed. The match is saved on this page; once the host reopens the room, choose Restore previous match to continue.',
    network: zh ? '找到了房间，但一直连不上房主：房主可能切到了其他应用，或双方的网络打不通。请确认房主停在对战页面，再点“加入房间”；仍不行就让两台设备连同一个 Wi-Fi，在微信、QQ 里打开的请改用 Safari 或 Chrome。' : 'The room exists but the host never answered: they may have switched apps, or the two networks cannot reach each other. Make sure the host is on the game page and choose Join room again; if it still fails, use the same Wi-Fi, and open the link in Safari or Chrome rather than a chat app.',
    browser: zh ? '这个浏览器不支持网页直连（WebRTC）。请改用最新版的 Chrome、Edge、Safari 或 Firefox；微信等应用内置浏览器请选择“在浏览器中打开”。' : 'This browser does not support direct web connections (WebRTC). Use a current Chrome, Edge, Safari or Firefox; in chat apps choose “Open in browser”.',
    'no-room': zh ? '2 分钟内都找不到这个房间：房主可能已关闭页面，或链接已失效。请向房主要新的邀请链接。' : 'This room could not be found for 2 minutes: the host may have closed the page, or the link has expired. Ask the host for a new invitation link.',
    denied: zh ? '房主拒绝了你的加入。' : 'The host declined your request to join.',
    full: zh ? '这个房间已满，或对局已经开始。' : 'This room is full or the match has already started.',
  } as Record<PeerFailure, string>)[reason];
}
export function byeMessage(reason: ByeReason, zh: boolean, name?: string) {
  const who = name || (zh ? '对方' : 'The other player');
  return ({
    'host-left': zh ? '房主已离开，房间已解散。' : 'The host left; the room has closed.',
    kicked: zh ? '你被房主移出了房间。' : 'The host removed you from the room.',
    left: zh ? `${who}离开了房间。` : `${who} left the room.`,
    ended: name ? (zh ? `${name}离开了，本场结束（不判胜负）。` : `${name} left, so this match has ended without a result.`) : (zh ? '房主结束了这场对局。' : 'The host ended this match.'),
  } as Record<ByeReason, string>)[reason];
}
