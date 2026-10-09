const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {settleSichuanWall:settle}=require('../lib/mahjong/sichuan-wall-settlement.ts');
const {newSichuanLedger,postSichuanPayments}=require('../lib/mahjong/sichuan-ledger.ts');
const player=hand=>({hand,melds:[],missing:2,retired:false});
const round={phase:'ended',end:'wall-empty',wall:[],seats:[
 player([0,1,2,3,4,5,9,10,11,12,13,14,8]),
 player([0,0,2,2,4,4,6,6,9,9,11,11,13]),
 player([0,1,3,4,6,7,9,10,12,13,15,16,17]),
 player([0,1,2,3,4,5,9,10,11,12,13,14,18]),
]};
const rules={base:1,capMultiplier:32,missingSuitPenalty:32,retiredReceiveMissingPenalty:true};
let ledger=postSichuanPayments(newSichuanLedger(),'kong:0',[{from:0,to:2,amount:2,kind:'kong'}]);
const result=settle(round,ledger,'wall:1',rules);
assert.deepEqual(result.checks.map(c=>c.status),['ready','ready','not-ready','missing-suit']);
assert.equal(result.checks[0].maximum,1);assert.equal(result.checks[1].maximum,4);
assert.deepEqual(result.ledger.balances,[33,36,27,-96]);
assert.equal(result.ledger.balances.reduce((a,b)=>a+b,0),0);
assert.throws(()=>settle(round,result.ledger,'wall:1',rules));assert.deepEqual(ledger.balances,[-2,0,2,0]);
const capped=settle(round,newSichuanLedger(),'cap',{...rules,capMultiplier:2});assert.equal(capped.checks[1].maximum,2);
const retired=structuredClone(round);retired.seats[0].retired=true;
const excluded=settle(retired,newSichuanLedger(),'retired',{...rules,retiredReceiveMissingPenalty:false});
assert.equal(excluded.ledger.balances[0],0);assert.equal(excluded.ledger.entries.some(e=>e.from===0),false);
assert.throws(()=>settle({...round,end:'three-winners'},newSichuanLedger(),'bad',rules));
assert.throws(()=>settle(round,newSichuanLedger(),'bad',{...rules,base:0}));
console.log('PASS: theoretical maximum waits, cap, missing-suit vs not-ready liabilities, original-payer refund, retired policy, duplicate settlement and zero-sum points. Authored settlement fixtures, not a whole scored game.');
