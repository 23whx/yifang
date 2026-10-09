const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
const {RiichiRoomHost}=require('../lib/mahjong/riichi-room.ts');
const {readRiichiGuestRecovery}=require('../lib/mahjong/riichi-manual.ts');
const {readRiichiSave:read,writeRiichiSave:write,clearRiichiSave:clear,RIICHI_SAVE_KEY:key}=require('../lib/mahjong/riichi-save.ts');
function tab(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};}
const tabs=Array.from({length:4},tab),views=[],receive=i=>m=>{if(m.payload.kind==='checkpoint')views[i]=m.payload.snapshot;};
const room=new RiichiRoomHost('riichi-save-real-checkpoint',receive(0));for(let i=1;i<4;i++)room.join(i,receive(i));room.start();
write(tabs[0],'host',room.recoveryCheckpoint());
for(let i=1;i<4;i++)write(tabs[i],'guest',JSON.stringify({version:1,game:'riichi-guest',match:room.recoveryIdentity,seat:i,key:room.recoveryCredential(i),lastView:JSON.stringify(views[i])}));
const restored=RiichiRoomHost.restoreCheckpoint(read(tabs[0]).checkpoint,()=>{});
for(let i=1;i<4;i++){const save=readRiichiGuestRecovery(read(tabs[i]).checkpoint);assert.equal(save.seat,i);assert.ok(restored.resume(i,save.key,save.lastView,()=>{}));assert.ok(!save.lastView.includes('deck'));}
assert.ok(restored.start());assert.equal(read(tab()),null);
tabs[0].setItem('unrelated','keep');clear(tabs[0]);assert.equal(read(tabs[0]),null);assert.equal(tabs[0].getItem('unrelated'),'keep');assert.equal(read(tabs[1]).role,'guest');
for(const bad of ['{','null',JSON.stringify({version:2,role:'host',checkpoint:'x'}),JSON.stringify({version:1,role:'guest',checkpoint:4}),JSON.stringify({version:1,role:'host',checkpoint:'x',invitation:'private'}),'x'.repeat(2300001)]){tabs[0].setItem(key,bad);assert.throws(()=>read(tabs[0]));}
for(const [role,value] of [['bad','x'],['guest','x'.repeat(62001)],['host','x'.repeat(2020001)],['host','']])assert.throws(()=>write(tabs[0],role,value));
const denied={getItem(){throw Error('denied');},setItem(){throw Error('quota');},removeItem(){throw Error('denied');}};
assert.throws(()=>read(denied));assert.throws(()=>write(denied,'host','x'));assert.throws(()=>clear(denied));
assert.throws(()=>write({getItem:()=>null,setItem(){},removeItem(){}},'guest','x'));
assert.throws(()=>clear({getItem:()=> 'retained',setItem(){},removeItem(){}}));
console.log('PASS: four tab-isolated real host/guest save envelopes restore original seats, role bounds, unrelated key preservation, malformed/oversized/extra-field rejection, denied/quota/silent storage failure. Fake Storage, no native browser persistence claim.');

})().catch(e=>{console.error(e);process.exitCode=1;});
