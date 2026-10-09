// WMCC Explanation, Item 1(6) and Item 2(1)/(6): All Green or
// All Terminals + Seven Pairs does not add Tile Hog. Not MIL rules.
// https://ooyamaneko.net/download/mahjong/mcr/Explanation_of_Mahjong_Competition_Rules_en.doc
const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-analysis-core'?core:load.call(this,request,...args);};
 require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {scoreMcrHand:score}=require('../lib/mahjong/mcr-score.ts');
 const {createMcrResearchFanOccurrence:create,resolveMcrFanOccurrenceExclusions:resolve}=require('../lib/mahjong/vendor/analysis/fan-occurrence-research.js');
 for(const fan of ['mcr-03','mcr-08'])for(const hogs of [1,2,3]){
  const occurrences=[create(fan,'special'),create('mcr-19','special'),...Array.from({length:hogs},(_,i)=>create('mcr-64','special',{key:`hog-${i}`}))];
  const result=resolve(occurrences);
  assert.equal(result.occurrences.filter(o=>o.fanCode==='mcr-64').length,0,`${fan}/${hogs}: no Tile Hog`);
  assert.ok(result.exclusions.some(o=>o.fanCode==='mcr-64'&&o.excludedBy.includes(fan)&&o.excludedBy.includes('mcr-19')));
  for(const absent of [fan,'mcr-19'])assert.equal(resolve(occurrences.filter(o=>o.fanCode!==absent)).occurrences.filter(o=>o.fanCode==='mcr-64').length,hogs,'both causes required');
 }
 const totals={green:{shapes:0,hands:0,special:0},terminals:{shapes:0,hands:0,special:0}};
 for(const [name,alphabet] of [['green',[19,20,21,23,25,32]],['terminals',[0,8,9,17,18,26]]]){
  function enumerate(counts){
   if(counts.length<6){for(const n of [0,2,4])enumerate([...counts,n]);return;}
   if(counts.reduce((a,b)=>a+b,0)!==14)return;
   const stats=totals[name];stats.shapes++;
   const faces=alphabet.flatMap((t,i)=>Array(counts[i]).fill(t));
   for(const win of new Set(faces))for(const self of [false,true]){
    const beforeWin=[...faces];beforeWin.splice(beforeWin.indexOf(win),1);
    const input={concealedBeforeWin:beforeWin,winningTile:win,melds:[],winner:0,from:self?0:1,source:self?'wall':'discard',roundWind:0,seatWind:1,flowers:[],lastWallEvent:false,lastCopy:false};
    const before=JSON.stringify(input),result=score(input);assert.ok(result.ok);assert.equal(JSON.stringify(input),before);
    if(result.analysis.fanCodes.includes('mcr-19')){
     stats.special++;assert.ok(!result.analysis.fanCodes.includes('mcr-64'));
     assert.ok(result.analysis.exclusions.some(o=>o.fanCode==='mcr-64'&&o.excludedBy.some(c=>c.fanCode==='mcr-19')));
    }
    const due=result.analysis.total+8;assert.deepEqual(result.settlement.delta,self?[3*due,-due,-due,-due]:[result.analysis.total+24,-due,-8,-8]);stats.hands++;
   }
  }
  enumerate([]);assert.equal(totals[name].shapes,126);assert.equal(totals[name].hands,1152);assert.ok(totals[name].special>0);
 }
 console.log(`PASS: conjunctive six-face Seven Pairs exclusion, 1/2/3 Tile Hogs and single-cause controls; full scoring ${JSON.stringify(totals)}. Ordinary decompositions remain independently selected; payment arithmetic uses actual total, not an oracle for all other fans. Not browser/LAN.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
