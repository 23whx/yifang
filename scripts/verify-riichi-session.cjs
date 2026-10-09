const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {RiichiSession}=require('../lib/mahjong/riichi-session.ts');
const saved={setTimeout,clearTimeout,random:Math.random};
let seq=0,clock=0,seed=127,timers=new Map();
global.setTimeout=(f,ms=0)=>{const id=++seq;timers.set(id,{f,time:clock+ms});return id;};
global.clearTimeout=id=>timers.delete(id);
Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
const drain=()=>{let steps=0;while(timers.size){assert.ok(++steps<50000);const [id,t]=[...timers].sort((a,b)=>a[1].time-b[1].time||a[0]-b[0])[0];timers.delete(id);clock=t.time;t.f();}};
try{
  let events=0,prompt;
  const paused=new RiichiSession({onEvent:()=>events++,onDecision:d=>prompt=d,onFinish:()=>assert.fail('cancelled session finished'),thinkMs:0});
  assert.equal(paused.start(),true);assert.equal(paused.start(),false);drain();
  assert.ok(prompt,'wait for human without automatically discarding');
  const before=events;paused.stop();paused.stop();drain();
  assert.equal(events,before);assert.equal(paused.submit(prompt.revision,prompt.choices[0].id),false);assert.equal(paused.start(),false);
  let finished,choices=0,starts=0,heldResult,heldOnce=false;
  const session=new RiichiSession({thinkMs:0,onEvent:event=>{
    if(event.qipai){starts++;assert.equal(event.qipai.shoupai.filter(Boolean).length,1);}
    if(event.jieju)assert.equal(event.jieju.log,undefined);
  },onDecision:d=>{
    choices++;
    if(!heldOnce&&d.choices.some(c=>c.kind==='continue')){heldResult=d;heldOnce=true;return;}
    const chosen=d.choices.find(c=>['ron','tsumo','continue'].includes(c.kind))||d.choices.find(c=>c.kind==='discard')||d.choices.find(c=>c.kind==='pass')||d.choices[0];
    assert.equal(session.submit(d.revision,chosen.id),true);
    assert.equal(session.submit(d.revision,chosen.id),false);
  },onFinish:summary=>finished=summary});
  session.start();drain();
  assert.ok(heldResult,'human explicitly acknowledges the first result');
  assert.equal(finished,undefined);
  const heldStarts=starts;drain();assert.equal(starts,heldStarts,'result must not auto-advance');
  assert.equal(session.submit(heldResult.revision,'continue'),true);drain();
  assert.equal(session.status,'finished');assert.ok(finished);assert.ok(starts>=4);assert.ok(choices>0);
  assert.equal(finished.scores.reduce((a,b)=>a+b,0),100000);
  assert.deepEqual([...finished.ranks].sort(),[1,2,3,4]);
  assert.equal(session.submit(1,'continue'),false);assert.equal(session.start(),false);assert.equal(timers.size,0);
  const immediate=new RiichiSession({onEvent:()=>assert.fail('late event'),onDecision:()=>assert.fail('late prompt'),onFinish:()=>assert.fail('late finish')});
  immediate.start();immediate.stop();drain();
  assert.throws(()=>new RiichiSession({thinkMs:NaN}));
  console.log(`Riichi session PASS: cancellation before dispatch and during human input, duplicate start/submit, ${starts} rounds with three private-hand practice opponents, explicit result acknowledgements and conserved match settlement. Fake scheduler, not browser proof.`);
}finally{global.setTimeout=saved.setTimeout;global.clearTimeout=saved.clearTimeout;Math.random=saved.random;}
