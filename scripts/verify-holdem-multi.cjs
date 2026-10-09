const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {newMultiTable,actMulti,multiLegal,nextMultiHand}=require('../lib/holdem-multi.ts');
const deck=Array.from({length:52},(_,i)=>i),sum=a=>a.reduce((x,y)=>x+y,0);
let s=newMultiTable([100,100,100,100],0,deck);
assert.equal(s.actor,3);assert.deepEqual(s.bets,[0,5,10,0]);
for(const p of [3,0,1])s=actMulti(s,p,{kind:'call'});
assert.equal(s.actor,2);assert.equal(multiLegal(s).canCheck,true,'big blind keeps option');
s=actMulti(s,2,{kind:'check'});assert.equal(s.street,1);assert.equal(s.actor,1);
assert.equal(s.community.length,3);assert.equal(s.burned.length,1);
// A short raise does not reopen the prior caller, but an unacted player can raise.
s=newMultiTable([100,15,100],0,deck);
s=actMulti(s,0,{kind:'call'});s=actMulti(s,1,{kind:'raise',to:15});
assert.equal(multiLegal(s).canRaise,true);s=actMulti(s,2,{kind:'call'});
assert.equal(s.actor,0);assert.equal(multiLegal(s).canRaise,false);
assert.throws(()=>actMulti(s,0,{kind:'raise',to:30}));
s=actMulti(s,0,{kind:'call'});assert.equal(s.street,1);
// Two cumulative short all-ins together reopen a full raise for the original bettor.
s=newMultiTable([25,30,100,100],0,deck);
s=actMulti(s,3,{kind:'raise',to:20});s=actMulti(s,0,{kind:'raise',to:25});s=actMulti(s,1,{kind:'raise',to:30});s=actMulti(s,2,{kind:'call'});
assert.equal(s.actor,3);assert.equal(multiLegal(s).canRaise,true);assert.equal(multiLegal(s).minTo,40);
assert.throws(()=>actMulti(s,2,{kind:'fold'}),'wrong actor');
assert.throws(()=>actMulti(s,3,{kind:'raise',to:31}),'non-all-in underraise');
// Heads-up and short blind runouts.
s=newMultiTable([5,100],0,deck);assert.equal(s.over,true);assert.equal(s.showdown,true);assert.equal(sum(s.stacks),105);assert.equal(s.refunds[1],5);
s=newMultiTable([100,100],0,deck);assert.equal(s.actor,0);s=actMulti(s,0,{kind:'fold'});assert.equal(s.over,true);assert.equal(s.community.length,0);assert.equal(s.refunds[1],5);
let seed=91;const random=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
let hands=0;
for(let run=0;run<600;run++) {
  const n=2+random(8),initial=Array.from({length:n},()=>1+random(350));
  s=newMultiTable(initial,random(n),deck);let count=0;
  while(!s.over) {
    assert.ok(++count<500,'hand terminates');
    assert.equal(sum(s.stacks)+sum(s.committed),sum(initial));
    assert.ok(!s.folded[s.actor]&&s.stacks[s.actor]>0);
    const a=multiLegal(s),r=random(12);
    const action=r===0?{kind:'fold'}:a.canRaise&&r<4?{kind:'raise',to:r===1?a.maxTo:Math.min(a.maxTo,a.minTo)}:a.canCheck?{kind:'check'}:{kind:'call'};
    const old=JSON.stringify(s);const next=actMulti(s,s.actor,action);assert.equal(JSON.stringify(s),old);s=next;
  }
  assert.equal(sum(s.stacks),sum(initial));assert.ok(s.stacks.every(v=>Number.isSafeInteger(v)&&v>=0));
  if(s.showdown){assert.equal(s.community.length,5);assert.equal(s.burned.length,3);}
  const allCards=[...s.deck,...s.burned,...s.community,...s.hole.flat()];assert.equal(allCards.length,52);assert.equal(new Set(allCards).size,52);
  assert.throws(()=>actMulti(s,0,{kind:'fold'}));
  if(s.stacks.filter(v=>v>0).length>1){const next=nextMultiHand(s,deck);assert.deepEqual(next.start,s.stacks);assert.notEqual(next.button,s.button);}
  hands++;
}
console.log(`PASS: ${hands} multi-seat hands; blinds/turns, short/cumulative all-ins, immutable actions, deck inventory, runouts/refunds, conservation and next-hand continuity.`);
