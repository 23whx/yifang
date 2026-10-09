const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {MultiPokerRoom:R}=require('../lib/holdem-multi-room.ts');
const {validMultiPayload}=require('../lib/holdem-multi-wire.ts');
const deck=Array.from({length:52},(_,i)=>i),latest=[],seen=[],counts=[0,0,0,0];
function sender(seat,list=latest){return m=>{assert.equal(m.recipient,seat);assert.ok(validMultiPayload(m.payload,seat));assert.ok(!/"(?:keys|archive|deck|checkpoint)":/.test(JSON.stringify(m)));seen.push(m);if(m.payload.kind==='view')list[seat]=m.payload.view;};}
const room=new R('poker-restoration-original',sender(0));for(let i=1;i<4;i++)room.join(i,sender(i));room.start(deck);
const initial=room.recoveryCheckpoint(),oldViews=latest.map(v=>JSON.stringify(v));
function request(r,views,seat,kind,id){return {v:1,game:'holdem-four',match:r.match,request:id,move:{hand:views[seat].hand,revision:views[seat].revision,action:{kind}}};}
const checkpoints=[];
for(let step=0;step<8;step++){const seat=latest[0].actor;assert.ok(room.receive(seat,request(room,latest,seat,latest[seat].legal.canCheck?'check':'call',++counts[seat])));checkpoints.push({text:room.recoveryCheckpoint(),views:structuredClone(latest)});}
let restoredCount=0;
for(const checkpoint of checkpoints){
 const out=[],r=R.restoreCheckpoint(checkpoint.text,sender(0,out));assert.equal(r.status,'lobby');assert.notEqual(r.match,room.match);assert.equal(r.recoveryIdentity,room.recoveryIdentity);
 assert.equal(r.join(1,sender(1,out)),false);assert.equal(r.start(),false);
 assert.equal(r.resume(1,'0'.repeat(64),oldViews[1],sender(1,out)),false);
 assert.equal(r.resume(1,room.recoveryCredential(2),oldViews[1],sender(1,out)),false);
 const tampered=JSON.parse(oldViews[1]);tampered.stacks[1]+=1;
 assert.equal(r.resume(1,room.recoveryCredential(1),JSON.stringify(tampered),sender(1,out)),false);
 assert.equal(r.resume(1,room.recoveryCredential(1),oldViews[2],sender(1,out)),false);
 assert.equal(r.resume(1,room.recoveryCredential(1),oldViews[1],sender(1,out)),true);
 assert.equal(r.resume(1,room.recoveryCredential(1),oldViews[1],sender(1,out)),false);
 assert.equal(r.receive(0,request(r,checkpoint.views,0,'fold',1)),false);
 for(let i=2;i<4;i++)assert.ok(r.resume(i,room.recoveryCredential(i),JSON.stringify(checkpoint.views[i]),sender(i,out)));
 assert.equal(r.start(deck),false);assert.ok(r.start());assert.deepEqual(out,checkpoint.views);
 const seat=out[0].actor,move=request(r,out,seat,out[seat].legal.canCheck?'check':'call',1),before=r.recoveryArchive();
 assert.equal(r.receive(seat,{...move,match:room.match}),false);assert.equal(r.recoveryArchive(),before);
 assert.ok(r.receive(seat,move));assert.equal(out[0].revision,checkpoint.views[0].revision+1);const after=r.recoveryArchive();assert.equal(r.receive(seat,move),false);assert.equal(r.recoveryArchive(),after);
 const again=R.restoreCheckpoint(r.recoveryCheckpoint(),()=>{});assert.equal(again.recoveryIdentity,r.recoveryIdentity);assert.notEqual(again.match,r.match);
 for(let i=1;i<4;i++)assert.ok(again.resume(i,r.recoveryCredential(i),JSON.stringify(out[i]),()=>{}));assert.ok(again.start());restoredCount++;
}
const stale=R.restoreCheckpoint(initial,()=>{});assert.equal(stale.resume(1,room.recoveryCredential(1),JSON.stringify(latest[1]),()=>{}),false,'host cannot roll a newer guest back');
const raw=JSON.parse(room.recoveryCheckpoint());for(const bad of [{...raw,game:'sichuan-room'},{...raw,version:2},{...raw,keys:Array(4).fill(raw.keys[0])},{...raw,keys:['bad',...raw.keys.slice(1)]},{...raw,extra:true}])assert.throws(()=>R.restoreCheckpoint(JSON.stringify(bad),()=>{}));
for(const key of raw.keys)assert.ok(!JSON.stringify(seen).includes(key));
console.log(`PASS: ${restoredCount} four-seat frozen-room restores and continued actions, repeated recovery retains original identity with fresh epochs, exact guest history prefixes, wrong/cross-seat/duplicate credentials and altered/ahead views rejected, no private keys/decks in outgoing frames. Direct room API, not authenticated RTC or browser saves.`);
