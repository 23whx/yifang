import type { TutorialStep } from "../tutorials";
export const ruleDemos: Record<string, TutorialStep[]> = {
  chess: [
    {
      id: "en-passant-demo",
      title: { zh: "吃过路兵：只有这一次机会", en: "En passant: now or never" },
      body: {
        zh: [
          "黑方 d7–d5 一次前进两格，白兵 e5 可以立即走到 d6，移除 d5 的黑兵。这个吃子落点原本是空的。",
          "如果白方改走其它棋子，之后就不能再补吃过路兵。即使满足形式条件，若导致自己的王受攻击仍然非法。",
        ],
        en: [
          "Black plays d7–d5. White may immediately move e5–d6, removing the black pawn on d5. The destination was empty.",
          "Playing a different move forfeits the chance. Even when the pattern fits, en passant is illegal if it exposes your own king.",
        ],
      },
      position: {
        fen: "4k3/3p4/8/4P3/8/8/8/4K3 b - - 0 1",
        moves: ["d7d5", "e5d6"],
      },
    },
    {
      id: "promotion-demo",
      title: { zh: "升变：兵抵达最后一排", en: "Promotion on the last rank" },
      body: {
        zh: [
          "白兵 e7–e8 升变为后。升变是这一步的一部分，立即获得新棋子的走法；不需要先前有后被吃。",
          "可选择后、车、象或马，不能升成王，也不能留作兵。实战棋盘会给出升变选项；某些局面升马可以将军或避免逼和。",
        ],
        en: [
          "White plays e7–e8 and promotes to a queen, immediately gaining its moves. You do not need to have lost a queen first.",
          "Choose queen, rook, bishop or knight, never king or pawn. The board offers promotion choices; underpromotion can give check or avoid stalemate.",
        ],
      },
      position: { fen: "7k/4P3/8/8/8/8/8/K7 w - - 0 1", moves: ["e7e8q"] },
    },
  ],
  xiangqi: [
    {
      id: "blocked-horse",
      title: {
        zh: "蹩马腿：先移走阻挡，再走马",
        en: "Clear the horse’s blocked leg",
      },
      body: {
        zh: [
          "红马 b1 想去 a3 或 c3，必须先经过 b2 的马腿。现在 b2 有红兵，因此这两个方向均被阻挡，不能直接走。",
          "演示先把 b2 兵推到 b3，黑将移到 f10，再走 b1–c3。兵 b3 虽然还在附近，却不在本次马腿上，不妨碍这步。",
        ],
        en: [
          "To reach a3 or c3 from b1, the horse needs b2 clear. A red soldier on b2 currently blocks both moves.",
          "Push b2–b3, let Black move the general to f10, then play b1–c3. The nearby soldier on b3 is not on this move’s leg and does not block it.",
        ],
      },
      position: {
        fen: "4k4/9/9/9/4p4/9/9/9/1P7/1N2K4 w - - 0 1",
        moves: ["b2b3", "e10f10", "b1c3"],
      },
    },
    {
      id: "blocked-elephant",
      title: { zh: "塞象眼：田字中点不能有子", en: "Clear the elephant’s eye" },
      body: {
        zh: [
          "红相 c1 去 e3，必须经过 d2。红车正在 d2 塞住象眼，所以相不能走到 e3。",
          "先走车 d2–d3，黑将 e10–f10，最后红相 c1–e3。这时象眼和目标都空了。d3 的车并不在这步的对角线上。",
        ],
        en: [
          "The elephant on c1 needs the midpoint d2 clear to reach e3. The chariot on d2 blocks its eye.",
          "Move the chariot d2–d3, Black e10–f10, then the elephant c1–e3. Both midpoint and destination are clear. The chariot on d3 is not on this diagonal.",
        ],
      },
      position: {
        fen: "4k4/9/9/9/4p4/9/9/9/3R5/2B1K4 w - - 0 1",
        moves: ["d2d3", "e10f10", "c1e3"],
      },
    },
    {
      id: "cannon-capture",
      title: {
        zh: "炮隔子吃：恰好一个炮架",
        en: "Cannon capture: exactly one screen",
      },
      body: {
        zh: [
          "红炮 e3 与黑卒 e7 之间只有红兵 e4。炮可以跳过这个炮架吃掉 e7 黑卒。",
          "如果没有炮架，或中间有两个以上棋子，都不能这样吃。炮不吃子时不可跳过任何棋子。",
        ],
        en: [
          "There is exactly one piece, the red soldier on e4, between the cannon on e3 and black soldier on e7. The cannon may jump over that screen and capture e7.",
          "With zero or two intervening pieces the capture is illegal. A non-capturing cannon move cannot jump over anything.",
        ],
      },
      position: {
        fen: "3k5/9/9/4p4/9/9/4P4/4C4/9/4K4 w - - 0 1",
        moves: ["e3e7"],
      },
    },
  ],
};
