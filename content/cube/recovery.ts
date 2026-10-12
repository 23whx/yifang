import type { TutorialStep } from '../tutorials';
import { invertAlg } from '../../lib/cube/alg';

export const recoveryScramble = "R U2 F' L D B2 R' U F2 D' L2 B U' R2 F D2 L' B' U2 R";

/** Prerequisites and a complete, explicitly recorded-scramble exercise. */
export const recoverySteps: TutorialStep[] = [
  {
    id: 'what-counts-as-solved',
    title: { zh: '先看终点：怎样才算真正还原？', en: 'Start with the goal: what counts as solved?' },
    body: {
      zh: [
        '不是把六个面都变成同一种颜色，而是每个面自己的九个小方格颜色一致：一个面全白，一个面全黄，其它四个面各自全红、全橙、全蓝、全绿。转动整颗魔方检查背面和底面；只看见正面整齐，不算完成。',
        '先找每个面的正中央小方格。它叫中心块，是这一面的颜色路标。两个颜色的小块叫棱块，三个颜色的小块叫角块。白绿棱块必须挨着白中心和绿中心；白绿红角块必须夹在这三个中心之间。颜色齐了但侧面不齐，说明只是拼好了一面，还没有拼好一层。',
        '下面的还原课程固定白中心朝下、黄中心朝上。拖动演示只是换观察角度，公式中的前后左右不会跟着视角重新命名。看不清时先核对六面展开图，再点击下一步。',
      ],
      en: [
        'Solved does not mean all six faces share one color. Each face has nine matching stickers: one white face, one yellow face, and separate red, orange, blue and green faces. Inspect the back and bottom too; one tidy front face is not enough.',
        'The middle square of each face is its center and identifies that face. An edge has two colors; a corner has three. A white-green edge belongs between the white and green centers. A white-green-red corner belongs between those three centers. One solid face with mismatched side stickers is not a solved layer.',
        'This course keeps white down and yellow up. Dragging the demonstration changes only the camera, not the meaning of front, back, left and right. Check the six-face diagrams before making the next move.',
      ],
    },
  },
  {
    id: 'two-kinds-of-recovery',
    title: { zh: '两种“还原”：撤销记录 ≠ 会解任意魔方', en: 'Two tasks: undoing a record is not solving' },
    body: {
      zh: [
        '情况一：你从六面纯色开始，并且记下了每一次转动，比如先 R，再 U，再 F2。这时只要倒过来做 F2、U\'、R\'，就能回到纯色。为什么要倒着？因为要先撤销最后发生的那一步。为什么要加撇？因为原来是顺时针，撤销时要逆时针。半圈反过来还是半圈。',
        '图案课程就属于这种情况。做完图案后点“学习反向还原”，再一次一次点“下一步”。这个按钮只会把步骤列出来，不会偷偷自动播放，也不会一下子复原。如果某个公式案例做完已经是六面纯色，就不用再反着转了。',
        '情况二：别人递给你一个打乱的魔方，没有任何转动记录。这时不能随便倒着套一个公式，而要看每个小块现在在哪里，一层一层地还原。后面的白十字、白角、中层、顶层各节讲的就是这个过程；每一阶段都要先观察、摆好方向，再用对应的公式。',
      ],
      en: [
        "If you start solved and record R, U, F2, undo with F2, U', R'. Undo the last change first and reverse its direction. A half-turn is its own inverse.",
        'Pattern lessons use this principle. Finish the pattern, choose Learn to undo, then press Next step separately for each move. Choosing undo does not play or reset anything. A solution case that already ends solved needs no further inverse moves.',
        'An unknown scramble has no record to undo. A random inverse algorithm will not solve it. Locate pieces and solve successive layers instead. The following cross, corner, middle-layer and last-layer sections describe that process; recognize and orient the case before using an algorithm.',
      ],
    },
  },
  {
    id: 'recorded-scramble-recovery',
    title: { zh: '完整跟做：把 20 步打乱撤销回来', en: 'Complete exercise: undo a 20-move scramble' },
    body: {
      zh: [
        `本题从六面纯色开始，做了这 20 步：${recoveryScramble}。选择这个案例后，魔方会摆成打乱后的样子，但不会自动执行解答。这是“有记录的打乱”练习，不是拍照识别，也不是能解任意状态的求解器。`,
        '先看看六面展开图。准备好后点一次“下一步”，看提示：转哪个面、从哪个方向看、顺时针还是逆时针。等动画停下，核对已完成的步数，再点下一次。不用赶时间；看错了可以点“退一步”重新观察。',
        '举例：记录的最后一步是 R，所以还原的第一步是 R\'；倒数第二步是 U2，所以还原的第二步还是 U2。就这样一直倒着撤销，直到第 20 步。中途看起来更乱也不要换公式，这是撤销的过程，不保证每一步都会多拼好一面。',
        '最后逐面检查：每个面的九格都和中心同色。演示会停在完成的样子。能跟完这题，说明你懂得怎样撤销记录；接下来要练的是没有记录时，怎样找块、对齐、一层层还原。',
      ],
      en: [
        `This exercise starts solved and records these 20 moves: ${recoveryScramble}. Selecting the case prepares that scramble without playing its answer. It is a recorded-scramble exercise, not a camera recognizer or arbitrary-state solver.`,
        'Inspect all six diagrams. Press Next step once, read which face turns and from which viewing direction, then wait for the animation. Check the completed count before continuing. There is no time limit; Back one lets you inspect a move again.',
        "The last recorded move is R, so the first recovery move is R'. The next-to-last move is U2, so the second recovery move is U2. Continue undoing in reverse order for 20 moves. Intermediate states may look messier; undoing does not necessarily complete another face at each move.",
        'Finally check that all nine stickers on every face match its center. The completed cube stays visible. This teaches undoing a record; the next challenge is finding and placing pieces without that record.',
      ],
    },
    alg: invertAlg(recoveryScramble),
    algNote: { zh: '完整 20 步解答：每次只点一步；终点为六面纯色。', en: 'Complete 20-move answer: one click per move, ending with six solid faces.' },
  },
  {
    id: 'unknown-scramble-roadmap',
    title: { zh: '没有打乱记录时：先检查，再一层层还原', en: 'Without a record: check, then solve layer by layer' },
    body: {
      zh: [
        '准备：用一个没拆装过、没单独扭过角、也没换过贴纸的普通三阶魔方。正常转动打乱的魔方一定能还原；但如果有人把一个棱块单独翻过来、或把一个角块单独扭过，这是装配问题，背再多公式也解决不了。新手如果发现最后只剩一块不对，先检查是不是漏了步骤或换了拿法，不要硬掰。',
        '第一站，白十字：只找四个带白色的两色棱块，每放好一个，检查白色朝下，另一种颜色贴着同色的侧面中心。第二站，白角：找四个带白色的三色角块，放到对应三个中心夹住的位置。检查标准：底面全白，四个侧面最下面一排也各自同色。',
        '第三站，中层：找不带黄色的棱块，先对准前面的中心，再根据另一种颜色决定送到左边还是右边。检查标准：四个侧面的下两排都和中心同色。第四站，黄十字：让四个黄色棱块朝上，暂时不管黄色角块。不要为了找黄色就把白色中心翻到上面。',
        '第五站，先放角：把黄色角块放到对应三个中心夹住的位置，暂时不要求黄色朝上。第六站，再翻角：固定拿法，一个一个把黄色翻到上面，最后对齐顶层。第七站，顶层棱块换位：让侧面也全部同色。每一站检查通过再往下走。后面各节的演示是分别摆好的题目，不是同一个魔方连续做下来，也不能不看实物就把所有公式连着照抄。',
        '卡住时先问自己三个问题：目标块有哪几种颜色？这几种颜色的中心在哪里？目标块现在在顶层、中层还是底层？然后回到对应的章节。一个公式要完整做完再看效果，不要做到一半换拿法或换另一个公式。',
      ],
      en: [
        'Use a normal 3x3 that has not been reassembled, had a single corner twisted, or had stickers moved. Legal turns produce solvable scrambles. Assembly errors such as one flipped edge are not fixed by memorizing more algorithms. First check missed moves and grip mistakes; do not force pieces.',
        'White cross: locate four two-color white edges. Each needs white down and its other color beside the matching center. White corners: place the four three-color white corners between their matching centers. Check a white bottom and matching bottom rows on all sides.',
        'Middle layer: choose edges without yellow, match the front center, then use the other color to choose left or right insertion. Check both lower rows of all side faces. Yellow cross: make the four yellow edges face upwards, ignoring corners for now. Keep white down.',
        'Place yellow corners between their matching centers first, regardless of orientation. Then keep a fixed grip and twist them upwards one at a time before aligning U. Finally position the top edges so the side faces match too. Pass each checkpoint before continuing. The following algorithm examples are separate setups, not one continuous cube across chapters; do not concatenate their algorithms blindly on a physical scramble.',
        'When stuck, identify the target piece’s colors, locate those centers and determine whether the piece is in the top, middle or bottom layer. Return to that section. Finish an entire algorithm before checking its effect; do not regrip or substitute another algorithm halfway through.',
      ],
    },
  },
];
