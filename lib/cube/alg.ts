// 魔方公式解析：支持 U D L R F B，后缀 ' 与 2，例如 "R U R' U2"
export type Face = "U" | "D" | "L" | "R" | "F" | "B";

export interface Move {
  face: Face;
  /** 顺时针 90° 的次数：1（顺）、-1（逆）、2（180°） */
  turns: 1 | -1 | 2;
}

const FACES = new Set(["U", "D", "L", "R", "F", "B"]);

export function parseAlg(alg: string): Move[] {
  const moves: Move[] = [];
  for (const token of alg.trim().split(/\s+/)) {
    if (!token) continue;
    const face = token[0].toUpperCase();
    if (!FACES.has(face)) throw new Error(`Invalid move: ${token}`);
    const suffix = token.slice(1);
    let turns: 1 | -1 | 2 = 1;
    if (suffix === "'") turns = -1;
    else if (suffix === "2") turns = 2;
    else if (suffix !== "") throw new Error(`Invalid move: ${token}`);
    moves.push({ face: face as Face, turns });
  }
  return moves;
}

export function invertAlg(alg: string): string {
  return parseAlg(alg)
    .reverse()
    .map((m) => m.face + (m.turns === 1 ? "'" : m.turns === -1 ? "" : "2"))
    .join(" ");
}

export function moveToString(m: Move): string {
  return m.face + (m.turns === 1 ? "" : m.turns === -1 ? "'" : "2");
}

const SCRAMBLE_FACES: Face[] = ["U", "D", "L", "R", "F", "B"];

function scrambleWith(rand: () => number, length: number): string {
  const moves: string[] = [];
  let last: Face | null = null;
  for (let i = 0; i < length; i++) {
    let face: Face;
    do {
      face = SCRAMBLE_FACES[Math.floor(rand() * 6)];
    } while (face === last);
    last = face;
    const suffix = ["", "'", "2"][Math.floor(rand() * 3)];
    moves.push(face + suffix);
  }
  return moves.join(" ");
}

export function randomScramble(length = 20): string {
  return scrambleWith(Math.random, length);
}

/** mulberry32：小而稳定的种子随机数 */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 同一天所有人拿到同一个打乱。dateKey 形如 2026-09-02 */
export function dailyScramble(dateKey: string, length = 20): string {
  let h = 2166136261;
  for (const ch of dateKey) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return scrambleWith(seeded(h), length);
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
