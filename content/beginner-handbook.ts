import type { GameSlug } from "./games";
import type { TutorialStep } from "./tutorials";

// Written as paired paragraphs, not machine-generated keyword pages. The original
// rule demonstrations follow these chapters as a reference and practice library.
const chapter = (id: string, zh: string, en: string, pairs: [string, string][]): TutorialStep => ({
  id: `beginner-${id}`, title: { zh, en }, body: { zh: pairs.map(p => p[0]), en: pairs.map(p => p[1]) },
});
export const beginnerHandbook: Record<GameSlug, TutorialStep[]> = {
  chess: [
    chapter("welcome", "先知道目标：将死对方的王", "The goal: checkmate the enemy king", [
      ["国际象棋是两个人轮流走的棋。你执白棋，对方执黑棋，白棋先走。每轮只走一步；一“步”指一次合法的移动，不一定只挪一格。", "Chess is a two-player game with alternating turns. You play White, your opponent plays Black, and White moves first. Each turn is one move — one legal action, not necessarily one square."],
      ["胜负只看王：让对方的王被攻击、而且怎么走都逃不掉，就叫“将死”，你就赢了。不需要吃光对方的棋子，王也不会真的被吃掉。第一课只学认格子和走棋，开局名称以后再说。", "The game is decided by the kings. Attack the enemy king so that it has no way to escape and you have delivered checkmate: you win. You do not need to capture every piece, and the king is never actually taken off the board. This lesson covers squares and moves; opening names can wait."],
    ]),
    chapter("address", "棋盘上的地址：怎样找到 e2", "Board addresses: finding e2", [
      ["棋盘有 8 列、8 行，棋子放在格子里。从白方这边看，列从左到右是 a 到 h，行从近到远是 1 到 8。先找到 e 列，再往上数到第 2 行，交叉的那一格就是 e2。", "The board has eight columns (files) and eight rows (ranks); pieces stand inside the squares. From White's side, files run a to h from left to right and ranks run 1 to 8 from near to far. Find the e file, count up to rank 2, and the square where they meet is e2."],
      ["开局时，你面前的第二行全是兵。最底一行从左到右是：车、马、象、后、王、象、马、车。记住“后站在同色格”：白后在 d1，白王在 e1。翻转棋盘只是换个角度看，格子的名字不变。", "At the start your second rank is full of pawns. The back rank, left to right, is rook, knight, bishop, queen, king, bishop, knight, rook. Remember \"the queen stands on her own colour\": White's queen on d1, White's king on e1. Flipping the board only changes your view; square names stay the same."],
    ]),
    chapter("first-turn", "动手试试：第一次出兵", "Try it: your first pawn move", [
      ["在“现在动手：双方轮流的第一组着法”里点“我来走”。先点 e2 上的白兵，再点 e4。兵第一次走，可以一次前进两格，但 e3 和 e4 都必须是空的。点一下棋子只是选中它，点目标格才真正走出去。", "In \"Your turn: an opening sequence for both sides\", choose Try the moves. Select the white pawn on e2, then e4. On its first move a pawn may advance two squares, as long as e3 and e4 are both empty. Selecting a piece only picks it up; selecting the destination makes the move."],
      ["接着按提示替黑方把 e7 的兵走到 e5，体会“一人一步”。现在白兵已经走过，不能再一次走两格了。另外，兵向前走、却斜着吃子，所以 e4 的白兵不能吃掉正前方 e5 的黑兵。", "Then follow the prompt to move Black's pawn from e7 to e5 and feel the rhythm of taking turns. The white pawn has now moved, so it can no longer advance two squares. Also note that pawns move straight but capture diagonally: the pawn on e4 cannot capture the black pawn directly ahead on e5."],
    ]),
    chapter("pieces", "认清六种棋子，不靠猜图案", "Recognising all six pieces", [
      ["兵一次前进一格，初次可两格，斜前吃子。车沿横线或竖线走；象沿斜线走；后可以像车或象一样走。车、象、后的路径中间不能有棋子挡住，落在敌子处就吃掉那枚敌子；不能落在自己的棋子上。", "Pawns normally advance one square, optionally two on their first move, and capture diagonally. Rooks follow ranks or files; bishops follow diagonals; queens combine both. These sliding pieces cannot pass through another piece or land on a friendly piece. Landing on an enemy piece captures it."],
      ["马走一个 L：先沿一个方向数两格，再垂直数一格，中间有子也能跳过去。王向任意方向走一格，但不能走进敌方攻击范围。记住王的安全比吃到一枚子更重要：一个看似空着的格子也可能不能去。", "A knight makes an L: two squares in one direction and one perpendicular, jumping over intervening pieces. A king moves one square in any direction but never into attack. An empty square is not necessarily a safe square for your king."],
    ]),
    chapter("ending", "将军、将死和和棋", "Check, checkmate and draws", [
      ["王正在被攻击，叫“将军”。轮到你时必须马上解决，有三种办法：把王走到安全的格子、吃掉攻击它的棋子、或者用一枚棋子挡在中间。注意马是跳着攻击的，没法挡。三种办法都不行，就是“将死”，棋局结束。", "A king under attack is in check. On your turn you must deal with it at once, in one of three ways: move the king to a safe square, capture the attacking piece, or put a piece in between. A knight's attack jumps, so it cannot be blocked. If none of the three works, it is checkmate and the game is over."],
      ["还有一种容易混淆的情况：王没有被攻击，但轮到走的一方一步合法的棋都走不了。这叫“逼和”，算平局，不是将死。双方同意，或者同一局面反复出现，也可能和棋。先分清“被将军又无路可走”（输）和“没被将军却无棋可走”（和），第二课再学特殊走法。", "Don't confuse that with stalemate: the king is not attacked, but the side to move has no legal move at all. Stalemate is a draw, not a loss. Games can also be drawn by agreement or by repeating the same position. First learn to tell \"in check with no way out\" (a loss) from \"not in check but no move\" (a draw); special moves come in Lesson 2."],
    ]),
  ],
  xiangqi: [
    chapter("welcome", "目标：守住帅，困住对方的将", "The goal: guard your general, trap theirs", [
      ["中国象棋由红黑两方轮流走，红方先走。红方的首领叫“帅”，黑方的叫“将”，名字不同，作用一样。保护好自己的帅，让对方的将无路可逃，你就赢了。不需要把对方其他棋子吃光。", "In xiangqi, Red and Black take turns, and Red moves first. Red's leader is written 帥 and Black's 將: different characters, same role — the general. Guard your general and leave the enemy general no escape to win. You do not need to capture all the other pieces."],
      ["“走一步”就是把一枚棋子从一个交叉点移到另一个允许的交叉点。目标点上有对方的棋子，就把它拿走，这叫“吃子”。不能吃自己的棋子，一回合也只能动一枚棋子。", "A move takes one piece from one intersection to another allowed intersection. If an enemy piece stands on the destination, remove it: that is a capture. You cannot capture your own pieces, and you move only one piece per turn."],
    ]),
    chapter("board", "交叉点、河界、九宫和坐标", "Intersections, river, palace and coordinates", [
      ["棋盘由 9 条竖线和 10 条横线组成，棋子放在线的交叉点上，不是放在格子里。中间那条没有竖线的空带叫“河界”。两端画着交叉斜线的 3×3 区域叫“九宫”，帅（将）和仕（士）只能待在自己的九宫里。", "The board has 9 vertical and 10 horizontal lines. Pieces stand on the intersections, not inside squares. The open band across the middle is the river. The 3×3 areas marked with diagonals at each end are the palaces; the general and advisors must stay inside their own palace."],
      ["本站用字母 a–i 和数字 1–10 标记交叉点。红方在下面时，从左往右数到 b 列，再往上数到第 3 行，就是红炮所在的 b3。“b3 → e3”就是这枚炮沿着同一条横线移到正中间那一列。传统的“炮二平五”是另一种记谱方法，第二课再学。", "This site labels intersections with letters a–i and numbers 1–10. With Red at the bottom, count across to file b and up to rank 3: the red cannon stands on b3. \"b3 → e3\" means sliding that cannon along the same line to the centre file. Traditional notation such as 炮二平五 is a different system covered in Lesson 2."],
    ]),
    chapter("pieces", "七种棋子的动作与限制", "The seven pieces and their limits", [
      ["车沿横竖直线走，不能越子。马走‘日’字，但靠近起点的那一步直线位置有子时叫‘蹩马腿’，该方向走不了。相象走两格斜线，不能过河，中间交叉点有子叫‘塞象眼’。仕士斜走一格，帅将直走一格，都不能出九宫。", "Rooks slide horizontally or vertically without jumping. Horses move in an L but are blocked if the first orthogonal step is occupied. Elephants move two diagonal steps, cannot cross the river, and are blocked at the midpoint. Advisors move one diagonal step; generals one orthogonal step, both within the palace."],
      ["炮不吃子时像车一样走；吃子时必须恰好隔一枚棋子，那枚中间的子叫‘炮架’，双方的子都可以当炮架。兵卒过河前只能前进一步，过河后可向前或横走一步，始终不能后退。", "A cannon moves like a rook when not capturing. To capture it must jump exactly one intervening piece, the screen, which may belong to either side. Soldiers move one step forward; after crossing the river they may also move one step sideways, but never backwards."],
    ]),
    chapter("first-turn", "跟做一轮，再检查为什么能走", "Follow a turn and explain its legality", [
      ["在下面带着法的示范里选择‘我来走’，按页面给出的起点和终点点击棋子。每走一步都问三件事：轮到哪方？路径有没有阻挡？走完会不会让自己的帅被攻击？绿色目标提示帮助找位置，但不能替你理解规则。", "Choose Try the moves in a demonstration below, then select the indicated origin and destination. Ask: whose turn is it, is the path blocked, and will my own general remain safe? Destination markers help you locate a move; they do not replace understanding it."],
      ["初次练炮时先观察路径：只是移动时，途中必须全空；要吃对方时，途中恰好一个炮架。‘隔得远’不是可以吃的理由，两个炮架也不能吃。下一课再练马腿和象眼，避免一次混进所有限制。", "For your first cannon exercise, inspect the path before moving. An ordinary move needs a clear path; a capture needs exactly one screen. Distance alone does not permit a capture, and two screens block it. Then practise horse and elephant blocking separately."],
    ]),
    chapter("ending", "将军、将死和“困毙”", "Check, mate and stalemate loses", [
      ["帅（将）被攻击叫“将军”。轮到你时必须先解决：移开帅、吃掉攻击它的棋子、或者挡住攻击路线。还有一条特别规则：两个帅将不能在同一条竖线上直接面对面、中间没有任何棋子。挪开挡在中间的棋子前，一定要检查这一点。", "A general under attack is in check. On your turn you must deal with it: move the general, capture the attacker, or block the line of attack. One special rule: the two generals may never face each other on the same file with nothing in between. Check this whenever you move a piece that stands between them."],
      ["被将军又没有任何合法应对，就是“将死”，输棋。和国际象棋不同的是：轮到你走时一步合法的棋都没有，即使没被将军也算输，这叫“困毙”。长将、长捉等反复局面另有专门的裁定规则，不能照搬国际象棋的和棋规定。", "Check with no legal reply is mate, and you lose. Unlike chess, having no legal move at all also loses, even without check. Long-running repeated checks or chases have their own adjudication rules; do not borrow chess's draw rules."],
    ]),
  ],
  shogi: [
    chapter("welcome", "先看方向，再认汉字", "Read the direction first, then the characters", [
      ["将棋是两人轮流走的棋，目标是将死对方的王。两方的棋子颜色一样，靠五角形的尖头朝向区分：尖头朝向对手的，就是你的棋子。先手先走，后手后走。本站棋盘下方是先手，棋子尖头朝上。", "Shogi is a two-player game with alternating turns, and the goal is to checkmate the enemy king. Both sides' pieces are the same colour; you tell them apart by the point of the five-sided piece. A piece pointing toward your opponent is yours. Sente moves first, then Gote. On this site Sente sits at the bottom and its pieces point up."],
      ["棋盘有 9×9 个格子，棋子放在格子里。“王将”和“玉将”都是王，作用完全一样。第一课不用急着记日文读音，先把王、金、银、桂、香、角、飞、步和它们的走法对上号。", "The board is 9×9 and pieces sit inside the squares. The two king characters, 王 and 玉, are the same piece. Japanese pronunciations can wait: first match king, gold, silver, knight, lance, bishop, rook and pawn to how they move."],
    ]),
    chapter("pieces", "八种棋子怎样移动", "How the eight pieces move", [
      ["王走周围一格；飞车沿横竖直线走，角行沿斜线走，它们不能越子。香车沿正前方走任意远但不能越子，也不能后退。步兵只向正前方一格，走与吃相同，不像国际象棋的兵那样斜吃或第一步走两格。", "Kings move one adjacent square. Rooks slide orthogonally and bishops diagonally without jumping. Lances slide straight forward only. Pawns move and capture one square straight forward: no diagonal capture and no initial double move."],
      ["金将能向前方三格、左右两格和正后方一格走，不能斜后退。银将能向前方三格和斜后方两格走，不能横走或直后退。桂马跳到前方两格、左右偏一格的位置，能越子但不能向后跳。先后方的‘前’互相相反。", "Golds move one square forward, forward-diagonally, sideways or straight back, but not diagonally back. Silvers move forward or on any diagonal, not sideways or straight back. Knights jump two forward and one sideways, never backward. Forward is opposite for the two players."],
    ]),
    chapter("turn", "第一步：步兵向前走一格", "First move: push a pawn one square", [
      ["本站棋盘旁标着字母和数字，练习提示会直接告诉你起点和终点，不用换算成日本棋谱。点“我来走”，先点提示的步兵，再点它正前方的格子。轮到后手时，注意它的“前方”是朝你这边，不是屏幕上方。", "The board shows letter-number coordinates, and the prompts give the start and end squares directly, so you never need to convert to Japanese notation. Choose Try the moves, select the indicated pawn, then the square straight ahead of it. When it is Gote's turn, remember that Gote's forward points toward you, not up the screen."],
      ["每走一步，都检查一下自己的王会不会被攻击。将棋也不用吃光对方的棋子才算赢。练习里双方都由你来走，是为了让你看懂流程；真正对局时当然不能替对手走。", "After every move, check whether your king can be attacked. In shogi, too, you win without capturing every piece. In the exercises you play both sides to learn the flow; in a real game you obviously cannot choose your opponent's moves."],
    ]),
    chapter("captured", "吃到的棋子，可以再放回棋盘", "Captured pieces come back into play", [
      ["吃到的对方棋子会变成你的“持驹”，放在棋盘旁边；如果它之前升级过，要翻回原来的样子。轮到你时，可以不动棋盘上的棋子，而是把一枚持驹放到任意空格上，这叫“打入”，也算完整的一步。放下时尖头朝向对手。", "An enemy piece you capture becomes one of your pieces in hand and sits beside the board; if it was promoted, it flips back to its original side. On your turn, instead of moving a piece on the board you may place a piece in hand on any empty square: a drop. A drop is a whole turn, and the piece points toward your opponent."],
      ["打入有几条限制：同一列里已经有你自己没升级的步兵时，不能再打入步兵，这叫“二步”；步兵和香车不能打在最后一行，桂马不能打在最后两行，因为放在那里以后就再也走不动了；还有，不能用刚打入的步兵直接将死对方。", "Drops have a few limits. You may not drop a pawn on a file that already has one of your unpromoted pawns (nifu, \"two pawns\"). A pawn or lance may not be dropped on the last rank, nor a knight on the last two ranks, because it could never move again. And you may not give checkmate by dropping a pawn."],
    ]),
    chapter("promotion", "升级与结束：先理解，再记条件", "Promotion and the end of the game", [
      ["靠近对手的最后三行叫升变区。符合条件的棋子移动时，只要起点或终点在区内，一般可选择翻面升级；打入当步不能升级。步、香、桂、银升级后按金走；飞升级增加斜走一格，角升级增加横竖一格。王和金不升级。", "The farthest three ranks form your promotion zone. An eligible moving piece can usually promote when its origin or destination lies there; a drop cannot promote immediately. Promoted pawns, lances, knights and silvers move as golds. Promoted rooks add one-step diagonals; promoted bishops add one-step orthogonal moves. Kings and golds do not promote."],
      ["步香走到最后一行、桂走到最后两行必须升级，否则再无走法。王被攻击时必须解除；无法解除就是将死。重复局面与连续将军另有判定，学完移动、吃子、打入、升级四件事，再进入正式对局。", "Pawns and lances reaching the last rank, and knights reaching the last two, must promote. An attacked king must escape check; if no legal response exists it is mate. Repetition and continuous checking have special rulings. Master moving, capturing, dropping and promotion before a full game."],
    ]),
  ],
  go: [
    chapter("welcome", "围棋争的是空间，不是棋子分值", "Go is about space, not piece values", [
      ["围棋两人轮流放黑白棋子，通常黑先。所有棋子的功能一样，没有王、车、兵之分。正式棋盘常用 19 路，‘路’是横线或竖线的条数；新手从 9 路开始，每次只放一枚棋子在空交叉点。", "Go alternates placements of black and white stones, normally with Black first. Every stone has the same function; there are no kings or pawns. A 19×19 board is standard, but begin on 9×9. Place one stone on an empty intersection each turn."],
      ["放下的棋子不会像象棋那样移动。你的目标是形成活着的棋群并控制空间。‘棋群’是沿横竖直接相连的一组同色棋子；斜着挨着不算直接连通。吃子是手段，不是唯一得分来源。", "Placed stones do not move around as chess pieces do. Build surviving groups and control space. A group consists of same-coloured stones connected horizontally or vertically; diagonal contact alone does not connect them. Capturing is a means, not the sole source of points."],
    ]),
    chapter("coordinates", "先找到 A8，再动手数气", "Find A8 before counting liberties", [
      ["看棋盘边缘的字母和数字。本站九路练习从 A 到 J，跳过 I；数字从底部 1 到顶部 9。A8 就是最左边一列、从底向上第八条线的交叉点，也就是左上角向下一格。不是方格中心，也不是数第八颗棋子。", "Read the letters and numbers around the board. Our 9×9 exercises use A–J, skipping I, with ranks 1 at the bottom to 9 at the top. A8 is on the leftmost file, one intersection below the top corner—not a square centre or the eighth stone."],
      ["‘气’指棋群横竖相邻的空交叉点。中央一枚孤立棋子最多四口气，边线上最多三口，角上最多两口。点击下方数气案例中的指定棋子，页面会给气编号；自己逐个数一遍，再对照答案。", "A liberty is an empty intersection directly adjacent to a group. A lone central stone can have four, an edge stone three, and a corner stone two. Click the specified stone in a counting exercise to reveal numbered liberties, then count them yourself."],
    ]),
    chapter("capture", "一口气到零口气：亲手提子", "From one liberty to none: capturing", [
      ["当一群棋子的最后一口气被对方占住，整群棋子从盘上拿走，叫‘提子’。不是只拿走紧挨着新棋子的那一颗。连接成群后大家共用气：两枚棋子共享同一个空点，只能算一口，不可重复相加。", "When an opposing group loses its last liberty, remove the entire group: capture. Do not remove only the stone nearest your move. Connected stones share liberties, and an empty point touching two stones in the same group counts only once."],
      ["练习先做角部，再做边线，最后做中央与多子棋群。落子前指出最后一口气在哪；落子后检查哪几枚子消失、哪些空点重新出现。新出现的空点可能成为你这枚新棋子的气。", "Practise a corner capture, then an edge capture, then a central and multi-stone capture. Identify the last liberty before placing. Afterwards inspect which stones disappeared and which empty points reopened; they may give your new stone liberties."],
    ]),
    chapter("illegal", "为什么看起来有空位却不能下", "Why an empty point can be illegal", [
      ["本站规则禁止自杀：落子并处理提子后，自己的棋群不能仍然没有气。注意判断顺序是先看能否提走对方，再检查自己有没有气。一个被白子围住的点，如果落黑后能提走白子，可能完全合法；不能仅凭落子前四周颜色判断。", "Our rules prohibit suicide: after placing and removing captured enemy groups, your own group must have a liberty. The order matters. A point surrounded by White may still be legal for Black if the move captures those white stones and opens liberties."],
      ["‘劫’是双方可能不断互提、回到同一局面的情况。本站练习中的基本劫规则不允许立即回提恢复上一局面，需先在别处走一步，再根据新局面判断。‘过手’是主动不落子；它不是在任意位置按暂停。", "Ko describes a possible repeated recapture. The basic ko rule in our exercises prevents immediately recapturing to recreate the previous position: play elsewhere first, then reassess. Passing means using your turn without placing a stone; it is not a pause button."],
    ]),
    chapter("finish", "什么时候结束，怎样看比分", "When to stop and how to read the score", [
      ["双方都认为继续落子没有必要时，可以连续过手进入结束阶段。先确认哪些棋群是死子，哪些是活子；有争议应继续下，不能把不确定的棋群随手删掉。‘两只眼’指棋群内部有两个独立、对方不能合法填满的眼位，是理解做活的常见起点。", "Two consecutive passes can start the ending phase. Agree which groups are dead and which survive; resume play if disputed rather than deleting uncertain groups. Two independent internal eyes are a useful starting point for understanding life."],
      ["本站本地练习采用面积式计分：盘上存活棋子，加上只由自己围住的空点；双方都不能独占的空点不归任何一方。白方另加页面显示的贴目，用于补偿后手。不要把吃掉的子再重复加一次；也不要把这一算法与日本数目法混用。远程终局时双方可以标记死子并确认；修改方案会撤销双方确认，有分歧时可恢复下棋。", "Local practice uses area-style scoring: surviving stones plus empty points exclusively surrounded by one side. Neutral points belong to neither. White receives the displayed komi for moving second. Do not add captures again or mix this with Japanese territory scoring. In remote scoring, both players can propose dead groups and approve the result. Edits revoke both approvals; disagreements can resume play."],
    ]),
  ],
  cube: [
    chapter("welcome", "魔方的目标：六个面各成一色", "The goal: one colour on every face", [
      ["三阶魔方有六个面，每面能看到 3×3 共九个色块。目标是让六个面各自变成同一种颜色，同时每个小块都回到正确的位置。只拼出一个白面还不算完成第一层：白面周围那一圈的颜色也要和侧面中心对上。", "A 3×3 cube has six faces, each showing nine stickers. The goal is one colour per face with every physical piece in its proper place. Making a white face alone does not necessarily solve the first layer: the side colours around it must also match their centres."],
      ["魔方不用轮流，你可以一直转下去。第一课只学三件事：认识部件、转一层、再把它转回来，不用急着背公式。所谓“公式”，只是一串事先写好的转动步骤，不是数学算式。", "There are no alternating turns. Your first goals are to identify parts, turn one layer and reverse it—not memorise seven sequences immediately. An algorithm is simply a written sequence of turns, not an arithmetic formula."],
    ]),
    chapter("parts", "认识三种部件：中心、棱、角", "Three kinds of pieces: centres, edges, corners", [
      ["每个面正中间只有一种颜色的小块叫“中心块”，一共 6 个；有两种颜色的叫“棱块”，一共 12 个；有三种颜色的叫“角块”，一共 8 个。贴纸是跟着小块一起动的，不会单独跑到别处。中心块之间的相对位置永远不变，所以它决定了每个面最后该是什么颜色。", "The six centres each show one colour. Twelve edges show two colours each; eight corners show three. Stickers move together with their physical piece, not independently. Centres remain fixed relative to each other and identify each face's final colour."],
      ["比如一个白绿棱块，最后应该待在白色中心和绿色中心之间；白绿红角块，最后应该在这三个中心交汇的角上。判断一个小块“归位”了，既要看位置对不对，也要看方向对不对：位置对了但翻着放，也还没有还原。", "A white-green edge belongs between the white and green centres. A white-green-red corner belongs where those three faces meet. Solved means both the correct location and orientation; a flipped piece in the right slot is still unsolved."],
    ]),
    chapter("controls", "先分清看另一面与真的转一层", "Rotating the view versus turning a layer", [
      ["拖动背景用于改变观看角度，好比拿起整个魔方换个方向看；拖动贴纸会转动一层，改变小块排列。先用后面的单步按钮学习，避免同时转视角而把左右弄反。本站初始白面朝上、绿面朝前；跟练期间尽量保持视角。", "Dragging the background changes the viewing angle, like looking around the whole cube. Dragging a sticker turns a layer and changes the arrangement. Start with the single-step controls to avoid confusing these actions. Our initial view has white up and green front; keep it steady during practice."],
      ["R 表示右面，U 表示上面，F 表示前面；L、D、B 分别是左、下、后。一个字母是正对那个面看时顺时针转四分之一圈；带撇号如 R′ 是反方向，R2 是半圈。判断 R 的顺时针时要想象从右面正对着看，不是从屏幕正面看。", "R is right, U up, F front; L, D and B are left, down and back. A plain letter turns that face a quarter-turn clockwise as viewed directly from that face. A prime, such as R′, reverses it; R2 is half a turn. For R, imagine looking directly at the right face."],
    ]),
    chapter("case", "跟做 R，再用 R′ 回到原样", "Turn R, then undo with R′", [
      ["下方‘转动与逆转’小练习先从还原态开始。点击 R，观察只有右层转动；再选择能撤销它的 R′。不是按任意另一面都能复原。做错时页面会解释并保留当前步骤，你可以重试，而不是被直接推进下一题。", "The Turn and undo exercise starts solved. Press R and observe the right layer. Then choose R′ to reverse it. Turning an arbitrary other face will not undo it. An incorrect choice keeps you on the same task with an explanation so you can retry."],
      ["学会单步后，读 R U R′ U′：先右、再上、再反右、再反上。这串动作的逆序撤销是 U R U′ R′，需要倒过来读动作并逐个反转，不能只把最后一步随便反转。操作完看六个面，不能只看正面像不像还原。", "Next read R U R′ U′ as right, up, inverse right, inverse up. Its undo sequence is U R U′ R′: reverse the order and invert every move. Inspect all six faces afterwards, not only the front."],
    ]),
    chapter("path", "从小目标走向第一次完整还原", "From small goals to a full solve", [
      ["后续层先法按白十字、白角、中层、顶层逐步学习。每节开始先核对示例的朝向和适用形态，再执行动作，最后检查本节目标以及前面已完成的部分。示范公式能处理指定案例，不代表把它对任何打乱反复执行都会成功。", "Continue through the white cross, white corners, middle layer and last layer. Before each sequence verify the orientation and required pattern; afterwards inspect its target and previously solved parts. A demonstration solves its specified case, not every possible scramble."],
      ["常见卡点是拿反前后、把顺时针判断反、漏掉撇号，以及只看白色不看侧色。出现问题先重置教学案例，逐步前进并对照每一步；不要在不知道当前状态时不停叠加公式。速度训练放在能够解释每一步之后。", "Common problems are losing orientation, reversing clockwise, missing a prime and ignoring side colours. Reset the teaching case and step through it rather than stacking sequences without knowing the current state. Speed comes after understanding."],
    ]),
  ],
  mahjong: [
    chapter("scope", "这一课学的是哪种麻将", "Which mahjong are we learning?", [
      ["麻将有很多地区规则，没有一套“标准麻将”。本课先用 136 张、不带花牌的基础牌练习三件事：摸一张、打一张，以及认出“四组三张加一对”这个最常见的完成形。这里不涉及国标的番数、日麻的役或地方的结算；牌型拼完整，也不代表在每种规则下都能和牌。", "Mahjong has many regional rules. This lesson uses a 136-tile, no-flower structural exercise: draw, discard, and recognise a basic four-sets-and-pair shape. It does not implement Chinese Official scoring, riichi yaku or regional payments; a completed shape is not automatically a legal win everywhere."],
      ["四个人各自管理手里的牌，通常由庄家先打，然后按顺序轮到下一家。这里的“庄家”只是这一局有特定开局职责的座位，和百家乐里那手叫“庄”的牌不是一回事。本课也不用下注，不要把百家乐的下注流程搬到麻将里。", "Four players manage their own hands, normally with the dealer discarding first. Dealer here means a seat with particular starting duties, not the hand called Banker in baccarat. This exercise does not require betting; importing baccarat's process would be misleading."],
    ]),
    chapter("names", "万、筒、条，以及“相同的牌”", "Characters, dots, bamboo and matching tiles", [
      ["数字牌有三种花色：万、筒、条，每种都从一到九，每张牌有四枚一模一样的。一万和一筒不是同一张牌，虽然数字都是一，也不能配成对子。东南西北和中发白是“字牌”，没有数字顺序，东南西不能当成一二三来用。", "Number tiles have three suits: characters, dots and bamboo, each numbered one to nine with four copies of every tile. One character and one dot are not identical. Winds and dragons are honours without numerical sequences; East-South-West is not equivalent to 1-2-3."],
      ["同一种花色、数字连续的三张，比如二三四万，叫“顺子”；三枚一样的牌，比如三个五筒，叫“刻子”；两枚一样的牌叫“对子”。最常见的完成形是：四组顺子或刻子，再加一个对子。注意对子必须是两张一样的牌，不是随便剩下的两张。", "Three consecutive numbers in one suit form a sequence; three identical tiles form a triplet; two identical tiles form a pair. A basic completed shape needs four sequences or triplets plus one pair. The final two tiles must match, not merely be leftovers."],
    ]),
    chapter("draw", "用 13 → 14 → 13 理解一个回合", "Understand a turn as 13 → 14 → 13", [
      ["先不考虑吃、碰、杠。轮到你之前手里有 13 张；从牌墙摸一张，变成 14 张；如果还没完成，就选一张打到弃牌区，回到 13 张，轮到下一家。“牌墙”是还没摸的牌堆；“弃牌”是已经打出去的牌，打出去就不能后悔拿回来。", "Ignore calls and kongs at first. You hold thirteen tiles before your turn, draw from the wall to fourteen, then discard one if not complete, returning to thirteen. The wall is the draw pile; discards have left your hand and cannot be swapped back on a whim."],
      ["下面这个案例的起手牌是：一二三万、四五万、二三四筒、六七八条、东、白。先摸到九筒，变成 14 张，再亲手点白板打出去。你会看到手牌少了一张、弃牌区多了一张，两边都要看一下。", "The example starts with characters 1-2-3 and 4-5, dots 2-3-4, bamboo 6-7-8, East and White Dragon. Draw dot 9 to reach fourteen, then click White Dragon to discard it. Check both the reduced hand and the new discard."],
    ]),
    chapter("finish", "摸打几轮，拼出完成形", "Build a complete shape over several turns", [
      ["其他三家各走一轮后，本例摸到六万，正好和四五万连成顺子，于是打掉刚才没用上的九筒。再过一轮，摸到东，手里的两个东就成了对子。这时整副牌可以分成：一二三万、四五六万、二三四筒、六七八条、东东。", "After the other three players take their turns, this example draws character 6 to join 4-5; discard the unconnected dot 9. After another round, draw East for the pair. The full split is characters 1-2-3, characters 4-5-6, dots 2-3-4, bamboo 6-7-8, East-East."],
      ["完成所需的最后一张是自己摸到的，叫“自摸”；用别人刚打出的牌完成，叫“荣和”或“点和”，不同规则叫法不同。本练习只确认牌型拼完整了，不判断是否满足国标八番、日麻有没有役，也没有一套通用的奖励。", "Completing with your own draw is a self-draw; completing with a discard is a discard win, with terminology varying by ruleset. This exercise validates only the shape; it does not assert a Chinese Official minimum score, a riichi yaku or a universal payout."],
    ]),
    chapter("calls", "吃、碰、杠先分开理解", "Separate sequences, triplets and kongs", [
      ["“吃”是拿上家刚打出的牌，和手里两张组成顺子；“碰”是拿任何一家刚打出的牌，和手里两张一样的牌组成刻子。吃碰后通常要把这组牌摊开放在面前，然后打出一张，这次不再摸牌。不是看到别人打出想要的牌，就能随便拿。", "A chow takes the previous player's discard to complete a sequence with two tiles from your hand. A pung takes any player's discard to complete a triplet. Expose the set, then discard without an ordinary draw. You cannot take any discard merely because you like it."],
      ["“杠”是四张一样的牌算作一组，通常要再补摸一张，所以有杠时手里的实际张数就不再是简单的 14 张。第一轮练习故意不放杠，等你能讲清普通摸打再学。之后请选一套完整的地区规则，学习和牌条件、抢杠和计分，不要把不同规则里对自己有利的条款拼在一起。", "A kong is four identical tiles treated as one set and normally requires a replacement draw, so the physical tile count differs. Our first exercise omits kongs deliberately. Later choose one complete ruleset for winning requirements, robbing a kong and scoring rather than mixing favourable rules from different variants."],
    ]),
  ],
  holdem: [
    chapter("playing-cards", "从一张牌认起：花色、数字和字母", "Start with one card: suits, numbers and letters", [
      ["先不玩，拿 A♠ 这张牌来认：A 是点数，♠ 是花色。四种花色是黑桃 ♠、红桃 ♥、梅花 ♣、方块 ♦。黑桃像尖叶子，红桃像心，梅花像三片圆叶，方块像菱形。黑桃和梅花通常印成黑色，红桃和方块印成红色；红色的牌并不比黑色的大。", "Before playing, look at one card, A♠: A is the rank and ♠ is the suit. The four suits are spades ♠, hearts ♥, clubs ♣ and diamonds ♦ — a pointed leaf, a heart, three round leaves and a diamond. Spades and clubs are usually printed black, hearts and diamonds red; red cards are not stronger than black ones."],
      ["每种花色有 13 张：A、2、3、4、5、6、7、8、9、10、J、Q、K。J 通常画侍从，Q 画王后，K 画国王，它们都不是能代替别的牌的“万能牌”。4 种花色 × 13 张 = 52 张。大小王是另外加的牌，本课不用；大小王和 K 不是一回事。", "Each suit has 13 ranks: A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K. J is the Jack, Q the Queen and K the King; none of them is a wild card. Four suits × 13 ranks = 52 cards. Jokers are extra cards not used here, and a Joker is not the same as a King."],
      ["在德州扑克里，A 通常最大，接着是 K、Q、J、10，一直到 2 最小；只有在 A2345 这个顺子里，A 当最小的 1 用。“同点数”是像 A♠ 和 A♥ 这样字母相同、花色不同；“同花色”是像 A♠ 和 7♠ 这样符号相同、点数不同。先做下面的认花色练习，再学对子和同花，就不会把这两种“相同”搞混。", "In hold'em the Ace is usually highest, then K, Q, J, 10 down to 2; only in the straight A2345 does the Ace count low, as 1. \"Same rank\" means cards like A♠ and A♥ — same letter, different suit. \"Same suit\" means cards like A♠ and 7♠ — same symbol, different rank. Do the suit-recognition exercise below before pairs and flushes so you don't mix up these two kinds of \"same\"."],
    ]),
    chapter("welcome", "你拿两张牌，大家共用五张", "Two private cards, five shared cards", [
      ["德州扑克用一副去掉大小王的 52 张牌。每人发两张只有自己能看的“底牌”，桌子中间最多再发五张大家都能用的“公共牌”。最后从自己的两张加公共的五张里，挑出最强的五张来比；底牌可以用两张、一张，甚至一张都不用。", "Texas hold'em uses a 52-card deck with no jokers. Each player gets two private hole cards, and up to five shared community cards are dealt in the middle. At the end you pick the best five cards from your two plus the five shared ones; you may use both hole cards, one, or even none."],
      ["赢一手牌有两种方式：摊牌时你的五张牌最大，或者其他人都“弃牌”了。弃牌就是退出这一手，之前放进去的筹码拿不回来。本课用两人的固定牌例讲流程，发牌是安排好的，不是赚钱方法或随机胜率演示。教学筹码不能购买、提现或兑换。", "You win a hand in one of two ways: your best five cards are strongest at showdown, or everyone else folds. Folding means leaving this hand; chips you already put in stay in the pot. This lesson walks through a fixed two-player example with arranged cards — it is not a winning strategy or a demonstration of real odds. Teaching chips cannot be bought, cashed out or exchanged."],
    ]),
    chapter("chips", "余额、筹码和底池在哪里", "Balance, chips and the pot", [
      ["“余额”是你面前还没放进去的教学筹码；“底池”是双方已经放进去的筹码总数。“按钮”标记这一手名义上的发牌位置。两人对局时，按钮方先交“小盲”，另一方交“大盲”。盲注是发牌前规定必须放的筹码，跟牌好不好无关。本例双方各有 100，小盲 5、大盲 10。", "Your balance is the teaching chips still in front of you; the pot is everything both players have already put in. The button marks the nominal dealer for the hand. In a two-player game, the button posts the small blind and the other player posts the big blind. Blinds are required bets before the cards are dealt; they say nothing about who has good cards. Here each player starts with 100, with blinds of 5 and 10."],
      ["你交小盲 5 后剩 95，对方交大盲 10 后剩 90，底池里有 15。轮到你时，“跟注”是补齐两人投入的差额，所以你只要再放 5，不是再放 10。补完后双方各剩 90，底池变成 20。算差额是新手最容易出错的地方。", "After posting the small blind you have 95; your opponent posts the big blind and has 90; the pot holds 15. When it's your turn, calling means making up the difference, so you add only 5 more, not another 10. Then you both have 90 left and the pot is 20. Working out the difference is where beginners most often slip."],
    ]),
    chapter("actions", "几个按钮分别什么时候用", "When to use each action", [
      ["没有需要补的差额时，可以“过牌”：不放筹码也不退出，把行动交给下一位。有人下注后就不能用过牌躲开了。“下注”是这一轮第一次放筹码；“跟注”是补齐对方的数额；“加注”是在补齐的基础上再提高这一轮的数额；“弃牌”是放弃这一手。", "When there is nothing to make up, you may check: add nothing, stay in, and pass the action on. Once someone has bet, you can no longer check your way out. A bet is the first chips put in during a betting round; a call matches the amount you owe; a raise matches and then increases the amount for the round; a fold gives up the hand."],
      ["本例只练跟注和过牌，加注多少、全下、边池这些以后再学。“全下”是把自己剩下的筹码全部放进去；几个人余额不同又都全下时，可能会分出“边池”。每一轮所有人都行动完，才会发下一批公共牌。", "This example only practises calling and checking; raise sizes, all-ins and side pots come later. Going all-in means putting in all your remaining chips; when several players with different stacks go all-in, side pots can form. The next community cards are dealt only after everyone has finished acting in the current round."],
    ]),
    chapter("streets", "跟着走完四个阶段", "Walk through the four stages", [
      ["你拿到 A♠ K♠，对方的底牌暂时扣着。先交盲注、跟注，这个阶段叫“翻牌前”。接着一次翻开三张公共牌 A♥、7♣、2♦，叫“翻牌”。两人对局时，翻牌后由大盲先行动：本例对方过牌，你也亲手点过牌。", "You hold A♠ K♠; your opponent's cards stay face down. First come the blinds and your call — this stage is called preflop. Then three community cards are turned up at once, A♥ 7♣ 2♦: the flop. In a two-player game the big blind acts first after the flop: here your opponent checks, and you check too."],
      ["然后发第四张公共牌 9♠，叫“转牌”，双方再各行动一次；最后发第五张 3♣，叫“河牌”，双方再行动最后一次。转牌不是把手牌转一下，河牌也不是额外的私人牌，它们都是公共牌。每一轮都要先看有没有人下注、轮到谁，不要一看到新牌就忘了顺序。", "Next comes the fourth community card, 9♠, called the turn, and another round of actions; then the fifth, 3♣, called the river, and a final round. Both are shared cards like the flop. In every round, check whether anyone has bet and whose turn it is before reacting to the new card."],
    ]),
    chapter("showdown", "摊牌：亲手核对谁赢、筹码怎么算", "Showdown: check the winner and the chips", [
      ["对方亮出 Q♥ Q♦。你的最强五张是 A♠ A♥ K♠ 9♠ 7♣，一对 A；对方是 Q♥ Q♦ A♥ 9♠ 7♣，一对 Q。都是一对时，先比对子的大小：A 比 Q 大，所以你赢。不是比七张牌的点数总和，也不是黑桃比红桃大。", "Your opponent shows Q♥ Q♦. Your best five are A♠ A♥ K♠ 9♠ 7♣ — a pair of aces. Theirs are Q♥ Q♦ A♥ 9♠ 7♣ — a pair of queens. With a pair each, compare the pairs first: aces beat queens, so you win. You never add up all seven ranks, and spades do not beat hearts."],
      ["底池 20 全部给你，你的余额从 90 变成 110，对方还是 90。你净赚 10，不是 20，因为底池里有 10 本来就是你自己放的。本例没有抽水。如果双方最强五张完全一样，就平分底池。换一手练习时教学筹码会重新发放，不会累积成账户资产。", "The whole 20-chip pot goes to you, so your balance goes from 90 to 110 while your opponent stays at 90. Your net gain is 10, not 20, because 10 of the pot was your own. There is no rake in this example. If both best five-card hands were identical, the pot would be split. Starting another practice hand resets the teaching chips; they never build up as an account balance."],
    ]),
    chapter("ranks", "牌型：从“一对”开始认", "Hand types, starting with a pair", [
      ["先记这几种：一对是两张同点数；两对是两组对子；三条是三张同点数。顺子是五张点数连续的牌；同花是五张同一花色（点数不用连续）；葫芦是三条加一对；四条是四张同点数；同花顺是既连续又同花。什么都凑不成，就比单张大小（高牌）。", "Start with these: a pair is two cards of the same rank; two pair is two separate pairs; three of a kind is three of the same rank. A straight is five ranks in a row; a flush is five cards of one suit (ranks need not be in a row); a full house is three of a kind plus a pair; four of a kind is four of the same rank; a straight flush is both a straight and a flush. With none of these, compare single high cards."],
      ["从大到小排：同花顺 > 四条 > 葫芦 > 同花 > 顺子 > 三条 > 两对 > 一对 > 高牌。同一种牌型再比组成它的点数，然后比剩下的单张，剩下的单张叫“踢脚”。A 可以在 A2345 里当最小，但 QKA23 不算顺子。第一次先能解释本例里一对的比较，再去练其他牌型。", "From strongest to weakest: straight flush > four of a kind > full house > flush > straight > three of a kind > two pair > one pair > high card. Within the same type, compare the ranks that make it, then the leftover cards, called kickers. The Ace can be low in A2345, but QKA23 is not a straight. First make sure you can explain this lesson's pair comparison, then practise other types."],
    ]),
  ],
  baccarat: [
    chapter("playing-cards", "还不认识扑克牌？先认四种图案", "New to playing cards? Start with four symbols", [
      ["一张扑克牌上通常印着数字或字母，还有一个小图案。这个图案叫“花色”，共四种：黑桃 ♠、红桃 ♥、梅花 ♣、方块 ♦。黑桃像尖叶子，红桃像心，梅花像三片圆叶，方块像菱形。花色只是用来区分牌，不会告诉你哪边会赢。", "A playing card usually shows a number or letter and a small symbol. The symbol is the suit, and there are four: spades ♠, hearts ♥, clubs ♣ and diamonds ♦ — a pointed leaf, a heart, three round leaves and a diamond. Suits only tell cards apart; they don't tell you which hand will win."],
      ["每种花色有 A、2 到 10、J、Q、K 共 13 张，四种合起来是 52 张，就是一副不含大小王的牌。J、Q、K 是人物牌的名字；K 虽然叫国王，但不是象棋里要保护的“王”，也不是大小王。百家乐通常用八副牌，共 416 张，所以可能出现两张一模一样的牌。", "Each suit has 13 cards — A, 2 to 10, J, Q, K — so four suits make 52 cards: one deck without jokers. J, Q and K are the picture cards; the K (King) is not a king to protect like in chess, and it is not a Joker. Baccarat usually uses eight decks, 416 cards in all, so two identical cards can appear."],
      ["同一张 A 在不同游戏里算法不一样。在本课百家乐里，A 算 1 点，10、J、Q、K 都算 0 点；7♣ 和 7♥ 都算 7 点，花色不影响点数。“发牌”就是从牌堆上拿下一张放到指定的那一手里；你按发牌按钮，并不能挑想要的点数。", "The same Ace can count differently in different games. In this baccarat lesson, A counts 1 and 10, J, Q and K count 0; 7♣ and 7♥ both count 7 — the suit never changes the value. Dealing means taking the next card from the shoe and placing it in a given hand; pressing the deal button never lets you choose a value."],
    ]),
    chapter("welcome", "“庄”和“闲”只是两手牌的名字", "Banker and Player are just hand names", [
      ["可以把百家乐想成桌上两手牌在比大小：一手叫“闲”，一手叫“庄”。你是在旁边学习的人，不需要扮演庄家；选了“闲”也不能自己决定那手牌补不补牌。发牌员按固定顺序发牌。", "Think of baccarat as two hands on the table competing: one is called Player, the other Banker. You are a learner watching from the side, not the house; picking Player does not let you decide whether that hand draws. The dealer follows a fixed order."],
      ["教学里的“下注”，是先选你认为会出现哪种结果，再放上规定数量的模拟筹码。结果有三种：闲点数高、庄点数高、双方同点（和）。这是为了让你看懂结果和结算的关系，不是预测训练：本课的牌是事先安排好的，筹码也没有金钱价值。", "A teaching \"bet\" means choosing which result you expect and placing a set number of practice chips first. There are three results: Player higher, Banker higher, or equal totals (Tie). This shows how results connect to settlement; it is not prediction practice — the cards here are arranged in advance and the chips have no money value."],
    ]),
    chapter("wallet", "第一次放筹码：100 变成 90", "Your first stake: 100 becomes 90", [
      ["练习开始时给你 100 个教学筹码。“余额”是还没放到桌上的数量。按提示先选“闲”，再选 10 的筹码，最后点确认。确认之前只是准备；确认后这 10 才从余额里扣掉，余额变成 90，桌上显示已投入 10。", "You start with 100 teaching chips. Your balance is what you have not yet put on the table. Follow the prompt: choose Player, choose a 10-chip stake, then confirm. Until you confirm it's only a draft; after confirming, the 10 leaves your balance, which becomes 90, and the table shows 10 committed."],
      ["余额 90 不代表你已经输了 10，结果还没出来，这 10 正在等结算。确认后不能看完牌再改选庄、或改数量。做错了可以重开教学案例，但正式游戏里下注后是不能撤回的。", "A balance of 90 does not mean you've lost 10 — the result isn't out yet, and that 10 is waiting to be settled. Once confirmed, you can't switch to Banker or change the amount after seeing the cards. You can restart the teaching example if you make a mistake, but in a real game a bet cannot be taken back."],
    ]),
    chapter("values", "不用背表，先算 4 加 4", "No tables yet: start with 4 plus 4", [
      ["先记牌值：A 是 1 点，2 到 9 就是牌上的数字，10、J、Q、K 都是 0 点，花色不影响点数。几张牌加起来只看个位数：7 加 8 等于 15，这手就是 5 点，不是 15 点。最大的点数是 9，不是 21。", "Card values first: an Ace is 1, 2 to 9 are worth their number, and 10, J, Q and K are worth 0. Suits make no difference. When you add cards, keep only the last digit: 7 plus 8 is 15, so the hand is worth 5, not 15. The best total is 9, not 21."],
      ["本例按“闲、庄、闲、庄”的顺序发四张：闲拿 4，庄拿 2，闲再拿 4，庄再拿 3。每点一次只发一张，看清楚这张牌去了哪一边。最后闲 4+4=8 点，庄 2+3=5 点。算点练习会让你自己选出正确的数字。", "This example deals four cards in the order Player, Banker, Player, Banker: Player gets 4, Banker 2, Player another 4, Banker 3. Each click deals one card, so watch which hand it goes to. In the end Player has 4+4 = 8 and Banker has 2+3 = 5. The counting exercise asks you to pick the right total yourself."],
    ]),
    chapter("natural", "为什么这一局不再发牌", "Why no more cards are dealt here", [
      ["双方各拿两张后，先看有没有一方是 8 点或 9 点。只要有，就叫“天然牌”，双方立刻停止补牌，直接比点数。本例闲有 8 点，所以庄虽然只有 5 点也不补牌。这条规则优先，不能看到庄只有 5 点就让它再拿一张。", "Once each hand has two cards, first check whether either hand totals 8 or 9. If so, it is a natural: both hands stop drawing and the totals are compared straight away. Here Player has 8, so Banker does not draw even though it only has 5. This rule comes first — you can't give Banker another card just because 5 looks low."],
      ["比较结果：闲 8 点大于庄 5 点，闲赢。“闲赢”说的是两手牌的比较结果；你有没有赢到教学筹码，要看你之前选了什么。选了庄的人，看到闲赢也不会得到返还。这两件事要分开看。", "Player's 8 beats Banker's 5, so Player wins. \"Player wins\" describes the cards; whether you won teaching chips depends on what you picked earlier. Someone who picked Banker gets nothing back just because Player won. Keep the hand result and the bet result separate."],
    ]),
    chapter("settlement", "拿回 20，不等于净赚 20", "Getting 20 back is not a profit of 20", [
      ["本课采用常见的结算方式：押闲赢 1 赔 1；押庄赢时，从赢到的部分扣 5% 佣金；押和 1 赔 8。不是所有桌台都这样，免佣版本另有规则。第一例你押闲 10 并且押中：赢到 10，原来的 10 也退回，一共拿回 20，余额 90+20=110，净赚 10。", "This lesson uses a common payout set: a Player win pays 1 to 1; a Banker win pays 1 to 1 minus a 5% commission on the winnings; a Tie pays 8 to 1. Not every table works this way, and no-commission versions have their own rules. In the first example you bet 10 on Player and won: you win 10 and get your 10 back, 20 in total, so your balance is 90 + 20 = 110 — a net gain of 10."],
      ["如果闲输了，你放的 10 拿不回来，余额保持 90。如果结果是和，而你押的是庄或闲，这 10 原数退回，余额回到 100。如果你押和而且真的是和，10 的奖励是 80，加上本金 10，余额变成 180。押庄赢时，10 的奖励扣 0.5 佣金，拿回 19.5，余额 109.5。结算练习会带你逐一核对。", "If Player had lost, your 10 would be gone and your balance would stay at 90. If the result is a tie and you bet on Player or Banker, your 10 comes back and your balance returns to 100. If you bet on Tie and it is a tie, you win 80 plus your 10 back, for a balance of 180. A winning Banker bet of 10 pays 10 minus 0.5 commission, returning 19.5 for a balance of 109.5. The settlement exercises check each case with you."],
    ]),
    chapter("draw", "第二课才引入‘补牌’", "Introduce drawing in the second example", [
      ["“补牌”是在最初两张之后再发第三张；“停牌”是不再发。没有天然牌时，先处理闲：闲 0–5 点补一张，6–7 点停牌。再处理庄：如果闲停牌，庄 0–5 点补、6–7 点停。每手牌最多三张，不会一直加到满意为止。", "Drawing means getting a third card after the first two; standing means getting no more. Without a natural, settle Player first: Player draws on 0–5 and stands on 6–7. Then Banker: if Player stood, Banker draws on 0–5 and stands on 6–7. A hand never has more than three cards."],
      ["如果闲补了第三张，庄要看的是“闲第三张牌的点数”，不是闲补牌后的总点数。第二例：闲原本 5 点，补到一张 8，总点数变成 3；庄原本 3 点，因为闲的第三张是 8，所以庄停牌。最后双方都是 3 点，结果是和。先跟着这个例子做一遍，再去查下面的完整补牌表，第一次不用背下来。", "If Player drew a third card, Banker's decision depends on the value of that third card, not on Player's new total. In the second example, Player starts on 5 and draws an 8, so its total becomes 3. Banker starts on 3 and stands because Player's third card was an 8. Both hands end on 3, so the result is a tie. Follow this example first, then check the full table below; you don't need to memorise it yet."],
    ]),
  ],
};
