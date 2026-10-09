import {getMcrFanDefinition,type McrHandAnalysis} from 'miaoda-game-mcr-mahjong-analysis-core';
import {countsOf,decomposeHand,structuralWaits} from './shape';
import {mcrTileFace,type McrScoreInput} from './mcr-score';

/** Missing upstream path: nine concealed knitted tiles + pair + ONE declared
 * chow/pung/kong. The knitted nine must never be treated as ordinary chows.
 * This helper deliberately does not replace closed-hand candidate enumeration. */
export function scoreDeclaredKnitted(input:McrScoreInput):McrHandAnalysis|null{
  if(input.melds.length!==1)return null;
  const shapes=decomposeHand([...input.concealedBeforeWin,input.winningTile],input.melds,{variant:'mcr'}).filter(s=>s.kind==='knitted-straight');
  if(!shapes.length)return null;
  const candidates:McrHandAnalysis[]=[];
  for(const shape of shapes){
    if(shape.kind!=='knitted-straight')continue;
    const meld=input.melds[0],all=[...input.concealedBeforeWin,input.winningTile,...meld.tiles],tile=meld.tiles[0];
    const fans=new Set<number>([35]);
    if(meld.kind==='chow'&&shape.pair<27)fans.add(63);
    if(all.every(t=>t<27))fans.add(76);
    if(all.some(t=>t>=27&&t<=30)&&all.some(t=>t>=31))fans.add(52);
    if(meld.kind!=='chow'){
      if(tile>=31)fans.add(59);
      else if(tile>=27){if(tile===27+input.roundWind)fans.add(60);if(tile===27+input.seatWind)fans.add(61);if(!fans.has(60)&&!fans.has(61))fans.add(73);}
      else if(tile%9===0||tile%9===8)fans.add(73);
    }
    if(meld.kind==='kong')fans.add(meld.open?74:67);
    const counts=countsOf(all);
    if(counts.some((n,t)=>n===4&&!(meld.kind==='kong'&&t===tile)))fans.add(64);
    const selfDraw=['wall','flower-replacement','kong-replacement'].includes(input.source);
    if(!meld.open)fans.add(selfDraw?56:62);
    if(selfDraw)fans.add(80);
    if(input.source==='kong-replacement')fans.add(46);
    if(input.source==='robbed-kong')fans.add(47);
    if(input.lastWallEvent)fans.add(selfDraw?44:45);
    if(input.lastCopy)fans.add(58);
    const waits=structuralWaits(input.concealedBeforeWin,input.melds,{variant:'mcr'});
    if(shape.pair===input.winningTile&&waits.length===1)fans.add(79);
    // Containing patterns exclude their lower facts; Fully Concealed includes
    // self-draw even though the upstream catalog omits that intrinsic exclusion.
    const removed=new Map<number,number[]>();
    const code=(n:number)=>`mcr-${String(n).padStart(2,'0')}` as const;
    for(const n of fans){
      const excludes=getMcrFanDefinition(code(n))!.explicitlyExcludes.map(c=>Number(c.slice(4)));
      if(n===56)excludes.push(62,80);
      for(const lower of excludes)if(fans.has(lower))removed.set(lower,[...(removed.get(lower)??[]),n]);
    }
    const kept=[...fans].filter(n=>!removed.has(n)).sort((a,b)=>a-b);
    const occurrences:McrHandAnalysis['occurrences'][number][]=kept.map(n=>{const d=getMcrFanDefinition(code(n))!;return {key:`declared-knitted:${d.code}`,fanCode:d.code,name:d.name,points:d.points,source:'special' as const,matchedGroups:[],matchedTiles:n===35?shape.knitted.map(mcrTileFace):[]};});
    const nonFlowerTotal=occurrences.reduce((sum,o)=>sum+o.points,0);
    for(const flower of input.flowers){const d=getMcrFanDefinition('mcr-81')!;occurrences.push({key:`flower:${flower}`,fanCode:d.code,name:d.name,points:1,source:'flower',matchedGroups:[],matchedTiles:[]});}
    candidates.push({handKind:'special',fanCodes:[...new Set(occurrences.map(o=>o.fanCode))],nonFlowerTotal,flowerPoints:input.flowers.length,total:nonFlowerTotal+input.flowers.length,occurrences,
      exclusions:[...removed].map(([n,causes])=>({fanCode:code(n),name:getMcrFanDefinition(code(n))!.name,excludedBy:causes.map(c=>({fanCode:code(c),name:getMcrFanDefinition(code(c))!.name}))}))});
  }
  return candidates.sort((a,b)=>b.total-a.total)[0]??null;
}
