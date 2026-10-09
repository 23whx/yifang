// MCR linked-pung fans 15/24/32/42/65, complete fixed-meld fixtures.
// https://mahjong-europe.org/portal/images/docs/mcr_ENa5.pdf
const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-analysis-core'?core:load.call(this,request,...args);};
 require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {scoreMcrHand:score}=require('../lib/mahjong/mcr-score.ts');
 const rows=[
  {code:'mcr-15',points:48,groups:[1,2,3,4],absent:['mcr-24','mcr-49']},
  {code:'mcr-24',points:24,groups:[1,2,3,17],absent:['mcr-15']},
  {code:'mcr-32',points:16,groups:[6,15,24,31],absent:['mcr-65']},
  {code:'mcr-42',points:8,groups:[1,11,21,31],absent:[]},
  {code:'mcr-65',points:2,groups:[1,10,23,31],absent:['mcr-32']},
 ];
 let positive=0,negative=0;
 for(const row of rows)for(const permutation of [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]]) {
  const map=t=>t<27?9*permutation[Math.floor(t/9)]+t%9:t;
  for(const kongAt of [-1,0,1,2,3])for(const self of [false,true]) {
   const melds=row.groups.map((t,i)=>({kind:i===kongAt?'kong':'pung',tiles:Array(i===kongAt?4:3).fill(map(t)),open:true}));
   const input={concealedBeforeWin:[30],winningTile:30,melds,winner:0,from:self?0:1,roundWind:0,seatWind:1,source:self?'wall':'discard',flowers:[],lastWallEvent:false,lastCopy:false};
   const result=score(input),label=`${row.code}/${permutation}/${kongAt}/${self}`;
   assert.ok(result.ok,label);
   assert.equal(result.analysis.occurrences.filter(o=>o.fanCode===row.code).reduce((n,o)=>n+o.points,0),row.points,label);
   for(const code of row.absent)assert.ok(!result.analysis.fanCodes.includes(code),`${label}: ${code}`);
   positive++;
   // East breaks the required numeric association but leaves a legal hand.
   const broken={...input,melds:[{kind:'pung',tiles:[27,27,27],open:true},...melds.slice(1)]};
   const counter=score(broken);
   assert.ok(!counter.ok||!counter.analysis.fanCodes.includes(row.code),`${label}: broken first group`);
   if(!counter.ok)assert.equal(counter.reason,'below-minimum');
   negative++;
  }
 }
 console.log(`PASS: five linked-pung families, ${positive} complete-hand suit/kong/source positives and ${negative} broken-association negatives; exact fan contributions and contained-tier exclusions.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
