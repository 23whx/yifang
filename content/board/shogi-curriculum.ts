import type { Tutorial, TutorialStep } from '../tutorials';
export function shogiCurriculum(first:Tutorial,old:Tutorial):Tutorial[]{
  const take=(t:Tutorial,id:string)=>{const s=t.steps.find(s=>s.id===id);if(!s)throw new Error(`Missing ${t.slug}/${id}`);return s;};
  const text=(id:string,zh:string,en:string,z:string[],e:string[],position?:TutorialStep['position']):TutorialStep=>({id,title:{zh,en},body:{zh:z,en:e},...(position?{position}:{})});
  return [
    {...first,title:{zh:'将棋第一课：辨方向、认棋与轮流走子',en:'Shogi Lesson 1: Direction, Pieces and Turns'},description:{zh:'只集中讲一次八种棋子的基本走法，先学坐标、方向与王的安全；持驹、打入和成的完整规则放在第二课。',en:'Learn the eight basic piece movements once, with coordinates, direction and king safety. Full rules for pieces in hand, drops and promotion follow in Lesson 2.'},steps:[
      take(first,'beginner-welcome'),
      text('coordinates','数一数棋子，再找到 g3','Count the pieces, then find g3',[
        '开局每方 20 枚棋子：王 1 枚，飞车、角行各 1 枚，金将、银将、桂马、香车各 2 枚，步兵 9 枚。从下方先手的角度看，本站用字母 a–i 从左到右标列，用数字 1–9 从下到上标行。g3 就是第七列第三行，开局时这里是先手的一个步兵。翻转棋盘不会改变坐标名。',
        '先手朝数字变大的方向前进，后手朝数字变小的方向前进。所以先手走 g3→g4、后手走 c7→c6，都叫“向前”。日本棋谱还有一套自己的记法，先学会本站坐标就够了。',
      ],[
        'Each side starts with 20 pieces: one king, one rook, one bishop, two each of golds, silvers, knights and lances, and nine pawns. Seen from Sente at the bottom, this site labels files a–i from left to right and ranks 1–9 from bottom to top. g3 is the seventh file, third rank; at the start a Sente pawn stands there. Flipping the board does not rename squares.',
        'Sente moves toward higher rank numbers and Gote toward lower ones. So Sente\'s g3–g4 and Gote\'s c7–c6 are both forward moves. Japanese notation has its own system; the site coordinates are all you need for now.',
      ],take(first,'pieces').position),
      take(first,'pieces'),take(first,'beginner-turn'),take(first,'guided-opening'),
      text('ready-for-next','下一课还要学什么','What comes next',[
        '王被攻击叫“王手”，也就是将军。你必须用一步合法的棋解除所有攻击；没有办法解除，就是将死。也不能把王走到被攻击的格子，或者挪开挡在王前面的棋子让王暴露。',
        '这一课只学了普通走法，还不是将棋的全部。将棋有两条特别规则：吃到的棋子可以放回棋盘上为自己所用；部分棋子走到对方阵地后可以翻面“升级”。下一课先讲清这两件事，再做练习。不要以为国际象棋的规则在这里都适用。',
      ],[
        'A king under attack is in check (oute). You must answer with a legal move that removes every attack; if there is none, it is mate. You also may not move your king onto an attacked square, or move away a piece that is shielding your king.',
        'This lesson covers ordinary moves only. Shogi has two special rules: captured pieces can be put back on the board on your side, and some pieces can flip over to promote once they reach the enemy camp. The next lesson explains both before the exercises. Don\'t assume chess rules apply here.',
      ]),
    ]},
    {...old,title:{zh:'将棋第二课：持驹、打入、成与将死',en:'Shogi Lesson 2: Pieces in Hand, Drops, Promotion and Mate'},description:{zh:'在第一课的走法基础上，学习持驹如何使用、打入限制、成的条件，再分析一手将死与重复局面。',en:'Build on Lesson 1 with pieces in hand, legal drops and promotion, then analyze mate in one and repetition.'},steps:[
      text('prerequisites','开始前：先会第一课的内容','Before you start: Lesson 1 first',[
        '请先学完第一课：会找 g3、分得清金和银的走法、知道后手的“前方”和先手相反。还不熟就先回第一课。下面每个案例都单独摆好，不是同一盘棋接着下。',
        '这一课的顺序是：吃子变成持驹 → 合法打入 → 升级（成）→ 判断将死 → 和棋与其他规则。先读规则限制再动手。跟着走完一组着法，不代表你赢了一盘棋。',
      ],[
        'Finish Lesson 1 first: find g3, tell gold from silver, and know that Gote\'s forward is the opposite of Sente\'s. If anything is unclear, go back to Lesson 1. Each example below is set up on its own; they are not one continuous game.',
        'This lesson goes in order: captured pieces in hand → legal drops → promotion → recognising mate → repetition and other rules. Read the restrictions before you act. Finishing a guided line is not the same as winning a game.',
      ]),take(first,'beginner-captured'),
      text('drops','跟着做：把持金和持银打入棋盘','Follow along: dropping a gold and a silver',[
        '这个练习一开始就给先手一枚持金和一枚持银，放在棋盘旁边，这不是正常的开局摆法。先点持金，再点 d8，完成 G@d8。“@”表示从手里打入，不是从棋盘某格走过来。打入后持金数量少一枚。',
        '接着后手的王 e9→f9 躲开金的攻击，再轮到先手把持银打在 f8，完成 S@f8。三步必须轮流走，不能连着打入两枚。这枚银向前攻击 f9 的王，是将军，但不是将死：f8 的银没有棋子保护，后手的王可以直接吃掉它。“将军”不等于“将死”。',
      ],[
        'This exercise starts with Sente holding one gold and one silver beside the board — not the normal starting setup. Select the gold in hand, then d8, to play G@d8. The @ means a drop from your hand, not a move from another square. Your gold count goes down by one.',
        'Gote\'s king then steps e9–f9 away from the gold, and Sente drops the silver on f8: S@f8. The three moves alternate; you can never drop two pieces in a row. The silver attacks the king on f9 — that is check, but not mate: nothing protects the silver on f8, so the king can simply capture it. Check is not the same as checkmate.',
      ],take(old,'drops').position),
      text('promotion','升级（成）：什么时候可以，什么时候必须','Promotion: when you may, when you must',[
        '靠近对手的三行叫“升级区”（敌阵）：先手是第 7、8、9 行，后手是第 1、2、3 行。可以升级的棋子，只要这一步的起点或终点在升级区里，就可以选择翻面升级。打入的那一步不能升级。王和金不能升级。',
        '步兵、香车、桂马、银将升级后都改用金的走法；飞车升级后保留直线走法，再加上斜向一格；角行升级后保留斜线走法，再加上横竖一格。升级后的棋子如果被吃，到对方手里会恢复原来的身份。',
        '步兵和香车走到自己的最后一行必须升级，桂马走到最后两行必须升级，否则它们就再也走不动了。“最后”是对棋子主人而言。其他情况一般可以自己选要不要升级；不在升级区里就不能随便翻面。',
        '演示：先手 g7→g8 并升级，记作 g7g8+，加号表示这一步选择了升级。棋子还在 g8，只是走法变了。比较一下：升级前的步兵只能向前一格，升级后能按金的方式走。这一步还没有将死对手。',
      ],[
        'The three ranks nearest your opponent are the promotion zone: ranks 7–9 for Sente and 1–3 for Gote. A piece that can promote may do so whenever the move starts or ends inside the zone. A drop can never promote on the same turn. Kings and golds never promote.',
        'Promoted pawns, lances, knights and silvers all move like a gold. A promoted rook keeps its straight lines and adds one step diagonally; a promoted bishop keeps its diagonals and adds one step straight. If a promoted piece is captured, it returns to its original form in the captor\'s hand.',
        'A pawn or lance reaching its last rank must promote, and a knight reaching its last two ranks must promote, because otherwise it could never move again. "Last" depends on who owns the piece. In other cases promotion is usually your choice, but outside the zone you can never flip a piece.',
        'Demo: Sente plays g7–g8 and promotes, written g7g8+; the plus sign records the promotion. The piece stays on g8 but now moves like a gold. Compare its old one-step-forward move with its new gold moves. This move does not checkmate.',
      ],take(old,'promotion').position),
      {...take(old,'mate'),body:{zh:[
        '“诘”就是王被将军，而且怎么应对都不行。判断时不能只看王能不能走，还要看能不能吃掉攻击的棋子、能不能用别的棋子挡住或打入防守。这是专门摆的一步将死题，不代表所有终局都靠打入。',
        '先手把持金打在 e8，攻击 e9 的后手王。王不能吃这枚金，因为 e7 的步兵在保护它；f8、f9、d8 都被金控制；d9 被后手自己的香车占着。香车只能向前直走，吃不到 e8 的金，后手也没有别的解将办法，所以这是将死。请把王周围五个点逐个检查一遍，而不是只记住“金打 e8”。',
      ],en:[
        'Mate (tsumi) means the king is in check and no reply helps. Don\'t only ask whether the king can move: also ask whether the attacker can be captured, or whether another piece or a drop can block. This is a hand-made mate-in-one puzzle; not every ending relies on a drop.',
        'Drop the gold on e8, attacking Gote\'s king on e9. The king cannot take the gold because the pawn on e7 protects it. The gold covers f8, f9 and d8, and Gote\'s own lance occupies d9. A lance only moves straight forward, so it cannot capture on e8, and Gote has no other defence: it is mate. Check all five squares around the king yourself instead of memorising "gold to e8".',
      ]}},
      text('repetition','千日手和入玉：别套用其他棋的规则','Repetition and entering kings',[
        take(first,'promotion-drops').body.zh[2],
        '判断“同一局面”时，除了棋盘上的棋子，还要看双方手里的持驹和轮到谁走。入玉后的宣言和计点要求，以所选比赛规则为准；这里只是简单介绍，不是完整的裁定方法。',
      ],[take(first,'promotion-drops').body.en[2],
        '"The same position" also includes both players\' pieces in hand and whose turn it is, not just the board. Declaration and point rules for entering kings depend on the rules your event uses; this is only a short introduction, not a full adjudication guide.',
      ]),
      text('strategy','下一步：学会做计划，而不是背固定走法','Next: make plans, not fixed scripts',[
        '“围”是用金、银等棋子在王周围搭起的防守阵型，不像国际象棋的王车易位那样是一步特殊走法，而是用普通走法一步步摆出来。什么时候守、什么时候攻，要看对手的威胁，没有“先摆十几步再进攻”的固定规定。',
        '开始实战前，每步都检查：自己的王有没有被攻击、对手手里有什么持驹、对手打入后可能在哪里将军。复盘时记下漏看的威胁，回到前一个局面试试别的走法。本课没有演示完整的美浓围或棒银，读完这一课还不算掌握这些开局。',
      ],[
        'A castle is a defensive formation built around the king with golds, silvers and other pieces. Unlike castling in chess it is not one special move: you build it with ordinary moves. When to defend and when to attack depends on your opponent\'s threats; there is no rule that you must make a fixed dozen setup moves first.',
        'Before each move in a real game, check: is my king under attack, what pieces does my opponent hold in hand, and where could a drop give check? When reviewing, note any threat you missed and try another move from the position before it. This lesson does not show a complete Mino castle or Climbing Silver, so reading it does not mean you know those openings.',
      ]),
    ]},
  ];
}
