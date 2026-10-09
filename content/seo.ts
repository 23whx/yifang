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
    title: { zh: '三阶魔方入门：还原教程、公式与在线练习', en: "Learn to Solve a 3×3 Rubik’s Cube: Tutorials & Practice" },
    description: { zh: '从认识中心块、棱块、角块和转动符号开始，学习三阶魔方层先法、白十字与顶层公式。阅读逐步教程，在浏览器中手动跟做与复核。', en: 'Learn 3×3 cube notation, pieces and the beginner layer-by-layer method. Follow written lessons, practice turns in an interactive cube and check each stage.' },
    focus: { zh: '三阶魔方还原教程', en: 'how to solve a 3×3 Rubik’s Cube for beginners' },
    questions: [
      { question: { zh: '零基础学三阶魔方，应该从哪里开始？', en: 'Where should a complete beginner start?' }, answer: { zh: '先认识固定的中心块以及棱块、角块，再学 U、D、L、R、F、B 转动符号。完成基础记号课后，再按层先法逐层学习；每一步都要检查已经完成的部分是否保留。', en: 'Start with centers, edges and corners, then learn U, D, L, R, F and B notation. Continue to the layer-by-layer lesson after the notation lesson, checking that completed pieces stay solved.' } },
      { question: { zh: '跟做公式和独立还原有什么区别？', en: 'Is following an algorithm the same as solving independently?' }, answer: { zh: '跟做练习使用准备好的教学局面，帮助你理解转动的效果。独立还原还需要识别当前块的位置、建立正确的持握方向，并选择适合当前阶段的操作。', en: 'Guided examples use prepared teaching positions to show what turns do. An independent solve also requires identifying pieces, choosing the working orientation and recognizing the current stage.' } },
    ],
    references: [{ name: 'Rubik’s — 3×3 Solve Guide', url: 'https://rubiks.com/solve-guide' }],
  },
  chess: {
    title: { zh: '国际象棋规则入门、棋子走法与在线对弈', en: 'Chess for Beginners: Rules, Piece Moves & Online Practice' },
    description: { zh: '从棋盘坐标和六种棋子走法开始，理解将军、将死、逼和、王车易位与吃过路兵。配合图文课程、战术练习和浏览器人机对弈学习国际象棋。', en: 'Learn chess piece moves, check, checkmate, stalemate, castling and en passant. Read beginner lessons, try tactics and practice against a browser chess engine.' },
    focus: { zh: '国际象棋规则入门', en: 'chess rules for beginners' },
    questions: [
      { question: { zh: '将军、将死和逼和有什么区别？', en: 'What is the difference between check, checkmate and stalemate?' }, answer: { zh: '将军是王正受到攻击，必须解除威胁。将死是王受攻击且没有合法解法，受将方输棋。逼和是轮到走棋的一方没有合法着法、但王没有受攻击，结果为和棋。', en: 'Check means the king is attacked and the threat must be removed. Checkmate means the attacked king cannot escape legally. Stalemate means there is no legal move but the king is not attacked; the game is drawn.' } },
      { question: { zh: '先背开局还是先学规则？', en: 'Should I memorize openings before learning the rules?' }, answer: { zh: '先掌握合法走法与王的安全，再练习将军、简单将死和子力配合。这里的入门课从棋盘与棋子开始，不要求先背开局名称。', en: 'Learn legal moves and king safety first, then practice checks, simple mates and piece coordination. The beginner course starts with the board and pieces, without requiring opening memorization.' } },
    ],
    references: [{ name: 'FIDE — Laws of Chess', url: 'https://handbook.fide.com/chapter/E012023' }],
  },
  xiangqi: {
    title: { zh: '中国象棋入门：棋子走法、规则与人机练习', en: 'Xiangqi for Beginners: Chinese Chess Rules & Practice' },
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
    title: { zh: '麻将规则入门：认牌、日式立直、国标与四川', en: 'Mahjong for Beginners: Tiles, Riichi, MCR & Sichuan Rules' },
    description: { zh: '先认识万筒条与字牌、摸打流程和基本牌型，再分别学习日式立直、国标与四川麻将。图解术语、分规则练习与教学计分，不混用地区规则。', en: 'Learn mahjong tiles, drawing, discarding and hand shapes. Explore separate Riichi, Chinese Official (MCR) and Sichuan lessons with illustrated terms and rules practice.' },
    focus: { zh: '麻将规则新手入门', en: 'mahjong rules for beginners' },
    questions: [
      { question: { zh: '新手应该先学哪种麻将规则？', en: 'Which mahjong rules should a beginner learn first?' }, answer: { zh: '先学认牌、摸打与基本牌型，再选择将要使用的地区规则。日式立直的役、国标的番种与四川的定缺不是同一套计分方式，课程与练习按规则分开。', en: 'Start with tiles, drawing, discarding and basic shapes, then choose the rules you intend to play. Riichi yaku, MCR scoring patterns and Sichuan missing-suit rules belong to different systems; lessons and practice keep them separate.' } },
      { question: { zh: '牌型凑齐就一定能和牌吗？', en: 'Does a complete-looking hand always qualify as a win?' }, answer: { zh: '不一定。结构完成后，还要满足所选规则的和牌条件，例如日式立直需要有效的役，国标有最低计分门槛。先查看当前课程与牌桌说明，不能把一种规则的条件套到另一种。', en: 'Not necessarily. A completed shape must also meet the selected ruleset’s win conditions, such as a valid yaku in Riichi or the MCR minimum scoring requirement. Consult the specific lesson and table instructions.' } },
    ], references: [],
  },
  holdem: {
    title: { zh: '德州扑克规则入门：牌型大小、轮次与模拟练习', en: 'Texas Hold’em for Beginners: Rules, Hand Rankings & Practice' },
    description: { zh: '学习德州扑克底牌、公共牌与五张最佳牌型，理解翻牌、转牌、河牌和行动顺序。练习看牌、跟注与模拟结算，仅使用不可兑换的教学筹码。', en: 'Learn Texas Hold’em hole cards, community cards, hand rankings and betting rounds. Practice decisions and simulated settlement with teaching chips, without real money.' },
    focus: { zh: '德州扑克规则和牌型大小', en: 'Texas Hold’em rules and hand rankings' },
    questions: [
      { question: { zh: '德州扑克最后比的是哪五张牌？', en: 'Which five cards make a Hold’em hand?' }, answer: { zh: '从自己的两张底牌与五张公共牌中选出最好的五张牌，可以使用零张、一张或两张底牌。判断牌型后，再按规则比较同牌型的点数与踢脚牌。', en: 'Choose the best five cards from your two hole cards and the five community cards. You may use zero, one or both hole cards. Compare hand categories first, then the relevant ranks and kickers.' } },
      { question: { zh: '这里的筹码可以充值或提现吗？', en: 'Can teaching chips be bought or cashed out?' }, answer: { zh: '不能。筹码与余额只用于解释行动和结算，没有充值、提现、现金奖励或兑换功能，也不代表盈利能力。', en: 'No. Chips and balances explain actions and settlement. There are no purchases, withdrawals, cash rewards or exchanges, and practice results do not demonstrate profitability.' } },
    ], references: [],
  },
  baccarat: {
    title: { zh: '百家乐规则教学：点数、补牌表与模拟练习', en: 'Baccarat Rules for Beginners: Scoring & Drawing Practice' },
    description: { zh: '认识百家乐庄闲牌面，学习点数只取个位、天然牌与第三张补牌条件。通过逐步发牌和模拟结算理解规则，只做教学，不涉及真钱。', en: 'Learn baccarat scoring, natural hands and third-card drawing rules through guided dealing and simulated settlement. Educational practice only; no real-money play.' },
    focus: { zh: '百家乐点数和补牌规则', en: 'baccarat scoring and third-card rules' },
    questions: [
      { question: { zh: '百家乐牌面点数怎样计算？', en: 'How are baccarat hand values calculated?' }, answer: { zh: 'A 计 1 点，2 至 9 按牌面点数，10、J、Q、K 计 0 点。把牌相加后只取个位，例如 7 加 8 为 15，牌面点数是 5。', en: 'Aces count as 1, cards 2–9 use their face values, and tens and face cards count as 0. Only the last digit of the total counts: 7 plus 8 totals 15, so the hand value is 5.' } },
      { question: { zh: '学习补牌表能保证赢吗？', en: 'Does learning the drawing table guarantee a win?' }, answer: { zh: '不能。补牌表解释发牌规则，不能预测随机牌序或保证收益。本站用教学案例与随机练习帮助理解点数和流程，不提供真钱下注或获利承诺。', en: 'No. The drawing table explains dealing rules; it cannot predict random cards or guarantee returns. Guided examples and random practice teach scoring and procedure, without real-money betting.' } },
    ], references: [],
  },
};

