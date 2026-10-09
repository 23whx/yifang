const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {MultiPokerRoom}=require('../lib/holdem-multi-room.ts');
const {readPokerGuestRecovery}=require('../lib/holdem-multi-manual.ts');
const {readMultiPokerSave:read,writeMultiPokerSave:write,clearMultiPokerSave:clear,MULTI_POKER_SAVE_KEY:key}=require('../lib/holdem-multi-save.ts');
function tab(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};}
const tabs=Array.from({length:4},tab),views=[],receive=i=>m=>{if(m.payload.kind==='view')views[i]=m.payload.view;};
const room=new MultiPokerRoom('poker-save-real-checkpoint',receive(0));for(let i=1;i<4;i++)room.join(i,receive(i));room.start(Array.from({length:52},(_,i)=>i));
write(tabs[0],'host',room.recoveryCheckpoint());
for(let i=1;i<4;i++)write(tabs[i],'guest',JSON.stringify({version:1,game:'holdem-guest',match:room.recoveryIdentity,seat:i,key:room.recoveryCredential(i),lastView:JSON.stringify(views[i])}));
const restored=MultiPokerRoom.restoreCheckpoint(read(tabs[0]).checkpoint,()=>{});
for(let i=1;i<4;i++){const save=readPokerGuestRecovery(read(tabs[i]).checkpoint);assert.equal(save.seat,i);assert.ok(restored.resume(i,save.key,save.lastView,()=>{}));assert.ok(!save.lastView.includes('deck'));}
assert.ok(restored.start());assert.equal(read(tab()),null);
tabs[0].setItem('unrelated','keep');clear(tabs[0]);assert.equal(read(tabs[0]),null);assert.equal(tabs[0].getItem('unrelated'),'keep');assert.equal(read(tabs[1]).role,'guest');
for(const bad of ['{','null',JSON.stringify({version:2,role:'host',checkpoint:'x'}),JSON.stringify({version:1,role:'guest',checkpoint:4}),JSON.stringify({version:1,role:'host',checkpoint:'x',invitation:'private'}),'x'.repeat(2300001)]){tabs[0].setItem(key,bad);assert.throws(()=>read(tabs[0]));}
for(const [role,value] of [['bad','x'],['guest','x'.repeat(62001)],['host','x'.repeat(2020001)],['host','']])assert.throws(()=>write(tabs[0],role,value));
const denied={getItem(){throw Error('denied');},setItem(){throw Error('quota');},removeItem(){throw Error('denied');}};
assert.throws(()=>read(denied));assert.throws(()=>write(denied,'host','x'));assert.throws(()=>clear(denied));
assert.throws(()=>write({getItem:()=>null,setItem(){},removeItem(){}},'guest','x'));
assert.throws(()=>clear({getItem:()=> 'retained',setItem(){},removeItem(){}}));
console.log('PASS: four tab-isolated real host/guest save envelopes restore original seats, role bounds, unrelated key preservation, malformed/oversized/extra-field rejection, denied/quota/silent storage failure. Fake Storage, no native browser persistence claim.');
