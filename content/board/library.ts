import type { GameSlug } from "../games";
import type { GlossaryEntry } from "../cube/glossary";
import type { HistoryEntry } from "../cube/history";
const l = (zh: string, en: string) => ({ zh, en });
const term = (
  id: string,
  zh: string,
  en: string,
  z: string,
  e: string,
): GlossaryEntry => ({ id, term: l(zh, en), def: l(z, e) });
export const boardGlossaries: Partial<Record<GameSlug, GlossaryEntry[]>> = {
  chess: [
    term(
      "check",
      "将军",
      "Check",
      "王受到攻击，行棋方必须立即解除。",
      "An attacked king; the player must remove the threat immediately.",
    ),
    term(
      "stalemate",
      "逼和",
      "Stalemate",
      "无合法着法但王未受攻击，判和。",
      "No legal move while the king is not attacked: a draw.",
    ),
    term(
      "fork",
      "捉双",
      "Fork",
      "一枚棋子同时攻击两个以上目标。",
      "One piece attacks two or more targets at once.",
    ),
    term(
      "pin",
      "牵制",
      "Pin",
      "一子挡住后方重要目标；若后方是王，不能走开使王被将。",
      "A piece shields a valuable target. If it shields the king, it cannot move to expose check.",
    ),
  ],
  xiangqi: [
    term(
      "leg",
      "蹩马腿",
      "Blocked horse leg",
      "马第一直步上的邻点被任意子占据，阻止该方向两条马步。",
      "A piece on the horse’s first orthogonal step blocks both destinations in that direction.",
    ),
    term(
      "eye",
      "塞象眼",
      "Blocked elephant eye",
      "相象斜行两格，中点被占据时不能通过。",
      "An elephant cannot cross an occupied midpoint of its two-step diagonal.",
    ),
    term(
      "screen",
      "炮架",
      "Cannon screen",
      "炮吃子时与目标之间必须恰有一枚棋子，敌我均可。",
      "Exactly one intervening piece of either side is required for a cannon capture.",
    ),
    term(
      "stalemate",
      "困毙",
      "Stalemate loss",
      "轮到走棋却无合法着法，在象棋中判负。",
      "Having no legal move loses in xiangqi.",
    ),
  ],
  shogi: [
    term(
      "drop",
      "打入",
      "Drop",
      "用一手将持驹放到空格，作为己方未成棋子。",
      "Use a turn to place an unpromoted piece from hand on an empty square.",
    ),
    term(
      "nifu",
      "二步",
      "Nifu",
      "不得将步打入已有己方未成步的同一列。",
      "A pawn drop is forbidden on a file with your own unpromoted pawn.",
    ),
    term(
      "tsume",
      "诘",
      "Tsume",
      "王受攻击而无法解除，即将死。",
      "The king is attacked and has no legal escape: checkmate.",
    ),
    term(
      "sennichite",
      "千日手",
      "Repetition",
      "同局面同方行棋四次通常重下，连续将军方造成重复则判负。",
      "Fourfold repetition normally causes a replay; perpetual checking that causes repetition loses.",
    ),
  ],
  go: [
    term(
      "liberty",
      "气",
      "Liberty",
      "与棋块横竖相邻的空交点，斜邻不计。",
      "An empty intersection orthogonally adjacent to a group.",
    ),
    term(
      "atari",
      "打吃",
      "Atari",
      "一整块棋只剩一口气。",
      "A group has only one liberty remaining.",
    ),
    term(
      "ko",
      "劫",
      "Ko",
      "限制重复棋盘局面的规则，具体禁止范围随规则而异。",
      "A restriction on repeating board positions; its scope depends on the ruleset.",
    ),
    term(
      "seki",
      "双活",
      "Seki",
      "双方互相牵制，任一方先填公气都会受损，因而共存的局面。",
      "Mutual life where filling shared liberties would harm the initiating side.",
    ),
  ],
};
export const boardHistories: Partial<Record<GameSlug, HistoryEntry[]>> = {
  chess: [
    {
      year: "~600",
      title: l("从印度出发", "Early roots in India"),
      body: l(
        "恰图兰卡常被视为国际象棋的早期源流，随后经波斯及伊斯兰世界传播。精确的发明时间与地点仍有讨论。",
        "Chaturanga is commonly treated as an early ancestor, spreading through Persia and the Islamic world. The exact invention date and location remain debated.",
      ),
    },
    {
      year: "1851",
      title: l(
        "不朽之局：主动权与王的安全",
        "The Immortal Game: initiative and king safety",
      ),
      body: l(
        "安德森与基泽里茨基的著名对局以弃子进攻闻名。赏析时先观察出子速度与王周围防线，再判断弃子能否形成连续威胁。不要把大量弃子本身当作好棋的标准。",
        "Anderssen’s celebrated game with Kieseritzky is known for its sacrifices. Study development and the king’s defences before judging whether sacrifices create forcing threats; giving material away is not a virtue by itself.",
      ),
    },
  ],
  xiangqi: [
    {
      year: "宋",
      title: l("接近现代的棋盘与子力", "Toward the modern form"),
      body: l(
        "中国象棋在长期演变后，宋代出现接近今天的形制。起源传说、早期同名游戏与现代规则应分开看待。",
        "After a long evolution, Song-era xiangqi approached the modern form. Origin legends, earlier games with the same name and modern rules should be distinguished.",
      ),
    },
    {
      year: "布局",
      title: l("中炮与屏风马：攻守的对话", "Central Cannon and Screen Horses"),
      body: l(
        "中炮集中威胁中路，屏风马用双马保护中央。入门教程附有可播放的开局序列，观察出子顺序而非死背谱名。",
        "The central cannon pressures the middle while screen horses defend it. The introductory tutorial includes a playable opening sequence: watch development rather than memorising a name.",
      ),
    },
  ],
  shogi: [
    {
      year: "平安",
      title: l("日本将棋的早期记录", "Early Japanese records"),
      body: l(
        "日本的早期将棋与今天的本将棋并不完全相同，历史上还出现过多种棋盘规模。",
        "Early Japanese shogi was not identical to the modern game; several board sizes existed historically.",
      ),
    },
    {
      year: "持驹",
      title: l(
        "棋子换阵营，终盘变得不同",
        "Changing sides changes the endgame",
      ),
      body: l(
        "持驹规则让吃子不再只是减少棋盘子力。欣赏诘将棋时，把对手的逃路与手中可以打入的棋子一起考虑；教程提供一手金打入将死示例。",
        "Drops mean captures do not simply drain material. In mating problems, consider escape squares together with pieces in hand. The tutorial demonstrates a one-move gold-drop mate.",
      ),
    },
  ],
  go: [
    {
      year: "古代",
      title: l("中国起源，东亚传播", "Chinese origins, East Asian traditions"),
      body: l(
        "围棋起源于古代中国，后来在朝鲜半岛与日本发展出深厚传统。尧造围棋是传说，不应当作确切历史。",
        "Go originated in ancient China and later developed strong Korean and Japanese traditions. The Emperor Yao origin story is a legend rather than established history.",
      ),
    },
    {
      year: "2016",
      title: l("李世石与 AlphaGo", "Lee Sedol and AlphaGo"),
      body: l(
        "李世石与 AlphaGo 五番棋以 1 比 4 结束。欣赏这组棋局时，可对照局部直觉与全局价值；第四局的人类胜利尤其值得研究。",
        "The five-game match ended 1–4. Study the tension between local intuition and whole-board value, especially the human victory in game four.",
      ),
    },
  ],
};
export interface KnowledgePuzzle {
  id: string;
  question: { zh: string; en: string };
  choices: { zh: string[]; en: string[] };
  answer: number;
  explanation: { zh: string; en: string };
}
const q = (
  id: string,
  z: string,
  e: string,
  zc: string[],
  ec: string[],
  answer: number,
  za: string,
  ea: string,
): KnowledgePuzzle => ({
  id,
  question: l(z, e),
  choices: { zh: zc, en: ec },
  answer,
  explanation: l(za, ea),
});
export const boardPuzzles: Partial<Record<GameSlug, KnowledgePuzzle[]>> = {
  chess: [
    q(
      "stalemate",
      "黑王没被将军，但黑方无任何合法着法。结果？",
      "Black is not in check but has no legal move. Result?",
      ["白胜", "和棋", "黑方停一手"],
      ["White wins", "Draw", "Black passes"],
      1,
      "这是逼和；国际象棋不能停一手。",
      "This is stalemate. Passing is not allowed.",
    ),
    q(
      "pawn",
      "白兵在 e5，黑兵刚从 d7 到 d5。白兵可以吃到哪？",
      "White pawn e5; Black just played d7–d5. Where may White capture?",
      ["d5", "d6", "e6"],
      ["d5", "d6", "e6"],
      1,
      "吃过路兵落在 d6 并移除 d5 黑兵，且不能暴露白王。",
      "En passant lands on d6 and removes d5, provided White’s king remains safe.",
    ),
  ],
  xiangqi: [
    q(
      "horse",
      "b1 马想走 c3，需检查哪个马腿？",
      "A horse moves b1–c3. Which leg must be clear?",
      ["b2", "c2", "c1"],
      ["b2", "c2", "c1"],
      0,
      "先直一格到 b2，再斜向 c3。",
      "The first orthogonal step is b2, followed by the outward diagonal.",
    ),
    q(
      "cannon",
      "炮与目标之间有两枚棋子，可以吃吗？",
      "Can a cannon capture across two intervening pieces?",
      ["可以", "不可以", "只要两枚都是己子就可以"],
      ["Yes", "No", "Only if both are friendly"],
      1,
      "吃子必须恰好一个炮架，颜色不限。",
      "A cannon capture needs exactly one screen of either colour.",
    ),
  ],
  shogi: [
    q(
      "drop",
      "可以把未成步直接打到敌阵最后一排吗？",
      "Can an unpromoted pawn be dropped on the last rank?",
      ["可以并立即成金", "不可以", "可以但下手必须成"],
      ["Yes, promoting immediately", "No", "Yes, promoting next turn"],
      1,
      "打入不成，且不能打到以后无合法走法的位置。",
      "Drops do not promote and cannot leave a piece with no future movement.",
    ),
    q(
      "silver",
      "银将可以向正后方退一格吗？",
      "Can a silver move one square straight backward?",
      ["可以", "不可以", "持驹打入后可以"],
      ["Yes", "No", "Only after a drop"],
      1,
      "银能后斜退，不能正退；金可以正退。",
      "Silvers retreat diagonally, not straight back; golds can retreat straight back.",
    ),
  ],
  go: [
    q(
      "liberty",
      "一个在角上的孤立棋子，四周都空，有几口气？",
      "How many liberties does an isolated corner stone have?",
      ["2", "3", "4"],
      ["2", "3", "4"],
      0,
      "只数棋盘内横竖相邻的空点，角上只有两个。",
      "Count only on-board orthogonal empty neighbours: two in a corner.",
    ),
    q(
      "capture",
      "落子后己方暂时无气，但能提走邻接敌棋，合法吗？",
      "A move initially has no liberty but captures adjacent enemy stones. Legal?",
      ["总不合法", "提子后有气且不重复旧局面就合法", "必须先停一手"],
      [
        "Always illegal",
        "Legal if capture gives liberties and no repetition",
        "Must pass first",
      ],
      1,
      "先提掉无气敌棋，再判断己棋是否有气。",
      "Remove captured opponents first, then test the friendly group’s liberties.",
    ),
  ],
};
