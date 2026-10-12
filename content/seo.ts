import type { GameSlug } from './games';
import type { Locale } from '@/lib/i18n';

type Bilingual = Record<Locale, string>;
type Question = { question: Bilingual; answer: Bilingual };
type SearchTopic = {
  title: Bilingual;
  description: Bilingual;
  focus: Bilingual;
  questions: Question[];
  references: { name: string; url: string }[];
};

/** Editorial search-intent map, not measured search volume or keyword difficulty. */
export const searchTopics: Record<GameSlug, SearchTopic> = {
  cube: {
    title: { zh: '三阶魔方入门：还原教程、公式与在线练习', en: 'How to Solve a Rubik’s Cube: Beginner Tutorials' },
    description: { zh: '从认识中心块、棱块、角块和转动符号开始，学习三阶魔方层先法、白十字与顶层公式。阅读逐步教程，在浏览器中手动跟做与复核。', en: 'Learn 3×3 cube notation, pieces and the beginner layer-by-layer method. Follow written lessons, practice turns in an interactive cube and check each stage.' },
    focus: { zh: '三阶魔方还原教程', en: 'how to solve a 3×3 Rubik’s Cube for beginners' },
    questions: [
      { question: { zh: '零基础学三阶魔方，应该从哪里开始？', en: 'Where should a complete beginner start?' }, answer: { zh: '先认识固定的中心块以及棱块、角块，再学 U、D、L、R、F、B 转动符号。完成基础记号课后，再按层先法逐层学习；每一步都要检查已经完成的部分是否保留。', en: 'Start with centers, edges and corners, then learn U, D, L, R, F and B notation. Continue to the layer-by-layer lesson after the notation lesson, checking that completed pieces stay solved.' } },
      { question: { zh: '跟做公式和独立还原有什么区别？', en: 'Is following an algorithm the same as solving independently?' }, answer: { zh: '跟做练习使用准备好的教学局面，帮助你理解转动的效果。独立还原还需要识别当前块的位置、建立正确的持握方向，并选择适合当前阶段的操作。', en: 'Guided examples use prepared teaching positions to show what turns do. An independent solve also requires identifying pieces, choosing the working orientation and recognizing the current stage.' } },
    ],
    references: [{ name: 'Rubik’s — 3×3 Solve Guide', url: 'https://rubiks.com/solve-guide' }],
  },
  chess: {
    title: { zh: '国际象棋规则入门、棋子走法与在线对弈', en: 'Chess for Beginners: Rules, Moves & Online Play' },
    description: { zh: '从棋盘坐标和六种棋子走法开始，理解将军、将死、逼和、王车易位与吃过路兵。配合图文课程、战术练习和浏览器人机对弈学习国际象棋。', en: 'Learn chess piece moves, check, checkmate, stalemate, castling and en passant. Read beginner lessons, try tactics and practice against a browser chess engine.' },
    focus: { zh: '国际象棋规则入门', en: 'chess rules for beginners' },
    questions: [
      { question: { zh: '将军、将死和逼和有什么区别？', en: 'What is the difference between check, checkmate and stalemate?' }, answer: { zh: '将军是王正受到攻击，必须解除威胁。将死是王受攻击且没有合法解法，受将方输棋。逼和是轮到走棋的一方没有合法着法、但王没有受攻击，结果为和棋。', en: 'Check means the king is attacked and the threat must be removed. Checkmate means the attacked king cannot escape legally. Stalemate means there is no legal move but the king is not attacked; the game is drawn.' } },
      { question: { zh: '先背开局还是先学规则？', en: 'Should I memorize openings before learning the rules?' }, answer: { zh: '先掌握合法走法与王的安全，再练习将军、简单将死和子力配合。这里的入门课从棋盘与棋子开始，不要求先背开局名称。', en: 'Learn legal moves and king safety first, then practice checks, simple mates and piece coordination. The beginner course starts with the board and pieces, without requiring opening memorization.' } },
    ],
    references: [{ name: 'FIDE — Laws of Chess', url: 'https://handbook.fide.com/chapter/E012023' }],
  },
  xiangqi: {
    title: { zh: '中国象棋入门：棋子走法、规则与人机练习', en: 'Xiangqi for Beginners: Chinese Chess Rules' },
    description: { zh: '认识中国象棋棋盘、九宫与河界，学习车马炮兵等棋子走法、蹩马腿与将帅照面。通过逐步课程、战术题和人机对弈练习合法走棋。', en: 'Learn Chinese chess: the palace, river, piece moves, blocked horse legs and facing generals. Follow xiangqi lessons, try tactics and practice legal moves online.' },
    focus: { zh: '中国象棋棋子走法', en: 'how to play xiangqi' },
    questions: [
      { question: { zh: '象棋的马为什么有时不能跳？', en: 'Why is a horse move sometimes blocked?' }, answer: { zh: '马走“日”形时，先朝目标方向直走一格，再斜走一格。第一格若有棋子，就叫蹩马腿，该方向的马步不能走；可在走法课中逐步摆出这个局面。', en: 'A horse first steps one point orthogonally, then one diagonally. A piece on that first point blocks the move. The movement lesson demonstrates the blocked-leg position step by step.' } },
      { question: { zh: '将和帅可以直接面对吗？', en: 'Can the two generals face each other?' }, answer: { zh: '不能在同一直线上没有棋子阻隔地面对。移动挡在中间的棋子前，应先检查是否会使将帅照面，以及是否使自己的将帅受攻击。', en: 'The generals cannot face each other on the same file with no piece between them. Before moving an intervening piece, check whether it exposes the generals or leaves your own general attacked.' } },
    ], references: [],
  },
  shogi: {
    title: { zh: '日本将棋规则入门：走法、升变与持驹打入', en: 'Shogi for Beginners: Rules, Promotion & Piece Drops' },
    description: { zh: '从九路棋盘和将棋棋子开始，学习升变、持驹与打入，理解二步与打步诘等禁手。用图文课程、教学局面和浏览器对弈练习日本将棋。', en: 'Learn Japanese chess on a 9×9 board: piece moves, promotion, captured-piece drops and illegal pawn drops. Follow illustrated lessons and practice shogi online.' },
    focus: { zh: '日本将棋规则入门', en: 'how to play shogi for beginners' },
    questions: [
      { question: { zh: '吃到的棋子为什么还能放回棋盘？', en: 'Why can captured pieces return to the board?' }, answer: { zh: '被吃的棋子恢复成未升变状态，成为吃子方的持驹。之后可以用一次行棋把持驹打入合法的空格；打入仍受棋子的落点和禁手规则约束。', en: 'Captured pieces revert to their unpromoted state and become pieces in hand. A turn may be used to drop one on a legal empty square, subject to drop and illegal-move rules.' } },
      { question: { zh: '将棋的“二步”是什么意思？', en: 'What does the two-pawn rule mean?' }, answer: { zh: '不能在已有己方未升变步兵的同一纵线上再打入一枚步兵。已升变的步兵不按未升变步兵计算；打入步兵直接将死对手也受到打步诘禁手限制。', en: 'You cannot drop a pawn on a file containing another of your unpromoted pawns. A promoted pawn does not count for this restriction. A pawn drop that immediately delivers mate is also prohibited.' } },
    ], references: [{ name: '日本将棋連盟 — 将棋の反則', url: 'https://www.shogi.or.jp/knowledge/shogi/05.php' }],
  },
  go: {
    title: { zh: '围棋零基础入门：气、提子、围地与九路练习', en: 'Go for Beginners: Liberties, Captures & 9×9 Practice' },
    description: { zh: '从围棋交叉点和轮流落子开始，理解气、连通、提子与打劫。先在九路棋盘进行规则练习，再学习围地与终局计分；无需注册。', en: 'Learn the game of Go: intersections, liberties, connected stones, captures and ko. Start on a 9×9 practice board before exploring territory and end-of-game scoring.' },
    focus: { zh: '围棋入门规则', en: 'how to play Go on a 9×9 board' },
    questions: [
      { question: { zh: '围棋中的“气”是什么？', en: 'What are liberties in Go?' }, answer: { zh: '气是棋子或一组相连棋子上下左右紧邻的空交叉点，不包括斜角。相连棋子共享气；对方落子把一组棋子的气全部占满时，该组棋子被提走。', en: 'Liberties are empty intersections directly adjacent horizontally or vertically to a stone or connected group. Diagonals do not count. A group is captured when the opponent fills all its liberties.' } },
      { question: { zh: '为什么从九路棋盘开始学围棋？', en: 'Why start learning on a 9×9 board?' }, answer: { zh: '九路棋盘更小，容易看清连通、数气和提子。先掌握这些局部规则，再学习整盘的围地、停着与计分；局部练习成功不等于已经赢得整局。', en: 'A smaller board makes connections, liberties and captures easier to see. Learn these local rules before whole-board territory, passing and scoring. Completing an exercise is not the same as winning a full game.' } },
    ], references: [{ name: 'Nihon Ki-in — How to Play Go', url: 'https://www.nihonkiin.or.jp/english/howto/howto0.htm' }],
  },
  mahjong: {
    title: { zh: '麻将规则入门：认牌、日式立直、国标与四川', en: 'Mahjong for Beginners: Riichi, MCR & Sichuan Rules' },
    description: { zh: '先认识万筒条与字牌、摸打流程和基本牌型，再分别学习日式立直、国标与四川麻将。图解术语、分规则练习与教学计分，不混用地区规则。', en: 'Learn mahjong tiles, drawing, discarding and hand shapes, then separate Riichi, Chinese Official (MCR) and Sichuan lessons with rules practice.' },
    focus: { zh: '麻将规则新手入门', en: 'mahjong rules for beginners' },
    questions: [
      { question: { zh: '新手应该先学哪种麻将规则？', en: 'Which mahjong rules should a beginner learn first?' }, answer: { zh: '先学认牌、摸打与基本牌型，再选择将要使用的地区规则。日式立直的役、国标的番种与四川的定缺不是同一套计分方式，课程与练习按规则分开。', en: 'Start with tiles, drawing, discarding and basic shapes, then choose the rules you intend to play. Riichi yaku, MCR scoring patterns and Sichuan missing-suit rules belong to different systems; lessons and practice keep them separate.' } },
      { question: { zh: '牌型凑齐就一定能和牌吗？', en: 'Does a complete-looking hand always qualify as a win?' }, answer: { zh: '不一定。结构完成后，还要满足所选规则的和牌条件，例如日式立直需要有效的役，国标有最低计分门槛。先查看当前课程与牌桌说明，不能把一种规则的条件套到另一种。', en: 'Not necessarily. A completed shape must also meet the selected ruleset’s win conditions, such as a valid yaku in Riichi or the MCR minimum scoring requirement. Consult the specific lesson and table instructions.' } },
    ], references: [],
  },
  holdem: {
    title: { zh: '德州扑克规则入门：牌型大小、轮次与模拟练习', en: 'Texas Hold’em for Beginners: Rules & Hand Rankings' },
    description: { zh: '学习德州扑克底牌、公共牌与五张最佳牌型，理解翻牌、转牌、河牌和行动顺序。练习看牌、跟注与模拟结算，仅使用不可兑换的教学筹码。', en: 'Learn Texas Hold’em hole cards, community cards, hand rankings and betting rounds, then practise at a table with teaching chips. No real money.' },
    focus: { zh: '德州扑克规则和牌型大小', en: 'Texas Hold’em rules and hand rankings' },
    questions: [
      { question: { zh: '德州扑克最后比的是哪五张牌？', en: 'Which five cards make a Hold’em hand?' }, answer: { zh: '从自己的两张底牌与五张公共牌中选出最好的五张牌，可以使用零张、一张或两张底牌。判断牌型后，再按规则比较同牌型的点数与踢脚牌。', en: 'Choose the best five cards from your two hole cards and the five community cards. You may use zero, one or both hole cards. Compare hand categories first, then the relevant ranks and kickers.' } },
      { question: { zh: '这里的筹码可以充值或提现吗？', en: 'Can teaching chips be bought or cashed out?' }, answer: { zh: '不能。筹码与余额只用于解释行动和结算，没有充值、提现、现金奖励或兑换功能，也不代表盈利能力。', en: 'No. Chips and balances explain actions and settlement. There are no purchases, withdrawals, cash rewards or exchanges, and practice results do not demonstrate profitability.' } },
    ], references: [],
  },
  baccarat: {
    title: { zh: '百家乐规则教学：点数、补牌表与模拟练习', en: 'Baccarat Rules for Beginners: Scoring & Drawing' },
    description: { zh: '认识百家乐庄闲牌面，学习点数只取个位、天然牌与第三张补牌条件。通过逐步发牌和模拟结算理解规则，只做教学，不涉及真钱。', en: 'Learn baccarat scoring, natural hands and third-card drawing rules through guided dealing and simulated settlement. Educational practice only; no real-money play.' },
    focus: { zh: '百家乐点数和补牌规则', en: 'baccarat scoring and third-card rules' },
    questions: [
      { question: { zh: '百家乐牌面点数怎样计算？', en: 'How are baccarat hand values calculated?' }, answer: { zh: 'A 计 1 点，2 至 9 按牌面点数，10、J、Q、K 计 0 点。把牌相加后只取个位，例如 7 加 8 为 15，牌面点数是 5。', en: 'Aces count as 1, cards 2–9 use their face values, and tens and face cards count as 0. Only the last digit of the total counts: 7 plus 8 totals 15, so the hand value is 5.' } },
      { question: { zh: '学习补牌表能保证赢吗？', en: 'Does learning the drawing table guarantee a win?' }, answer: { zh: '不能。补牌表解释发牌规则，不能预测随机牌序或保证收益。本站用教学案例与随机练习帮助理解点数和流程，不提供真钱下注或获利承诺。', en: 'No. The drawing table explains dealing rules; it cannot predict random cards or guarantee returns. Guided examples and random practice teach scoring and procedure, without real-money betting.' } },
    ], references: [],
  },
};

