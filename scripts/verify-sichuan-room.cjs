const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {validSichuanPayload}=require('../lib/mahjong/sichuan-wire.ts');
const {SichuanRoom}=require('../lib/mahjong/sichuan-room.ts');
const {validSichuanRequest}=require('../lib/mahjong/sichuan-request.ts');
const {sichuanTeachingAction}=require('../lib/mahjong/sichuan-teaching.ts');
const match='sichuan-test-room-0001',views=[],seq=[0,0,0,0],requests=[0,0,0,0];let frames=0,acks=0;
function receive(id,m){assert.equal(validSichuanPayload(m.payload,id),true,JSON.stringify(m.payload));assert.equal(m.recipient,id);assert.equal(m.sequence,++seq[id]);assert.equal(m.match,match);frames++;if(m.payload.kind==='view'){views[id]=m.payload.view;if(m.payload.view.stage==='play')for(let other=0;other<4;other++)if(other!==id&&!m.payload.view.round.players[other].retired)assert.deepEqual(m.payload.view.round.players[other].hand,[]);}if(m.payload.kind==='ack')acks++;}
const room=new SichuanRoom(match,m=>receive(0,m));assert.equal(room.start(),false);
for(let id=1;id<4;id++)assert.equal(room.join(id,m=>receive(id,m)),true);
assert.equal(room.start(Array.from({length:108},(_,i)=>i%27)),true);
let actions=0;
while(views[0].stage!=='play'||views[0].round.phase!=='ended'){
 assert.ok(actions++<500);const id=[0,1,2,3].find(i=>sichuanTeachingAction(views[i]));assert.notEqual(id,undefined);
 const move={revision:views[id].revision,action:sichuanTeachingAction(views[id])};assert.equal(validSichuanRequest(move),true);
 const msg={v:1,game:'sichuan-four',match,request:++requests[id],move};assert.equal(room.receive(id,msg),true);
 const revision=views[id].revision;assert.equal(room.receive(id,msg),false);assert.equal(views[id].revision,revision);
}
assert.equal(views[0].balances.reduce((a,b)=>a+b,0),0);
const last=JSON.stringify(views);room.leave(2);assert.equal(room.status,'closed');assert.equal(JSON.stringify(views),last);
assert.equal(room.receive(0,{}),false);
for(const action of [{kind:'ack',rules:{}},{kind:'exchange',tiles:[0,0,99]},{kind:'missing',suit:3},{kind:'discard',tile:-1},{kind:'claim',choice:'chow'}])assert.equal(validSichuanRequest({revision:0,action}),false);
assert.equal(validSichuanRequest({revision:0,action:{kind:'draw'},seat:2}),false);
const failed=new SichuanRoom('sichuan-failed-room',()=>{});failed.join(1,()=>{throw new Error('closed channel');});assert.equal(failed.status,'lobby');
const lateViews=[],lateFrames=[];let failAck=false;
const late=new SichuanRoom('sichuan-late-ack-room',m=>{lateFrames.push(m);if(m.payload.kind==='view')lateViews[0]=m.payload.view;});
for(let id=1;id<4;id++)late.join(id,m=>{if(m.payload.kind==='ack'&&failAck)throw Error('ack send failed');if(m.payload.kind==='view')lateViews[id]=m.payload.view;});
assert.equal(late.start(Array.from({length:108},(_,i)=>i%27)),true);
let lateSteps=0,lateRequest=0;
while(!lateViews.slice(1).some(v=>v&&sichuanTeachingAction(v))){
 assert.ok(++lateSteps<100,'Expected a guest action');
 const id=lateViews.findIndex(v=>v&&sichuanTeachingAction(v));assert.ok(id>=0);
 const move={revision:lateViews[id].revision,action:sichuanTeachingAction(lateViews[id])};
 assert.equal(late.receive(id,{v:1,game:'sichuan-four',match:late.match,request:++lateRequest,move}),true);
}
const actor=lateViews.findIndex((v,i)=>i>0&&v&&sichuanTeachingAction(v));
const beforeRevision=lateViews[0].revision,beforeActions=JSON.parse(late.recoveryArchive()).actions.length;
failAck=true;
assert.equal(late.receive(actor,{v:1,game:'sichuan-four',match:late.match,request:lateRequest+1,move:{revision:lateViews[actor].revision,action:sichuanTeachingAction(lateViews[actor])}}),true);
assert.equal(late.status,'closed');
assert.equal(lateViews[0].revision,beforeRevision,'Host view is stale after failed guest ack');
assert.equal(JSON.parse(late.recoveryArchive()).actions.length,beforeActions+1,'Private host journal retains the committed action');
assert.ok(lateFrames.some(m=>m.payload.kind==='closed'&&m.payload.player===actor));
console.log(`PASS: real four-seat setup-to-settlement room, ${actions} actions, ${frames} frames, ${acks} acknowledgements; seat privacy, sequence, replay rejection and disconnect retention. Mock senders, not WebRTC/UI proof.`);
