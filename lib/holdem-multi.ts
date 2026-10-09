import { bestHand, shuffle, type Action } from './holdem';
import { settlePots, type PotAward } from './holdem-pots';

export type MultiTable = {
  stacks:number[]; start:number[]; committed:number[]; bets:number[]; folded:boolean[];
  actedAt:(number|null)[]; hole:number[][]; community:number[]; deck:number[]; burned:number[];
  button:number; actor:number; street:number; price:number; minRaise:number;
  over:boolean; showdown:boolean; awards:number[]; refunds:number[]; pots:PotAward[];
  actions:{seat:number;kind:string;paid:number;to:number;street:number}[];
};
const seats=(s:MultiTable)=>s.stacks.map((_,i)=>i);
const live=(s:MultiTable)=>seats(s).filter(i=>!s.folded[i]);
const able=(s:MultiTable)=>live(s).filter(i=>s.stacks[i]>0);
function clockwise(s:MultiTable,after:number,candidates:number[]) {
  for(let d=1;d<=s.stacks.length;d++) { const i=(after+d)%s.stacks.length;if(candidates.includes(i))return i; }
  return -1;
}
function pay(s:MultiTable,p:number,amount:number) {s.stacks[p]-=amount;s.bets[p]+=amount;s.committed[p]+=amount;}
function refundUncalled(s:MultiTable) {
  const ordered=seats(s).sort((a,b)=>s.bets[b]-s.bets[a]), p=ordered[0];
  const excess=s.bets[p]-s.bets[ordered[1]];
  if(excess>0) {
    if(s.folded[p])throw new Error('Invalid unmatched folded bet');
    s.bets[p]-=excess;s.committed[p]-=excess;s.stacks[p]+=excess;s.refunds[p]+=excess;
  }
}
function finish(s:MultiTable) {
  refundUncalled(s);
  const remaining=live(s);
  s.showdown=remaining.length>1;
  const scores=s.hole.map((cards,i)=>s.folded[i]?null:s.showdown?bestHand([...cards,...s.community]).score:[0]);
  const result=settlePots(s.committed,s.folded,scores,s.button);
  s.pots=result.pots;s.awards=result.awards;
  seats(s).forEach(i=>{s.refunds[i]+=result.refunds[i];s.committed[i]-=result.refunds[i];s.stacks[i]+=result.awards[i]+result.refunds[i];});
  s.over=true;s.actor=-1;
}
function dealStreet(s:MultiTable) {
  s.street++;s.burned.push(s.deck.shift()!);
  for(let i=0;i<(s.street===1?3:1);i++)s.community.push(s.deck.shift()!);
  s.bets.fill(0);s.actedAt.fill(null);s.price=0;s.minRaise=10;
}
/** Stop only at a real player decision; automatically run out when no betting can remain. */
function advance(s:MultiTable,after:number) {
  if(live(s).length===1){finish(s);return;}
  const capable=able(s);
  const pending=capable.length===1
    ? capable.filter(i=>s.bets[i]<Math.max(...live(s).filter(j=>j!==i).map(j=>s.bets[j])))
    : capable.filter(i=>s.actedAt[i]===null||s.bets[i]<s.price);
  if(pending.length){s.actor=clockwise(s,after,pending);return;}
  refundUncalled(s);
  if(s.street===3){finish(s);return;}
  dealStreet(s);
  advance(s,s.button);
}
export function newMultiTable(stacks:number[]=[200,200,200,200],button=0,deck=shuffle()):MultiTable {
  const n=stacks.length;
  if(n<2||n>9||stacks.some(v=>!Number.isSafeInteger(v)||v<0)||stacks.filter(v=>v>0).length<2||
    !Number.isSafeInteger(stacks.reduce((a,b)=>a+b,0))||!Number.isInteger(button)||button<0||button>=n||stacks[button]===0||
    deck.length!==52||new Set(deck).size!==52||deck.some(c=>!Number.isInteger(c)||c<0||c>51))throw new Error('Invalid table setup');
  const zeros=()=>Array(n).fill(0) as number[];
  const s:MultiTable={stacks:[...stacks],start:[...stacks],committed:zeros(),bets:zeros(),folded:stacks.map(v=>v===0),actedAt:Array(n).fill(null),
    hole:Array.from({length:n},()=>[]),community:[],deck:[...deck],burned:[],button,actor:-1,street:0,price:10,minRaise:10,
    over:false,showdown:false,awards:zeros(),refunds:zeros(),pots:[],actions:[]};
  const players=live(s);
  for(let round=0;round<2;round++) {let p=button;for(let j=0;j<players.length;j++){p=clockwise(s,p,players);s.hole[p].push(s.deck.shift()!);}}
  const sb=players.length===2?button:clockwise(s,button,players),bb=clockwise(s,sb,players);
  pay(s,sb,Math.min(5,s.stacks[sb]));pay(s,bb,Math.min(10,s.stacks[bb]));
  advance(s,bb);
  return s;
}
export function multiLegal(s:MultiTable) {
  const p=s.actor;
  if(s.over||p<0) return {call:0,canCheck:false,canRaise:false,minTo:0,maxTo:0};
  const call=Math.min(s.stacks[p],Math.max(0,s.price-s.bets[p])), maxTo=s.bets[p]+s.stacks[p];
  const reopened=s.actedAt[p]===null||s.price-s.actedAt[p]!>=s.minRaise;
  return {call,canCheck:call===0,canRaise:reopened&&able(s).some(i=>i!==p)&&maxTo>s.price,
    minTo:s.price+s.minRaise,maxTo};
}
export function actMulti(state:MultiTable,seat:number,action:Action):MultiTable {
  if(state.over||seat!==state.actor||!action||!['fold','check','call','raise'].includes(action.kind))throw new Error('Invalid actor or action');
  const legal=multiLegal(state),s:MultiTable=structuredClone(state),before=s.stacks[seat];
  if(action.kind==='fold')s.folded[seat]=true;
  if(action.kind==='check'&&!legal.canCheck)throw new Error('Cannot check');
  if(action.kind==='call') {if(!legal.call)throw new Error('Nothing to call');pay(s,seat,legal.call);}
  if(action.kind==='raise') {
    if(!legal.canRaise||!Number.isSafeInteger(action.to)||action.to<=s.price||action.to>legal.maxTo||
      (action.to<legal.minTo&&action.to!==legal.maxTo))throw new Error('Illegal raise');
    const increase=action.to-s.price;pay(s,seat,action.to-s.bets[seat]);
    if(increase>=s.minRaise)s.minRaise=increase;
    s.price=action.to;
  }
  s.actedAt[seat]=s.price;
  s.actions.push({seat,kind:action.kind,paid:before-s.stacks[seat],to:s.bets[seat],street:s.street});
  advance(s,seat);
  return s;
}
export function nextMultiHand(s:MultiTable,deck=shuffle()) {
  if(!s.over)throw new Error('Hand still active');
  const players=seats(s).filter(i=>s.stacks[i]>0);
  if(players.length<2)throw new Error('Only one funded seat remains');
  return newMultiTable(s.stacks,clockwise(s,s.button,players),deck);
}
