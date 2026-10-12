import type { Tutorial } from "../tutorials";

const CHESS_START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const XIANGQI_START = "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1";
const SHOGI_START = "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL[] w - - 0 1";

export const boardTutorials: Tutorial[] = [
  {
    slug: "chess-basics",
    game: "chess",
    title: { zh: "国际象棋入门：规则与第一局", en: "Chess Basics: The Rules and Your First Game" },
    description: {
      zh: "六种棋子、三条特殊规则、一个目标。看完这篇就能坐下来和人下完一整局。",
      en: "Six pieces, three special rules, one goal. After this you can sit down and finish a full game.",
    },
    level: { zh: "入门", en: "Beginner" },
    minutes: 30,
    steps: [
      {
        id: "board",
        title: { zh: "棋盘与开局摆法", en: "The board and the starting position" },
        body: {
          zh: [
            "8×8 的棋盘，横行叫 rank（1–8），纵列叫 file（a–h）。每个格子有唯一的名字，如 e4。摆棋的口诀：白格在右手角；后站在与自己颜色相同的格子上（白后在 d1，黑后在 d8）；王在后旁边。",
            "每方 16 子：8 兵、2 车、2 马、2 象、1 后、1 王。白先走，双方轮流，每次必须走一步。目标不是吃光对方，而是「将死」对方的王——让它被攻击且无处可逃。",
          ],
          en: [
            "An 8×8 board: rows are ranks (1–8), columns are files (a–h), so every square has a name like e4. Set-up rules: a light square in your right-hand corner; the queen goes on her own colour (white queen d1, black queen d8); the king beside her.",
            "Each side has 16 pieces: 8 pawns, 2 rooks, 2 knights, 2 bishops, 1 queen, 1 king. White moves first and players alternate; you must move every turn. The goal is not to capture everything but to checkmate the king — attacked with no escape.",
          ],
        },
        position: { fen: CHESS_START },
      },
      {
        id: "pawn-knight",
        title: { zh: "兵与马", en: "Pawn and knight" },
        body: {
          zh: [
            "兵只能向前走一格（第一次可以走两格），但吃子是斜前方一格。兵不能后退。马走「日」字：横两竖一或竖两横一，是唯一能跳过其他棋子的子。",
            "演示：白兵 e2–e4 走两格，黑兵 e7–e5 回应，然后两边的马跳出来。这四步是几乎所有开局的起点。",
          ],
          en: [
            "Pawns move one square forward (two on their first move) but capture one square diagonally forward. They never move backwards. The knight moves in an L — two squares one way and one to the side — and is the only piece that jumps over others.",
            "Demo: the white pawn goes e2–e4, black answers e7–e5, then both knights come out. These four moves begin almost every opening.",
          ],
        },
        position: { fen: CHESS_START, moves: ["e2e4", "e7e5", "g1f3", "b8c6"] },
      },
      {
        id: "long-range",
        title: { zh: "车、象、后、王", en: "Rook, bishop, queen, king" },
        body: {
          zh: [
            "车走直线，象走斜线，后兼具两者，都可以走任意远但不能跳子。王每次只能走一格，任何方向。棋子价值的常用估算：兵 1、马 3、象 3、车 5、后 9——王无价。",
            "演示里白后从 d4 沿斜线走到 h8 将军，黑王走到 e7 躲开；然后白车从 a1 沿 a 线一直走到 a8。注意每一步都是长距离直线或斜线，中间必须没有阻挡。",
          ],
          en: [
            "Rooks move in straight lines, bishops diagonally, and the queen combines both — any distance, but no jumping. The king moves one square in any direction. Rough values: pawn 1, knight 3, bishop 3, rook 5, queen 9 — the king is priceless.",
            "In the demo the white queen slides d4–h8 with check, the black king steps to e7, then the rook runs a1–a8 up the a-file. Every move is a long straight or diagonal line with nothing in the way.",
          ],
        },
        position: { fen: "4k3/8/8/8/3Q4/8/8/R3K3 w - - 0 1", moves: ["d4h8", "e8e7", "a1a8"] },
      },
      {
        id: "check-mate",
        title: { zh: "将军与将死", en: "Check and checkmate" },
        body: {
          zh: [
            "王被攻击叫“将军”，必须马上解除：把王走开、吃掉攻击的棋子、或者用棋子挡住。三种都做不到，就是“将死”，棋局结束。",
            "演示的是四步杀（又叫“学者杀”）：白后和象一起瞄准 f7。黑方这时走 g8→f6 虽然赶了白后，却没挡住 f7，于是被将死。正确的防守是 g7→g6，挡住后通往 f7 的路。学它是为了会防，而不是指望靠它赢棋。",
          ],
          en: [
            "A king under attack is in check and must escape at once: move the king, capture the attacker, or block the attack. If none of these is possible, it is checkmate and the game ends.",
            "The demo is Scholar's Mate: White's queen and bishop both aim at f7. Black's Ng8–f6 chases the queen but leaves f7 unguarded, so it is mate. The right defence was g7–g6, blocking the queen's path to f7. Learn this trap so you can defend against it, not so you can rely on it.",
          ],
        },
        position: { fen: CHESS_START, moves: ["e2e4", "e7e5", "d1h5", "b8c6", "f1c4", "g8f6", "h5f7"] },
      },
      {
        id: "special",
        title: { zh: "三条特殊规则", en: "Three special rules" },
        body: {
          zh: [
            "王车易位：一步棋里同时动王和车。条件是王和这个车都没动过、两者之间没有棋子、王此刻没被将军、王经过和到达的格子都不被攻击。走法是王朝车的方向走两格，车跳到王的另一边。靠王一侧的叫短易位，靠后一侧的叫长易位。演示里双方各易位一次。",
            "吃过路兵：对方的兵从起点一次走两格，正好停在你的兵旁边时，你可以在紧接着的下一步，把它当作只走了一格那样斜着吃掉。错过这一步就不能再吃了。升变：兵走到最后一行，必须换成后、车、象或马之一，绝大多数时候选后。",
          ],
          en: [
            "Castling moves the king and a rook in a single turn. It is allowed only if neither piece has moved, nothing stands between them, the king is not in check, and the king does not pass through or land on an attacked square. The king moves two squares towards the rook and the rook jumps to the king's other side. Kingside castling is short, queenside castling is long. Both sides castle in the demo.",
            "En passant: when an enemy pawn moves two squares from its start and lands right beside your pawn, on your very next move you may capture it diagonally as if it had moved only one square. Miss that move and the chance is gone. Promotion: a pawn reaching the last rank must become a queen, rook, bishop or knight — almost always a queen.",
          ],
        },
        position: { fen: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", moves: ["e1g1", "e8c8"] },
      },
      {
        id: "opening",
        title: { zh: "开局三原则", en: "Three opening principles" },
        body: {
          zh: [
            "一、控制中心：e4、d4、e5、d5 四格是棋盘的心脏，兵和子都尽量指向那里。二、尽快出子：先马后象，不要过早出后。三、尽早易位：把王藏好再开始进攻。",
            "演示是意大利开局的前三回合，每一步都符合上面三条。记住原则比记住变化重要——大多数业余对局在第 10 步前就已经违反了原则。",
          ],
          en: [
            "One: control the centre — e4, d4, e5 and d5 are the heart of the board; aim pawns and pieces there. Two: develop quickly — knights before bishops, and don't bring the queen out early. Three: castle early — tuck the king away before attacking.",
            "The demo shows the first three moves of the Italian Game; every move obeys all three principles. Principles matter more than memorised variations — most amateur games break one before move ten.",
          ],
        },
        position: { fen: CHESS_START, moves: ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "f8c5"] },
      },
      {
        id: "draw",
        title: { zh: "和棋：逼和与其他", en: "Draws: stalemate and more" },
        body: {
          zh: [
            "不是所有棋局都有胜负。逼和（stalemate）：轮到走棋的一方没有任何合法着法、但王又没被将军——和棋。这是残局里以少胜多时最常见的失误。演示的局面就是黑方被逼和：黑王无路可走，白方明明多一个后。",
            "其他和棋：三次重复局面、50 步无吃子无兵动、双方子力不足以将死（如单王对单王）、以及双方同意。",
          ],
          en: [
            "Not every game has a winner. Stalemate: the side to move has no legal move but is not in check — a draw. It's the most common blunder when converting an advantage. The demo position is a stalemate: black's king can't move, though white has an extra queen.",
            "Other draws: threefold repetition, fifty moves without a capture or pawn move, insufficient material (king against king), and mutual agreement.",
          ],
        },
        position: { fen: "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1" },
      },
    ],
  },
  {
    slug: "xiangqi-basics",
    game: "xiangqi",
    title: { zh: "中国象棋入门：从楚河汉界到中炮", en: "Xiangqi Basics: From the River to the Central Cannon" },
    description: {
      zh: "七种棋子各有脾气：马蹩腿、炮隔打、象不过河、将不出宫。学完规则，再学一个能一直用下去的开局。",
      en: "Seven pieces with seven temperaments: horses that get blocked, cannons that jump to capture, elephants that can't cross the river. Learn the rules, then one opening you can use forever.",
    },
    level: { zh: "入门", en: "Beginner" },
    minutes: 30,
    steps: [
      {
        id: "board",
        title: { zh: "棋盘：九路十线、河界与九宫", en: "The board: nine files, ten ranks, river and palace" },
        body: {
          zh: [
            "象棋走在线的交叉点上，横 10 线、竖 9 路，共 90 个点。中间一条「楚河汉界」把棋盘分成两半；双方底线中央画着斜线的 3×3 区域是九宫，将、帅和士只能在里面活动。",
            "红先黑后。红方棋子：帥仕相傌俥炮兵；黑方：將士象馬車砲卒——字不同，走法相同。记谱按各方自己的视角从右到左数路：红方右边第一路是「一」，黑方右边第一路是「1」。",
          ],
          en: [
            "Xiangqi is played on the intersections: 10 ranks by 9 files, 90 points. The river across the middle divides the board; the 3×3 area with diagonals at each end is the palace, where the general and advisors are confined.",
            "Red moves first. Red pieces: 帥仕相傌俥炮兵; black: 將士象馬車砲卒 — different characters, identical moves. Notation counts files from each player's own right: red's rightmost file is 一, black's is 1.",
          ],
        },
        position: { fen: XIANGQI_START },
      },
      {
        id: "rook-horse-cannon",
        title: { zh: "车、马、炮", en: "Chariot, horse, cannon" },
        body: {
          zh: [
            "车走直线任意远，是最强的子。马走「日」字，但如果紧邻的直线方向有子挡着（「蹩马腿」），那个方向就不能走——这是与国际象棋马最大的区别。炮走法与车相同，但吃子必须隔一个子（任何颜色）跳过去吃，中间不能多也不能少。",
            "演示：红方炮二平五（把炮移到中路），黑方马 8 进 7，红方马二进三，黑方炮 8 平 5。四步展示了炮的平移与马的跳跃。",
          ],
          en: [
            "The chariot moves any distance in a straight line and is the strongest piece. The horse moves one step orthogonally then one diagonally outward — but if the adjacent orthogonal point is occupied (\"hobbling the horse\"), that direction is blocked. The cannon moves like a chariot but captures only by jumping over exactly one piece of either colour.",
            "Demo: red's cannon to the centre file, black's horse develops, red's horse develops, black's cannon to the centre. Four moves demonstrate cannon movement and horse jumps.",
          ],
        },
        position: { fen: XIANGQI_START, moves: ["h3e3", "h10g8", "h1g3", "b8e8"] },
      },
      {
        id: "palace",
        title: { zh: "将、士、象：守家的三种子", en: "General, advisor, elephant: the defenders" },
        body: {
          zh: [
            "将（帅）每步走一格直线，不能出九宫。士走一格斜线，也不能出九宫，所以只有 5 个落点。象走「田」字（斜两格），中间那点有子就不能走（「塞象眼」），而且不能过河——它永远是防守子。",
            "还有一条特殊规则：两个将不能在同一条直线上直接对面（中间无子），否则等于送将，叫「白脸将」或「飞将」。演示中红仕走开后，帅和将之间仍隔着两个象，所以合法。",
          ],
          en: [
            "The general moves one point orthogonally and never leaves the palace. Advisors move one point diagonally, also inside the palace, so they have only five possible points. Elephants move exactly two points diagonally, are blocked if the midpoint is occupied, and cannot cross the river — purely defensive.",
            "One special rule: the two generals may not face each other on an open file with nothing between — the \"flying general\". In the demo, after the red advisor steps aside, two elephants still sit between the generals, so it's legal.",
          ],
        },
        position: { fen: "4k4/4a4/4b4/9/9/9/9/4B4/4A4/4K4 w - - 0 1", moves: ["e2d3", "e10d10", "e1e2"] },
      },
      {
        id: "pawn",
        title: { zh: "兵卒：过河才能横走", en: "Soldiers: sideways only after the river" },
        body: {
          zh: [
            "兵（卒）没过河时只能向前走一格；过河后可以向前或左右走一格，但永远不能后退。走到对方底线后只能左右走，作用大大减弱，所以过河兵要趁早发挥作用。",
            "演示：红兵 e5→e6 过河，黑将先挪开一步，红兵再 e6→d6 横走。为什么黑将要先挪开？因为两个将帅都在 e 列时，兵一离开就会让它们直接面对面（“飞将”），那一步是不合法的。",
          ],
          en: [
            "Before crossing the river a soldier moves one point forward only. After crossing it may move one point forward or sideways, but never back. On the enemy's last rank it can only move sideways and loses most of its value, so put crossed soldiers to work early.",
            "Demo: Red's soldier e5–e6 crosses the river, Black's general steps aside, then the soldier moves sideways e6–d6. Why must the general move first? With both generals on the e-file, the soldier stepping away would leave them facing each other — a \"flying general\" — so that move would be illegal.",
          ],
        },
        position: { fen: "4k4/9/9/p8/9/4P4/9/9/9/4K4 w - - 0 1", moves: ["e5e6", "e10d10", "e6d6"] },
      },
      {
        id: "end",
        title: { zh: "胜负：将死与困毙", en: "Winning: checkmate and stalemate" },
        body: {
          zh: [
            "将被攻击且无法解除即为将死，棋局结束。与国际象棋不同，「困毙」——轮到走棋却没有任何合法着法——在象棋里也算输，不是和棋。所以残局中把对方逼到无路可走同样是赢法。",
            "演示局面：红兵在 e9 控制着 d9 和 e10，黑将在 d10 无处可去，轮到黑走——黑方困毙，红胜。另外，长将（连续将军不变着）是禁止的，会被判负。",
          ],
          en: [
            "A general attacked with no escape is checkmated and the game ends. Unlike chess, stalemate — having no legal move — is also a loss in xiangqi, not a draw, so squeezing the opponent out of moves is a legitimate way to win.",
            "Demo position: red's soldier on e9 controls d9 and e10, black's general on d10 has nowhere to go, and it's black's turn — stalemate, red wins. Perpetual check is forbidden and loses.",
          ],
        },
        position: { fen: "3k5/4P4/9/9/9/9/9/9/9/4K4 b - - 0 1" },
      },
      {
        id: "opening",
        title: { zh: "一个开局用一辈子：中炮对屏风马", en: "One opening for life: Central Cannon vs Screen Horses" },
        body: {
          zh: [
            "中炮：第一步炮二平五，炮指向对方中兵和将，直接威胁。屏风马：黑方以马 2 进 3、马 8 进 7 两马护住中卒，像屏风一样。这是象棋史上最主流的开局体系，从街头到全国赛都在用。",
            "演示了前三回合：红方中炮、马二进三、车一平二；黑方屏风双马、车 9 进 1。原则和国际象棋相通：先出大子，护住中路，车尽快上线。",
          ],
          en: [
            "Central Cannon: red's first move puts a cannon on the centre file, aiming at black's central soldier and general. Screen Horses: black develops both horses to protect the centre soldier like a screen. It's the most mainstream opening system in the game's history, from street corners to national championships.",
            "The demo shows three moves each: red's central cannon, horse and chariot; black's two horses and a chariot lift. The principles echo chess: develop major pieces, guard the centre, get the chariots into play.",
          ],
        },
        position: { fen: XIANGQI_START, moves: ["h3e3", "h10g8", "h1g3", "b10c8", "i1h1", "a10a9"] },
      },
    ],
  },
  {
    slug: "shogi-basics",
    game: "shogi",
    title: { zh: "日本将棋入门：会被吃的子，会回来的兵", en: "Shogi Basics: Captured Pieces Come Back" },
    description: {
      zh: "八种棋子、成金与打入。理解「持驹」这一条规则，就理解了将棋为什么越下越激烈。",
      en: "Eight pieces, promotion and drops. Understand the single rule of pieces in hand and you understand why shogi only gets sharper.",
    },
    level: { zh: "入门", en: "Beginner" },
    minutes: 35,
    steps: [
      {
        id: "board",
        title: { zh: "棋盘与初始布局", en: "The board and the starting position" },
        body: {
          zh: [
            "9×9 的格子棋盘，棋子是五角形木片，尖端指向对手。双方棋子完全相同，靠方向区分。先走的一方叫先手，后走的叫后手（本站先手在下方）。每方 20 子：王 1、金 2、银 2、桂 2、香 2、角 1、飞 1、步 9。",
            "记谱用「筋（列）+ 段（行）」：列从右到左 1–9，行从上到下一到九，如 7六步。棋盘最上三行是先手的敌阵，最下三行是后手的敌阵——进入敌阵是「成」的条件。",
          ],
          en: [
            "A 9×9 board of squares; pieces are pentagonal tiles pointing at the opponent. Both sides' pieces are identical and distinguished only by direction. The first player is sente, the second gote (sente at the bottom here). Each side has 20 pieces: 1 king, 2 golds, 2 silvers, 2 knights, 2 lances, 1 bishop, 1 rook, 9 pawns.",
            "Notation is file + rank: files 1–9 from right to left, ranks one to nine from top to bottom, e.g. P-7f. The far three ranks are each side's promotion zone.",
          ],
        },
        position: { fen: SHOGI_START },
      },
      {
        id: "short-pieces",
        title: { zh: "步、香、桂、银、金", en: "Pawn, lance, knight, silver, gold" },
        body: {
          zh: [
            "步向前走一格，吃子也是向前（与国际象棋不同）。香向前直线任意远。桂像国际象棋的马但只能向前跳（前两格再左右一格），也能跳过棋子。银走前方三格和后方两斜格；金走前方三格、左右和正后方——金和银像一对互补的手。",
            "演示：先手步从 g3 到 g4，后手步从 c7 到 c6，先手银从 g1 斜进 f2，后手银从 c9 斜进 d8。注意这枚后手棋子是银，不是金。",
          ],
          en: [
            "The pawn moves and captures one square straight ahead (unlike chess). The lance moves any distance straight forward. The knight jumps like a chess knight but only forward, two ahead and one to the side, and may jump over pieces. The silver moves to the three squares ahead and the two diagonally behind; the gold to the three ahead, the two sides and straight back — a complementary pair.",
            "Demo: a sente pawn advances g3–g4, a gote pawn answers c7–c6, sente's silver steps g1–f2, and gote's silver steps c9–d8. The latter is a silver, not a gold.",
          ],
        },
        position: { fen: SHOGI_START, moves: ["g3g4", "c7c6", "g1f2", "c9d8"] },
      },
      {
        id: "long-pieces",
        title: { zh: "飞、角与王", en: "Rook, bishop and king" },
        body: {
          zh: [
            "飞车走直线任意远，角行走斜线任意远，与国际象棋的车、象相同，是双方各自唯一的大子。王每次一格，任何方向。棋子价值的大致排序：飞 > 角 > 金 ≈ 银 > 桂 ≈ 香 > 步，但在将棋里「手里的子」也算子力。",
            "演示的空棋盘上：角从 b2 斜飞到 f6，后手王避开，飞车 h2 直冲 h8。",
          ],
          en: [
            "The rook moves any distance in straight lines, the bishop any distance diagonally — the same as in chess, and each side has just one of each. The king moves one square in any direction. Rough ranking: rook > bishop > gold ≈ silver > knight ≈ lance > pawn — but in shogi, pieces in hand count as material too.",
            "Demo on an open board: the bishop flies b2–f6, the gote king steps aside, the rook charges h2–h8.",
          ],
        },
        position: { fen: "4k4/9/9/9/9/9/9/1B5R1/4K4[-] w - - 0 1", moves: ["b2f6", "e9d9", "h2h8"] },
      },
      {
        id: "promotion",
        title: { zh: "成：进入敌阵翻面", en: "Promotion: flip on entering the enemy camp" },
        body: {
          zh: [
            "棋子进入、离开或在敌阵（对方那边三行）内移动时，可以选择翻面「成」。步、香、桂、银成后都变成「金」的走法（と金、成香、成桂、成银）；角成「龙马」，加上王的走法；飞成「龙王」，加上斜走一格。王和金不能成。",
            "成是可选的（桂、香、步走到最后无法再动时必须成）。演示：先手步从 g7 进到 g8 并成为と金——它现在能横走、后退，比一枚步强得多。",
          ],
          en: [
            "When a piece enters, leaves or moves within the enemy camp (the far three ranks), it may flip to promote. Pawn, lance, knight and silver all promote to gold's movement; the bishop becomes a dragon horse (adds king moves), the rook a dragon king (adds diagonal steps). King and gold never promote.",
            "Promotion is optional except when the piece could never move again. Demo: a sente pawn moves g7–g8 and promotes to a tokin — it can now move sideways and back, far stronger than a pawn.",
          ],
        },
        position: { fen: "4k4/9/6P2/9/9/9/9/9/4K4[-] w - - 0 1", moves: ["g7g8+"] },
      },
      {
        id: "drops",
        title: { zh: "持驹与打入：将棋的灵魂", en: "Pieces in hand and drops: the soul of shogi" },
        body: {
          zh: [
            "吃掉的对方棋子成为你的「持驹」，之后任何一手都可以把它放回棋盘任何空格，作为己方的未成棋子。这一手叫「打入」。所以将棋里子力从不消失，只是换了主人。",
            "打入可以进入敌阵，但这一步不成。步、香不能打入末排，桂不能打入末两排；步不能打在已有己方未成步的列（二步）；禁止打步立即将死（打步诘）。其它子可以打入将死。演示：先手持金和银，先打金将军，王逃开，再打银追击。",
          ],
          en: [
            "Captured enemy pieces become pieces in hand; on any later turn you may place one on any empty square as your own unpromoted piece. This is a drop. Material never disappears in shogi — it only changes hands.",
            "Drops may enter the promotion zone but do not promote. Pawn and lance cannot drop on the last rank, nor knight on the last two. A pawn cannot drop on a file with a friendly unpromoted pawn (nifu), or deliver immediate checkmate. Other piece drops may mate. Demo: drop a gold with check, the king flees, then drop a silver.",
          ],
        },
        position: { fen: "4k4/9/9/9/9/9/9/9/4K4[GS] w - - 0 1", moves: ["G@d8", "e9f9", "S@f8"] },
      },
      {
        id: "mate",
        title: { zh: "诘将棋：一步将死", en: "Tsume: mate in one" },
        body: {
          zh: [
            "王被攻击且无法解除即为「诘」。因为有打入，将棋的终盘几乎总是靠手里的子完成攻杀。「诘将棋」是日本传统的将棋谜题：给定局面，用连续将军把王诘死。",
            "演示的一手诘：先手手里有金，步已经顶在 e7。金打入 e8——它被步保护着，王吃不了；后手的香只能向前走，无法回吃；王周围的格子全被金控制。一手，诘。",
          ],
          en: [
            "A king attacked with no escape is mated. Because of drops, shogi endgames are almost always finished with pieces from hand. Tsume-shogi — mate-in-n puzzles solved with continuous checks — is a centuries-old tradition.",
            "The demo is a mate in one: sente holds a gold and a pawn is already on e7. Drop the gold on e8 — protected by the pawn, so the king can't take it; gote's lance only moves forward and can't capture back; every escape square is covered. One move, mate.",
          ],
        },
        position: { fen: "3lk4/9/4P4/9/9/9/9/9/4K4[G] w - - 0 1", moves: ["G@e8"] },
      },
      {
        id: "strategy",
        title: { zh: "围与攻：一局棋的形状", en: "Castle and attack: the shape of a game" },
        body: {
          zh: [
            "将棋的中盘有清晰的分工：一边用金银为王搭「围」（如美浓围、矢仓），另一边用飞车、角、桂、香组织进攻。常见的节奏是：开局十几手先摆好围，再发动攻势；被吃的子越多，手里的弹药也越多。",
            "初学建议：先用「棒银」——银配合飞车沿一条纵线直推——练进攻的手感，同时把王移到飞车的反方向再围起来。把这两件事做熟，你就能下一盘有形状的将棋。",
          ],
          en: [
            "The shogi middlegame has a clear division of labour: golds and silvers build a castle around the king (Mino, Yagura and others) while the rook, bishop, knights and lances organise the attack. The typical rhythm: a dozen moves to castle, then attack — and every capture adds ammunition to your hand.",
            "For beginners: try the Climbing Silver — a silver marching up alongside the rook — to feel how attacks work, while moving your king to the opposite side and castling it. Master those two and your games will have a shape.",
          ],
        },
        position: { fen: SHOGI_START },
      },
    ],
  },
];
