import {countsOf,decomposeHand,tileNames} from './shape';
import {sichuanPatternValue,sichuanPatternNames} from './sichuan-patterns';
import {sichuanTableRules} from '../../content/sichuan-table';
import type {SichuanView} from './sichuan-teaching';

const patternHelp:Record<keyof typeof sichuanPatternNames,{zh:string;en:string}>={
  basic:{zh:'平胡是普通的四组加一对，没有更高的基本牌型。',en:'A basic hand has four groups and a pair, with no higher base pattern.'},
  'all-pungs':{zh:'对对胡：四组都是三张相同的刻子或四张相同的杠，再加一对。',en:'All pungs: every group is three identical tiles (a triplet) or four identical tiles (a kong), plus a pair.'},
  'pure-suit':{zh:'清一色：全部牌都属于万、筒、条中的同一种。',en:'One suit: every tile belongs to the same numbered family: characters, dots or bamboo.'},
  terminals:{zh:'带幺九：每一组和对子都包含数字一或九；幺就是一。',en:'Terminals are the numbers one and nine. Every group and the pair contains a one or a nine.'},
  'seven-pairs':{zh:'七对：十四张牌分成七个对子，每对是两张相同的牌。',en:'Seven pairs: fourteen tiles arranged as seven pairs of identical tiles.'},
  'pure-pungs':{zh:'清对：全部牌属于同一种花色，而且四组都是刻子或杠，再加一对；刻子是三张相同牌，杠是四张相同牌。',en:'One-suit all pungs: all tiles are in one numbered family, with four triplets or kongs and a pair. A triplet is three identical tiles; a kong is four.'},
  'jiang-pungs':{zh:'将对：四组都是刻子或杠，再加一对；所有牌的数字只能是二、五、八。',en:'All pungs of 2, 5 and 8: four identical-tile groups and a pair, using only those three numbers.'},
  'dragon-pairs':{zh:'龙七对：七个对子中，有四张相同牌拆成的两个对子。',en:'Seven pairs with a quad: four identical tiles supply two of the seven pairs.'},
  'pure-pairs':{zh:'清七对：七个对子，并且所有牌属于同一种花色。',en:'One-suit seven pairs: seven pairs, all in the same numbered family.'},
  'pure-terminals':{zh:'清幺九：全部牌属于同一种花色，每组和对子还都包含一或九。',en:'One-suit terminals: all tiles share a numbered family, and every group and the pair contains a one or nine.'},
  'pure-dragon-pairs':{zh:'清龙七对：同一种花色的七个对子，其中四张相同牌组成两个对子。',en:'One-suit seven pairs with a quad: seven pairs in one family, with four identical tiles supplying two pairs.'},
};

