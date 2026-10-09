import type { GameSlug } from "./games";
import type { TutorialStep } from "./tutorials";

// Written as paired paragraphs, not machine-generated keyword pages. The original
// rule demonstrations follow these chapters as a reference and practice library.
const chapter = (id: string, zh: string, en: string, pairs: [string, string][]): TutorialStep => ({
  id: `beginner-${id}`, title: { zh, en }, body: { zh: pairs.map(p => p[0]), en: pairs.map(p => p[1]) },
});
export const beginnerHandbook: Record<GameSlug, TutorialStep[]> = {
  chess: [
    chapter("welcome", "先知道我们要做什么", "What are we trying to do?", [
      ["国际象棋是两人轮流走棋的游戏。你控制白棋，对方控制黑棋。白棋先走；你走一步、对方走一步，不是同时抢着移动。‘一步’是一次合法行动，不是只能移动一个格子。", "Chess is a two-player game with alternating turns. You control White and the other player controls Black. White starts. A move means one legal action; it does not necessarily mean moving only one square."],
      ["你的任务是保护自己的王，并让对方的王受到攻击且无法解除攻击，这叫‘将死’。不需要吃完对方所有棋子，也不会真的把王从棋盘上拿走。第一课先学会认格子和走一步，暂时不背开局名称。", "Protect your king and eventually attack the enemy king so it has no legal escape: checkmate. You do not need to capture every enemy piece, and kings are not physically captured. Begin with finding squares and making a move, not memorising openings."],
    ]),
    chapter("address", "棋盘地址：怎样找到 e2", "Finding a square such as e2", [
      ["棋盘有 8 列、8 行，棋子放在格子里面。白方视角下，最下面从左到右是 a、b、c、d、e、f、g、h；数字从靠近你的 1 到远处的 8。字母表示列，数字表示行。先找到底部 e，再向上找到第 2 行，交会的格子就是 e2。", "The board has eight files and eight ranks; pieces sit inside squares. From White's side, files run a–h left to right and ranks run 1–8 near to far. Find the e file, then rank 2: their intersection is e2."],
      ["开局你面前第二行都是兵。底行从左到右是车、马、象、后、王、象、马、车。后放在与自己颜色相同的格子：白后 d1，白王 e1。页面翻转棋盘只改变观看方向，格子的名字并不改变。", "Your second rank initially holds pawns. The back rank is rook, knight, bishop, queen, king, bishop, knight, rook. The queen starts on her own colour: White's queen on d1 and king on e1. Flipping the view does not rename squares."],
    ]),
    chapter("first-turn", "跟着走：第一次出兵", "Your first pawn move", [
      ["在‘现在动手：双方轮流的第一组着法’中选择‘我来走’。点 e2 的白兵，再点 e4。这个兵第一次移动，所以可以前进两格；e3 和 e4 都必须空着。选中一个兵只是告诉页面你准备移动它，点目标格才真正落子。", "In Your turn: an opening sequence for both sides, choose Try the moves. Select the white pawn on e2, then e4. On its first move a pawn may advance two squares, provided e3 and e4 are empty. Selecting a piece does not move it; selecting its destination does."],
      ["随后按提示替黑方走 e7 到 e5，体会‘轮流’。现在白兵已经走过，不能再一次前进两格。兵平时向前走，吃子却斜向前一格；因此 e4 的白兵不能直接吃正前方 e5 的黑兵。不要把走法和吃法混为一谈。", "Next follow the prompt to move Black's pawn from e7 to e5. This lets you experience both turns. White's pawn can no longer take a two-square first move. Pawns advance straight but capture one square diagonally forward, so the e4 pawn cannot capture the black pawn directly ahead on e5."],
    ]),
    chapter("pieces", "认清六种棋子，不靠猜图案", "Recognising all six pieces", [
      ["兵一次前进一格，初次可两格，斜前吃子。车沿横线或竖线走；象沿斜线走；后可以像车或象一样走。车、象、后的路径中间不能有棋子挡住，落在敌子处就吃掉那枚敌子；不能落在自己的棋子上。", "Pawns normally advance one square, optionally two on their first move, and capture diagonally. Rooks follow ranks or files; bishops follow diagonals; queens combine both. These sliding pieces cannot pass through another piece or land on a friendly piece. Landing on an enemy piece captures it."],
      ["马走一个 L：先沿一个方向数两格，再垂直数一格，中间有子也能跳过去。王向任意方向走一格，但不能走进敌方攻击范围。记住王的安全比吃到一枚子更重要：一个看似空着的格子也可能不能去。", "A knight makes an L: two squares in one direction and one perpendicular, jumping over intervening pieces. A king moves one square in any direction but never into attack. An empty square is not necessarily a safe square for your king."],
    ]),
    chapter("ending", "将军、将死、和棋分别是什么", "Check, checkmate and a draw", [
      ["‘将军’是王正在被攻击。轮到你时必须先处理：把王移到安全处、吃掉攻击者，或用另一枚棋子挡住攻击路线。不是每一种办法在每个局面都可用，比如马的攻击不能靠中间垫子挡住。三种办法都无法合法解除将军，就是将死。", "Check means your king is under attack. Your reply must remove the threat: move the king to safety, capture the attacker, or block a sliding attack. Not every remedy is available; a knight's attack cannot be blocked. If no legal reply removes check, it is checkmate."],
      ["如果王没有被将军，但轮到的一方没有任何合法走法，叫‘逼和’，不是将死。双方也可能同意和棋，或按重复局面等规则结束。先学会区分‘被攻击而无路可走’与‘没有被攻击但无棋可走’，再学习易位、升变、吃过路兵的具体条件。", "Stalemate is different: the side to move has no legal move but its king is not in check. The game is drawn. Draws may also arise by agreement or repetition rules. Learn this distinction before studying the detailed conditions for castling, promotion and en passant."],
    ]),
  ],
  xiangqi: [
    chapter("welcome", "不是吃光棋子，而是守帅攻将", "Protect your general, attack theirs", [
      ["中国象棋由红黑两方轮流走，红方先行。红方的首领叫帅，黑方叫将；它们的地位相同，只是名称不同。你要保护自己的帅，让对方的将无法摆脱攻击。不必把车、马、炮全部吃光才算赢。", "Xiangqi alternates between Red and Black, with Red moving first. Their leaders use different Chinese characters but have the same role: the general. Protect yours and trap the opposing general; capturing every other piece is unnecessary."],
      ["先把‘走子’理解为把一枚棋子从一个交叉点移到另一个允许的交叉点；目标处有敌子时，把敌子拿走，这叫‘吃子’。自己的子不能互相吃。同一回合不能先走车再走炮。", "A move takes one piece from one intersection to another permitted intersection. If an enemy piece occupies the destination, remove it: a capture. You cannot capture your own pieces or move two separate pieces in one turn."],
    ]),
    chapter("board", "交叉点、河界、九宫和坐标", "Intersections, river, palace and coordinates", [
      ["棋盘是 9 条竖线、10 条横线，棋子压在线的交叉点上，不放在方格里面。中间没有竖线的空带是河界。两端画有交叉斜线的 3×3 区域叫九宫，帅将和仕士只能在自己的九宫内活动。", "Nine files and ten ranks form intersections, where pieces sit—not inside squares. The gap across the middle is the river. The 3×3 area with diagonals at each end is a palace. Generals and advisors stay within their own palace."],
      ["本站练习用 a–i 与 1–10 标记交叉点。红方朝上看，底部从左向右数到 b，再向上到第 3 行，就是 b3 的红炮。‘b3 → e3’表示这枚炮沿同一横线右移，终点是中间那列。传统‘炮二平五’是另一种记谱，第一轮不要求你会读。", "Our exercises label intersections a–i and 1–10. With Red at the bottom, find file b and rank 3: the red cannon is on b3. b3 → e3 means sliding it along the same rank to the central file. Traditional Chinese move notation is another system; you need not know it for this exercise."],
    ]),
    chapter("pieces", "七种棋子的动作与限制", "The seven pieces and their limits", [
      ["车沿横竖直线走，不能越子。马走‘日’字，但靠近起点的那一步直线位置有子时叫‘蹩马腿’，该方向走不了。相象走两格斜线，不能过河，中间交叉点有子叫‘塞象眼’。仕士斜走一格，帅将直走一格，都不能出九宫。", "Rooks slide horizontally or vertically without jumping. Horses move in an L but are blocked if the first orthogonal step is occupied. Elephants move two diagonal steps, cannot cross the river, and are blocked at the midpoint. Advisors move one diagonal step; generals one orthogonal step, both within the palace."],
      ["炮不吃子时像车一样走；吃子时必须恰好隔一枚棋子，那枚中间的子叫‘炮架’，双方的子都可以当炮架。兵卒过河前只能前进一步，过河后可向前或横走一步，始终不能后退。", "A cannon moves like a rook when not capturing. To capture it must jump exactly one intervening piece, the screen, which may belong to either side. Soldiers move one step forward; after crossing the river they may also move one step sideways, but never backwards."],
    ]),
    chapter("first-turn", "跟做一轮，再检查为什么能走", "Follow a turn and explain its legality", [
      ["在下面带着法的示范里选择‘我来走’，按页面给出的起点和终点点击棋子。每走一步都问三件事：轮到哪方？路径有没有阻挡？走完会不会让自己的帅被攻击？绿色目标提示帮助找位置，但不能替你理解规则。", "Choose Try the moves in a demonstration below, then select the indicated origin and destination. Ask: whose turn is it, is the path blocked, and will my own general remain safe? Destination markers help you locate a move; they do not replace understanding it."],
      ["初次练炮时先观察路径：只是移动时，途中必须全空；要吃对方时，途中恰好一个炮架。‘隔得远’不是可以吃的理由，两个炮架也不能吃。下一课再练马腿和象眼，避免一次混进所有限制。", "For your first cannon exercise, inspect the path before moving. An ordinary move needs a clear path; a capture needs exactly one screen. Distance alone does not permit a capture, and two screens block it. Then practise horse and elephant blocking separately."],
    ]),
    chapter("ending", "将军必须解，困住也会输", "Responding to check and ending a game", [
      ["帅将受到攻击叫将军。必须移帅、吃掉攻击子或阻断攻击，不能假装没看到继续进攻。双方帅将也不能在同一竖线上、没有任何棋子遮挡地直接相望；移开中间的子时尤其要检查这一点。", "An attacked general is in check. You must move it, capture the attacker or stop the attack, rather than ignore it. The two generals may not face each other on a clear file. Be especially careful when moving a piece that currently separates them."],
      ["没有合法应对的将军叫将死。与国际象棋不同，中国象棋中轮到的一方完全没有合法着法，即使没被将军，也会判负，常称‘困毙’。长将长捉等重复局面的裁定另有细则，不能简单套用国际象棋的和棋规定。", "Check with no legal reply is mate. Unlike chess, having no legal move also loses in xiangqi even without check. Repetition involving repeated checks or chases has additional rules; do not import chess's draw rules."],
    ]),
  ],
  shogi: [
    chapter("welcome", "先认方向，再认汉字", "Read direction before characters", [
      ["将棋是两人轮流走子的游戏，目标是将死对方的王。两边棋子不靠黑白颜色区分，而靠五角形的尖端朝向区分：尖端朝向对手的是你的棋子。先手先走，后手再走。本站底部先手的棋子通常向上。", "Shogi is a two-player game whose goal is checkmate. Pieces are distinguished by the direction of their pointed ends, not by different colours. Your pieces point toward your opponent. Sente moves first, followed by Gote; the bottom player's pieces normally point upward here."],
      ["棋盘有 9×9 个格子，棋子放在格内。王将和玉将都代表王，功能相同。第一课不要急着背日文读音，先把王、金、银、桂、香、角、飞、步与它们的动作对应起来。", "Pieces occupy the squares of a 9×9 board. The two characters used for kings have identical functions. Start by matching king, gold, silver, knight, lance, bishop, rook and pawn to their movements; Japanese pronunciation can wait."],
    ]),
    chapter("pieces", "八种棋子怎样移动", "How the eight pieces move", [
      ["王走周围一格；飞车沿横竖直线走，角行沿斜线走，它们不能越子。香车沿正前方走任意远但不能越子，也不能后退。步兵只向正前方一格，走与吃相同，不像国际象棋的兵那样斜吃或第一步走两格。", "Kings move one adjacent square. Rooks slide orthogonally and bishops diagonally without jumping. Lances slide straight forward only. Pawns move and capture one square straight forward: no diagonal capture and no initial double move."],
      ["金将能向前方三格、左右两格和正后方一格走，不能斜后退。银将能向前方三格和斜后方两格走，不能横走或直后退。桂马跳到前方两格、左右偏一格的位置，能越子但不能向后跳。先后方的‘前’互相相反。", "Golds move one square forward, forward-diagonally, sideways or straight back, but not diagonally back. Silvers move forward or on any diagonal, not sideways or straight back. Knights jump two forward and one sideways, never backward. Forward is opposite for the two players."],
    ]),
    chapter("turn", "跟着开局：步兵向前一格", "First move: advance a pawn", [
      ["本站棋盘还标有字母数字，练习指令会直接给出起点和终点。不需要先把这些坐标转换成日本记谱。选‘我来走’，点提示的步兵，再点正前方目标格。轮到后手时，观察对方也是朝向你前进一步，而不是继续往屏幕上方走。", "Our board also displays letter-number coordinates. Exercise prompts give the origin and destination directly; you need not translate them into Japanese notation. In Try the moves, select the indicated pawn and its forward destination. On Gote's turn, forward points toward you, not upward on the screen."],
      ["每走一步，检查王是否会受到攻击。将棋也不是吃掉全部棋子才赢。下方的逐着练习把双方都交给你操作，是为了学习流程，不表示正式对局时你可以替对手决定。", "After each move check your king's safety. Winning does not require taking every piece. Guided exercises let you operate both sides to understand the sequence; in a real game you cannot choose your opponent's moves."],
    ]),
    chapter("captured", "吃掉的棋子，为什么还能放回来", "Why captured pieces return", [
      ["吃到的敌子变成你的‘持驹’，放在棋盘旁边；如果它已升级，先恢复原来的身份。轮到你时，可以不移动盘上棋子，而把一枚持驹放到空格，这叫‘打入’，也算完整的一步。放下后尖端朝向对方。", "Captured enemy pieces become your pieces in hand, shown beside the board, and lose any promotion. On your turn you may place one on an empty square instead of moving a board piece: a drop. It uses your whole turn and points toward your opponent."],
      ["不能随便打入：步兵不能放在已有自己未升级步兵的同一列，这叫‘二步’；步或香不能打在最后一行，桂不能打在最后两行，因为以后再也不能走。用刚打入的步兵直接将死对方也是禁止的。", "Drops have restrictions. You cannot drop a pawn on a file already containing your unpromoted pawn: nifu. A pawn or lance cannot be dropped on the last rank, nor a knight on the last two, where it could never move. A pawn drop giving immediate checkmate is also forbidden."],
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
    chapter("welcome", "魔方没有棋子，也没有对手回合", "A cube has pieces, not chessmen", [
      ["三阶魔方有六个面，每面看起来是 3×3 九个色块。目标是让六个面各自成为同一种颜色，同时所有小块都在正确位置。只拼出一个白面还不等于完成第一层：白面周围那一圈颜色也要与侧面中心相配。", "A 3×3 cube has six faces, each showing nine stickers. The goal is one colour per face with every physical piece in its proper place. Making a white face alone does not necessarily solve the first layer: the side colours around it must also match their centres."],
      ["这不是轮流走棋，你可以连续转动。第一课目标仅是认清部件、转一层、把它转回；不是立刻背七套公式完成任意打乱。‘公式’只是预先约定的一串转动动作，不是数学算式。", "There are no alternating turns. Your first goals are to identify parts, turn one layer and reverse it—not memorise seven sequences immediately. An algorithm is simply a written sequence of turns, not an arithmetic formula."],
    ]),
    chapter("parts", "摸清中心、棱、角三种部件", "Centres, edges and corners", [
      ["每面中央只有一色的块叫中心块，共六个；带两种颜色的是棱块，共十二个；带三种颜色的是角块，共八个。贴纸会跟着整块一起移动，不能把一张贴纸单独送到另一个地方。中心的相对位置固定，用来告诉你每面最后应是什么颜色。", "The six centres each show one colour. Twelve edges show two colours each; eight corners show three. Stickers move together with their physical piece, not independently. Centres remain fixed relative to each other and identify each face's final colour."],
      ["找一个白绿棱：它最后应该在白色中心与绿色中心之间。白绿红角则应在三个对应中心的交会角。判断‘归位’既看位置，也看方向；同一小块在正确槽位里翻着放，仍未还原。", "A white-green edge belongs between the white and green centres. A white-green-red corner belongs where those three faces meet. Solved means both the correct location and orientation; a flipped piece in the right slot is still unsolved."],
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
    chapter("scope", "这一课玩哪一种麻将", "Which mahjong are we learning?", [
      ["麻将有很多地区规则，不能只说‘麻将规则就是这样’。本课先用 136 张、不带花牌的基础结构练习：学习摸一张、打一张，以及四组三张加一对的普通完成形。不套用国标番数、日麻役种或地方结算，结构完成不等于所有规则都能和牌。", "Mahjong has many regional rules. This lesson uses a 136-tile, no-flower structural exercise: draw, discard, and recognise a basic four-sets-and-pair shape. It does not implement Chinese Official scoring, riichi yaku or regional payments; a completed shape is not automatically a legal win everywhere."],
      ["四人各自管理手里的牌，通常由庄家先打，之后按顺序轮到下一家。这里的‘庄家’是当轮有特定开局职责的座位，不是百家乐中那手叫‘庄’的牌。本课不需要下注；把百家乐的下注流程搬进麻将会教错。", "Four players manage their own hands, normally with the dealer discarding first. Dealer here means a seat with particular starting duties, not the hand called Banker in baccarat. This exercise does not require betting; importing baccarat's process would be misleading."],
    ]),
    chapter("names", "万、筒、条，以及相同的牌", "Characters, dots, bamboo and matching tiles", [
      ["数字牌有三种花色：万、筒、条，每种从一到九，每张有四枚完全相同的牌。一万和一筒不是同一张牌，不能因为数字都是一就当成对子。东南西北与中发白是字牌，没有数字顺序；东南西不能当成一二三使用。", "Number tiles have three suits: characters, dots and bamboo, each numbered one to nine with four copies of every tile. One character and one dot are not identical. Winds and dragons are honours without numerical sequences; East-South-West is not equivalent to 1-2-3."],
      ["三张同花色的连续数字，如二三四万，叫顺子；三枚相同的牌，如三个五筒，叫刻子；两枚相同的牌叫对子。普通完成形要四组顺子或刻子，再加一个对子。对子不是随意剩下的两张，而必须一样。", "Three consecutive numbers in one suit form a sequence; three identical tiles form a triplet; two identical tiles form a pair. A basic completed shape needs four sequences or triplets plus one pair. The final two tiles must match, not merely be leftovers."],
    ]),
    chapter("draw", "用 13 → 14 → 13 理解轮次", "Understand a turn as 13 → 14 → 13", [
      ["先不考虑吃碰杠。轮到你前有十三张；从牌墙摸一张后有十四张；如果还没完成，就选一张放入弃牌区，回到十三张，轮到下家。‘牌墙’是待摸牌堆，‘弃牌’是已经打出去的牌，不可以看后悔了就拿回来换。", "Ignore calls and kongs at first. You hold thirteen tiles before your turn, draw from the wall to fourteen, then discard one if not complete, returning to thirteen. The wall is the draw pile; discards have left your hand and cannot be swapped back on a whim."],
      ["下面案例的起手是：一二三万、四五万、二三四筒、六七八条、东、白。先摸九筒，变十四张，再亲手点白板打出。你会看到手牌少一张、弃牌区多一张，两处要一起检查。", "The example starts with characters 1-2-3 and 4-5, dots 2-3-4, bamboo 6-7-8, East and White Dragon. Draw dot 9 to reach fourteen, then click White Dragon to discard it. Check both the reduced hand and the new discard."],
    ]),
    chapter("finish", "连续几次摸打，拼出完成形", "Build a complete shape over several turns", [
      ["其他三家各行动一次后，本例再摸六万，它能与四五万组成顺子；打掉刚才没有配合的九筒。再等一轮，摸到东，你手里的两个东组成对子。此时完整拆分是一二三万、四五六万、二三四筒、六七八条、东东。", "After the other three players take their turns, this example draws character 6 to join 4-5; discard the unconnected dot 9. After another round, draw East for the pair. The full split is characters 1-2-3, characters 4-5-6, dots 2-3-4, bamboo 6-7-8, East-East."],
      ["自己摸到完成所需的最后一张叫自摸；用别人刚打出的牌完成叫荣和或点和，不同规则叫法有差异。本练习只确认结构，不给你宣布国标八番或日麻有役，也不展示不存在的通用奖金。", "Completing with your own draw is a self-draw; completing with a discard is a discard win, with terminology varying by ruleset. This exercise validates only the shape; it does not assert a Chinese Official minimum score, a riichi yaku or a universal payout."],
    ]),
    chapter("calls", "吃、碰、杠先分开理解", "Separate sequences, triplets and kongs", [
      ["吃是取上家刚打的牌，与手里两张拼顺子；碰是取任意一家刚打的牌，与手里两张相同牌拼刻子。通常须把该组公开放在面前，随后打一张，不另摸一张。不是看到别人打出喜欢的牌就能随便拿。", "A chow takes the previous player's discard to complete a sequence with two tiles from your hand. A pung takes any player's discard to complete a triplet. Expose the set, then discard without an ordinary draw. You cannot take any discard merely because you like it."],
      ["杠是四枚相同牌组成一组，通常需要补摸一张，所以有杠的手牌实物数不再简单等于十四。第一轮练习刻意不放杠，等你能解释普通摸打后再学。之后请选择一套完整地区规则，学习起和条件、抢杠和计分，不能把不同规则的有利条款拼起来。", "A kong is four identical tiles treated as one set and normally requires a replacement draw, so the physical tile count differs. Our first exercise omits kongs deliberately. Later choose one complete ruleset for winning requirements, robbing a kong and scoring rather than mixing favourable rules from different variants."],
    ]),
  ],
  holdem: [
    chapter("playing-cards", "从一张牌开始：花色、数字和字母", "Start with one card: symbols, numbers and letters", [
      ["先不玩游戏，拿 A♠ 这张牌来认：A 是牌的点数名称，♠ 是花色。四种花色是黑桃 ♠、红桃 ♥、梅花 ♣、方块 ♦。黑桃像尖头叶片，红桃像心形，梅花像三片圆叶，方块像菱形。黑桃和梅花通常是黑色，红桃和方块通常是红色；红色牌不是天然比黑色牌大。", "Before playing, read A♠: A is the rank and ♠ the suit. The four suits are spades ♠, hearts ♥, clubs ♣ and diamonds ♦. A spade resembles a pointed leaf, a heart a heart, a club three rounded leaves, and a diamond a diamond shape. Spades/clubs are usually black and hearts/diamonds red. Red is not inherently stronger."],
      ["每种花色各有十三张：A、2、3、4、5、6、7、8、9、10、J、Q、K。J 通常画侍从，Q 画王后，K 画国王；它们不是可以任意替换其它牌的万能牌。四种花色乘十三张等于五十二张。大小王是另加的牌，本课不用，大小王与 K 国王不是同一回事。", "Each suit has thirteen ranks: A, 2–10, J, Q, K. J is Jack, Q Queen and K King. These picture cards are not wild cards. Four suits times thirteen ranks makes 52 cards. Jokers are extra cards, excluded here; a Joker is not the same as a King."],
      ["这里 A 通常最高，然后 K、Q、J、10 一直到 2；A 在 A2345 顺子中也可作最小。‘同点数’如 A♠ 和 A♥，字母相同但花色不同；‘同花色’如 A♠ 和 7♠，符号相同但点数不同。先做下方认花色练习，再学习对子和同花，就不会把这两种‘相同’混淆。", "Here Ace is usually highest, followed by K, Q, J, 10 down to 2, though it can be low in A2345. A♠ and A♥ share a rank but not a suit; A♠ and 7♠ share a suit but not a rank. Practise recognising suits before learning pairs and flushes."],
    ]),
    chapter("welcome", "你拿两张牌，大家共用五张牌", "Two private cards, five shared cards", [
      ["德州扑克使用没有大小王的 52 张牌。每人两张只给自己看的‘底牌’，桌面最多五张大家都能用的‘公共牌’。最后从自己的两张和公共五张中，选最强五张比较，能用零张、一张或两张底牌，不是必须两张全用。", "Texas hold'em uses 52 cards without jokers. Each player gets two private hole cards and shares up to five community cards. At showdown choose your best five from those seven, using zero, one or two hole cards—not necessarily both."],
      ["你可以靠最后牌更大获胜，也可以在其他人全部弃牌后获胜。‘弃牌’是退出这一手，之前投入不退。本课用两人固定案例认识流程，发牌已编排，不是赚钱方法或真实随机胜率演示；教学余额不可购买、提现或兑换。", "You can win with the better final hand or when everyone else folds. Folding leaves the hand and forfeits prior contributions. Our fixed two-player example teaches the sequence, not a profitable strategy or random odds. Teaching credits cannot be bought, withdrawn or redeemed."],
    ]),
    chapter("chips", "余额、筹码、底池分别在哪", "Balance, chips and the pot", [
      ["余额是还留在你面前、尚未投入的教学筹码；底池是双方已投入的总数。按钮标记当轮名义发牌位置。单挑时按钮方交小盲、另一方交大盲：盲注是发牌前的规定投入，不表示谁一定牌好。这里双方各 100，小盲 5、大盲 10。", "Your balance is the teaching chips still available; the pot holds contributions already made. The button marks the nominal dealer. Heads-up, the button posts the small blind and the other player the big blind: compulsory contributions, not signs of strong cards. Here each starts at 100, with blinds of 5 and 10."],
      ["你交小盲 5 后剩 95，对方交大盲 10 后剩 90，底池 15。轮到你时‘跟注’表示补齐当前投入差额，因此只再交 5，不是再交 10；完成后双方各剩 90、底池 20。这个差额是新手最容易算错的地方。", "After your small blind you have 95; the opponent has 90 and the pot holds 15. Calling means matching the outstanding contribution, so you add only 5, not another 10. Both then have 90 and the pot is 20. Learn to calculate the difference."],
    ]),
    chapter("actions", "五个按钮，各自在什么情况下用", "What the action buttons mean", [
      ["没有待补金额时可以‘过牌’，表示不投入也不退出，把行动交给下一位；有人下注后不能用过牌躲掉跟注。‘下注’是这一轮首次投入；‘跟注’是补齐对方数额；‘加注’是在补齐基础上提高本轮目标投入；‘弃牌’是放弃这一手。", "Check passes the action without contributing or folding when nothing is owed. You cannot check away an outstanding bet. Bet makes the first contribution of a betting round; call matches the amount owed; raise increases the current target; fold abandons the hand."],
      ["本例只练跟注和过牌，不把加注大小、全下、边池一起塞进第一手。‘全下’是投入自己剩余所有筹码；多个余额不同的人全下可能产生边池，需要单独学习。所有人完成当前轮的行动后才发下一批公共牌。", "This first example practises calling and checking, leaving raise sizes, all-in and side pots for later. All-in commits your remaining chips; unequal stacks may create side pots. The next community cards are dealt only when the current betting round is complete."],
    ]),
    chapter("streets", "跟着走完四个阶段", "Walk through all four stages", [
      ["你拿 A♠ K♠，对方底牌暂时盖住。先完成盲注和跟注，这段叫翻牌前。随后一次翻出三张公共牌：A♥、7♣、2♦，叫翻牌。单挑翻牌后大盲先行动，本例对方过牌，你也亲手点过牌。", "You hold A♠ K♠ while the opponent's cards remain hidden. Post blinds and call during preflop. Then deal three community cards, A♥ 7♣ 2♦: the flop. Heads-up the big blind acts first after the flop; the opponent checks, then you check."],
      ["再发第四张 9♠，叫转牌；双方再各行动。再发第五张 3♣，叫河牌；双方再各行动。‘转牌’不是把手牌旋转，‘河牌’也不是额外私人牌。每一轮都要确认是否有人投入，不能看见新牌就忘记行动顺序。", "The fourth community card, 9♠, is the turn, followed by another betting round. The fifth, 3♣, is the river, followed by the final round. Both are shared cards. At each stage check whether an amount is owed and whose action comes next."],
    ]),
    chapter("showdown", "摊牌以后，亲手核对结算", "Showdown and settlement", [
      ["对方翻开 Q♥ Q♦。你的最佳五张是 A♠ A♥ K♠ 9♠ 7♣，一对 A；对方是 Q♥ Q♦ A♥ 9♠ 7♣，一对 Q。同是一对时先比这一对的点数，A 大于 Q，所以你赢。不是比两人七张牌数字总和，也不按黑桃比红桃大。", "The opponent reveals Q♥ Q♦. Your best five are A♠ A♥ K♠ 9♠ 7♣, a pair of aces. The opponent has Q♥ Q♦ A♥ 9♠ 7♣, a pair of queens. Compare the pair ranks: aces beat queens. Do not add all seven ranks or rank suits."],
      ["底池 20 全部交给你，所以余额从 90 到 110，对方保持 90。你净增加 10，不是净赢 20，因为底池里有你自己的 10。本例无抽水。若双方最佳五张完全相同就平分底池；换一手练习会重新发放教学筹码，不形成账户资产。", "The 20-chip pot goes to you, taking your balance from 90 to 110; the opponent remains at 90. Your net gain is 10, not 20, because the pot included your own 10. This example has no rake. Equal best-five hands split the pot. Resetting restores teaching credits, not account assets."],
    ]),
    chapter("ranks", "从一对向上认识牌型", "Learn hand ranks starting with a pair", [
      ["先记一对是两张同点、两对是两组对子、三条是三张同点。顺子是五张连续点数；同花是五张同花色且不要求连续；葫芦是三条加一对；四条是四张同点；同花顺同时连续且同花。没有这些组合就比较高牌。", "A pair is two equal ranks; two pair is two separate pairs; three of a kind is three equal ranks. A straight has five consecutive ranks; a flush five cards of one suit. A full house combines three of a kind and a pair; four of a kind has four equal ranks; a straight flush is both straight and flush. Otherwise compare high cards."],
      ["从强到弱是同花顺、四条、葫芦、同花、顺子、三条、两对、一对、高牌。同类再按组成点数和剩余高牌比较，剩余高牌叫踢脚。A 可在 A2345 中作最小，但 QKA23 不是顺子。第一次先能解释本例的一对比较，再去做其他牌型题。", "Descending strength is straight flush, four of a kind, full house, flush, straight, three of a kind, two pair, pair, high card. Within a type compare its ranks and remaining high cards, called kickers. Ace can be low in A2345, but QKA23 is not a straight. Start by explaining this example's pair comparison."],
    ]),
  ],
  baccarat: [
    chapter("playing-cards", "还不认识扑克牌？从四种图案开始", "New to playing cards? Start with four symbols", [
      ["一张扑克牌上常有数字或字母，以及一个小图案。图案叫‘花色’，共有黑桃 ♠、红桃 ♥、梅花 ♣、方块 ♦ 四种。黑桃像尖叶，红桃像心，梅花像三片圆叶，方块像菱形。它们的用途之一是区分牌张，不是告诉你哪边会赢。", "A playing card normally shows a number or letter and a small symbol. That symbol is its suit: spades ♠, hearts ♥, clubs ♣ or diamonds ♦. Think pointed leaf, heart, three rounded leaves and diamond. Suits distinguish cards; they do not predict which hand will win."],
      ["每种花色有 A、2 到 10、J、Q、K 共十三张，四种合计五十二张，称为一副不含大小王的牌。J、Q、K 是人物牌的名称；K 虽然叫国王，却不等于象棋里必须保护的王，也不是大小王。八副牌就是八套一样的五十二张，共四百一十六张，因此可能出现完全一样的两张牌。", "Each suit has thirteen ranks—A, 2 through 10, J, Q, K—making one 52-card deck without jokers. J, Q and K name picture cards; K is not a king to protect as in chess, nor a Joker. Eight decks contain 416 cards, so identical cards can occur more than once."],
      ["同一张 A 在不同游戏里的规则可能不同。在本课百家乐里 A 算 1 点，10/J/Q/K 算 0；7♣ 和 7♥ 都算 7，不因为梅花或红桃而改变。‘发牌’就是从待发牌堆取下一张，放到指定的一手里；你按发牌按钮，不是在挑选想要的点数。", "The same Ace has different roles in different games. In baccarat A counts 1 and 10/J/Q/K count 0. Both 7♣ and 7♥ count 7. Dealing takes the next card from the prepared deck into a specified hand; the deal button does not let you choose its value."],
    ]),
    chapter("welcome", "‘庄’和‘闲’不是你的身份", "Banker and Player are hand names", [
      ["先把百家乐想成桌面上的两手牌做比较：一手名字叫‘闲’，另一手名字叫‘庄’。你是旁边学习的人，不是必须扮演庄家，也不会因为你选闲就能亲自决定那手牌怎么补。发牌员负责按固定顺序发牌。", "Think of baccarat as comparing two named hands on a table: Player and Banker. You are the learner watching them; choosing Player does not give you control over its draws. The dealer follows a fixed procedure."],
      ["教学中的‘下注’是先选择你认为哪种结果会发生，再放上规定数量的模拟筹码。三个结果是闲点数高、庄点数高、双方同点（和）。它让你理解结果与结算的关系，不是预测训练：本课牌张事先安排，筹码没有金钱价值。", "A teaching wager selects a result and commits simulated chips before the cards are revealed. The results are Player higher, Banker higher, or equal totals (Tie). This teaches settlement, not prediction: the example cards are arranged and credits have no monetary value."],
    ]),
    chapter("wallet", "第一次放筹码：100 变成 90", "Your first stake: 100 becomes 90", [
      ["练习开始发给你 100 教学筹码。‘余额’是尚未放上桌的数量。按提示选择闲，再选 10 筹码，最后点确认；确认前只是准备，确认后这 10 才从余额扣出，余额变 90，桌面显示已投入 10。", "Start with 100 teaching credits. Balance means the amount not committed. Select Player, choose a 10-credit stake, then confirm. Before confirmation it is a draft; afterwards the balance becomes 90 and the committed stake is 10."],
      ["不要把余额 90 理解为已经输了 10。结果还没出来，这 10 正在等待结算。确认后不能看完牌再改选庄或改数量；如果做错可以重开教学案例，但那不是正式游戏中可以撤回下注的规则。", "A balance of 90 does not yet mean you lost 10; the stake is awaiting settlement. Once confirmed you cannot change the selected hand or amount after seeing cards. Restart is a learning aid, not a real-game right to withdraw a wager."],
    ]),
    chapter("values", "不背表，先算 4 加 4", "Start with 4 plus 4, not a table", [
      ["先认识牌面：A 是 1 点，2 到 9 就是所写数字，10、J、Q、K 都是 0 点，花色不影响点数。点数总和只保留个位：7 加 8 得 15，这手记 5 点，不是 15 点。最大的点数是 9，不是 21。", "A is worth 1; 2–9 their printed values; 10, J, Q and K are worth 0. Suits do not affect the total. Keep only the final digit: 7 plus 8 is 15, counted as 5. The highest total is 9, not 21."],
      ["本例按闲、庄、闲、庄顺序发四张：闲拿 4，庄拿 2，闲再拿 4，庄再拿 3。你每点击一次发一张，观察牌究竟去了哪边。最后闲 4+4=8，庄 2+3=5。算点练习会要求你亲自选出正确数字。", "Deal Player, Banker, Player, Banker: Player gets 4, Banker 2, Player another 4, Banker 3. Each click reveals one card so you can follow its destination. Player totals 8 and Banker 5. The exercise asks you to identify the total yourself."],
    ]),
    chapter("natural", "为什么这一局不再发牌", "Why no more cards are dealt here", [
      ["双方各两张后，先检查有没有任何一方是 8 或 9 点。只要有，就叫天然牌；双方立即停止补牌并比较点数。本例闲有 8，所以庄即使只有 5 也不补。这是优先规则，不能先看到庄 5 就让它加牌。", "After both initial two-card hands, first check whether either totals 8 or 9: a natural. If so, neither draws and the totals are compared. Player has 8 here, so Banker does not draw even on 5. This check takes priority over ordinary drawing rules."],
      ["比较得到闲 8 大于庄 5，结果是闲胜。‘胜’描述牌的比较结果；你有没有赚到教学筹码，还要看之前选了什么。选庄的人即使看到闲赢，也不会跟着获得返还。这两件事要分开。", "Player's 8 beats Banker's 5. Player wins describes the cards; whether a learner receives a payout depends on the earlier selection. Someone who selected Banker does not also win because Player's hand did. Separate the hand result from the wager result."],
    ]),
    chapter("settlement", "返还 20，不是净赚 20", "Returning 20 is not a profit of 20", [
      ["本课采用常见的闲 1:1、庄胜收盈利的 5% 佣金、和 8:1 教学结算。它不是所有桌台唯一规则，免佣变体要另学。第一例你选闲 10，猜中的奖励是 10，原来的 10 也退回，合计返还 20；余额 90+20=110，净增 10。", "We teach Player at 1:1, Banker with 5% commission on winnings, and Tie at 8:1. Other tables and no-commission variants differ. Your successful Player stake of 10 returns the original 10 plus 10 winnings: 20 returned, balance 110, net gain 10."],
      ["若闲输了，你投入的 10 不退，余额保持 90。若双方和局而你选的是庄或闲，这个投入原数退回，余额恢复 100；如果你选和且结果确实是和，10 的奖励是 80，再加本金 10，余额 180。庄胜的 10 奖励扣 0.5 佣金，返还 19.5，余额 109.5。结算练习会分别带你核对。", "A losing Player selection leaves the balance at 90. A tie returns a Player or Banker stake, restoring 100. A successful Tie stake of 10 returns 80 winnings plus the 10 stake, giving balance 180. A winning Banker stake deducts 0.5 commission from 10 winnings, returning 19.5 for balance 109.5. Separate exercises show these cases."],
    ]),
    chapter("draw", "第二课才引入‘补牌’", "Introduce drawing in the second example", [
      ["‘补牌’就是初始两张之后再发第三张；‘停牌’是不再发。没有天然牌时，先处理闲：0–5 补一张，6–7 停。再处理庄；闲停时庄 0–5 补、6–7 停。每手最多三张，不会不停加到满意为止。", "Drawing means receiving a third card after the initial two; standing means receiving no more. Without a natural, resolve Player first: draw on 0–5, stand on 6–7. If Player stands, Banker draws on 0–5 and stands on 6–7. Each hand has at most three cards."],
      ["闲补第三张时，庄还要查第三张的牌值，不是闲的最终总点数。第二例闲先有 5，补到 8 后总点数是 3；庄原有 3，因为闲第三张是 8 而停牌。先跟着这个具体例子执行，再查后面的完整补牌表，不要求第一次就背下来。", "When Player draws, Banker's rule uses that third card's value, not Player's new total. In the second example Player starts on 5 and draws an 8, giving total 3. Banker starts on 3 and stands because the third card was 8. Follow this concrete example before using the full reference table; no memorisation is required initially."],
    ]),
  ],
};
