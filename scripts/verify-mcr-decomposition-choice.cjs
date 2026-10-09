// WMO/EMA Greenbook 2021 section 3.9.1: choose the highest-point fan,
// without separating/reusing a set to count the same or lower fan again.
// https://mahjongclublausanne.ch/wp-content/uploads/2024/03/Greenbook2021_Chinese-EN.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-analysis-core'?core:load.call(this,request,...args);};
 require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {scoreMcrHand}=require('../lib/mahjong/mcr-score.ts'),{decomposeHand}=require('../lib/mahjong/shape.ts');
 let cases=0,ambiguous=0;
 for(let suit=0;suit<3;suit++)for(let start=1;start<=6;start++)for(const selfDraw of [false,true])for(const pairFinish of [false,true]){
  const pungTiles=[0,1,2,3].map(offset=>suit*9+start-1+offset),pair=suit*9+(start===1?4:0),complete=[...pungTiles.flatMap(tile=>[tile,tile,tile]),pair,pair];
  const winningTile=pairFinish?pair:pungTiles[3],concealedBeforeWin=[...complete];concealedBeforeWin.splice(concealedBeforeWin.lastIndexOf(winningTile),1);
  const input={concealedBeforeWin,winningTile,melds:[],winner:0,from:selfDraw?0:1,roundWind:0,seatWind:1,source:selfDraw?'wall':'discard',flowers:[],lastWallEvent:false,lastCopy:false};
  const shapes=decomposeHand(complete,[],{variant:'mcr'}).filter(shape=>shape.kind==='standard');
  const result=scoreMcrHand(input),label=JSON.stringify({suit,start,selfDraw,pairFinish});
  assert.ok(result.ok,label);
  const has=code=>result.analysis.fanCodes.includes(`mcr-${code}`);
  assert.ok(has('15'),`${label}: four pure shifted pungs must beat chow decompositions`);
  assert.ok(has('22'),`${label}: full flush`);
  assert.equal(has('12'),selfDraw||pairFinish,`${label}: the claimed tile completes a concealed pung only on the pung-claim branch`);
  assert.equal(has('33'),!selfDraw&&!pairFinish,`${label}: three other concealed pungs survive the pung-claim branch`);
  assert.ok(!has('49')&&!has('23')&&!has('24'),`${label}: lower pung-family fans are absorbed`);
  assert.equal(result.analysis.occurrences.filter(o=>o.fanCode==='mcr-73').reduce((n,o)=>n+o.points,0),start===1||start===6?1:0,`${label}: independent terminal pung combines with Four Pure Shifted Pungs (WMO #15 example)`);
  assert.ok(result.analysis.exclusions.some(item=>item.fanCode==='mcr-49'&&item.excludedBy.some(cause=>cause.fanCode==='mcr-15')),`${label}: explain why All Pungs is absorbed`);
  assert.ok(!result.analysis.exclusions.some(item=>item.fanCode==='mcr-73'&&item.excludedBy.some(cause=>cause.fanCode==='mcr-15')),`${label}: no invented terminal-pung exclusion`);
  const due=result.analysis.total+8;
  assert.deepEqual(result.settlement.delta,selfDraw?[3*due,-due,-due,-due]:[result.analysis.total+24,-due,-8,-8],`${label}: independent payment`);
  if(shapes.length>1)ambiguous++;
  cases++;
 }
 assert.ok(ambiguous>0,'At least one fixture must offer genuinely different standard decompositions');
 let openCases=0;
 for(let suit=0;suit<3;suit++)for(const start of [1,6])for(const kongAt of [-1,0,1,2,3])for(const selfDraw of [false,true]){
  const tiles=[0,1,2,3].map(offset=>suit*9+start-1+offset);
  const melds=tiles.map((tile,index)=>({kind:index===kongAt?'kong':'pung',tiles:Array(index===kongAt?4:3).fill(tile),open:true}));
  const label=JSON.stringify({suit,start,kongAt,selfDraw,open:true});
  const result=scoreMcrHand({concealedBeforeWin:[30],winningTile:30,melds,winner:0,from:selfDraw?0:1,roundWind:0,seatWind:1,source:selfDraw?'wall':'discard',flowers:[],lastWallEvent:false,lastCopy:false});
  assert.ok(result.ok,label);
  assert.ok(result.analysis.fanCodes.includes('mcr-15'),`${label}: four open shifted pungs remain eligible`);
  assert.equal(result.analysis.occurrences.filter(o=>o.fanCode==='mcr-73').reduce((n,o)=>n+o.points,0),1,`${label}: terminal pung/kong retains its independent one point`);
  assert.ok(!result.analysis.exclusions.some(item=>item.fanCode==='mcr-73'&&item.excludedBy.some(cause=>cause.fanCode==='mcr-15')),`${label}: no invented terminal-pung exclusion`);
  openCases++;
 }
 console.log(`PASS: ${cases} full-hand high-score and lower-fan exclusion cases; ${ambiguous} have multiple legal standard decompositions, including self-draw and discard completion differences; ${openCases} open pung/kong independent terminal-point cases.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
