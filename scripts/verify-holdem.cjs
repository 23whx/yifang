const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {scoreFive,bestHand,compare,newTable,actTable,legalActions,shuffle}=require('../lib/holdem.ts');
const c=(r,s=0)=>s*13+r-2;
assert.deepEqual(scoreFive([c(14),c(2),c(3),c(4),c(5)]),[8,5]);
assert.deepEqual(scoreFive([c(14),c(14,1),c(14,2),c(14,3),c(13)]),[7,14,13]);
assert.deepEqual(scoreFive([c(2),c(2,1),c(2,2),c(14),c(14,1)]),[6,2,14]);
assert.deepEqual(scoreFive([c(14),c(14,1),c(13),c(13,1),c(2)]),[2,14,13,2]);
assert.equal(compare(bestHand([c(14),c(14,1),c(14,2),c(13),c(13,1),c(13,2),c(2)]).score,[6,14,13]),0);
const royal=[c(10),c(11),c(12),c(13),c(14)];
assert.equal(compare(bestHand([...royal,c(2,1),c(3,1)]).score,bestHand([...royal,c(4,1),c(5,1)]).score),0);
let s=newTable();assert.equal(s.actor,0);assert.deepEqual(s.stacks,[195,190]);
assert.throws(()=>newTable([200,200],0,[...Array.from({length:52},(_,i)=>i),0]));
assert.throws(()=>newTable([200,200],2));
assert.throws(()=>newTable([200,200,200]));
assert.throws(()=>actTable(s,{kind:'unknown'}));
assert.throws(()=>actTable(s,null));
assert.throws(()=>actTable(s,{kind:'check'}));assert.throws(()=>actTable(s,{kind:'raise',to:15}));
s=actTable(s,{kind:'call'});assert.equal(s.actor,1);assert.equal(s.street,0);
s=actTable(s,{kind:'check'});assert.equal(s.actor,1);assert.equal(s.street,1);assert.equal(s.community.length,3);
let short=newTable([200,23]);short=actTable(short,{kind:'raise',to:200});assert.equal(short.actor,1);short=actTable(short,{kind:'call'});
assert.ok(short.over);assert.equal(short.community.length,5);assert.equal(short.stacks[0]+short.stacks[1],223);assert.deepEqual(short.committed,[23,23]);
for(const stacks of [[1,200],[200,1],[4,200],[200,4],[6,200],[200,6]]) {
 let t=newTable(stacks);for(let j=0;!t.over&&j<20;j++)t=actTable(t,{kind:legalActions(t).canCheck?'check':'call'});assert.ok(t.over);assert.equal(t.stacks[0]+t.stacks[1],stacks[0]+stacks[1]);
}
let seed=761;const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
for(let i=0;i<600;i++){
 let t=newTable([1+Math.floor(rnd()*300),1+Math.floor(rnd()*300)],i%2,shuffle(rnd));const total=t.start[0]+t.start[1];
 for(let turn=0;!t.over&&turn<100;turn++){
   const a=legalActions(t),r=rnd();const action=r<.08?{kind:'fold'}:a.canRaise&&r<.30?{kind:'raise',to:r<.15?a.maxTo:Math.min(a.maxTo,a.minTo)}:{kind:a.canCheck?'check':'call'};
   t=actTable(t,action);assert.ok(t.stacks.every(x=>Number.isInteger(x)&&x>=0));assert.equal(t.stacks[0]+t.stacks[1]+(t.over?0:t.committed[0]+t.committed[1]),total);
 }
 assert.ok(t.over,'must terminate');assert.equal(new Set([...t.hole.flat(),...t.community,...t.deck]).size,t.hole.flat().length+t.community.length+t.deck.length);
}
console.log('PASS: hand ranking, ace-low straight, board tie, blind turn order, illegal actions, short calls/refunds and 600 conserving heads-up hands.');
