import type { Locale } from "@/lib/i18n";
import type { GameSlug } from "./games";
import { cubeTutorials } from "./cube/tutorials";
import { recoverySteps } from "./cube/recovery";
import { boardTutorials } from "./board/tutorials";
import { xiangqiCurriculum } from './board/xiangqi-curriculum';
import { chessCurriculum } from './board/chess-curriculum';
import { shogiCurriculum } from './board/shogi-curriculum';
import { goCurriculum } from './go-curriculum';
import { cardCurriculum } from './card-curriculum';
import { mahjongFoundation, mahjongReference, mahjongBranch } from './mahjong-curriculum';
import { cubeCurriculum } from './cube/curriculum';
import { firstLessons } from "./first-lessons";
import { ruleDemos } from "./board/rule-demos";
import { mahjongTermsTutorial } from "./mahjong-lessons";
import { mahjongVariantTutorials } from "./mahjong-variants";

interface Localized {
  zh: string;
  en: string;
}

export interface TutorialStep {
  id: string;
  title: Localized;
  /** 正文段落 */
  body: { zh: string[]; en: string[] };
  /** 本步骤的核心公式（可在 3D 魔方上演示）。为空表示纯讲解步骤 */
  alg?: string;
  algNote?: Localized;
  /** 棋类教程：本步骤的局面与可演示的着法（UCI） */
  position?: { fen: string; moves?: string[] };
}

export interface Tutorial {
  slug: string;
  game: GameSlug;
  title: Localized;
  description: Localized;
  level: Localized;
  minutes: number;
  steps: TutorialStep[];
}

