/** 浏览器端加载 ffish.js（Fairy-Stockfish 规则库，wasm）。文件放在 public/engine，绕开打包器 */

export interface FfishBoard {
  delete(): void;
  legalMoves(): string;
  push(uci: string): boolean;
  pushMoves(ucis: string): void;
  pop(): void;
  fen(): string;
  setFen(fen: string): void;
  sanMove(uci: string, notation?: number): string;
  turn(): boolean;
  isCheck(): boolean;
  checkedPieces(): string;
  isGameOver(claimDraw?: boolean): boolean;
  result(claimDraw?: boolean): string;
  moveStack(): string;
  pocket(color: boolean): string;
  isCapture(uci: string): boolean;
}

export interface Ffish {
  Board: new (variant: string, fen?: string) => FfishBoard;
  Notation: Record<string, number>;
  startingFen(variant: string): string;
  validateFen(fen: string, variant?: string): number;
}

let pending: Promise<Ffish> | null = null;

export function loadFfish(): Promise<Ffish> {
  if (pending) return pending;
  pending = (async () => {
    const url = `${window.location.origin}/engine/ffish.js`;
    // 用 Function 构造 import，避免打包器尝试解析 public 下的文件
    const mod = (await new Function("u", "return import(u)")(url)) as { default: (o: object) => Promise<Ffish> };
    return mod.default({ locateFile: (f: string) => `/engine/${f}` });
  })().catch(error => { pending = null; throw error; });
  return pending;
}
