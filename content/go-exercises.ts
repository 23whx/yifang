import { newGo } from "../lib/go/rules";
export const goLetters = "ABCDEFGHJKLMNOPQRST";
export const pointAt = (c: string, n = 9) =>
  (n - Number(c.slice(1))) * n + goLetters.indexOf(c[0]);
export const pointName = (p: number, n = 9) =>
  `${goLetters[p % n]}${n - Math.floor(p / n)}`;
export interface GoExercise {
  id: string;
  category: "liberties" | "capture" | "suicide";
  title: [string, string];
  black: string[];
  white: string[];
  target: string;
  expected: number | "suicide";
  explanation: [string, string];
}
export const goExercises: GoExercise[] = [
  {
    id: "corner-lib",
    category: "liberties",
    title: ["角上两口气", "Corner: two liberties"],
    black: ["A9"],
    white: [],
    target: "A9",
    expected: 2,
    explanation: [
      "只有 B9、A8 两个横竖相邻空点。棋盘外不算，斜角 B8 也不算。",
      "Only B9 and A8 count. Outside the board and diagonal B8 do not.",
    ],
  },
  {
    id: "edge-lib",
    category: "liberties",
    title: ["边上三口气", "Edge: three liberties"],
    black: ["E9"],
    white: [],
    target: "E9",
    expected: 3,
    explanation: [
      "E9 的气是 D9、F9、E8。沿边线左右的空点也算气，不只有向内的一口。",
      "E9 has D9, F9 and E8. Empty points along the edge also count.",
    ],
  },
  {
    id: "center-lib",
    category: "liberties",
    title: ["中央四口气", "Centre: four liberties"],
    black: ["E5"],
    white: [],
    target: "E5",
    expected: 4,
    explanation: [
      "依次检查上 E6、下 E4、左 D5、右 F5，共四口。四个斜角均不计。",
      "Check above E6, below E4, left D5 and right F5. Diagonals do not count.",
    ],
  },
  {
    id: "joined-lib",
    category: "liberties",
    title: ["相连两子共享六口气", "Connected pair: six liberties"],
    black: ["E5", "F5"],
    white: [],
    target: "E5",
    expected: 6,
    explanation: [
      "两子组成一块。D5、E6、E4、F6、F4、G5 共六个空点；两子占据的位置不是气，不能按四加四算。",
      "The string has D5, E6, E4, F6, F4 and G5. Occupied points are not liberties: do not add four plus four.",
    ],
  },
  {
    id: "shared-lib",
    category: "liberties",
    title: ["弯三子：共享气不重复计数", "Bent three: shared points count once"],
    black: ["E5", "F5", "E6"],
    white: [],
    target: "E5",
    expected: 7,
    explanation: [
      "F6 同时邻接 F5 和 E6，仍只算一口。合计七个不同空点；数的是空点，不是接触边数。",
      "F6 touches both F5 and E6 but counts once. Count seven distinct empty points, not touching edges.",
    ],
  },
  {
    id: "diagonal-lib",
    category: "liberties",
    title: ["斜邻不相连，敌子会占气", "Diagonals are separate"],
    black: ["E5", "F6"],
    white: ["D5"],
    target: "E5",
    expected: 3,
    explanation: [
      "F6 只与 E5 斜邻，不能共享气。D5 被白占住，E5 剩 E6、F5、E4 三口气。",
      "F6 is diagonal and cannot share liberties. White occupies D5, leaving E6, F5 and E4 for E5.",
    ],
  },
  {
    id: "corner-capture",
    category: "capture",
    title: ["角上提一子", "Corner capture"],
    black: ["B9"],
    white: ["A9"],
    target: "A8",
    expected: 1,
    explanation: [
      "白 A9 只剩 A8 一口气。黑占 A8 后提走 A9；腾出的 A9 就成为黑子的气。",
      "A8 is White A9's last liberty. Fill it, remove A9, and the empty A9 becomes a Black liberty.",
    ],
  },
  {
    id: "edge-capture",
    category: "capture",
    title: ["边上提一子", "Edge capture"],
    black: ["D9", "F9"],
    white: ["E9"],
    target: "E8",
    expected: 1,
    explanation: [
      "左右已被黑封住，边界外不是出路。补 E8 后三口气全部被占，提走 E9。",
      "Black blocks both sides. Filling E8 removes the final liberty and captures E9.",
    ],
  },
  {
    id: "center-capture",
    category: "capture",
    title: ["中央提一子", "Central capture"],
    black: ["D5", "E6", "F5"],
    white: ["E5"],
    target: "E4",
    expected: 1,
    explanation: [
      "上、左、右已被占，最后一口气在下方 E4。不需要把四个斜角也围起来。",
      "E4 is the last liberty below E5. Filling the diagonals is unnecessary.",
    ],
  },
  {
    id: "group-capture",
    category: "capture",
    title: ["一次提掉相连两子", "Capture a whole string"],
    black: ["D5", "E6", "E4", "F6", "G5"],
    white: ["E5", "F5"],
    target: "F4",
    expected: 2,
    explanation: [
      "E5、F5 相连，整块只剩 F4。一手堵住后两枚白子同时移走，不能只提最近的一枚。",
      "E5 and F5 share only F4. Filling it removes both stones, not just the nearest one.",
    ],
  },
  {
    id: "corner-suicide",
    category: "suicide",
    title: ["角上禁入", "Corner suicide"],
    black: [],
    white: ["B9", "A8"],
    target: "A9",
    expected: "suicide",
    explanation: [
      "落黑后没有气，旁边两块白棋各有外气、不会被提走。拒绝落子，棋盘与轮次不变。",
      "Black would have no liberties, while both White strings have outside liberties. Reject the move without changing the turn.",
    ],
  },
  {
    id: "edge-suicide",
    category: "suicide",
    title: ["边上禁入", "Edge suicide"],
    black: [],
    white: ["D9", "F9", "E8"],
    target: "E9",
    expected: "suicide",
    explanation: [
      "三个方向都是白棋，而且白棋各有外气。这里虽是空交叉点，也不能合法落黑。",
      "All three neighbours are White with outside liberties. An empty intersection is not automatically legal.",
    ],
  },
  {
    id: "center-suicide",
    category: "suicide",
    title: ["中央禁入", "Central suicide"],
    black: [],
    white: ["D5", "E6", "F5", "E4"],
    target: "E5",
    expected: "suicide",
    explanation: [
      "四周皆白，黑落下后无气，也提不掉敌棋。斜角空点不能救它。",
      "All four neighbours are White. Black captures nothing and has no liberties; diagonal empty points cannot save it.",
    ],
  },
  {
    id: "capture-exception",
    category: "suicide",
    title: ["反例：先提子就不是自杀", "Exception: capture creates a liberty"],
    black: ["D6", "F6", "E7"],
    white: ["D5", "E6", "F5", "E4"],
    target: "E5",
    expected: 1,
    explanation: [
      "白 E6 的最后一口正是 E5。黑下 E5 后先提走 E6，自己就得到 E6 这口气，因此合法。顺序是先提敌棋，再检查己棋。",
      "E5 is White E6's last liberty. Black captures E6 first, gaining that point as a liberty. Capture enemy stones before checking your own string.",
    ],
  },
];
export function setupGoExercise(e: GoExercise) {
  const s = newGo(9);
  e.black.forEach((c) => {
    s.board[pointAt(c)] = 1;
  });
  e.white.forEach((c) => {
    s.board[pointAt(c)] = 2;
  });
  s.history = [s.board.join("")];
  return s;
}
