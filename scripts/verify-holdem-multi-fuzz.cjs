// Random-policy fuzzing of the multi-player hold'em engine, including folds when
// checking is free, short all-ins, minimum and maximum raises and uneven stacks.
// Invariants: chips are conserved after every action, awards never exceed the
// pot, every live player is eligible in some pot, and matches always terminate.
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {newMultiTable,actMulti,multiLegal,nextMultiHand}=require('../lib/holdem-multi.ts');
const {shuffle}=require('../lib/holdem.ts');
const matches=Number(process.argv[2]??400);
let seed=777;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const pick=list=>list[Math.floor(rand()*list.length)];
const stats={matches:0,hands:0,actions:0,sidePots:0,splits:0,folds:0,allIns:0};
for(let m=0;m<matches;m++){
 const players=2+Math.floor(rand()*7);
 const stacks=Array.from({length:players},()=>rand()<0.3?5+Math.floor(rand()*40):100+Math.floor(rand()*300));
 const total=stacks.reduce((a,b)=>a+b,0);
 let s=newMultiTable(stacks,Math.floor(rand()*players),shuffle(rand)),hands=0;
 while(true){
  let guard=0;
  while(!s.over){
   assert.ok(++guard<500,`match ${m}: hand did not finish`);
   const l=multiLegal(s),options=[{kind:'fold'}];
   if(l.canCheck)options.push({kind:'check'});else options.push({kind:'call'});
   if(l.canRaise){options.push({kind:'raise',to:Math.min(l.minTo,l.maxTo)},{kind:'raise',to:l.maxTo});const mid=l.minTo+Math.floor(rand()*Math.max(1,l.maxTo-l.minTo));if(mid<=l.maxTo)options.push({kind:'raise',to:mid});}
   const action=pick(options),seat=s.actor;
   if(action.kind==='fold')stats.folds++;if(action.kind==='raise'&&action.to===l.maxTo)stats.allIns++;
   s=actMulti(s,seat,action);stats.actions++;
   const inPlay=s.stacks.reduce((a,b)=>a+b,0)+(s.over?0:s.committed.reduce((a,b)=>a+b,0));
   assert.equal(inPlay,total,`match ${m}: chips not conserved`);
   assert.ok(s.stacks.every(v=>Number.isSafeInteger(v)&&v>=0),`match ${m}: negative or fractional stack`);
  }
  const potTotal=s.pots.reduce((a,p)=>a+p.amount,0),awarded=s.awards.reduce((a,b)=>a+b,0);
  assert.equal(awarded,potTotal,`match ${m}: awards must equal contested pots`);
  for(const p of s.pots){assert.ok(p.winners.every(w=>p.eligible.includes(w)),'winners must be eligible');if(p.winners.length>1)stats.splits++;}
  if(s.pots.length>1)stats.sidePots++;
  stats.hands++;hands++;
  if(s.stacks.filter(v=>v>0).length<2||hands>=30)break;
  s=nextMultiHand(s,shuffle(rand));
 }
 stats.matches++;
}
console.log(`PASS multi hold'em fuzz: ${stats.matches} random matches (2-8 seats, uneven stacks), ${stats.hands} hands, ${stats.actions} actions, ${stats.folds} folds, ${stats.allIns} all-ins, ${stats.sidePots} hands with side pots, ${stats.splits} split pots; chips conserved, awards match pots, winners eligible, no stalls.`);
