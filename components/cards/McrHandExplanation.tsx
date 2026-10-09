import type {McrHandAnalysis} from 'miaoda-game-mcr-mahjong-analysis-core';
import MahjongTile from './MahjongTile';
import {tileNames} from '@/lib/mahjong/shape';
import {mcrFanLabel} from '@/content/mcr-fan-labels';
import {mcrFanHelp} from '@/content/mcr-fan-help';
import McrFanExample from './McrFanExample';
const name=(face:string)=>{
  const honor=['E','S','W','N','C','F','P'].indexOf(face);
  return honor>=0?tileNames[27+honor]:tileNames[['m','p','s'].indexOf(face[1])*9+Number(face[0])-1]??face;
};
export default function McrHandExplanation({analysis:a,locale}:{analysis:McrHandAnalysis;locale:'zh'|'en'}){
  const zh=locale==='zh';
  return <section className="space-y-4">
    <h3 className="text-lg font-bold">{zh?'把和牌拆开看':'See how the winning hand fits together'}</h3>
    <p className="max-w-prose leading-8">{zh?'先认识计分用词：“幺九”指数字 1 和 9；“字牌”指东南西北和中发白；“花色”指万、筒、条，不是花牌。番种是得分特征，只有规则允许组合的项目才能相加。':'Scoring vocabulary: chow means sequence; pung means triplet; kong means four identical tiles declared as a set. Terminals are 1 and 9; honors are winds and dragons. Suit means characters, dots or bamboo, not flower tiles. A fan is a scoring feature; only compatible features can be added.'}</p>
    {a.handKind==='ordinary'?<>
      <p className="max-w-prose leading-8">{zh?'下面是引擎用于本次计分的一种分组。顺子是同一种数字牌连续三个数；刻子是三张相同；杠是四张相同；对子是两张相同。普通和牌要有四组顺子、刻子或杠，再加一个对子，不是随便凑十四张就行。':'These are the groups used for this score. A sequence is three consecutive numbers in one suit; a triplet is three identical tiles; a kong is four identical tiles; a pair is two identical tiles. An ordinary win needs four sets and a pair, not simply any fourteen tiles.'}</p>
      <div className="flex flex-wrap gap-4">{a.groups.map(({index,group:g})=>{
        const faces=g.kind==='sequence'?g.tiles:Array.from({length:g.kind==='pair'?2:g.kind==='kong'?4:3},()=>g.tile);
        const title=({sequence:zh?'顺子':'Sequence',triplet:zh?'刻子':'Triplet',kong:zh?'杠':'Kong',pair:zh?'对子':'Pair'})[g.kind];
        return <div className="space-y-2 rounded border border-[#ae8550] bg-[#fff8e8] p-3" key={index}><h4 className="font-bold">{title}</h4><div className="flex flex-wrap gap-1">{faces.map((f,i)=><MahjongTile key={i} tile={name(f)} locale={locale} compact/>)}</div></div>;
      })}</div>
    </>:<p className="leading-8">{zh?'这是特殊和牌形，不按普通的“四组加一对”解释。下方只展示每项得分记录明确关联的牌；没有图案的项目不代表没有得分，可能由摸牌方式等条件产生。':'This is a special winning shape, not the ordinary four-sets-and-a-pair pattern. Below we show only tiles explicitly linked to each scoring entry. An entry without tile pictures can come from a condition such as how the final tile was drawn.'}</p>}
    <p className="leading-7">{zh?'逐项计分（同一张牌可能与多个得分特征有关，重复出现不表示多了一张牌）：':'Scoring entries (a tile may illustrate more than one feature; repeated pictures do not add tiles to the hand):'}</p>
    {a.fanCodes.filter(code=>mcrFanHelp[code]).map(code=><McrFanExample key={code} code={code} locale={locale}/>)}
    <ul className="space-y-4">{a.occurrences.map(o=><li key={o.key} className="space-y-2"><p>{mcrFanLabel(o.fanCode,o.name,locale)} · {o.points} {zh?'分':o.points===1?'point':'points'}</p>{o.matchedTiles.length>0?<div className="flex flex-wrap gap-1">{o.matchedTiles.map((f,i)=><MahjongTile key={i} tile={name(f)} locale={locale} compact/>)}</div>:<p className="text-sm">{o.fanCode==='mcr-81'?(zh?'这 1 分来自赢家已亮出的花牌；每张真实花牌的图案与加分列在下方结算说明中，花分不用于凑够八分起和。':'This point comes from an exposed flower. The actual flower images and +1 for each appear in the payment explanation below; flowers do not meet the eight-point minimum.'):(zh?'此项没有单独的牌图匹配记录；请结合牌型或和牌方式理解，不要把空白当成零分。':'No individual tile illustration was supplied for this entry. It may describe the whole hand or winning circumstances; no picture does not mean zero points.')}</p>}</li>)}</ul>
    {a.exclusions.length>0&&<aside className="space-y-2 border-l-4 border-[#ae8550] pl-4"><h4 className="font-bold">{zh?'这些项目为什么没有再加分？':'Why were these entries not added?'}</h4><p className="leading-8">{zh?'某些大牌型已经包含了小牌型的特点，规则不允许把包含的部分再算一遍。以下列出引擎本次排除的项目；它们不再加入上面的合计。':'Some larger patterns already include smaller features. The rules exclude those overlapping points. These are the entries excluded by this analysis; do not add them to the total again.'}</p><ul className="space-y-2">{a.exclusions.map((e,i)=><li key={`${e.fanCode}-${i}`}>{mcrFanLabel(e.fanCode,e.name,locale)} — {zh?'因以下项目不再计分：':'not added because of: '}{e.excludedBy.map(x=>mcrFanLabel(x.fanCode,x.name,locale)).join(zh?'、':', ')}</li>)}</ul></aside>}
  </section>;
}
