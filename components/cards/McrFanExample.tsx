import {mcrFanHelp} from '@/content/mcr-fan-help';
import MahjongTile from './MahjongTile';

export default function McrFanExample({code,locale}:{code:string;locale:'zh'|'en'}){
  const help=mcrFanHelp[code];
  if(!help)return null;
  return <aside className="space-y-2 border-l-4 border-[#ae8550] pl-4">
    <p className="leading-8">{help[locale]}</p>
    <p className="text-sm">{locale==='zh'?'教学示例牌（不是你本局的手牌；上文说明展示的是完整牌例还是局部形状）：':'Teaching example (not your actual tiles; the explanation above identifies a complete hand or a partial shape):'}</p>
    {help.completingTile&&<p className="font-bold">{locale==='zh'?'已经有：':'Already holding:'}</p>}
    <div className="flex flex-wrap gap-1">{help.tiles.map((tile,i)=><MahjongTile key={i} tile={tile} locale={locale} compact/>)}</div>
    {help.completingTile&&<div className="space-y-2"><p className="font-bold">{locale==='zh'?'还缺这一张：':'Missing tile:'}</p><MahjongTile tile={help.completingTile} locale={locale} compact/></div>}
  </aside>;
}
