/** Manual, data-only WebRTC. No signaling, STUN, TURN, fetch or WebSocket service. */
import {secureMultiplayerContext} from './network-context';
const MAX_FRAME_BYTES = 65536;
const frameEncoder = new TextEncoder();
export type ManualSignal = { v: 1; game: string; id: string; type: 'offer' | 'answer'; sdp: string };
export function readManualSignal(text: string, game: string, type: 'offer' | 'answer', id?: string): ManualSignal {
  if (text.length > 65536) throw new Error('Signal too large');
  const value = JSON.parse(text.trim()) as ManualSignal;
  if (!value || value.v !== 1 || value.game !== game || value.type !== type ||
    typeof value.id !== 'string' || !/^[a-f0-9]{24}$/.test(value.id) || (id && value.id !== id) ||
    typeof value.sdp !== 'string' || !value.sdp.startsWith('v=0') || !value.sdp.includes('m=application ') ||
    /(?:^|\r?\n)m=(?:audio|video) /m.test(value.sdp)) throw new Error('Wrong or malformed signal');
  return { v: 1, game, id: value.id, type, sdp: value.sdp };
}

export class ManualRTC {
  private pc: RTCPeerConnection;
  private channel: RTCDataChannel | null = null;
  private stopped = false;
  private id: string;
  private gatherAbort: (() => void) | null = null;
  private disconnectedTimer: ReturnType<typeof setTimeout> | null = null;
  private negotiating = false;
  private signalStep: 'new' | 'offered' | 'answered' | 'finished' = 'new';
  onopen: () => void = () => {};
  ondata: (value: unknown) => void = () => {};
  onclose: () => void = () => {};
  onerror: () => void = () => {};

