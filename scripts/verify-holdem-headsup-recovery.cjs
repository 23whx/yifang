const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {HeadsUpPokerRecovery:S}=require('../lib/holdem-headsup-recovery.ts');
const {newPokerSession,applyPokerRequest,pokerView}=require('../lib/holdem-remote.ts');
const deck=offset=>Array.from({length:52},(_,i)=>(i+offset)%52);
let checks=0;
for(const mode of ['check-call','fold','all-in']){
 const s=new S(`headsup-recovery-${mode}`,deck(0));let reference=newPokerSession(deck(0));
 const history=[ [s.view(0),s.view(1)] ];
 function step(seat,action,nextDeck){
  const v=s.view(seat),move={hand:v.hand,revision:v.revision,action},restored=S.restore(s.checkpoint());
  s.apply(seat,move,nextDeck);restored.apply(seat,move,nextDeck);reference=applyPokerRequest(reference,seat,move,nextDeck);
  assert.equal(restored.checkpoint(),s.checkpoint());
  for(const id of [0,1]){
   const view=s.view(id);assert.deepEqual(view,pokerView(reference,id));assert.deepEqual(restored.view(id),view);
   assert.equal('deck' in view,false);assert.equal('table' in view,false);
   assert.equal(view.opponentCards.length,view.over&&view.showdown?2:0);
   assert.equal(view.stacks.reduce((a,b)=>a+b,0)+(view.over?0:view.committed.reduce((a,b)=>a+b,0)),400);
  }
  history.push([s.view(0),s.view(1)]);checks++;
 }
 for(let hand=0;hand<4;hand++){
  assert.equal(s.view(0).button,hand%2);let guard=0;
  while(!s.view(0).over){
   assert.ok(++guard<100);const v=s.view(s.view(0).actor),l=v.legal;
   step(v.seat,mode==='fold'?{kind:'fold'}:mode==='all-in'&&l.canRaise?{kind:'raise',to:l.maxTo}:{kind:l.canCheck?'check':'call'});
  }
  const ended=s.view(0),before=s.checkpoint();
  assert.throws(()=>s.apply(0,{hand:ended.hand,revision:ended.revision,action:{kind:'check'}}));assert.equal(s.checkpoint(),before);
  if(ended.stacks.some(n=>n===0))break;
  for(const seat of [0,1]){
   const v=s.view(seat),req={hand:v.hand,revision:v.revision,action:{kind:'next'}},pre=s.checkpoint();
   if(seat===1){assert.throws(()=>s.apply(seat,req));assert.throws(()=>s.apply(seat,req,Array(52).fill(0)));}
   else assert.throws(()=>s.apply(seat,req,deck(1)));
   assert.equal(s.checkpoint(),pre);step(seat,{kind:'next'},seat===1?deck(hand+1):undefined);
   if(seat===0){const vote=s.view(0),saved=s.checkpoint();assert.throws(()=>s.apply(0,{hand:vote.hand,revision:vote.revision,action:{kind:'next'}}));assert.equal(s.checkpoint(),saved);}
  }
 }
 for(let revision=0;revision<history.length;revision++)for(const seat of [0,1])assert.deepEqual(s.viewAt(seat,revision),history[revision][seat]);
 assert.throws(()=>s.viewAt(0,history.length));assert.throws(()=>s.viewAt(1,-1));
 const raw=JSON.parse(s.checkpoint());
 for(const bad of [{...raw,game:'holdem-four'},{...raw,stacks:[400,0]},{...raw,deck:Array(52).fill(1)},{...raw,version:2},{...raw,actions:[...raw.actions,raw.actions[0]]}])assert.throws(()=>S.restore(JSON.stringify(bad)));
 const original=s.checkpoint(),v=s.view(0);v.ownCards.fill(99);v.stacks.fill(0);assert.equal(s.checkpoint(),original);
}
const s=new S('headsup-invalid-actions',deck(0)),before=s.checkpoint();
for(const seat of [-1,2,3,NaN])assert.throws(()=>s.apply(seat,{hand:1,revision:0,action:{kind:'call'}}));
for(const action of [{kind:'raise',to:25,extra:1},{kind:'fold',paid:100},{kind:'call',to:20}])assert.throws(()=>s.apply(0,{hand:1,revision:0,action}));
assert.equal(s.checkpoint(),before);
assert.throws(()=>S.restore('x'.repeat(2000001)));assert.throws(()=>S.restore('{'));
console.log(`PASS two-seat recovery: ${checks} legal action/replay/continuation checks, exact historical seat projections, alternating blinds, partial and duplicate next votes, deterministic deck gating, 400-chip conservation and archive rejection. Host-private module only, not page recovery.`);
