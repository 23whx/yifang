import type {McrRoomPayload} from './mcr-room';
import type {McrWinResult} from 'miaoda-game-mcr-mahjong-rules';
import {mcrSettlement,type McrResult} from './mcr-settlement';
type Check=(v:unknown)=>boolean;
const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const uint=(max=1e9):Check=>v=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0&&v<=max;
const signed:Check=v=>typeof v==='number'&&Number.isSafeInteger(v)&&Math.abs(v)<=1e9;
const bool:Check=v=>typeof v==='boolean';
const str:Check=v=>typeof v==='string'&&v.length<=200;
const one=(...values:unknown[]):Check=>v=>values.includes(v);
const nullable=(p:Check):Check=>v=>v===null||p(v);
const arr=(max:number,p:Check):Check=>v=>Array.isArray(v)&&v.length<=max&&v.every(p);
const exact=(schema:Record<string,Check>):Check=>v=>obj(v)&&Object.keys(v).length===Object.keys(schema).length&&Object.entries(schema).every(([k,p])=>Object.hasOwn(v,k)&&p(v[k]));
const four=(p:Check):Check=>v=>Array.isArray(v)&&v.length===4&&v.every(p);
const ids=['seat-1','seat-2','seat-3','seat-4'];
const player=one(...ids),seat=uint(3),flower=one('plum','orchid','bamboo','chrysanthemum','spring','summer','autumn','winter');
const face:Check=v=>typeof v==='string'&&(/^[1-9][mps]$/.test(v)||/^[ESWNCFP]$/.test(v));
const tile:Check=v=>exact({id:str,face:x=>face(x)||flower(x),copy:uint(3)})(v)&&obj(v)&&v.id===`${v.face}:${v.copy}`&&(!flower(v.face)||v.copy===0);
const tileId:Check=v=>typeof v==='string'&&(()=>{const [f,c,...rest]=v.split(':');return !rest.length&&/^[0-3]$/.test(c)&&tile({id:v,face:f,copy:Number(c)});})();
const tiles=(max:number):Check=>v=>arr(max,tile)(v)&&Array.isArray(v)&&new Set(v.map(t=>t.id)).size===v.length;
const record=(names:string[],p:Check)=>exact(Object.fromEntries(names.map(k=>[k,p])));
const fan:Check=v=>typeof v==='string'&&/^mcr-(0[1-9]|[1-7][0-9]|8[01])$/.test(v);
const group:Check=v=>exact({kind:one('sequence'),tiles:arr(3,face)})(v)&&obj(v)&&Array.isArray(v.tiles)&&v.tiles.length===3||exact({kind:one('triplet','pair'),tile:face})(v)||exact({kind:one('kong'),tile:face,exposure:one('melded','concealed')})(v);
const occurrence=exact({key:str,fanCode:fan,name:str,points:uint(1000),source:one('structure','context','kong','concealed-set','wait','associated','simple','event','flower','no-fan','special'),matchedGroups:arr(5,uint(4)),matchedTiles:arr(18,face)});
const exclusion:Check=v=>obj(v)&&exact({fanCode:fan,name:str,excludedBy:arr(81,exact({fanCode:fan,name:str})),...(Object.hasOwn(v,'occurrenceKeys')?{occurrenceKeys:arr(81,str)}:{})})(v);
const analysis:Check=v=>{
  if(!obj(v)||!exact({handKind:one('ordinary','special'),fanCodes:arr(81,fan),nonFlowerTotal:uint(1000),flowerPoints:uint(8),total:uint(1008),occurrences:arr(100,occurrence),exclusions:arr(100,exclusion),...(v.handKind==='ordinary'?{decompositionIndex:uint(),groups:arr(5,exact({index:uint(4),group}))}:{})})(v))return false;
  const codes=v.fanCodes as string[],entries=v.occurrences as {key:string;fanCode:string;points:number;source:string}[];
  if(new Set(codes).size!==codes.length||new Set(entries.map(o=>o.key)).size!==entries.length)return false;
  if(codes.some(c=>!entries.some(o=>o.fanCode===c))||entries.some(o=>!codes.includes(o.fanCode)))return false;
  const flowers=entries.filter(o=>o.fanCode==='mcr-81');
  if(flowers.some(o=>o.source!=='flower'||o.points!==1)||flowers.length!==v.flowerPoints)return false;
  return Number(v.nonFlowerTotal)>=8&&v.total===Number(v.nonFlowerTotal)+Number(v.flowerPoints)&&entries.reduce((n,o)=>n+o.points,0)===v.total;
};
const win=exact({winnerId:player,discarderId:nullable(player),winMethod:one('self-draw','discard'),winningTile:tile,analysis,settlement:exact({totalFan:uint(1008),deltas:record(ids,signed),payments:record(ids,uint(1016))})});
const meld:Check=v=>exact({kind:one('concealed-kong'),tileCount:one(4)})(v)||exact({kind:one('chow','pung','kong'),exposure:one('melded','concealed'),tiles:tiles(4),claimedTileId:nullable(tileId),fromPlayerId:nullable(player)})(v)&&obj(v)&&Array.isArray(v.tiles)&&v.tiles.length===(v.kind==='kong'?4:3);
const choice=exact({index:uint(255),type:one('discard','draw','draw-replacement','replace-flower','discard-flower','declare-self-draw','declare-concealed-kong','declare-added-kong','claim-added-kong-win','claim-discard','pass-claim'),tileIds:arr(4,tileId),claim:nullable(one('win','chow','pung','kong'))});
const result:Check=v=>exact({kind:one('draw')})(v)||exact({kind:one('win'),winner:seat,from:seat,selfDraw:bool,nonFlowerPoints:uint(1000),flowers:arr(8,x=>uint(41)(x)&&Number(x)>=34)})(v);
const settlement=exact({eligible:bool,nonFlowerPoints:uint(1000),flowerPoints:uint(8),totalPoints:uint(1008),transfers:arr(3,exact({from:seat,to:seat,baseline:one(8),handPoints:uint(1008),amount:uint(1016)})),delta:four(signed)});
function validView(raw:unknown,id:number):boolean{
  if(!exact({revision:uint(),closed:bool,seat:one(id),table:obj,confirmed:four(bool),choices:arr(256,choice),canConfirm:bool,hand:v=>uint(16)(v)&&Number(v)>0,balances:four(signed),history:arr(16,exact({id:str,result,settlement})),complete:bool,canNext:bool})(raw)||!obj(raw)||!obj(raw.table))return false;
  const v=raw,{publicFlowers,...t}=raw.table as Record<string,unknown>,others=ids.filter((_,i)=>i!==id);
  if(!record(ids,tiles(8))(publicFlowers))return false;
  const exposed=publicFlowers as Record<string,{id:string;face:string}[]>;
  const allExposed=Object.values(exposed).flat();
  if(allExposed.length>8||!allExposed.every(x=>flower(x.face))||new Set(allExposed.map(x=>x.id)).size!==allExposed.length)return false;
  if(!exact({rulesetId:one('mcr-single-hand-v1'),viewerId:one(ids[id]),playerOrder:x=>Array.isArray(x)&&x.join('|')===ids.join('|'),dealerId:player,roundWind:one('E','S','W','N'),activePlayerId:player,phase:one('discard','draw','replacement','flower','claim','finished'),drewThisTurn:bool,pendingFlowerTileId:nullable(tileId),lastDrawnTileId:nullable(tileId),turnSource:nullable(one('deal','wall','flower-replacement','kong-replacement','claim')),claimWindow:nullable(exact({kind:one('discard','added-kong'),sourcePlayerId:player,tileId:nullable(tileId),hasResponded:bool})),ownHand:tiles(14),ownFlowers:tiles(8),otherHandCounts:record(others,uint(14)),otherFlowerCounts:record(others,uint(8)),discardPile:tiles(144),melds:record(ids,arr(4,meld)),winResult:nullable(win),drawResult:nullable(exact({reason:one('wall-exhausted')})),wallCount:uint(144)})(t))return false;
  if(t.lastDrawnTileId!==null&&(t.activePlayerId!==ids[id]||!(t.ownHand as {id:string}[]).some(x=>x.id===t.lastDrawnTileId)))return false;
  if(!(t.ownFlowers as {face:string}[]).every(x=>flower(x.face)))return false;
  if(JSON.stringify(exposed[ids[id]])!==JSON.stringify(t.ownFlowers))return false;
  if(others.some(p=>exposed[p].length!==(t.otherFlowerCounts as Record<string,number>)[p]))return false;
  if(allExposed.some(p=>(t.ownHand as {id:string}[]).some(h=>h.id===p.id)))return false;
  const melds=t.melds as Record<string,Record<string,unknown>[]>;
  if(others.some(p=>melds[p].some(m=>m.kind!=='concealed-kong'&&m.exposure==='concealed')))return false;
  const choices=v.choices as {index:number;tileIds:string[]}[];
  if(choices.some((c,i)=>c.index!==i||c.tileIds.some(tid=>!(t.ownHand as {id:string}[]).some(x=>x.id===tid))))return false;
  if((v.closed||t.phase==='finished')&&choices.length)return false;
  const confirmed=v.confirmed as boolean[],finished=t.phase==='finished';
  if(v.canConfirm!==(!v.closed&&finished&&!confirmed[id])||v.canNext!==(!v.closed&&finished&&Number(v.hand)<16&&confirmed.every(Boolean))||v.complete!==(v.hand===16&&finished&&confirmed.every(Boolean)))return false;
  if(finished?((t.winResult===null)===(t.drawResult===null)):(t.winResult!==null||t.drawResult!==null||confirmed.some(Boolean)))return false;
  const history=v.history as {id:string;result:McrResult;settlement:unknown}[],balances=[0,0,0,0];
  if(history.length!==Number(v.hand)-(finished?0:1))return false;
  for(let i=0;i<history.length;i++){
    const h=history[i],expected=mcrSettlement(h.result);
    if(h.id!==`hand:${i+1}`||JSON.stringify(h.settlement)!==JSON.stringify(expected)||h.result.kind==='win'&&!expected.eligible)return false;
    expected.delta.forEach((n,j)=>balances[j]+=n);
  }
  if(finished){
    const last=history.at(-1)!;
    if(last.result.kind==='draw'){
      if(t.winResult!==null||t.drawResult===null)return false;
    }else{
      if(t.winResult===null||t.drawResult!==null)return false;
      const w=t.winResult as unknown as McrWinResult,r=last.result,expected=mcrSettlement(r);
      if(w.winnerId!==ids[r.winner]||w.winMethod!==(r.selfDraw?'self-draw':'discard')||w.discarderId!==(r.selfDraw?null:ids[r.from]))return false;
      if(w.analysis.nonFlowerTotal!==r.nonFlowerPoints||w.analysis.flowerPoints!==r.flowers.length||w.analysis.total!==expected.totalPoints||w.settlement.totalFan!==expected.totalPoints)return false;
      if(ids.some((p,i)=>w.settlement.deltas[p]!==expected.delta[i]||w.settlement.payments[p]!==Math.max(0,-expected.delta[i])))return false;
    }
  }
  return balances.every((n,i)=>n===(v.balances as number[])[i]);
}
/** Bounded allowlisted display data, not a proof of host honesty or scoring. */
export function validMcrPayload(value:unknown,recipient:number):value is McrRoomPayload{
  try{
    if(!seat(recipient)||!obj(value))return false;
    switch(value.kind){
      case 'lobby':return exact({kind:one('lobby'),connected:four(bool)})(value)&&Array.isArray(value.connected)&&value.connected[recipient]===true;
      case 'ack':return exact({kind:one('ack'),request:x=>uint()(x)&&Number(x)>0,accepted:bool})(value);
      case 'closed':return exact({kind:one('closed'),player:seat})(value);
      case 'view':return exact({kind:one('view'),view:x=>validView(x,recipient)})(value);
      default:return false;
    }
  }catch{return false;}
}
