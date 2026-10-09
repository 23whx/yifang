import { invertAlg } from "@/lib/cube/alg";

interface Localized {
  zh: string;
  en: string;
}

export interface CubePuzzle {
  id: string;
  title: Localized;
  hint: Localized;
  /** 从复原态施加此公式得到题面 */
  setup: string;
  /** 一条参考解法 */
  solution: string;
}

/** 单公式残局：题面 = 公式的逆，解 = 公式本身 */
function fromAlg(id: string, title: Localized, hint: Localized, alg: string): CubePuzzle {
  return { id, title, hint, setup: invertAlg(alg), solution: alg };
}

export const cubePuzzles: CubePuzzle[] = [
  fromAlg("sexy", { zh: "四步", en: "Four moves" }, { zh: "只动了右面和顶面。", en: "Only the right and top faces moved." }, "R U R' U'"),
  fromAlg("sune", { zh: "小鱼", en: "The fish" }, { zh: "本页白中心朝上、绿中心朝前。角块是有三种颜色的小块；顶面四个角中只有一个白色朝上，其余三个的白色朝侧面。目标是转动整层，让这些白色也朝上，不是拆下或单独拧角块。", en: "This page starts with the white center up and green center in front. A corner is a small piece with three colors. Only one of the four top corners has white facing up; the other three have white facing sideways. Turn whole layers to bring those white stickers up—do not remove or twist individual pieces." }, "R U R' U R U2 R'"),
  fromAlg("ua", { zh: "三棱循环", en: "Three-edge cycle" }, { zh: "顶层三个棱块循环错位，一个棱块正确。", en: "Three top edges cycled, one edge correct." }, "R U' R U R U R U' R' U' R2"),
  fromAlg("tperm", { zh: "T-perm", en: "T-perm" }, { zh: "T-perm 是这条换位公式的名称。角块有三种颜色，棱块有两种颜色。本题顶层两个相邻角块交换了位置，两个相对棱块也交换了位置；顶面同色仍不算完成，还要让侧面颜色与中心相配。", en: "T-perm is the name of this swapping sequence. Corners have three colors; edges have two. In this position, two neighboring top corners have exchanged places, as have two opposite top edges. A single-color top is not enough: the side colors must also match their centers." }, "R U R' U' R' F R2 U' R' U' R U R' F'"),
  {
    id: "checkerboard",
    title: { zh: "棋盘格", en: "Checkerboard" },
    hint: { zh: "六个面各转 180°。", en: "Half-turn all six faces." },
    setup: "U2 D2 F2 B2 L2 R2",
    solution: "U2 D2 F2 B2 L2 R2",
  },
  fromAlg("cube-in-cube", { zh: "盒中盒", en: "Cube in a cube" }, { zh: "15 步图案，找到那个小方块所在的角。", en: "A 15-move pattern; find the corner holding the small cube." }, "F L F U' R U F2 L2 U' L' B D' B' L2 U"),
];
