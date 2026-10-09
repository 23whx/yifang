const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {SichuanRoom}=require('../lib/mahjong/sichuan-room.ts');
const {restoreSichuanRecovery:restore}=require('../lib/mahjong/sichuan-recovery.ts');
const {applySichuanSession:apply,sichuanSessionView:view}=require('../lib/mahjong/sichuan-session.ts');
const {sichuanTeachingAction:choose}=require('../lib/mahjong/sichuan-teaching.ts');
const views=[],requests=[0,0,0,0],match='sichuan-recovery-test';
let frames=0;
function receive(id,m){
 const wire=JSON.stringify(m);for(const key of ['"deck"','"actions"','"recovery"'])assert.ok(!wire.includes(key),`Private archive leaked: ${key}`);
 if(m.payload.kind==='view')views[id]=m.payload.view;frames++;
}
const room=new SichuanRoom(match,m=>receive(0,m));assert.equal(room.recoveryArchive(),null);
for(let id=1;id<4;id++)room.join(id,m=>receive(id,m));
room.start(Array.from({length:108},(_,i)=>i%27));
const initialViews=structuredClone(views);
let actions=0,resumptions=0,olderCheckpoint=null;
while(views[0].stage!=='play'||views[0].round.phase!=='ended'){
 assert.ok(actions++<500);
 const id=[0,1,2,3].find(i=>choose(views[i])),action=choose(views[id]);
 const archived=room.recoveryArchive(),restored=restore(archived);
 for(let seat=0;seat<4;seat++)assert.deepEqual(view(restored.session,seat),views[seat]);
 const move={revision:views[id].revision,action},expected=apply(restored.session,id,move.revision,action);
 const message={v:1,game:'sichuan-four',match,request:++requests[id],move};
 if(actions%20===0){
  const bundle=room.recoveryCheckpoint(),keys=[0,1,2,3].map(seat=>room.recoveryCredential(seat));
  assert.equal(new Set(keys).size,4);keys.forEach(key=>assert.match(key,/^[a-f0-9]{64}$/));
  const received=[],snapshots=[];
  const sink=seat=>m=>{received.push(m);if(m.payload.kind==='view')snapshots[seat]=m.payload.view;};
  const recovered=SichuanRoom.restoreCheckpoint(bundle,sink(0));
  assert.notEqual(recovered.match,room.match);assert.equal(recovered.status,'lobby');
  assert.equal(recovered.start(),false);assert.equal(recovered.join(1,sink(1)),false);
  for(const seat of [1,2,3]){
   assert.equal(recovered.resume(seat,keys[(seat+1)%4],JSON.stringify(views[seat]),sink(seat)),false);
   assert.equal(recovered.resume(seat,keys[seat],JSON.stringify(views[(seat+1)%4]),sink(seat)),false);
   assert.equal(recovered.resume(seat,keys[seat],JSON.stringify({...views[seat],revision:views[seat].revision+1}),sink(seat)),false);
  }
  assert.equal(received.length,0,'Rejected resume must not send any table data');
  for(const seat of [1,2,3]){
   // A guest may have missed the final broadcast. Verify its older exact view
   // against history, then send the current state only after all seats return.
   const seen=seat===3?initialViews[seat]:views[seat];
   assert.ok(recovered.resume(seat,keys[seat],JSON.stringify(seen),sink(seat)));
   assert.equal(recovered.resume(seat,keys[seat],JSON.stringify(seen),sink(seat)),false);
   assert.equal(recovered.receive(id,{...message,match:recovered.match}),false,'Frozen until explicit host continuation');
  }
  assert.equal(recovered.start([]),false,'Recovery must not accept a replacement deck');
  assert.ok(recovered.start());for(let seat=0;seat<4;seat++)assert.deepEqual(snapshots[seat],views[seat]);
  assert.equal(recovered.receive(id,message),false,'Old transport epoch rejected even at the right revision');
  assert.ok(recovered.receive(id,{...message,match:recovered.match,request:1}));
  for(let seat=0;seat<4;seat++)assert.deepEqual(snapshots[seat],view(expected,seat));
  for(const frame of received){const wire=JSON.stringify(frame);for(const key of keys)assert.ok(!wire.includes(key));assert.ok(!wire.includes('"deck"'));}
  if(olderCheckpoint){
   const stale=SichuanRoom.restoreCheckpoint(olderCheckpoint,sink(0));
   assert.equal(stale.resume(1,keys[1],JSON.stringify(views[1]),sink(1)),false,'A newer guest cannot resume an older host checkpoint');
  }
  olderCheckpoint=bundle;resumptions++;
 }
 assert.ok(room.receive(id,message));
 assert.deepEqual(restore(room.recoveryArchive()).session,expected,'Recovered state must continue identically');
 const after=room.recoveryArchive();assert.equal(room.receive(id,message),false);assert.equal(room.recoveryArchive(),after);
 assert.equal(restore(archived).archive.actions.length,actions-1,'Old serialized checkpoint is immutable');
}
const final=room.recoveryArchive(),restored=restore(final);
for(const mutate of [x=>{x.keys[1]=x.keys[2];},x=>{x.keys[1]='guess';},x=>{x.keys.pop();},x=>{x.previousMatch='bad';},x=>{x.game='mcr-room';},x=>{x.balance=999;}]){
 const bundle=JSON.parse(room.recoveryCheckpoint());mutate(bundle);assert.throws(()=>SichuanRoom.restoreCheckpoint(JSON.stringify(bundle),()=>{}));
}
assert.equal(restored.session.game.ledger.balances.reduce((a,b)=>a+b,0),0);
for(const mutate of [
 x=>{x.version=2;},x=>{x.game='riichi';},x=>{x.preset='different-preset';},x=>{x.dealer=4;},
 x=>{x.deck[0]=99;},x=>{x.deck[0]=x.deck[1];},x=>{x.balances=[999,0,0,0];},
 x=>{x.actions[0].seat=4;},x=>{x.actions[0].move.revision=7;},
 x=>{x.actions[0].move.action={kind:'draw'};},x=>{x.actions[0].move.action.rules={base:999};},
 x=>{x.actions.splice(1,0,x.actions[0]);},x=>{x.actions.splice(0,1);},
 x=>{x.actions[0].hiddenHands=[];},x=>{x.actions=Array(2001).fill(x.actions[0]);}
]){const tampered=JSON.parse(final);mutate(tampered);assert.throws(()=>restore(JSON.stringify(tampered)));}
assert.throws(()=>restore('x'.repeat(512001)));assert.throws(()=>restore('{'));
// No import may replace balances or trick us into posting terminal settlement twice.
for(let n=0;n<3;n++)assert.deepEqual(restore(final).session.game.ledger,restored.session.game.ledger);
room.leave(2);assert.equal(room.status,'closed');assert.equal(room.recoveryArchive(),final);
console.log(`PASS: ${actions} room checkpoints, ${resumptions} credential-bound frozen room restorations with identical continuation, wrong/duplicate seats and stale host/transport rejection; ${frames} original frames without private history, 17 malformed archives, no duplicate ledger. Core only: not browser persistence or native reconnect UI.`);
