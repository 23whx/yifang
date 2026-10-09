import type { Locale } from "@/lib/i18n";

export type GameSlug = "cube" | "chess" | "xiangqi" | "shogi" | "go" | "mahjong" | "holdem" | "baccarat";

interface L {
  zh: string;
  en: string;
}

export interface Game {
  slug: GameSlug;
  name: L;
  /** 招牌上的单字/短词 */
  glyph: L;
  tagline: L;
  intro: { zh: string[]; en: string[] };
  facts: { label: L; value: L }[];
  /** 实战是否已可用 */
  playable: boolean;
}

export const games: Game[] = [
  {
    slug: "cube",
    name: { zh: "魔方", en: "Rubik's Cube" },
    glyph: { zh: "方", en: "Cube" },
    tagline: { zh: "二十六块，四千三百亿亿种状态，一条回家的路。", en: "26 pieces, 43 quintillion states, one way home." },
    intro: {
      zh: [
        "三阶魔方由匈牙利建筑学教授鲁比克·艾尔内于 1974 年发明，最初是为了向学生解释三维空间中的运动。它有 43,252,003,274,489,856,000 种可能状态，任何一种都能在 20 步之内还原——这个数字被称为「上帝之数」。",
        "学魔方不靠记忆力，靠的是理解「一组转动会让哪些块移动、哪些块不动」。层先法把这件事拆成七个小目标，每个目标只需要一两条公式。",
      ],
      en: [
        "The 3x3 cube was invented in 1974 by Hungarian architecture professor Ernő Rubik as a way to explain movement in three dimensions. It has 43,252,003,274,489,856,000 possible states, every one of which can be solved in 20 moves or fewer — a figure known as God's Number.",
        "Learning the cube is not about memory; it is about understanding which pieces a sequence moves and which it leaves alone. The layer-by-layer method breaks that into seven small goals, each needing only one or two algorithms.",
      ],
    },
    facts: [
      { label: { zh: "发明", en: "Invented" }, value: { zh: "1974 · 布达佩斯", en: "1974 · Budapest" } },
      { label: { zh: "状态数", en: "States" }, value: { zh: "4.3 × 10¹⁹", en: "4.3 × 10¹⁹" } },
      { label: { zh: "上帝之数", en: "God's Number" }, value: { zh: "20 步", en: "20 moves" } },
    ],
    playable: true,
  },
  {
    slug: "chess",
    name: { zh: "国际象棋", en: "Chess" },
    glyph: { zh: "棋", en: "Chess" },
    tagline: { zh: "六十四格上的王国战争。", en: "War between kingdoms on sixty-four squares." },
    intro: {
      zh: [
        "国际象棋源自公元 6 世纪印度的「恰图兰卡」，经波斯、阿拉伯传入欧洲，15 世纪末在西班牙定型为今天的规则——后与象获得长程走法，让开局变得凶险。",
        "它是世界上研究最深的棋类：开局理论有成千上万个分支，中局讲究子力协调与弱点，残局则是精确计算的领域。",
      ],
      en: [
        "Chess descends from chaturanga, played in 6th-century India, travelling through Persia and the Arab world into Europe. Its modern rules settled in late 15th-century Spain, when the queen and bishop gained their long-range moves and openings turned sharp.",
        "It is the most deeply studied board game in the world: opening theory branches into thousands of lines, the middlegame is about coordination and weaknesses, and the endgame is a realm of exact calculation.",
      ],
    },
    facts: [
      { label: { zh: "棋盘", en: "Board" }, value: { zh: "8 × 8", en: "8 × 8" } },
      { label: { zh: "每方棋子", en: "Pieces" }, value: { zh: "16", en: "16" } },
      { label: { zh: "记谱", en: "Notation" }, value: { zh: "代数记谱法", en: "Algebraic" } },
    ],
    playable: true,
  },
  {
    slug: "xiangqi",
    name: { zh: "中国象棋", en: "Xiangqi" },
    glyph: { zh: "象", en: "Xiangqi" },
    tagline: { zh: "楚河汉界，九宫之内。", en: "A river between two kingdoms, a palace on each bank." },
    intro: {
      zh: [
        "中国象棋定型于北宋，棋子走在线的交点上而非格内，棋盘中间以「楚河汉界」相隔。将帅困于九宫、象不过河、马蹩腿、炮隔子吃——这些独特规则让它节奏迅捷、杀伤直接。",
        "街头巷尾的残局挂图是中国象棋最有生命力的传统：一张纸、几个子，路人驻足半日。",
      ],
      en: [
        "Xiangqi took its modern form during the Northern Song dynasty. Pieces sit on intersections rather than squares, and a river divides the board. Generals confined to their palace, elephants that cannot cross the river, horses that can be blocked, cannons that capture by jumping — these rules make the game fast and direct.",
        "Its liveliest tradition is the streetside endgame poster: a sheet of paper, a few pieces, and passers-by stopping for half a day.",
      ],
    },
    facts: [
      { label: { zh: "棋盘", en: "Board" }, value: { zh: "9 × 10 线", en: "9 × 10 lines" } },
      { label: { zh: "每方棋子", en: "Pieces" }, value: { zh: "16", en: "16" } },
      { label: { zh: "定型", en: "Codified" }, value: { zh: "北宋", en: "Northern Song" } },
    ],
    playable: true,
  },
  {
    slug: "shogi",
    name: { zh: "日本将棋", en: "Shogi" },
    glyph: { zh: "将", en: "Shogi" },
    tagline: { zh: "被吃的子，成为你的兵。", en: "Captured pieces return to fight for you." },
    intro: {
      zh: [
        "日本将棋最独特的规则是「持驹」：吃掉的对方棋子可以作为己方棋子重新投入棋盘。这让棋局几乎不会因子力减少而趋于平淡，攻防在终盘反而更激烈。",
        "棋子为五角形木片，以汉字标识，进入敌阵后可以翻面「成金」。",
      ],
      en: [
        "Shogi's defining rule is the drop: captured enemy pieces may be placed back on the board as your own. Material never simply drains away, so the endgame grows sharper rather than quieter.",
        "Pieces are pentagonal wooden tiles marked with kanji; entering the enemy camp lets them flip and promote.",
      ],
    },
    facts: [
      { label: { zh: "棋盘", en: "Board" }, value: { zh: "9 × 9", en: "9 × 9" } },
      { label: { zh: "每方棋子", en: "Pieces" }, value: { zh: "20", en: "20" } },
      { label: { zh: "特色", en: "Signature" }, value: { zh: "持驹 · 成金", en: "Drops · Promotion" } },
    ],
    playable: true,
  },
  {
    slug: "go",
    name: { zh: "围棋", en: "Go" },
    glyph: { zh: "围", en: "Go" },
    tagline: { zh: "黑白两色，三百六十一个交点，无穷。", en: "Two colours, 361 points, infinity." },
    intro: {
      zh: [
        "围棋起源于中国，至少有两千五百年历史，规则简单到一句话就能说完：轮流落子，围地多者胜，无气的子被提走。但简单的规则生出了任何棋类中最深的变化。",
        "围棋的学习路径与其他棋类不同：先学「气」与「提子」，再学围地与死活，最后才是布局与全局判断。",
      ],
      en: [
        "Go originated in China at least 2,500 years ago. Its rules fit in a sentence: players alternate placing stones, surround more territory to win, stones with no liberties are captured. From those rules grows the deepest variation of any board game.",
        "Learning Go follows its own path: liberties and capture first, then territory and life-and-death, and only later openings and whole-board judgment.",
      ],
    },
    facts: [
      { label: { zh: "棋盘", en: "Board" }, value: { zh: "19 × 19", en: "19 × 19" } },
      { label: { zh: "起源", en: "Origin" }, value: { zh: "中国 · 2500+ 年", en: "China · 2,500+ years" } },
      { label: { zh: "记谱", en: "Notation" }, value: { zh: "SGF", en: "SGF" } },
    ],
    playable: true,
  },
  {
    slug: "mahjong",
    name: { zh: "麻将", en: "Mahjong" },
    glyph: { zh: "麻", en: "Mahjong" },
    tagline: { zh: "先认识牌，再学组牌；日式、国标、四川分开学。", en: "Meet the tiles, build a hand; learn Riichi, Chinese Official and Sichuan separately." },
    intro: {
      zh: [
        "麻将通常由四个人一起玩。摸牌就是拿一张新牌，打牌就是选一张不要的牌放到桌上。你要整理自己的牌，达到所选规则的获胜条件；完成一手叫「和牌」，也写作「胡牌」。赢下一手不等于整场总分第一。",
        "先认识三类带数字的牌：万、条（也叫索）、筒（也叫饼），每类都有一到九。日式立直使用 136 张牌；本站国标对局加上八张花牌，共 144 张；本站四川血战对局只用这三类数字牌，共 108 张。三种玩法分别有教程，不要混用规则。",
        "常见组牌目标是四组加一对：同类连续三张，如二万、三万、四万，叫「顺子」；三张一样的牌叫「刻子」；两张一样的牌叫「对子」。四张一样的牌按规则宣布为「杠」后，也算一组，但要补牌。还有七对等特殊结构。注意：结构凑齐不一定能和牌！日式还需满足「役」（规则认可的获胜条件）等要求；国标要达到不含花牌分的八番起和门槛；本站四川要先清掉自己选定不要的那一类牌。课程会分别带你实际操作并解释不能和牌的原因。",
      ],
      en: [
        "Mahjong is usually played by four people. To draw means to take a new tile; to discard means to place an unwanted tile on the table. Arrange your tiles to meet the winning conditions of your chosen rules. Winning one hand does not necessarily put you first in the whole match.",
        "Start with three numbered tile families, called suits: characters, bamboo and dots, each numbered one to nine. Riichi uses 136 tiles. This site's Chinese Official table includes eight flower tiles for 144; its Sichuan Blood Battle table uses only the three numbered suits for 108. Each version has its own lessons: do not mix their rules.",
        "A common target is four groups and a pair. Three consecutive numbers in one suit, such as two, three and four characters, form a sequence; three identical tiles form a triplet; two identical tiles form a pair. Four identical tiles declared as a kong under the rules count as one group and require a replacement draw. Special shapes such as seven pairs also exist. A complete shape alone does not guarantee a legal win! Riichi also requires a yaku (a recognized winning condition) and other eligibility checks; Chinese Official requires at least eight scoring points, excluding flowers; this site's Sichuan rules require you to clear the suit you chose to exclude. Separate lessons walk you through the actions and explain why a win may be unavailable.",
      ],
    },
    facts: [
      { label: { zh: "牌数（依规则）", en: "Tiles (by rules)" }, value: { zh: "108 / 136 / 144", en: "108 / 136 / 144" } },
      { label: { zh: "人数", en: "Players" }, value: { zh: "4", en: "4" } },
      { label: { zh: "成形", en: "Emerged" }, value: { zh: "19 世纪中叶 · 中国", en: "Mid-1800s · China" } },
    ],
    playable: true,
  },
  {
    slug: "holdem",
    name: { zh: "德州扑克", en: "Texas Hold'em" },
    glyph: { zh: "扑", en: "Hold'em" },
    tagline: { zh: "两张底牌，五张公共牌，一桌人的心理。", en: "Two cards in hand, five on the table, a whole table of minds." },
    intro: {
      zh: [
        "德州扑克于 20 世纪初出现在美国德克萨斯州，1970 年起成为世界扑克大赛（WSOP）主赛事项目。每人两张底牌，桌面依次翻开三张（翻牌）、一张（转牌）、一张（河牌）公共牌，穷尽四轮下注后以最好的五张牌比大小。",
        "它的深度不在牌型，而在决策：位置、底池赔率、范围思维与对手行为的解读。本站提供规则、概率与策略教学，使用没有现金价值的模拟筹码练习，不涉及真钱。",
      ],
      en: [
        "Texas Hold'em emerged in early-20th-century Texas and has been the World Series of Poker main event since 1970. Each player holds two private cards; five community cards are dealt in stages (flop, turn, river) across four betting rounds, and the best five-card hand wins.",
        "Its depth lies not in hand rankings but in decisions: position, pot odds, range thinking and reading behaviour. This site teaches rules, odds and strategy using simulated chips with no cash value — no real money.",
      ],
    },
    facts: [
      { label: { zh: "牌数", en: "Deck" }, value: { zh: "52 张", en: "52 cards" } },
      { label: { zh: "人数", en: "Players" }, value: { zh: "2–10", en: "2–10" } },
      { label: { zh: "下注轮", en: "Betting rounds" }, value: { zh: "4", en: "4" } },
    ],
    playable: true,
  },
  {
    slug: "baccarat",
    name: { zh: "百家乐", en: "Baccarat" },
    glyph: { zh: "百", en: "Baccarat" },
    tagline: { zh: "庄、闲、和，规则最少的一张桌。", en: "Banker, Player, Tie — the table with the fewest rules." },
    intro: {
      zh: [
        "百家乐源自欧洲，在意大利与法国有数百年历史，现代通行的「Punto Banco」版本定型于 20 世纪的赌场。玩家只需在庄（Banker）、闲（Player）或和（Tie）之间选择，发牌与补牌完全按固定规则进行，没有任何操作决策。",
        "正因为没有决策，它是学习概率与期望值最干净的样本：八副牌下庄的庄家优势约 1.06%，闲约 1.24%，和高达 14.4%。本站讲的是规则、补牌表与数学，帮助你看清「策略」为什么不存在；不提供真钱游戏。",
      ],
      en: [
        "Baccarat has centuries of history in Italy and France; the modern Punto Banco version settled in 20th-century casinos. The player only chooses Banker, Player or Tie; dealing and drawing follow fixed rules with no decisions at all.",
        "That absence of decisions makes it the cleanest case study in probability and expected value: with eight decks the house edge is about 1.06% on Banker, 1.24% on Player and 14.4% on Tie. We teach the rules, the drawing table and the maths — to show why no 'strategy' exists. No real-money play.",
      ],
    },
    facts: [
      { label: { zh: "牌数", en: "Decks" }, value: { zh: "8 副", en: "8 decks" } },
      { label: { zh: "选项", en: "Bets" }, value: { zh: "庄 · 闲 · 和", en: "Banker · Player · Tie" } },
      { label: { zh: "庄家优势", en: "House edge" }, value: { zh: "1.06% 起", en: "from 1.06%" } },
    ],
    playable: true,
  },
];

export function getGame(slug: string): Game | undefined {
  return games.find((g) => g.slug === slug);
}

export function isGameSlug(v: string): v is GameSlug {
  return games.some((g) => g.slug === v);
}

export function l<T extends L>(v: T, locale: Locale): string {
  return v[locale];
}
