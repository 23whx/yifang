const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {HeadsUpPokerRoom:R}=require('../lib/holdem-headsup-room.ts');
const {validHeadsUpPayload}=require('../lib/holdem-headsup-wire.ts');
const deck=Array.from({length:52},(_,i)=>i),latest=[],seen=[],counts=[0,0];
function sender(seat,list=latest){return m=>{assert.equal(m.recipient,seat);assert.ok(validHeadsUpPayload(m.payload,seat));assert.ok(!/"(?:keys|archive|deck|checkpoint)":/.test(JSON.stringify(m)));seen.push(m);if(m.payload.kind==='view')list[seat]=m.payload.view;};}
const room=new R('poker-restoration-original',sender(0));for(let i=1;i<2;i++)room.join(i,sender(i));room.start(deck);
const initial=room.recoveryCheckpoint(),oldViews=latest.map(v=>JSON.stringify(v));
function request(r,views,seat,kind,id){return {v:1,game:'holdem-two',match:r.match,request:id,move:{hand:views[seat].hand,revision:views[seat].revision,action:{kind}}};}
const checkpoints=[];
for(let step=0;step<6;step++){const seat=latest[0].actor;assert.ok(room.receive(seat,request(room,latest,seat,latest[seat].legal.canCheck?'check':'call',++counts[seat])));checkpoints.push({text:room.recoveryCheckpoint(),views:structuredClone(latest)});}
let restoredCount=0;
for(const checkpoint of checkpoints){
 const out=[],r=R.restoreCheckpoint(checkpoint.text,sender(0,out));assert.equal(r.status,'lobby');assert.notEqual(r.match,room.match);assert.equal(r.recoveryIdentity,room.recoveryIdentity);
 assert.equal(r.join(1,sender(1,out)),false);assert.equal(r.start(),false);
 assert.equal(r.resume(1,'0'.repeat(64),oldViews[1],sender(1,out)),false);
 assert.equal(r.resume(1,room.recoveryCredential(0),oldViews[1],sender(1,out)),false);
 const tampered=JSON.parse(oldViews[1]);tampered.stacks[1]+=1;
 assert.equal(r.resume(1,room.recoveryCredential(1),JSON.stringify(tampered),sender(1,out)),false);
 assert.equal(r.resume(1,room.recoveryCredential(1),oldViews[0],sender(1,out)),false);
 assert.equal(r.resume(1,room.recoveryCredential(1),oldViews[1],sender(1,out)),true);
 assert.equal(r.resume(1,room.recoveryCredential(1),oldViews[1],sender(1,out)),false);
 assert.equal(r.receive(0,request(r,checkpoint.views,0,'fold',1)),false);
 for(let i=2;i<2;i++)assert.ok(r.resume(i,room.recoveryCredential(i),JSON.stringify(checkpoint.views[i]),sender(i,out)));
 assert.equal(r.start(deck),false);assert.ok(r.start());assert.deepEqual(out,checkpoint.views);
 const seat=out[0].actor,move=request(r,out,seat,out[seat].legal.canCheck?'check':'call',1),before=r.recoveryArchive();
 assert.equal(r.receive(seat,{...move,match:room.match}),false);assert.equal(r.recoveryArchive(),before);
 assert.ok(r.receive(seat,move));assert.equal(out[0].revision,checkpoint.views[0].revision+1);const after=r.recoveryArchive();assert.equal(r.receive(seat,move),false);assert.equal(r.recoveryArchive(),after);
 const again=R.restoreCheckpoint(r.recoveryCheckpoint(),()=>{});assert.equal(again.recoveryIdentity,r.recoveryIdentity);assert.notEqual(again.match,r.match);
 for(let i=1;i<2;i++)assert.ok(again.resume(i,r.recoveryCredential(i),JSON.stringify(out[i]),()=>{}));assert.ok(again.start());restoredCount++;
}
const stale=R.restoreCheckpoint(initial,()=>{});assert.equal(stale.resume(1,room.recoveryCredential(1),JSON.stringify(latest[1]),()=>{}),false,'host cannot roll a newer guest back');
const raw=JSON.parse(room.recoveryCheckpoint());for(const bad of [{...raw,game:'sichuan-room'},{...raw,version:2},{...raw,keys:Array(2).fill(raw.keys[0])},{...raw,keys:['bad',...raw.keys.slice(1)]},{...raw,extra:true}])assert.throws(()=>R.restoreCheckpoint(JSON.stringify(bad),()=>{}));
for(const key of raw.keys)assert.ok(!JSON.stringify(seen).includes(key));
for(const bad of [{...latest[1],deck},{...latest[1],stacks:[400,400]},{...latest[1],seat:0},{...latest[1],log:[{zh:'test',en:'test',deck}]}])assert.equal(validHeadsUpPayload({kind:'view',view:bad},1),false);
const lateViews=[],lateFrames=[];let failAck=false;
const late=new R('poker-late-ack-original',m=>{lateFrames.push(m);if(m.payload.kind==='view')lateViews[0]=m.payload.view;});
late.join(1,m=>{if(m.payload.kind==='ack'&&failAck)throw Error('ack send failed');if(m.payload.kind==='view')lateViews[1]=m.payload.view;});
assert.equal(late.start(deck),true);
let lateCount=0;
while(lateViews[0].actor!==1){
 assert.ok(++lateCount<10,'Expected a guest betting turn');
 const v=lateViews[0];assert.equal(late.receive(0,request(late,lateViews,0,v.legal.canCheck?'check':'call',lateCount)),true);
}
const beforeRevision=lateViews[0].revision,beforeActions=JSON.parse(late.recoveryArchive()).actions.length;
failAck=true;
assert.equal(late.receive(1,request(late,lateViews,1,lateViews[1].legal.canCheck?'check':'call',lateCount+1)),true);
assert.equal(late.status,'closed');
assert.equal(lateViews[0].revision,beforeRevision,'Host view is stale after failed guest ack');
assert.equal(JSON.parse(late.recoveryArchive()).actions.length,beforeActions+1,'Private host journal retains the committed bet');
assert.ok(lateFrames.some(m=>m.payload.kind==='closed'&&m.payload.player===1));
console.log(`PASS: ${restoredCount} two-seat frozen-room restores and continued actions, repeated recovery retains original identity with fresh epochs, exact guest history prefixes, wrong/cross-seat/duplicate credentials and altered/ahead views rejected, no private keys/decks in outgoing frames. Direct room API, not authenticated RTC or browser saves.`);
