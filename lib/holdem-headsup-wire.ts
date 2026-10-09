import {validPokerView} from './holdem-remote';
import type {HeadsUpRoomPayload} from './holdem-headsup-room';
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const seat=(n:unknown)=>n===0||n===1;
const fields=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&Object.keys(v).every(k=>keys.includes(k));
export function validHeadsUpPayload(raw:unknown,recipient:number):raw is HeadsUpRoomPayload{
 try{
  if(!seat(recipient)||!object(raw))return false;
  if(raw.kind==='lobby')return fields(raw,['kind','connected'])&&Array.isArray(raw.connected)&&raw.connected.length===2&&raw.connected.every(n=>typeof n==='boolean')&&raw.connected[recipient]===true;
  if(raw.kind==='closed')return fields(raw,['kind','player'])&&seat(raw.player);
  if(raw.kind==='ack')return fields(raw,['kind','request','accepted'])&&Number.isSafeInteger(raw.request)&&Number(raw.request)>0&&typeof raw.accepted==='boolean';
  if(raw.kind!=='view'||!fields(raw,['kind','view'])||!object(raw.view))return false;
  const v=raw.view;
  if(!fields(v,['hand','revision','seat','ownCards','opponentCards','community','stacks','start','committed','streetBet','button','actor','street','over','winner','showdown','awarded','next','legal','log'])||!validPokerView(v)||v.seat!==recipient)return false;
  const sum=(ns:number[])=>ns.reduce((a,b)=>a+b,0);
  if(sum(v.start)!==400||sum(v.stacks)+(v.over?0:sum(v.committed))!==400||v.streetBet.some((n,i)=>n>v.committed[i]))return false;
  if(v.log.some(l=>!object(l)||!fields(l,['zh','en'])))return false;
  if(v.legal){const a=v.legal;if(!object(a)||!fields(a,['call','minTo','maxTo','canCheck','canRaise'])||a.call>v.stacks[recipient]||a.canCheck!==(a.call===0)||a.maxTo!==v.stacks[recipient]+v.streetBet[recipient])return false;}
  return true;
 }catch{return false;}
}
