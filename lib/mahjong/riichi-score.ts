import * as Majiang from '@kobalab/majiang-core';
import {countsOf,decomposeHand,structuralWaits,type Meld} from './shape';
import {riichiRules} from './riichi-player';

export type WindSeat=0|1|2|3;
export type RiichiMeld=Meld & {from?:WindSeat;called?:number};
export type RiichiContext={
  seat:WindSeat;roundWind:WindSeat;from:WindSeat|null;
  riichi?:0|1|2;ippatsu?:boolean;robbingKong?:boolean;replacementDraw?:boolean;
  lastTile?:boolean;heavenly?:0|1|2;doraIndicators?:number[];uraIndicators?:number[];
  honba?:number;riichiSticks?:number;
  ownDiscards?:number[];temporaryFuriten?:boolean;riichiFuriten?:boolean;
};

/** Our tile atlas orders dragons red/green/white; the library uses white/green/red. */
export function toRiichiTile(tile:number):string {
  countsOf([tile]);
  return tile<27 ? 'mps'[Math.floor(tile/9)]+String(tile%9+1) : 'z'+[1,2,3,4,7,6,5][tile-27];
}
export function fromRiichiTile(code:string):number {
  if(!/^[mps][1-9]$|^z[1-7]$/.test(code))throw new Error('Invalid non-red riichi tile');
  return code[0]==='z' ? 27+[0,1,2,3,6,5,4][Number(code[1])-1] : 'mps'.indexOf(code[0])*9+Number(code[1])-1;
}
function relative(seat:WindSeat,from:WindSeat) {
  const distance=(from-seat+4)%4;
  if(!distance)throw new Error('A player cannot claim their own discard');
  return ['','+','=','-'][distance];
}
function encodeMeld(m:RiichiMeld,seat:WindSeat):string {
  const tiles=[...m.tiles].sort((a,b)=>a-b),codes=tiles.map(toRiichiTile);
  if(!m.open)return codes[0][0]+codes.map(c=>c[1]).join('');
  if(m.from===undefined||![0,1,2,3].includes(m.from)||m.called===undefined||!tiles.includes(m.called))throw new Error('Open meld needs source and called tile');
  const marker=relative(seat,m.from);
  if(m.kind==='chow'&&marker!=='-')throw new Error('Chow only from previous player');
  const index=m.kind==='chow'?tiles.indexOf(m.called):tiles.length-1;
  return codes[0][0]+codes.map((c,i)=>c[1]+(i===index?marker:'')).join('');
}

/** Declared application scoring preset, not a claim of complete WRC compliance.
 * No red fives; open tanyao; no double/counting yakuman; multiple yakuman allowed.
 * Turn legality, riichi deposits and temporary-furiten updates belong to the round engine. */
export function scoreRiichi(before:readonly number[],winning:number,melds:readonly RiichiMeld[],context:RiichiContext) {
  if(![0,1,2,3].includes(context.seat)||![0,1,2,3].includes(context.roundWind)||(context.from!==null&&![0,1,2,3].includes(context.from)))throw new Error('Invalid wind/seat');
  for(const n of [context.honba??0,context.riichiSticks??0])if(!Number.isSafeInteger(n)||n<0||n>1000)throw new Error('Invalid counters');
  if(![0,1,2].includes(context.riichi??0)||![0,1,2].includes(context.heavenly??0))throw new Error('Invalid situation');
  const complete=[...before,winning];
  if(!decomposeHand(complete,melds,{variant:'riichi'}).length)return null;
  if((context.riichi||context.ippatsu)&&melds.some(m=>m.open))throw new Error('Open hands cannot declare riichi');
  if(context.ippatsu&&!context.riichi)throw new Error('Ippatsu requires riichi');
  if(context.from!==null) {
    relative(context.seat,context.from);
    if(context.replacementDraw||context.heavenly)throw new Error('Self-draw situation used for ron');
    const discards=context.ownDiscards??[];discards.forEach(t=>countsOf([t]));
    if(context.temporaryFuriten||context.riichiFuriten||structuralWaits(before,melds).some(t=>discards.includes(t)))return null;
  } else if(context.robbingKong)throw new Error('Robbing a kong requires another player');
  const dora=context.doraIndicators??[],ura=context.riichi?context.uraIndicators??[]:[];
  for(const list of [dora,ura]){if(list.length>5)throw new Error('Too many indicators');list.forEach(t=>countsOf([t]));}
  const closed=(context.from===null?complete:before).map(toRiichiTile).join('');
  const hand=Majiang.Shoupai.fromString([closed,...melds.map(m=>encodeMeld(m,context.seat))].join(','));
  const rules=riichiRules();
  const params=Majiang.Util.hule_param({
    rule:rules,zhuangfeng:context.roundWind,menfeng:context.seat,
    lizhi:context.riichi??0,yifa:context.ippatsu??false,qianggang:context.robbingKong??false,
    lingshang:context.replacementDraw??false,haidi:context.lastTile?(context.from===null?1:2):0,tianhu:context.heavenly??0,
    baopai:dora.map(toRiichiTile),fubaopai:ura.map(toRiichiTile),changbang:context.honba??0,lizhibang:context.riichiSticks??0,
  });
  const result=Majiang.Util.hule(hand,context.from===null?null:toRiichiTile(winning)+relative(context.seat,context.from),params);
  return result?.hupai?.length&&result.defen>0 ? result : null;
}
