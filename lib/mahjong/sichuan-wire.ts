import type {SichuanRoomPayload} from './sichuan-room';
import type {SichuanView} from './sichuan-teaching';
import {sichuanTableId} from '../../content/sichuan-table';
const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const keys=(v:unknown,names:string)=>obj(v)&&Object.keys(v).length===names.split(' ').length&&Object.keys(v).every(k=>names.split(' ').includes(k));
const num=(v:unknown,max=1e9):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0&&v<=max;
const bool=(v:unknown)=>typeof v==='boolean';
const seat=(v:unknown)=>num(v,3),tile=(v:unknown)=>num(v,26);
const list=(v:unknown,max:number,p:(x:unknown)=>boolean)=>Array.isArray(v)&&v.length<=max&&v.every(p);
const four=(v:unknown,p:(x:unknown)=>boolean)=>Array.isArray(v)&&v.length===4&&v.every(p);
const tiles=(v:unknown)=>list(v,14,tile)&&Array.isArray(v)&&v.every(t=>v.filter(x=>x===t).length<=4);
function validView(raw:unknown,id:number):boolean{
  if(!obj(raw))return false;const v=raw as unknown as SichuanView;
  if(!num(v.revision)||!bool(v.closed)||v.preset!==sichuanTableId||!four(v.confirmed,bool))return false;
  if(v.stage==='setup'){
    if(!keys(v,'revision closed preset confirmed stage setup'))return false;
    const s=v.setup;
    if(!keys(s,'phase seat dealer direction hand handCounts wallCount exchangeChosen ownExchange missingChosen missing')||s.seat!==id||!seat(s.dealer)||![1,2,3].includes(s.direction)||!['exchange','missing'].includes(s.phase)||!tiles(s.hand)||!four(s.handCounts,n=>n===13||n===14)||s.hand.length!==s.handCounts[id]||s.wallCount!==55||!four(s.exchangeChosen,bool)||!four(s.missingChosen,bool)||!four(s.missing,x=>x===null||num(x,2)))return false;
    if(s.missing.some((x,i)=>i!==id&&x!==null))return false;
    return s.ownExchange===null||(list(s.ownExchange,3,tile)&&s.ownExchange.length===3);
  }
  if(v.stage!=='play'||!keys(v,'revision closed preset confirmed stage round balances payments wallChecks'))return false;
  const r=v.round;
  if(!keys(r,'revision seat phase actor end wallCount players drawn legal canDraw claim rivers events')||r.seat!==id||!num(r.revision)||!num(r.wallCount,55)||!['turn','draw','claims','result','ended'].includes(r.phase)||!(r.phase==='ended'?r.actor===-1:seat(r.actor))||!(r.end===null||['wall-empty','three-winners'].includes(r.end))||!bool(r.canDraw)||r.canDraw!==(r.phase==='draw'&&r.actor===id))return false;
  if(!four(r.players,p=>obj(p)))return false;
  for(let i=0;i<4;i++){
    const p=r.players[i];
    if(!keys(p,'hand handCount missing retired melds')||!tiles(p.hand)||!num(p.handCount,14)||!num(p.missing,2)||!bool(p.retired)||p.hand.length!==(i===id||p.retired?p.handCount:0)||!list(p.melds,4,m=>obj(m)))return false;
    for(const m of p.melds)if(!keys(m,'kind open tiles')||!['pung','kong'].includes(m.kind)||!bool(m.open)||!Array.isArray(m.tiles)||m.tiles.length!==(m.kind==='kong'?4:3)||!m.tiles.every(t=>tile(t)&&t===m.tiles[0]))return false;
  }
  if(r.drawn!==null&&(!tile(r.drawn)||r.phase!=='turn'||r.actor!==id||!r.players[id].hand.includes(r.drawn)))return false;
  if(r.phase==='turn'&&r.actor===id){
    const a=r.legal;if(!keys(a,'discards win concealedKongs addedKongs')||!a||!list(a.discards,14,tile)||!bool(a.win)||!list(a.concealedKongs,4,tile)||!list(a.addedKongs,4,seat)||a.discards.some(t=>!r.players[id].hand.includes(t)))return false;
  }else if(r.legal!==null)return false;
  if(r.phase==='claims'){
    const c=r.claim;if(!c||!keys(c,'from tile robbing options reply responded')||!seat(c.from)||!tile(c.tile)||!bool(c.robbing)||!keys(c.options,'win pung kong')||!Object.values(c.options).every(bool)||!four(c.responded,bool)||!(c.reply===null||['win','pung','kong','pass'].includes(c.reply)))return false;
  }else if(r.claim!==null)return false;
  if(!list(r.rivers,108,x=>keys(x,'seat tile claimed')&&obj(x)&&seat(x.seat)&&tile(x.tile)&&bool(x.claimed)))return false;
  if(!list(r.events,32,obj))return false;
  for(const e of r.events){
    if(!seat(e.from)||!tile(e.tile))return false;
    if(e.kind==='win'){if(!keys(e,'kind seats from tile selfDraw robbing afterKong')||!list(e.seats,3,seat)||!e.seats.length||new Set(e.seats).size!==e.seats.length||!bool(e.selfDraw)||!bool(e.robbing)||!bool(e.afterKong))return false;}
    else if(e.kind!=='kong'||!keys(e,'kind seat from tile form')||!seat(e.seat)||!['concealed','added','discard'].includes(e.form))return false;
  }
  if(!four(v.balances,n=>typeof n==='number'&&Number.isSafeInteger(n)&&Math.abs(n)<=1e9)||!list(v.payments,256,obj))return false;
  const totals=[0,0,0,0];
  for(let i=0;i<v.payments.length;i++){
    const p=v.payments[i];if(!keys(p,p.refundOf===undefined?'id event from to amount kind':'id event from to amount kind refundOf')||p.id!==i||typeof p.event!=='string'||!/^[a-zA-Z0-9:-]{1,80}$/.test(p.event)||!seat(p.from)||!seat(p.to)||p.from===p.to||!num(p.amount)||p.amount===0||!['discard-win','self-draw','kong','kong-refund','not-ready','missing-suit','kong-transfer'].includes(p.kind)||(p.refundOf!==undefined&&!num(p.refundOf,i-1)))return false;
    totals[p.from]-=p.amount;totals[p.to]+=p.amount;
  }
  if(totals.some((n,i)=>n!==v.balances[i]))return false;
  if(v.wallChecks!==null){
    if(r.phase!=='ended'||r.end!=='wall-empty'||!four(v.wallChecks,obj))return false;
    for(let i=0;i<4;i++){const c=v.wallChecks[i];if(!keys(c,'seat status waits maximum')||c.seat!==i||!['retired','ready','not-ready','missing-suit'].includes(c.status)||!num(c.maximum)||!list(c.waits,27,w=>keys(w,'tile amount')&&obj(w)&&tile(w.tile)&&num(w.amount)))return false;}
  }
  return true;
}
/** Validate shape and basic consistency, not host honesty or shuffle fairness. */
export function validSichuanPayload(value:unknown,recipient:number):value is SichuanRoomPayload{
  try{
    if(!seat(recipient)||!obj(value))return false;
    switch(value.kind){
      case 'lobby':return keys(value,'kind connected')&&four(value.connected,bool)&&Array.isArray(value.connected)&&value.connected[recipient]===true;
      case 'ack':return keys(value,'kind request accepted')&&num(value.request)&&value.request>0&&bool(value.accepted);
      case 'closed':return keys(value,'kind player')&&seat(value.player);
      case 'view':return keys(value,'kind view')&&validView(value.view,recipient);
      default:return false;
    }
  }catch{return false;}
}
