import type { TutorialStep } from "../tutorials";
export const ruleDemos: Record<string, TutorialStep[]> = {
  chess: [
    {
      id: "en-passant-demo",
      title: { zh: "吃过路兵：只有一次机会", en: "En passant: now or never" },
      body: {
        zh: [
          "黑方 d7→d5，一次走两格，停在白兵 e5 旁边。白方马上走 e5→d6，拿掉 d5 的黑兵。注意白兵落到的 d6 原本是空格。",
          "如果白方这一步走了别的棋，以后就不能再吃这个兵了。另外，就算形式上可以吃过路兵，只要吃完会让自己的王被攻击，也不能走。",
        ],
        en: [
          "Black plays d7–d5, two squares, landing beside the white pawn on e5. White immediately plays e5–d6 and removes the black pawn on d5. Note that d6, where the white pawn lands, was empty.",
          "If White plays anything else instead, the chance is gone for good. And even when the pattern fits, en passant is illegal if it would leave your own king under attack.",
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
          "白兵 e7→e8，升变成后。升变就在这一步里完成，新的后马上就能按后的走法行动。不需要之前先丢过一个后。",
          "可以选后、车、象或马，但不能选王，也不能继续当兵。实战棋盘会弹出选项让你挑。少数局面里选马能将军，或者避免逼和。",
        ],
        en: [
          "White plays e7–e8 and promotes to a queen. Promotion happens as part of that move, and the new queen can move like a queen right away. You do not need to have lost your queen first.",
          "You may choose a queen, rook, bishop or knight — never a king, and the pawn cannot stay a pawn. The play board shows the choices. Occasionally a knight is better because it gives check or avoids stalemate.",
        ],
      },
      position: { fen: "7k/4P3/8/8/8/8/8/K7 w - - 0 1", moves: ["e7e8q"] },
    },
  ],
  xiangqi: [
    {
      id: "blocked-horse",
      title: {
        zh: "蹩马腿：先挪开挡路的棋子",
        en: "A hobbled horse: clear its leg first",
      },
      body: {
        zh: [
          "红马在 b1，想跳到 a3 或 c3，都要先经过 b2 这条“马腿”。现在 b2 上有一个红兵，所以这两个方向都跳不了。",
          "演示：先把 b2 的兵推到 b3，黑将走到 f10，然后马 b1→c3。兵虽然还在旁边，但 b3 不在这一步的马腿上，挡不住。",
        ],
        en: [
          "The red horse on b1 wants to reach a3 or c3. Both routes pass its \"leg\" on b2, and a red soldier stands there, so neither jump is possible yet.",
          "Demo: push the soldier b2–b3, Black moves the general to f10, then the horse jumps b1–c3. The soldier is still nearby, but b3 is not on this move's leg, so it does not block.",
        ],
      },
      position: {
        fen: "4k4/9/9/9/4p4/9/9/9/1P7/1N2K4 w - - 0 1",
        moves: ["b2b3", "e10f10", "b1c3"],
      },
    },
    {
      id: "blocked-elephant",
      title: { zh: "塞象眼：“田”字中间必须是空的", en: "A blocked elephant's eye" },
      body: {
        zh: [
          "红相在 c1，想走到 e3，必须经过“田”字中心 d2。现在 d2 上有红车，塞住了象眼，所以相走不过去。",
          "演示：车 d2→d3，黑将 e10→f10，最后相 c1→e3。这时象眼和落点都空了。车到了 d3，不在这条斜线上，不影响相。",
        ],
        en: [
          "The red elephant on c1 wants to reach e3, which requires the midpoint d2 to be empty. The red chariot on d2 blocks the elephant's eye, so the move is impossible.",
          "Demo: chariot d2–d3, Black general e10–f10, then elephant c1–e3. Now both the midpoint and the destination are clear. The chariot on d3 is not on this diagonal.",
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
        zh: "炮吃子：中间恰好隔一枚棋子",
        en: "Cannon capture: exactly one screen",
      },
      body: {
        zh: [
          "红炮在 e3，黑卒在 e7，它们之间只有 e4 一枚红兵。这枚兵就是“炮架”，炮可以跳过它吃掉 e7 的黑卒。",
          "中间一枚棋子都没有，或者有两枚以上，都不能这样吃。炮不吃子时，像车一样走，不能跳过任何棋子。",
        ],
        en: [
          "The red cannon is on e3 and a black soldier on e7. Exactly one piece stands between them: the red soldier on e4. That soldier is the screen, so the cannon may jump over it and capture e7.",
          "With no piece in between, or with two or more, the capture is not allowed. When not capturing, a cannon moves like a chariot and cannot jump over anything.",
        ],
      },
      position: {
        fen: "3k5/9/9/4p4/9/9/4P4/4C4/9/4K4 w - - 0 1",
        moves: ["e3e7"],
      },
    },
  ],
};
