const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict'),M=require('@kobalab/majiang-core');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {RiichiRoomHost:R}=require('../lib/mahjong/riichi-room.ts');
const {validRiichiPayload}=require('../lib/mahjong/riichi-wire.ts');
const originalRandom=Math.random;let seed=7421;
Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
try{
 const views=[],frames=[],requests=[0,0,0,0];
 const receiver=(id,into=views)=>m=>{
  assert.equal(m.recipient,id);assert.ok(validRiichiPayload(m.payload,id));
  assert.ok(!/"(?:keys|archive|walls|privateWalls)":/.test(JSON.stringify(m)));frames.push(m);
  if(m.payload.kind==='checkpoint')into[id]=m.payload.snapshot;
 };
 const room=new R('riichi-room-recovery',receiver(0));for(let id=1;id<4;id++)room.join(id,receiver(id));assert.ok(room.start());
 const checkpoints=[],record=()=>checkpoints.push({text:room.recoveryCheckpoint(),views:structuredClone(views)});record();
 const req=(r,id,d,choice,n)=>({v:1,game:'riichi',match:r.match,request:n,revision:d.revision,choice});
 let steps=0,confirms=0,riichi=0;
 while(room.status!=='finished'){
  assert.ok(++steps<10000);const id=views.findIndex(v=>v.decision),v=views[id],d=v.decision;assert.ok(id>=0);
  let chosen=d.choices.find(c=>['ron','tsumo','riichi','continue'].includes(c.kind));
  if(!chosen){let best=Infinity;for(const c of d.choices.filter(c=>c.kind==='discard')){const n=M.Util.xiangting(M.Shoupai.fromString(v.view.hands[v.view.seat]).dapai(c.value));if(n<best){best=n;chosen=c;}}chosen??=d.choices.find(c=>c.kind==='pass')??d.choices[0];}
  const before=room.recoveryCheckpoint(),bad=req(room,id,d,'not-a-choice',++requests[id]);assert.equal(room.receive(id,bad),false);assert.equal(room.recoveryCheckpoint(),before);
  const message=req(room,id,d,chosen.id,++requests[id]);assert.ok(room.receive(id,message));const after=room.recoveryCheckpoint();assert.equal(room.receive(id,message),false);assert.equal(room.recoveryCheckpoint(),after);
  if(chosen.kind==='riichi')riichi++;if(chosen.kind==='continue')confirms++;
  if(steps===10||chosen.kind==='riichi'&&riichi===1||chosen.kind==='continue'&&confirms<=4)record();
 }
 record();assert.ok(riichi>0);assert.ok(confirms>=16);
 for(const check of checkpoints){
  const restoredViews=[],restored=R.restoreCheckpoint(check.text,receiver(0,restoredViews));
  assert.notEqual(restored.match,room.match);assert.equal(restored.recoveryIdentity,room.recoveryIdentity);assert.equal(restored.status,'lobby');
  assert.equal(restored.join(1,()=>{}),false);assert.equal(restored.start(),false);
  const text=id=>JSON.stringify(check.views[id]);
  assert.equal(restored.resume(1,room.recoveryCredential(2),text(1),()=>{}),false);
  assert.equal(restored.resume(2,room.recoveryCredential(2),text(1),()=>{}),false);
  const altered=structuredClone(check.views[1]);altered.view.scores[1]+=1;
  assert.equal(restored.resume(1,room.recoveryCredential(1),JSON.stringify(altered),()=>{}),false);
  if(check.views[1].revision<views[1].revision)assert.equal(restored.resume(1,room.recoveryCredential(1),JSON.stringify(views[1]),()=>{}),false);
  for(let id=1;id<4;id++)assert.ok(restored.resume(id,room.recoveryCredential(id),text(id),receiver(id,restoredViews)));
  assert.equal(restored.resume(1,room.recoveryCredential(1),text(1),()=>{}),false);
  assert.equal(restoredViews.length,0,'no private state before explicit start');assert.ok(restored.start());assert.deepEqual(restoredViews,check.views);
  assert.equal(restored.recoveryCheckpoint(),check.text,'start must not reshuffle or change settlements');
  if(restored.status==='playing'){
   const id=restoredViews.findIndex(v=>v.decision),d=restoredViews[id].decision;
   const message=req(restored,id,d,d.choices[0].id,1);
   assert.equal(restored.receive(id,{...message,match:room.match}),false);
   assert.ok(restored.receive(id,message));
   const nextViews=[],again=R.restoreCheckpoint(restored.recoveryCheckpoint(),receiver(0,nextViews));
   for(let i=1;i<4;i++)assert.ok(again.resume(i,restored.recoveryCredential(i),JSON.stringify(restoredViews[i]),receiver(i,nextViews)));
   assert.ok(again.start());assert.deepEqual(nextViews,restoredViews);
  }else assert.ok(restoredViews.every(v=>v.summary&&v.decision===null));
  const saved=restored.recoveryCheckpoint();restored.leave(1);assert.equal(restored.recoveryCheckpoint(),saved,'departure must not change the journal');
 }
 for(const m of frames)for(let id=0;id<4;id++)assert.ok(!JSON.stringify(m).includes(room.recoveryCredential(id)));
 const raw=JSON.parse(room.recoveryCheckpoint());
 for(const bad of [{...raw,version:2},{...raw,keys:raw.keys.map(()=>raw.keys[0])},{...raw,extra:true}])assert.throws(()=>R.restoreCheckpoint(JSON.stringify(bad),()=>{}));
 console.log(`PASS: ${steps} live room actions, ${checkpoints.length} initial/mid/riichi/partial-confirm/final restores and continuations; fresh transport match, original seats, frozen lobby, private projection equality, wrong-key/seat/future/tampered/old-match rejection, no secret/wall in frames and no repeated settlement. Room API, not authenticated RTC/UI proof.`);
}finally{Math.random=originalRandom;}
