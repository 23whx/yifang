import { ManualRTC } from '../manual-rtc';

/** The small transport surface shared with PeerJS; no signaling service here. */
export interface BoardConnection {
  readonly open: boolean;
  send(value: unknown): void;
  close(): void;
  on(event: 'open' | 'close' | 'error', listener: () => void): unknown;
  on(event: 'data', listener: (value: unknown) => void): unknown;
}

export class ManualBoardConnection implements BoardConnection {
  private listeners = new Map<string, ((value: unknown) => void)[]>();
  readonly rtc: ManualRTC;
  constructor(game: string, host: boolean) {
    this.rtc = new ManualRTC(game, host);
    this.rtc.onopen = () => this.emit('open');
    this.rtc.onclose = () => this.emit('close');
    this.rtc.onerror = () => this.emit('error');
    this.rtc.ondata = value => this.emit('data', value);
  }
  get open() { return this.rtc.open; }
  on(event: 'open' | 'close' | 'error', listener: () => void): this;
  on(event: 'data', listener: (value: unknown) => void): this;
  on(event: string, listener: (value: unknown) => void) {
    this.listeners.set(event, [...(this.listeners.get(event) ?? []), listener]);
    return this;
  }
  private emit(event: string, value?: unknown) {
    for (const listener of this.listeners.get(event) ?? []) listener(value);
  }
  send(value: unknown) {
    try { this.rtc.send(value); }
    catch { try { this.emit('error'); } finally { this.close(); } }
  }
  close() { this.rtc.close(); }
}
