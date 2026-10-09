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
    title: { zh: '两种还原：撤销记录，不等于会解任意魔方', en: 'Two tasks: undoing a record is not a general solve' },
    body: {
      zh: [
        '情况一：你从六面纯色开始，完整记录了每次转动。例如先 R，再 U，再 F2。倒着做 F2、U\'、R\' 就能回到纯色。为什么倒着？必须先撤销最后发生的改变；为什么加撇？因为原来顺时针，现在要逆时针。半圈的反向还是半圈。',
        '图案课程属于这种情况。完成图案以后，点击“学习反向还原”，再逐次点击“下一步”。这个按钮只展开步骤，不会偷偷播放或瞬间重置。公式还原案例若已经六面纯色，就不用再反着转。',
        '情况二：别人递来一个打乱的魔方，没有任何转动记录。不能随便倒着套一个公式。要根据当前块的位置逐层处理。后面的白十字、白角、中层、顶层课程讲这个过程；每一阶段都要先观察、摆正方向，再使用相应公式。',
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
    title: { zh: '跟做完整案例：从 20 步打乱还原六个面', en: 'Complete exercise: recover a 20-move scramble' },
    body: {
      zh: [
        `本题从六面纯色执行了这 20 步：${recoveryScramble}。选择案例后会摆出这个打乱结果，不会执行解答。它是有记录的打乱练习，不是拍照识别或任意状态求解器。`,
        '先观察六面展开图。准备好后点一次“下一步”，看右侧提示确定转动哪个面、从哪个方向看、顺时针还是逆时针。等动画停住，核对已执行数量，再点下一次。不需要赶时间；看错了可退一步重新观察。',
        '例如记录的最后一步是 R，所以还原第一步是 R\'；记录的倒数第二步是 U2，所以还原第二步仍是 U2。一直这样倒着撤销，直到第 20 步。中途看起来更乱也不要换公式，这是撤销过程，不保证每一步都会多拼好一面。',
        '最后逐面检查：每面九格都与本面中心同色。演示停在完成品上。能跟完这题说明你懂得撤销记录；接下来还要练习没有记录时怎样找块、对齐和逐层还原。',
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
    title: { zh: '没有打乱记录时：先检查，再逐层还原', en: 'Without a scramble record: inspect, then solve layers' },
    body: {
      zh: [
        '准备：用没有拆装、单独扭角或换贴纸的普通三阶魔方。正常转动产生的打乱可以还原；单独翻转一个棱块、扭转一个角块等装配错误不是多背公式能修好的。初学者发现只剩异常的一块时，先检查漏步和拿法，不要硬掰。',
        '第一站白十字：只找四个带白色的两色棱块。每放好一个，检查白色朝下，并且另一色贴着同色侧面中心。第二站白角：找四个带白色的三色角块，放入三个中心共同确定的位置。验收底面全白，侧面底下一排也分别同色。',
        '第三站中层：找没有黄色的棱块，匹配前面中心，再根据另一色决定送往左边或右边。验收四个侧面的下面两排都与中心同色。第四站黄色十字：让四个黄色棱块朝上，暂时不管黄色角块。不要为了追黄色把白中心转到上面。',
        '第五站先放角：把黄色角块放到三个中心确定的位置，暂不要求黄色朝上。第六站再翻角：固定拿法，逐个把黄色翻上来，最后对齐顶层。第七站顶层棱块换位：让侧面也全部同色。每站只在验收通过后继续；后面的章节提供对应的公式练习。演示案例分别摆题，不是一颗魔方跨章节连续执行，也不能不看实体局面就连续照抄全部公式。',
        '卡住时先回答三个问题：目标块有哪几种颜色？这几种颜色的中心在哪里？目标块现在在顶层、中层还是底层？然后回到对应章节。公式做完整以后再判断效果，不在半条公式中途切换拿法或换另一条公式。',
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
