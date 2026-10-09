const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {mcrSettlement:score,newMcrLedger,settleMcrHand:settle}=require('../lib/mahjong/mcr-settlement.ts');
const ron={kind:'win',winner:0,from:1,selfDraw:false,nonFlowerPoints:8,flowers:[34,35]};
assert.deepEqual(score(ron).delta,[34,-18,-8,-8]);
assert.deepEqual(score({...ron,from:0,selfDraw:true}).delta,[54,-18,-18,-18]);
for(let nonFlowerPoints=0;nonFlowerPoints<8;nonFlowerPoints++){
 const result={...ron,nonFlowerPoints,flowers:[34,35,36,37,38,39,40,41]};
 assert.equal(score(result).eligible,false);assert.deepEqual(score(result).delta,[0,0,0,0]);assert.throws(()=>settle(newMcrLedger(),'hand:0',result));
}
let cases=0;for(let winner=0;winner<4;winner++)for(let from=0;from<4;from++)for(const nonFlowerPoints of [8,9,16,24,64,88,176])for(let flowers=0;flowers<=8;flowers++){
 const result={...ron,winner,from,selfDraw:from===winner,nonFlowerPoints,flowers:Array.from({length:flowers},(_,i)=>34+i)},s=score(result),total=nonFlowerPoints+flowers;
 assert.equal(s.transfers.length,3);assert.equal(s.delta.reduce((a,b)=>a+b,0),0);
 assert.equal(s.delta[winner],from===winner?3*(8+total):24+total);
 for(let i=0;i<4;i++)if(i!==winner)assert.equal(s.delta[i],-(8+(from===winner||from===i?total:0)));
 cases++;
}
const initial=newMcrLedger(),one=settle(initial,'hand:1',ron);assert.deepEqual(initial,newMcrLedger());assert.deepEqual(one.balances,[34,-18,-8,-8]);
ron.flowers.push(36);assert.deepEqual(one.hands[0].result.flowers,[34,35]);
assert.throws(()=>settle(one,'hand:1',{kind:'draw'}));
const drawn=settle(one,'hand:2',{kind:'draw'});assert.deepEqual(drawn.balances,one.balances);assert.throws(()=>settle(drawn,'hand:2',ron));
drawn.hands[0].settlement.delta[0]=999;assert.equal(one.hands[0].settlement.delta[0],34);
for(const change of [{flowers:[34,34]},{flowers:[33]},{nonFlowerPoints:-1},{nonFlowerPoints:NaN},{nonFlowerPoints:Number.MAX_SAFE_INTEGER},{winner:4},{from:0},{selfDraw:true}])assert.throws(()=>score({...ron,...change}));
assert.throws(()=>settle({balances:[Number.MAX_SAFE_INTEGER,0,0,0],hands:[]},'overflow',ron));
console.log(`PASS: ${cases} MCR payment contexts, explicit 8+2 point examples, flower exclusion, all seats, zero sum, draw/replay/overflow and detached ledger. Host-valued settlement only, not full fan calculation.`);
