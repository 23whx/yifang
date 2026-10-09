const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {settlePots}=require('../lib/holdem-pots.ts');
const sum=a=>a.reduce((x,y)=>x+y,0);
let result=settlePots([50,100,200],[false,false,false],[[3],[2],[1]],0);
assert.deepEqual(result.awards,[150,100,0]);assert.deepEqual(result.refunds,[0,0,100]);
assert.deepEqual(result.pots.map(p=>p.eligible),[[0,1,2],[1,2]]);
// A folded strongest hand contributes but cannot win.
result=settlePots([100,100,50],[true,false,false],[null,[1],[2]],0);
assert.deepEqual(result.awards,[0,100,150]);
// One odd chip goes clockwise from button, only among tied winners.
result=settlePots([5,5,5],[false,false,true],[[1],[1],null],0);
assert.deepEqual(result.awards,[7,8,0]);
result=settlePots([5,5,5],[false,false,true],[[1],[1],null],1);
assert.deepEqual(result.awards,[8,7,0]);
// Each pot splits separately; short-stack winner cannot claim the side pot.
result=settlePots([3,5,5,5],[false,false,false,true],[[2],[1],[1],null],0);
assert.deepEqual(result.awards,[12,3,3,0]);
for(const invalid of [
  ()=>settlePots([1,-1],[false,false],[[1],[1]],0),
  ()=>settlePots([1,1],[true,true],[null,null],0),
  ()=>settlePots([1,1],[false,false],[null,[1]],0),
  ()=>settlePots([1,2],[false,true],[[1],null],0),
  ()=>settlePots([Number.MAX_SAFE_INTEGER,1],[false,false],[[1],[1]],0),
  ()=>settlePots([1,1],[false,false],[[1],[1]],2),
])assert.throws(invalid);
let seed=717;
const random=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
for(let run=0;run<2000;run++) {
  const n=2+random(8), bets=Array.from({length:n},()=>random(1000)), highest=bets.indexOf(Math.max(...bets));
  const folded=bets.map((_,i)=>i!==highest&&random(3)===0), ranks=bets.map((_,i)=>folded[i]?null:[random(9),random(15)]);
  const before=JSON.stringify([bets,folded,ranks]);
  const out=settlePots(bets,folded,ranks,random(n));
  assert.equal(sum(out.awards)+sum(out.refunds),sum(bets));
  assert.equal(JSON.stringify([bets,folded,ranks]),before);
  out.awards.forEach((v,i)=>{assert.ok(Number.isSafeInteger(v)&&v>=0);if(folded[i])assert.equal(v,0);});
  for(const pot of out.pots) {
    assert.equal(sum(pot.shares),pot.amount);
    assert.ok(pot.winners.every(i=>!folded[i]&&bets[i]>=pot.cap));
  }
}
console.log('PASS: multiway side pots, short all-ins, refunds, folded ineligibility, per-pot ties/odd chips, invalid input and 2,000 deterministic conservation cases. Not yet a full multiplayer table.');