export function sichuanWinExplanation(v:SichuanView,locale:'zh'|'en'){
  if(v.stage!=='play')return '';
  const event=v.round.events.at(-1);if(event?.kind!=='win')return '';
  const zh=locale==='zh',name=(t:number)=>zh?tileNames[t]:`${t%9+1} ${['characters','dots','bamboo'][Math.floor(t/9)]}`;
  const group=(tiles:number[])=>tiles.map(name).join(zh?'、':', ');
  const lines=event.seats.map(id=>{
    const p=v.round.players[id],hand=event.selfDraw?p.hand:[...p.hand,event.tile];
    const value=sichuanPatternValue(hand,p.melds,p.missing);
    const shapes=decomposeHand(hand,p.melds,{variant:'sichuan',missingSuit:p.missing});
    // Show a decomposition that actually earns the named pattern, not merely
    // the first valid shape (a hand can be both sequences and all triplets).
    const shape=value?.pattern.includes('pairs')?shapes.find(s=>s.kind==='seven-pairs'):shapes.find(s=>s.kind==='standard'&&
      (!value?.pattern.includes('pungs')||s.groups.every(g=>g.kind!=='chow'))&&
      (!value?.pattern.includes('terminals')||([0,8].includes(s.pair%9)&&s.groups.every(g=>g.tiles.some(t=>[0,8].includes(t%9))))));
    const composition=shape?.kind==='seven-pairs'?shape.pairs.map(t=>`[${group([t,t])}]`).join(' + '):shape?.kind==='standard'?`${shape.groups.map(g=>`[${group(g.tiles)}]`).join(' + ')} + [${group([shape.pair,shape.pair])}]`:'';
    const rootTiles=countsOf([...hand,...p.melds.flatMap(m=>m.tiles)]).flatMap((n,t)=>n===4?[name(t)]:[]);
    const bonus=event.robbing?sichuanTableRules.robbingDoublings:event.afterKong?sichuanTableRules.afterKongDoublings:0;
    const base=value?2**value.baseDoublings:0,raw=(value?.multiplier??0)*2**bonus;
    const capped=Math.min(sichuanTableRules.capMultiplier,raw),extra=event.selfDraw?sichuanTableRules.selfDrawExtra:0;
    const calculation=value?(zh?`\n${patternHelp[value.pattern].zh}本桌这个基本牌型从 ${base} 倍算起。根是四张完全相同的牌，每个额外计分的根再乘 2。本手共有 ${rootTiles.length} 根${rootTiles.length?`（${rootTiles.join('、')}各四张）`:''}；${value.pattern.includes('dragon-pairs')?'龙七对基本牌型已经包含一根，不重复加分；':''}额外计分 ${value.roots} 根：${[base,...Array(value.roots).fill(2)].join(' × ')} = ${value.multiplier}。\n每位应付款人的计算：牌型 ${value.multiplier} × 事件加倍 ${2**bonus} = ${raw}；封顶就是超过 ${sichuanTableRules.capMultiplier} 倍只按 ${sichuanTableRules.capMultiplier} 倍算，因此取 ${capped}。底分 ${sichuanTableRules.base} × ${capped} + 自摸另加 ${extra} = ${sichuanTableRules.base*capped+extra} 分。这是每位付款人的数额，不是全桌合计；谁付款看下面的逐笔记录。`:
      `\n${patternHelp[value.pattern].en} This table starts that base pattern at ${base} times the base point. A root means four identical tiles; each extra scoring root multiplies by 2. This hand has ${rootTiles.length} roots${rootTiles.length?` (four each of ${rootTiles.join(', ')})`:''}; ${value.pattern.includes('dragon-pairs')?'the dragon-pairs base already includes one root, so do not count it twice; ':''}${value.roots} extra scoring roots: ${[base,...Array(value.roots).fill(2)].join(' × ')} = ${value.multiplier}.\nFor each payer: pattern ${value.multiplier} × event factor ${2**bonus} = ${raw}. The cap means any value above ${sichuanTableRules.capMultiplier} uses ${sichuanTableRules.capMultiplier}, so use ${capped}. Base point ${sichuanTableRules.base} × ${capped} + self-draw extra ${extra} = ${sichuanTableRules.base*capped+extra}. This is per payer, not the whole table's total; the transfers below identify who pays.`):'';
    return (zh?`座位 ${id+1}：${event.selfDraw?'自摸':event.robbing?'抢杠胡':'胡弃牌'} ${name(event.tile)}。没有缺门${['万','筒','条'][p.missing]}，牌可组成：${composition}。牌型为${value?sichuanPatternNames[value.pattern].zh:'合法胡牌'}，含根后的牌型倍率 ${value?.multiplier??'—'}。${event.robbing?'本桌抢杠再翻倍一次。':event.afterKong?'本桌杠后胡牌再翻倍一次。':''}${event.selfDraw?'自摸在封顶后每位付款人另加 1 分。':''}`:
      `Seat ${id+1}: ${event.selfDraw?'self-draw':event.robbing?'robbed kong':'discard win'} on ${name(event.tile)}. No missing-suit tiles remain. One legal grouping: ${composition}. Pattern: ${value?sichuanPatternNames[value.pattern].en:'valid hand'}; multiplier including roots ${value?.multiplier??'—'}. ${event.robbing?'This table doubles once for robbing.':event.afterKong?'This table doubles once for the kong-related win.':''}${event.selfDraw?' Self-draw adds 1 per payer after the cap.':''}`)+calculation;
  });
  const payments=v.payments.filter(p=>p.event===`event:${v.round.events.length-1}`);
  lines.push(...payments.map(p=>zh?`座位 ${p.from+1} 向座位 ${p.to+1} 支付 ${p.amount} 分。`:`Seat ${p.from+1} pays seat ${p.to+1} ${p.amount} points.`));
  lines.push(zh?'胡牌者退出本手：之后不再摸牌或出牌，但仍要确认结果。四个座位都要点击“我看懂了，确认继续”，包括已经胡牌的人。关闭弹窗不等于确认；四人确认后，其余玩家继续，三人胡牌或牌墙摸完才结束。':'Winners retire: they no longer draw or discard, but must still confirm results. All four seats, including retired winners, must click “I understand — confirm continuation”. Closing the dialog is not confirmation. After all four confirm, the remaining players continue until three winners or wall exhaustion.');
  return lines.join('\n\n');
}
