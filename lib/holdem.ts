/** Local heads-up no-limit teaching game, no rake, no money. Cards 0..51. */
export type Seat = 0 | 1;
export const rank = (c:number) => c % 13 + 2;
export const rankText = (r:number) => ({11:'J',12:'Q',13:'K',14:'A'} as Record<number,string>)[r] ?? String(r);
export const suit = (c:number) => Math.floor(c / 13);
export const cardText = (c:number) => `${({11:'J',12:'Q',13:'K',14:'A'} as Record<number,string>)[rank(c)] ?? rank(c)}${['♠','♥','♣','♦'][suit(c)]}`;
export const categories = ['高牌','一对','两对','三条','顺子','同花','葫芦','四条','同花顺'];
export const categoriesEn = ['High card','One pair','Two pair','Three of a kind','Straight','Flush','Full house','Four of a kind','Straight flush'];
export function compare(a:number[],b:number[]) { for(let i=0;i<Math.max(a.length,b.length);i++){const d=(a[i]??0)-(b[i]??0);if(d)return Math.sign(d);}return 0; }
export function scoreFive(cards:number[]):number[] {
  const rs=cards.map(rank).sort((a,b)=>b-a), unique=[...new Set(rs)];
  const flush=cards.every(c=>suit(c)===suit(cards[0]));
  const straight=unique.length===5 ? (unique[0]-unique[4]===4 ? unique[0] : unique.join(',')==='14,5,4,3,2' ? 5 : 0) : 0;
  const groups=unique.map(r=>[rs.filter(x=>x===r).length,r]).sort((a,b)=>b[0]-a[0]||b[1]-a[1]);
  if(flush&&straight)return [8,straight];
  if(groups[0][0]===4)return [7,groups[0][1],groups[1][1]];
  if(groups[0][0]===3&&groups[1][0]===2)return [6,groups[0][1],groups[1][1]];
  if(flush)return [5,...rs]; if(straight)return [4,straight];
  if(groups[0][0]===3)return [3,...groups.map(g=>g[1])];
  if(groups[0][0]===2&&groups[1][0]===2)return [2,...groups.map(g=>g[1])];
  if(groups[0][0]===2)return [1,...groups.map(g=>g[1])];
  return [0,...rs];
}
export function bestHand(cards:number[]) {
  if(cards.length<5||cards.length>7||new Set(cards).size!==cards.length)throw new Error('Expected 5–7 different cards');
  let best:number[]=[]; let chosen:number[]=[];
  for(let a=0;a<cards.length-4;a++)for(let b=a+1;b<cards.length-3;b++)for(let c=b+1;c<cards.length-2;c++)for(let d=c+1;d<cards.length-1;d++)for(let e=d+1;e<cards.length;e++){
    const five=[cards[a],cards[b],cards[c],cards[d],cards[e]], score=scoreFive(five);
    if(!best.length||compare(score,best)>0){best=score;chosen=five;}
  }
  return {score:best,cards:chosen};
}
export function shuffle(random= Math.random) {const d=Array.from({length:52},(_,i)=>i);for(let i=51;i>0;i--){const j=Math.floor(random()*(i+1));[d[i],d[j]]=[d[j],d[i]];}return d;}
export type Action = {kind:'fold'|'check'|'call'} | {kind:'raise';to:number};
export type Table = {
  deck:number[]; hole:[number[],number[]]; community:number[]; stacks:[number,number]; start:[number,number];
  committed:[number,number]; streetBet:[number,number]; acted:[boolean,boolean]; button:Seat; actor:Seat;
  street:number; minRaise:number; over:boolean; winner:Seat|'tie'|null; showdown:boolean;
  awarded:[number,number]; log:{zh:string;en:string}[];
};
const other=(p:Seat):Seat=>p===0?1:0;
function pay(s:Table,p:Seat,n:number){s.stacks[p]-=n;s.streetBet[p]+=n;s.committed[p]+=n;}
export function newTable(stacks:[number,number]=[200,200],button:Seat=0,deck=shuffle()):Table {
  if(stacks.length!==2||stacks.some(x=>!Number.isSafeInteger(x)||x<=0)||!Number.isSafeInteger(stacks[0]+stacks[1])||(button!==0&&button!==1)||deck.length!==52||new Set(deck).size!==52||deck.some(c=>!Number.isInteger(c)||c<0||c>51))throw new Error('Invalid starting table');
  const s:Table={deck:[...deck],hole:[[],[]],community:[],stacks:[...stacks],start:[...stacks],committed:[0,0],streetBet:[0,0],acted:[false,false],button,actor:button,street:0,minRaise:10,over:false,winner:null,showdown:false,awarded:[0,0],log:[]};
  for(let i=0;i<2;i++){s.hole[other(button)].push(s.deck.shift()!);s.hole[button].push(s.deck.shift()!);}
  pay(s,button,Math.min(5,s.stacks[button]));pay(s,other(button),Math.min(10,s.stacks[other(button)]));
  s.log.push({zh:`按钮方交小盲 ${s.streetBet[button]}，另一方交大盲 ${s.streetBet[other(button)]}；这些已计入底池。`,en:`Button posts small blind ${s.streetBet[button]}, other player big blind ${s.streetBet[other(button)]}; both are already in the pot.`});
  if(s.stacks.some(n=>n===0)) {const owing=s.streetBet[0]<s.streetBet[1]?0:1;s.actor=owing;if(s.stacks[owing]===0||s.streetBet[0]===s.streetBet[1])runout(s);}
  return s;
}
function dealStreet(s:Table){s.street++;s.deck.shift();const n=s.street===1?3:1;for(let i=0;i<n;i++)s.community.push(s.deck.shift()!);s.streetBet=[0,0];s.acted=[false,false];s.minRaise=10;s.actor=other(s.button);s.log.push({zh:`进入${['','翻牌（三张公共牌）','转牌（第四张公共牌）','河牌（第五张公共牌）'][s.street]}，本轮投入重新从零计。`,en:`${['','Flop: three community cards','Turn: fourth community card','River: fifth community card'][s.street]}; street contributions reset to zero.`});}
function settle(s:Table,winner:Seat|'tie',showdown:boolean){
  // In heads-up play, any unmatched contribution is returned before awarding the pot.
  const excess=Math.abs(s.committed[0]-s.committed[1]);
  if(excess){const p:Seat=s.committed[0]>s.committed[1]?0:1;s.committed[p]-=excess;s.stacks[p]+=excess;s.log.push({zh:`退回无人跟上的 ${excess} 给${p===0?'你':'对手'}，不是额外赢得。`,en:`Return unmatched ${excess} to ${p===0?'you':'opponent'}; this is not winnings.`});}
  const pot=s.committed[0]+s.committed[1];s.awarded=winner==='tie'?[pot/2,pot/2]:winner===0?[pot,0]:[0,pot];
  s.stacks[0]+=s.awarded[0];s.stacks[1]+=s.awarded[1];s.over=true;s.winner=winner;s.showdown=showdown;
}
function showdown(s:Table){const c=compare(bestHand([...s.hole[0],...s.community]).score,bestHand([...s.hole[1],...s.community]).score);settle(s,c===0?'tie':c>0?0:1,true);}
function runout(s:Table){while(s.street<3)dealStreet(s);showdown(s);}
export function legalActions(s:Table){const p=s.actor,q=other(p),call=Math.min(s.stacks[p],Math.max(0,s.streetBet[q]-s.streetBet[p]));const high=Math.max(...s.streetBet);const maxTo=s.streetBet[p]+s.stacks[p];return {call,canCheck:call===0,minTo:high+s.minRaise,maxTo,canRaise:!s.over&&s.stacks[q]>0&&maxTo>high};}
export function actTable(state:Table,action:Action):Table {
  if(state.over)throw new Error('Hand already ended');
  if(!action||!['fold','check','call','raise'].includes(action.kind))throw new Error('Invalid action');
  const s:Table=structuredClone(state),p=s.actor,q=other(p),a=legalActions(s),name=p===0?'你':'对手',en=p===0?'You':'Opponent';
  if(action.kind==='fold'){s.log.push({zh:`${name}弃牌，放弃本手底池。`,en:`${en} folds and gives up the pot.`});settle(s,q,false);return s;}
  if(action.kind==='check'){if(!a.canCheck)throw new Error('Cannot check when facing a bet');s.acted[p]=true;s.log.push({zh:`${name}过牌：本轮没有差额要补，不投入筹码。`,en:`${en} checks: no outstanding difference, no chips added.`});}
  if(action.kind==='call'){if(!a.call)throw new Error('Nothing to call');pay(s,p,a.call);s.acted[p]=true;s.log.push({zh:`${name}跟注补 ${a.call}；只补差额，不是重交整笔。`,en:`${en} calls ${a.call}, paying only the missing amount.`});}
  if(action.kind==='raise'){
    if(!Number.isInteger(action.to)||!a.canRaise||action.to>a.maxTo||action.to<=Math.max(...s.streetBet)||(action.to<a.minTo&&action.to!==a.maxTo))throw new Error('Invalid raise total');
    const increase=action.to-Math.max(...s.streetBet),cost=action.to-s.streetBet[p];pay(s,p,cost);s.minRaise=Math.max(s.minRaise,increase);s.acted=[false,false];s.acted[p]=true;s.log.push({zh:`${name}本轮加到 ${action.to}，这次扣 ${cost}。`,en:`${en} raises this street total to ${action.to}; ${cost} added now.`});
  }
  const remaining:Seat=s.stacks[0]===0?1:0;
  if(s.stacks.some(n=>n===0)&&(s.stacks[remaining]===0||s.streetBet[remaining]>=s.streetBet[other(remaining)])){runout(s);return s;}
  if(s.acted.every(Boolean)&&s.streetBet[0]===s.streetBet[1]){if(s.street===3)showdown(s);else dealStreet(s);}else s.actor=q;
  return s;
}
/** Deliberately simple teaching opponent; never reads deck or the player's private cards. */
export function teachingBot(s:Table,random=Math.random):Action {
  const a=legalActions(s),own=s.hole[s.actor],pair=rank(own[0])===rank(own[1]),roll=random();
  if(a.canRaise&&pair&&roll<0.25)return {kind:'raise',to:Math.min(a.maxTo,a.minTo)};
  if(a.canCheck)return {kind:'check'};
  if(a.call>40&&!pair&&roll<0.35)return {kind:'fold'};
  return {kind:'call'};
}
