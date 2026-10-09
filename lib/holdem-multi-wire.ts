import type { MultiRoomPayload } from './holdem-multi-room';
import type { MultiView } from './holdem-multi-session';
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const uint=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0&&Number(v)<=1_000_000_000;
const seat=(v:unknown):v is number=>uint(v)&&v<4;
const list=(v:unknown,length:number,p:(x:unknown)=>boolean)=>Array.isArray(v)&&v.length===length&&v.every(p);
const seatList=(v:unknown)=>Array.isArray(v)&&v.length>0&&v.length<=4&&v.every(seat)&&new Set(v).size===v.length;
const card=(v:unknown)=>uint(v)&&v<52;
const sum=(v:number[])=>v.reduce((a,b)=>a+b,0);

function viewValid(raw:unknown,recipient:number):raw is MultiView {
  if(!object(raw))return false;
  const allowed=['hand','revision','seat','button','actor','street','price','over','showdown','community','cards','cardCounts','stacks','start','committed','bets','folded','awards','refunds','next','legal','pots','actions'];
  if(Object.keys(raw).some(k=>!allowed.includes(k)))return false;
  const v=raw as unknown as MultiView;
  if(v.seat!==recipient||!seat(v.seat)||!seat(v.button)||!uint(v.hand)||v.hand<1||!uint(v.revision)||!uint(v.street)||v.street>3||!uint(v.price)||typeof v.over!=='boolean'||typeof v.showdown!=='boolean')return false;
  if(v.over?v.actor!==-1:!seat(v.actor))return false;
  for(const a of [v.stacks,v.start,v.committed,v.bets,v.awards,v.refunds])if(!list(a,4,uint))return false;
  for(const a of [v.folded,v.next])if(!list(a,4,x=>typeof x==='boolean'))return false;
  if(!list(v.cardCounts,4,x=>x===0||x===2)||!list(v.cards,4,Array.isArray)||!Array.isArray(v.community)||v.community.length!==[0,3,4,5][v.street]||!v.community.every(card))return false;
  if(v.showdown&&(!v.over||v.community.length!==5))return false;
  for(let i=0;i<4;i++) {
    const exposed=i===recipient||(v.showdown&&!v.folded[i]);
    if(v.cards[i].length!==(exposed?v.cardCounts[i]:0)||!v.cards[i].every(card))return false;
    if(v.bets[i]>v.committed[i])return false;
  }
  const exposed=[...v.community,...v.cards.flat()];if(new Set(exposed).size!==exposed.length)return false;
  if(v.over?sum(v.stacks)!==sum(v.start):sum(v.stacks)+sum(v.committed)!==sum(v.start))return false;
  if(!v.over&&(sum(v.awards)!==0||v.pots?.length!==0))return false;
  if(v.legal===null) {if(!v.over&&v.actor===recipient)return false;}
  else {
    const a=v.legal;
    if(!object(a)||v.over||v.actor!==recipient||!uint(a.call)||!uint(a.minTo)||!uint(a.maxTo)||typeof a.canCheck!=='boolean'||typeof a.canRaise!=='boolean')return false;
    if(a.call>v.stacks[recipient]||a.canCheck!==(a.call===0)||a.maxTo!==v.stacks[recipient]+v.bets[recipient])return false;
  }
  if(!Array.isArray(v.pots)||v.pots.length>4)return false;
  for(const p of v.pots) {
    if(!object(p)||!uint(p.amount)||!uint(p.cap)||!seatList(p.contributors)||!seatList(p.eligible)||!seatList(p.winners)||!list(p.shares,4,uint))return false;
    if(p.eligible.some(i=>v.folded[i]||!p.contributors.includes(i))||p.winners.some(i=>!p.eligible.includes(i))||sum(p.shares)!==p.amount||p.shares.some((x,i)=>x>0&&!p.winners.includes(i)))return false;
  }
  if(v.over&&v.awards.some((value,i)=>value!==v.pots.reduce((a,p)=>a+p.shares[i],0)))return false;
  if(!Array.isArray(v.actions)||v.actions.length>1000)return false;
  for(const a of v.actions)if(!object(a)||!seat(a.seat)||!['fold','check','call','raise'].includes(a.kind)||!uint(a.paid)||!uint(a.to)||!uint(a.street)||a.street>v.street)return false;
  return true;
}
/** Runtime bounds and schema checks, not proof that a trusted host shuffled fairly. */
export function validMultiPayload(raw:unknown,recipient:number):raw is MultiRoomPayload {
  try {
    if(!seat(recipient)||!object(raw))return false;
    if(raw.kind==='view')return viewValid(raw.view,recipient);
    if(raw.kind==='lobby')return Array.isArray(raw.connected)&&list(raw.connected,4,x=>typeof x==='boolean')&&raw.connected[recipient]===true;
    if(raw.kind==='closed')return seat(raw.player);
    if(raw.kind==='ack')return uint(raw.request)&&raw.request>0&&typeof raw.accepted==='boolean';
    return false;
  }catch{return false;}
}
