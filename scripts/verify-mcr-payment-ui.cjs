const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const resolve=Module._resolveFilename;
Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.resolve(__dirname,'..',request.slice(2)):request,...args);};
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
const React=require('react'),{renderToStaticMarkup:render}=require('react-dom/server');
const View=require('../components/cards/McrPaymentExplanation.tsx').default;
const Hand=require('../components/cards/McrHandExplanation.tsx').default;
const {mcrSettlement}=require('../lib/mahjong/mcr-settlement.ts');
let cases=0;
for(let winner=0;winner<4;winner++)for(let from=0;from<4;from++)for(const locale of ['zh','en']){
 const result={kind:'win',winner,from,selfDraw:winner===from,nonFlowerPoints:8,flowers:[34,35]},settlement=mcrSettlement(result);
 const html=render(React.createElement(View,{locale,hand:{id:'hand:1',result,settlement}}));
 assert.ok(html.includes('8 + 2 = 10'));
 assert.equal((html.match(/role="img"/g)||[]).length,2);
 assert.ok(html.includes(locale==='zh'?'梅':'Plum')&&html.includes(locale==='zh'?'兰':'Orchid'));
 for(const p of settlement.transfers)assert.ok(html.includes(locale==='zh'?`基础 8 + 牌值 ${p.handPoints} = 支付 ${p.amount}`:`base 8 + hand value ${p.handPoints} = ${p.amount}`));
 assert.ok(html.includes(winner===from?'+54':'+34'));
 assert.ok(html.includes(locale==='zh'?'不是':'not'));
 cases++;
}
for(const locale of ['zh','en']){
 const result={kind:'draw'},html=render(React.createElement(View,{locale,hand:{id:'hand:1',result,settlement:mcrSettlement(result)}}));
 assert.ok(html.includes(locale==='zh'?'不发生分数转移':'no points change hands'));assert.ok(!html.includes('8 +'));cases++;
}
console.log(`PASS: ${cases} bilingual MCR payment explanations; all winner/source seats, exact 8+2 gate/value, discard +34, self-draw +54, and zero-transfer draws.`);
for(const locale of ['zh','en'])for(const flowers of [[],[34,35,36,37,38,39,40,41]]){
 const result={kind:'win',winner:2,from:1,selfDraw:false,nonFlowerPoints:8,flowers};
 const html=render(React.createElement(View,{locale,hand:{id:'flowers',result,settlement:mcrSettlement(result)}}));
 assert.equal((html.match(/role="img"/g)||[]).length,flowers.length);
 if(!flowers.length)assert.ok(html.includes(locale==='zh'?'没有花牌':'No flower tiles'));
 else for(const name of locale==='zh'?['梅','兰','竹','菊','春','夏','秋','冬']:['Plum','Orchid','Bamboo flower tile','Chrysanthemum','Spring','Summer','Autumn','Winter'])assert.ok(html.includes(name));
}
console.log('PASS: no-flower and all-eight-flower actual-ledger illustrations in both languages.');
// Display fixtures exercise every group renderer; not a scorer correctness claim.
for(const locale of ['zh','en']){
 const analysis={handKind:'ordinary',fanCodes:[],groups:[{index:0,group:{kind:'sequence',tiles:['1m','2m','3m']}},{index:1,group:{kind:'triplet',tile:'C'}},{index:2,group:{kind:'kong',tile:'E',exposure:'melded'}},{index:3,group:{kind:'pair',tile:'P'}}],occurrences:[],exclusions:[]};
 const html=render(React.createElement(Hand,{locale,analysis}));
 assert.equal((html.match(/role="img"/g)||[]).length,12);
 assert.ok(html.includes(locale==='zh'?'顺子':'Sequence')&&html.includes(locale==='zh'?'对子':'Pair'));
 const special=render(React.createElement(Hand,{locale,analysis:{handKind:'special',fanCodes:[],occurrences:[],exclusions:[]}}));
 assert.ok(special.includes(locale==='zh'?'特殊和牌形':'special winning shape'));assert.equal((special.match(/role="img"/g)||[]).length,0);
}
console.log('PASS: ordinary sequence/triplet/kong/pair illustrations, exact tile counts and special-hand non-fabrication in both languages. Display fixtures only.');

const {mcrEnglishFanNames,mcrFanLabel}=require('../content/mcr-fan-labels.ts');
assert.equal(mcrEnglishFanNames.length,81);assert.equal(new Set(mcrEnglishFanNames).size,81);
for(let i=1;i<=81;i++){const code='mcr-'+String(i).padStart(2,'0');assert.equal(mcrFanLabel(code,'中文','en'),mcrEnglishFanNames[i-1]);assert.equal(mcrFanLabel(code,'中文','zh'),i===79?'单钓将':'中文');}
assert.equal(mcrFanLabel('mcr-28','清龙','en'),'Pure Straight');
assert.equal(mcrFanLabel('mcr-01','大四喜','zh'),'大四喜');
assert.equal(mcrFanLabel('mcr-09','小四喜','zh'),'小四喜');
assert.equal(mcrFanLabel('mcr-79','单调将','zh'),'单钓将');
assert.ok(mcrFanLabel('mcr-99','错误','en').startsWith('Unknown'));
for(const locale of ['zh','en']){
 const a={handKind:'special',fanCodes:['mcr-22'],occurrences:[{key:'test',fanCode:'mcr-22',name:'清一色',points:24,matchedTiles:[]}],exclusions:[{fanCode:'mcr-76',name:'无字',excludedBy:[{fanCode:'mcr-22',name:'清一色'}]}]};
 const html=render(React.createElement(Hand,{locale,analysis:a}));
 assert.ok(html.includes(locale==='zh'?'无字':'No Honors'));assert.ok(html.includes(locale==='zh'?'清一色':'Full Flush'));
 if(locale==='en')assert.ok(!html.includes('清一色')&&!html.includes('无字'));
}
const oneFlower=render(React.createElement(Hand,{locale:'en',analysis:{handKind:'special',fanCodes:['mcr-81'],groups:[],occurrences:[{key:'flower',fanCode:'mcr-81',name:'花牌',points:1,matchedTiles:[]}],exclusions:[]}}));
assert.ok(oneFlower.includes('Flower Tiles · 1 point'));
assert.ok(!oneFlower.includes('1 points'));
console.log('PASS: 81 unique English names, stable code mapping, bilingual exclusion labels and unknown-code fallback. Name mapping is not full fan-rule validation.');
