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
          zh:['本节不再重讲走法表，只观察“长距离移动之前，路径必须没有棋子”这件事。选择案例，从白后 d4 开始，按前进一着逐步观察。','白后 d4→d8 将军，黑王 e8→f7 解将，白车 a1→a8。这里只示范一条合法路线；黑王并非只能走 f7，白车这步也不表示已将死。每步检查中间空格，再看落点。'],
          en:['Apply the movement table: a sliding piece needs every intermediate square clear. Select this case and advance one move at a time, starting with the queen on d4.','White plays Qd4–d8 with check, Black Ke8–f7 answers it, then White Ra1–a8. This is one legal line: f7 is not the only king move, and the rook move does not establish mate. Inspect the path and destination each time.'],
        }},take(first,'guided-opening')]},
    {...old,title:{zh:'国际象棋第二课：特殊规则、应将与开局',en:'Chess Lesson 2: Special Rules, Check and Openings'},
      description:{zh:'完成第一课后，进一步学习易位、吃过路兵、升变、将杀防守和和棋条件；不再重复棋盘与六种棋子的介绍。',en:'After Lesson 1, study castling, en passant, promotion, mate threats and draw conditions without repeating the board and piece introduction.'},
      steps:[
        {id:'prerequisites',title:{zh:'学前检查：先会走，再学例外',en:'Before starting: normal moves before exceptions'},body:{
          zh:['先完成第一课，确认你能找到 e2、分清兵的直走与斜吃、理解轮流走棋，以及不能把自己的王留在受攻击的位置。如果这些还不熟，先回第一课练习，不必硬背下面的新词。','本课顺序是特殊操作、具体案例、识别将杀威胁、开局计划、和棋。每个案例单独摆题，不是一局棋连续下去。演示完成也不等于你赢了一局。'],
          en:['Finish Lesson 1 first: locate e2, distinguish pawn moves from captures, alternate turns and keep your king safe. Return to those exercises if needed before learning more terminology.','Study special operations and examples, then mate threats, opening plans and draws. Each example starts a separate position; the lessons are not one continuous game, and completing a demonstration is not winning a match.'],
        }},take(old,'special'),...demos,take(old,'check-mate'),
        {...take(old,'opening'),body:{
          zh:['“出子”是让原本拥挤的马、象来到能控制更多格子的位置。“中心”主要指 e4、d4、e5、d5。先争取中心、让轻子活动，再在条件允许时易位保护王；对手若有将军或吃子威胁，要先处理。','演示依次是 e2→e4、e7→e5、g1→f3、b8→c6、f1→c4、f8→c5。先动兵给象开路，再出马和象。这里双方还没有易位；这是意大利开局的一条教学分支，不是强制顺序，也不是“马一定比象先走”的规则。'],
          en:['Development brings crowded knights and bishops onto useful squares. The main central squares are e4, d4, e5 and d5. Contest the center, activate minor pieces and castle when appropriate, but answer immediate checks and threats first.','Follow e2–e4, e7–e5, g1–f3, b8–c6, f1–c4, f8–c5. Pawn moves open bishop routes before the knights and bishops develop. Neither side has castled yet. This Italian Game teaching line is not forced, and knights-before-bishops is not a rule.'],
        }},
        {...draw,body:{
          zh:['第一课已经分清将死与逼和。现在检查图例：黑王 h8 没有合法落点，但当前没有被攻击，所以是逼和，而不是白方获胜。白方多一个后也不能改变这个判定。',detailedDraw.body.zh[2],'单王对单王等无法通过任何合法着法序列形成将死的局面也是和棋；双方也可按对局规则协议和棋。这里的“50 回合”指双方各走 50 手，而不是两人合起来走 50 手。重复局面不是只看摆得像不像，还要核对轮到谁以及特殊走法权利。'],
          en:['Lesson 1 distinguishes mate from stalemate. In this diagram the black king on h8 has no legal move but is not attacked: stalemate, not a White win. The extra queen does not change that.',detailedDraw.body.en[2],'A position where no legal sequence can produce mate, such as king against king, is also drawn; agreed draws depend on the game rules. Fifty moves means fifty by each player, not fifty combined. Repetition compares the side to move and special-move rights, not merely the piece arrangement.'],
        }},
      ]},
  ];
}
