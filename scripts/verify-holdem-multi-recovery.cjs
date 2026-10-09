const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {MultiPokerRecovery:S}=require('../lib/holdem-multi-recovery.ts');
const {newMultiSession,applyMultiRequest,multiView}=require('../lib/holdem-multi-session.ts');
const deck=offset=>Array.from({length:52},(_,i)=>(i+offset)%52);
let checks=0;
for(const mode of ['check-call','fold','all-in']){
 const s=new S(`poker-recovery-${mode}`,deck(0));let reference=newMultiSession([200,200,200,200],0,deck(0));
 function step(seat,action,nextDeck){
  const v=s.view(seat),move={hand:v.hand,revision:v.revision,action},restored=S.restore(s.checkpoint());
  s.apply(seat,move,nextDeck);restored.apply(seat,move,nextDeck);reference=applyMultiRequest(reference,seat,move,nextDeck);
  assert.equal(restored.checkpoint(),s.checkpoint());
  for(let id=0;id<4;id++){
   assert.deepEqual(s.view(id),multiView(reference,id));assert.deepEqual(restored.view(id),s.view(id));
   const view=s.view(id);assert.equal('deck' in view,false);assert.equal('burned' in view,false);
   for(let p=0;p<4;p++)if(p!==id&&(!view.showdown||view.folded[p]))assert.equal(view.cards[p].length,0);
  }
  const t=reference.table;assert.equal(t.stacks.reduce((a,b)=>a+b,0)+(t.over?0:t.committed.reduce((a,b)=>a+b,0)),800);checks++;
 }
 for(let hand=0;hand<4;hand++){
  let guard=0;
  while(!s.view(0).over){
   assert.ok(++guard<100);const v=s.view(s.view(0).actor),l=v.legal;
   const action=mode==='fold'?{kind:'fold'}:mode==='all-in'&&l.canRaise?{kind:'raise',to:l.maxTo}:{kind:l.canCheck?'check':'call'};
   step(v.seat,action);
  }
  const ended=s.view(0),before=s.checkpoint();
  assert.throws(()=>s.apply(0,{hand:ended.hand,revision:ended.revision,action:{kind:'check'}}));assert.equal(s.checkpoint(),before);
  if(ended.stacks.filter(n=>n>0).length<2)break;
  const voters=ended.stacks.map((n,i)=>n>0?i:-1).filter(i=>i>=0);
  for(const [i,seat] of voters.entries()){
   const v=s.view(seat),req={hand:v.hand,revision:v.revision,action:{kind:'next'}},pre=s.checkpoint();
   if(i===voters.length-1){assert.throws(()=>s.apply(seat,req));assert.throws(()=>s.apply(seat,req,Array(52).fill(0)));}
   else assert.throws(()=>s.apply(seat,req,deck(1)));
   assert.equal(s.checkpoint(),pre);step(seat,{kind:'next'},i===voters.length-1?deck(hand+1):undefined);
  }
 }
 const raw=JSON.parse(s.checkpoint());
 for(const bad of [{...raw,game:'holdem-two'},{...raw,stacks:[800,0,0,0]},{...raw,deck:Array(52).fill(1)},{...raw,version:2},{...raw,actions:[...raw.actions,raw.actions[0]]}])assert.throws(()=>S.restore(JSON.stringify(bad)));
 const original=s.checkpoint(),v=s.view(0);v.cards[0].fill(99);v.stacks.fill(0);assert.equal(s.checkpoint(),original);
}
const s=new S('poker-invalid-actions',deck(0));
for(const action of [{kind:'raise',to:25,extra:1},{kind:'fold',paid:100},{kind:'call',to:20}])assert.throws(()=>s.apply(3,{hand:1,revision:0,action}));
assert.throws(()=>S.restore('x'.repeat(2000001)));assert.throws(()=>S.restore('{'));
console.log(`PASS four-seat poker recovery: ${checks} legal action/replay/continuation checks across check-call, fold and all-in hands; deterministic next-hand deck gating, conservation of 800 chips, precise session/view comparison, hidden-card projection and malformed/duplicate archive rejection. Host-private module, not online/UI recovery.`);
