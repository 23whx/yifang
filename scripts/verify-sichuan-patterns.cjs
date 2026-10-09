const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {sichuanPatternValue:score}=require('../lib/mahjong/sichuan-patterns.ts');
const cases=[
 ['basic',1,[0,1,2,3,4,5,9,10,11,12,13,14,8,8]],
 ['all-pungs',2,[0,0,0,3,3,3,9,9,9,12,12,12,8,8]],
 ['pure-suit',4,[0,1,2,1,2,3,4,5,6,6,7,8,4,4]],
 ['pure-pungs',8,[0,0,0,2,2,2,4,4,4,6,6,6,8,8]],
 ['jiang-pungs',8,[1,1,1,4,4,4,10,10,10,13,13,13,7,7]],
 ['seven-pairs',4,[0,0,2,2,4,4,6,6,9,9,11,11,13,13]],
 ['pure-pairs',16,[0,0,1,1,2,2,3,3,4,4,5,5,6,6]],
 ['dragon-pairs',16,[0,0,0,0,2,2,4,4,9,9,11,11,13,13]],
 ['pure-dragon-pairs',32,[0,0,0,0,2,2,4,4,5,5,6,6,8,8]],
 ['terminals',4,[0,1,2,6,7,8,9,10,11,15,16,17,0,0]],
 ['pure-terminals',64,[0,1,2,0,1,2,6,7,8,8,8,8,0,0]],
];
for(const [pattern,multiplier,hand] of cases){const r=score(hand,[],2);assert.equal(r.pattern,pattern);assert.equal(r.multiplier,multiplier);assert.deepEqual(score([...hand].reverse(),[],2),r);}
assert.equal(score(cases[0][2],[],0),null);
// Also decomposable as terminals, but dragon pairs is worth more.
assert.equal(score([0,1,2,0,1,2,6,7,8,6,7,8,0,0],[],2).pattern,'pure-dragon-pairs');
assert.equal(score([0,1,2],[],2),null);
const doubleDragon=score([0,0,0,0,2,2,2,2,9,9,11,11,13,13],[],2);
assert.equal(doubleDragon.pattern,'dragon-pairs');assert.equal(doubleDragon.roots,1);assert.equal(doubleDragon.multiplier,32);
const kong=score([3,3,3,9,9,9,12,12,12,8,8],[{kind:'kong',tiles:[0,0,0,0],open:true}],2);
assert.equal(kong.pattern,'all-pungs');assert.equal(kong.multiplier,4);
assert.throws(()=>score([...cases[0][2],0,0,0,0],[],2));
console.log('PASS: 11 named pattern fixtures, ambiguous pure-pairs, quad/root accounting, declared kong, ordering invariance and missing-suit/inventory guards. Pattern value only; no event or payment scoring.');
