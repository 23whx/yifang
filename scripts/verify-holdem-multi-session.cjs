const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {newMultiSession,applyMultiRequest,multiView}=require('../lib/holdem-multi-session.ts');
const {multiLegal}=require('../lib/holdem-multi.ts');
const deck=Array.from({length:52},(_,i)=>i);
let seed=42;const random=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
let views=0;
for(let run=0;run<150;run++) {
  const n=2+random(8);let s=newMultiSession(Array.from({length:n},()=>30+random(200)),random(n),deck);
  while(true) {
    for(let seat=0;seat<n;seat++) {
      const before=JSON.stringify(s),v=JSON.parse(JSON.stringify(multiView(s,seat)));
      assert.ok(!('table'in v)&&!('deck'in v)&&!('burned'in v)&&!('actedAt'in v));
      for(let i=0;i<n;i++)assert.deepEqual(v.cards[i],i===seat||(s.table.showdown&&!s.table.folded[i])?s.table.hole[i]:[]);
      assert.equal(v.legal!==null,!s.table.over&&s.table.actor===seat);
      v.cards[seat].push(99);v.stacks[0]=-99;assert.equal(JSON.stringify(s),before);
      const direct=multiView(s,seat);direct.cards[seat].push(88);direct.next[0]=!direct.next[0];assert.equal(JSON.stringify(s),before,'projection detached without relying on serialization');
      views++;
    }
    if(s.table.over)break;
    const actor=s.table.actor,a=multiLegal(s.table),r=random(10);
    const action=r===0?{kind:'fold'}:a.canRaise&&r<3?{kind:'raise',to:Math.min(a.maxTo,a.minTo)}:a.canCheck?{kind:'check'}:{kind:'call'};
    const request={hand:s.hand,revision:s.revision,action};
    assert.throws(()=>applyMultiRequest(s,(actor+1)%n,request));
    const previous=s; s=applyMultiRequest(s,actor,request);
    assert.equal(s.revision,previous.revision+1);
    assert.throws(()=>applyMultiRequest(s,actor,request),'replayed request rejected');
  }
  const funded=s.table.stacks.flatMap((v,i)=>v>0?[i]:[]);
  if(funded.length<2)continue;
  const hand=s.hand,stacks=[...s.table.stacks];
  for(let i=0;i<funded.length;i++) {
    s=applyMultiRequest(s,funded[i],{hand:s.hand,revision:s.revision,action:{kind:'next'}},deck);
    assert.equal(s.hand,i===funded.length-1?hand+1:hand,'all funded seats must consent');
  }
  assert.deepEqual(s.table.start,stacks);assert.ok(s.next.every(x=>!x));
}
const s=newMultiSession([100,100,100,100],0,deck);
const altered=structuredClone(s);
[altered.table.hole[1][0],altered.table.deck[0]]=[altered.table.deck[0],altered.table.hole[1][0]];
assert.deepEqual(multiView(altered,0),multiView(s,0),'changing unseen cards cannot affect the recipient view');
for(const bad of [null,{}, {hand:1,revision:0,action:{kind:'raise',to:NaN}}, {hand:0,revision:0,action:{kind:'fold'}}])assert.throws(()=>applyMultiRequest(s,s.table.actor,bad));
assert.throws(()=>multiView(s,-1));assert.throws(()=>multiView(s,4));
console.log(`PASS: ${views} serialized seat views across 150 hands, hidden-card redaction, detached copies, actor/revision guards and unanimous funded-seat next-hand consent.`);
