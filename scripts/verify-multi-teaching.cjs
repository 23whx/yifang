const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {newMultiSession,multiView,applyMultiRequest}=require('../lib/holdem-multi-session.ts');
const {multiTeachingAction,multiResultText}=require('../lib/holdem-multi-teaching.ts');
let seed=71;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
for(let run=0;run<100;run++) {
  let s=newMultiSession([50,100,150,200],run%4),steps=0;
  while(!s.table.over){assert.ok(++steps<300);const seat=s.table.actor,v=multiView(s,seat),action=multiTeachingAction(v,random());s=applyMultiRequest(s,seat,{hand:s.hand,revision:s.revision,action});}
  assert.equal(s.table.stacks.reduce((a,b)=>a+b,0),500);
  for(const locale of ['zh','en']) {
    const result=multiResultText(multiView(s,0),locale);
    for(const pot of s.table.pots)assert.ok(result.includes(String(pot.amount)));
    assert.ok(result.includes(String(s.table.stacks[0])));
    assert.ok(result.includes(locale==='zh'?'净变化':'net change'));
  }
}
const s=newMultiSession(),v=multiView(s,s.table.actor),changed=structuredClone(v);
changed.cards=changed.cards.map((c,i)=>i===v.seat?c:[51,50]);
assert.deepEqual(multiTeachingAction(v,0.1),multiTeachingAction(changed,0.1),'opponent logic ignores other seat hands even if supplied');
assert.equal(multiResultText(v,'zh'),'');
assert.throws(()=>multiTeachingAction(multiView(s,(s.table.actor+1)%4)));
console.log('PASS: 100 full view-only teaching-opponent hands, chip conservation, bilingual per-pot results and no opponent-hand dependency. UI/browser acceptance pending.');
