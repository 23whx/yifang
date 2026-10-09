type Text = { zh: string; en: string };
export type TacticalLesson = {
  id: string;
  game: 'chess' | 'xiangqi' | 'shogi';
  title: Text;
  introduction: Text;
  fen: string;
  goal: Text;
  line: { move: string; explanation: Text }[];
  result: '1-0' | '0-1';
  replayOnly?: boolean;
};

/** Authored teaching positions, not attributed historical games. UCI is engine-facing. */
export const tacticalLessons: TacticalLesson[] = [
  {
    id: 'xiangqi-rook-net-replay', game: 'xiangqi', replayOnly: true,
    title: { zh: '三步讲解：把双车封锁搭起来', en: 'Three annotated plies: build the two-rook net' },
    fen: '4k4/1R7/R8/9/9/4P4/9/9/9/4K4 w - - 0 1',
    introduction: { zh: '这是人为编排的教学变化，不是历史棋谱，也不是证明对手每步只能这样走。红方先走，接着展示黑方一种合法应对，再看红方如何将死。车沿横竖直线走，不能越子；将只能留在九宫内。', en: 'This is an authored teaching variation, not historical play or proof of a forced line. Red moves, Black makes one legal reply, and Red finishes with mate. Rooks move along unobstructed ranks and files; the general stays inside its palace.' },
    goal: { zh: '理解两辆车怎样分工：一辆封第九排退路，另一辆进入第十排将军。', en: 'Understand the division of work: one rook covers rank-nine escapes; the other checks on rank ten.' },
    line: [
      { move: 'a8a9', explanation: { zh: '红车从 a8 向上走一格到 a9，与 b9 的车处于同一排。这一步没有将军；它是在准备把 a 线的车送到顶排。注意 b9 车的位置没有变，它继续控制 e9、f9 等九宫下沿格子。', en: 'Red moves the rook from a8 to a9, alongside the b9 rook. This is not check: it prepares a lift to the top rank. The b9 rook stays in place and continues to control palace squares such as e9 and f9.' } },
      { move: 'e10f10', explanation: { zh: '黑将从 e10 向右走一格到 f10。这仍在九宫内，且没有走入车的攻击线，所以合法。本回放只选择这一个应对来讲解，不意味着黑方一定会这样走。此时黑将下方的 f9 被 b9 红车控制。', en: 'Black moves its general from e10 to f10. It remains inside the palace and does not enter a rook’s attack, so the move is legal. This replay chooses one reply for teaching; it does not claim Black must play it. The b9 rook controls f9 below the general.' } },
      { move: 'a9a10', explanation: { zh: '红车从 a9 到 a10，横着攻击 f10 黑将。黑将想回 e10，也仍在这辆车的攻击线上；想下到 f9，又会被 b9 车攻击；九宫以外不能走。黑方没有可吃车、挡车或逃开的合法着法，因此红方将死获胜。', en: 'Red plays a9–a10, attacking the general on f10 along the top rank. Returning to e10 stays on the same attack line; descending to f9 enters the b9 rook’s attack. Leaving the palace is illegal. With no legal capture, block or escape, Black is checkmated.' } },
    ], result: '1-0',
  },
  {
    id: 'shogi-supported-drop-replay', game: 'shogi', replayOnly: true,
    title: { zh: '三步讲解：先保护落点，再打入金将', en: 'Three annotated plies: protect a square, then drop gold' },
    fen: '4k4/9/9/4K4/9/9/9/9/9[G] w - - 0 1',
    introduction: { zh: '先手玉在 e6，后手玉在 e9，先手持有一枚金将。本教学变化展示一种合法应对，不是所有分支的强制将死证明。先观察自己的玉能保护哪些格子，再看持驹怎样参与进攻。', en: 'Your king starts on e6, the opposing king on e9, and you have a gold in hand. This teaching variation shows one legal reply, not a proof of forced mate in every branch. First inspect the squares your king protects, then see how a piece in hand joins the attack.' },
    goal: { zh: '理解“受保护的打入”：金将将军时，对方不能直接把它吃掉。', en: 'Understand a protected drop: the checking gold cannot simply be captured.' },
    line: [
      { move: 'e6e7', explanation: { zh: '先手玉从 e6 向前走到 e7，开始保护 d8、e8、f8。玉每次只能走一格，但可以走斜线。两位玉仍不相邻，没有互相将军。这一步的作用是给下一步打入的金将提供保护。', en: 'Your king advances from e6 to e7 and protects d8, e8 and f8. Kings move one square, including diagonally. The kings are not adjacent and do not attack each other. This move provides protection for a later gold drop.' } },
      { move: 'e9d9', explanation: { zh: '后手玉从 e9 走到 d9。这是一个合法选择；本回放没有声称它是唯一应对。现在观察 d9 正下方的 d8：它是空格，而且受 e7 的先手玉保护，适合打入金将。', en: 'The opposing king moves e9–d9, one legal choice rather than a claimed forced reply. Inspect d8 immediately below it: the square is empty and protected by your king on e7, making it a useful gold-drop square.' } },
      { move: 'G@d8', explanation: { zh: '先手把持驹金打在 d8。金向前攻击 d9，也控制 c9、e9 和左右的 c8、e8。后手玉周围的逃格都被控制；若吃 d8 金，又会走进 e7 玉的攻击，所以不合法。后手无合法解将着法，先手获胜。这是金将打入，不受“打步诘”的步兵限制。', en: 'Drop the gold on d8. It attacks d9, the forward diagonals c9/e9, and the side squares c8/e8. All escape squares are covered. Capturing the gold enters your king’s attack from e7 and is illegal. With no legal answer to check, the first player wins. The pawn-drop-mate prohibition does not apply to gold.' } },
    ], result: '1-0',
  },
  {
    id: 'chess-open-diagonal', game: 'chess', replayOnly: true,
    title: { zh: '四步讲解：国王前方的斜线怎样打开', en: 'Four annotated plies: opening a diagonal to the king' },
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    introduction: { zh: '这是一段故意包含错误走法的教学示例，不是推荐开局，也不是某场历史比赛。双方每走一次称为一着。本例有四着：白、黑、白、黑。先看棋盘，再按下一步；系统不会自动替你快放。', en: 'This teaching example deliberately includes mistakes. It is not a recommended opening or an attributed historical game. One player’s move is one ply: this example has White, Black, White, Black. Inspect the board before each Next step; nothing auto-plays.' },
    goal: { zh: '学习目标：看清白王为何被将杀，而不是照着白方的错误开局去下棋。', en: 'Learning goal: understand why White is checkmated, not copy White’s opening mistakes.' },
    line: [
      { move: 'f2f3', explanation: { zh: '白方把 f2 兵走到 f3。兵第一次可以走一格；这步合法，但 f2 空了。观察 e1 白王右前方原本由这个兵遮住的斜线。合法不等于安全，接下来还要看对方能怎样利用空格。', en: 'White plays the f2 pawn to f3. A one-square first pawn move is legal, but f2 is now empty. Inspect the diagonal leading toward the white king on e1. Legal does not mean safe: the opponent may use the newly opened square.' } },
      { move: 'e7e5', explanation: { zh: '黑方把 e7 兵走到 e5。兵从起始格走两格时，中途 e6 和目标 e5 都必须空着。这一步腾空 e7，让 d8 黑后通往 h4 的斜线 d8—e7—f6—g5—h4 打开。', en: 'Black plays e7–e5. A two-square initial pawn move requires both e6 and e5 to be empty. Clearing e7 opens the queen’s diagonal from d8 through e7, f6 and g5 to h4.' } },
      { move: 'g2g4', explanation: { zh: '白方又把 g2 兵推到 g4。这一步也合法，却腾空了 g3；与前面腾空的 f2 连起来，形成 h4—g3—f2—e1 的通路。白王就在 e1，黑后下一步可以沿这条斜线将军。先在棋盘上逐格找一遍。', en: 'White pushes g2–g4. It is legal, but leaves g3 clear. Together with the earlier f2 move, the diagonal h4–g3–f2–e1 is open to White’s king. Trace those squares before continuing: the queen can exploit this line.' } },
      { move: 'd8h4', explanation: { zh: '黑后从 d8 到 h4，沿 h4—g3—f2—e1 将军。白王周围被己方棋子挡住，不能逃到安全格；白方也没有能吃掉黑后或挡住这条斜线的合法着法。规则引擎确认白方合法着法为零且正在被将军，因此黑方将杀获胜。回退一步可以重新看清最后这条攻击线。', en: 'The black queen moves d8–h4, checking along h4–g3–f2–e1. White’s own pieces obstruct the king’s escape; no legal capture or blocking move removes the check. The engine confirms White is in check with zero legal moves, so Black wins by checkmate. Step back to inspect the final attack again.' } },
    ],
    result: '0-1',
  },
  {
    id: 'chess-back-rank', game: 'chess',
    title: { zh: '后排将杀：车封住国王的整排', en: 'Back-rank mate: a rook controls the rank' },
    fen: '6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1',
    introduction: { zh: '白方走。黑王在 g8，自己的 f7、g7、h7 兵挡住了向前逃跑的格子。车可以沿直线走，但不能越过棋子。先找白车能到达的第八排。', en: 'White moves. The black king on g8 is boxed in by its own pawns on f7, g7 and h7. A rook moves along clear straight lines. Find how the white rook can reach rank eight.' },
    goal: { zh: '一步将杀：既攻击黑王，又让它无法逃走、吃掉攻击者或挡住攻击。', en: 'Mate in one: attack the king so it cannot escape, capture the attacker or block the attack.' },
    line: [{ move: 'e1e8', explanation: { zh: '车从 e1 到 e8，沿第八排攻击 g8 的黑王。f8、h8 也在车的攻击线上；第七排被黑兵堵住。黑方没有合法解将着法，因此是将杀，不是仅仅将军。', en: 'Re8 attacks the king on g8 along rank eight. The rook also controls f8 and h8, while black pawns block rank seven. Black has no legal escape from check: this is checkmate, not merely check.' } }],
    result: '1-0',
  },
  {
    id: 'xiangqi-two-rooks', game: 'xiangqi',
    title: { zh: '双车封锁：一辆将军，一辆守退路', en: 'Two-rook net: check and cover the escape' },
    fen: '4k4/RR7/9/9/9/4P4/9/9/9/4K4 w - - 0 1',
    introduction: { zh: '红方走。黑将在 e10，红车在 a9 和 b9。将只能在九宫内沿直线走一格；红兵 e5 隔开两位将帅。观察两辆车怎样分别控制第十排和第九排。', en: 'Red moves. Black’s general is on e10 and red rooks are on a9 and b9. The general moves one orthogonal step inside its palace; the pawn on e5 separates the generals. Consider controlling ranks ten and nine separately.' },
    goal: { zh: '一步将死黑将，同时封住它向下的退路。', en: 'Checkmate in one while covering the general’s downward escape.' },
    line: [{ move: 'a9a10', explanation: { zh: 'a9 的车走到 a10，沿第十排将军并控制 d10、f10。b9 的车仍控制 e9，所以黑将不能向下走。两辆车都在九宫外，黑将也不能一步吃掉它们。黑方无合法应对，红方胜。', en: 'The a9 rook moves to a10, checking along rank ten and covering d10 and f10. The b9 rook still controls e9. Both rooks are outside the palace and cannot be captured by the general in one step. Black has no legal reply; red wins.' } }],
    result: '1-0',
  },
  {
    id: 'shogi-gold-drop', game: 'shogi',
    title: { zh: '持驹打入：金将与玉将合作', en: 'Gold drop: cooperate with your king' },
    fen: '4k4/9/4K4/9/9/9/9/9/9[G] w - - 0 1',
    introduction: { zh: '先手走。后手玉在 e9，先手玉在 e7，先手持驹区有一枚金将。持驹是可以放回空格的己方棋子。这里使用页面的字母加数字坐标；先点击持驹金，再点目标格。', en: 'First player moves. The opposing king is on e9, yours on e7, and you have a gold in hand. A piece in hand can be dropped on an empty square. Coordinates use this page’s letters and numbers. Select the gold in hand, then its destination.' },
    goal: { zh: '用一步打入造成将死；不是把金将放到任意空格。', en: 'Deliver mate with one drop, rather than placing the gold on any empty square.' },
    line: [{ move: 'G@e8', explanation: { zh: '把金打在 e8。金向前攻击 e9，也攻击前方两斜格 d9、f9。自己的玉 e7 保护金 e8，并控制 d8、f8。后手玉既不能逃走，也不能吃掉受保护的金，因此将死。金打将死是合法的；禁止的是“步兵打入直接将死”，不要混淆。', en: 'Drop the gold on e8. It attacks e9 and the forward diagonals d9 and f9. Your king on e7 protects e8 and covers d8 and f8. The opposing king can neither escape nor capture the protected gold. A mating gold drop is legal; the special prohibited drop mate concerns a pawn, not a gold.' } }],
    result: '1-0',
  },
];
