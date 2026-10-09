import type { Tutorial, TutorialStep } from '../tutorials';

const w=(zh:string,en:string)=>({zh,en});
const step=(id:string,zh:string,en:string,pairs:[string,string][]):TutorialStep=>({id,title:w(zh,en),body:{zh:pairs.map(p=>p[0]),en:pairs.map(p=>p[1])}});
const take=(t:Tutorial,id:string)=>{const s=t.steps.find(s=>s.id===id);if(!s)throw new Error(`Missing ${t.slug}/${id}`);return s;};

/** Publish one foundation, one notation course, then solving and optional paths. */
export function cubeCurriculum(t:Tutorial,first:Tutorial):Tutorial {
  if(t.game!=='cube')return t;
  if(t.slug==='cube-first-lesson')return {...t,title:w('魔方第一课：认部件，转一层，再转回','Cube Lesson 1: Pieces, One Turn and Its Undo'),
    description:w('先学完成目标、三种部件、观察与转层的区别，再跟做右层转回和两次顶层半圈。完整记号放在下一课。','Learn the goal, three piece types and viewing versus turning, then undo a right turn and two top half-turns. Complete notation follows next.'),
    steps:[take(t,'beginner-welcome'),take(t,'beginner-parts'),
      step('beginner-controls','先只认一个动作：右层转动','Start with one action: the right layer',[
        ['拖动空白背景只是换观察角度，不改变小块排列；转一层才改变排列。第一课从白中心朝上、绿中心朝前开始。先保持视角，用单步按钮看右层，不要同时转相机。','Dragging empty background changes the view, not the arrangement. Turning a layer changes the arrangement. Start white center up and green front. Keep the view steady and use single-step buttons first.'],
        ['先认识 R 和 R′：R 是从正对右面看时顺时针转四分之一圈，R′ 是反方向同样转四分之一圈。它们不是右边一张贴纸单独移动，而是整层小块一起转。下一课再系统学习全部六个面的记号。','First learn R and R′: a clockwise quarter-turn viewed directly at the right face, and its inverse quarter-turn. The whole layer moves, not one sticker. The complete six-face notation follows in the next course.'],
        ['手把手练习还会比较另一种撤销：U2 是顶层转半圈，做两次顶层半圈就是一整圈，回到起点。先按 R、R′、U2、U2 四步观察；下一课再把这些规则推广到所有面。','The guided exercise compares a second undo: U2 turns the top half a revolution. Two top half-turns make a full revolution and return to the start. Observe R, R′, U2, U2; the next lesson extends these rules to every face.'],
      ]),take(t,'right-inverse'),
      step('beginner-path','学完这一课，接下来怎么走','Where to go after this lesson',[
        ['先确认你能指出一个中心、一个棱和一个角；再执行 R、R′，检查六面回到起点。能做到后，打开“魔方基础记号”，学习六面字母、撇号、半圈和顺序；不是直接跳进一长串公式。','Point to a center, edge and corner, then perform R and R′ and check all six faces return to the start. Next open Basic Cube Notation for face letters, primes, half-turns and order instead of jumping into long algorithms.'],
        ['主线是第一课 → 基础记号 → 层先还原。会完整还原后，可选 CFOP 前两层与顶层两篇进阶课；“五个漂亮的图案”是记号学完就能选的独立支线，不是还原的必修步骤。','The main route is Lesson 1 → Basic Notation → Layer-by-Layer Solving. After a complete solve, optionally study the two CFOP courses. Five Beautiful Patterns is a separate branch available after notation, not a required solving stage.'],
      ])]};
  if(t.slug==='notation')return {...t,minutes:25,steps:[
    step('prerequisites','学前检查：已经会转右层并撤销','Before starting: turn and undo the right layer',[
      ['先完成第一课，知道中心是颜色参照，并能用 R、R′ 回到起点。现在把一种动作扩展到六个面。模型中转观察相机不会重新命名 R、U、F；实体魔方若换持握方向，先重新确认哪个面朝前。','Complete Lesson 1: centers identify colors, and R followed by R′ returns to the start. Now extend one action to six faces. Orbiting the model camera does not rename R, U or F; after regripping a physical cube, re-establish the front.'],
      ['本课每个案例独立从还原态开始。先读记号再点下一步；完成组合后停下来查看，选择反向还原后仍需逐步点击，不会自动复位。这里学会的是读动作，不是处理任意打乱。','Each case starts separately from solved. Read the token before Next; inspect the completed sequence, then step through undo if desired. Nothing auto-resets. This teaches reading moves, not solving arbitrary scrambles.'],
    ]),take(t,'faces'),take(t,'suffixes'),take(first,'half-turn'),
    {...take(t,'trigger'),title:w('顺序与短语：四步不是互相抵消','Order and triggers: four moves do not cancel'),body:{
      zh:['R U R′ U′ 依次转右、上、反右、反上。虽然右、上各有一次正反转，中间另一层的动作改变了参与的小块，所以结果不是还原态。把常一起出现的连续动作叫“短语”（trigger），只是方便记忆，不能交换顺序或省掉步骤。','做完四步，先检查结果而不是以为转错。反向撤销必须倒序且逐步反转：U R U′ R′。本页“学习反向还原”会列出这四步，仍须每次点下一步；终点应六面各自同色。完整四步若重复六次会回到起点，但打乱起点仍回到打乱，不能冒充通用还原法。'],
      en:['R U R′ U′ turns right, up, inverse right, inverse up. Interleaving moves changes which pieces participate, so the result is not solved. A recurring consecutive group is a trigger: a memory aid, not permission to reorder or omit moves.','Inspect the four-move result rather than assuming an error. Undo in reverse order with each move inverted: U R U′ R′. Learn to undo lists these four steps, each requiring Next, and ends with six solid faces. Six full trigger repetitions return to the starting state, which is still scrambled if you started scrambled; this is not a general solve.'],
    },algNote:w('演示一组四步；完成后可逐步反向还原。','One four-move group; afterwards undo one step at a time.')},
    {...take(t,'sledge'),body:{zh:['R′ F R F′ 是另一个四步短语，常叫 sledgehammer。它与上一组动作不同：本次练习先读“右逆、前、右、前逆”，再逐步执行；不要凭上一题的位置记忆按键。',take(t,'sledge').body.zh[1]],en:['R′ F R F′ is another four-move trigger, called the sledgehammer. Read inverse right, front, right, inverse front before stepping through it; do not repeat the previous exercise from button-position memory.',take(t,'sledge').body.en[1]]}},
  ]};
  if(t.slug==='beginner-lbl')return {...t,steps:[
    step('what-counts-as-solved','学前检查与本课持握方向','Prerequisites and this course’s orientation',[
      ['先完成第一课和基础记号。你应能区分棱与角、从指定面判断顺逆时针、按顺序读带撇号和 2 的动作。不熟时回记号课练习，本课不再重复完整部件表和字母表。','Complete Lesson 1 and Basic Notation. Distinguish edges from corners, judge turn direction from the specified face and read primes and 2 in order. Return to notation if needed; this course does not repeat the full piece and letter tables.'],
      ['这次与第一课不同：固定白中心朝下、黄中心朝上、绿中心朝前。先核对六面展开图再开始。完成一层不仅看白面，还检查侧面一整排与中心同色；完成全题要检查六面各九格同色。','Unlike Lesson 1, hold white center down, yellow up and green front. Check the six-face diagrams first. A solved layer requires matching side rows, not just a white face; a complete solve requires nine matching stickers on each of six faces.'],
    ]),...t.steps.filter(s=>!['what-counts-as-solved','notation'].includes(s.id))]};
  if(t.slug==='cfop-f2l')return {...t,steps:t.steps.map(s=>s.id==='overview'?step('overview','从层先法转入 CFOP：先检查前置能力','From layer-by-layer to CFOP: prerequisites',[
    ['先会用层先法完成一次六面还原，并能解释十字侧色对齐、角块与中层棱的目标位置；不要求速度或背熟全部公式。F2L 意为前两层：把一个底层角块和对应中层棱块配成一对，再一起插入，而不是分别处理。','First complete a layer-by-layer solve and explain cross alignment and the target locations of corners and middle edges. Speed and perfect recall are unnecessary. F2L means First Two Layers: pair a bottom corner with its middle-layer edge and insert them together.'],
    ['CFOP 依次是 Cross 十字、F2L 前两层、OLL 顶层朝向、PLL 顶层位置。朝向是把黄色翻到顶面；位置是让侧色与中心对应。本篇只教十字复查与三种配对案例，不能把这些公式连续套到所有情况；学会观察再进入下一篇顶层课。','CFOP means Cross, F2L, OLL (last-layer orientation) and PLL (last-layer permutation). Orientation turns yellow upwards; permutation places side colors against their centers. This course revisits cross checks and three pairing cases, not one algorithm chain for every position. Learn to recognize cases before the next course.'],
  ]):s)};
  if(t.slug==='cfop-2look-ll')return {...t,steps:t.steps.map(s=>s.id==='overview'?step('overview','先完成前两层，再分四个阶段处理顶层','Solve the first two layers before four last-layer stages',[
    ['前置条件是底面与四个侧面的下面两排已经还原，黄中心朝上、白中心朝下。可用层先法或 F2L 完成前两层，不要求必须掌握 F2L。本课的 OLL 是先让黄色朝上，PLL 是再把块换到正确位置。','Begin with the bottom and both lower side rows solved, yellow up and white down. Either layer-by-layer or F2L can prepare this; F2L mastery is not required. OLL orients yellow upwards; PLL then permutes pieces into place.'],
    ['“两步”分别指 OLL 两阶段（黄棱朝上 → 黄角朝上）和 PLL 两阶段（角换位 → 棱换位），合计四阶段，每阶段还可能先转顶层对齐。本网站层先课采用黄十字 → 角先定位 → 角再翻正 → 棱定位，顺序不同！选择一条完整方法，不要做半段就接另一条。','Two-look means two stages for OLL (edges, then corners) and two for PLL (corners, then edges): four stages overall, possibly with U alignment. Our beginner course instead uses yellow cross → corner placement → corner orientation → edge placement. These orders differ: follow one complete method rather than switching midway.'],
    ['每节是单独摆出的识别题，先看黄色贴纸朝哪、侧面哪两块同色，再选对应公式。演示结束恰好六面还原，不代表真实 OLL 做完就必定全复原；实际应检查阶段目标，再继续判断下一阶段。','Each section is a separate recognition case. Inspect yellow orientation and matching side stickers before choosing an algorithm. A demonstration finishing fully solved does not mean real OLL always solves everything; check the stage goal, then recognize the next stage.'],
  ]):s)};
  if(t.slug==='patterns')return {...t,description:w('独立支线：学完基础记号即可，从还原态逐步做图案，再手动反向还原。不要求先学 CFOP。','Optional branch after Basic Notation: create patterns from solved, then undo them manually. CFOP is not a prerequisite.'),steps:t.steps.map(s=>s.id==='how'?{...s,body:{zh:['先完成基础记号，并准备一个已经六面还原的魔方。这是独立图案支线，不是任意打乱的还原教程，也不需要先读两篇 CFOP。',...s.body.zh],en:['Complete Basic Notation and start with a solved cube. This optional pattern branch is not an arbitrary-scramble solving course and does not require the CFOP lessons.',...s.body.en]}}:s)};
  return t;
}
