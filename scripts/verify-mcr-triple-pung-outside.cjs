// WMO/EMA Greenbook 2021 fan 32, example 1 combines Triple Pung,
// Outside Hand, No Honors, and three Pungs of Terminals or Honors:
// https://mahjongclublausanne.ch/wp-content/uploads/2024/03/Greenbook2021_Chinese-EN.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-analysis-core'?core:load.call(this,request,...args);};
 require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {scoreMcrHand:score}=require('../lib/mahjong/mcr-score.ts');
 const permutations=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
 const pung=tile=>({kind:'pung',tiles:[tile,tile,tile],open:true});
 const chow=start=>({kind:'chow',tiles:[start,start+1,start+2],open:true});
 let cases=0;
 for(const suits of permutations)for(const rank of [1,9])for(let chowSuit=0;chowSuit<3;chowSuit++)for(let pairSuit=0;pairSuit<3;pairSuit++)for(const selfDraw of [false,true]){
  const terminal=rank===1?9:1,terminalChow=rank===1?6:0,innerChow=rank===1?1:3;
  const triple=suits.map(suit=>pung(suit*9+rank-1)),pair=suits[pairSuit]*9+terminal-1;
  const variants=[
   {name:'published combination',fourth:chow(suits[chowSuit]*9+terminalChow),pair,outside:4},
   {name:'middle pair loses Outside Hand',fourth:chow(suits[chowSuit]*9+terminalChow),pair:suits[pairSuit]*9+4,outside:0},
   {name:'inner chow loses Outside Hand',fourth:chow(suits[chowSuit]*9+innerChow),pair,outside:0},
  ];
  for(const variant of variants){
   const input={melds:[...triple,variant.fourth],concealedBeforeWin:[variant.pair],winningTile:variant.pair,winner:0,from:selfDraw?0:1,roundWind:0,seatWind:1,source:selfDraw?'wall':'discard',flowers:[],lastWallEvent:false,lastCopy:false};
   const result=score(input),label=`${variant.name}/${suits}/${rank}/${chowSuit}/${pairSuit}/${selfDraw}`;
   assert.ok(result.ok,label);
   const points=code=>result.analysis.occurrences.filter(item=>item.fanCode===`mcr-${code}`).reduce((sum,item)=>sum+item.points,0);
   assert.equal(points('32'),16,`${label}: Triple Pung`);
   assert.equal(points('55'),variant.outside,`${label}: Outside Hand`);
   assert.equal(points('76'),1,`${label}: No Honors`);
   assert.equal(points('73'),3,`${label}: three independent terminal pungs`);
   const total=result.analysis.total,due=total+8;
   assert.deepEqual(result.settlement.delta,selfDraw?[3*due,-due,-due,-due]:[total+24,-due,-8,-8],`${label}: four-seat payment`);
   cases++;
  }
 }
 console.log(`PASS: ${cases} complete Triple Pung + Outside Hand + No Honors + three terminal-pung combinations and isolated pair/chow negatives across suit assignments and win sources.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
