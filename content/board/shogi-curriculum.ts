import type { Tutorial, TutorialStep } from '../tutorials';
export function shogiCurriculum(first:Tutorial,old:Tutorial):Tutorial[]{
  const take=(t:Tutorial,id:string)=>{const s=t.steps.find(s=>s.id===id);if(!s)throw new Error(`Missing ${t.slug}/${id}`);return s;};
  const text=(id:string,zh:string,en:string,z:string[],e:string[],position?:TutorialStep['position']):TutorialStep=>({id,title:{zh,en},body:{zh:z,en:e},...(position?{position}:{})});
  return [
    {...first,title:{zh:'将棋第一课：辨方向、认棋与轮流走子',en:'Shogi Lesson 1: Direction, Pieces and Turns'},description:{zh:'只集中讲一次八种棋子的基本走法，先学坐标、方向与王的安全；持驹、打入和成的完整规则放在第二课。',en:'Learn the eight basic piece movements once, with coordinates, direction and king safety. Full rules for pieces in hand, drops and promotion follow in Lesson 2.'},steps:[
      take(first,'beginner-welcome'),
      text('coordinates','先数棋子，再找 g3','Count the pieces, then find g3',[
        '每方开局 20 子：王 1、飞 1、角 1、金 2、银 2、桂 2、香 2、步 9。以先手在底部观看，本站字母 a–i 从左到右、数字 1–9 从下到上；g3 是第七列第三行，初始有先手步兵。翻转视角不改变坐标名字。',
        '先手朝数字变大的方向前进，后手朝数字变小的方向前进。因此先手 g3→g4 和后手 c7→c6 都是向前。日本棋谱另有数字筋与段的记法，本课先使用页面坐标，不要求同时学习两套地址。',
      ],[
        'Each side starts with 20 pieces: one king, rook and bishop; two golds, silvers, knights and lances; nine pawns. From Sente at the bottom, site files a–i run left to right and ranks 1–9 bottom to top. g3 is file seven, rank three, initially holding a Sente pawn. Flipping the view does not rename coordinates.',
        'Sente advances toward larger rank numbers; Gote toward smaller ones. Thus g3–g4 for Sente and c7–c6 for Gote both advance. Japanese notation uses another file-and-rank system; learn the site coordinates first.',
      ],take(first,'pieces').position),
      take(first,'pieces'),take(first,'beginner-turn'),take(first,'guided-opening'),
      text('ready-for-next','学会走子后，还要学哪些规则','What remains before a full game',[
        '王被攻击叫“王手”，也就是将军。必须用合法着法解除全部攻击；若没有办法，便是将死。不能把王走到受攻击的格子，也不能移开保护后让自己的王暴露。',
        '这篇只完成普通走子的入门，不代表已学完将棋。将棋还允许把吃到的棋子重新放回盘上，以及让某些棋子翻面改变走法。下一课先解释这两件事，再练具体案例；不要只学第一课就默认所有国际象棋规则也适用。',
      ],[
        'An attacked king is in check, called oute. A legal response must remove every attack; without one it is mate. Never move your king onto an attacked square or expose it by moving a defender.',
        'This lesson covers ordinary movement, not every shogi rule. Captured pieces can return to the board, and eligible pieces can promote. The next lesson defines these operations before its examples. Do not assume chess rules apply.',
      ]),
    ]},
    {...old,title:{zh:'将棋第二课：持驹、打入、成与将死',en:'Shogi Lesson 2: Pieces in Hand, Drops, Promotion and Mate'},description:{zh:'在第一课的走法基础上，学习持驹如何使用、打入限制、成的条件，再分析一手将死与重复局面。',en:'Build on Lesson 1 with pieces in hand, legal drops and promotion, then analyze mate in one and repetition.'},steps:[
      text('prerequisites','先确认前置知识','Check the prerequisites',[
        '先确认自己会找 g3、能分清金与银的走法，以及知道后手的“前方”与先手相反。如果还不熟，请回第一课。下面每个案例分别摆题，不是同一盘棋连续下去。',
        '本课按“吃子获得持驹 → 合法打入 → 成 → 检查将死 → 对局边界”学习。先读限制再操作，完成跟做只表示这条路线走完，不表示赢了正式比赛。',
      ],[
        'First locate g3, distinguish gold from silver movement, and identify forward for each player. Return to Lesson 1 if needed. Each example starts separately; they are not one continuous game.',
        'Follow captures into hand, legal drops, promotion, mate checks and game boundaries in that order. Read restrictions before acting. Completing a guided line does not mean winning a match.',
      ]),take(first,'beginner-captured'),
      text('drops','跟做：持金与持银怎样进入棋盘','Follow a gold and silver entering play',[
        '本题为了集中练习，起点已经给先手一枚持金和一枚持银，放在棋盘旁；这不是标准初始布局。先选持金，再点 d8，完成 G@d8。“@”表示从手中打入，不是从盘上某格走来。持金数量随之减少一枚。',
        '后手王 e9→f9 躲开金的攻击，再轮到先手选持银放到 f8，完成 S@f8。三手必须轮流执行，不可连续打两子。这枚银从 f8 向前攻击 f9 的王，构成将军，但不是将死；后手仍有合法应对。不要把“将军”当成“将死”。',
      ],[
        'The authored starting position gives Sente one gold and one silver in hand; this is not the standard starting array. Select the gold in hand, then d8: G@d8. The @ symbol means a drop from hand, not a move from another board square. The hand count decreases by one.',
        'Gote moves the king e9–f9 away from the gold, then Sente drops the silver on f8: S@f8. Alternate all three turns; never drop two pieces consecutively. The silver gives check but not automatically mate. Examine the defender’s legal responses instead of equating check with mate.',
      ],take(old,'drops').position),
      text('promotion','成：什么时候能翻面，什么时候必须翻面','Promotion: optional versus compulsory',[
        '靠近对手的三行叫升变区。先手是第 7、8、9 行，后手是第 1、2、3 行。可升级棋子走动时，起点或终点在区内即可选择“成”；打入那一步不能成。王和金不能成。',
        '步、香、桂、银成后采用金的走法；飞成后保留直线移动并增加斜向一格；角成后保留斜线移动并增加横竖一格。它们不是变成另一枚持金，若后来被吃，回到手中仍恢复原身份。',
        '步和香走到自己的最后一行必须成，桂走到最后两行必须成，否则将再无合法移动方向。这里“最后”按棋子所属一方判断。其它允许成的移动通常可选；不在升变区也不能随意翻面。',
        '演示先手 g7→g8 并成，记作 g7g8+，加号是这手选择升级。终点仍是 g8，只是棋子走法改变。请比较成前的步只能向前，与成后的金式走法；这一步还没有将死对手。',
      ],[
        'The far three ranks form the promotion zone: ranks 7–9 for Sente and 1–3 for Gote. An eligible move may promote if its origin or destination is in the zone. Drops never promote on that turn. Kings and golds cannot promote.',
        'Promoted pawns, lances, knights and silvers move as golds. A promoted rook keeps its sliding moves and gains one-step diagonals; a promoted bishop gains one-step orthogonal moves. They retain their original identity and revert to it when captured.',
        'Pawns and lances must promote on their last rank; knights on their last two ranks, where their ordinary movement would become impossible. Last is relative to the owner. Other eligible promotions are generally optional; outside the zone you cannot flip a piece freely.',
        'The example plays g7–g8 with promotion, written g7g8+. The plus records promotion on that move. The piece stays on g8 but gains gold movement. Compare that with its former one-step-forward move; this is not checkmate.',
      ],take(old,'promotion').position),
      {...take(old,'mate'),body:{zh:[
        '“诘”就是王被攻击却没有合法应对。不能只检查王能不能走，也要检查是否能吃掉攻击子、用其它子解围或打入防守。这道题是作者摆出的一手将死案例，不代表所有终盘都要靠打入。',
        '先手把持金打到 e8，攻击 e9 的后手王。王不能吃 e8 金，因为 e7 步保护它；f8、f9、d8 被金控制；d9 被后手自己的香占据。后手香无法吃 e8 金，又没有其它解将手段，因此这一次确实将死。请逐个对照五个相邻点，不要只记住“金打 e8”。',
      ],en:[
        'Mate means check with no legal answer. Check king moves, captures and defenses by other pieces or drops. This is an authored mate-in-one example, not a claim that every ending relies on a drop.',
        'Drop the gold on e8 to attack the king on e9. The king cannot capture the gold because the e7 pawn protects it. The gold controls f8, f9 and d8; Gote’s own lance occupies d9. That lance cannot capture the gold and there is no other check evasion. Inspect all five adjacent points rather than memorize a drop square.',
      ]}},
      text('repetition','重复局面与进王：不要套用别的棋种','Repetition and entering kings',[
        take(first,'promotion-drops').body.zh[2],
        '“同局面”也要看双方持驹和轮到谁，不能只比较盘上棋子。“入玉”指王进入敌阵，不是达到那里就自动获胜。实际比赛的声明和点数要求必须按所选规则确认，本课不把简短介绍当作完整裁定办法。',
      ],[take(first,'promotion-drops').body.en[2],
        'Position identity includes pieces in hand and whose turn it is, not just board pieces. An entering king has reached the opposing camp; arrival alone is not victory. Declaration and point requirements depend on the selected rules. This introduction is not a complete adjudication procedure.',
      ]),
      text('strategy','下一步学计划，不背固定十几手','Next: make a plan, not a fixed script',[
        '“围”是用金银等棋子帮助王防守的布局，不是国际象棋王车易位那样的特殊一步。每枚棋子仍按正常走法一手一手移动。是否先防守、何时进攻，必须看对手的威胁，不存在固定先摆十几手再进攻的规则。',
        '开始实战前，依次检查王是否受攻、对手持有什么子、打入后可能在哪里将军。复盘时记录漏看的威胁，并回到前一局面验证另一种走法。本课没有演示完整美浓围或棒银路线，不能把阅读完成当作已经掌握这些开局。',
      ],[
        'A castle is a defensive arrangement with golds, silvers and other pieces, not a special single move like castling in chess. Build it with ordinary turns. Respond to threats: there is no rule requiring a fixed dozen setup moves before attacking.',
        'Before moving, check king safety, the opponent’s pieces in hand and possible checking drops. In review, record a missed threat and test an alternative from the preceding position. This lesson does not demonstrate a complete Mino Castle or Climbing Silver opening; reading it does not establish mastery of them.',
      ]),
    ]},
  ];
}
