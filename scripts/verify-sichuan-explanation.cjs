const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {sichuanWinExplanation:explain}=require('../lib/mahjong/sichuan-explanation.ts');
const hand=[0,1,2,3,4,5,9,10,11,12,13,14,8,8];
const v={stage:'play',round:{players:[{hand,melds:[],missing:2}],events:[{kind:'win',seats:[0],from:0,tile:8,selfDraw:true,robbing:false,afterKong:false}]},payments:[1,2,3].map(from=>({from,to:0,amount:2,event:'event:0'}))};
const zh=explain(v,'zh'),en=explain(v,'en');
assert.ok(zh.includes('平胡'));assert.ok(zh.includes('一万、二万、三万'));assert.ok(zh.includes('九万、九万'));
assert.equal((zh.match(/支付 2 分/g)||[]).length,3);assert.equal((en.match(/2 points/g)||[]).length,3);
assert.ok(en.includes('1 characters, 2 characters, 3 characters'));assert.ok(en.includes('Basic hand'));
const ron=structuredClone(v);ron.round.players[0].hand.pop();ron.round.events[0].selfDraw=false;ron.round.events[0].robbing=true;
assert.ok(explain(ron,'zh').includes('抢杠再翻倍'));assert.ok(explain(ron,'en').includes('doubles once for robbing'));
assert.equal(explain({stage:'setup'},'zh'),'');
assert.equal(explain({stage:'play',round:{events:[]}},'en'),'');
function example(hand,melds=[],missing=2,extra={}){
 return {stage:'play',round:{players:[{hand,melds,missing}],events:[{kind:'win',seats:[0],from:0,tile:hand.at(-1),selfDraw:true,robbing:false,afterKong:false,...extra}]},payments:[]};
}
// Actual four-peer acceptance shape: pure triplets, two declared kongs.
const clear=example([18,18,18,23,23],[{kind:'pung',tiles:[21,21,21],open:true},{kind:'kong',tiles:[24,24,24,24],open:true},{kind:'kong',tiles:[25,25,25,25],open:false}],1);
for(const locale of ['zh','en']){
 const text=explain(clear,locale);
 assert.ok(text.includes('8 × 2 × 2 = 32'));
 assert.ok(text.includes('1 × 32 + '+(locale==='zh'?'自摸另加 ':'self-draw extra ')+'1 = 33'));
 assert.ok(text.includes(locale==='zh'?'七条、八条各四张':'four each of 7 bamboo, 8 bamboo'));
 assert.ok(text.includes(locale==='zh'?'刻子是三张相同牌':'A triplet is three identical tiles'));
 const kongBonus=structuredClone(clear);kongBonus.round.events[0].afterKong=true;
 const capped=explain(kongBonus,locale);
 assert.ok(capped.includes('32 × '+(locale==='zh'?'事件加倍 ':'event factor ')+'2 = 64'));
 assert.ok(capped.includes(locale==='zh'?'因此取 32':'so use 32'));
}
const dragon=example([0,0,0,0,2,2,2,2,9,9,11,11,13,13]);
assert.ok(explain(dragon,'zh').includes('共有 2 根'));
assert.ok(explain(dragon,'zh').includes('已经包含一根，不重复加分'));
assert.ok(explain(dragon,'en').includes('already includes one root'));
assert.ok(explain(dragon,'zh').includes('额外计分 1 根：16 × 2 = 32'));
// Multiple legal decompositions: the presented groups must match all-pungs.
const ambiguous=example([0,0,0,1,1,1,2,2,2,3,3,3,4,4]);
const explanation=explain(ambiguous,'zh');
assert.ok(explanation.includes('牌型为清对'));
assert.ok(explanation.includes('[一万、一万、一万]'));
assert.ok(!explanation.includes('[一万、二万、三万]'));
assert.ok(explain(v,'zh').includes('共有 0 根'));
assert.ok(explain(v,'en').includes('per payer, not the whole table'));
console.log('PASS: bilingual concrete groups, pair, pattern label, exact payment lines, robbing explanation and no spurious result before a win.');
console.log('PASS: novice pattern/root definitions, physical quad names, dragon-root exclusion, 8×2×2 arithmetic, event bonus/cap/self-draw order and pattern-matching grouping. Presentation fixtures, not browser acceptance.');