export const siteSearch = {
  zh: { title: '象棋、围棋、国际象棋与魔方入门教程及在线练习', description: '弈方提供魔方、国际象棋、中国象棋、日本将棋、围棋、麻将、德州扑克与百家乐的中英文教程。先学规则与术语，再用交互棋具练习，无需注册。' },
  en: { title: 'Learn Chess, Go, Xiangqi, Mahjong & the Rubik’s Cube', description: 'Free beginner lessons for chess, xiangqi, shogi, Go, mahjong, poker and the Rubik’s Cube, with play against the computer and online games with friends.' },
};

export type GamePageKind = 'learn' | 'play' | 'remote' | 'glossary' | 'history' | 'puzzles';
type Copy = { zh: string; en: string };
/** Search intent per page kind, worded the way people search: "人机对弈", "在线好友对战", "入门教程".
 * Titles stay within what results pages show (about 26 CJK / 55 Latin characters before the site name);
 * descriptions within about 90 CJK / 155 Latin characters. */
const playTitles: Record<GameSlug, Copy> = {
  cube: { zh: '三阶魔方在线模拟器：3D 转动与还原练习', en: 'Online Rubik’s Cube Simulator: 3D Solving Practice' },
  chess: { zh: '国际象棋人机对弈：免费在线下棋，无需注册', en: 'Play Chess vs Computer Online — Free, No Sign-up' },
  xiangqi: { zh: '中国象棋人机对弈：免费在线下象棋，无需注册', en: 'Play Xiangqi vs Computer Online — Free, No Sign-up' },
  shogi: { zh: '日本将棋人机对弈：免费在线下将棋', en: 'Play Shogi vs Computer Online — Free, No Sign-up' },
  go: { zh: '围棋人机对弈：九路棋盘在线下围棋', en: 'Play Go vs Computer on a 9×9 Board — Free Online' },
  mahjong: { zh: '麻将在线练习：四川血战与国标单人模拟', en: 'Mahjong Practice Online: Sichuan & MCR Solo Tables' },
  holdem: { zh: '德州扑克在线模拟练习：牌型、下注与结算', en: 'Texas Hold’em Practice Table: Betting & Showdowns' },
  baccarat: { zh: '百家乐模拟练习：点数计算与补牌规则', en: 'Baccarat Practice: Hand Values & Third-Card Rules' },
};
const playDescriptions: Record<GameSlug, Copy> = {
  cube: { zh: '在浏览器里转动 3D 三阶魔方：随机打乱、拖动视角、一键复原，配合层先法教程逐步练习还原。免费使用，无需注册或下载。', en: 'Turn a 3D Rubik’s Cube in your browser: scramble, rotate the view and reset, then follow the beginner method step by step. Free, no sign-up or download.' },
  chess: { zh: '在浏览器里和电脑下国际象棋，可选难度，自动判定将军、将死与和棋，可以悔棋，并记录完整棋谱。免费使用，无需注册或下载。', en: 'Play chess against the computer in your browser with adjustable strength, automatic check, mate and draw detection, undo and a full move list. Free, no sign-up.' },
  xiangqi: { zh: '在浏览器里和电脑下中国象棋，可选难度，自动判定将军与困毙，可以悔棋，并记录完整棋谱。免费使用，无需注册或下载。', en: 'Play xiangqi (Chinese chess) against the computer in your browser with adjustable strength, automatic check and mate detection, undo and a move list. Free.' },
  shogi: { zh: '在浏览器里和电脑下日本将棋，支持升变与持驹打入，自动检查二步与打步诘等禁手。免费使用，无需注册或下载。', en: 'Play shogi against the computer in your browser with promotion and piece drops; illegal drops are checked for you. Free, no sign-up or download.' },
  go: { zh: '在九路棋盘上和电脑下围棋，或与身边的人同屏对弈。自动提子、判断打劫，终局一起核对死子并计分。免费使用，无需注册。', en: 'Play Go on a 9×9 board against the computer or a friend on the same screen. Captures and ko are handled; review dead stones and score together. Free.' },
  mahjong: { zh: '和电脑对手打四川血战麻将，或单独练习国标麻将的番种与和牌判断。每步都有规则提示，只做教学，不涉及真钱。免费使用。', en: 'Play Sichuan mahjong against computer opponents or practise Chinese Official (MCR) scoring with rule hints at every step. Teaching only, no real money.' },
  holdem: { zh: '在四人练习桌上和电脑打德州扑克：看底牌与公共牌、选择跟注或加注，再看比牌原因与筹码去向。练习筹码，不涉及真钱。', en: 'Play Texas Hold’em against computer players at a four-seat practice table, with every showdown and chip movement explained. Practice chips only.' },
  baccarat: { zh: '一步步发牌，练习百家乐点数计算与第三张补牌条件，看懂庄闲输赢的原因。只做规则教学，不涉及真钱下注。', en: 'Deal baccarat hands step by step to practise hand values and third-card drawing rules, with each result explained. Rules teaching only, no betting.' },
};
const remoteTitles: Record<GameSlug, Copy> = {
  cube: { zh: '', en: '' }, baccarat: { zh: '', en: '' },
  chess: { zh: '国际象棋在线好友对战：发链接就能下，免注册', en: 'Play Chess with Friends Online — Just Share a Link' },
  xiangqi: { zh: '中国象棋在线好友对战：发链接就能下，免注册', en: 'Play Xiangqi with Friends Online — Just Share a Link' },
  shogi: { zh: '日本将棋在线好友对战：发链接就能下，免注册', en: 'Play Shogi with Friends Online — Just Share a Link' },
  go: { zh: '围棋在线好友对战：发链接就能下，免注册', en: 'Play Go with Friends Online — Just Share a Link' },
  mahjong: { zh: '麻将好友房：四人在线联机，日麻、国标、四川', en: 'Online Mahjong with Friends: 4-Player Private Rooms' },
  holdem: { zh: '德州扑克好友房：在线约局，练习筹码免注册', en: 'Texas Hold’em with Friends: Private Practice Tables' },
};
const remoteDescriptions: Record<GameSlug, Copy> = {
  cube: { zh: '', en: '' }, baccarat: { zh: '', en: '' },
  chess: { zh: '创建房间，把邀请链接发给朋友，对方打开后由你同意入座，即可在线下国际象棋。支持聊天、断线自动重连与刷新恢复，无需注册。', en: 'Create a room, send the link and let your friend in to play chess online. Chat, automatic reconnection and refresh recovery included. No account needed.' },
  xiangqi: { zh: '创建房间，把邀请链接发给朋友，对方打开后由你同意入座，即可在线下中国象棋。支持聊天、断线自动重连与刷新恢复，无需注册。', en: 'Create a room, send the link and let your friend in to play xiangqi online. Chat, automatic reconnection and refresh recovery included. No account needed.' },
  shogi: { zh: '创建房间，把邀请链接发给朋友，对方打开后由你同意入座，即可在线下日本将棋。支持聊天、断线自动重连与刷新恢复，无需注册。', en: 'Create a room, send the link and let your friend in to play shogi online. Chat, automatic reconnection and refresh recovery included. No account needed.' },
  go: { zh: '创建房间，把邀请链接发给朋友，对方打开后由你同意入座，即可在线下围棋并一起点目计分。支持聊天与断线自动重连，无需注册。', en: 'Create a room, send the link and let your friend in to play Go online, then agree on the score together. Chat and automatic reconnection. No account.' },
  mahjong: { zh: '房主开一个房间，三位朋友打开同一个链接入座，就能在线打日式立直、国标或四川血战麻将。支持聊天与断线自动重连，无需注册，不涉及真钱。', en: 'Open a room and three friends join from one link to play riichi, MCR or Sichuan mahjong online. Chat and automatic reconnection. No account, no money.' },
  holdem: { zh: '开一张两人或四人德州扑克练习桌，把链接发给朋友就能在线一起打。支持聊天与断线自动重连，只用练习筹码，无需注册。', en: 'Open a two- or four-seat Texas Hold’em practice table and share the link to play online with friends. Chat and reconnection. Practice chips only.' },
};
export function gamePageCopy(game: GameSlug, name: string, locale: Locale, kind: GamePageKind) {
  const zh = locale === 'zh';
  const topic = searchTopics[game];
  const pick = (copy: Copy) => copy[locale];
  const titles: Record<GamePageKind, string> = {
    learn: zh ? `${name}入门教程：零基础规则图解课程` : `${name} for Beginners: Step-by-Step Lessons`,
    play: pick(playTitles[game]),
    remote: pick(remoteTitles[game]),
    glossary: zh ? `${name}术语大全：常用名词图解词典` : `${name} Glossary: Key Terms Explained`,
    history: zh ? `${name}的历史与起源：规则演变时间线` : `${name} History: Origins & Rule Changes`,
    puzzles: game === 'cube' ? (zh ? '魔方练习题：每日打乱与公式练习' : 'Rubik’s Cube Practice: Daily Scramble & Algorithms')
      : ['chess', 'xiangqi', 'shogi'].includes(game) ? (zh ? `${name}练习题：战术题与规则测验` : `${name} Puzzles: Tactics & Rule Quizzes`)
      : game === 'go' ? (zh ? '围棋练习题：数气、提子与吃子入门' : 'Go Exercises: Liberties, Captures & Basic Fights')
      : (zh ? `${name}规则测验：检查你是否真的懂了` : `${name} Rules Quiz: Check What You Know`),
  };
  const descriptions: Record<GamePageKind, string> = {
    learn: zh ? `${name}零基础入门教程：按顺序从认识棋具到完整规则，每课配图解与可操作的教学局面。重点：${topic.focus[locale]}。免费，无需注册。` : `Free ${name} lessons for complete beginners, in order from the basics to the full rules, with diagrams and hands-on practice positions.`,
    play: pick(playDescriptions[game]),
    remote: pick(remoteDescriptions[game]),
    glossary: zh ? `${name}常用术语一页查齐：每个名词都有通俗解释与例子，看不懂的词随时回到入门教程对照练习。` : `Every common ${name} term on one page, each with a plain explanation and an example, linked back to the beginner lessons.`,
    history: zh ? `${name}从起源到今天：重要的规则变化与历史节点按时间线排列，读完再去教程和练习里亲手体验。` : `How ${name} began and how its rules changed, in a short timeline — then try it yourself in the lessons and practice pages.`,
    puzzles: game === 'cube'
      ? (zh ? '每天一组新的三阶魔方打乱，外加固定公式练习题。先自己动手尝试，再逐步查看转动步骤与解释。' : 'A new 3×3 scramble every day plus fixed algorithm drills. Try each one yourself, then step through the turns with explanations.')
      : ['chess', 'xiangqi', 'shogi'].includes(game)
        ? (zh ? `${name}练习题：先看目标，亲手走出答案，再看原因与逐步回放。题目每天轮换，另附规则问答。` : `${name} puzzles: read the goal, play your answer, then see why with a step-by-step replay. New puzzles daily, plus rule questions.`)
        : game === 'go'
          ? (zh ? '在小棋盘上练习围棋的数气、提子与吃子判断，每题都有目标和解释，适合刚学会规则的新手。题目每天轮换。' : 'Practise counting liberties, capturing and basic fights on small Go boards, each with a goal and an explanation. Rotates daily.')
          : (zh ? `用${name}规则问题检查自己是否真正理解：先选答案，再读原因，答错也知道错在哪里。题目每天轮换。` : `Check your understanding of ${name} with rule questions: pick an answer, then read why it is right or wrong. Rotates daily.`),
  };
  return { title: titles[kind], description: descriptions[kind] };
}

