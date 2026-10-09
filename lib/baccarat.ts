export type Card = { rank: number; suit: string; id: string };
export const value = (card: Card) => card.rank >= 10 ? 0 : card.rank;
export const points = (cards: Card[]) => cards.reduce((sum, card) => sum + value(card), 0) % 10;
export function bankerDraw(total: number, third?: number): boolean {
  if (third === undefined) return total <= 5;
  if (total <= 2) return true;
  if (total === 3) return third !== 8;
  if (total === 4) return third >= 2 && third <= 7;
  if (total === 5) return third >= 4 && third <= 7;
  return total === 6 && (third === 6 || third === 7);
}
export function shuffledDeck(): Card[] {
  const cards: Card[] = [];
  for (let deck = 0; deck < 8; deck++) for (const suit of ["♠", "♥", "♣", "♦"]) for (let rank = 1; rank <= 13; rank++) {
    cards.push({ rank, suit, id: `${deck}-${suit}-${rank}` });
  }
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
export type Step = { player: Card[]; banker: Card[]; zh: string; en: string };
export function roundSteps(deck: Card[]): Step[] {
  if (deck.length < 6) throw new Error("At least six cards are required");
  const player: Card[] = [], banker: Card[] = [], steps: Step[] = [];
  let cursor = 0;
  const add = (zh: string, en: string) => steps.push({ player: [...player], banker: [...banker], zh, en });
  add("准备发牌：顺序为闲、庄、闲、庄。", "Ready: deal Player, Banker, Player, Banker.");
  for (let i = 0; i < 4; i++) {
    const isPlayer = i % 2 === 0;
    (isPlayer ? player : banker).push(deck[cursor++]);
    add(`第 ${i + 1} 张发给${isPlayer ? "闲" : "庄"}。先完成双方各两张牌，再判断补牌。`, `Card ${i + 1} goes to ${isPlayer ? "Player" : "Banker"}. Complete both initial hands before checking draws.`);
  }
  if (points(player) >= 8 || points(banker) >= 8) {
    add("出现天然牌：初始两张合计 8 或 9 点，双方都不再补牌。", "Natural: an initial two-card hand has 8 or 9 points. Neither hand draws.");
  } else {
    add("双方初始点数都小于 8，没有天然牌。先处理闲，再处理庄。", "Neither initial hand is a natural. Resolve Player first, then Banker.");
    let third: number | undefined;
    if (points(player) <= 5) {
      const before = points(player);
      const card = deck[cursor++]; third = value(card); player.push(card);
      add(`闲原有 ${before} 点（0–5），必须补一张：第三张为 ${third} 点。`, `Player had ${before} points (0–5), so draws. The third card is worth ${third}.`);
    } else add("闲为 6 或 7 点，停牌。庄随后按 0–5 补、6–7 停处理。", "Player has 6 or 7 and stands. Banker now draws on 0–5 and stands on 6–7.");
    const before = points(banker), draw = bankerDraw(before, third);
    if (draw) banker.push(deck[cursor++]);
    add(`庄原有 ${before} 点；${third === undefined ? "闲未补牌" : `闲第三张为 ${third} 点（不是闲的总点数）`}。按补牌表，庄${draw ? "补一张" : "停牌"}。`, `Banker had ${before}; ${third === undefined ? "Player stood" : `Player's third card was worth ${third} (not Player's total)`}. The draw table requires Banker to ${draw ? "draw" : "stand"}.`);
  }
  const p = points(player), b = points(banker);
  add(`结果：闲 ${p} 点，庄 ${b} 点，${p === b ? "和局" : p > b ? "闲胜" : "庄胜"}。只比较最终个位数，不按牌面总和比较。`, `Result: Player ${p}, Banker ${b}. ${p === b ? "Tie" : p > b ? "Player wins" : "Banker wins"}. Compare the final single-digit totals, not the raw sums.`);
  return steps;
}
export const examples = [
  { zh: "天然 8 点", en: "Natural 8", ranks: [4, 2, 4, 3, 8, 6] },
  { zh: "庄 3 点遇第三张 8", en: "Banker 3 / third card 8", ranks: [2, 1, 3, 2, 8, 6] },
  { zh: "庄 6 点遇第三张 7", en: "Banker 6 / third card 7", ranks: [1, 2, 2, 4, 7, 3] },
  { zh: "闲停、庄补", en: "Player stands, Banker draws", ranks: [3, 2, 4, 3, 4, 1] },
  { zh: "同点和局", en: "Equal totals", ranks: [3, 2, 4, 5, 1, 1] },
];
export const exampleDeck = (index: number): Card[] => examples[index].ranks.map((rank, i) => ({ rank, suit: i % 2 ? "♥" : "♠", id: `example-${i}` }));
