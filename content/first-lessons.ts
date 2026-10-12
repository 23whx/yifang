import type { Tutorial, TutorialStep } from "./tutorials";
import type { GameSlug } from "./games";
import { beginnerHandbook } from "./beginner-handbook";
const l = (zh: string, en: string) => ({ zh, en });
const step = (
  id: string,
  zh: string,
  en: string,
  z: string[],
  e: string[],
  fen?: string,
): TutorialStep => ({
  id,
  title: l(zh, en),
  body: { zh: z, en: e },
  ...(fen ? { position: { fen } } : {}),
});
const starts = {
  chess: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  xiangqi:
    "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
  shogi:
    "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL[] w - - 0 1",
};
const make = (game: GameSlug, steps: TutorialStep[]): Tutorial => ({
  game,
  slug: `${game}-first-lesson`,
  title:
    game === "cube"
      ? l("第一课：认识魔方部件与转动记号", "Lesson 1: Cube Parts and Turns")
      : ["mahjong", "holdem", "baccarat"].includes(game)
        ? l(
            "第一课：认识牌张与基本规则",
            "Lesson 1: Tiles, Cards and Basic Rules",
          )
        : l("第一课：棋子功能与基本规则", "Lesson 1: Pieces and Basic Rules"),
  description: l(
    game === "cube"
      ? "认识中心块、棱块、角块，学会分清转面与转视角，并逐步练习 R、U 与逆转记号。"
      : "从器具、坐标和目标开始，理解合法操作、常见误区，再通过具体局面逐步验证。",
    game === "cube"
      ? "Identify centres, edges and corners; distinguish face turns from camera rotation and practice R, U and inverse turns step by step."
      : "Start with equipment, coordinates and objectives; learn legal actions and common mistakes through concrete examples.",
  ),
  level: l("零基础", "First steps"),
  minutes: ["baccarat", "holdem", "mahjong"].includes(game) ? 40 : 35,
  steps: [...beginnerHandbook[game], ...steps, ...(["chess", "xiangqi", "shogi"].includes(game) ? [{
    id: "guided-opening",
    title: l("现在动手：双方轮流的第一组着法", "Your turn: an opening sequence for both sides"),
    body: {
      zh: ["点“我来走”，按提示先点要走的棋子，再点目标格。双方都由你来走，这样能看清轮流的节奏。这只是一条教学路线，别的合法开局也可以。", "每走一步，先看高亮的起点和终点，再读下一步提示。走错了可以退回重来，也可以切回观看演示。正式比赛一般不允许悔棋。"],
      en: ["Choose Try the moves, then select each indicated piece and its destination. You play both sides so you can see how turns alternate. This is one teaching line; other legal openings are fine too.", "After each move, look at the highlighted origin and destination before reading the next prompt. You can step back and retry or switch to watching the demo. Real games usually do not allow take-backs."],
    },
    position: { fen: starts[game as keyof typeof starts], moves: game === "chess" ? ["e2e4", "e7e5", "g1f3", "b8c6"] : game === "xiangqi" ? ["b3e3", "b8e8", "h1g3", "h10g8"] : ["e3e4", "e7e6", "g1f2", "g9f8"] },
  }] : [])],
});
export const firstLessons: Tutorial[] = [
  make("chess", [
    step(
      "setup",
      "先认识棋盘与目标",
      "Board, turns and objective",
      [
        "8×8 棋盘，右下角为白格。每方 16 子，后站同色格。白先黑后，每回合走一子；除易位外，一步只移动一个棋子。",
        "将死对方王即获胜。王不会被实际吃掉；不能把自己的王留在受攻击的位置。没有合法着法但未被将军叫逼和，是和棋。",
      ],
      [
        "Use an 8×8 board with a light square at the near right. Each side has 16 pieces; queens start on their own colour. White moves first, one move per turn; castling is the exception that moves two pieces.",
        "Win by checkmate, not by physically capturing the king. A move may not leave your king attacked. No legal move without being in check is stalemate, a draw.",
      ],
      starts.chess,
    ),
    step(
      "pieces",
      "六种棋子的功能与走法",
      "All six pieces",
      [
        "王 ♔：任意方向走一格，要始终保护好它。后 ♕：横、竖、斜都能走任意远，是最强的棋子。车 ♖：横、竖走任意远。象 ♗：斜着走任意远，永远待在同一种颜色的格子上。这几种棋子都不能跳过别的棋子。",
        "马 ♘：先直走两格，再横走一格，像个“L”，而且可以跳过棋子。兵 ♙：只能向前走一格；第一次走时可以一次走两格（前面两格都要是空的）。兵吃子是斜向前一格，而且永远不能后退。兵走到最后一行时，必须变成后、车、象或马，这叫“升变”。",
        "除了兵以外，吃子的走法和平时一样：走到对方棋子所在的格子，把它拿走。不能走到自己棋子占着的格子。",
      ],
      [
        "King ♔: one square in any direction — keep it safe. Queen ♕: any distance along ranks, files or diagonals; the strongest piece. Rook ♖: any distance along ranks and files. Bishop ♗: any distance diagonally, so it always stays on one colour. None of these can jump over other pieces.",
        "Knight ♘: two squares in a straight line, then one to the side — an \"L\" — and it may jump over pieces. Pawn ♙: one square forward; on its very first move it may go two, if both squares are empty. A pawn captures one square diagonally forward and can never move backwards. A pawn that reaches the last rank must become a queen, rook, bishop or knight: this is promotion.",
        "Except for pawns, a piece captures the same way it moves: land on the enemy piece's square and remove that piece. You can never land on one of your own pieces.",
      ],
      starts.chess,
    ),
    step(
      "special-rules",
      "将军、易位与吃过路兵",
      "Check, castling and en passant",
      [
        "被将军时必须立即解除：移王、吃攻击子、或挡住攻击线；马将军无法垫子阻挡。",
        "易位要求王与对应车从未动过，中间无子，王当前、经过与落点均不受攻击。吃过路兵仅能紧接着对方相邻兵两格前进的那一手进行，且仍不得暴露己王。",
        "同一局面重复出现三次，或者连续 50 回合没有吃子也没有走兵，一方可以申请和棋；出现五次重复与 75 回合时则自动和棋。不过如果最后一步正好将死，以将死为准。判断“同一局面”时，不仅看棋子摆放，还要看轮到谁走、能否易位、能否吃过路兵。",
      ],
      [
        "Answer check by moving the king, capturing the attacker or blocking its line. A knight check cannot be blocked.",
        "Castling requires an unmoved king and rook, an empty path, and a king that is not in check and crosses and lands on unattacked squares. En passant is available only immediately after the adjacent enemy pawn’s two-square advance and cannot expose your king.",
        "If the same position occurs three times, or 50 moves pass with no capture and no pawn move, a player may claim a draw; at five repetitions or 75 moves the draw is automatic. If the last move happens to be checkmate, the mate stands. A \"same position\" means the same pieces and also the same side to move and the same castling and en-passant rights.",
      ],
      starts.chess,
    ),
  ]),
  make("xiangqi", [
    step(
      "setup",
      "棋盘、轮次与胜负",
      "Board, turns and victory",
      [
        "9 路 10 线，棋子落在交叉点上。每方 16 子，红先黑后，每手移动一子。己子不能重叠，吃子即替换敌子。",
        "帅／将被攻击叫将军，必须解除；无解为将死。轮到你却无合法着法为困毙，也判负。两将不可在没有隔子的同一路直接照面。",
      ],
      [
        "Play on the intersections of nine files and ten ranks. Each side has 16 pieces; red moves first. Move one piece per turn. Capture by replacing an enemy piece; friendly pieces cannot share a point.",
        "An attacked general is in check and must escape. Checkmate loses, and having no legal move also loses. The generals may never face each other along an empty file.",
      ],
      starts.xiangqi,
    ),
    step(
      "pieces",
      "七种棋子的走法",
      "How the seven pieces move",
      [
        "帅／将：在九宫里横着或竖着走一格。仕／士：在九宫里斜着走一格。相／象：斜着走两格（走“田”字），不能过河；“田”字中间有棋子挡住就不能走，这叫“塞象眼”。",
        "车：横竖直线，走多远都行，但不能跳过棋子。马：先直走一格，再斜着往外走一格（走“日”字）；第一步那一格被任何棋子占住就走不了，这叫“蹩马腿”。炮：平时走法和车一样；吃子时，它和目标之间必须恰好隔着一枚棋子（叫“炮架”，红黑都可以）。",
        "兵／卒：没过河时只能向前走一格；过河后可以向前或左右走一格。兵永远不能后退，走到底也不会变成别的棋子。兵吃子和走法一样。",
      ],
      [
        "General: one point along a line, inside the palace. Advisor: one point diagonally, inside the palace. Elephant: exactly two points diagonally and never across the river; any piece on the midpoint blocks it (\"blocking the elephant's eye\").",
        "Chariot: any distance along a line, but it cannot jump over pieces. Horse: one point straight, then one point diagonally outward; a piece on that first point blocks the move (\"hobbling the horse's leg\"). Cannon: moves like a chariot, but to capture it must jump over exactly one piece of either colour — the \"screen\".",
        "Soldier: one point forward before crossing the river; after crossing, one point forward or sideways. A soldier never moves backwards and never promotes. It captures the same way it moves.",
      ],
      starts.xiangqi,
    ),
    step(
      "blocked",
      "为什么马和象不能走",
      "Blocked horses and elephants",
      [
        "看初始布局：b1 的红马不能去 d2，因为 c1 的红相堵住右侧马腿；要去 a3 或 c3，检查的却是 b2。不是目标格空着就能走。",
        "c1 的红相去 e3 时，必须经过 d2 这个象眼；初始 d2 是空点，因此相三进五可以走。若把任意棋子放在 d2，这步就被禁止。后续入门教程有专门的解堵演示。",
        "先检查路径与阻挡，再检查走后是否暴露帅。若两将之间只有你的一个子，这个子通常不能随意横移离开该路。",
      ],
      [
        "At the start, the red horse on b1 cannot go to d2: the elephant on c1 blocks its right leg. For a3 or c3, inspect b2 instead. An empty destination alone is not enough.",
        "The elephant on c1 needs d2 empty to reach e3. It is empty in the starting position, so that move is allowed. Any piece on d2 would block the eye. The next tutorial demonstrates clearing such blockers.",
        "Check the path first, then whether the move exposes your general. A sole piece between the generals cannot simply move sideways off their file.",
      ],
      starts.xiangqi,
    ),
  ]),
  make("shogi", [
    step(
      "setup",
      "棋盘与持驹",
      "Board and pieces in hand",
      [
        "9×9 棋盘，每方 20 子，以五角棋子的尖端区分阵营。先手先走。目标是将死对方王。每手可以移动一子，或打入一枚持驹。",
        "吃来的棋子去掉升变成为己方持驹，以后可打入空格。所有移动都不得让己王受攻击。",
      ],
      [
        "The 9×9 board has 20 pieces per side, identified by the direction they point. Sente moves first. Win by checkmate. Each turn either move a piece or drop one from hand.",
        "A captured piece loses promotion and joins your hand. Later you may drop it on an empty square. No action may leave your king attacked.",
      ],
      starts.shogi,
    ),
    step(
      "pieces",
      "八种棋子的完整走法",
      "All eight pieces",
      [
        "先把名字和棋盘上的字对应起来。王（王／玉）：任意方向走一格。金将（金）：向前三格（正前、左前、右前）、左右、正后方都能走一格，只有斜后方不能走。银将（銀）：向前三格和两个斜后方都能走一格，不能横走，也不能直退。",
        "飞车（飛）：横竖直线走任意远。角行（角）：斜线走任意远。香车（香）：只能向正前方走任意远。这三种路上都不能有棋子挡着。桂马（桂）：向前两格再向左或右一格，可以跳过棋子。步兵（歩）：向前走一格，吃子也是向前。“前”是对棋子主人而言的；两边棋子字一样时，看尖头朝向判断是谁的。",
      ],
      [
        "Match each name to the character on the board. King (王 / 玉): one step in any direction. Gold (金): one step forward, diagonally forward, sideways or straight back — every direction except the two backward diagonals. Silver (銀): one step forward, diagonally forward or diagonally back — not sideways and not straight back.",
        "Rook (飛): any distance along ranks and files. Bishop (角): any distance diagonally. Lance (香): any distance straight forward only. None of these three can pass another piece. Knight (桂): two squares forward and one to the side, jumping over pieces. Pawn (歩): one step forward, and it captures forward too. \"Forward\" depends on who owns the piece; when two pieces show the same character, the point tells you whose it is.",
      ],
      starts.shogi,
    ),
    step(
      "promotion-drops",
      "升变与不能打入的位置",
      "Promotion and drop restrictions",
      [
        "进入、离开或在敌阵三排内移动时可成：步、香、桂、银改走金；角增加横竖一格；飞增加斜一格。王和金不成。步香到末排、桂到末两排必须成。",
        "打入本身不成，但可打入敌阵。不可把步香打到末排、桂打到末两排；不可在已有己方未成步的列再打步（二步）；禁止打步立即将死，但走步将死及其它子打入将死合法。",
        "同一局面、同一方走棋出现四次，叫“千日手”，通常要重下一局；但如果是一方连续将军造成的重复，连续将军的那一方判负。王走进对方阵地叫“入玉”，进去不等于赢，后续按比赛规则计点判定。",
      ],
      [
        "A move into, out of or within the far three ranks may promote: pawn, lance, knight and silver gain gold movement; bishop adds orthogonal steps; rook adds diagonal steps. Kings and golds never promote. Pawns and lances must promote on the last rank, knights on the last two.",
        "Drops do not promote, but may enter the promotion zone. Never drop pawn or lance on the last rank, or knight on the last two. No pawn drop on a file with your unpromoted pawn (nifu), and no immediate pawn-drop mate. Moving a pawn to mate or dropping another piece to mate is legal.",
        "When the same position with the same side to move occurs four times, it is sennichite and the game is normally replayed — unless the repetition comes from one side checking continuously, in which case the checking side loses. A king that walks into the enemy camp has \"entered\" (nyūgyoku); that alone does not win, and the outcome is settled by points under the event's rules.",
      ],
      starts.shogi,
    ),
  ]),
  make("go", [
    step(
      "stones",
      "黑白棋子与落点",
      "Stones and intersections",
      [
        "围棋的每枚棋子功能相同。黑先白后，轮流把一子落在空交叉点；落下后不再移动。标准棋盘 19×19，新手先用 9×9。可以停一手。",
        "与棋类不同，目标是占据更多空间，而非将死国王。本站练习使用面积计分与白贴 7.5 目。",
      ],
      [
        "All stones have the same power. Black starts; alternate placing one stone on an empty intersection. Stones never move afterward. Standard Go uses 19×19; start with 9×9. Passing is allowed.",
        "The aim is to control more space, not to mate a king. This practice uses area scoring and 7.5 komi for White.",
      ],
    ),
    step(
      "liberties",
      "气、连接与提子",
      "Liberties, groups and capture",
      [
        "一块棋的气是与它横竖相邻的空点，斜邻不算。横竖相连的同色子组成一块，共享所有气。",
        "落子后先提走无气的敌棋，再检查自己的棋块是否有气；不能自杀。对方整块只剩一口气叫打吃。",
      ],
      [
        "Liberties are empty points orthogonally adjacent to a group; diagonals do not count. Orthogonally connected friendly stones share their liberties.",
        "After a move, first remove enemy groups with no liberties, then check your own group. Suicide is forbidden. A group with one remaining liberty is in atari.",
      ],
    ),
    step(
      "ko-end",
      "劫、两眼与终局",
      "Ko, eyes and ending",
      [
        "劫禁止立即把棋盘变回旧局面。本站使用局面超级劫：落子不得重现本局之前的棋盘；停一手不受此限制。",
        "真眼是对手无法合法填入的内部空点；两只独立真眼通常可让一块棋存活，假眼不算。双活等情况不能只靠数眼判断。",
        "双方连续停一手进入终局确认。在棋盘上标记双方同意的死子，确认后移除，再数活子与只被一方包围的空点。双方接触的空域不计；有争议就恢复对局。",
      ],
      [
        "Ko prevents immediate repetition. This practice uses positional superko: a stone move cannot recreate any previous board; passes are exempt.",
        "A true eye is an internal point the opponent cannot legally fill. Two separate true eyes generally keep a group alive; false eyes do not. Seki and other cases need more than simply counting eyes.",
        "Two consecutive passes start scoring review. Mark mutually agreed dead groups, then remove them before counting living stones and empty regions bordered by only one colour. Shared regions count for neither side. Resume play if there is disagreement.",
      ],
    ),
  ]),
  make("cube", [
    step(
      "parts",
      "中心、棱与角",
      "Centers, edges and corners",
      [
        "三阶魔方有 6 个中心、12 个双色棱块、8 个三色角块。中心之间的相对关系不变，决定各面最终颜色。",
        "目标是六面各自同色，且每块都与周围中心匹配。只能整层转动，不能独立扭角或拆换贴纸。",
        "观察练习：先找只有一个外露颜色的中心块，再找两个颜色的棱块和三个颜色的角块。例如白红棱块最终必须夹在白中心与红中心之间；白红蓝角块必须位于这三种中心相交的角上。",
        "常见误区：拼出一整面白色不等于还原第一层，还要检查四周侧色是否与中心对齐。中心是参照，棱块不会变成角块。",
      ],
      [
        "A 3×3 has six centres, twelve two-colour edges and eight three-colour corners. Centres keep their relative positions and determine each face’s final colour.",
        "Solve all six faces, matching every piece to its neighbouring centres. Turn whole layers; do not twist individual corners or swap stickers.",
        "Find a one-colour centre, a two-colour edge and a three-colour corner. The white-red edge belongs between the white and red centres; the white-red-blue corner belongs where those three faces meet.",
        "A white face alone is not a solved first layer: check its side colours against the centres. Edges never become corners.",
      ],
    ),
    step(
      "moves",
      "基本操作与记号",
      "Controls and notation",
      [
        "U 上、D 下、L 左、R 右、F 前、B 后。面向被转动的面看：单字母顺时针 90°，加撇号逆时针 90°，加 2 转 180°。",
        "拖动魔方外的空白旋转观察视角，拖贴纸转层。先到记号教程练习，再进入层先法，不必一次背完所有公式。",
      ],
      [
        "U up, D down, L left, R right, F front, B back. Looking directly at the face being turned: a letter is 90° clockwise, an apostrophe is 90° counterclockwise, and 2 is 180°.",
        "Drag empty space to orbit the view and stickers to turn layers. Practice the notation lesson before the beginner’s method; you need not memorize everything at once.",
      ],
    ),
    {
      ...step(
        "right-inverse",
        "练习一：R 与 R′ 互相抵消",
        "Practice 1: R and R prime",
        [
          "先点本节标题选中这个案例，再按「下一步」。第一步 R 只把右层转 90°：盯住右上前方的那个角块，看它和同一层的棱块一起移动，左边那层不动。",
          "第二步 R′ 朝反方向转回 90°。两步做完，魔方应该回到原来的还原状态；想对比可以点「退一步」。判断顺时针时，要想象自己正对着右面看，而不是看屏幕的正面。",
        ],
        [
          "Select this section and use Next move. R turns only the right layer 90°. Follow the front-upper-right corner as it moves with the edges on that layer; the left layer stays still.",
          "R prime reverses the turn. The cube should return to its solved start. Use Back one to compare. Clockwise is judged looking directly at the right face, not at the front of the screen.",
        ],
      ),
      alg: "R R'",
    },
    {
      ...step(
        "half-turn",
        "练习二：半圈等于两次四分之一圈",
        "Practice 2: half turns",
        [
          "R2 表示右面转 180°，不是转两个不同的面。先做 R2，再分两步做 R′、R′。",
          "总共转了 180° − 90° − 90° = 0°，所以最后回到原样。练习时保持拿法不变；在网页上转动视角只是换了镜头方向，不会改变模型里 R、U 指的面。",
        ],
        [
          "R2 turns the right face 180°, not two different faces. Follow it with R prime twice, one move at a time.",
          "The total is 180 minus 90 minus 90 degrees, returning to the start. Keep your reference orientation: orbiting the camera does not redefine the model's R and U axes.",
        ],
      ),
      alg: "R2 R' R'",
    },
    {
      ...step(
        "order",
        "练习三：顺序不同，结果不同",
        "Practice 3: order matters",
        [
          "逐步执行 R U R′ U′：右、上、右逆、上逆。虽然每个面都有一次正转和一次逆转，但中间夹了另一层的转动，结果不会抵消成还原态。",
          "完成后不要认为操作错了。这是观察组合影响的练习，不是万能还原公式。复位后重试，用角块的三种颜色追踪它，而不是只盯一张贴纸。",
        ],
        [
          "Step through R U R prime U prime. Each face has a forward and inverse turn, but the interleaving means they do not cancel.",
          "An unsolved result is expected. This teaches move order, not a universal solving algorithm. Reset and track a corner by all three colours, not just one sticker.",
        ],
      ),
      alg: "R U R' U'",
    },
  ]),
  make("mahjong", [
    step(
      "tiles",
      "认识 136 张基础牌",
      "Meet the 136 tiles",
      [
        "万、条、筒各 1–9，每张四枚，共 108 张。东南西北四风与中发白三箭，各四枚，共 28 张字牌。花牌取决于规则，本课不使用。",
        "同数同花三张是刻子，同花连续三张是顺子，相同两张是对子。字牌不能组成顺子。",
      ],
      [
        "Characters, bamboo and dots each have ranks 1–9 in four copies: 108 suit tiles. Four winds and three dragons have four copies each: 28 honours. Flowers depend on the rules and are excluded here.",
        "Three identical tiles form a triplet; three consecutive ranks in one suit form a sequence; two identical tiles form a pair. Honours cannot make sequences.",
      ],
    ),
    step(
      "turns",
      "摸打、吃碰杠与和牌",
      "Draw, discard, calls and winning",
      [
        "四人轮流：通常保持 13 张，摸一张到 14 张后打一张。庄家首轮先打。基础和牌形为四组面子加一对将；七对等特殊牌型另学。",
        "吃只可取上家的弃牌补顺子；碰可取任何人的弃牌补刻子。杠为四张相同牌，须补牌；杠计一组面子，实际持牌数随杠增加。吃碰后直接打牌，不另摸牌。",
        "国标通常要求至少 8 番（花牌不计起和番），日麻须至少一役，宝牌本身不是役。本课教公共结构，不能把“凑成四组一对”当成所有规则下都合法和牌。",
      ],
      [
        "Four players alternate. Normally hold 13 tiles, draw to 14 and discard one; the dealer starts by discarding. The basic winning shape is four sets and a pair, with special hands learned separately.",
        "Chow takes only the previous player’s discard for a sequence; pung can take any player’s discard for a triplet. Kong uses four identical tiles and requires a replacement draw. It counts as one set, increasing the physical tile count. After chow or pung, discard without drawing.",
        "Chinese Official normally requires eight points excluding flowers. Riichi requires at least one yaku; dora alone is not a yaku. A four-sets-and-pair shape is not automatically a legal win under every ruleset.",
      ],
    ),
  ]),
  make("holdem", [
    step(
      "cards",
      "底牌、公共牌与牌型",
      "Hole cards, board and hand ranks",
      [
        "52 张牌，无大小王。每人两张私有底牌，最多五张公共牌，从七张中任选最强的五张：可用零、一或两张底牌。花色不分大小。",
        "从强到弱：同花顺、四条、葫芦、同花、顺子、三条、两对、一对、高牌。A 可在 A2345 顺子中作最小牌，不能组成 QKA23。皇家同花顺是最高同花顺。",
      ],
      [
        "Use 52 cards without jokers. Each player has two private cards and shares up to five board cards. Choose the best five of seven, using zero, one or two hole cards. Suits have equal rank.",
        "Strongest first: straight flush, four of a kind, full house, flush, straight, three of a kind, two pair, pair, high card. Ace may be low in A2345, not in QKA23. A royal flush is the highest straight flush.",
      ],
    ),
    step(
      "rounds",
      "四轮行动与比牌",
      "Four rounds and showdown",
      [
        "翻牌前 → 翻牌三张 → 转牌一张 → 河牌一张。行动包括弃牌、过牌（无待跟注额时）、跟注、下注和加注。按钮位顺时针轮换，盲注为强制起始投入。",
        "翻牌前通常大盲左手先行动；翻牌后按钮左侧仍在局内者先行动。单挑时按钮兼小盲，翻牌前先行动、翻牌后后行动。",
        "剩一人未弃牌就赢；否则最后比最佳五张牌，同型逐级比较点数及踢脚，完全相同则平分。练习只判断规则与牌型，不使用真钱或账户余额。",
      ],
      [
        "Preflop → three-card flop → one-card turn → one-card river. Actions include fold, check when nothing is owed, call, bet and raise. The dealer button rotates clockwise; blinds are forced initial contributions.",
        "Preflop action normally begins left of the big blind; later streets begin with the active player left of the button. Heads-up, the button posts the small blind and acts first preflop but last afterward.",
        "Win if everyone else folds; otherwise compare the best five-card hands, using ranks and kickers to break ties. Identical five-card hands split. Practice evaluates rules and hands without money or account balances.",
      ],
    ),
  ]),
  make("baccarat", [
    step(
      "values",
      "两手牌与点数",
      "Two hands and card values",
      [
        "本课使用 Punto Banco：庄与闲是两手牌的名称，并不表示你必须当庄家。A 计 1，2–9 按面值，10/J/Q/K 计 0，总和只取个位；例如 7+8=5 点。",
        "双方先各发两张，任何一方 8 或 9 为天牌，双方都停止补牌并比大小。目标是更接近 9 点，点数相同为和。",
      ],
      [
        "This lesson uses Punto Banco. Banker and Player name two hands, not roles you must take. Ace is 1, ranks 2–9 use face value, and 10/J/Q/K are 0. Keep only the final digit of the sum: 7+8 is 5.",
        "Deal two cards to each hand. If either has 8 or 9, both stand (a natural) and compare. The higher total wins, with 9 highest; equal totals tie.",
      ],
    ),
    step(
      "draw",
      "固定补牌规则",
      "The fixed drawing table",
      [
        "没有天牌时，闲 0–5 补牌、6–7 停。闲停牌时，庄 0–5 补、6–7 停。",
        "闲补了第三张时，庄这样决定：庄 0–2 点一定补；庄 3 点，除非闲第三张是 8，否则都补；庄 4 点，闲第三张是 2–7 时补；庄 5 点，闲第三张是 4–7 时补；庄 6 点，闲第三张是 6–7 时补；庄 7 点停。看第三张的点数时，10、J、Q、K 都算 0。",
        "补牌完全由规则决定，没有选牌或加牌策略。历史牌路不能改变独立预测的可靠性，练习重点是读懂点数与补牌表。",
      ],
      [
        "Without a natural, Player draws on 0–5 and stands on 6–7. If Player stands, Banker draws on 0–5 and stands on 6–7.",
        "When Player has drawn, Banker decides like this: on 0–2 Banker always draws; on 3 it draws unless Player's third card is an 8; on 4 it draws if Player's third card is 2–7; on 5 if it is 4–7; on 6 if it is 6–7; on 7 Banker stands. When reading the third card, 10, J, Q and K count as 0.",
        "Drawing is fixed by the rules: there is no card-selection or hit/stand strategy. Past outcome patterns are not a reliable prediction method. Practice focuses on totals and the drawing table.",
      ],
    ),
  ]),
];
