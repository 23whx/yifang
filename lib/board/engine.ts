/**
 * Fairy-Stockfish（wasm，多线程）UCI 封装。
 * 需要 crossOriginIsolated（COOP/COEP 头，见 next.config.ts）；否则 available() 返回 false。
 */

export interface EngineLevel {
  skill: number; // Skill Level 0–20
  movetime: number; // ms
}

export const LEVELS: Record<"easy" | "medium" | "hard", EngineLevel> = {
  easy: { skill: 0, movetime: 250 },
  medium: { skill: 8, movetime: 600 },
  hard: { skill: 20, movetime: 1500 },
};

interface StockfishModule {
  addMessageListener(cb: (line: string) => void): void;
  removeMessageListener(cb: (line: string) => void): void;
  postMessage(cmd: string): void;
}

declare global {
  interface Window {
    Stockfish?: (opts: object) => Promise<StockfishModule>;
  }
}

export function engineAvailable(): boolean {
  return typeof window !== "undefined" && window.crossOriginIsolated === true && typeof SharedArrayBuffer !== "undefined";
}

let scriptPromise: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    if (window.Stockfish) return resolve();
    const s = document.createElement("script");
    s.src = "/engine/stockfish.js";
    s.onload = () => {
      if (window.Stockfish) resolve();
      else { s.remove(); reject(new Error("stockfish.js did not initialize")); }
    };
    s.onerror = () => { s.remove(); reject(new Error("failed to load stockfish.js")); };
    document.head.appendChild(s);
  }).catch(error => { scriptPromise = null; throw error; });
  return scriptPromise;
}

export class Engine {
  private sf: StockfishModule | null = null;
  private ready: Promise<void>;
  private variant: string;
  private disposed = false;
  private waiters: { pred: (line: string) => boolean; resolve: (line: string) => void; reject: (reason: Error) => void; timer: ReturnType<typeof setTimeout> }[] = [];
  private listener = (line: string) => {
    const hit = this.waiters.find(w => w.pred(line));
    if (hit) { this.waiters.splice(this.waiters.indexOf(hit),1); clearTimeout(hit.timer); hit.resolve(line); }
  };

  constructor(variant: string) {
    this.variant = variant;
    this.ready = this.init();
    // Construction can be followed by immediate navigation before any method awaits ready.
    void this.ready.catch(() => {});
  }

  private async init() {
    await loadScript();
    if (this.disposed) throw new Error('Engine disposed');
    this.sf = await window.Stockfish!({ locateFile: (f: string) => `/engine/${f}` });
    if (this.disposed) { this.sf.postMessage('quit'); this.sf = null; throw new Error('Engine disposed'); }
    this.sf.addMessageListener(this.listener);
    await this.waitFor('uci', (l) => l === 'uciok');
    this.send(`setoption name UCI_Variant value ${this.variant}`);
    this.send("setoption name Use NNUE value false");
    await this.waitFor('isready', (l) => l === 'readyok');
  }

  private send(cmd: string) {
    this.sf?.postMessage(cmd);
  }

  private waitFor(command: string, pred: (line: string) => boolean): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.disposed || !this.sf) { reject(new Error('Engine disposed')); return; }
      const w = { pred, resolve, reject, timer: setTimeout(() => {
        this.waiters = this.waiters.filter(other => other !== w);
        reject(new Error('Engine response timed out'));
        // A late reply from this job must never satisfy a later search.
        this.dispose();
      }, 15000) };
      this.waiters.push(w);
      // Register before sending: a synchronous/fast WASM response must not be lost.
      try { this.send(command); } catch(error) {
        this.waiters = this.waiters.filter(other => other !== w); clearTimeout(w.timer); reject(error);
        // Delivery may have partially succeeded before the transport threw.
        // Never let its late response satisfy another request on this instance.
        this.dispose();
      }
    });
  }

  async newGame() {
    await this.ready;
    this.send("ucinewgame");
    await this.waitFor('isready', (l) => l === 'readyok');
  }

  private searching: Promise<string> | null = null;
  private searchRequest = 0;

  /** 返回 UCI 最佳着法；"(none)" 表示无着可走。若上一次搜索未结束，先中止并等它吐出 bestmove，避免串线 */
  async bestMove(startFen: string, moves: string[], level: EngineLevel): Promise<string> {
    const request = ++this.searchRequest;
    await this.ready;
    if (this.disposed) throw new Error('Engine disposed');
    if (request !== this.searchRequest) throw new Error('Search superseded');
    if (this.searching) {
      this.send("stop");
      await this.searching;
      if (this.disposed) throw new Error('Engine disposed');
      if (request !== this.searchRequest) throw new Error('Search superseded');
    }
    this.send(`setoption name Skill Level value ${level.skill}`);
    this.send(`position fen ${startFen}${moves.length ? " moves " + moves.join(" ") : ""}`);
    const job = this.waitFor(`go movetime ${level.movetime}`, (l) => l.startsWith('bestmove ')).then((line) => line.split(' ')[1]);
    this.searching = job;
    try { return await job; }
    finally { if (this.searching === job) this.searching = null; }
  }

  stop() {
    this.searchRequest++;
    if (this.searching) this.send("stop");
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const w of this.waiters.splice(0)) { clearTimeout(w.timer); w.reject(new Error('Engine disposed')); }
    const sf=this.sf; this.sf=null;
    if (sf) { sf.removeMessageListener(this.listener); sf.postMessage('quit'); }
  }
}
