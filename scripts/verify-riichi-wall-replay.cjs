const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const M=require('@kobalab/majiang-core');
const {RiichiSession}=require('../lib/mahjong/riichi-session.ts');
const {RiichiRecoverySession}=require('../lib/mahjong/riichi-recovery.ts');
const {riichiRules}=require('../lib/mahjong/riichi-player.ts');
const {riichiWallFromTiles,validateRiichiWall}=require('../lib/mahjong/riichi-wall.ts');
const old={setTimeout,clearTimeout,random:Math.random};
let next=0,seed=7421;const queue=new Map();
global.setTimeout=fn=>{const id=++next;queue.set(id,fn);return id;};global.clearTimeout=id=>queue.delete(id);
Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
function drain(){let n=0;while(queue.size){assert.ok(++n<60000);const [id,fn]=queue.entries().next().value;queue.delete(id);fn();}}
try{
 const rule=riichiRules(),original=new M.Shan(rule),tiles=[...original._pai],wall=riichiWallFromTiles(tiles,rule);
 tiles[0]='bad';assert.notEqual(wall._pai[0],'bad','input array must be detached');
 for(let i=0;i<4;i++){
  assert.equal(wall.zimo(),original.zimo());assert.equal(wall.gangzimo(),original.gangzimo());
  wall.kaigang();original.kaigang();assert.deepEqual(wall.baopai,original.baopai);
 }
 wall.close();original.close();assert.deepEqual(wall.fubaopai,original.fubaopai);
 const valid=new M.Shan(rule)._pai;
 for(const bad of [null,{},[],valid.slice(1),[...valid,'m1'],valid.map((v,i)=>i?'m1':v),valid.map((v,i)=>i?v:'m0'),valid.map((v,i)=>i?v:'z8')])assert.throws(()=>validateRiichiWall(bad));
 function run(source){
  const pending=[null,null,null,null],views=[null,null,null,null],events=[],walls=[];let summary=null,wallIndex=0;
  const session=new RiichiSession({onEvent:()=>{},onDecision:()=>{},onFinish:s=>summary=s,
   privateWalls:{...(source?{next:()=>{if(wallIndex>=source.length)throw Error('Replay wall missing');return source[wallIndex++];}}:{}),record:w=>{walls.push([...w]);w.fill('invalid');}},
   multiplayer:{onEvent:(seat,event)=>{events.push({seat,event});if(event.qipai)assert.equal(event.qipai.shoupai.filter(Boolean).length,1);if(event.jieju)assert.equal(event.jieju.log,undefined);},onState:(seat,v)=>views[seat]=v,onDecision:(seat,d)=>pending[seat]=d}
  });
  const snapshot=()=>JSON.stringify({pending,views,summary,status:session.status});
  session.start();drain();
  function apply(a){assert.ok(pending[a.seat]);assert.equal(pending[a.seat].revision,a.revision);pending[a.seat]=null;assert.equal(session.submitFor(a.seat,a.revision,a.choice),true);assert.equal(session.submitFor(a.seat,a.revision,a.choice),false);drain();}
  return {session,pending,views,events,walls,snapshot,apply,get summary(){return summary;}};
 }
 const live=run(),actions=[],snapshots=[live.snapshot()];let riichi=0,confirmations=0;
 while(live.session.status!=='finished'){
  assert.ok(actions.length<10000);const seat=live.pending.findIndex(Boolean);assert.ok(seat>=0,'engine must reach human decision or finish');
  const d=live.pending[seat],view=live.views[seat];
  let choice=d.choices.find(c=>['ron','tsumo','riichi','continue'].includes(c.kind));
  if(!choice){
   const discards=d.choices.filter(c=>c.kind==='discard');let best=Infinity;
   for(const c of discards){const distance=M.Util.xiangting(M.Shoupai.fromString(view.hands[view.seat]).dapai(c.value));if(distance<best){best=distance;choice=c;}}
   choice??=d.choices.find(c=>c.kind==='pass')??d.choices[0];
  }
  if(choice.kind==='riichi')riichi++;if(choice.kind==='continue')confirmations++;
  const a={seat,revision:d.revision,choice:choice.id};actions.push(a);live.apply(a);snapshots.push(live.snapshot());
 }
 assert.ok(live.walls.length>=4);assert.ok(confirmations>=16);assert.ok(riichi>0,'cover paid riichi declarations');
 Math.random=()=>{throw Error('Replay must never shuffle');};
 const replay=run(live.walls);assert.equal(replay.snapshot(),snapshots[0]);
 actions.forEach((a,i)=>{replay.apply(a);assert.equal(replay.snapshot(),snapshots[i+1],`Seat views, choices, counters and summary differ at action ${i+1}`);});
 assert.deepEqual(replay.events,live.events,'all private event projections replay identically');
 assert.deepEqual(replay.walls,live.walls);assert.deepEqual(replay.summary,live.summary);
 assert.equal(replay.summary.scores.reduce((a,b)=>a+b,0),100000);
 // Compare the controlled recovery queue with the existing asynchronous engine
 // after EVERY action, including half-confirmed results and riichi deposits.
 const log=new RiichiRecoverySession('riichi-replay-test',live.walls),checkpoints=[];
 const compare=(runner,index)=>{
  const expected=JSON.parse(snapshots[index]);
  for(let seat=0;seat<4;seat++){
   const v=runner.view(seat);assert.equal(v.revision,index);
   assert.deepEqual(v.view,expected.views[seat],`view ${index}/${seat}`);
   assert.deepEqual(v.decision,expected.pending[seat],`decision ${index}/${seat}`);
   assert.deepEqual(v.summary,expected.summary);assert.equal(runner.status,expected.status);
   if(v.event?.qipai)assert.equal(v.event.qipai.shoupai.filter(Boolean).length,1);
   if(v.event?.jieju)assert.equal(v.event.jieju.log,undefined);
  }
 };
 compare(log,0);checkpoints.push({index:0,text:log.checkpoint()});
 actions.forEach((a,i)=>{
  const before=log.checkpoint();assert.throws(()=>log.apply(a.seat,a.revision,'not-a-choice'));assert.equal(log.checkpoint(),before);
  log.apply(a.seat,a.revision,a.choice);compare(log,i+1);
  const after=log.checkpoint();assert.throws(()=>log.apply(a.seat,a.revision,a.choice));assert.equal(log.checkpoint(),after);
  if(i%70===0||a.choice==='continue'||a.choice.startsWith('riichi:')||i===actions.length-1)checkpoints.push({index:i+1,text:after});
 });
 for(const checkpoint of checkpoints){
  const restored=RiichiRecoverySession.restore(checkpoint.text);compare(restored,checkpoint.index);
  if(checkpoint.index<actions.length){
   const a=actions[checkpoint.index];
   // Supply the independently observed future wall only in the test fixture:
   // an actual resumed match may generate a new wall only for its next hand.
   if(a.choice!=='continue'){restored.apply(a.seat,a.revision,a.choice);compare(restored,checkpoint.index+1);}
   else {
    // The final consent may deal a genuinely new future wall. It must retain
    // the same scoring/round progression and its new archive must replay too.
    Math.random=old.random;restored.apply(a.seat,a.revision,a.choice);
    Math.random=()=>{throw Error('Restore must never shuffle');};
    const expected=JSON.parse(snapshots[checkpoint.index+1]);
    for(let id=0;id<4;id++)for(const field of ['scores','pot','honba','roundWind','handNumber','ids'])assert.deepEqual(restored.view(id).view[field],expected.views[id][field]);
    const again=RiichiRecoverySession.restore(restored.checkpoint());
    for(let id=0;id<4;id++)assert.deepEqual(again.view(id),restored.view(id));
    again.stop();
   }
  }
  restored.stop();
 }
 for(const index of [0,1,70,actions.length])assert.deepEqual(log.viewAt(2,index).view,JSON.parse(snapshots[index]).views[2]);
 const archive=JSON.parse(log.checkpoint());
 for(const bad of [{...archive,version:2},{...archive,preset:'other-rules'},{...archive,balance:[999,0,0,0]},{...archive,actions:[...archive.actions,archive.actions.at(-1)]},{...archive,walls:[...archive.walls,archive.walls[0]]},{...archive,walls:archive.walls.slice(1)}])assert.throws(()=>RiichiRecoverySession.restore(JSON.stringify(bad)));
 assert.throws(()=>RiichiRecoverySession.restore('x'.repeat(2000001)));
 console.log(`PASS: controlled recovery agrees with asynchronous engine at all ${actions.length+1} boundaries; ${checkpoints.length} checkpoints restored, legal next actions resumed, historical prefixes checked, duplicate/illegal actions leave archives unchanged, bad preset/extra state/wall/history rejected.`);
 assert.throws(()=>run([]),/Replay wall missing/);queue.clear();
 console.log(`PASS: ${actions.length} actions, ${live.walls.length} original walls, ${riichi} riichi declarations, ${confirmations} individual result confirmations replay with exact four-seat views/choices/events and final scores; no random use during replay, invalid inventories rejected, kong/hidden indicators match upstream. Fake scheduler; no UI/storage/network recovery claim.`);
}finally{global.setTimeout=old.setTimeout;global.clearTimeout=old.clearTimeout;Math.random=old.random;}
