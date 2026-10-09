// Independent complete-hand examples for MCR associated chow fan reuse.
// WMO MCR2021 scoring principles and definitions 28/41/69/70/71:
// https://www.mindmahjong.com/adobe/MCR2021.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-analysis-core'?core:load.call(this,request,...args);};
 require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {scoreMcrHand:score}=require('../lib/mahjong/mcr-score.ts');
 const rows=[
  {name:'two disjoint Pure Double Chows plus one cross Short Straight',chows:[[0,0],[0,0],[0,3],[0,3]],fans:{'mcr-69':2,'mcr-71':1}},
  {name:'Mixed Triple Chow plus a leftover Short Straight',chows:[[0,0],[1,0],[2,0],[0,3]],fans:{'mcr-41':1,'mcr-71':1}},
  {name:'two disjoint Mixed Double Chows plus one Short Straight',chows:[[0,0],[1,0],[0,3],[1,3]],fans:{'mcr-70':2,'mcr-71':1}},
  {name:'Pure Straight plus an independent Mixed Double Chow',chows:[[0,0],[0,3],[0,6],[1,0]],fans:{'mcr-28':1,'mcr-70':1}},
  {name:'Pure Straight plus an independent Pure Double Chow',chows:[[0,0],[0,3],[0,6],[0,0]],fans:{'mcr-28':1,'mcr-69':1}},
  {name:'independent Old Young Pair without Pure Straight',chows:[[0,0],[0,6],[1,3],[2,3]],fans:{'mcr-72':1,'mcr-70':1}},
 ];
 const associated=new Set(['mcr-14','mcr-16','mcr-23','mcr-28','mcr-29','mcr-30','mcr-39','mcr-41','mcr-51','mcr-69','mcr-70','mcr-71','mcr-72']);
 const permutations=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
 const orders=(xs)=>xs.length===1?[xs]:xs.flatMap((x,i)=>orders([...xs.slice(0,i),...xs.slice(i+1)]).map(rest=>[x,...rest]));
 let cases=0;
 for(const row of rows)for(const suits of permutations)for(const order of orders([0,1,2,3]))for(const self of [false,true]){
  const melds=order.map(i=>{const [suit,start]=row.chows[i],tile=suits[suit]*9+start;return {kind:'chow',tiles:[tile,tile+1,tile+2],open:true};});
  const input={melds,concealedBeforeWin:[27],winningTile:27,winner:0,from:self?0:2,roundWind:0,seatWind:1,source:self?'wall':'discard',flowers:[],lastWallEvent:true,lastCopy:false};
  const result=score(input),label=`${row.name} / suits ${suits} / order ${order} / self ${self}`;
  assert.ok(result.ok,label);
  const actual={};for(const occurrence of result.analysis.occurrences)if(associated.has(occurrence.fanCode))actual[occurrence.fanCode]=(actual[occurrence.fanCode]??0)+1;
  assert.deepEqual(actual,row.fans,label);
  const oldYoungExclusion=result.analysis.exclusions.find(item=>item.fanCode==='mcr-72');
  if(row.fans['mcr-28']){
   assert.deepEqual(oldYoungExclusion?.excludedBy.map(item=>item.fanCode),['mcr-28'],`${label}: absorbed Old Young Pair cause`);
   assert.ok(oldYoungExclusion.occurrenceKeys.length>0,`${label}: absorbed group evidence`);
  }else assert.equal(oldYoungExclusion,undefined,`${label}: independent Old Young Pair must not be excluded`);
  cases++;
 }
 console.log(`PASS: ${cases} complete hands cover six four-chow overlap/exclusion contracts, six suit maps, 24 meld orders and self-draw/discard; Pure Straight explains absorbed Old Young Pair while independent pairs remain countable.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
