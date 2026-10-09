const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {decomposeHand,structuralWaits,readyDiscards,countsOf,tileKind}=require('../lib/mahjong/shape.ts');
const hand=s=>s.split(' ').map(tileKind);
const base=hand('一万 二万 三万 四万 五万 六万 二筒 三筒 四筒 六条 七条 八条 东');
assert.deepEqual(structuralWaits(base),[27]);
assert.equal(decomposeHand([...base,27])[0].kind,'standard');
assert.equal(decomposeHand(base).length,0);
assert.throws(()=>countsOf([0,0,0,0,0]));assert.throws(()=>countsOf([-1]));assert.throws(()=>countsOf([34]));
assert.throws(()=>decomposeHand([],[],{variant:'unknown'}));
assert.throws(()=>decomposeHand([], [{kind:'chow',tiles:[7,8,9],open:true}]));
assert.throws(()=>decomposeHand([], [{kind:'chow',tiles:[27,28,29],open:true}]));
assert.throws(()=>decomposeHand([], [{kind:'pung',tiles:[1,1,2],open:true}]));
assert.throws(()=>decomposeHand([], [{kind:'kong',tiles:[1,1,1],open:false}]));
const seven=hand('一万 一万 四万 四万 七万 七万 二筒 二筒 五筒 五筒 八筒 八筒 东 东');
assert.ok(decomposeHand(seven).some(s=>s.kind==='seven-pairs'));
const quadPairs=hand('一万 一万 一万 一万 四万 四万 七万 七万 二筒 二筒 五筒 五筒 八筒 八筒');
assert.ok(!decomposeHand(quadPairs).some(s=>s.kind==='seven-pairs'));
assert.ok(decomposeHand(quadPairs,[],{variant:'mcr'}).some(s=>s.kind==='seven-pairs'));
assert.ok(decomposeHand(quadPairs,[],{variant:'sichuan',missingSuit:2}).some(s=>s.kind==='seven-pairs'));
const thirteen=[0,8,9,17,18,26,27,28,29,30,31,32,33];
assert.deepEqual(structuralWaits(thirteen),thirteen);
assert.ok(decomposeHand([...thirteen,0]).some(s=>s.kind==='thirteen-orphans'));
assert.throws(()=>decomposeHand([...thirteen,0],[],{variant:'sichuan'}));
const noFive=[0,0,0,0,1,2,9,10,11,18,19,20,27];
assert.ok(!structuralWaits(noFive).includes(0),'cannot wait on a fifth copy');
const kong={kind:'kong',tiles:[27,27,27,27],open:false};
const kongHand=hand('一万 二万 三万 四万 五万 六万 七万 八万 九万 白 白');
assert.ok(decomposeHand(kongHand,[kong]).some(s=>s.kind==='standard'));
assert.equal(decomposeHand(kongHand.slice(1),[kong]).length,0);
assert.throws(()=>decomposeHand([...kongHand.slice(0,-1),27],[kong]));
const knitted=[0,3,6,10,13,16,20,23,26];
const knitFull=[...knitted,27,27,27,33,33];
assert.ok(decomposeHand(knitFull,[],{variant:'mcr'}).some(s=>s.kind==='knitted-straight'));
assert.equal(decomposeHand(knitFull).length,0);
assert.ok(decomposeHand([...knitted,33,33],[kong],{variant:'mcr'}).some(s=>s.kind==='knitted-straight'));
const greater=[...knitted.slice(0,7),27,28,29,30,31,32,33];
assert.ok(decomposeHand(greater,[],{variant:'mcr'}).some(s=>s.kind==='honors-knitted'&&s.honors===7));
assert.equal(decomposeHand(greater).length,0);
assert.equal(decomposeHand([...greater.slice(0,-1),0],[],{variant:'mcr'}).length,0);
const sc=hand('一万 二万 三万 四万 五万 六万 二筒 三筒 四筒 六筒 七筒 八筒 五万');
assert.ok(structuralWaits(sc,[],{variant:'sichuan',missingSuit:2}).includes(4));
assert.equal(decomposeHand([...sc,4],[],{variant:'sichuan',missingSuit:0}).length,0);
assert.throws(()=>decomposeHand([], [{kind:'chow',tiles:[0,1,2],open:true}],{variant:'sichuan'}));
assert.deepEqual(readyDiscards([...sc,26],[],{variant:'sichuan',missingSuit:2}).map(s=>s.discard),[26]);
const option=readyDiscards([...base,28]).find(s=>s.discard===28);
assert.deepEqual(option.waits,[27]);assert.equal(option.unseen,3);
assert.equal(readyDiscards([...base,28],[],{variant:'riichi'},[27,27,27]).find(s=>s.discard===28).unseen,0);
// Independent boolean solver: choose groups first, then require the final pair.
function referenceStandard(tiles){
  const c=Array(34).fill(0);for(const t of tiles)c[t]++;
  function solve(groups){
    if(groups===4)return c.filter(n=>n>0).length===1&&c.includes(2);
    for(let i=0;i<34;i++) {
      if(c[i]>=3){c[i]-=3;const ok=solve(groups+1);c[i]+=3;if(ok)return true;}
      if(i<27&&i%9<7&&c[i]&&c[i+1]&&c[i+2]){c[i]--;c[i+1]--;c[i+2]--;const ok=solve(groups+1);c[i]++;c[i+1]++;c[i+2]++;if(ok)return true;}
    }
    return false;
  }
  return solve(0);
}
let seed=1209;const rnd=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
let compared=0;
for(let attempt=0;compared<400&&attempt<5000;attempt++) {
  const t=[],pair=rnd(34);t.push(pair,pair);
  for(let g=0;g<4;g++){const kind=rnd(34);if(rnd(2)&&kind<27&&kind%9<7)t.push(kind,kind+1,kind+2);else t.push(kind,kind,kind);}
  if(attempt%2===0)t[rnd(14)]=rnd(34);
  try{countsOf(t);}catch{continue;}
  const original=[...t],shapes=decomposeHand(t);
  assert.equal(shapes.some(s=>s.kind==='standard'),referenceStandard(t));
  assert.deepEqual(t,original,'analysis cannot reorder or mutate the hand');
  for(const shape of shapes.filter(s=>s.kind==='standard'))assert.deepEqual(countsOf([...shape.groups.flatMap(g=>g.tiles),shape.pair,shape.pair]),countsOf(t));
  compared++;
}
assert.equal(compared,400);
const ambiguous=hand('一万 一万 一万 二万 二万 二万 三万 三万 三万 四万 四万 四万 五万 五万');
assert.ok(decomposeHand(ambiguous).filter(s=>s.kind==='standard').length>1);
console.log('PASS: tile inventory, chow boundaries, kongs, regional special shapes, missing suit, structural waits, unseen counts, ambiguity and 400 independent standard-hand comparisons. NOT a scoring or complete-game test.');