  constructor(private game: string, private isHost: boolean) {
    if(!secureMultiplayerContext())throw new Error('Secure multiplayer context required');
    this.id = Array.from(crypto.getRandomValues(new Uint8Array(12)), n => n.toString(16).padStart(2, '0')).join('');
    this.pc = new RTCPeerConnection({ iceServers: [] });
    this.pc.onconnectionstatechange = () => {
      if (this.stopped) return;
      if (this.pc.connectionState === 'disconnected') {
        // ICE may briefly enter disconnected while a tab is backgrounded or
        // switching network routes. Give it time to reconnect before ending
        // a match whose state can only be restored through a new handshake.
        if (!this.disconnectedTimer) this.disconnectedTimer = setTimeout(() => {
          this.disconnectedTimer = null;
          if (this.pc.connectionState === 'disconnected') this.close();
        }, 5000);
      } else {
        if (this.disconnectedTimer) clearTimeout(this.disconnectedTimer);
        this.disconnectedTimer = null;
        if (this.pc.connectionState === 'failed' || this.pc.connectionState === 'closed') this.close();
      }
    };
    if (isHost) this.attach(this.pc.createDataChannel('yifang', { ordered: true }));
    else this.pc.ondatachannel = e => {
      // Recovery/turn protocols require reliable, ordered messages. A matching
      // label alone does not establish the transport's delivery guarantees.
      if (this.stopped || this.channel || e.channel.label !== 'yifang' ||
        e.channel.ordered !== true || e.channel.maxRetransmits !== null ||
        e.channel.maxPacketLifeTime !== null) { e.channel.close(); return; }
      this.attach(e.channel);
    };
  }
  get open() { return !this.stopped && this.channel?.readyState === 'open'; }
  private attach(channel: RTCDataChannel) {
    this.channel = channel;
    channel.onopen = () => { if (!this.stopped) this.onopen(); };
    channel.onclose = () => { this.close(); };
    channel.onerror = () => { this.fail(); };
    channel.onmessage = event => {
      if (this.stopped) return;
      try {
        if (typeof event.data !== 'string' || event.data.length > MAX_FRAME_BYTES ||
          frameEncoder.encode(event.data).byteLength > MAX_FRAME_BYTES) throw new Error('Invalid message');
        this.ondata(JSON.parse(event.data));
      } catch { this.fail(); }
    };
  }
  private fail() {
    if (this.stopped) return;
    try { this.onerror(); } finally { this.close(); }
  }
  send(value: unknown) {
    if (!this.open || !this.channel) throw new Error('Connection closed');
    const message = JSON.stringify(value);
    if (typeof message !== 'string') throw new Error('Invalid message');
    // WebRTC counts UTF-8 bytes. A smaller SCTP limit is negotiated by the
    // browser; an unlimited transport does not remove our own frame bound.
    const negotiated = this.pc.sctp?.maxMessageSize;
    const limit = typeof negotiated === 'number' && negotiated > 0 ? Math.min(MAX_FRAME_BYTES, negotiated) : MAX_FRAME_BYTES;
    if (message.length > limit || frameEncoder.encode(message).byteLength > limit ||
      this.channel.bufferedAmount > 262144) throw new Error('Message limit exceeded');
    this.channel.send(message);
  }
  close() {
    if (this.stopped) return;
    this.stopped = true;
    if (this.disconnectedTimer) clearTimeout(this.disconnectedTimer);
    this.disconnectedTimer = null;
    this.gatherAbort?.();
    this.channel?.close(); this.pc.close(); this.onclose();
  }
  private async local(description: RTCSessionDescriptionInit): Promise<string> {
    if (this.stopped) throw new Error('Connection cancelled');
    await this.pc.setLocalDescription(description);
    if (this.stopped) throw new Error('Connection cancelled');
    if (this.pc.iceGatheringState !== 'complete') await new Promise<void>((resolve, reject) => {
      const cleanup = () => { clearTimeout(timer); this.pc.removeEventListener('icegatheringstatechange', changed); this.gatherAbort = null; };
      const changed = () => { if (this.pc.iceGatheringState === 'complete') { cleanup(); resolve(); } };
      const timer = setTimeout(() => { cleanup(); reject(new Error('ICE gathering timed out')); }, 15000);
      this.gatherAbort = () => { cleanup(); reject(new Error('Connection cancelled')); };
      this.pc.addEventListener('icegatheringstatechange', changed);
      changed();
    });
    if (this.stopped || !this.pc.localDescription?.sdp) throw new Error('No local description');
    const { type, sdp } = this.pc.localDescription;
    return JSON.stringify({ v: 1, game: this.game, id: this.id, type, sdp });
  }
  private async negotiate<T>(operation: () => Promise<T>): Promise<T> {
    if (this.stopped) throw new Error('Connection cancelled');
    if (this.negotiating) throw new Error('Negotiation already in progress');
    this.negotiating = true;
    try {
      const result = await operation();
      if (this.stopped) throw new Error('Connection cancelled');
      return result;
    } finally { this.negotiating = false; }
  }
  async offer() { return this.negotiate(async () => {
    if (!this.isHost || this.signalStep !== 'new' || this.pc.signalingState !== 'stable') throw new Error('Wrong step');
    const signal = await this.local(await this.pc.createOffer());
    this.signalStep = 'offered';
    return signal;
  }); }
  async answer(text: string) { return this.negotiate(async () => {
    if (this.isHost || this.signalStep !== 'new' || this.pc.signalingState !== 'stable') throw new Error('Wrong step');
    const value = readManualSignal(text, this.game, 'offer');
    this.id = value.id;
    await this.pc.setRemoteDescription({ type: value.type, sdp: value.sdp });
    if (this.stopped) throw new Error('Connection cancelled');
    const signal = await this.local(await this.pc.createAnswer());
    this.signalStep = 'answered';
    return signal;
  }); }
  async finish(text: string) { return this.negotiate(async () => {
    if (!this.isHost || this.signalStep !== 'offered' || this.pc.signalingState !== 'have-local-offer') throw new Error('Wrong step');
    const value = readManualSignal(text, this.game, 'answer', this.id);
    await this.pc.setRemoteDescription({ type: value.type, sdp: value.sdp });
    this.signalStep = 'finished';
  }); }
}