export const siteSearch = {
  zh: { title: '棋类、魔方与牌桌规则入门及在线练习', description: '弈方提供魔方、国际象棋、中国象棋、日本将棋、围棋、麻将、德州扑克与百家乐的中英文教程。先学规则与术语，再用交互棋具练习，无需注册。' },
  en: { title: 'Learn Chess, Go, Shogi, Mahjong & Rubik’s Cube Online', description: 'Learn eight classic games with beginner lessons in English and Chinese. Read rules, explore glossaries and practice on interactive boards, a cube and teaching tables.' },
};

export type GamePageKind = 'learn' | 'play' | 'remote' | 'glossary' | 'history' | 'puzzles';
export function gamePageCopy(game: GameSlug, name: string, locale: Locale, kind: GamePageKind) {
  const zh = locale === 'zh';
  const topic = searchTopics[game];
  const labels = {
    learn: zh ? '零基础教程与规则学习' : 'Beginner Lessons & Rules',
    play: zh ? '在线练习与规则训练' : 'Online Practice & Rules Training',
    remote: zh ? '好友对战与直连说明' : 'Direct Friend Play & Connection Guide',
    glossary: zh ? '术语词典与图解' : 'Glossary & Key Terms',
    history: zh ? '历史与起源' : 'History & Origins',
    puzzles: zh ? '规则测验与战术练习' : 'Rule Quizzes & Tactical Exercises',
  };
  const descriptions = {
    learn: zh ? `${name}教程目录：从零基础课程开始，按顺序学习规则与常见问题，再结合教学局面逐步练习。学习重点为${topic.focus[locale]}。` : `${name} lesson sequence: start with the basics, work through rules and common questions, then practice with teaching positions. Focus: ${topic.focus[locale]}.`,
    play: zh ? `在浏览器中练习${name}，配合规则教程检查操作与结果。无需注册；各练习模式以页面说明为准，牌桌筹码仅用于教学。` : `Practice ${name} in your browser and revisit the lessons to understand each result. No account required; available modes are described on the page. Table chips are educational only.`,
    remote: zh ? `了解${name}好友直连的创建、加入与恢复流程。手动交换邀请和应答，网络连通性取决于双方设备与网络；请先阅读规则与限制。` : `Learn how to create, join and restore a direct ${name} session with friends. Exchange invitations and answers manually; connectivity depends on both devices and networks.`,
    glossary: zh ? `查阅${name}常用术语、含义与示例，遇到不懂的词可返回入门教程继续练习。不同规则的术语适用范围以词条说明为准。` : `Look up ${name} terms, definitions and examples, then return to beginner lessons to practice. Ruleset-specific terminology is identified in the entries.`,
    history: zh ? `了解${name}的起源、规则演变和重要历史节点。按时间线阅读背景，再进入规则教程与练习；历史记录不代表当前赛事成绩。` : `Explore the origins, rule changes and historical milestones of ${name}. Read the timeline, then follow links to lessons and practice; historical records are not current rankings.`,
    puzzles: game === 'cube'
      ? (zh ? '练习三阶魔方按日期生成的打乱与固定公式题。先手动尝试，再逐步查看操作；逆转打乱记录用于复核，不替代独立的层先法求解。' : 'Practice a date-generated 3×3 cube scramble and fixed algorithm exercises. Try each case before stepping through turns; undoing a scramble is not an independent solving method.')
      : ['chess', 'xiangqi', 'shogi'].includes(game)
        ? (zh ? `${name}练习：先看本题的获胜目标，再亲手走棋并查看原因与逐步回放。下方提供规则问答，日期轮换来自固定题库。` : `${name} exercises: Read the position’s winning goal, make a move and review the annotated replay. Rule questions rotate by date from a fixed bank.`)
        : game === 'go'
          ? (zh ? '围棋练习：用小棋盘练习数气、提子与判断落子。先看目标，操作后阅读解释；局部练习不等于整盘胜负，问答按日期轮换固定题库。' : 'Go exercises: Practice liberties, captures and move decisions on small boards. Review each explanation; local exercises do not decide a full game. Rule questions rotate from a fixed bank.')
          : (zh ? `用${name}规则问题检查理解。先选择答案，再阅读原因；答错可根据解释重新思考，日期轮换来自固定题库。` : `Check your ${name} understanding with rule questions. Choose an answer, read why it is right or wrong and try again. Date-based rotation uses a fixed question bank.`),
  };
  return { title: `${name}：${labels[kind]}`.replace('：', zh ? '：' : ': '), description: descriptions[kind] };
}
