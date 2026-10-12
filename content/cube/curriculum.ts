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
        ['拖动魔方外的空白处，只是换个角度看，小块的排列不会变；只有转动某一层，排列才会改变。第一课从白色中心朝上、绿色中心朝前开始。先保持视角不动，用单步按钮观察右层怎么转，不要一边转视角一边转层。','Dragging empty background changes the view, not the arrangement. Turning a layer changes the arrangement. Start white center up and green front. Keep the view steady and use single-step buttons first.'],
        ['先认识 R 和 R′：R 是正对着右面看，把右层顺时针转四分之一圈；R′ 是反方向转四分之一圈。转的是整整一层小块，不是右边某一张贴纸。下一课再系统学习六个面的全部记号。','First learn R and R′: a clockwise quarter-turn viewed directly at the right face, and its inverse quarter-turn. The whole layer moves, not one sticker. The complete six-face notation follows in the next course.'],
        ['练习里还会比较另一种“转回去”：U2 是把顶层转半圈，连做两次就是转了一整圈，回到原样。先按 R、R′、U2、U2 四步观察；下一课再把这些规则用到所有面上。','The guided exercise compares a second undo: U2 turns the top half a revolution. Two top half-turns make a full revolution and return to the start. Observe R, R′, U2, U2; the next lesson extends these rules to every face.'],
      ]),take(t,'right-inverse'),
      step('beginner-path','学完这一课，下一步学什么','Where to go after this lesson',[
        ['先检查自己：能不能指出一个中心块、一个棱块和一个角块？做完 R、R′ 后，六个面是不是都回到了原样？都能做到，就打开“魔方基础记号”，学六个面的字母、撇号、半圈和顺序，不要直接跳去背长公式。','Point to a center, edge and corner, then perform R and R′ and check all six faces return to the start. Next open Basic Cube Notation for face letters, primes, half-turns and order instead of jumping into long algorithms.'],
        ['推荐的学习路线是：第一课 → 基础记号 → 层先法还原。能完整还原后，可以选学 CFOP 的两篇进阶课。“五个漂亮的图案”是学完记号就能玩的独立支线，不是还原的必修步骤。','The main route is Lesson 1 → Basic Notation → Layer-by-Layer Solving. After a complete solve, optionally study the two CFOP courses. Five Beautiful Patterns is a separate branch available after notation, not a required solving stage.'],
      ])]};
  if(t.slug==='notation')return {...t,minutes:25,steps:[
    step('prerequisites','开始前：会转右层并转回来','Before you start: turn and undo the right layer',[
      ['请先学完第一课：知道中心块决定每面的颜色，也会用 R、R′ 回到原样。这一课把同样的动作推广到六个面。在网页上转动视角不会改变 R、U、F 指的是哪一面；如果你换了实体魔方的拿法，要先重新确认哪一面朝前。','Complete Lesson 1: centers identify colors, and R followed by R′ returns to the start. Now extend one action to six faces. Orbiting the model camera does not rename R, U or F; after regripping a physical cube, re-establish the front.'],
      ['每个案例都单独从还原状态开始。先读懂记号再按下一步；做完一组后停下来看看结果。选择“学习反向还原”后，也还是要一步一步点，不会自动复原。这一课学的是“读懂转动记号”，不是还原任意打乱的魔方。','Each case starts separately from solved. Read the token before Next; inspect the completed sequence, then step through undo if desired. Nothing auto-resets. This teaches reading moves, not solving arbitrary scrambles.'],
    ]),take(t,'faces'),take(t,'suffixes'),take(first,'half-turn'),
    {...take(t,'trigger'),title:w('顺序很重要：这四步不会互相抵消','Order matters: these four moves don\'t cancel'),body:{
      zh:['R U R′ U′ 依次是：右、上、右逆、上逆。虽然右面和上面各有一次正转和一次逆转，但因为中间夹着另一层的转动，参与的小块变了，所以结果不是还原状态。经常连在一起出现的几步叫“短语”（trigger），只是方便记忆，不能调换顺序，也不能省略。','做完四步后，先看看结果，不要以为自己转错了。想撤销，就要倒着做、每一步反过来：U R U′ R′。点“学习反向还原”会列出这四步，仍然要一步一步点；做完六个面应该各自是一种颜色。另外，这四步连做六次也会回到起点，但如果起点本来就是打乱的，回到的也还是那个打乱状态，所以它不是通用的还原方法。'],
      en:['R U R′ U′ turns right, up, inverse right, inverse up. Interleaving moves changes which pieces participate, so the result is not solved. A recurring consecutive group is a trigger: a memory aid, not permission to reorder or omit moves.','Inspect the four-move result rather than assuming an error. Undo in reverse order with each move inverted: U R U′ R′. Learn to undo lists these four steps, each requiring Next, and ends with six solid faces. Six full trigger repetitions return to the starting state, which is still scrambled if you started scrambled; this is not a general solve.'],
    },algNote:w('演示一组四步；完成后可逐步反向还原。','One four-move group; afterwards undo one step at a time.')},
    {...take(t,'sledge'),body:{zh:['R′ F R F′ 是另一个四步短语，常叫 sledgehammer。它和上一个不一样：先把它读成“右逆、前、右、前逆”，再一步一步做，不要凭上一题的按钮位置来按。',take(t,'sledge').body.zh[1]],en:['R′ F R F′ is another four-move trigger, called the sledgehammer. Read inverse right, front, right, inverse front before stepping through it; do not repeat the previous exercise from button-position memory.',take(t,'sledge').body.en[1]]}},
  ]};
  if(t.slug==='beginner-lbl')return {...t,steps:[
    step('what-counts-as-solved','开始前：前置知识与本课拿法','Before you start: prerequisites and grip',[
      ['请先学完第一课和基础记号：会分辨棱块和角块，会从指定的面判断顺时针还是逆时针，会按顺序读带撇号和 2 的步骤。不熟的话先回记号课练一练，本课不再重复部件和字母的介绍。','Complete Lesson 1 and Basic Notation. Distinguish edges from corners, judge turn direction from the specified face and read primes and 2 in order. Return to notation if needed; this course does not repeat the full piece and letter tables.'],
      ['注意，这一课的拿法和第一课不同：白色中心朝下、黄色中心朝上、绿色中心朝前。开始前先核对六面展开图。完成一层不只看白面，还要看侧面那一整排和中心颜色是否一致；完成整个魔方，要六个面各九格都同色。','Unlike Lesson 1, hold white center down, yellow up and green front. Check the six-face diagrams first. A solved layer requires matching side rows, not just a white face; a complete solve requires nine matching stickers on each of six faces.'],
    ]),...t.steps.filter(s=>!['what-counts-as-solved','notation'].includes(s.id))]};
  if(t.slug==='cfop-f2l')return {...t,steps:t.steps.map(s=>s.id==='overview'?step('overview','从层先法到 CFOP：先检查前置能力','From layer-by-layer to CFOP: prerequisites',[
    ['开始前，你应该已经能用层先法完整还原一次，并且能说清楚十字的侧色要对齐、角块和中层棱块各自的目标位置；不要求速度，也不要求背熟所有公式。F2L 的意思是“前两层”：把一个底层角块和对应的中层棱块配成一对，再一起放进去，而不是分开处理。','First complete a layer-by-layer solve and explain cross alignment and the target locations of corners and middle edges. Speed and perfect recall are unnecessary. F2L means First Two Layers: pair a bottom corner with its middle-layer edge and insert them together.'],
    ['CFOP 依次是：Cross 十字、F2L 前两层、OLL 顶层朝向、PLL 顶层位置。“朝向”是让黄色翻到顶面；“位置”是让侧面颜色和中心对应。本篇只教十字复查和三种配对案例，不能把这些公式连起来套在所有情况上。先学会观察，再进入下一篇顶层课。','CFOP means Cross, F2L, OLL (last-layer orientation) and PLL (last-layer permutation). Orientation turns yellow upwards; permutation places side colors against their centers. This course revisits cross checks and three pairing cases, not one algorithm chain for every position. Learn to recognize cases before the next course.'],
  ]):s)};
  if(t.slug==='cfop-2look-ll')return {...t,steps:t.steps.map(s=>s.id==='overview'?step('overview','先完成前两层，再分四个阶段处理顶层','Finish the first two layers, then four last-layer stages',[
    ['开始前，底面和四个侧面的下两排都要已经还原，黄色中心朝上、白色中心朝下。用层先法或 F2L 完成前两层都可以，不要求一定会 F2L。本课的 OLL 是先让黄色全部朝上，PLL 是再把顶层的块换到正确位置。','Begin with the bottom and both lower side rows solved, yellow up and white down. Either layer-by-layer or F2L can prepare this; F2L mastery is not required. OLL orients yellow upwards; PLL then permutes pieces into place.'],
    ['“两步”是指 OLL 分两步（先让黄棱朝上，再让黄角朝上），PLL 也分两步（先换角，再换棱），合起来是四个阶段，每个阶段前可能还要先转顶层对齐。本站层先法的顺序是：黄十字 → 先定角的位置 → 再翻角 → 最后棱块定位，两者顺序不同！选定一条完整的方法，不要做到一半换另一条。','Two-look means two stages for OLL (edges, then corners) and two for PLL (corners, then edges): four stages overall, possibly with U alignment. Our beginner course instead uses yellow cross → corner placement → corner orientation → edge placement. These orders differ: follow one complete method rather than switching midway.'],
    ['每一节都是单独摆好的识别题：先看黄色贴纸朝哪里、侧面哪两块同色，再选对应的公式。演示做完正好六面还原，不代表真实 OLL 做完就一定全部复原；实际要先检查这个阶段的目标，再判断下一阶段。','Each section is a separate recognition case. Inspect yellow orientation and matching side stickers before choosing an algorithm. A demonstration finishing fully solved does not mean real OLL always solves everything; check the stage goal, then recognize the next stage.'],
  ]):s)};
  if(t.slug==='patterns')return {...t,description:w('独立支线：学完基础记号即可，从还原态逐步做图案，再手动反向还原。不要求先学 CFOP。','Optional branch after Basic Notation: create patterns from solved, then undo them manually. CFOP is not a prerequisite.'),steps:t.steps.map(s=>s.id==='how'?{...s,body:{zh:['先学完基础记号，再准备一个六面已经还原的魔方。这是独立图案支线，不是还原任意打乱的教程，也不需要先读两篇 CFOP。',...s.body.zh],en:['Complete Basic Notation and start with a solved cube. This optional pattern branch is not an arbitrary-scramble solving course and does not require the CFOP lessons.',...s.body.en]}}:s)};
  return t;
}