/** Search titles for the short information pages (their on-page headings stay short). */
export const infoSearch = {
  about: { zh: { title: '关于弈方：免费的棋类、麻将与魔方入门学习站', description: '弈方是一个免费、无需注册的规则学习网站：用中英文图解教程讲清象棋、围棋、国际象棋、将棋、麻将、扑克与魔方，再用在线练习和好友对战巩固。' }, en: { title: 'About Yifang: Free Lessons for Classic Games', description: 'Yifang is a free, no-sign-up site that teaches chess, xiangqi, shogi, Go, mahjong, poker and the Rubik’s Cube with bilingual lessons and online practice.' } },
  contact: { zh: { title: '联系弈方：教程问题、对战故障与规则反馈', description: '看不懂的教程、好友对战连不上或规则疑问，都可以发邮件告诉我们。附上页面、设备与浏览器，能更快找到问题。对战房内也有一键回报入口。' }, en: { title: 'Contact Yifang: Lesson, Rules & Bug Feedback', description: 'Tell us about an unclear lesson, a friend-room connection problem or a rules question by email. Friend rooms also have a one-click problem report.' } },
} as const;

/** Search titles/descriptions for lessons whose on-page wording is too long, too short or lacks the
 * game's name for a results page. The lesson itself keeps its wording. */
