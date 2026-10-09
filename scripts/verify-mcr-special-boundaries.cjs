// WMO MCR special-hand boundary fixtures: shifted pairs, quad-as-two-pairs,
// lesser honors/knitted versus greater honors/knitted.
const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-analysis-core'?core:load.call(this,request,...args);};
 require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {scoreMcrHand:score}=require('../lib/mahjong/mcr-score.ts');
 const evaluate=(tiles,selfDraw=false)=>score({concealedBeforeWin:tiles.slice(0,-1),winningTile:tiles.at(-1),melds:[],winner:0,from:selfDraw?0:1,roundWind:0,seatWind:1,source:selfDraw?'wall':'discard',flowers:[],lastWallEvent:false,lastCopy:false});
 const points=(r,code)=>r.analysis.occurrences.filter(o=>o.fanCode===code).reduce((n,o)=>n+o.points,0);
 let checks=0;
 for(let suit=0;suit<3;suit++)for(let start=0;start<3;start++){
  const tiles=Array.from({length:7},(_,i)=>suit*9+start+i).flatMap(t=>[t,t]);
  // 2–8 shifted pairs also qualify for All Simples; 1–7 and 3–9 do not.
  for(const selfDraw of [false,true]){
   const result=evaluate(tiles,selfDraw),expected=start===1?90:88;assert.ok(result.ok);
   assert.equal(result.analysis.nonFlowerTotal,expected+(selfDraw?4:0));assert.equal(points(result,'mcr-06'),88);
   assert.equal(points(result,'mcr-68'),start===1?2:0);
   assert.equal(points(result,'mcr-56'),selfDraw?4:0);
   for(const code of ['mcr-19','mcr-22','mcr-62','mcr-76','mcr-79','mcr-80'])assert.equal(points(result,code),0);
   assert.deepEqual(result.settlement.delta,selfDraw?[3*(expected+12),-expected-12,-expected-12,-expected-12]:[expected+24,-expected-8,-8,-8]);
   checks++;
  }
  const broken=[...tiles];broken[0]=27;broken[1]=27;
  const ordinary=evaluate(broken);assert.ok(ordinary.ok);assert.equal(points(ordinary,'mcr-06'),0);assert.equal(points(ordinary,'mcr-19'),24);
  checks++;
 }
 const quad=evaluate([0,0,0,0,10,10,13,13,25,25,27,27,31,31]);
 assert.ok(quad.ok);assert.equal(points(quad,'mcr-19'),24);assert.equal(points(quad,'mcr-64'),2);assert.equal(quad.analysis.nonFlowerTotal,32,'seven pairs24 + tile hog2 + all types6');
 checks++;
 for(const suits of [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]]){
  const knitted=suits.flatMap((s,i)=>[i,i+3,i+6].map(r=>9*s+r));
  for(const omitted of [-1,0,1,2,3,4,5,6,7,8]){
   const tiles=omitted===-1?[...knitted,27,28,29,31,32]:[...knitted.filter((_,i)=>i!==omitted),27,28,29,30,31,32];
   const result=evaluate(tiles);assert.ok(result.ok);assert.equal(points(result,'mcr-34'),12);assert.equal(points(result,'mcr-20'),0);
   assert.equal(points(result,'mcr-35'),omitted===-1?12:0);
   assert.equal(result.analysis.nonFlowerTotal,omitted===-1?24:12);
   for(const code of ['mcr-52','mcr-62','mcr-77','mcr-78','mcr-79'])assert.equal(points(result,code),0);
   const duplicate=[...tiles];duplicate[0]=duplicate[1];assert.equal(evaluate(duplicate).ok,false);
   checks+=2;
  }
  const greater=evaluate([...knitted.slice(0,7),27,28,29,30,31,32,33]);
  assert.ok(greater.ok);assert.equal(points(greater,'mcr-20'),24);assert.equal(points(greater,'mcr-34'),0);checks++;
 }
 console.log(`PASS: ${checks} special-hand boundary checks: nine shifted pair shapes across discard/self-draw with All Simples/Fully Concealed/No Honors interactions and exact payments; broken sequences, physical quad as two pairs, six knitted assignments with five/six/seven honors, duplicate-single rejection and exact totals.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
