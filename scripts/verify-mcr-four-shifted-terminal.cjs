// Independent WMO #15 example: Four Pure Shifted Pungs CAN add a terminal
// pung/kong point. The old catalog and tests incorrectly suppressed it.
// https://www.mindmahjong.com/adobe/ZC2021.pdf pp26-27
// https://mahjong-europe.org/portal/images/docs/mcr_EN.pdf
const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-analysis-core'?core:load.call(this,request,...args);};
 require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {scoreMcrHand:score}=require('../lib/mahjong/mcr-score.ts');
 let cases=0,positive=0,negative=0;
 for(let suit=0;suit<3;suit++)for(let start=1;start<=6;start++){
  const groups=[0,1,2,3].map(i=>9*suit+start-1+i);
  // Defined directly from physical rank, not scorer occurrences/exclusions.
  const terminalPoints=groups.filter(t=>t%9===0||t%9===8).length;
  for(let pair=0;pair<34;pair++){
   if(groups.includes(pair))continue;
   for(let mask=0;mask<16;mask++)for(const selfDraw of [false,true]){
    const input={concealedBeforeWin:[pair],winningTile:pair,melds:groups.map((t,i)=>({kind:mask&(1<<i)?'kong':'pung',tiles:Array(mask&(1<<i)?4:3).fill(t),open:true})),winner:0,from:selfDraw?0:1,source:selfDraw?'wall':'discard',roundWind:0,seatWind:1,flowers:[],lastWallEvent:false,lastCopy:false};
    const before=JSON.stringify(input),label=`${suit}/${start}/${pair}/${mask}/${selfDraw}`,r=score(input);
    assert.ok(r.ok,`${label}: completed fixed-meld hand`);assert.equal(JSON.stringify(input),before);
    const points=code=>r.analysis.occurrences.filter(o=>o.fanCode===`mcr-${code}`).reduce((n,o)=>n+o.points,0);
    assert.equal(points('15'),48,label);assert.equal(points('73'),terminalPoints,label);
    for(const code of ['23','24','49'])assert.equal(points(code),0,`${label}: genuine contained lower fan ${code}`);
    assert.ok(!r.analysis.exclusions.some(e=>e.fanCode==='mcr-73'&&e.excludedBy.some(c=>c.fanCode==='mcr-15')),`${label}: no invented exclusion`);
    const counts=new Array(34).fill(0);for(const m of input.melds)for(const t of m.tiles)counts[t]++;counts[pair]+=2;
    assert.ok(counts.every(c=>c<=4));assert.equal(counts.reduce((a,b)=>a+b,0),14+input.melds.filter(m=>m.kind==='kong').length);
    const due=r.analysis.total+8;assert.deepEqual(r.settlement.delta,selfDraw?[3*due,-due,-due,-due]:[r.analysis.total+24,-due,-8,-8],label);
    cases++;if(terminalPoints)positive++;else negative++;
   }
  }
 }
 assert.equal(cases,17280);assert.equal(positive,5760);assert.equal(negative,11520);
 console.log(`PASS: ${cases} fixed-meld Four Pure Shifted Pungs hands, all three suits/six starts/30 unused pairs/16 Pung-Kong masks/both sources: ${positive} independent terminal-point positives, ${negative} negatives; correct contained lower fans, inventory, immutable input and payment arithmetic. Not all other fans, concealed decomposition, event history or browser/LAN certification.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
