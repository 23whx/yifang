import { actTable, legalActions, newTable, type Action, type Seat, type Table } from './holdem';

/** Host-only state. Never serialize this object onto the data connection. */
export type PokerSession = {
  hand: number;
  revision: number;
  table: Table;
  next: [boolean, boolean];
};

/** Explicit allowlist: future private Table fields cannot accidentally leak. */
export type PokerView = {
  hand: number;
  revision: number;
  seat: Seat;
  ownCards: number[];
  opponentCards: number[];
  community: number[];
  stacks: [number, number];
  start: [number, number];
  committed: [number, number];
  streetBet: [number, number];
  button: Seat;
  actor: Seat;
  street: number;
  over: boolean;
  winner: Table['winner'];
  showdown: boolean;
  awarded: [number, number];
  next: [boolean, boolean];
  legal: ReturnType<typeof legalActions> | null;
  log: Table['log'];
};

export type PokerRequest = {
  hand: number;
  revision: number;
  action: Action | { kind: 'next' };
};

export function newPokerSession(deck?: number[]): PokerSession {
  return { hand: 1, revision: 0, table: newTable([200, 200], 0, deck), next: [false, false] };
}

export function validPokerRequest(value: unknown): value is PokerRequest {
  if (!value || typeof value !== 'object') return false;
  const r = value as PokerRequest;
  if (!Number.isSafeInteger(r.hand) || r.hand < 1 || !Number.isSafeInteger(r.revision) || r.revision < 0) return false;
  if (!r.action || typeof r.action !== 'object') return false;
  switch (r.action.kind) {
    case 'fold': case 'check': case 'call': case 'next': return true;
    case 'raise': return Number.isSafeInteger(r.action.to) && r.action.to > 0;
    default: return false;
  }
}

/** Seat comes from the authenticated connection role, never from a payload. */
export function applyPokerRequest(state: PokerSession, seat: Seat, request: unknown, nextDeck?: number[]): PokerSession {
  if (seat !== 0 && seat !== 1) throw new Error('Invalid seat');
  if (!validPokerRequest(request)) throw new Error('Invalid poker request');
  if (request.hand !== state.hand || request.revision !== state.revision) throw new Error('Stale poker request');
  if (request.action.kind === 'next') {
    if (!state.table.over) throw new Error('Finish this hand first');
    if (state.table.stacks.some(n => n <= 0)) throw new Error('Match ended: a player has no chips');
    if (state.next[seat]) return state;
    const next: [boolean, boolean] = [...state.next];
    next[seat] = true;
    if (next.every(Boolean)) {
      return {
        hand: state.hand + 1, revision: state.revision + 1,
        table: newTable([...state.table.stacks], state.table.button === 0 ? 1 : 0, nextDeck),
        next: [false, false],
      };
    }
    return { ...state, next, revision: state.revision + 1 };
  }
  if (state.table.actor !== seat) throw new Error('Wait for your turn');
  return { ...state, table: actTable(state.table, request.action), revision: state.revision + 1 };
}

export function pokerView(state: PokerSession, seat: Seat): PokerView {
  if (seat !== 0 && seat !== 1) throw new Error('Invalid seat');
  const t = state.table;
  // Engine logs are written from seat 0's viewpoint; use stable seat names online.
  const log = t.log.map(line => ({
    zh: line.zh.replace(/对手/g, '玩家二').replace(/你/g, '玩家一'),
    en: line.en.replace(/opponent/gi, 'Player 2').replace(/\byou\b/gi, 'Player 1'),
  }));
  return {
    hand: state.hand, revision: state.revision, seat,
    ownCards: [...t.hole[seat]],
    opponentCards: t.over && t.showdown ? [...t.hole[seat === 0 ? 1 : 0]] : [],
    community: [...t.community], stacks: [...t.stacks], start: [...t.start],
    committed: [...t.committed], streetBet: [...t.streetBet], button: t.button,
    actor: t.actor, street: t.street, over: t.over, winner: t.winner,
    showdown: t.showdown, awarded: [...t.awarded], next: [...state.next],
    legal: !t.over && t.actor === seat ? legalActions(t) : null, log,
  };
}

/** Defensive boundary for incoming snapshots, not proof that a host is honest. */
export function validPokerView(value: unknown): value is PokerView {
  if (!value || typeof value !== 'object') return false;
  const v = value as PokerView;
  const integer = (n: unknown) => Number.isSafeInteger(n) && (n as number) >= 0;
  const pair = (a: unknown) => Array.isArray(a) && a.length === 2 && a.every(integer);
  const cards = (a: unknown) => Array.isArray(a) && a.every(n => integer(n) && n < 52);
  if (!integer(v.hand) || v.hand < 1 || !integer(v.revision) || (v.seat !== 0 && v.seat !== 1) ||
    (v.button !== 0 && v.button !== 1) || (v.actor !== 0 && v.actor !== 1) || !integer(v.street) || v.street > 3 ||
    typeof v.over !== 'boolean' || typeof v.showdown !== 'boolean' || ![null, 0, 1, 'tie'].includes(v.winner)) return false;
  if (![v.stacks, v.start, v.committed, v.streetBet, v.awarded].every(pair) ||
    !Array.isArray(v.next) || v.next.length !== 2 || !v.next.every(n => typeof n === 'boolean')) return false;
  if (![v.ownCards, v.opponentCards, v.community].every(cards) || v.ownCards.length !== 2 ||
    v.community.length !== [0, 3, 4, 5][v.street] || v.opponentCards.length !== (v.over && v.showdown ? 2 : 0)) return false;
  const shown = [...v.ownCards, ...v.opponentCards, ...v.community];
  if (new Set(shown).size !== shown.length || (v.showdown && (!v.over || v.street !== 3)) || (v.over !== (v.winner !== null))) return false;
  if (!Array.isArray(v.log) || v.log.length > 500 || !v.log.every(l => l && typeof l.zh === 'string' && typeof l.en === 'string' && l.zh.length < 1000 && l.en.length < 1000)) return false;
  if (v.over || v.actor !== v.seat) return v.legal === null;
  const a = v.legal;
  return !!a && [a.call, a.minTo, a.maxTo].every(integer) && typeof a.canCheck === 'boolean' && typeof a.canRaise === 'boolean';
}
