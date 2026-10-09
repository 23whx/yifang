// Independently construct complete seven-pairs and thirteen-orphans shapes.
// This is a structural acceptance sweep, not an oracle for every fan/exclusion.
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-analysis-core'?core:load.call(this,request,...args);};
 require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](module,file):js(module,file);
 const {scoreMcrHand}=require('../lib/mahjong/mcr-score.ts');
 let seed=0x53485045;const rand=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
 const shuffle=items=>{const result=[...items];for(let i=result.length-1;i>0;i--){const j=rand(i+1);[result[i],result[j]]=[result[j],result[i]];}return result;};
 const faces=Array.from({length:34},(_,i)=>i),orphans=[0,8,9,17,18,26,27,28,29,30,31,32,33];
 const counts={plainPairs:0,quadruplePairs:0,orphans:0,selfDraw:0,discardWin:0};
 function check(tiles,kind,expected,winFace){
  assert.equal(tiles.length,14);assert.ok(new Set(tiles).size<=13);
  const physical=Array.from({length:34},(_,face)=>tiles.filter(tile=>tile===face).length);
  assert.ok(physical.every(count=>count<=4),'no fifth physical copy');
  for(const source of ['wall','discard']){
   const winningTile=winFace,concealedBeforeWin=[...tiles];assert.ok(concealedBeforeWin.includes(winningTile));concealedBeforeWin.splice(concealedBeforeWin.indexOf(winningTile),1);
   const result=scoreMcrHand({concealedBeforeWin,winningTile,melds:[],winner:0,from:source==='wall'?0:1,roundWind:rand(4),seatWind:rand(4),source,flowers:[],lastWallEvent:false,lastCopy:false});
   assert.ok(result.ok,`${kind} rejected as ${result.reason}: ${tiles.join(',')}`);
   assert.ok(result.analysis.fanCodes.some(code=>expected.includes(code)),`${kind} missing family fan: ${result.analysis.fanCodes.join(',')}`);
   assert.ok(result.analysis.nonFlowerTotal>=8);
   const points=result.analysis.nonFlowerTotal,expectedDelta=source==='wall'?[3*(points+8),-(points+8),-(points+8),-(points+8)]:[points+24,-(points+8),-8,-8];
   assert.deepEqual(result.settlement.delta,expectedDelta,`${kind} source-specific payment`);
   counts[source==='wall'?'selfDraw':'discardWin']++;
  }
  counts[kind]++;
 }
 for(let n=0;n<3000;n++){
  const distinct=shuffle(faces).slice(0,7);
  check(shuffle(distinct.flatMap(face=>[face,face])),'plainPairs',['mcr-06','mcr-19'],distinct[0]);
  const withQuad=shuffle(faces).slice(0,6),quad=withQuad[0];
  check(shuffle([...withQuad.flatMap(face=>[face,face]),quad,quad]),'quadruplePairs',['mcr-06','mcr-19'],quad);
 }
 for(const pair of orphans){
  const tiles=[...orphans,pair];
  check(shuffle(tiles),'orphans',['mcr-07'],pair);
  check(shuffle(tiles),'orphans',['mcr-07'],orphans.find(face=>face!==pair));
 }
 assert.deepEqual({plainPairs:counts.plainPairs,quadruplePairs:counts.quadruplePairs,orphans:counts.orphans},{plainPairs:3000,quadruplePairs:3000,orphans:26});
 console.log(`PASS: ${counts.plainPairs} seven-pairs hands, ${counts.quadruplePairs} seven-pairs hands with a four-copy face, ${counts.orphans} thirteen-orphans hands; ${counts.selfDraw+counts.discardWin} source/winning-tile variants, all scored by the actual MCR entry with correct family fan and exact four-seat payment. Not full fan/exclusion proof.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
