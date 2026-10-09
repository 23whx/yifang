// WMO/EMA Greenbook 2021, fan 38 and the Appendix 8 hierarchy:
// https://mahjongclublausanne.ch/wp-content/uploads/2024/03/Greenbook2021_Chinese-EN.pdf
// The three wind groups are absorbed by Big Three Winds. An independent
// numerical terminal pung still receives its own one-point fan 73.
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-analysis-core'?core:load.call(this,request,...args);};
 require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {scoreMcrHand:score}=require('../lib/mahjong/mcr-score.ts');
 const pung=tile=>({kind:'pung',tiles:[tile,tile,tile],open:true});
 let cases=0;
 for(let omittedWind=0;omittedWind<4;omittedWind++)for(let suit=0;suit<3;suit++)for(const rank of [1,2,8,9]){
  const windGroups=[27,28,29,30].filter((_,index)=>index!==omittedWind).map(pung);
  const terminalPung=pung(suit*9+rank-1),terminal=rank===1||rank===9;
  for(let roundWind=0;roundWind<4;roundWind++)for(let seatWind=0;seatWind<4;seatWind++)for(const selfDraw of [false,true]){
   const input={melds:[...windGroups,terminalPung],concealedBeforeWin:[13],winningTile:13,winner:0,from:selfDraw?0:1,roundWind,seatWind,source:selfDraw?'wall':'discard',flowers:[],lastWallEvent:false,lastCopy:false};
   const result=score(input),label=`omit${omittedWind}/suit${suit}/rank${rank}/round${roundWind}/seat${seatWind}/self${selfDraw}`;
   assert.ok(result.ok,label);
   const points=code=>result.analysis.occurrences.filter(item=>item.fanCode===code).reduce((sum,item)=>sum+item.points,0);
   assert.equal(points('mcr-38'),12,`${label}: Big Three Winds`);
   assert.equal(points('mcr-73'),terminal?1:0,`${label}: only independent numerical terminal pung`);
   const excluded=result.analysis.exclusions.find(item=>item.fanCode==='mcr-73');
   assert.ok(excluded?.excludedBy.some(cause=>cause.fanCode==='mcr-38'),`${label}: explain absorbed wind groups`);
   assert.equal(new Set(excluded.occurrenceKeys).size,3,`${label}: exactly three wind groups absorbed`);
   const total=result.analysis.total,due=total+8;
   assert.deepEqual(result.settlement.delta,selfDraw?[3*due,-due,-due,-due]:[total+24,-due,-8,-8],`${label}: four-seat payment`);
   cases++;
  }
 }
 console.log(`PASS: ${cases} complete Big Three Winds hands vary omitted wind, numerical suit/rank, both winds and win source; exactly three absorbed wind pungs, independent terminal point and four-seat payment.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
