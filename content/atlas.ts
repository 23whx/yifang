import type { GameSlug } from "./games";
/** Anchors calibrated against the illustrated coastlines (percentage of artwork).
 * This hand-painted atlas is not an equirectangular GIS tile: do not project
 * longitude linearly onto it. Geographic coordinates below document the region.
 */
export const atlasPins: Record<GameSlug, [number, number]> = {
  cube: [55.5, 53],
  chess: [75, 76],
  xiangqi: [83, 57],
  shogi: [92.5, 55],
  go: [81, 54],
  mahjong: [85, 63],
  holdem: [24, 64],
  baccarat: [50, 53],
};
export interface AtlasSite {
  game: GameSlug;
  lon: number;
  lat: number;
  x: number;
  y: number;
  title: [string, string];
  origin: [string, string];
  note: [string, string];
  sprite: number;
}
export const atlasSites: AtlasSite[] = [
  {
    game: "cube",
    lon: 19,
    lat: 47.5,
    x: 55,
    y: 32,
    sprite: 0,
    title: ["魔方工坊", "Cube Workshop"],
    origin: ["匈牙利 · 布达佩斯", "Budapest · Hungary"],
    note: [
      "1974 年，厄尔诺·鲁比克在布达佩斯发明魔方。",
      "Ernő Rubik invented the cube in Budapest in 1974.",
    ],
  },
  {
    game: "chess",
    lon: 78,
    lat: 25,
    x: 67,
    y: 74,
    sprite: 1,
    title: ["象棋王国", "Chess Kingdom"],
    origin: ["印度 · 早期源流", "India · Early roots"],
    note: [
      "早期源流一般追溯至印度恰图兰卡；现代规则后来在欧洲形成。坐标表示地区，并非确证的发明地点。",
      "Early roots are traced to Indian chaturanga; modern rules developed in Europe. The pin represents a region, not a proven invention site.",
    ],
  },
  {
    game: "xiangqi",
    lon: 114,
    lat: 34,
    x: 77,
    y: 49,
    sprite: 2,
    title: ["楚汉城寨", "Xiangqi Citadel"],
    origin: ["中国 · 中原", "Central China"],
    note: [
      "象棋在中国长期演变，宋代已接近现代形制；具体发明者与地点并无定论。",
      "Xiangqi evolved in China, approaching its modern form in the Song period. Its precise birthplace remains uncertain.",
    ],
  },
  {
    game: "shogi",
    lon: 135.8,
    lat: 35,
    x: 91,
    y: 50,
    sprite: 3,
    title: ["将棋御城", "Shogi Castle"],
    origin: ["日本", "Japan"],
    note: [
      "将棋在日本发展成形。持驹与打入让被吃的棋子重新加入战场。",
      "Shogi developed in Japan. Captured pieces return to play through drops.",
    ],
  },
  {
    game: "go",
    lon: 110,
    lat: 35,
    x: 69,
    y: 32,
    sprite: 4,
    title: ["黑白山亭", "Go Sanctuary"],
    origin: ["中国 · 古代源流", "Ancient China"],
    note: [
      "围棋起源于古代中国；尧造围棋属于传说。标记表示中国地区，而非某座确证的发源城市。",
      "Go originated in ancient China. The Emperor Yao story is a legend; this pin represents a region rather than a specific city.",
    ],
  },
  {
    game: "mahjong",
    lon: 121.5,
    lat: 29.9,
    x: 84,
    y: 78,
    sprite: 5,
    title: ["四风茶馆", "Four Winds Teahouse"],
    origin: ["中国 · 江南", "Jiangnan · China"],
    note: [
      "现代麻将在十九世纪中国江南发展，常与宁波关联；各地规则存在差异。",
      "Modern mahjong developed in nineteenth-century Jiangnan, often associated with Ningbo. Regional rules differ.",
    ],
  },
  {
    game: "holdem",
    lon: -97.7,
    lat: 27.8,
    x: 25,
    y: 61,
    sprite: 6,
    title: ["西部纸牌酒馆", "Frontier Card Tavern"],
    origin: ["美国 · 得克萨斯州", "Texas · United States"],
    note: [
      "德州扑克通常被认为源于二十世纪初的得克萨斯州。本站提供规则与牌型练习。",
      "Hold’em is generally associated with early twentieth-century Texas. Explore rules and hand-reading practice.",
    ],
  },
  {
    game: "baccarat",
    lon: 2.35,
    lat: 48.8,
    x: 44,
    y: 59,
    sprite: 7,
    title: ["纸牌庄园", "Baccarat Manor"],
    origin: ["欧洲 · 法国／意大利源流", "Europe · French / Italian roots"],
    note: [
      "早期历史存在争议，常与法国、意大利关联；此处表示欧洲源流，非现代 Punto Banco 的定型地。",
      "Early history is disputed and associated with France and Italy. This marks European roots, not the birthplace of modern Punto Banco.",
    ],
  },
];
