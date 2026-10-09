import { tileEnglish } from "@/content/guided-tables";
export const mahjongTiles = [...["万", "筒", "条"].flatMap(s => [..."一二三四五六七八九"].map(n => n + s)), "东", "南", "西", "北", "中", "发", "白"];
export const mahjongFlowers = ['梅', '兰', '竹', '菊', '春', '夏', '秋', '冬'];
const flowerEnglish = ['Plum', 'Orchid', 'Bamboo flower tile', 'Chrysanthemum', 'Spring', 'Summer', 'Autumn', 'Winter'];
export default function MahjongTile({ tile, locale = "zh", compact=false, onDark=false }: { tile: string; locale?: "zh" | "en";compact?:boolean;onDark?:boolean }) {
  const index = mahjongTiles.indexOf(tile);
  const flowerIndex = mahjongFlowers.indexOf(tile);
  const label = locale === "zh" ? (tile === "白" ? "白板" : tile) : flowerIndex >= 0 ? flowerEnglish[flowerIndex] : tileEnglish(tile);
  const artwork = flowerIndex >= 0 ? { backgroundImage: "url('/mahjong/flowers-generated-v1.png')", backgroundSize: '400% 200%', backgroundPosition: `${flowerIndex % 4 * 100 / 3}% ${Math.floor(flowerIndex / 4) * 100}%` } : { backgroundImage: "url('/mahjong/tiles-generated-v1.png')", backgroundSize: '900% 400%', backgroundPosition: `${index % 9 * 12.5}% ${Math.floor(index / 9) * 100 / 3}%` };
  const visibleLabel = compact && locale === 'en' ? label.replace('Characters', 'Char.').replace('Bamboo', 'Bam.') : label;
  return <span className={`inline-flex ${compact?(flowerIndex>=0&&locale==='en'?'w-28':'w-11'):'w-[68px]'} shrink-0 flex-col items-center gap-1 align-top`}>
    <span role="img" aria-label={label} className={`block ${compact?'h-[60px] w-10':'h-24 w-16'} rounded-lg`} style={index >= 0 || flowerIndex >= 0 ? artwork : undefined}>{index < 0 && flowerIndex < 0 ? tile : null}</span>
    <span className={`w-full break-words whitespace-normal text-center text-xs leading-4 ${onDark?'text-[#f3e7cd]':'text-[#392616]'}`} title={label}>{visibleLabel}</span>
  </span>;
}
