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
        title: { zh: "第一步：底层白色十字", en: "Step 1: The White Cross" },
        body: {
          zh: [
            "把白色中心朝下，目标是把 4 个含白色的棱块归位，在底面拼出白色十字。注意：不只是白色朝下，每个棱块侧面的颜色还必须和相邻的中心块颜色一致。",
            "第一次可以分两段做：先在黄中心周围收集四个白色棱贴纸，像四片白花瓣，这叫‘小花’；此时不要求花瓣的侧色对齐。再逐片对齐侧色，送到底层。已经拼好的白十字就跳过；别把白色角贴纸算作花瓣。以下找块时可以水平换拿法，但一直黄上白下。",
            "情况一：白贴纸已经朝上，就先留作花瓣。情况二：白贴纸朝下，把这枚棱所在侧面放到正前方；先转 U，让前上棱位置没有白色朝上的花瓣，再做 F2，把这枚白棱送到上面。‘让出空位’是把已有花瓣移到别处，并不要求那里真的没有小块。",
            "情况三：白贴纸朝向侧面，先水平换拿法让白贴纸朝前。若它在中层前右，先用 U 让右上棱位置没有白色花瓣，再做 R；若在中层前左，先让左上位置没有花瓣，再做 L′。这两种动作都会把朝前的白色翻到顶面。每次只处理一个目标。",
            "情况四：白贴纸朝前，但目标在前上或前下。先做 F 把它转到中层，再按情况三处理；若从前下开始，做 F 前先用 U 移开前上的白色花瓣，免得破坏它。若从前上开始，该处白贴纸本来就不朝上，不必先转 U。每完成一个目标，就重新数顶面白花瓣；至少增加一枚，有时顺带送上另一枚，直到四枚齐全。",
            "花瓣齐后，选一枚白棱，读出另一色，水平换拿法让同色中心朝前；转 U，把该棱移到前上，确认侧面贴纸与前中心同色，再做 F2。对余下花瓣逐个重复，已送到下面的白棱不用再取出。最后检查底面四个白棱和四面侧色，不能只看白色十字的形状。",
            "本页演示只展示最后一片白绿花瓣的送入：白色朝上，绿色朝前且对着绿中心，F2 将其送到底部，另外三条已好的白棱不受影响。它不是从任意打乱直接只做一次 F2；遇到其它位置，先按前面的四种情况收集，再对齐。",
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
        title: { zh: "第二步：底层白色角块", en: "Step 2: The White Corners" },
        body: {
          zh: [
            "先验收白十字，再找一个带白色的三色角。比如白绿橙角的家，是白、绿、橙三个中心之间。保持白下黄上，水平换拿法，让它的家位于底层前右；只转顶层 U，把这枚角送到家正上方的顶层前右。‘前右’是前面与右面相交处，不是屏幕画面上随便一个右边角。",
            "在这个固定操作位置，完整做一组 R U R' U'，四步都做完才检查。若目标白角还没正确落到底层前右，就保持同一拿法继续整组；三种白色朝向通常分别需要1、3或5组。中途目标可能暂时离开前右，不要因此额外转 U 追它，也不要换拿法。终点必须白色朝下，另外两色分别对齐前、右中心。",
            "若目标角已在底层前右但扭着，先做一组将它取到顶层；若卡在别的底层位置，先水平换拿法把那个位置作为前右，再取出。随后重新按第一段找家、把家摆到前右、用 U 对准。取出不等于已放好。某个白角已经正确则跳过，不要为凑满四次而破坏它。",
            "本页四步演示只准备了一个恰好一组就能插好的案例，不会自动执行三组或五组。实体练习按每组结束后的实际状态判断。逐个完成四个白角后，检查底面九格全白，四个侧面最下面一排也分别同色；只有底面白、侧面错色，不能进入中层。",
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
        title: { zh: "第三步：还原中层棱块", en: "Step 3: The Second Layer" },
        body: {
          zh: [
            "继续保持白下黄上，不要上下翻转。先检查底层已完整还原，再在顶层找不含黄色的棱块；白棱此时已经在底层，候选块应只有两个侧面颜色。水平换拿法，把其中一个颜色的中心当作正面；转 U，让棱块位于正面上方且朝前的贴纸与前中心同色。若朝前颜色对不上，先重新找对应中心，不要急着套公式。",
            "观察棱块顶面的颜色：如果它应该去右边的中层位置，使用右侧公式（U R U' R' U' F' U F）；如果应该去左边，使用镜像公式 U' L' U L U F U' F'。",
            "如果某个中层棱块位置或方向不对，先用公式把任意顶层棱块插进去把它「顶」出来，再重新插入。完成后魔方的下两层应该全部还原。",
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
        title: { zh: "第四步：顶层黄色十字", en: "Step 4: The Yellow Cross" },
        body: {
          zh: [
            "现在只看顶面的黄色棱块，目标是拼出黄色十字（暂时不管侧面颜色）。你会遇到四种情况之一：一个点、一条横线、一个「L」形（拐角）、或已经是十字。",
            "只数四个棱位置，不数中心和角块。横线要左右横放，用 F R U R' U' F'。L 形要两条黄棱在左边和后边，用另一条公式 F U R U' R' F'。若只有中心这个点，先用横线公式，再转 U 把产生的 L 摆到左后，最后用 L 公式。已经十字就跳过，不要继续转。进阶两步顶层课另有 L 形和点形的逐步图例。",
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
        title: { zh: "第五步：先把黄色角块放到正确位置", en: "Step 5: Put yellow corners in the correct locations" },
        body: {
          zh: [
            "本课采用先定角位置、再翻角方向的顺序，不把小鱼和其它流程混在一起。先忽略黄色是否朝上：例如黄绿橙角块，只要在黄、绿、橙三个中心夹住的位置，就叫位置正确，即使它扭着也算。逐个核对四个角的三种颜色，不是只找侧面两个相同贴纸。",
            "若四角都在正确位置，跳过本步。若只有一个位置正确，保持黄上白下，把整颗魔方水平换个拿法，让这个正确角在上层前右，然后完整执行 U R U' L' U R' U' L。这条公式保留前右角，让其它三个角循环换位。做完重新检查；还没全部到位就保持这个正确角在前右，再做一次。",
            "如果暂时有两个正确角，或一个也没有，先尝试转顶层 U，每转四分之一圈检查一次，最多试三个新方向：能找到一个正确角就按上一段处理，四角全对则跳过。四个顶层方向都没有正确角时，才先执行一遍公式，再寻找正确角。不要在半条公式中途换方向。验收只要求四个角的三色集合分别对应周围中心；黄色不一定朝上，下一步专门处理方向。",
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
        title: { zh: "第六步：逐个翻正黄色角块", en: "Step 6: Twist the yellow corners upright" },
        body: {
          zh: [
            "四角位置验收通过后，再处理朝向。全程黄上白下，前中心固定不变。把一个黄色未朝上的角用 U 转到上层前右。重复小组合 R' D' R D，每四步完整做完才检查一次；通常需要两组或四组，直到这个角的黄色朝上。已经朝上的角不要处理。",
            "重点：过程中底下两层看起来会被打乱，这是暂时的，不要停下来修底层，也不要转动整颗魔方去找下一个角。只转 U，把下一个未翻好的角送到同一个前右操作位置，继续完整的四步小组合。处理完全部角后再转 U 对齐侧面角块，底下两层应该一起恢复。",
            "演示是一道两个扭角的完整案例：先两组 R' D' R D，再 U 换角，接着四组，最后 U' 对齐。每次下一步只执行一个字母；分组是方便你检查，不是自动连转。实体魔方的扭角数量和方向不同，不能不看局面照抄这道题的组数。若全部角处理后底层没恢复，检查是否少做了每组最后的 D、换了整颗拿法或漏了某个角。",
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
        title: { zh: "第七步：顶层棱块归位，完成还原", en: "Step 7: Permute the Edges & Finish" },
        body: {
          zh: [
            "最后一步：让顶层 4 个棱块归位。如果有一个棱块已经正确，把它所在的面朝后，执行右边的公式，其余三个棱块会循环换位；根据情况可能需要执行两次。",
            "如果四个棱块都不正确，先在任意角度执行一次公式，就会出现一个正确的棱块，再按上面处理。",
            "当最后一个棱块落位的瞬间——恭喜！你已经独立还原了一个三阶魔方。接下来可以反复练习，把每一步的观察和公式变成肌肉记忆，然后挑战更快的还原方法（如 CFOP）。",
          ],
          en: [
            "The final step: place the 4 top edges. If one edge is already correct, hold that face at the back and apply the algorithm — the other three edges cycle. You may need to apply it twice.",
            "If no edge is correct, apply the algorithm once from any angle to create a correct one, then proceed.",
            "The moment the last edge drops in — congratulations! You've solved a Rubik's Cube on your own. Keep practicing until each step becomes muscle memory, then move on to faster methods like CFOP.",
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
