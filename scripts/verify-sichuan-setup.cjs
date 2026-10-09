const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {newSichuanSetup,chooseSichuanExchange,chooseSichuanMissing,sichuanSetupView}=require('../lib/mahjong/sichuan-setup.ts');
const deck=Array.from({length:108},(_,i)=>Math.floor(i/4));
for(const direction of [1,2,3])for(let dealer=0;dealer<4;dealer++){
 let s=newSichuanSetup(deck,dealer,direction),initial=structuredClone(s);
 assert.equal(s.wall.length,55);assert.equal(s.hands[dealer].length,14);
 const chosen=s.hands.map(h=>[0,1,2].map(suit=>h.filter(t=>Math.floor(t/9)===suit)).find(h=>h.length>=3).slice(0,3));
 for(let id=0;id<4;id++){
  s=chooseSichuanExchange(s,id,chosen[id]);
  assert.throws(()=>chooseSichuanExchange(s,id,chosen[id]));
  if(id<3)assert.deepEqual(s.hands,initial.hands);
 }
 for(let id=0;id<4;id++){
  const expected=[...initial.hands[id]];for(const t of chosen[id])expected.splice(expected.indexOf(t),1);
  expected.push(...chosen[(id-direction+4)%4]);
  assert.deepEqual([...s.hands[id]].sort((a,b)=>a-b),expected.sort((a,b)=>a-b));
  s=chooseSichuanMissing(s,id,id%3);
  if(id<3)assert.equal(sichuanSetupView(s,3).missing[0],null);
 }
 assert.equal(s.phase,'ready');assert.deepEqual(sichuanSetupView(s,0).missing,[0,1,2,0]);
 assert.deepEqual([...s.hands.flat(),...s.wall].sort((a,b)=>a-b),deck);
 const view=sichuanSetupView(s,0);assert.equal('wall' in view,false);assert.equal('hands' in view,false);
 view.hand[0]=99;assert.notEqual(s.hands[0][0],99);
 assert.deepEqual(initial,newSichuanSetup(deck,dealer,direction));
}
assert.throws(()=>newSichuanSetup(deck.slice(1)));
const s=newSichuanSetup(deck);assert.throws(()=>chooseSichuanExchange(s,0,[0,9,18]));
assert.throws(()=>chooseSichuanExchange(s,0,[26,26,26]));
assert.throws(()=>chooseSichuanMissing(s,0,0));
assert.equal(newSichuanSetup(deck,0,1,false).phase,'missing');
console.log('PASS: all 12 dealer/direction setups, simultaneous exchange, missing-suit privacy, inventory, immutable choices and invalid input guards. Setup only, not a full hand engine.');