export const lessonSearch: Record<string, Partial<Record<Locale, { title?: string; description?: string }>>> = {
  'baccarat-first-lesson': { zh: { description: '百家乐零基础第一课：认识庄与闲、学会只取个位的点数算法，再一步步看懂第三张补牌和输赢结算。只做规则教学，不涉及真钱。' }, en: { title: 'Baccarat First Lesson: Cards, Points & Settlement' } },
  'chess-first-lesson': { zh: { description: '国际象棋零基础第一课：认识棋盘坐标和六种棋子，学会每种棋子怎么走、怎么吃子，再理解将军、将死与和棋的区别。' } },
  'holdem-first-lesson': { zh: { description: '德州扑克零基础第一课：认识底牌与公共牌，弄懂翻牌前到河牌的四轮行动，再学会用七张牌比出最佳五张牌型。' } },
  'shogi-basics': { zh: { title: '日本将棋第二课：持驹、打入、升变与将死', description: '日本将棋第二课：吃到的棋子变成持驹，可以打回棋盘；学会打入的限制、升变的时机，以及怎样把对方将死。' }, en: { title: 'Shogi Lesson 2: Drops, Promotion & Checkmate' } },
  'xiangqi-basics': { zh: { title: '中国象棋第二课：读懂棋谱，走好开局六步' } },
  'xiangqi-captures': { zh: { title: '中国象棋第三课：吃子、保护与交换', description: '中国象棋第三课：学会判断哪些子能吃、哪些子被保护，以及什么时候用交换换来优势，配合可操作的局面练习。' } },
  'xiangqi-defense': { zh: { title: '中国象棋第四课：被将军怎么办，如何复盘', description: '中国象棋第四课：被将军时的三种应对（躲开、垫子、吃掉来将的子），以及下完一盘后怎样复盘找出问题。' } },
  'patterns': { zh: { title: '魔方花样图案：五个简单的漂亮图案公式' }, en: { title: 'Rubik’s Cube Patterns: Five Easy Pretty Designs' } },
  'beginner-lbl': { en: { description: 'Solve a 3×3 Rubik’s Cube layer by layer: white cross, first-layer corners, middle edges, then the last layer, with every algorithm shown step by step.' } },
  'cfop-2look-ll': { en: { description: 'CFOP part 2: finish the last layer in two looks — two-look OLL to orient, then two-look PLL to permute — with each case and algorithm shown.' } },
  'cfop-f2l': { en: { description: 'CFOP part 1: build the cross, then pair and insert first-two-layer (F2L) pieces intuitively, with worked examples you can follow on the cube.' } },
  'notation': { en: { description: 'Read Rubik’s Cube notation: what R, U, F and their primes and doubles mean, and how to follow an algorithm turn by turn on the cube.' } },
  'go-first-lesson': { en: { description: 'Go first lesson: place stones on the points, count liberties, capture, understand ko, and score a finished 9×9 game — with hands-on boards.' } },
  'mahjong-first-lesson': { en: { description: 'Mahjong first lesson: learn the suits and honor tiles, sets and pairs, and play your first draw-and-discard turns before choosing a ruleset.' } },
  'mahjong-riichi': { en: { title: 'Riichi Mahjong Basics: Yaku and Your First Win', description: 'Japanese riichi mahjong for beginners: closed hands, yaku, riichi and how to make your first legal winning hand, with clear examples.' } },
  'mahjong-sichuan': { en: { description: 'Sichuan mahjong rules: bloody battle (play continues after a win), declaring a missing suit and exchanging three tiles, with worked examples.' } },
  'mahjong-terms': { en: { title: 'Mahjong Terms Explained, with Riichi Extras', description: 'Look up mahjong terms with pictures, plus the extra rules used only in Japanese riichi mahjong — an optional reference for any lesson.' } },
};
