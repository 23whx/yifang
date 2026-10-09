import type {McrStructureTile} from 'miaoda-game-mcr-mahjong-analysis-core';
import {analyzeMcrHandResearch as upstream} from './vendor/analysis/hand-analysis-research';
import {scoreMcrHand} from './mcr-score';
import type {Meld} from './shape';

function kind(face:McrStructureTile){
  const honor=['E','S','W','N','C','F','P'].indexOf(face);if(honor>=0)return 27+honor;
  const suit=['m','p','s'].indexOf(face.slice(-1));return suit*9+Number(face[0])-1;
}
/** Durable rules-runtime hook. Inputs are constructed by the host engine, not
 * wire data. Keep the upstream result contract and corrected analysis identical
 * for legal-action generation, claim validation and final settlement. */
export const analyzeMcrHand:typeof upstream=input=>{
  const raw=upstream(input);
  const original=raw.ok?{...raw,analysis:{...raw.analysis,fanCodes:[...new Set(raw.analysis.fanCodes)]}}:raw;
  if(!Array.isArray(input.concealedTilesBeforeWin)||input.declaredMelds?.length!==1)return original;
  const d=input.declaredMelds[0];if(typeof d==='string'||!('kind' in d))return original;
  let meld:Meld;
  if(d.kind==='sequence')meld={kind:'chow',tiles:d.tiles.map(kind),open:true};
  else if(d.kind==='triplet')meld={kind:'pung',tiles:Array(3).fill(kind(d.tile)),open:true};
  else if(d.kind==='kong')meld={kind:'kong',tiles:Array(4).fill(kind(d.tile)),open:d.exposure==='melded'};
  else return original;
  const winds=['E','S','W','N'] as const,source=input.event.source;
  const selfDraw=['wall','flower-replacement','kong-replacement'].includes(source);
  const corrected=scoreMcrHand({concealedBeforeWin:input.concealedTilesBeforeWin.map(kind),winningTile:kind(input.winningTile),melds:[meld],winner:0,from:selfDraw?0:1,
    roundWind:winds.indexOf(input.roundWind) as 0|1|2|3,seatWind:winds.indexOf(input.seatWind) as 0|1|2|3,source,
    flowers:Array.from({length:input.event.flowerCount??0},(_,i)=>34+i),lastWallEvent:input.event.lastWallEvent??false,lastCopy:input.event.lastCopy??false});
  return corrected.ok?{ruleset:'mcr',schemaVersion:1,ok:true,analysis:corrected.analysis}:original;
};
