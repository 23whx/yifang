import {countsOf,decomposeHand,type Meld,type Suit} from './shape';

export type SichuanPattern='basic'|'all-pungs'|'pure-suit'|'terminals'|'seven-pairs'|'pure-pungs'|'jiang-pungs'|'dragon-pairs'|'pure-pairs'|'pure-terminals'|'pure-dragon-pairs';
export const sichuanPatternNames:Record<SichuanPattern,{zh:string;en:string}>={
  basic:{zh:'平胡',en:'Basic hand'},'all-pungs':{zh:'对对胡',en:'All pungs'},'pure-suit':{zh:'清一色',en:'One suit'},
  terminals:{zh:'带幺九',en:'Terminals in every group'},'seven-pairs':{zh:'七对',en:'Seven pairs'},
  'pure-pungs':{zh:'清对',en:'One-suit all pungs'},'jiang-pungs':{zh:'将对',en:'All pungs of 2, 5 and 8'},
  'dragon-pairs':{zh:'龙七对',en:'Seven pairs with a quad'},'pure-pairs':{zh:'清七对',en:'One-suit seven pairs'},
  'pure-terminals':{zh:'清幺九',en:'One-suit terminals'},'pure-dragon-pairs':{zh:'清龙七对',en:'One-suit seven pairs with a quad'},
};
/** Uncapped PATTERN value only, not a payable score or a legal-turn decision.
 * Uses the published pattern ladder noted in mahjong-engine-scope.md. Highest
 * base pattern only; every physical quad adds one doubling, except one quad
 * already consumed by a dragon-pairs base. No Japanese yaku, MCR fans or event
 * bonuses are inferred from a hand. The eventual table preset supplies those. */
export function sichuanPatternValue(hand:readonly number[],melds:readonly Meld[],missing:Suit){
  const shapes=decomposeHand(hand,melds,{variant:'sichuan',missingSuit:missing});
  if(!shapes.length)return null;
  const all=[...hand,...melds.flatMap(m=>m.tiles)],counts=countsOf(all);
  const roots=counts.filter(n=>n===4).length,pure=new Set(all.map(t=>Math.floor(t/9))).size===1;
  const candidates:{pattern:SichuanPattern;baseDoublings:number;roots:number;doublings:number;multiplier:number}[]=[];
  function add(pattern:SichuanPattern,baseDoublings:number,consumed=0){
    const extra=roots-consumed,doublings=baseDoublings+extra;
    candidates.push({pattern,baseDoublings,roots:extra,doublings,multiplier:2**doublings});
  }
  const terminal=(t:number)=>t%9===0||t%9===8;
  for(const shape of shapes){
    if(shape.kind==='seven-pairs'){
      if(roots>0)add(pure?'pure-dragon-pairs':'dragon-pairs',pure?5:4,1);
      else add(pure?'pure-pairs':'seven-pairs',pure?4:2);
    }else if(shape.kind==='standard'){
      add('basic',0);if(pure)add('pure-suit',2);
      if(shape.groups.every(g=>g.kind!=='chow')){
        add(pure?'pure-pungs':'all-pungs',pure?3:1);
        if(all.every(t=>[1,4,7].includes(t%9)))add('jiang-pungs',3);
      }
      if(terminal(shape.pair)&&shape.groups.every(g=>g.tiles.some(terminal)))add(pure?'pure-terminals':'terminals',pure?4:2);
    }
  }
  // Stable tie preference: stronger named base before extra roots.
  candidates.sort((a,b)=>b.doublings-a.doublings||b.baseDoublings-a.baseDoublings||a.pattern.localeCompare(b.pattern));
  return candidates[0];
}
