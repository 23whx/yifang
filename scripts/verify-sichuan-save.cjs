const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {readSichuanSave:read,writeSichuanSave:write,clearSichuanSave:clear,SICHUAN_SAVE_KEY:key}=require('../lib/mahjong/sichuan-save.ts');
function tab(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};}
const a=tab(),b=tab();assert.equal(read(a),null);
assert.deepEqual(write(a,'host','host-private-checkpoint'),read(a));assert.equal(read(b),null);
write(b,'guest','seat-only-checkpoint');assert.equal(read(a).role,'host');assert.equal(read(b).role,'guest');
const again=a;assert.equal(read(again).checkpoint,'host-private-checkpoint','Same tab refresh preserves stored value');
a.setItem('unrelated','keep');clear(a);assert.equal(read(a),null);assert.equal(a.getItem('unrelated'),'keep');assert.equal(read(b).role,'guest');
for(const value of ['{','null',JSON.stringify({version:2,role:'host',checkpoint:'x'}),JSON.stringify({version:1,role:'guest',checkpoint:5}),'x'.repeat(600001)]){a.setItem(key,value);assert.throws(()=>read(a));}
assert.throws(()=>write(b,'other','x'));assert.throws(()=>write(b,'host','x'.repeat(520001)));
const denied={getItem:()=>{throw Error('denied');},setItem:()=>{throw Error('quota');},removeItem:()=>{throw Error('denied');}};
assert.throws(()=>read(denied));assert.throws(()=>write(denied,'host','x'));assert.throws(()=>clear(denied));
assert.throws(()=>write({getItem:()=>null,setItem:()=>{},removeItem:()=>{}},'host','x'),'Silent storage failure must not report saved');
assert.throws(()=>clear({getItem:()=> 'retained',setItem:()=>{},removeItem:()=>{}}));
console.log('PASS: tab-isolated storage, retained readback, refresh reuse, scoped clearing, malformed/oversized save and denied/quota/silent-failure rejection. Fake Storage contract; native sessionStorage/refresh still requires browser acceptance.');
