interface Localized {
  zh: string;
  en: string;
}

export interface GlossaryEntry {
  id: string;
  term: Localized;
  /** 另一种语言里的对应叫法，方便查外文资料 */
  alias?: string;
  def: Localized;
  /** 可在魔方上演示 */
  alg?: string;
}

export const cubeGlossary: GlossaryEntry[] = [
  { id: "center", term: { zh: "中心块", en: "Center" }, alias: "center", def: { zh: "每面正中的一块，单色。六个中心块彼此位置固定，决定每个面的目标颜色。", en: "The single-coloured piece in the middle of each face. The six centers never move relative to each other and define each face's target colour." } },
  { id: "edge", term: { zh: "棱块", en: "Edge" }, alias: "edge", def: { zh: "两种颜色的块，共 12 个，位于两个面的交界。", en: "A two-coloured piece on the border between two faces; there are 12." } },
  { id: "corner", term: { zh: "角块", en: "Corner" }, alias: "corner", def: { zh: "三种颜色的块，共 8 个，位于三个面的交点。", en: "A three-coloured piece where three faces meet; there are 8." } },
  { id: "notation", term: { zh: "转动符号", en: "Notation" }, alias: "notation", def: { zh: "用 U D L R F B 表示六个面的顺时针 90° 转动，后缀 ' 表示逆时针，2 表示 180°。小写字母表示双层，x y z 表示整体转动。", en: "U D L R F B denote 90° clockwise turns of the six faces; ' means counter-clockwise, 2 means 180°. Lowercase letters turn two layers; x y z rotate the whole cube." } },
  { id: "algorithm", term: { zh: "公式", en: "Algorithm" }, alias: "alg", def: { zh: "一串固定的转动，用来在不破坏已还原部分的前提下改变特定几块的位置或方向。", en: "A fixed sequence of turns that changes specific pieces without disturbing what's already solved." } },
  { id: "trigger", term: { zh: "短语 / 触发", en: "Trigger" }, alias: "trigger", def: { zh: "公式中反复出现的短片段，如 R U R' U'。把公式拆成短语更容易记忆和加速。", en: "A short recurring fragment inside algorithms, such as R U R' U'. Chunking algorithms into triggers makes them easier to learn and faster to execute." }, alg: "R U R' U'" },
  { id: "sexy", term: { zh: "Sexy move", en: "Sexy move" }, def: { zh: "R U R' U' 的社区俗称，最常用的四步短语，重复 6 次回到原状。", en: "Community name for R U R' U', the most common four-move trigger; six repetitions return to start." }, alg: "R U R' U'" },
  { id: "sledge", term: { zh: "Sledgehammer", en: "Sledgehammer" }, def: { zh: "R' F R F'，另一条高频四步短语。", en: "R' F R F', another high-frequency four-move trigger." }, alg: "R' F R F'" },
  { id: "sune", term: { zh: "小鱼 / Sune", en: "Sune" }, def: { zh: "R U R' U R U2 R'。翻转顶层三个角块的朝向，因顶面形状像鱼得名。", en: "R U R' U R U2 R'. Twists three top corners; named for the fish-like shape on top." }, alg: "R U R' U R U2 R'" },
  { id: "lbl", term: { zh: "层先法", en: "Layer by Layer" }, alias: "LBL", def: { zh: "新手方法：依次还原底层、中层、顶层，约 7 个公式。", en: "The beginner's method: solve the bottom, middle and top layers in turn with about 7 algorithms." } },
  { id: "cfop", term: { zh: "CFOP", en: "CFOP" }, alias: "Fridrich", def: { zh: "Cross、F2L、OLL、PLL 四个阶段的缩写，速拧主流方法，由 Jessica Fridrich 推广。", en: "Cross, F2L, OLL, PLL — the mainstream speedsolving method, popularised by Jessica Fridrich." } },
  { id: "cross", term: { zh: "十字", en: "Cross" }, def: { zh: "CFOP 第一步：把底层四个棱块归位，形成十字。任何状态都能在 8 步内完成。", en: "First step of CFOP: place the four bottom edges to form a cross. Always possible in 8 moves or fewer." } },
  { id: "f2l", term: { zh: "F2L", en: "F2L" }, alias: "First Two Layers", def: { zh: "前两层。把角块与其上方棱块配对后一起插入，共 4 个槽。", en: "First Two Layers: pair each corner with the edge above it and insert together; four slots." }, alg: "R U R'" },
  { id: "oll", term: { zh: "OLL", en: "OLL" }, alias: "Orientation of the Last Layer", def: { zh: "顶层朝向：让顶面全部变成同色，共 57 种情况；两步版本只需约 7 个公式。", en: "Orient the last layer so the top face is one colour: 57 cases, or about 7 algorithms in the two-look version." } },
  { id: "pll", term: { zh: "PLL", en: "PLL" }, alias: "Permutation of the Last Layer", def: { zh: "顶层置换：在朝向正确的前提下把顶层各块换到正确位置，共 21 种。", en: "Permute the last layer's pieces into place once oriented: 21 cases." }, alg: "R U R' U' R' F R2 U' R' U' R U R' F'" },
  { id: "auf", term: { zh: "AUF", en: "AUF" }, alias: "Adjust U Face", def: { zh: "在公式前后转动顶层以对齐的 U / U' / U2。", en: "The U, U' or U2 before or after an algorithm that aligns the top layer." } },
  { id: "lookahead", term: { zh: "预判", en: "Lookahead" }, def: { zh: "执行当前步骤时提前观察下一步要处理的块，是减少停顿、提高速度的核心技能。", en: "Tracking the pieces for the next step while executing the current one; the core skill for eliminating pauses." } },
  { id: "fingertricks", term: { zh: "手指技巧", en: "Finger tricks" }, def: { zh: "用单个手指拨动而非整只手转动魔方的技术，是速拧提速的基础。", en: "Turning layers with individual finger flicks instead of wrist turns; the basis of speedsolving." } },
  { id: "inspection", term: { zh: "观察时间", en: "Inspection" }, def: { zh: "WCA 比赛中开始计时前的 15 秒，可以观察但不能转动。", en: "The 15 seconds before the timer starts in WCA competition; you may look but not turn." } },
  { id: "dnf", term: { zh: "DNF", en: "DNF" }, alias: "Did Not Finish", def: { zh: "该次成绩无效，如停表时未还原或超时。", en: "The attempt doesn't count — for example, stopping the timer unsolved or exceeding the time limit." } },
  { id: "ao5", term: { zh: "Ao5", en: "Ao5" }, alias: "Average of 5", def: { zh: "五次成绩去掉最好和最差，取剩余三次的平均，是 WCA 的标准排名方式。", en: "Drop the best and worst of five attempts and average the rest — the standard WCA ranking format." } },
  { id: "gods-number", term: { zh: "上帝之数", en: "God's Number" }, def: { zh: "任何三阶魔方状态都能在 20 步（面转计）以内还原，2010 年经计算证明。", en: "Any 3x3 position can be solved in 20 face turns or fewer, proven by computation in 2010." } },
  { id: "superflip", term: { zh: "Superflip", en: "Superflip" }, def: { zh: "所有棱块原位翻转的状态，需要恰好 20 步，是最早被证明达到上帝之数的位置。", en: "Every edge in place but flipped; needs exactly 20 moves and was the first position proven to reach God's Number." }, alg: "U R2 F B R B2 R U2 L B2 R U' D' R2 F R' L B2 U2 F2" },
  { id: "parity", term: { zh: "奇偶性", en: "Parity" }, def: { zh: "三阶魔方中不可能只翻转一个棱块或只交换两个块——这类状态只能通过拆装得到。", en: "On a 3x3 it's impossible to flip a single edge or swap just two pieces; such states only arise from reassembling the cube." } },
  { id: "wca", term: { zh: "WCA", en: "WCA" }, alias: "World Cube Association", def: { zh: "世界魔方协会，2004 年成立，制定比赛规则并保存全球成绩。", en: "The World Cube Association, founded in 2004, governs competition rules and keeps world results." } },
];
