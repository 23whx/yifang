import type {McrStructureTile,McrSuitedTile,McrDeclaredMeld} from 'miaoda-game-mcr-mahjong-analysis-core';
import {analyzeMcrHandResearch as analyzeMcrHand} from './vendor/analysis/hand-analysis-research';
import {decomposeHand,type Meld} from './shape';
import {isMcrFlower} from './mcr-setup';
import {mcrSettlement} from './mcr-settlement';
import {scoreDeclaredKnitted} from './mcr-knitted';

export type McrScoreInput={
  concealedBeforeWin:readonly number[];melds:readonly Meld[];winningTile:number;
  winner:number;from:number;roundWind:0|1|2|3;seatWind:0|1|2|3;
  source:'wall'|'discard'|'kong-replacement'|'flower-replacement'|'robbed-kong';
  flowers:readonly number[];lastWallEvent:boolean;lastCopy:boolean;
};
export function mcrTileFace(tile:number):McrStructureTile{
  if(!Number.isInteger(tile)||tile<0||tile>33)throw new Error('Invalid structure tile');
  return (tile<27?`${tile%9+1}${['m','p','s'][Math.floor(tile/9)]}`:['E','S','W','N','C','F','P'][tile-27]) as McrStructureTile;
}
/** Host-only: derive source/winds/last-copy flags from actual round history.
 * No guest is allowed to supply this object. An unsupported path stays an error,
 * not an invented basic hand. Pin the scorer and regression-test before updates. */
export function scoreMcrHand(input:McrScoreInput){
  const seat=(n:number)=>Number.isInteger(n)&&n>=0&&n<4;
  if(!seat(input.winner)||!seat(input.from)||!seat(input.roundWind)||!seat(input.seatWind))throw new Error('Invalid MCR seat/wind');
  if(!['wall','discard','kong-replacement','flower-replacement','robbed-kong'].includes(input.source)||typeof input.lastWallEvent!=='boolean'||typeof input.lastCopy!=='boolean'||(input.lastWallEvent&&!['wall','discard'].includes(input.source)))throw new Error('Invalid MCR event');
  const selfDraw=['wall','kong-replacement','flower-replacement'].includes(input.source);
  if(selfDraw?input.winner!==input.from:input.winner===input.from)throw new Error('Invalid MCR winning source');
  if(input.flowers.some(t=>!isMcrFlower(t))||new Set(input.flowers).size!==input.flowers.length)throw new Error('Invalid exposed flowers');
  // Shared validator rejects malformed groups and physical fifth copies.
  const shapes=decomposeHand([...input.concealedBeforeWin,input.winningTile],input.melds,{variant:'mcr'});
  if(!shapes.length)return {ok:false as const,reason:'not-winning' as const};
  const declaredMelds:McrDeclaredMeld[]=input.melds.map(m=>{
    if(m.kind==='kong')return {kind:'kong',tile:mcrTileFace(m.tiles[0]),exposure:m.open?'melded':'concealed'};
    if(m.kind==='pung')return {kind:'triplet',tile:mcrTileFace(m.tiles[0])};
    const tiles=[...m.tiles].sort((a,b)=>a-b).map(t=>mcrTileFace(t) as McrSuitedTile);
    return {kind:'sequence',tiles:[tiles[0],tiles[1],tiles[2]]};
  });
  const winds=['E','S','W','N'] as const;
  const result=analyzeMcrHand({concealedTilesBeforeWin:input.concealedBeforeWin.map(mcrTileFace),winningTile:mcrTileFace(input.winningTile),declaredMelds,
    roundWind:winds[input.roundWind],seatWind:winds[input.seatWind],event:{source:input.source,lastWallEvent:input.lastWallEvent,lastCopy:input.lastCopy,flowerCount:input.flowers.length}});
  // A structurally valid hand rejected as non-winning by this dependency is a
  // coverage discrepancy, not evidence that the player's hand is malformed.
  const knitted=scoreDeclaredKnitted(input);
  if(!result.ok&&!knitted)return {ok:false as const,reason:result.reason==='not-winning'?'unsupported' as const:result.reason};
  const selected=structuredClone(result.ok&&(!knitted||result.analysis.total>=knitted.total)?result.analysis:knitted!);
  const analysis={...selected,fanCodes:[...new Set(selected.fanCodes)]},settlement=mcrSettlement({kind:'win',winner:input.winner,from:input.from,selfDraw,nonFlowerPoints:analysis.nonFlowerTotal,flowers:input.flowers});
  if(!settlement.eligible||analysis.total!==settlement.totalPoints)throw new Error('MCR scorer/settlement disagreement');
  return {ok:true as const,analysis,settlement};
}
