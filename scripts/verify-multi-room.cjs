const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {MultiPokerRoom}=require('../lib/holdem-multi-room.ts');
const {validMultiPayload}=require('../lib/holdem-multi-wire.ts');
const {MultiPokerRecovery}=require('../lib/holdem-multi-recovery.ts');
const deck=Array.from({length:52},(_,i)=>i),messages=[[],[],[],[]],latest=[],seq=[0,0,0,0],requests=[0,0,0,0];
const sender=i=>m=>{assert.equal(m.recipient,i);assert.equal(m.sequence,++seq[i]);assert.equal(validMultiPayload(m.payload,i),true,'all actual room frames validate');messages[i].push(m);if(m.payload.kind==='view'){latest[i]=m.payload.view;assert.equal(latest[i].seat,i);}};
const room=new MultiPokerRoom('test-four-room-001',sender(0));
assert.throws(()=>room.recoveryArchive());
function replay(){const restored=MultiPokerRecovery.restore(room.recoveryArchive());for(let i=0;i<4;i++)assert.deepEqual(restored.view(i),latest[i]);}
assert.equal(room.start(deck),false);assert.equal(room.join(0,sender(0)),false);
for(let i=1;i<4;i++)assert.equal(room.join(i,sender(i)),true);
assert.equal(room.join(1,sender(1)),false);assert.equal(room.start(deck),true);assert.equal(room.start(deck),false);
replay();
for(let i=0;i<4;i++)for(let j=0;j<4;j++)assert.equal(latest[i].cards[j].length,i===j?2:0);
const request=(i,action)=>({v:1,game:'holdem-four',match:room.match,request:++requests[i],move:{hand:latest[i].hand,revision:latest[i].revision,action}});
const initialArchive=room.recoveryArchive();
const bad=request(0,{kind:'fold'});assert.equal(room.receive(0,bad),false,'not active actor');assert.equal(room.recoveryArchive(),initialArchive);
assert.equal(room.receive(0,{...bad,match:'other-match-123'}),false);
let steps=0;
while(!latest[0].over){assert.ok(++steps<100);const i=latest[0].actor,a=latest[i].legal,r=request(i,a.canCheck?{kind:'check'}:{kind:'call'});assert.equal(room.receive(i,r),true);replay();const revision=latest[0].revision,archive=room.recoveryArchive();assert.equal(room.receive(i,r),false);assert.equal(latest[0].revision,revision);assert.equal(room.recoveryArchive(),archive);}
assert.equal(latest[0].showdown,true);assert.equal(latest[0].stacks.reduce((a,b)=>a+b,0),800);
for(let i=0;i<4;i++) {assert.equal(room.receive(i,request(i,{kind:'next'}),deck),true);assert.equal(latest[0].hand,i===3?2:1);replay();if(i===0){const saved=room.recoveryArchive();assert.equal(room.receive(i,request(i,{kind:'next'})),true);assert.equal(room.recoveryArchive(),saved);}}
const archived=JSON.parse(room.recoveryArchive());assert.deepEqual(archived.deck,deck);assert.equal(archived.actions.filter(e=>e.deck).length,1);assert.deepEqual(archived.actions.at(-1).deck,deck);
for(const stream of messages)for(const frame of stream)assert.ok(!/"(?:deck|archive|checkpoint|burned)":/.test(JSON.stringify(frame)),'private recovery material must not enter any outgoing frame');
const frozen=JSON.stringify(latest);room.leave(2);assert.equal(room.status,'closed');assert.equal(JSON.stringify(latest),frozen,'no synthetic fold or award');
replay();
for(let i=0;i<4;i++)assert.deepEqual(messages[i].at(-1).payload,{kind:'closed',player:2});
assert.equal(room.receive(latest[0].actor,request(latest[0].actor,{kind:'fold'})),false);
// Sender failure closes the whole room without leaking a later view to peers.
const fail=new MultiPokerRoom('test-four-room-002',()=>{});for(let i=1;i<4;i++)fail.join(i,m=>{if(i===1&&m.payload.kind==='view')throw new Error('disconnected');});
assert.equal(fail.start(deck),false);assert.equal(fail.status,'closed');
const lobby=new MultiPokerRoom('test-four-room-003',()=>{});assert.equal(lobby.join(1,()=>{}),true);lobby.leave(1);assert.equal(lobby.status,'lobby');assert.equal(lobby.join(1,()=>{}),true);
const lateViews=[],lateFrames=[];let failAck=false;
const late=new MultiPokerRoom('test-four-room-004',m=>{lateFrames.push(m);if(m.payload.kind==='view')lateViews[0]=m.payload.view;});
for(let i=1;i<4;i++)late.join(i,m=>{if(m.payload.kind==='ack'&&failAck)throw Error('ack send failed');if(m.payload.kind==='view')lateViews[i]=m.payload.view;});
assert.equal(late.start(deck),true);
let lateSteps=0;
while(lateViews[0].actor===0){
 assert.ok(++lateSteps<100,'Expected a guest betting turn');
 const v=lateViews[0],a=v.legal;
 assert.equal(late.receive(0,{v:1,game:'holdem-four',match:late.match,request:lateSteps,move:{hand:v.hand,revision:v.revision,action:a.canCheck?{kind:'check'}:{kind:'call'}}}),true);
}
const actor=lateViews[0].actor,guest=lateViews[actor],beforeRevision=lateViews[0].revision;
const beforeActions=JSON.parse(late.recoveryArchive()).actions.length;
failAck=true;
assert.equal(late.receive(actor,{v:1,game:'holdem-four',match:late.match,request:lateSteps+1,move:{hand:guest.hand,revision:guest.revision,action:guest.legal.canCheck?{kind:'check'}:{kind:'call'}}}),true);
assert.equal(late.status,'closed');
assert.equal(lateViews[0].revision,beforeRevision,'Host view is stale after failed guest ack');
assert.equal(JSON.parse(late.recoveryArchive()).actions.length,beforeActions+1,'Private host journal retains the committed bet');
assert.ok(lateFrames.some(m=>m.payload.kind==='closed'&&m.payload.player===actor));
console.log(`PASS: four-bound-seat room, ${steps} real betting decisions, privacy, message sequences, duplicate/actor guards, four-way next-hand consent, disconnect retention and send failure. Transport/UI still pending.`);
