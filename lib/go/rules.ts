export type Stone = 0 | 1 | 2;
export interface GoState {
  size: number;
  board: Stone[];
  turn: 1 | 2;
  history: string[];
  passes: number;
  captures: [number, number];
  last: number | null;
}
export function newGo(size = 9): GoState {
  const board: Stone[] = Array(size * size).fill(0);
  return {
    size,
    board,
    turn: 1,
    history: [board.join("")],
    passes: 0,
    captures: [0, 0],
    last: null,
  };
}
export function neighbours(i: number, n: number): number[] {
  const x = i % n,
    y = Math.floor(i / n);
  return [
    x > 0 ? i - 1 : -1,
    x < n - 1 ? i + 1 : -1,
    y > 0 ? i - n : -1,
    y < n - 1 ? i + n : -1,
  ].filter((v) => v >= 0);
}
export function group(board: Stone[], i: number, n: number) {
  const stones = new Set<number>(),
    liberties = new Set<number>(),
    pending = [i],
    color = board[i];
  if (!color) return { stones, liberties };
  while (pending.length) {
    const p = pending.pop()!;
    if (stones.has(p)) continue;
    stones.add(p);
    for (const q of neighbours(p, n)) {
      if (board[q] === 0) liberties.add(q);
      else if (board[q] === color && !stones.has(q)) pending.push(q);
    }
  }
  return { stones, liberties };
}
export function playGo(
  s: GoState,
  point: number | null,
): { state?: GoState; error?: "occupied" | "suicide" | "ko" | "finished" } {
  if (s.passes >= 2) return { error: "finished" };
  if (point === null)
    return {
      state: {
        ...s,
        turn: s.turn === 1 ? 2 : 1,
        passes: s.passes + 1,
        last: null,
      },
    };
  if (
    !Number.isInteger(point) ||
    point < 0 ||
    point >= s.board.length ||
    s.board[point]
  )
    return { error: "occupied" };
  const board = [...s.board];
  board[point] = s.turn;
  let captured = 0;
  for (const q of neighbours(point, s.size)) {
    if (board[q] && board[q] !== s.turn) {
      const g = group(board, q, s.size);
      if (g.liberties.size === 0)
        for (const p of g.stones) {
          board[p] = 0;
          captured++;
        }
    }
  }
  if (group(board, point, s.size).liberties.size === 0)
    return { error: "suicide" };
  const hash = board.join("");
  if (s.history.includes(hash)) return { error: "ko" };
  const captures: [number, number] = [...s.captures];
  captures[s.turn - 1] += captured;
  return {
    state: {
      ...s,
      board,
      turn: s.turn === 1 ? 2 : 1,
      passes: 0,
      history: [...s.history, hash],
      captures,
      last: point,
    },
  };
}
export function scoreGo(s: GoState, dead: number[] = [], komi = 7.5) {
  const b = s.board.map((v, i) => (dead.includes(i) ? 0 : v)) as Stone[],
    score = [0, komi],
    seen = new Set<number>();
  b.forEach((v, i) => {
    if (v) {
      score[v - 1]++;
      return;
    }
    if (seen.has(i)) return;
    const region: number[] = [],
      boundary = new Set<number>(),
      pending = [i];
    while (pending.length) {
      const p = pending.pop()!;
      if (seen.has(p)) continue;
      seen.add(p);
      region.push(p);
      for (const q of neighbours(p, s.size))
        if (b[q]) boundary.add(b[q]);
        else if (!seen.has(q)) pending.push(q);
    }
    if (boundary.size === 1) score[[...boundary][0] - 1] += region.length;
  });
  return { black: score[0], white: score[1] };
}
/** Lightweight one-ply teaching opponent: capture, rescue atari, avoid own eyes. */
export function chooseGoMove(s: GoState): number | null {
  let best = -Infinity,
    move: number | null = null;
  for (let i = 0; i < s.board.length; i++) {
    if (s.board[i]) continue;
    const next = playGo(s, i).state;
    if (!next) continue;
    const near = neighbours(i, s.size),
      friendly = near.filter((p) => s.board[p] === s.turn);
    if (
      friendly.length === near.length &&
      next.captures[s.turn - 1] === s.captures[s.turn - 1]
    )
      continue;
    const own = group(next.board, i, s.size),
      capture = next.captures[s.turn - 1] - s.captures[s.turn - 1];
    const rescue = friendly.some(
      (p) => group(s.board, p, s.size).liberties.size === 1,
    )
      ? 12
      : 0;
    const edge = Math.min(
      i % s.size,
      Math.floor(i / s.size),
      s.size - 1 - (i % s.size),
      s.size - 1 - Math.floor(i / s.size),
    );
    const value =
      capture * 20 +
      rescue +
      (own.liberties.size === 1 ? -18 : Math.min(own.liberties.size, 4)) +
      (edge === 2 ? 2 : edge === 0 ? -2 : 1) +
      ((i * 17 + s.history.length * 13) % 19) / 20;
    if (value > best) {
      best = value;
      move = i;
    }
  }
  if (s.passes === 1 && best < 10) return null;
  return move;
}
