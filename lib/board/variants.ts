export type BoardGame = "chess" | "xiangqi" | "shogi";

export function isBoardGame(v: string): v is BoardGame {
  return v === "chess" || v === "xiangqi" || v === "shogi";
}

export type Side = "w" | "b";

/** Flip relative to the current mode's base view, not a previous AI side. */
export function boardOrientation(mode: "ai" | "local", human: Side, flipped: boolean): Side {
  const base = mode === "ai" ? human : "w";
  return flipped ? (base === "w" ? "b" : "w") : base;
}

export interface Piece {
  /** ffish 字母，小写；如 k q r b n p / a c / g s l */
  type: string;
  side: Side;
  promoted: boolean;
}

export interface VariantSpec {
  game: BoardGame;
  files: number;
  ranks: number;
  /** 棋子落在交叉点（象棋）还是格子里 */
  intersections: boolean;
  /** 有持驹区（将棋） */
  hands: boolean;
  /** 后手方棋子是否旋转 180°（将棋） */
  rotateSecond: boolean;
  /** ffish Notation 枚举名 */
  notation: "SAN" | "XIANGQI_WXF" | "SHOGI_HODGES";
  glyph: (p: Piece) => string;
  sideName: { w: { zh: string; en: string }; b: { zh: string; en: string } };
}

const CHESS_GLYPH: Record<string, [string, string]> = {
  k: ["♔", "♚"],
  q: ["♕", "♛"],
  r: ["♖", "♜"],
  b: ["♗", "♝"],
  n: ["♘", "♞"],
  p: ["♙", "♟"],
};

const XIANGQI_GLYPH: Record<string, [string, string]> = {
  k: ["帥", "將"],
  a: ["仕", "士"],
  b: ["相", "象"],
  n: ["傌", "馬"],
  r: ["俥", "車"],
  c: ["炮", "砲"],
  p: ["兵", "卒"],
};

const SHOGI_GLYPH: Record<string, string> = {
  k: "王",
  g: "金",
  s: "銀",
  n: "桂",
  l: "香",
  b: "角",
  r: "飛",
  p: "歩",
};
const SHOGI_PROMOTED: Record<string, string> = { s: "全", n: "圭", l: "杏", b: "馬", r: "龍", p: "と" };

export const VARIANTS: Record<BoardGame, VariantSpec> = {
  chess: {
    game: "chess",
    files: 8,
    ranks: 8,
    intersections: false,
    hands: false,
    rotateSecond: false,
    notation: "SAN",
    glyph: (p) => CHESS_GLYPH[p.type]?.[p.side === "w" ? 0 : 1] ?? "?",
    sideName: { w: { zh: "白方", en: "White" }, b: { zh: "黑方", en: "Black" } },
  },
  xiangqi: {
    game: "xiangqi",
    files: 9,
    ranks: 10,
    intersections: true,
    hands: false,
    rotateSecond: false,
    notation: "XIANGQI_WXF",
    glyph: (p) => XIANGQI_GLYPH[p.type]?.[p.side === "w" ? 0 : 1] ?? "?",
    sideName: { w: { zh: "红方", en: "Red" }, b: { zh: "黑方", en: "Black" } },
  },
  shogi: {
    game: "shogi",
    files: 9,
    ranks: 9,
    intersections: false,
    hands: true,
    rotateSecond: true,
    notation: "SHOGI_HODGES",
    glyph: (p) => {
      if (p.type === "k") return p.side === "w" ? "王" : "玉";
      return (p.promoted ? SHOGI_PROMOTED[p.type] : SHOGI_GLYPH[p.type]) ?? "?";
    },
    sideName: { w: { zh: "先手", en: "Sente" }, b: { zh: "后手", en: "Gote" } },
  },
};

export const FILES = "abcdefghi";

export function squareName(file: number, rank: number): string {
  return `${FILES[file]}${rank + 1}`;
}

/** 解析 FEN 棋盘部分为 grid[rank][file]（rank 0 = 第 1 行，即先手方底线） */
export function parseFen(fen: string, spec: VariantSpec): { grid: (Piece | null)[][]; hands: { w: string[]; b: string[] }; turn: Side } {
  const [boardPart, turnPart] = fen.split(" ");
  let rows = boardPart;
  const hands = { w: [] as string[], b: [] as string[] };
  const m = boardPart.match(/^(.*)\[(.*)\]$/);
  if (m) {
    rows = m[1];
    for (const ch of m[2]) {
      if (ch === "-") continue;
      (ch === ch.toUpperCase() ? hands.w : hands.b).push(ch.toLowerCase());
    }
  }
  const grid: (Piece | null)[][] = Array.from({ length: spec.ranks }, () => Array(spec.files).fill(null));
  const rankStrings = rows.split("/");
  rankStrings.forEach((rs, i) => {
    const rank = spec.ranks - 1 - i;
    if (rank < 0) return;
    let file = 0;
    let promoted = false;
    let num = "";
    for (const ch of rs) {
      if (ch >= "0" && ch <= "9") {
        num += ch;
        continue;
      }
      if (num) {
        file += parseInt(num, 10);
        num = "";
      }
      if (ch === "+") {
        promoted = true;
        continue;
      }
      if (ch === "~") continue;
      if (file < spec.files) {
        grid[rank][file] = { type: ch.toLowerCase(), side: ch === ch.toUpperCase() ? "w" : "b", promoted };
      }
      promoted = false;
      file++;
    }
  });
  return { grid, hands, turn: turnPart === "b" ? "b" : "w" };
}

/** 一步 UCI：普通走子 e2e4 / 升变 e7e8q / 成 g7g6+ / 打入 P@e5 */
export interface ParsedMove {
  from: string | null; // 打入为 null
  to: string;
  drop: string | null; // 打入的棋子字母（小写）
  suffix: string; // 升变或成
}

export function parseUci(uci: string): ParsedMove {
  if (uci[1] === "@") {
    return { from: null, to: uci.slice(2, 4), drop: uci[0].toLowerCase(), suffix: "" };
  }
  // Xiangqi rank 10 may occur at the origin as well as the destination.
  const match = uci.match(/^([a-i](?:10|[1-9]))([a-i](?:10|[1-9]))(.*)$/);
  if (!match) return { from: uci.slice(0, 2), to: uci.slice(2, 4), drop: null, suffix: uci.slice(4) };
  return { from: match[1], to: match[2], drop: null, suffix: match[3] };
}

/** 解析 a1 / e10 这样的格名 */
export function squareToXY(sq: string): { file: number; rank: number } {
  return { file: FILES.indexOf(sq[0]), rank: parseInt(sq.slice(1), 10) - 1 };
}
