import type { Tutorial, TutorialStep } from '../tutorials';
const l=(zh:string,en:string)=>({zh,en});
const chapter=(id:string,zh:string,en:string,pairs:[string,string][],position?:TutorialStep['position']):TutorialStep=>({id,title:l(zh,en),body:{zh:pairs.map(p=>p[0]),en:pairs.map(p=>p[1])},...(position?{position}:{})});
const start='rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';
export function xiangqiCurriculum(first:Tutorial,old:Tutorial,demos:TutorialStep[]):Tutorial[]{
  const find=(id:string)=>{const s=first.steps.find(s=>s.id===id)??old.steps.find(s=>s.id===id);if(!s)throw new Error(`Missing xiangqi source ${id}`);return s;};
  const pieces=find('pieces');
  const completePieces={...pieces,body:{
    zh:['开局每方有 16 枚棋子：帅或将 1 枚，仕或士、相或象、车、马、炮各 2 枚，兵或卒 5 枚。红黑方有些字不同，表示的是对应的同一种棋子。先对照初始棋盘找齐，再逐种读下面的动作。',...pieces.body.zh],
    en:['Each side starts with 16 pieces: one general, two each of advisors, elephants, chariots, horses and cannons, and five soldiers. Some red and black characters differ but name corresponding piece types. Locate them in the starting diagram before studying their moves.',...pieces.body.en],
  }};
  return [
    {...first,title:l('中国象棋第一课：认棋、走子与胜负','Xiangqi Lesson 1: Pieces, Moves and Winning'),minutes:45,
      description:l('合并两篇旧入门课：只讲一次基本规则，配合马腿、象眼、炮架和过河案例，再亲手完成第一组着法。','One consolidated introduction: learn each basic rule once, inspect horse-leg, elephant-eye, cannon-screen and river examples, then play an opening sequence.'),
      steps:[find('beginner-welcome'),find('beginner-board'),completePieces,find('beginner-ending'),...demos,find('pawn'),find('guided-opening')]},
    {game:'xiangqi',slug:'xiangqi-basics',title:l('第二课：读懂棋谱，走好开局六步','Lesson 2: Read Moves and Develop Your Pieces'),level:l('入门进阶','Next steps'),minutes:25,
      description:l('原第二篇入门课已合入第一课。这里改学坐标与中文记谱的区别、出子、通车路，以及每一步开局的目的。','The old introduction has been merged into Lesson 1. Learn notation, development, clear chariot routes and the purpose of an opening sequence.'),steps:[
        chapter('notation','坐标与“炮二平五”怎样对应','Coordinates versus traditional notation',[
          ['本课先完成第一课再学。本站坐标从红方视角左到右为 a–i，近到远为 1–10，翻转棋盘不改变地址；传统记谱却从走棋一方的右手边开始数路。不要把 a 路直接叫红方一路：红方的一路在 i 列，二路在 h 列，五路在 e 列。','Complete Lesson 1 first. Site coordinates run a–i left to right and 1–10 near to far from Red; flipping the board does not rename points. Traditional notation counts files from the moving player’s right. Red’s file one is i, two is h, and five is e.'],
          ['“炮二平五”分成四部分：炮、原来在二路、横向移动、到五路。初始局面对应 h3→e3，不是 b3→e3；左边 b3 的炮属于红方八路。同理“马二进三”是 h1→g3，“车一平二”是 i1→h1。','Read 炮二平五 as cannon, starting file two, horizontal move, destination file five: h3→e3, not b3→e3. The b3 cannon starts on Red’s file eight. 馬二进三 corresponds to h1→g3 and 車一平二 to i1→h1.'],
          ['“进、退”相对走棋的一方，不是永远向屏幕上、下。直行棋子进退后的数字表示走几步；马、相、仕斜行时表示目标路数。先用坐标跟做下面案例，不要求一次背完所有记谱。','Advance and retreat are relative to the moving player, not always up and down on screen. For straight moves the final number gives distance; for horses, elephants and advisors it gives the destination file. Use coordinates for the exercise before memorizing every notation convention.'],
        ]),
        chapter('develop','“出子”不是所有棋子都往前冲','Development means useful activity',[
          ['出子，是让车马炮从拥挤的起点来到能行动、能互相照应的位置。先看马腿有没有被堵、车前面有没有通路，而不是觉得离对手越近越好。保护帅的仕相也有任务，不必一开始全走出去。','Development means giving chariots, horses and cannons useful routes and support. Check horse legs and chariot routes instead of simply moving closer to the enemy. Advisors and elephants protect your general and need not all move immediately.'],
          ['例如初始 i1 红车不能立刻平到 h1，因为那里有自己的马。先把 h1 马走到 g3，下一次轮到红方时，车才有机会进入 h1 这条路。中间黑方也会走一步，不是红方连续走马和车。','The initial i1 chariot cannot move to h1 because its own horse occupies that point. Move the horse to g3 first; on a later Red turn the chariot can use h1. Black gets a turn between these moves.'],
        ],{fen:start,moves:['h1g3','h10g8','i1h1']}),
        chapter('six-moves','手把手：中炮对屏风马的前三回合','Follow three turns for each side',[
          ['第一回合：红 h3→e3，把炮移到中路，叫中炮；黑 h10→g8，先出一匹马。红炮到了中路不等于已经将军，更不等于马上获胜；还要数炮和目标之间有几个棋子。','First pair of turns: Red h3→e3 places a central cannon; Black h10→g8 develops a horse. A central cannon is not automatically check or a win: count the intervening pieces before claiming a capture.'],
          ['第二回合：红 h1→g3，腾出车路；黑 b10→c8，另一匹马也出来，两马的布局称屏风马。第三回合：红 i1→h1，让车进入空路；黑 a10→a9，把车提起一格。这只是供学习的合法分支，不是对手必须照走的剧本。','Second pair: Red h1→g3 clears a chariot route; Black b10→c8 develops the other horse, making a Screen Horses setup. Third pair: Red i1→h1 activates the chariot; Black a10→a9 lifts a chariot. This is a legal teaching line, not a forced script for your opponent.'],
          ['选择“我来走”，依次操作六手。每走一手说出：刚才腾出了什么位置，下一手轮到谁？完成后停下来比较双方的大子是否更容易活动。背得出名称不算掌握，能说明目的才算。','Choose Try the moves and make all six moves. After each, identify the point or route cleared and whose turn follows. At the end compare piece activity. Explaining the purpose matters more than memorizing the opening name.'],
        ],{fen:start,moves:['h3e3','h10g8','h1g3','b10c8','i1h1','a10a9']}),
        chapter('opening-check','每次落子前的三个问题','Three questions before committing',[
          ['先问“对手刚才威胁什么？”例如攻击了我的炮、准备将军，还是只是出马。再问“我要去的位置安全吗？”检查对方车线、马腿与炮架。最后问“走开以后，我原来保护的棋子会不会失去保护？”','First ask what the opponent’s last move threatens: your cannon, a check, or perhaps nothing immediate. Next inspect attacks on your intended destination. Finally ask which piece or line loses protection when your piece leaves.'],
          ['练习复述：红车要走 i1→h1，先确认 h1 已空、横移不越子、走后帅仍安全。不要因为这个案例中合法，就在所有局面里照搬。下一课学习怎样判断吃子后是否会被反吃。','Explain i1→h1: h1 must be empty, the path clear and your general safe after moving. A legal move in this example is not valid in every position. The next lesson examines captures and recaptures.'],
        ]),
      ]},
    {game:'xiangqi',slug:'xiangqi-captures',title:l('第三课：吃子、保护与交换','Lesson 3: Captures, Protection and Exchanges'),level:l('入门进阶','Next steps'),minutes:25,description:l('先解释“保护、反吃、交换”是什么意思，再用完整走子案例练习落子前检查。','Learn protection, recapture and exchange through a complete move sequence and a pre-move checklist.'),steps:[
      chapter('capture-vocabulary','吃到一枚子，为什么未必赚了','A capture is not always a gain',[
        ['吃子就是自己的棋子走到敌子的交叉点，敌子离开棋盘；不是把两枚棋子堆在一起。“反吃”是对手接下来吃掉刚刚吃子的那枚棋子。“交换”是双方在这一串行动中各损失了子。','A capture moves your piece onto an enemy-occupied point and removes that enemy piece. A recapture takes the piece that just captured. An exchange is a sequence in which both sides lose material.'],
        ['假设你用车吃了一枚兵，对方随后用马吃掉这辆车：你拿走一兵，却丢了一车，不能只看第一步就说赚了。棋子的作用不同；但也不能只背分数——能否将死、保护帅和阻止威胁更重要。','If your chariot takes a soldier and an enemy horse then takes that chariot, you gained a soldier but lost a chariot. Judge the whole sequence. Piece activity differs, and numerical values alone cannot replace general safety or a forced mate.'],
      ]),
      chapter('protection','“有保护”要检查能不能真的反吃','Protection requires a legal recapture',[
        ['先学完第二课的坐标与轮流走子，再做这题。这里是专门摆出的局面，不是开局：红车 a1，黑卒 a7，黑马 c8，双方将帅在 e1、e10，e6 的黑卒隔开两将。选“我来走”，先不要急着吃，找出黑马能到哪些点。','Use the coordinates and alternating turns from Lesson 2. This is an arranged position, not the opening: a red chariot on a1, black soldier on a7, black horse on c8, generals on e1 and e10, and a black soldier on e6 separating them. Choose Try the moves. Before capturing, inspect the horse’s destinations.'],
        ['一枚子被吃后，另一枚己子能够合法吃掉进来的敌子，就叫它有保护。不能只看两子距离近。车要通路、马要看腿、炮要数炮架；看起来能吃，但一走就让帅受攻，也不能作为有效反吃。','A piece is protected if another friendly piece can legally recapture its attacker. Nearby is not enough: a chariot needs a clear route, a horse an open leg and a cannon exactly one screen. A recapture that exposes your general is illegal.'],
        ['第一步红 a1→a7：车沿空路吃掉黑卒，停在 a7。暂时红方吃到一卒，但还不能下结论。第二步轮到黑方，走 c8→a7：马先横跨两路再偏下一格，马腿 b8 为空，可以吃掉刚到 a7 的红车。完成后 a7 留下黑马，红车和原来的黑卒都不在棋盘上。','First play Red a1→a7: the chariot follows the clear file, captures the soldier and stays on a7. Do not judge the result yet. On Black’s turn play c8→a7: the horse travels two files across and one rank down, with its leg on b8 empty, and captures the chariot. The final a7 piece is the black horse; both the chariot and the original soldier are gone.'],
        ['现在分开数：红失去一车，黑失去一卒。车可以沿整条空直线活动，兵卒的活动范围小得多，这个局面没有将死等补偿，不能把“先吃到”当作赚到。黑马原来就在保护 a7 的卒。请回退两步，再自己说出为什么这次吃卒不划算；本例展示风险，不是建议红方这样下，也不是说黑方只有这一手。','Now list the losses: Red lost a chariot; Black lost a soldier. A chariot can use entire clear lines while a soldier has much shorter reach, and this position offers no compensating mate. Capturing first is not necessarily gaining. The horse was protecting a7 all along. Rewind twice and explain the risk. This is a cautionary example, not a recommended Red move or Black’s only legal reply.'],
      ],{fen:'4k4/9/2n6/p8/4p4/9/9/9/9/R3K4 w - - 0 1',moves:['a1a7','c8a7']}),
      chapter('soldier-capture','跟做：过河兵前进吃卒','Follow a river-crossing soldier capture',[
        ['从初始布局开始，红 e4→e5，黑 a7→a6；红 e5→e6 过河，黑 a6→a5；最后红 e6→e7，吃掉 e7 的黑卒。前四手只是轮流走子，第五手目标上已有敌子，才发生吃子。','From the initial position: Red e4→e5, Black a7→a6; Red e5→e6 crosses the river, Black a6→a5; Red e6→e7 captures the black soldier. The first four moves are non-captures. Only the fifth lands on an enemy piece.'],
        ['每手观察起点是否变空、终点是谁、下一手轮到谁。最后红兵仍在 e7，不会与黑卒一起消失。这条路线不是推荐黑方忽视中路，只是为了单独看清兵的移动和吃子。','After each move inspect the empty origin, the destination occupant and whose turn comes next. The red soldier remains on e7 after the capture. This line illustrates movement and capture; it does not recommend ignoring the center as Black.'],
      ],{fen:start,moves:['e4e5','a7a6','e5e6','a6a5','e6e7']}),
      chapter('exchange-review','检查一次交换，不只数吃了几个','Review the entire exchange',[
        ['在纸上分两栏写“红方失去什么”和“黑方失去什么”，把已经确认的后续反吃算进去。再检查换子之后谁的帅更危险、谁的车路被打开。若后续并不强制，就分别写“对手反吃”和“对手不反吃”两种可能。','List Red’s losses and Black’s losses separately, including confirmed recaptures. Then inspect general safety and newly opened routes. If the reply is not forced, distinguish recapturing from declining the exchange.'],
        ['本课自测：炮能隔两个子吃车吗？不能。己方马离目标很近就一定保护它吗？不一定，还要检查马腿、目标走法和帅的安全。答完再去实战，先做到不无故丢子，不急着追求漂亮连招。','Self-check: can a cannon capture a chariot over two screens? No. Does a nearby friendly horse automatically protect a point? No: check its movement, leg and general safety. Aim first to avoid losing pieces without compensation.'],
      ]),
    ]},
    {game:'xiangqi',slug:'xiangqi-defense',title:l('第四课：遇到将军怎么办，如何复盘','Lesson 4: Respond to Check and Review a Game'),level:l('入门进阶','Next steps'),minutes:30,description:l('分别练习移帅、吃掉攻击子、挡住车路，再学习辨认将死和复盘失误。','Practise moving the general, capturing the attacker and blocking a chariot, then learn to recognize mate and review mistakes.'),steps:[
      chapter('move-general','办法一：把帅移到安全点','Option 1: move the general to safety',[
        ['红帅 e1 被 e2 的黑车沿直线攻击。先别急着攻击黑将：本回合必须解除将军。演示走 e1→d1，离开黑车所在的 e 路，并且仍在九宫里。','The red general on e1 is attacked by the black chariot on e2. You must answer the check now. The example moves e1→d1, off the e-file and still inside the palace.'],
        ['移帅不是任何空点都行：新位置不能被其它敌子攻击，也不能与黑将直接照面。本题是专门摆出的教学局面，移帅只是一个合法办法，不声称是唯一选择。','An empty point is not automatically safe: other enemies may attack it, or the generals might face directly. This is an authored teaching position; moving the general is one legal answer, not necessarily the only one.'],
      ],{fen:'4k4/9/9/9/4p4/9/9/9/4r4/4K4 w - - 0 1',moves:['e1d1']}),
      chapter('take-attacker','办法二：吃掉正在将军的棋子','Option 2: capture the checking piece',[
        ['仍看同一起点，这次走 e1→e2，用帅吃掉黑车。为什么可以？e2 在九宫内，帅直走一格，车被拿走后没有其它黑子攻击 e2，e6 的黑卒仍隔在两将之间。','From the same starting position, play e1→e2 and capture the chariot with the general. e2 is inside the palace and one orthogonal step away. No remaining black piece attacks e2, and the e6 soldier still separates the generals.'],
        ['不要背成“将军的车总能用帅吃”。如果另一个敌子保护这辆车，或吃完会形成两将照面，这个方法就不合法。练习时先重置到起点，再对比两种处理，不是移帅后马上连走吃车。','Do not conclude that a general can always capture a checking chariot. Protection by another enemy or facing generals would make it illegal. Reset to the starting position to compare the two answers; they are alternatives, not consecutive moves.'],
      ],{fen:'4k4/9/9/9/4p4/9/9/9/4r4/4K4 w - - 0 1',moves:['e1e2']}),
      chapter('block-line','办法三：在攻击线上挡一枚子','Option 3: block the attack line',[
        ['本题黑车 e8 沿空的 e 路将军红帅 e1。红车在 d3，走 d3→e3，放到黑车与帅之间，便阻断了车的攻击。这叫“垫子”或“挡将”。','Here the black chariot on e8 checks the red general on e1 along the open e-file. Move the red chariot d3→e3 between them to block the attack. This is interposition.'],
        ['挡住这次将军不表示以后安全，也不意味着挡进去的车永远不会被吃。对方接下来仍有回合。并且不同棋子的攻击不能照搬同一种挡法：炮要重新数炮架，马要检查马腿；每次都验证走后帅确实不受攻击。','Blocking the current check does not guarantee future safety or protect the blocking chariot forever. The opponent still gets another turn. Cannon screens and horse legs require different reasoning: verify that your general is actually safe after the move.'],
      ],{fen:'3k5/9/4r4/9/9/9/9/3R5/9/4K4 w - - 0 1',moves:['d3e3']}),
      chapter('review','将死判定与一局棋的复盘方法','Mate checks and a simple review method',[
        ['将死不是“被将军一次”。依次找移帅、吃攻击子、阻断攻击等合法解除方式；有一种可行就还不是将死。同时受到多个攻击时，一步必须全部解除。不要把演示走完出现的完成提示当成赢了一整盘棋。','One check is not mate. Look for legal general moves, captures and ways to stop every attack. Any legal answer means it is not mate. Against multiple attacks one move must resolve all of them. Finishing a lesson sequence is not winning a full game.'],
        ['复盘就是回看已经发生的着法，找出决策哪里出了问题。先记录双方走子，再定位“第一次白丢棋子”或“第一次没看见将军”的那一步。回到它前一个局面，写下原走法、对手威胁和一个准备验证的替代走法。','Review means replaying the moves to understand decisions. Locate the first uncompensated loss or missed check, return to the position before it, and record your original move, the opponent’s threat and an alternative to test.'],
        ['先验证替代走法是否合法，再问对方可能怎么回，不能只写一句“换一步就赢了”。本站回放和退步是教学工具，正式对战是否允许悔棋要另行约定。下一次练习只改一个习惯，例如每步先看帅是否安全。','Check that the alternative is legal, then consider the opponent’s reply rather than assuming it wins. Lesson replay and rewind are learning tools, not automatic permission for takebacks in a match. Choose one habit to improve next, such as checking general safety before every move.'],
      ]),
    ]},
  ];
}
