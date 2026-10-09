const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {boardSaveKey:key,parseBoardSave:parse,readBoardSave:read,writeBoardSave:write,clearBoardSave:clear}=require('../lib/board/recovery-save.ts');
const tab=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};};
const a=tab(),b=tab();
for(const game of ['chess','xiangqi','shogi','go']){
 const value={version:1,game,role:'host',secret:'a'.repeat(64),checkpoint:'rules-replay-required'};
 assert.equal(read(a,game),null);assert.deepEqual(write(a,value),value);assert.deepEqual(read(a,game),value);assert.equal(read(b,game),null);
 for(const bad of [{...value,game:'invalid'},{...value,role:'other'},{...value,secret:'bad'},{...value,checkpoint:5},{...value,checkpoint:'x'.repeat(1500001)},{...value,invitation:'not-stored'},{...value,version:2}])assert.throws(()=>parse(JSON.stringify(bad),game));
 assert.throws(()=>parse('{',game));assert.throws(()=>parse('x'.repeat(4000001),game));
 write(b,{...value,role:'guest'});clear(a,game);assert.equal(read(a,game),null);assert.equal(read(b,game).role,'guest');
 a.setItem('other-data','preserve');assert.equal(a.getItem('other-data'),'preserve');
 const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('quota');},removeItem(){throw Error('blocked');}};
 assert.throws(()=>read(blocked,game));assert.throws(()=>write(blocked,value));assert.throws(()=>clear(blocked,game));
 assert.throws(()=>write({getItem:()=>null,setItem(){},removeItem(){}},value));
 assert.throws(()=>clear({getItem:()=> 'not-cleared',setItem(){},removeItem(){}},game));
}
assert.equal(new Set(['chess','xiangqi','shogi','go'].map(key)).size,4);assert.throws(()=>key('invalid'));
console.log('PASS: four game-scoped save envelopes, tab isolation, retained readback, scoped clearing, malformed/oversized/cross-game/extra-field/credential rejection and blocked/quota/silent storage failures. Fake Storage; no browser persistence claim.');
