// Independent whole-score oracle for isolated Seven Pairs, not a second copy
// of the production exclusion table. WMO/EMA rules #19 and composition fans:
// https://mahjong-europe.org/portal/images/docs/mcr_EN.pdf
// Six-face exceptions: docs/mcr-six-face-pairs-exclusion.md.
const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-analysis-core'?core:load.call(this,request,...args);};
 require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {scoreMcrHand:score}=require('../lib/mahjong/mcr-score.ts');
 // A small independently written partition search rejects alternate ordinary
 // interpretations. No production shape detector or fan catalog is imported.
 function ordinary(tiles){
  const counts=Array(34).fill(0);for(const t of tiles)counts[t]++;
  function groups(){
   const t=counts.findIndex(n=>n>0);if(t<0)return true;
   if(counts[t]>=3){counts[t]-=3;const ok=groups();counts[t]+=3;if(ok)return true;}
   if(t<27&&t%9<=6&&counts[t+1]&&counts[t+2]){counts[t]--;counts[t+1]--;counts[t+2]--;const ok=groups();counts[t]++;counts[t+1]++;counts[t+2]++;if(ok)return true;}
   return false;
  }
  for(let t=0;t<34;t++)if(counts[t]>=2){counts[t]-=2;const ok=groups();counts[t]+=2;if(ok)return true;}
  return false;
 }
 const green=new Set([19,20,21,23,25,32]),reversible=new Set([9,10,11,12,13,16,17,19,21,22,23,25,26,33]);
 function expected(tiles,source,lastWall,lastCopy,flowers){
  const result=[],add=(code,points,n=1)=>{for(let i=0;i<n;i++)result.push([`mcr-${String(code).padStart(2,'0')}`,points]);};
  const faces=[...new Set(tiles)],numbers=faces.filter(t=>t<27),honors=faces.filter(t=>t>=27),suits=new Set(numbers.map(t=>Math.floor(t/9))),ranks=numbers.map(t=>t%9+1);
  const shifted=faces.length===7&&suits.size===1&&!honors.length&&Math.max(...ranks)-Math.min(...ranks)===6;
  const terminals=faces.every(t=>t<27&&(t%9===0||t%9===8)),allHonors=!numbers.length;
  const mixedTerminals=!terminals&&!allHonors&&faces.every(t=>t>=27||t%9===0||t%9===8),allGreen=faces.every(t=>green.has(t));
  const reverse=faces.every(t=>reversible.has(t));
  add(shifted?6:19,shifted?88:24);
  if(allGreen)add(3,88);
  if(terminals)add(8,64);else if(allHonors)add(11,64);else if(mixedTerminals)add(18,32);
  if(!shifted&&suits.size===1&&!honors.length)add(22,24);
  if(suits.size===1&&honors.length)add(50,6);
  if(reverse)add(40,8);
  const suited=!honors.length,upper=suited&&ranks.every(r=>r>=7),middle=suited&&ranks.every(r=>r>=4&&r<=6),lower=suited&&ranks.every(r=>r<=3);
  if(upper)add(25,24);else if(middle)add(26,24);else if(lower)add(27,24);
  if(!upper&&suited&&ranks.every(r=>r>=6))add(36,12);
  if(!lower&&suited&&ranks.every(r=>r<=4))add(37,12);
  const simple=suited&&ranks.every(r=>r>=2&&r<=8);
  if(simple&&!middle)add(68,2);
  if(suits.size===3&&honors.some(t=>t<31)&&honors.some(t=>t>=31))add(52,6);
  if(suits.size===2&&!reverse)add(75,1);
  if(suited&&!shifted&&suits.size!==1&&!terminals&&!upper&&!middle&&!lower&&!ranks.every(r=>r>=6)&&!ranks.every(r=>r<=4)&&!simple)add(76,1);
  if(!allGreen&&!terminals)add(64,2,faces.filter(t=>tiles.filter(x=>x===t).length===4).length);
  const self=source==='wall'||source==='flower-replacement';
  if(self)add(56,4);
  if(lastWall)add(self?44:45,8);
  if(source==='robbed-kong')add(47,8);
  if(lastCopy&&source!=='robbed-kong')add(58,4);
  add(81,1,flowers);
  return result.sort((a,b)=>a[0].localeCompare(b[0]));
 }
 let seed=0x50414952;const random=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return Math.floor(seed/0x100000000*n);};
 const all=Array.from({length:34},(_,i)=>i),numeric=all.slice(0,27),rankSet=predicate=>numeric.filter(t=>predicate(t%9+1));
 const alphabets=[all,[...green],[0,8,9,17,18,26],all.slice(27),[0,8,9,17,18,26,...all.slice(27)],[...reversible],rankSet(r=>r>=7),rankSet(r=>r>=4&&r<=6),rankSet(r=>r<=3),rankSet(r=>r>=6),rankSet(r=>r<=4),rankSet(r=>r>=2&&r<=8),all.slice(0,9),[...all.slice(0,9),...all.slice(27)]];
 const hands=new Map();let skipped=0;
 for(const alphabet of alphabets){
  let accepted=0;
  for(let attempt=0;attempt<20000&&accepted<64;attempt++){
   const counts=Array(34).fill(0);for(let pair=0;pair<7;pair++){const available=alphabet.filter(t=>counts[t]<4),t=available[random(available.length)];counts[t]+=2;}
   const tiles=counts.flatMap((n,t)=>Array(n).fill(t)),key=tiles.join(',');
   if(ordinary(tiles)){skipped++;continue;}if(hands.has(key))continue;
   hands.set(key,tiles);accepted++;
  }
  assert.equal(accepted,64,'each composition stratum must contribute 64 distinct isolated pair hands');
 }
 // Shifted pairs offer standard decompositions but are independently known to
 // outrank them; retain the previous exact family acceptance separately.
 for(let suit=0;suit<3;suit++)for(let start=0;start<3;start++){const tiles=Array.from({length:7},(_,i)=>suit*9+start+i).flatMap(t=>[t,t]);hands.set(tiles.join(','),tiles);}
 let contexts=0;const seen=new Set();
 for(const tiles of hands.values())for(const source of ['wall','discard','flower-replacement','robbed-kong'])for(const lastCopy of [false,true])for(const flowers of [0,1,8]){
  if(source==='flower-replacement'&&!flowers)continue;
  for(const lastWallEvent of source==='wall'||source==='discard'?[false,true]:[false]){
   const winningTile=tiles[(contexts*7)%tiles.length],concealedBeforeWin=[...tiles];concealedBeforeWin.splice(concealedBeforeWin.indexOf(winningTile),1);
   const self=source==='wall'||source==='flower-replacement',winner=contexts%4,from=self?winner:(winner+1+contexts%3)%4;
   const input={concealedBeforeWin,winningTile,melds:[],winner,from,roundWind:contexts%4,seatWind:Math.floor(contexts/4)%4,source,lastWallEvent,lastCopy,flowers:Array.from({length:flowers},(_,i)=>34+i)},before=JSON.stringify(input);
   const result=score(input),want=expected(tiles,source,lastWallEvent,lastCopy,flowers),label=JSON.stringify({tiles,source,lastWallEvent,lastCopy,flowers});
   assert.ok(result.ok,label);
   const actual=result.analysis.occurrences.map(o=>[o.fanCode,o.points]).sort((a,b)=>a[0].localeCompare(b[0]));
   assert.deepEqual(actual,want,label);
   const total=want.reduce((sum,[,p])=>sum+p,0);assert.equal(result.analysis.total,total,label);assert.equal(result.analysis.nonFlowerTotal,total-flowers,label);
   assert.deepEqual(result.settlement.delta,[0,1,2,3].map(seat=>seat===winner?(self?3*(total+8):total+24):self||seat===from?-(total+8):-8),label);
   assert.equal(JSON.stringify(input),before,'input stays immutable');for(const [code] of want)seen.add(code);contexts++;
  }
 }
 assert.ok(seen.has('mcr-52')&&seen.has('mcr-64')&&seen.has('mcr-03')&&seen.has('mcr-08'));
 console.log(`PASS: ${hands.size} stratified pair hands, ${contexts} complete-score contexts; ${seen.size} fan codes; exact occurrence multiset, total, flower gate and four-seat payments. Independently excluded ${skipped} ordinary-overlap proposals. Scorer-only contexts, not event histories or an exhaustive proof of all hands.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
