// WMO/EMA Greenbook 2021 fan 55, example 1 explicitly combines Outside Hand,
// All Chows, one Two Terminal Chows and two Mixed Double Chows:
// https://mahjongclublausanne.ch/wp-content/uploads/2024/03/Greenbook2021_Chinese-EN.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-analysis-core'?core:load.call(this,request,...args);};
 require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {scoreMcrHand:score}=require('../lib/mahjong/mcr-score.ts');
 const permutations=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
 const orders=items=>items.length===1?[items]:items.flatMap((item,index)=>orders([...items.slice(0,index),...items.slice(index+1)]).map(rest=>[item,...rest]));
 const chow=start=>({kind:'chow',tiles:[start,start+1,start+2],open:true});
 const pung=tile=>({kind:'pung',tiles:[tile,tile,tile],open:true});
 const fanPoints=(result,code)=>result.analysis.occurrences.filter(item=>item.fanCode===`mcr-${code}`).reduce((sum,item)=>sum+item.points,0);
 let cases=0;
 for(const suits of permutations)for(const order of orders([0,1,2,3]))for(const pairRank of [1,9])for(const selfDraw of [false,true]){
  const starts=[suits[0]*9,suits[0]*9+6,suits[1]*9,suits[1]*9+6],pair=suits[2]*9+pairRank-1;
  const base=order.map(index=>chow(starts[index]));
  const variants=[
   {name:'published overlap',melds:base,pair,expected:{'55':4,'63':2,'72':1,'70':2}},
   {name:'middle pair loses Outside Hand only',melds:base,pair:suits[2]*9+3,expected:{'55':0,'63':2,'72':1,'70':2}},
   {name:'five pair upgrades to Three-Suited Terminal Chows',melds:base,pair:suits[2]*9+4,expected:{'29':16,'55':0,'63':0,'72':0,'70':0,'76':0}},
   {name:'inner chow loses Outside Hand and one cross-suit match',melds:order.map(index=>chow(index===0?starts[index]+1:starts[index])),pair,expected:{'55':0,'63':2,'72':1,'70':1}},
   {name:'terminal pung loses All Chows and one cross-suit match',melds:order.map(index=>index===3?pung(suits[1]*9+8):chow(starts[index])),pair,expected:{'55':4,'63':0,'72':1,'70':1}},
  ];
  for(const variant of variants){
   // Last-wall event supplies an independent eight-point gate for mutants
   // that would otherwise fall below the legal minimum on self-draw.
   const input={melds:variant.melds,concealedBeforeWin:[variant.pair],winningTile:variant.pair,winner:0,from:selfDraw?0:1,roundWind:0,seatWind:1,source:selfDraw?'wall':'discard',flowers:[],lastWallEvent:true,lastCopy:false};
   const result=score(input),label=`${variant.name}/${suits}/${order}/${pairRank}/${selfDraw}`;
   assert.ok(result.ok,label);
   for(const [code,expected] of Object.entries(variant.expected))assert.equal(fanPoints(result,code),expected,`${label}/fan${code}`);
   if(variant.expected['29'])for(const code of ['63','70','72','76']){
    const excluded=result.analysis.exclusions.find(item=>item.fanCode===`mcr-${code}`);
    assert.ok(excluded?.excludedBy.some(cause=>cause.fanCode==='mcr-29'),`${label}: fan${code} exclusion cause`);
   }
   const total=result.analysis.total,due=total+8;
   assert.deepEqual(result.settlement.delta,selfDraw?[3*due,-due,-due,-due]:[total+24,-due,-8,-8],`${label}/settlement`);
   cases++;
  }
 }
 console.log(`PASS: ${cases} full-hand Outside Hand/All Chows/Two Terminal Chows/Mixed Double Chow combinations and isolated pair/chow/pung counterexamples across suit permutations, meld order and both win sources.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
