import type { Tutorial } from "../tutorials";

/** 魔方线的进阶教程。入门层先法在 content/tutorials.ts */
export const cubeTutorials: Tutorial[] = [
  {
    slug: "notation",
    game: "cube",
    title: { zh: "魔方基础记号：从六个面开始读公式", en: "Basic Cube Notation: Read the Six Face Turns" },
    description: {
      zh: "先认识六个面的字母、逆时针和半圈记号，逐步跟着演示操作。这里先学基础面转；其它资料里的整颗转体、中层和双层转动需要另学，不能照普通面转猜。",
      en: "Learn the six face letters, inverse turns and half-turns through manual examples. This lesson covers basic face turns; whole-cube rotations, slices and wide turns in other resources need separate explanations, not guesses.",
    },
    level: { zh: "入门", en: "Beginner" },
    minutes: 10,
    steps: [
      {
        id: "faces",
        title: { zh: "六个面，六个字母", en: "Six faces, six letters" },
        body: {
          zh: [
            "把魔方拿在手里，正对你的那一面叫 F（Front，前），对面是 B（Back，后）；上面是 U（Up），下面是 D（Down）；右手边是 R（Right），左手边是 L（Left）。注意：字母指的是相对你的方位，不是颜色。你换个方向拿，F 就变成另一种颜色。",
            "一个单独的字母表示把那一面顺时针转 90°——「顺时针」以你正对着那个面看为准。这一点最容易出错：B 面的顺时针，从正面看过去其实是逆时针。演示一下 R，看右面怎么动。",
          ],
          en: [
            "Hold the cube. The face towards you is F (Front), its opposite is B (Back); U (Up) and D (Down) are top and bottom; R (Right) and L (Left) are your two sides. The letters mean position relative to you, not colour — turn the cube and F becomes another colour.",
            "A letter alone means: turn that face 90° clockwise, as seen when looking straight at that face. This is where most mistakes happen — clockwise on B looks counter-clockwise from the front. Play R and watch the right face.",
          ],
        },
        alg: "R",
        algNote: { zh: "右面顺时针 90°。", en: "Right face, 90° clockwise." },
      },
      {
        id: "suffixes",
        title: { zh: "撇与 2：方向和角度", en: "Prime and 2: direction and angle" },
        body: {
          zh: [
            "字母后面加一撇（R'，读作「R 撇」或 R prime）表示逆时针 90°；加 2（R2）表示 180°，方向无所谓。所以每个面只有三种转法：R、R'、R2。",
            "这里的 U' R2 是先把顶面逆时针转 90°，再把右面转 180°。公式永远从左往右按顺序做，中间不要停下来重新拿魔方。",
          ],
          en: [
            "An apostrophe (R', said \"R prime\") means 90° counter-clockwise; a 2 (R2) means 180°, direction irrelevant. So each face has exactly three moves: R, R', R2.",
            "U' R2 here means: top face counter-clockwise, then right face a half turn. Always read left to right, and don't regrip the cube halfway through.",
          ],
        },
        alg: "U' R2",
      },
      {
        id: "trigger",
        title: { zh: "节奏：把公式读成短语", en: "Rhythm: read algorithms as phrases" },
        body: {
          zh: [
            "先逐个看懂字母，再把常出现的连续几步记成一个「短语」（trigger）。例如 R U R' U' 是四步：右、上、右反、上反，社区也叫它 sexy move。分组只帮助记忆，原公式里的其它步骤和先后顺序都不能省略；含有这个短语，不等于整条公式只是重复它。",
            "保持持握方向不变，把这四步完整重复六次，共 24 次四分之一圈转动，会回到练习起点。如果起点是打乱态，回去仍是打乱态，不是万能还原法。下方案例只演示一组四步，并停在第 4 步，不会自动重复六次。实体练习若未回到起点，逐步检查是否漏步、重复、多转或少转、方向错误，或中途改变了持握方向，不要直接认定某一步转反。",
          ],
          en: [
            "Understand each letter first, then group recurring consecutive moves into a trigger. R U R' U' is four moves: right, up, inverse right, inverse up, also called the sexy move. Grouping helps memory; it never removes other moves or changes their order. An algorithm containing this trigger is not necessarily just repetitions of it.",
            "Keep the same grip orientation and repeat all four moves six times: 24 quarter-turns return to the starting state. A scrambled start returns to that scramble, so this is not a universal solve. The example below demonstrates just one four-move group and stops at step 4; it does not repeat six times automatically. If your physical cube fails to return, check for omitted or repeated moves, too much or too little rotation, wrong directions and changed grip orientation rather than assuming a reversed turn.",
          ],
        },
        alg: "R U R' U'",
        algNote: { zh: "做六次回到原状。", en: "Six repetitions return to start." },
      },
      {
        id: "sledge",
        title: { zh: "第二个短语：Sledgehammer", en: "A second phrase: the sledgehammer" },
        body: {
          zh: [
            "R' F R F' 叫 sledgehammer（大锤），和 sexy move 一样是 CFOP 公式里出镜最多的四步之一。左手镜像是 L F' L' F。",
            "到这里，你练习的是六个外层面的基础记号，不是全部三阶记号。遇到 r、Rw 等双层转动、M/E/S 中层转动或 x/y/z 整颗转体时，请先查该资料的定义、观察方向和演示，再开始操作；不要把它们猜成普通 R/U/F。换一篇教程时也要先核对它的起点与持握方向。",
          ],
          en: [
            "R' F R F' is the sledgehammer — with the sexy move, one of the two most common four-move phrases in CFOP. Its left-hand mirror is L F' L' F.",
            "You have practised basic turns of six outer faces, not every 3x3 notation. Before using wide turns such as r or Rw, slices M/E/S or whole-cube rotations x/y/z, consult that resource's definitions, viewing direction and demonstrations. Do not guess that they mean ordinary R/U/F turns. Also check the starting case and grip orientation when switching tutorials.",
          ],
        },
        alg: "R' F R F'",
      },
    ],
  },
  {
    slug: "cfop-f2l",
    game: "cube",
    title: { zh: "CFOP 进阶（一）：十字与 F2L", en: "CFOP, Part 1: Cross and F2L" },
    description: {
      zh: "学习把一个底层角块和对应的中层棱块配成一对，再一起放回正确位置。先认清目标块，跟着三个案例逐步练习，不要求速度。",
      en: "Learn to pair a bottom-layer corner with its matching middle-layer edge and put them into place together. Identify the target pieces and follow three step-by-step cases; speed is not required.",
    },
    level: { zh: "进阶", en: "Intermediate" },
    minutes: 60,
    steps: [
      {
        id: "overview",
        title: { zh: "CFOP 是什么", en: "What CFOP is" },
        body: {
          zh: [
            "CFOP 四个字母是四个阶段：Cross（底层十字）、F2L（First Two Layers，前两层）、OLL（顶层朝向）、PLL（顶层置换）。它是当今几乎所有速拧世界纪录使用的方法，由 Jessica Fridrich 在 1980 年代整理推广，所以也叫 Fridrich 方法。",
            "和层先法比，CFOP 只是把「底角 + 中棱」合并成 F2L，把「顶层四步」合并成 OLL + PLL。层先法能还原，你就已经会了 CFOP 的一半。本篇讲前两层，下一篇讲顶层。",
          ],
          en: [
            "CFOP names four stages: Cross, F2L (First Two Layers), OLL (Orientation of the Last Layer) and PLL (Permutation of the Last Layer). Nearly every speedsolving world record uses it. Jessica Fridrich popularised it in the 1980s, so it's also called the Fridrich method.",
            "Compared with the beginner's method, CFOP merges \"bottom corners + middle edges\" into F2L and the four top-layer steps into OLL + PLL. If you can solve layer by layer you already know half of it. This part covers the first two layers; the next covers the top.",
          ],
        },
      },
      {
        id: "cross",
        title: { zh: "先认清白色十字：把最后一条白棱放回底面", en: "Recognise the white cross: place its last edge" },
        body: {
          zh: [
            "先知道目标：白中心周围的四条棱都要白色朝下，而且每条棱的另一种颜色要对齐侧面中心。棱块有两张贴纸，角块有三张；白色角块暂时不算十字。只看到底面有白色加号还不够，侧面也要检查。本页用黄色中心朝上、白色中心朝下、绿色中心朝前的持握方向。",
            "选择本案例后先不要转：白绿棱在前上方，白贴纸朝上，绿贴纸朝前，与绿中心对齐；其余三条白棱已经在底面正确位置。看六面图的底面，中心旁还缺一个白色格。现在只需要把前面的白绿棱送到底面，不必移动整颗魔方。",
            "点击一次下一步，执行 F2：只把前面转半圈（180°），不是连续点两次。完成后停下来，核对底面中心及四个相邻格都是白色，前后左右的底部中间贴纸分别对齐各自中心，另外三条白棱仍正确。这个预设起点做完恰好整颗复原；真实打乱完成十字后通常还要处理角块和中层棱。",
            "这是一条白棱的定位案例，不是任意打乱都能用 F2 解决。实体练习时先找到一条白棱，读出它的另一种颜色和目标中心，再判断当前摆放是否与本例一致。若白色朝向或位置不同，不要硬套 F2；回到入门层先法的白十字步骤练习对应情形。先允许停顿和看底面，能解释每次移动后再练习提前规划，不设闭眼或步数要求。",
          ],
          en: [
            "The goal is four white edges around the white center, with white facing down AND each edge's other color matching its side center. An edge has two stickers; a corner has three. White corners do not count towards the cross. A white plus sign alone is not enough: check the sides too. Hold yellow center up, white down and green facing you.",
            "Select this case and pause before turning. The white-green edge is at top-front, white facing up and green facing front, aligned with the green center. The other three white edges are already correctly placed on the bottom. In the bottom diagram, one white square beside the center is missing. Move only this last edge into place; do not rotate the whole cube.",
            "Press Next once for F2: turn only the front face halfway (180 degrees), not two button presses. Stop at completion. Check the bottom center and its four adjacent squares are white, each side's bottom-middle sticker matches its center, and the other three white edges remain correct. This prepared start happens to finish the whole cube; a real scramble usually still needs corners and middle edges after the cross.",
            "This is one edge-positioning case, not an F2 solution for every scramble. On a physical cube, find a white edge, name its other color and target center, then compare its current position and orientation with this case. If they differ, do not force F2; revisit the beginner layer-by-layer white-cross steps for other situations. Pausing and looking at the bottom are allowed. Learn to explain each move before planning ahead; there is no blindfold or move-count requirement.",
          ],
        },
        alg: "F2",
        algNote: { zh: "前面转半圈，补齐白十字；完成后停下检查侧色。", en: "Half-turn the front to complete the white cross; stop and check the side colors." },
      },
      {
        id: "pair-insert",
        title: { zh: "F2L 的核心：配对再插入", en: "The heart of F2L: pair, then insert" },
        body: {
          zh: [
            "F2L 每次处理一个「槽」——底层一个角块加它上方的中层棱块。思路只有一句话：先在顶层把角块和棱块拼成一对，再把这一对一起送进槽里。四个槽，四次。",
            "先找到白绿橙角块和绿橙棱块。本例它们已经在顶层配好：角在左前上，棱在前上；两块的绿贴纸都朝上、橙贴纸都朝前。目标槽是绿中心与橙中心之间的右前槽。点 R 抬起槽口；点 U' 把这一对送到右侧；点 R' 把它们一起放回槽中。每一步都停下来对照六面图。",
          ],
          en: [
            "F2L handles one slot at a time — a bottom corner and the middle edge above it. The whole idea in one sentence: pair the corner and edge in the top layer, then insert the pair into the slot together. Four slots, four times.",
            "Find the white-green-orange corner and green-orange edge. In this case they form a pair on top: corner at front-left, edge at front-middle. Both green stickers point up and both orange stickers face front. The target is the front-right slot between green and orange centers. R opens the slot; U' carries the pair to the right; R' lowers it into place. Pause after each move and compare the six-face diagrams.",
          ],
        },
        alg: "R U' R'",
        algNote: { zh: "已配好的一对，插入右前槽。", en: "A formed pair going into the front-right slot." },
      },
      {
        id: "four-inserts",
        title: { zh: "同一对换了位置：先转顶层再插入", en: "The same pair in a new position: align, then insert" },
        body: {
          zh: [
            "本节只练一种明确的起点，不是四种公式的合集。目标仍是把同一对放进右前槽；与上一例相比，这一对在顶层的位置变了，所以先用一步 U 对齐，再用已经学过的三步插入。U 表示只转顶层，不是把整颗魔方转向。保持黄中心朝上、绿中心朝前。",
            "本例仍处理白绿橙角和绿橙棱：角在右前上、白色朝前；棱在右上，两块绿色都朝上、橙色都朝右。它们已经配对，不是要拆开。第一步 U 把整对移到左前上与前上，然后执行上一节的 R U' R'。完成时白角在底层右前、绿橙棱在它上方，侧面颜色对齐中心。",
          ],
          en: [
            "This section teaches one specific starting position, not a collection of four formulas. The same pair still belongs in the front-right slot, but it starts elsewhere on top. First align it with U, then use the three-move insertion you already learned. U turns only the top layer, not the whole cube. Keep the yellow center up and the green center facing you.",
            "This case uses the same white-green-orange corner and green-orange edge. The corner is at top-front-right with white facing front; the edge is at top-right. Both green stickers point up and orange stickers face right. They are already paired, not being split. U carries the pair to top-front-left and top-front-middle, then R U' R' inserts it. At the end the white corner is bottom-front-right and the matching middle edge is above it, with side colors matching their centers.",
          ],
        },
        alg: "U R U' R'",
      },
      {
        id: "split-pair",
        title: { zh: "分开的角块和棱块", en: "Corner and edge apart" },
        body: {
          zh: [
            "更常见的情况是角块和棱块都在顶层但不相邻。原则：用 U 层把棱块转到角块的对面或旁边，再用一次 R 或 R' 把角块提起来接住棱块，形成配对，然后三步插入。",
            "本例白绿橙角在右前上，白色朝上；绿橙棱在后上，绿色朝上、橙色朝后。它们现在分开。前五步 U R U2 R' U 完成配对；执行到第 5 步时，暂停找出左前上角与前上棱：绿色一起朝上，橙色一起朝前。最后 R U' R' 把配好的一对插入右前槽。不要只记“前五步”，要亲眼确认目标两块已经连接。",
          ],
          en: [
            "More often the corner and edge are both on top but apart. The principle: use the U layer to bring the edge next to or opposite the corner, then lift the corner with R or R' to catch the edge and form the pair, then insert with three moves.",
            "Initially the white-green-orange corner is top-front-right with white up; the green-orange edge is top-back with green up and orange back. They are separated. U R U2 R' U forms the pair. At step 5, stop and find the front-left top corner and front-middle top edge: green together on top, orange together at front. Finish with R U' R' into the front-right slot. Verify the pieces are joined instead of memorising a vague five-move instruction.",
          ],
        },
        alg: "U R U2 R' U R U' R'",
        algNote: { zh: "前五步接头，后三步插入。", en: "Five moves to join, three to insert." },
      },
      {
        id: "lookahead",
        title: { zh: "F2L 真正的难点：预判", en: "The real skill: lookahead" },
        body: {
          zh: [
            "「预判」是指处理当前一对时，留意下一对在哪里；它不是新手现在必须同时完成的任务。先只盯住本例的白绿橙角块和绿橙棱块。看不清就停下来，找到两块、确认贴纸方向后再点下一步，不要为了连续转动而猜公式。",
            "第一轮：每步说出哪个面转了、目标块去了哪里。第二轮：在插入前停下，指出右前槽，并检查这对块的绿、橙贴纸是否与本例相符。最后核对白角在底层、绿橙棱在它上方，侧色对齐中心，其他已经复原的槽没有被破坏。能独立解释并完成后，才在实体魔方的多个槽之间练习寻找下一对；本页三个预设案例不等于所有 F2L 情况。",
          ],
          en: [
            "Lookahead means noticing the next pair while working on the current one. You do not need to do both at once yet. Focus only on this case's white-green-orange corner and green-orange edge. Pause whenever you lose track, find both pieces and check their sticker directions before pressing Next. Do not guess a formula just to keep moving.",
            "First pass: name the face that moved and where the target pieces went after each step. Second pass: stop before insertion, point to the front-right slot and compare the pair's green and orange stickers with this case. Finally check that the white corner is on the bottom, the green-orange edge is above it, side colors match their centers and other solved slots remain intact. Only after you can explain and finish the case independently should you practise finding another pair on a physical cube. These three prepared cases do not cover every F2L situation.",
          ],
        },
      },
    ],
  },
  {
    slug: "cfop-2look-ll",
    game: "cube",
    title: { zh: "CFOP 进阶（二）：两步 OLL 与 PLL", en: "CFOP, Part 2: Two-Look OLL and PLL" },
    description: {
      zh: "前两层完成后，按黄棱朝向、黄角朝向、角换位、棱换位四个阶段学习识别案例。与本站层先法的顺序不同，先读前置说明，不把公式串起来盲做。",
      en: "After the first two layers, recognise cases in four stages: edge orientation, corner orientation, corner permutation and edge permutation. This differs from our beginner method; read the prerequisites rather than chaining algorithms blindly.",
    },
    level: { zh: "进阶", en: "Intermediate" },
    minutes: 45,
    steps: [
      {
        id: "overview",
        title: { zh: "为什么是「两步」", en: "Why two looks" },
        body: {
          zh: [
            "完整 OLL 有 57 个公式，PLL 有 21 个。「两步」版本把它们各拆成两个小阶段：OLL 先做黄色十字再翻角，PLL 先换角再换棱。代价是每个阶段多看一次、多做一次公式，收获是只需要记 10 个左右。",
            "层先法的最后四步其实就是两步 OLL/PLL 的最简版本。你要做的是把每一步的公式换成更快的，并学会一次处理更多情况。",
          ],
          en: [
            "Full OLL has 57 algorithms and PLL has 21. The two-look version splits each into two stages: OLL as cross-then-corners, PLL as corners-then-edges. The cost is an extra recognition and an extra algorithm per stage; the gain is only around ten algorithms to learn.",
            "The last four steps of the beginner's method are the simplest possible two-look OLL/PLL. What you're doing is swapping in faster algorithms and handling more cases per look.",
          ],
        },
      },
      {
        id: "eo",
        title: { zh: "OLL 第一步：棱块朝向", en: "OLL look 1: edge orientation" },
        body: {
          zh: [
            "目标是让顶面的四条黄棱都朝上，和黄中心组成十字；此时暂时不要求黄角朝上。本演示起点是横线：顶面图中左中、中心、右中三格黄色相连，前中和后中还不是黄。保持绿中心朝前，逐步执行 F R U R' U' F'。结束后检查顶面中心与上下左右五格都是黄，下方两层没有被破坏。L 形和点形需要不同摆放或分阶段处理，不能不看方向地把同一公式机械重复。",
            "可分成三段理解：F 暂时打开前面；R U R' U' 是四步转动组合；F' 把前面放回。初学不追求速度，每次点击只转一个面，确认之后再继续。",
          ],
          en: [
            "The goal is four yellow edge stickers facing up around the yellow center; ignore corner orientation for now. This example starts with a horizontal line: left-middle, center and right-middle are yellow in the top diagram, while front-middle and back-middle are not. Keep the green center at front and step through F R U R' U' F'. Finish by checking the five cross stickers and the preserved lower two layers. L and dot cases need their own alignment or staged treatment; blindly repeating without inspecting orientation is not a general solution.",
            "Read it in three groups: F temporarily opens the front, R U R' U' is the four-move sequence, and F' restores the front. Do not chase speed. Each click turns one face; inspect it before continuing.",
          ],
        },
        alg: "F R U R' U' F'",
      },
      {
        id: "eo-l",
        title: { zh: "独立案例：黄色 L 形变十字", en: "Separate case: yellow L to cross" },
        body: {
          zh: [
            "先只看顶面中心和四条棱，不数四个角。黄色中心、左中、后中连成一个 L：在顶面展开图中是中心的左边和上边。前中、右中不是黄。这就是本例的起点，不是把任意两个黄色格都当成 L。保持黄中心朝上、绿中心朝前；若已有四条黄棱朝上，跳过翻棱，不要再套本公式。",
            "选择案例后先暂停观察，再逐个点击 F、U、R、U'、R'、F'。注意中间四步是 U R U' R'，与横线案例的 R U R' U' 顺序不同。每点一次只执行一步，不需要转动整个魔方。",
            "第六步后停下来：顶面中心与前后左右四个相邻格应全部黄色，下两层恢复。只完成黄色十字并不等于整个顶面或整颗魔方完成。本例的预设恰好复原整颗；真实局面通常还需要翻角和换位。若实体魔方的 L 朝右前方，先转顶层把它摆成左后方，再对照本例，而不是随意重复公式。",
          ],
          en: [
            "Look only at the top center and four edges, not the corners. Yellow at the center, left-middle and back-middle forms an L: left and above the center in the top diagram. Front-middle and right-middle are not yellow. This is the starting pattern; two arbitrary yellow squares do not define it. Keep yellow up and green front. If all four yellow edges already face up, skip edge orientation instead of applying another algorithm.",
            "Select the case and inspect before moving. Click F, U, R, U', R', F' one at a time. The middle four moves are U R U' R', not the line case's R U R' U'. Each click makes one move; do not rotate the whole cube.",
            "Stop after step six. The center and four adjacent top squares must be yellow, with the lower two layers restored. A yellow cross is not a whole yellow face or a solved cube. This prepared case happens to solve the cube; real positions may still need corner orientation and permutation. If your physical L points front-right, first turn only the top to put the L at back-left, then compare with this case; do not repeat blindly.",
          ],
        },
        alg: "F U R U' R' F'",
      },
      {
        id: "eo-dot",
        title: { zh: "独立案例：点形分两段变十字", en: "Separate case: dot to cross in two stages" },
        body: {
          zh: [
            "点形指四条顶棱都没有黄色朝上，中心仍是黄。角上即使有黄色，也不计入判断；所以不是要求顶面九格中只有一格黄色。本例下两层已完成，黄上绿前。目标是先把四条黄棱翻到上面，不是先让所有黄色角归位。",
            "前六次点击依次执行 F R U R' U' F'。第六步后停下来检查：黄色棱出现在右中和前中，与中心形成右前方的 L。下两层已经恢复，但十字还没完成，不要点重新开始。",
            "第七次点击 U2，只把顶层转半圈，算一次按钮操作。现在黄色 L 移到左中和后中，正好是上一节 L 形案例的方向。然后第八至十三次点击执行 F U R U' R' F'。两段的中间四步顺序不同，请按按钮逐步走，不要凭记忆加步。",
            "最后停在第十三步，检查顶面中心和四条棱全部黄色，下两层恢复。这个预设最后整颗复原，但本阶段的通用目标只是十字；其它打乱可能仍要翻角和换位。全过程只转指定层，不转整个魔方。若起点只有两条黄棱朝上，应选择横线或 L 形案例，不要从点形流程开始。",
          ],
          en: [
            "A dot means none of the four top edges shows yellow upward; the center is still yellow. Ignore yellow corners: the term does not require exactly one yellow square among all nine. The lower two layers are finished. Hold yellow up and green front. The goal is to orient four yellow edges, not solve the corners first.",
            "For the first six clicks, follow F R U R' U' F'. Pause after step six: yellow edges now face up at right-middle and front-middle, forming a front-right L with the center. The lower layers are restored, but the cross is not done. Do not restart.",
            "Click seven is U2: half-turn only the top, counted as one button press. The yellow L is now at left-middle and back-middle, matching the previous L case. Clicks eight through thirteen follow F U R U' R' F'. The middle four moves differ between the two stages; follow each button instead of adding remembered moves.",
            "Stop after step thirteen. Check the top center and all four edges are yellow and the lower layers restored. This prepared case finishes the whole cube, but the general goal here is only the cross; other scrambles may still need corners and permutation. Never rotate the whole cube during the sequence. With two yellow edges already facing up, choose the line or L case instead of starting the dot procedure.",
          ],
        },
        alg: "F R U R' U' F' U2 F U R U' R' F'",
      },
      {
        id: "co-sune",
        title: { zh: "OLL 第二步：Sune 与 Anti-Sune", en: "OLL look 2: Sune and Anti-Sune" },
        body: {
          zh: [
            "先检查黄色十字已完成，再数顶面四个角中有几个黄色朝上。本例是 Sune：只有左前角黄色朝上，前面的右上角贴纸也是黄色。保持黄色中心朝上、绿色中心朝前，选择此案例后逐步执行 R U R' U R U2 R'。只有一个黄角朝上还不足以决定公式；Anti-Sune 的摆放不同，请使用下一节独立案例。",
            "先用六面图检查三个线索：黄十字已经在、唯一朝上的黄角在左前、前面右上贴纸为黄。三项都对才执行本例。完成后检查顶面九格黄色及下面两层，不要因为看见‘小鱼’就忽略拿法。先学会这一种右手公式；本课没有演示它的左手镜像，不要求自行把 R 改成 L。",
          ],
          en: [
            "First check the yellow cross, then count yellow-facing top corners. This Sune case has only the front-left corner yellow on top, plus a yellow sticker at the front face’s top-right. Keep yellow up and green front, select this case and step through R U R' U R U2 R'. One yellow corner alone does not select an algorithm: Anti-Sune uses a different alignment in the next separate case.",
            "Check three clues in the diagrams: an existing yellow cross, the only upward yellow corner at front-left, and yellow at the front face’s top-right. Use this case only when all three match. Afterwards inspect the nine yellow top stickers and preserved lower layers; a fish-like shape alone is insufficient. Learn this right-hand sequence first. No left-hand mirror is demonstrated here, so do not simply replace R with L.",
          ],
        },
        alg: "R U R' U R U2 R'",
        algNote: { zh: "Sune。Anti-Sune：R U2 R' U' R U' R'。", en: "Sune. Anti-Sune: R U2 R' U' R U' R'." },
      },
      {
        id: "co-antisune",
        title: { zh: "独立案例：Anti-Sune 的摆放", en: "Separate case: align Anti-Sune" },
        body: {
          zh: [
            "目标仍是让九张顶面贴纸全部黄色朝上，同时保住下面两层。先看顶面图：上方代表后面，下方代表前面。本例只有右后角（顶面图右上格）黄色朝上；前面左上角和右面左上角有黄色。不要沿用上一例的左前黄角摆放。",
            "选择案例，先不要转。对照顶面图确认黄色十字和右后黄角。然后每点一次下一步，只做一个记号：R、U2、R'、U'、R、U'、R'。U2 是一次半圈，算一次按钮操作。中途十字暂时变化是正常的，不要自行加步或转动整个魔方。",
            "第七步后停下来：检查顶面九格全黄、底面全白、四个侧面的下两行与各自中心同色。本例为便于核对，完成时整个魔方恰好复原；真实打乱可能还需 PLL 调整顶层位置。这里学的是朝向，不是承诺所有顶层都一步复原。",
          ],
          en: [
            "The goal is nine yellow top stickers while preserving the lower two layers. In the top diagram, back is above and front below. Only the back-right corner (upper-right diagram cell) faces yellow up. Yellow also appears at the top-left of the front and right faces. Do not reuse the previous front-left alignment.",
            "Select the case without turning. Check the yellow cross and back-right yellow corner, then press Next once for each token: R, U2, R', U', R, U', R'. U2 is one half-turn and one button action. Temporary changes to the cross are normal; do not add turns or rotate the whole cube midway.",
            "Stop after step seven. Check nine yellow top stickers, a white bottom, and the lower two rows matching every side center. This prepared example finishes fully solved for easy checking; a real scramble may still need PLL to place the top pieces. Orientation is this lesson’s goal, not a promise to solve every last layer at once.",
          ],
        },
        alg: "R U2 R' U' R U' R'",
      },
      {
        id: "co-rest",
        title: { zh: "OLL 第二步：H、Pi、车灯", en: "OLL look 2: H, Pi, headlights" },
        body: {
          zh: [
            "零个或两个黄角朝上时，可以像层先法那样先做一次 Sune 转成一个黄角，也可以直接记对应公式一次解决。零个黄角有两种：H 形（两侧各一对「车灯」相对）用 R U R' U R U' R' U R U2 R'；Pi 形用 R U2 R2 U' R2 U' R2 U2 R。",
            "这里的「黄色车灯」是同一侧面的左上角和右上角都露出黄色。先在本例的两侧找出这两对黄色，再逐步执行。下一节把 Pi 和相邻双黄角分别做成独立案例。不同情况需要重新观察和摆放，不能把“做两次 Sune”当成不看方向的通用解法。",
          ],
          en: [
            "With zero or two yellow corners up you can do one Sune to reduce to a single corner, as in the beginner's method, or learn the direct algorithm. Zero corners has two shapes: H (headlights on two opposite sides) is R U R' U R U' R' U R U2 R'; Pi is R U2 R2 U' R2 U' R2 U2 R.",
            "Yellow headlights mean yellow at both the upper-left and upper-right corners of one side face. Find the two pairs on opposite sides in this example before stepping. Pi and adjacent-two-corner cases have separate examples below. Each case needs inspection and alignment; blindly doing two Sunes is not a universal solution.",
          ],
        },
        alg: "R U R' U R U' R' U R U2 R'",
        algNote: { zh: "H 形。", en: "The H case." },
      },
      {
        id: "co-pi",
        title: { zh: "独立案例：Pi，顶面没有黄角", en: "Separate case: Pi, no yellow top corners" },
        body: {
          zh: ["先看目标：保持黄十字，把四个黄角翻到顶面，下面两层最终不变。起点顶面只有十字，四个角都不是黄。左面左上与右上都是黄，像一对车灯；右面没有黄色车灯。前面的右上角、后面的左上角各有一张黄贴纸。这些特征一起区分 Pi 与上一例 H。", "保持黄上绿前，逐个点击 R、U2、R2、U'、R2、U'、R2、U2、R。带 2 的记号只点一次。最后第九步结束后，检查顶面全黄、下两层复原；不要为了让中间状态好看而临时补转。"],
          en: ["Goal: keep the yellow cross and turn all four corners yellow-up, restoring the lower layers at the end. Initially none of the top corners is yellow. Both upper corners of the left face are yellow headlights; the right face has no yellow headlights. The front top-right and back top-left stickers are yellow. These combined clues distinguish Pi from H.", "Keep yellow up and green front. Click once per token: R, U2, R2, U', R2, U', R2, U2, R. A 2 needs only one click. After step nine, check the fully yellow top and restored lower layers. Do not add turns to make intermediate positions look solved."],
        },
        alg: "R U2 R2 U' R2 U' R2 U2 R",
      },
      {
        id: "co-headlights",
        title: { zh: "独立案例：两个黄角与前方车灯", en: "Separate case: two yellow corners, headlights in front" },
        body: {
          zh: ["起点已有黄色十字，后面两个顶角黄色朝上（顶面图最上行左右两格）。前面两个顶角的黄色朝前：从正面看，左上角和右上角都是黄色，像两盏车灯。把这对黄色车灯放在前面，不是左面。完成目标是九格黄色朝上、下两层不变。", "保持黄上绿前，逐步执行 R2、D、R'、U2、R、D'、R'、U2、R'。D 是正对底面看时顺时针转底层；不要把它当成 U，也不要为了看底面而改变公式的前方。D' 会把底层转回。", "第九步完成后停在成品，检查白底、全黄顶与侧面下两行。这一例也恰好完成整颗魔方；在其他打乱中，黄面朝向完成后还可能要置换顶层。"],
          en: ["The yellow cross is already present. Both back top corners face yellow up (the two upper diagram corners). The front two corners face yellow toward you: the front face’s upper-left and upper-right are yellow headlights. Keep these headlights in front, not on the left. Goal: nine yellow top stickers and preserved lower layers.", "Keep yellow up and green front; step through R2, D, R', U2, R, D', R', U2, R'. D turns the bottom clockwise as viewed directly from below. It is not U; do not change the algorithm’s front while inspecting the bottom. D' later returns the bottom layer.", "Stop after step nine. Check the white bottom, yellow top and lower two rows of every side. This prepared case also finishes the entire cube, but other scrambles may still need top-layer permutation after orientation."],
        },
        alg: "R2 D R' U2 R D' R' U2 R'",
      },
      {
        id: "cp",
        title: { zh: "PLL 第一步：角块置换", en: "PLL look 1: corner permutation" },
        body: {
          zh: [
            "顶面全黄、下面两层已还原后，先只看四个顶角。每个侧面顶行的左、右两张角贴纸若同色，就叫一对「车灯」；中间的棱贴纸暂时不看。检查四个侧面，不要看到一对就立刻套公式。",
            "四个侧面都有车灯：角块的相对顺序已经正确。只转顶层，用 U、U' 或 U2 把角贴纸与侧面中心颜色对齐；若已经对齐就不转。跳过角块交换，直接检查下一节的棱块。例如整个魔方已经复原时也有四对车灯，这时做 T 置换反而会打乱它。",
            "恰好只有一个侧面有车灯：把这一对放在左侧，再做本例的 T-perm：R U R' U' R' F R2 U' R' U' R U R' F'。没有任何车灯时，使用下一节单独讲解的 Y 置换案例，先对照它的起点摆放，不要在任意朝向盲套公式。",
            "角块交换后，可能还需转一下顶层，才能让所有角块的侧面贴纸与中心对齐。核对角块后再处理顶棱。这里的 T 置换同时会换两个棱块；演示刻意配好了起点，所以最后整颗复原，并不代表真实打乱的棱块也一定同时完成。",
          ],
          en: [
            "Start with yellow on top and the lower two layers solved. Headlights are matching left and right corner stickers on a side's top row; ignore its middle edge sticker for now. Inspect all four sides before choosing an algorithm.",
            "Headlights on all four sides mean the corners are already in the correct relative order. Use only U, U' or U2 to align their side stickers with the centers, or do nothing if aligned. Skip corner swapping and check the edges next. A fully solved cube also has four headlight pairs: a T permutation would scramble it.",
            "Exactly one side with headlights: hold that pair on the left and use this T-perm: R U R' U' R' F R2 U' R' U' R U R' F'. With no headlights, study the separate Y-permutation case next and match its starting orientation rather than applying a formula blindly.",
            "After swapping corners, a final top-layer turn may still be needed to match their side stickers to the centers. Then check the top edges. T also swaps two edges; this prepared example finishes fully solved, but edges in a real scramble may still need their own step.",
          ],
        },
        alg: "R U R' U' R' F R2 U' R' U' R U R' F'",
        algNote: { zh: "T-perm。Y-perm：F R U' R' U' R U R' F' R U R' U' R' F R F'。", en: "T-perm. Y-perm: F R U' R' U' R U R' F' R U R' U' R' F R F'." },
      },
      {
        id: "cp-y",
        title: { zh: "独立案例：Y 置换，交换对角", en: "Separate case: Y permutation, diagonal corners" },
        body: {
          zh: ["顶面全黄只说明黄色朝向正确，不说明侧面颜色正确。本例右前上角与左后上角互换；四个侧面都找不到两张同色的顶角贴纸。先看绿色前面：左上是绿，右上却是蓝；右面的左上是红而不是橙。这才是需要调整位置的证据。", "保持黄上绿前，选择此案例，每按一次下一步执行一个记号。前九步是 F R U' R' U' R U R' F'，后八步是 R U R' U' R' F R F'。分组只是帮助阅读，不能省掉任何一步；中间黄面被打乱是正常的。", "第 17 步后检查：顶面仍全黄，四个顶角的两张侧面贴纸分别与中心同色，下面两层保持正确。Y 置换也会交换两个棱块，本例特意配好这些棱，所以最终整颗复原。其它打乱做完后可能仍需下一节的棱块置换。"],
          en: ["An all-yellow top proves orientation, not correct side colors. This case swaps the front-right and back-left top corners; no side has matching top-corner stickers. On the green front, the upper-left is green but upper-right is blue; the right face’s upper-left is red instead of orange. These mismatches show incorrect positions.", "Keep yellow up and green front. Select the case and press Next once per token. The first nine moves are F R U' R' U' R U R' F'; the last eight are R U R' U' R' F R F'. Groups help reading but do not omit moves. Temporary disruption of the yellow top is normal.", "After step 17, check the yellow top, both side stickers of each top corner matching their centers, and preserved lower layers. Y also swaps two edges. This prepared case includes those edges and finishes solved; other scrambles can still require edge permutation."],
        },
        alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
      },
      {
        id: "ep",
        title: { zh: "PLL 第二步：棱块置换", en: "PLL look 2: edge permutation" },
        body: {
          zh: [
            "角块到位后棱块只剩四种情况。三个棱循环：一个棱正确时把它放在后面，看其余三个是顺时针还是逆时针循环——Ua：R U' R U R U R U' R' U' R2，Ub：R2 U R U R' U' R' U' R' U R'。",
            "四条顶棱都不正确时，先区分相对交换 H 和相邻交换 Z。后面分别有独立案例，按侧面颜色判断去向。Z 不能只做一次 Ua 就宣布完成；本页用两次 Ua 加顶层对齐动作带你做完，每一步都有按钮，最后还要检查六个面。",
          ],
          en: [
            "With corners placed, edges have four cases. Three-cycles: hold the correct edge at the back and see whether the other three cycle clockwise or counter-clockwise — Ua: R U' R U R U R U' R' U' R2, Ub: R2 U R U R' U' R' U' R' U R'.",
            "If all four top edges are misplaced, distinguish opposite swaps (H) from adjacent swaps (Z). Separate cases below show their color destinations. One Ua does not finish Z. This lesson walks through two Ua sequences plus top-layer alignment moves, with a button for each step and a final six-face check.",
          ],
        },
        alg: "R U' R U R U R U' R' U' R2",
        algNote: { zh: "Ua。Ub 是它的逆。", en: "Ua. Ub is its inverse." },
      },
      {
        id: "ep-ub",
        title: { zh: "独立案例：Ub，三条棱各回各家", en: "Separate case: Ub, return three edges" },
        body: {
          zh: ["先确认顶面全黄、四个顶角侧色正确。本例后面整行都是蓝，后上棱不用动。前面顶行中间是红，应该去左面红中心上方；左面顶行中间是橙，应该去右面；右面顶行中间是绿，应该去前面。不必猜“顺时针”是从哪里看，先按这三种颜色找到目的地。", "保持绿色中心朝前、蓝色中心朝后，逐步执行 R2 U R U R' U' R' U' R' U R'，共 11 次点击。两个连续 R' 之间即使没有 U，也要按显示顺序执行。半圈 R2 只点一次。", "完成后不要立即重启。检查四个侧面顶行的中间贴纸都与中心同色，顶角仍正确，黄顶白底与下面两层不变。本案例此时六面各自同色，已经复原。"],
          en: ["Check the yellow top and correctly placed top corners first. The back row is entirely blue, so its edge stays. The front upper-middle is red and belongs above the left red center; the left upper-middle is orange and belongs on the right; the right upper-middle is green and belongs at front. Follow color destinations instead of guessing the viewpoint for clockwise.", "Keep green front and blue back. Step through R2 U R U R' U' R' U' R' U R', eleven clicks. Follow every displayed token in order; R2 is one half-turn and one click.", "Do not restart immediately. Check each side’s upper-middle sticker against its center, all top corners, the yellow top, white bottom and lower layers. All six faces are uniform in this prepared case: it is solved."],
        },
        alg: "R2 U R U R' U' R' U' R' U R'",
      },
      {
        id: "ep-h",
        title: { zh: "独立案例：H，两对相对棱互换", en: "Separate case: H, opposite edge pairs" },
        body: {
          zh: ["不要与 OLL 的 H 混淆：这里顶面已经全黄，角块也已归位。只有四条顶棱的位置不对。前面顶行中间是蓝、后面是绿，它们需要互换；左面顶行中间是橙、右面是红，这一对也需要互换。中心块不会移动，用中心颜色判断目的地。", "选择案例后保持黄上绿前，按 R2 U2 R U2 R2 U2 R2 U2 R U2 R2 逐步操作，一共 11 个记号。大多数记号带 2，表示该面转半圈，不是按两次按钮。随时可以停下来对照六面图，不要求速度。", "最后停在成品：前后顶棱分别是绿和蓝，左右顶棱分别是红和橙，所有角块和下面两层保持正确，六面各自同色。若实体魔方没有达到这些条件，先重摆本例再逐步核对，不要盲目重复公式。"],
          en: ["Do not confuse this with OLL H: here the top is already yellow and corners are placed. Only four top edges are misplaced. The front upper-middle is blue and back is green: they swap. Left upper-middle is orange and right is red: they also swap. Centers do not move; use their colors as destinations.", "Select the case, keep yellow up and green front, and step through R2 U2 R U2 R2 U2 R2 U2 R U2 R2: eleven tokens. Most have 2, meaning a half-turn rather than two button presses. Pause to compare the six-face diagrams whenever needed; speed is not the goal.", "Keep the final result visible. Front/back top edges are green/blue and left/right are red/orange, with corners and lower layers correct. All faces are uniform. If your physical cube differs, reset the example and inspect each move instead of blindly repeating the algorithm."],
        },
        alg: "R2 U2 R U2 R2 U2 R2 U2 R U2 R2",
      },
      {
        id: "ep-z",
        title: { zh: "独立案例：Z，两对相邻棱互换", en: "Separate case: Z, adjacent edge pairs" },
        body: {
          zh: [
            "先看起点：黄顶已经完成，顶角侧面颜色正确，下面两层也正确。前面顶行中间是橙色，右面顶行中间是绿色，这两条棱需要互换；后面顶行中间是红色，左面顶行中间是蓝色，这两条也要互换。它们是两对相邻的位置，不是 H 案例的前后、左右互换。保持黄上、绿前、橙右。",
            "本例用已经介绍的 Ua 分两段完成，不是最短速拧公式。第一段逐步做 R U' R U R U R U' R' U' R2，共 11 次点击。停在第 11 步观察：右上棱已对齐橙中心，前、后、左三条顶棱仍需移动；顶角仍正确。这只是中途检查点，不要点重新开始。",
            "第 12 步只做 U'，把顶层转到第二段的起点，不要旋转整颗魔方。第 13 至 23 步再做同样的 11 步 Ua。此时还没有结束：第 24 步 U 把顶层对齐侧面中心。每次点击只执行当前一个记号，R2 也只点一次；中途可以暂停核对六面图。",
            "完成后停在第 24 步：前、右、后、左的顶行中间分别为绿、橙、蓝、红，顶角也对齐中心，顶面全黄、底面全白，六面各自同色。只有与本例起点、持握方向一致时才照做；不同摆放要先重新识别，不要把两次 Ua 当作所有顶层的通用解法。"
          ],
          en: [
            "Check the start: the top is yellow, top corners match their side centers, and the lower two layers are correct. The front upper-middle is orange and the right upper-middle is green: these edges must swap. The back upper-middle is red and the left upper-middle is blue: they must also swap. These are adjacent pairs, not the front/back and left/right swaps of H. Keep yellow up, green front and orange right.",
            "This case reuses Ua in two stages; it is not a shortest speedsolving algorithm. First step through R U' R U R U R U' R' U' R2, eleven clicks. Pause at step 11: the right top edge matches the orange center, while the front, back and left top edges still need moving. Corners remain correct. This is a checkpoint, not completion; do not restart.",
            "Step 12 is U' only: align the top layer for the second stage without rotating the whole cube. Steps 13 through 23 repeat the same eleven-move Ua. There is still one move left: step 24, U, aligns the top with the side centers. Each click executes one token; R2 also needs one click. Pause to compare the six-face diagrams whenever needed.",
            "Stop at step 24. The front, right, back and left upper-middle stickers are green, orange, blue and red; corners match the centers, the top is yellow and the bottom white. Each of the six faces is uniform. Follow this only after matching its starting pattern and grip; two Ua sequences are not a universal solution for every last layer."
          ],
        },
        alg: "R U' R U R U R U' R' U' R2 U' R U' R U R U R U' R' U' R2 U",
        algNote: { zh: "11 步 Ua → 1 步 U' → 11 步 Ua → 1 步 U，共 24 次点击。", en: "11-step Ua → U' → 11-step Ua → U: 24 clicks in total." },
      },
      {
        id: "next",
        title: { zh: "接下来练什么", en: "What to practise next" },
        body: {
          zh: [
            "先以能解释和正确完成案例为目标，不承诺练几次就达到某个秒数。每次选一个案例：说出起点特征、指出目标块、慢慢执行、检查完成条件。能够独立做到后，再学新情况；不同学习者所需练习量不同。本文仍不是全部顶层情况的完整目录，不能把未讲解的情况硬套进相似公式。",
            "每日谜题和术语表就在旁边，打乱、计时、复原，把今天学的公式用起来。",
          ],
          en: [
            "Aim to explain and complete cases correctly first; no number of practice sessions guarantees a particular time. Choose one case, state its clues, identify target pieces, execute slowly and check the result. Learn another case once you can do that independently. Practice needs vary. This article is not a complete catalog of last-layer cases; do not force an unexplained case into a similar-looking algorithm.",
            "The daily puzzle and glossary are one click away — scramble, time, solve, and put today's algorithms to use.",
          ],
        },
      },
    ],
  },
  {
    slug: "patterns",
    game: "cube",
    title: { zh: "五个漂亮的图案", en: "Five Beautiful Patterns" },
    description: {
      zh: "从复原态出发做出棋盘、六点、盒中盒等经典图案。练读公式最有趣的方法。",
      en: "From a solved cube, make the checkerboard, six dots, cube-in-a-cube and more. The most fun way to practise reading algorithms.",
    },
    level: { zh: "入门", en: "Beginner" },
    minutes: 10,
    steps: [
      {
        id: "how",
        title: { zh: "怎么用这一篇", en: "How to use this page" },
        body: {
          zh: [
            "先选择图案案例，魔方会摆成复原态，但不会自己转动。每点击一次「下一步」，只执行一个记号；看清这一层改变后，再点下一次。最后一步结束后停在完成的图案上，不会继续转回原样。想重看才点「重新开始」。",
            "拿实体魔方跟着做一遍，读错一步图案就不对称——这是检验记号有没有学会的即时反馈。",
          ],
          en: [
            "Select a pattern to prepare a solved cube without moving it. Each press of Next step executes exactly one notation token. Observe the changed layer before clicking again. After the last move, the finished pattern stays visible; it does not turn back to solved. Use Restart only when you want to start over.",
            "Follow along on a real cube: one misread turn and the pattern loses its symmetry — instant feedback on whether notation has sunk in.",
          ],
        },
      },
      {
        id: "checkerboard",
        title: { zh: "棋盘格", en: "Checkerboard" },
        body: {
          zh: [
            "六个面各转 180°，每一面都变成对色相间的棋盘。这条公式是自逆的：再做一次就回到复原。它也是理解「相对面互换」的最好例子——U2 D2 只影响侧面，F2 B2 与 L2 R2 依此类推。",
          ],
          en: [
            "Half-turn all six faces and every face becomes a checkerboard of opposite colours. The algorithm is its own inverse — repeat it to return to solved. It's also the clearest illustration of opposite-face swaps: U2 D2 only affects side faces, and F2 B2 and L2 R2 likewise.",
          ],
        },
        alg: "U2 D2 F2 B2 L2 R2",
      },
      {
        id: "dots",
        title: { zh: "六点", en: "Six dots" },
        body: {
          zh: [
            "中心块本身没有换色或搬到别的面；是周围八张贴纸变成同一种不同于中心的颜色，让中心看起来像一个点。标准写法用中层转动（M E S），这里给的是等价的面转版本。再做一次不会复原——它的周期是 3，做三次才回来；或者做它的逆序。",
          ],
          en: [
            "Centers do not change color or move to another face. The surrounding eight stickers become one different color, making the unchanged center look like a dot. The standard version uses slice moves (M E S); this is an equivalent face-turn version. Repeating it doesn't undo it — its order is 3, so three repetitions return to solved, or apply the inverse.",
          ],
        },
        alg: "U D' R L' F B' U D'",
      },
      {
        id: "cross",
        title: { zh: "六面十字", en: "Cross on every face" },
        body: {
          zh: [
            "每个面中心与四条边中间的贴纸组成同色十字，四角贴纸则是另一种颜色；这另一种颜色不一定来自相对面。这条公式比前两条长，正好用来练习「读短语」：注意其中 L2 U2 L2 这样的对称结构。",
          ],
          en: [
            "Each face has a same-color cross formed by its center and four edge stickers, with four corners of another color; that color is not necessarily the opposite face color. Longer than the first two — good practice for chunking; notice symmetric structures like L2 U2 L2.",
          ],
        },
        alg: "U F B' L2 U2 L2 F' B U2 L2 U",
      },
      {
        id: "cube-in-cube",
        title: { zh: "盒中盒", en: "Cube in a cube" },
        body: {
          zh: [
            "一个 2×2×2 的小魔方「嵌」在大魔方的一角。这是最受欢迎的图案之一，15 步。做完以后不要急着复原，转个角度看看三个面是怎么对齐的。",
          ],
          en: [
            "A 2×2×2 cube appears embedded in one corner of the big cube. One of the most popular patterns, 15 moves. Before undoing it, rotate the view and see how the three faces line up.",
          ],
        },
        alg: "F L F U' R U F2 L2 U' L' B D' B' L2 U",
      },
      {
        id: "superflip",
        title: { zh: "Superflip：离复原最远的状态", en: "Superflip: as far from solved as it gets" },
        body: {
          zh: [
            "每个棱块都在原位但全部翻转，角块和中心不动。Superflip 是第一个被证明需要 20 步（面转计）才能还原的状态——而 2010 年的计算证明，任何状态都不超过 20 步，这个数字被称为「上帝之数」。",
            "这条 20 步公式本身就是一条最优解。它的逆序同样是 20 步，没有更短的路。",
          ],
          en: [
            "Every edge is in place but flipped; corners and centres untouched. The superflip was the first position proven to need 20 face turns — and in 2010 it was shown that no position needs more. That number is called God's Number.",
            "This 20-move algorithm is itself an optimal solution. Its inverse is also 20 moves; there is no shorter path.",
          ],
        },
        alg: "U R2 F B R B2 R U2 L B2 R U' D' R2 F R' L B2 U2 F2",
      },
    ],
  },
];