const tutorialSources: Tutorial[] = [
  ...firstLessons.filter(t=>!['xiangqi','chess','shogi','go','holdem','baccarat','mahjong'].includes(t.game)),
  mahjongFoundation(firstLessons.find(t=>t.game==='mahjong')!),
  ...firstLessons.filter(t=>['holdem','baccarat'].includes(t.game)).map(cardCurriculum),
  goCurriculum(firstLessons.find(t=>t.game==='go')!),
  ...shogiCurriculum(firstLessons.find(t=>t.game==='shogi')!,boardTutorials.find(t=>t.game==='shogi')!),
  ...chessCurriculum(firstLessons.find(t=>t.game==='chess')!,boardTutorials.find(t=>t.game==='chess')!,ruleDemos.chess??[]),
  ...xiangqiCurriculum(firstLessons.find(t=>t.game==='xiangqi')!,boardTutorials.find(t=>t.game==='xiangqi')!,ruleDemos.xiangqi??[]),
  ...mahjongVariantTutorials.map(mahjongBranch),
  mahjongReference(mahjongTermsTutorial),
  ...cubeTutorials.filter((t) => t.slug === "notation"),
  {
    slug: "beginner-lbl",
    game: "cube",
    title: {
      zh: "层先法：新手还原三阶魔方",
      en: "Beginner's Method: Solve the 3x3 Layer by Layer",
    },
    description: {
      zh: "完成基础记号课后，区分撤销打乱记录与逐层求解；按白十字、白角、中层和顶层的顺序，学习找块、摆正操作位置与检查结果。",
      en: "After Basic Notation, distinguish undoing a scramble record from solving layers. Learn to find pieces, establish the working position and check each stage: white cross, corners, middle layer and last layer.",
    },
    level: { zh: "入门", en: "Beginner" },
    minutes: 70,
    steps: [
      ...recoverySteps,
      {
        id: "notation",
        title: { zh: "认识魔方与转动符号", en: "The Cube & Move Notation" },
        body: {
          zh: [
            "三阶魔方由 26 个小块组成：6 个中心块、12 个棱块（两种颜色）和 8 个角块（三种颜色）。中心块的位置永远不变，它决定了每个面最终的颜色——所以还原魔方本质上是把棱块和角块送回中心块指定的位置。",
            "教程中用字母表示转动：U（上）、D（下）、L（左）、R（右）、F（前）、B（后）。单个字母表示把该面顺时针转 90°（想象你正对着这个面看）；字母后加 ' 表示逆时针 90°，加 2 表示转 180°。例如 R 是右面顺时针转 90°，U' 是顶面逆时针转 90°。",
            "试试 3D 魔方：先选择案例，再点击「下一步」，每次只执行 R U R' U' 中的一个记号。对照当前提示看清转的是哪一层，然后再点下一次。第四步结束后保持结果不动；可以拖动观察角度，不会自动重复公式或重新开始。",
          ],
          en: [
            "A 3x3 cube has 26 pieces: 6 fixed centers, 12 edges (two colors each) and 8 corners (three colors each). Centers never move relative to each other — they define the final color of each face. Solving the cube means moving every edge and corner back to the position its colors dictate.",
            "Moves are written with letters: U (up), D (down), L (left), R (right), F (front), B (back). A letter alone means turn that face 90° clockwise (as if you were looking straight at it). An apostrophe (') means counter-clockwise, and a 2 means 180°. So R turns the right face clockwise, U' turns the top counter-clockwise.",
            "Select the 3D case, then press Next step for one token of R U R' U' at a time. Read the face and direction prompt and inspect the changed layer before continuing. The fourth move leaves the result visible. Drag to inspect the viewing angle; the algorithm never repeats or restarts automatically.",
          ],
        },
        alg: "R U R' U'",
        algNote: {
          zh: "最常用的「四步小组合」，后面很多公式都由它构成。",
          en: "The most common four-move trigger — many later algorithms are built from it.",
        },
      },
      {
        id: "white-cross",
        title: { zh: "第一步：底层白十字", en: "Step 1: The White Cross" },
        body: {
          zh: [
            "白色中心朝下。目标是把 4 个带白色的棱块放好，在底面拼出白色十字。注意：不只是白色朝下，每个棱块侧面的那个颜色还要和旁边的中心同色。",
            "第一次可以分两段做：先在黄色中心周围收集四个“白色朝上”的棱块，像四片白花瓣，这叫“小花”，这时还不用管花瓣侧面的颜色。然后再一片一片对准侧色，送到底层。白十字已经拼好就跳过。注意别把白色的角块贴纸当成花瓣。找块时可以水平转动整个魔方换拿法，但始终保持黄色朝上、白色朝下。",
            "情况一：白色贴纸已经朝上，就留着当花瓣。情况二：白色朝下。把这个棱块所在的侧面转到正前方，先转 U，让前上方那个位置不是白色花瓣，再做 F2，把这个白棱翻上来。“让出位置”只是把已有的花瓣转到别处，不是说那里要真的空着。",
            "情况三：白色朝向侧面。先水平换拿法，让白色贴纸朝前。如果它在中层的前右位置，先用 U 让右上方不是白色花瓣，再做 R；如果在中层前左位置，先用 U 让左上方不是花瓣，再做 L′。这两种动作都会把朝前的白色翻到顶面。每次只处理一个目标。",
            "情况四：白色朝前，但这个棱块在前上或前下。先做 F 把它转到中层，再按情况三处理。如果是从前下开始，做 F 之前先用 U 把前上方的白色花瓣移开，免得把它弄掉；如果从前上开始，它的白色本来就不朝上，不用先转 U。每处理完一个，重新数一数顶面有几片白花瓣：至少会多一片，有时还会顺带多一片，直到四片齐全。",
            "花瓣收齐后，选一片白棱，看它另一种颜色是什么，水平换拿法让那个颜色的中心朝前；转 U，把这个棱块移到前上方，确认它朝前的贴纸和前面中心同色，再做 F2 送到底面。剩下的花瓣一个个照做，已经送下去的不用再拿上来。最后检查底面四个白棱和四个侧面的颜色，不能只看白十字的形状。",
            "本页演示只做最后一片白绿花瓣：白色朝上、绿色朝前并对准绿色中心，一个 F2 就把它送到底部，另外三个已经放好的白棱不受影响。这不是说任意打乱都只要一个 F2；遇到其他位置，要先按上面四种情况收集、对齐。",
          ],
          en: [
            "Hold the cube with the white center facing down. The goal is to place the 4 white edges so they form a white cross on the bottom — and each edge's side color must match the adjacent center.",
            "Split your first cross into two tasks. Collect four upward-facing white edge stickers around the yellow center, forming a daisy, without yet matching side colors. Then align each petal and send it down. Skip this stage if the white cross is already correct. White corner stickers are not petals. Regrip horizontally when needed, always yellow up and white down.",
            "Case 1: white already faces up; keep that petal. Case 2: white faces down. Hold the side containing that edge at the front. Turn U until the upper-front edge position has no upward white petal, then use F2 to lift the target. Freeing a position means moving a petal elsewhere, not removing a physical piece.",
            "Case 3: white faces sideways. Regrip horizontally until the white sticker faces front. For an edge at middle-front-right, use U to clear an upward white petal from upper-right, then R. At middle-front-left, clear upper-left with U, then L′. These turns lift the front-facing white sticker onto the top. Work on one target at a time.",
            "Case 4: white faces front but the edge is at upper-front or lower-front. Use F to move it to the middle, then apply case 3. Before F from lower-front, use U to move any upper-front white petal away. From upper-front, its white sticker is not up, so do not add that preliminary U. Count petals after each target: gain at least one, sometimes lifting another incidentally, until all four are collected.",
            "With the daisy complete, choose a white edge and read its other color. Regrip horizontally to put that color’s center at the front; use U to bring the edge above it. Confirm the front sticker matches the center, then F2 to send it down. Repeat for the remaining petals without lifting completed bottom edges again. Inspect all four bottom white edges and their matching side colors, not only the cross shape.",
            "The on-page demonstration shows only the final white-green petal: white up, green facing the green center. F2 sends it down without disturbing the other three cross edges. It is not a one-F2 solution to any scramble. Use the four cases above to collect and align differently placed edges first.",
          ],
        },
        alg: "F2",
        algNote: {
          zh: "白绿棱已对齐前中心：前面转半圈，送入底层。",
          en: "White-green edge aligned at front: a front half-turn inserts it below.",
        },
      },
      {
        id: "white-corners",
        title: { zh: "第二步：底层白角", en: "Step 2: The White Corners" },
        body: {
          zh: [
            "先确认白十字已经完成，再找一个带白色的三色角块。比如白绿橙角块，它的“家”在白、绿、橙三个中心之间。保持白下黄上，水平换拿法，让这个家位于底层的前右；然后只转 U，把这个角块送到家正上方，也就是顶层前右。“前右”是前面和右面相交的那个角，不是屏幕上随便哪个靠右的角。",
            "保持这个拿法，完整做一组 R U R' U'，四步都做完再检查。如果目标白角还没正确落到底层前右，就保持同样的拿法再做一整组；根据白色朝向的不同，通常需要 1 组、3 组或 5 组。中途目标角可能暂时离开前右，不要额外转 U 去追它，也不要换拿法。最终要白色朝下，另外两种颜色分别对准前面和右面的中心。",
            "如果目标角已经在底层前右但方向扭了，先做一组把它取到顶层；如果它卡在底层的其他位置，先水平换拿法，让那个位置变成前右，再做一组取出来。取出来后，重新按第一段的方法：找家、把家摆到前右、用 U 对准。取出来不等于放好了。已经放对的白角就跳过，不要为了凑满四次去破坏它。",
            "本页的四步演示只准备了一个恰好一组就能放好的案例，不会自动执行三组或五组。用实体魔方练习时，每做完一组就看一次实际状态。四个白角都放好后，检查底面九格全白，四个侧面最下面一排也各自同色；如果底面白了但侧面颜色不对，还不能进入中层。",
          ],
          en: [
            "Check the white cross first, then find a three-color white corner. A white-green-orange corner belongs between those three centers. Keep white down and yellow up; regrip horizontally so its home is at bottom-front-right. Turn only U to bring the corner directly above its home at upper-front-right. Front-right means the intersection of the front and right faces, not an arbitrary rightmost corner on the screen.",
            "Keep that grip and complete R U R' U' before inspecting. If the target is not correctly inserted at bottom-front-right, repeat full groups without regripping; the three starting white-sticker orientations typically require one, three or five groups. The piece may temporarily leave front-right: do not chase it with extra U moves. Finish with white down and the other two colors matching the front and right centers.",
            "If the target is twisted in bottom-front-right, use one full group to extract it. If trapped in another bottom slot, regrip horizontally to bring that slot to front-right before extracting. Then locate its home again, hold the home at front-right and align U as above. Extraction is not insertion. Skip correctly solved corners rather than disturbing them to perform four repetitions.",
            "This four-move demonstration prepares just one case needing a single group; it does not automatically perform three or five groups. On a physical cube, inspect after each full group. After all four corners, check the nine white bottom stickers and matching bottom rows on all four sides. A white face with mismatched sides is not ready for the middle layer.",
          ],
        },
        alg: "R U R' U'",
        algNote: {
          zh: "重复执行直到角块正确落位。",
          en: "Repeat until the corner drops in correctly.",
        },
      },
      {
        id: "second-layer",
        title: { zh: "第三步：中层棱块", en: "Step 3: The Second Layer" },
        body: {
          zh: [
            "继续保持白下黄上，不要上下翻转。先确认底层已经完整还原，再在顶层找一个不带黄色的棱块；白色棱块这时都在底层，所以候选的棱块只有两种侧面颜色。水平换拿法，把其中一种颜色的中心转到正前方；转 U，让这个棱块位于前面中心正上方，而且朝前的贴纸和前面中心同色。如果颜色对不上，先重新找对应的中心，不要急着套公式。",
            "看这个棱块朝上的那种颜色：如果它应该去右边的中层位置，就用右侧公式 U R U' R' U' F' U F；如果应该去左边，就用镜像公式 U' L' U L U F U' F'。",
            "如果某个中层棱块位置不对或者翻反了，先用公式把任意一个顶层棱块插进那个位置，把它“顶”出来，再把它重新正确插入。这一步完成后，魔方下面两层就全部还原了。",
          ],
          en: [
            "Keep white down and yellow up; do not flip the cube over. Check that the first layer is complete, then find a top-layer edge without yellow. White edges are already below, so the candidate should have two side colors. Regrip horizontally to put one matching center at the front, then turn U to place the edge above it with its front sticker matching that center. Resolve any color mismatch before applying an algorithm.",
            "Look at the edge's top color: if it belongs in the right-hand slot, use the algorithm on the right (U R U' R' U' F' U F); if it belongs on the left, use the mirror: U' L' U L U F U' F'.",
            "If a middle edge is in the wrong slot or flipped, insert any top-layer edge into that slot to pop it out, then insert it properly. After this step the bottom two layers are complete.",
          ],
        },
        alg: "U R U' R' U' F' U F",
        algNote: {
          zh: "把顶层棱块插入右侧中层。左侧用镜像：U' L' U L U F U' F'。",
          en: "Inserts a top edge into the right slot. Mirror for the left: U' L' U L U F U' F'.",
        },
      },
      {
        id: "yellow-cross",
        title: { zh: "第四步：顶层黄十字", en: "Step 4: The Yellow Cross" },
        body: {
          zh: [
            "现在只看顶面的黄色棱块，目标是拼出黄色十字，侧面颜色暂时不管。你会遇到四种情况之一：只有中间一个点、一条横线、一个“L”形（拐角）、或者已经是十字。",
            "只数四个棱块的位置，不数中心和角块。横线要左右横着放，用 F R U R' U' F'。L 形要让两个黄色棱块在左边和后边，用另一个公式 F U R U' R' F'。如果只有中心一个点，先用横线公式，再转 U 把出现的 L 摆到左后方，最后用 L 形公式。已经是十字就跳过，不要继续转。进阶的两步顶层课另有 L 形和点形的逐步图例。",
          ],
          en: [
            "Focus only on the yellow edges on top — the goal is a yellow cross (ignore side colors for now). You'll see one of four patterns: a dot, a horizontal line, an \"L\" shape, or already a cross.",
            "Count only the four edge positions, not corners or the center. For a left-right line, use F R U R' U' F'. For an L with yellow edges at left and back, use F U R U' R' F'. For a dot, use the line algorithm, adjust U until the resulting L points left and back, then use the L algorithm. Skip an existing cross. The two-look last-layer lesson has separate manual L and dot examples.",
          ],
        },
        alg: "F R U R' U' F'",
        algNote: {
          zh: "本演示只处理左右横线，不是所有形状通用的拿法。",
          en: "This demonstration uses a left-right line, not a universal grip for every shape.",
        },
      },
      {
        id: "yellow-face",
        title: { zh: "第五步：先把黄色角块放到正确位置", en: "Step 5: Put the yellow corners in place" },
        body: {
          zh: [
            "本课先把角块放到对的位置，下一步再翻转方向，不要和“小鱼”等其他方法混着用。这一步先不管黄色朝不朝上：比如黄绿橙角块，只要它在黄、绿、橙三个中心夹住的位置，就算位置正确，即使它是扭着的。要逐个核对每个角的三种颜色，不能只看侧面两张贴纸。",
            "如果四个角都已经在正确位置，跳过这一步。如果只有一个角位置正确：保持黄上白下，水平转动整个魔方，让这个正确的角在顶层前右，然后完整做一遍 U R U' L' U R' U' L。这个公式会保持前右角不动，让另外三个角轮换位置。做完再检查；如果还没全部到位，保持这个正确角在前右，再做一次。",
            "如果暂时有两个正确的角，或者一个都没有：先试着转 U，每转四分之一圈检查一次，最多试三个新方向。找到一个正确角，就按上一段处理；四个角都对，就跳过。只有四个方向都没有正确角时，才先做一遍公式，再去找正确的角。不要在公式做到一半时换方向。检查标准：每个角的三种颜色分别和周围三个中心对应；黄色不一定朝上，下一步专门处理方向。",
          ],
          en: [
            'This method places corners before twisting them; do not mix it with a different Sune-based sequence. Ignore whether yellow faces up. A yellow-green-orange corner is in the right location if it is between those three centers, even when twisted. Check all three colors of each corner.',
            "Skip this step if all four corners are correctly located. If one is correct, keep yellow up and white down, and rotate the whole cube horizontally to hold that corner at upper-front-right. Execute U R U' L' U R' U' L completely. It keeps that corner and cycles the other three. Check again; repeat with the same correct corner at front-right if necessary.",
            'If two or no corners are correct, first try U quarter-turns, checking after each of up to three new top alignments. Use any alignment with one correct corner as above; skip if all four match. Only if none of the four alignments has a correct corner, apply the algorithm once and look again. Never regrip halfway through an algorithm. At the checkpoint every corner’s three colors match its surrounding centers; yellow does not yet have to face up.',
          ],
        },
        alg: "U R U' L' U R' U' L",
        algNote: {
          zh: "固定上层前右角，循环另外三个角的位置。",
          en: "Keep upper-front-right fixed and cycle the other three corners.",
        },
      },
      {
        id: "corner-permutation",
        title: { zh: "第六步：一个一个把黄角翻正", en: "Step 6: Twist the yellow corners upright" },
        body: {
          zh: [
            "四个角的位置都对了之后，再处理方向。整个过程保持黄上白下，前面的中心也不换。用 U 把一个黄色没朝上的角转到顶层前右，反复做 R' D' R D 这一小组，每组四步做完才检查；通常需要 2 组或 4 组，这个角的黄色就会朝上。已经朝上的角不用处理。",
            "重点：做的过程中，下面两层会看起来被打乱，这是暂时的，不要停下来修，也不要转动整个魔方去找下一个角。只转 U，把下一个还没翻好的角送到同一个前右位置，继续做完整的四步小组。所有角都翻好后，再转 U 对齐侧面，下面两层会一起恢复。",
            "演示是一个有两个扭角的完整例子：先做两组 R' D' R D，转 U 换到下一个角，再做四组，最后 U' 对齐。每点一次“下一步”只执行一个字母；分组只是方便你检查，不会自动连转。你手上实物的扭角数量和方向可能不同，不能不看局面照抄组数。如果全部做完下面两层没有恢复，检查是不是漏了每组最后的 D、换了拿法、或者漏掉了某个角。",
          ],
          en: [
            "After all corners are correctly located, keep yellow up, white down and the same front center. Use U to bring an incorrectly oriented corner to upper-front-right. Repeat R' D' R D, checking only after all four moves. Usually two or four groups turn its yellow sticker upwards. Skip corners already facing up.",
            'The lower layers temporarily look scrambled. Do not repair them or rotate the entire cube. Use only U to bring the next twisted corner to the same front-right working position. Continue full four-move groups. After all corners face up, align U with the side centers; the lower layers should recover together.',
            "This complete two-corner example uses two groups of R' D' R D, then U, then four groups, then U' to align. Each Next step still performs only one token. Your physical scramble may need different group counts: inspect rather than copy blindly. If lower layers remain scrambled at the end, check for omitted final D moves, changed grip or missed corners.",
          ],
        },
        alg: "R' D' R D R' D' R D U R' D' R D R' D' R D R' D' R D R' D' R D U'",
        algNote: {
          zh: "两组四步 → U → 四组四步 → U'；只有全部做完才检查底层。",
          en: "Two groups → U → four groups → U'; check the lower layers after the whole exercise.",
        },
      },
      {
        id: "edge-permutation",
        title: { zh: "第七步：顶层棱块归位，完成还原", en: "Step 7: Place the top edges and finish" },
        body: {
          zh: [
            "最后一步：让顶层的 4 个棱块回到正确位置。如果有一个棱块已经正确，就把它所在的面转到后面，然后执行本节下方的公式，另外三个棱块会轮换位置；根据情况可能要做两次。",
            "如果四个棱块都不对，先随便从哪个角度做一次公式，就会出现一个正确的棱块，再按上一段处理。",
            "最后一个棱块落位的那一刻——恭喜！你已经独立还原了一个三阶魔方。接下来多练几遍，把每一步的观察和公式练熟，再去挑战更快的还原方法，比如 CFOP。",
          ],
          en: [
            "The final step: place the 4 top edges. If one edge is already correct, turn that face to the back and apply the algorithm shown below — the other three edges cycle. You may need to apply it twice.",
            "If no edge is correct, apply the algorithm once from any angle to create a correct one, then continue as above.",
            "The moment the last edge drops in — congratulations! You've solved a Rubik's Cube on your own. Practise until each step feels natural, then move on to faster methods such as CFOP.",
          ],
        },
        alg: "R U' R U R U R U' R' U' R2",
        algNote: {
          zh: "顶层三棱换（Ua Perm）。",
          en: "Cycles three top edges (Ua Perm).",
        },
      },
    ],
  },
  ...cubeTutorials.filter((t) => t.slug !== "notation"),
];

export const tutorials: Tutorial[] = tutorialSources.map(t=>cubeCurriculum(t,firstLessons.find(t=>t.game==='cube')!));

export function getTutorial(slug: string): Tutorial | undefined {
  return tutorials.find((t) => t.slug === slug);
}

export function tutorialsForGame(game: GameSlug): Tutorial[] {
  return tutorials.filter((t) => t.game === game);
}

export function localizeTutorial(t: Tutorial, locale: Locale) {
  return {
    slug: t.slug,
    game: t.game,
    title: t.title[locale],
    description: t.description[locale],
    level: t.level[locale],
    minutes: t.minutes,
    steps: t.steps.map((s) => ({
      id: s.id,
      title: s.title[locale],
      body: s.body[locale],
      alg: s.alg,
      algNote: s.algNote?.[locale],
      position: s.position,
    })),
  };
}

export type LocalizedTutorial = ReturnType<typeof localizeTutorial>;
