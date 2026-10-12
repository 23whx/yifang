import type { Tutorial, TutorialStep } from '../tutorials';
export function chessCurriculum(first:Tutorial,old:Tutorial,demos:TutorialStep[]):Tutorial[]{
  const take=(t:Tutorial,id:string)=>{const s=t.steps.find(s=>s.id===id);if(!s)throw new Error(`Missing ${t.slug}/${id}`);return s;};
  const draw=take(old,'draw');
  const detailedDraw=take(first,'special-rules');
  const long=take(old,'long-range');
  return [
    {...first,title:{zh:'国际象棋第一课：认棋、走子与胜负',en:'Chess Lesson 1: Pieces, Moves and Winning'},
      description:{zh:'集中学习棋盘、六种棋子、吃子与胜负，先读走法，再手动练习。特殊规则和开局判断放在第二课。',en:'Learn the board, six pieces, captures and the objective, then practise moves. Special rules and opening decisions follow in Lesson 2.'},
      steps:[take(first,'beginner-welcome'),take(first,'beginner-address'),take(first,'pieces'),take(first,'beginner-ending'),take(first,'beginner-first-turn'),
        {...long,title:{zh:'案例：观察后与车的通路',en:'Example: inspect queen and rook paths'},body:{
          zh:['这一节只练一件事：车、象、后走远路时，中间经过的格子必须全空。选择本案例，从 d4 的白后开始，一步一步往前看。','白后 d4→h8 沿斜线经过 e5、f6、g7，将军；黑王 e8→e7 躲开；白车 a1→a8 沿 a 线直上。注意后没有走到黑王旁边的 d8：那里没有保护，黑王可以直接吃掉它。每走一步，先看中间的格子是否全空，再看落点是否安全。'],
          en:['This section practises one idea: when a rook, bishop or queen travels far, every square it passes over must be empty. Select this case and step forward one move at a time, starting with the queen on d4.','White plays Qd4–h8 with check, sliding through e5, f6 and g7. Black answers Ke8–e7, then White plays Ra1–a8 up the a-file. Notice the queen did not stop on d8 beside the king: unprotected there, it could simply be captured. Before each move, check that every square in between is empty and that the destination is safe.'],
        }},take(first,'guided-opening')]},
    {...old,title:{zh:'国际象棋第二课：特殊规则、应将与开局',en:'Chess Lesson 2: Special Rules, Check and Openings'},
      description:{zh:'完成第一课后，进一步学习易位、吃过路兵、升变、将杀防守和和棋条件；不再重复棋盘与六种棋子的介绍。',en:'After Lesson 1, study castling, en passant, promotion, mate threats and draw conditions without repeating the board and piece introduction.'},
      steps:[
        {id:'prerequisites',title:{zh:'开始前：先会第一课的内容',en:'Before you start: Lesson 1 first'},body:{
          zh:['请先学完第一课：会找 e2、分得清兵的直走和斜吃、知道双方轮流走，也知道不能让自己的王留在被攻击的位置。还不熟就先回去练习。','这一课依次学：特殊走法、具体案例、看出将杀威胁、开局思路、和棋。每个案例都是单独摆好的局面，不是同一盘棋接着下；演示走完也不代表你赢了一盘棋。'],
          en:['Finish Lesson 1 first: find e2, tell a pawn\'s straight move from its diagonal capture, take turns, and never leave your own king under attack. If any of that feels shaky, go back and practise.','This lesson covers, in order: special moves, worked examples, spotting mate threats, opening ideas and draws. Each example is its own position, not one continuous game, and finishing a demo is not the same as winning a game.'],
        }},take(old,'special'),...demos,take(old,'check-mate'),
        {...take(old,'opening'),body:{
          zh:['开局有三条简单原则：一是争中心，中心指 e4、d4、e5、d5 这四格；二是“出子”，把挤在后面的马和象走到能控制更多格子的位置；三是条件允许时尽早易位，让王更安全。如果对手正在将军或要吃你的子，先处理这个威胁。','演示依次是 e2→e4、e7→e5、g1→f3、b8→c6、f1→c4、f8→c5：先走兵给象让路，再出马和象，双方都还没易位。这是意大利开局的一条教学路线，不是强制顺序，也没有“马一定要比象先出”的规定。'],
          en:['Three simple opening principles: take the centre (the squares e4, d4, e5 and d5); develop your pieces by bringing the knights and bishops out to squares where they control more; and castle early when you can, to keep the king safe. If your opponent is giving check or threatening a piece, deal with that first.','The demo plays e2–e4, e7–e5, g1–f3, b8–c6, f1–c4, f8–c5: pawns first open lines for the bishops, then knights and bishops come out. Neither side has castled yet. This is one teaching line of the Italian Game, not a forced order, and there is no rule that knights must come out before bishops.'],
        }},
        {...draw,body:{
          zh:['先看图：轮到黑方走，黑王在 h8，周围每一格都被白棋控制，但它此刻并没有被攻击。黑方一步合法的棋都走不了，这就是逼和，算平局，不是白方赢。就算白方多一个后也一样。',detailedDraw.body.zh[2],'还有一种和棋：双方都不可能再将死对方，比如只剩两个王。双方也可以按比赛规则协议和棋。注意“50 回合”是指双方各走 50 步，不是两人加起来 50 步。'],
          en:['Look at the diagram: it is Black to move, the black king on h8 has every neighbouring square covered, yet it is not under attack right now. Black has no legal move at all, so it is stalemate — a draw, not a White win, even though White has an extra queen.',detailedDraw.body.en[2],'Another draw: neither side can possibly checkmate, for example king against king. Players may also agree to a draw where the event rules allow it. Note that "50 moves" means 50 by each player, not 50 combined.'],
        }},
      ]},
  ];
}
