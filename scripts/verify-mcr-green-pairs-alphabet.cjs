// Independent face-alphabet oracle, not an oracle for the full fan total.
// WMO/EMA #3: bamboo 2/3/4/6/8 and Green Dragon only.
// https://mahjong-europe.org/portal/images/docs/mcr_EN.pdf
// Tile Hog absorption for All Green + Seven Pairs remains a separate question.
const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-analysis-core'?core:load.call(this,request,...args);};
 require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {scoreMcrHand:score}=require('../lib/mahjong/mcr-score.ts');
 const allowed=[19,20,21,23,25,32],outside=Array.from({length:34},(_,i)=>i).filter(t=>!allowed.includes(t));
 let shapes=0,positive=0,negative=0;
 function check(faces,win,green){
  assert.equal(faces.length,14);
  const inventory=Array(34).fill(0);faces.forEach(t=>inventory[t]++);
  assert.ok(inventory.every(n=>n===0||n===2||n===4));
  const beforeWin=[...faces];beforeWin.splice(beforeWin.indexOf(win),1);
  for(const self of [false,true]){
   const input={concealedBeforeWin:beforeWin,winningTile:win,melds:[],winner:0,from:self?0:1,source:self?'wall':'discard',roundWind:0,seatWind:1,flowers:[],lastWallEvent:false,lastCopy:false};
   const before=JSON.stringify(input),result=score(input),label=`${faces}/${win}/${self}`;
   assert.ok(result.ok,label);assert.equal(JSON.stringify(input),before,label);
   const points=result.analysis.occurrences.filter(o=>o.fanCode==='mcr-03').reduce((sum,o)=>sum+o.points,0);
   assert.equal(points,green?88:0,`${label}: All Green`);
   const due=result.analysis.total+8;
   assert.deepEqual(result.settlement.delta,self?[3*due,-due,-due,-due]:[result.analysis.total+24,-due,-8,-8],label);
   if(green)positive++;else negative++;
  }
 }
 function enumerate(counts){
  if(counts.length<allowed.length){for(const n of [0,2,4])enumerate([...counts,n]);return;}
  if(counts.reduce((a,b)=>a+b,0)!==14)return;
  shapes++;
  const faces=allowed.flatMap((t,i)=>Array(counts[i]).fill(t));
  for(const win of new Set(faces))check(faces,win,true);
  // Replace two matching copies, including half of a physical quad. This
  // preserves a legal seven-pair shape and tests every forbidden face.
  for(let i=0;i<allowed.length;i++)if(counts[i])for(const replacement of outside){
   const mutant=[...faces];
   for(let n=0;n<2;n++)mutant.splice(mutant.indexOf(allowed[i]),1);
   mutant.push(replacement,replacement);check(mutant,replacement,false);
  }
 }
 enumerate([]);
 assert.equal(shapes,126);assert.equal(positive,1152);assert.equal(negative,32256);assert.equal(negative,positive*outside.length);
 console.log(`PASS: ${shapes} complete even-count green-alphabet shapes; ${positive} positive winning-face/source variants and ${negative} pair-replacement/source negatives across all ${outside.length} forbidden faces. Physical inventory, input immutability and payment arithmetic checked. Only fan 03 independently verified; not Seven Pairs selection, Tile Hog exclusion, other fan totals, actual round history, browser or LAN.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
