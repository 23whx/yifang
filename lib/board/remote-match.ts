export type MatchState = { round: number; resigned: 0 | 1 | null; rematch: [boolean, boolean] };
export type MatchAction = 'resign' | 'rematch';
export const newMatch = (round = 1): MatchState => ({ round, resigned: null, rematch: [false, false] });
export function validMatch(value: unknown): value is MatchState {
  if (!value || typeof value !== 'object') return false;
  const m = value as MatchState;
  return Number.isSafeInteger(m.round) && m.round > 0 && (m.resigned === null || m.resigned === 0 || m.resigned === 1) && Array.isArray(m.rematch) && m.rematch.length === 2 && m.rematch.every(v=>typeof v==='boolean');
}
/** Only the host serializes actions; neither player can restart unilaterally. */
export function changeMatch(state: MatchState, actor: 0 | 1, action: MatchAction, ended: boolean): MatchState {
  if (action === 'resign') return ended || state.resigned !== null ? state : { ...state, resigned: actor };
  if (!ended && state.resigned === null) return state;
  const rematch: [boolean, boolean] = [...state.rematch];
  rematch[actor] = true;
  return rematch.every(Boolean) ? newMatch(state.round + 1) : { ...state, rematch };
}
export function roomCode(value: string, game: string): string {
  let candidate = value.trim();
  if (candidate.length > 2048) return '';
  if (/^https?:\/\//i.test(candidate)) {
    try { candidate = new URL(candidate).searchParams.get('room') ?? ''; } catch { return ''; }
  }
  return new RegExp(`^yf-${game}-[a-f0-9]{12}$`).test(candidate) ? candidate : '';
}
