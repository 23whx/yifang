// Exhaust all physically valid four-distinct-Pung structures, including honors, and
// independently detect the five association fans involving sets.
// Tests only the five numeric association fans, not honor fans or full hands.
// WMO rules: https://www.mindmahjong.com/adobe/MCR2021.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const js=require.extensions['.js'];require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file):js(module,file);
const {selectMcrAssociatedStructureFans}=require('../lib/mahjong/vendor/analysis/associated-fan-research.js');
const honors=['E','S','W','N','C','F','P'],faces=['m','p','s'];
const types=Array.from({length:34},(_,index)=>({suit:index<27?Math.floor(index/9):null,rank:index<27?index%9+1:null,face:index<27?`${index%9+1}${faces[Math.floor(index/9)]}`:honors[index-27]}));
const pairs=[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]],triples=[[0,1,2],[0,1,3],[0,2,3],[1,2,3]];
function referenceCandidates(sets){
 const found=[],add=(code,points,groups)=>found.push({fanCode:`mcr-${code}`,points,groups});
 for(const groups of pairs){const [left,right]=groups.map(index=>sets[index]);if(left.suit!==null&&right.suit!==null&&left.suit!==right.suit&&left.rank===right.rank)add('65',2,groups);}
 for(const groups of triples){
  const chosen=groups.map(index=>sets[index]);if(chosen.some(item=>item.suit===null))continue;
  const suits=new Set(chosen.map(item=>item.suit)),ranks=chosen.map(item=>item.rank).sort((a,b)=>a-b),sameRank=ranks[0]===ranks[2],consecutive=ranks[0]+1===ranks[1]&&ranks[1]+1===ranks[2];
  if(suits.size===3&&sameRank)add('32',16,groups);
  if(suits.size===1&&consecutive)add('24',24,groups);
  if(suits.size===3&&consecutive)add('42',8,groups);
 }
 const suits=new Set(sets.map(item=>item.suit)),ranks=sets.map(item=>item.rank).sort((a,b)=>a-b);
 if(sets.every(item=>item.suit!==null)&&suits.size===1&&ranks.every((rank,index)=>index===0||rank===ranks[index-1]+1))add('15',48,[0,1,2,3]);
 return found;
}
function legal(items){
 const parent=[0,1,2,3],used=new Map();const root=index=>{while(parent[index]!==index)index=parent[index];return index;};
 for(const item of items){
  const groups=item.groups??item.matchedGroups,prior=used.get(item.fanCode)??new Set();
  if(groups.some(group=>prior.has(group)))return false;
  const roots=groups.map(root);if(new Set(roots).size!==roots.length)return false;
  for(const group of groups)prior.add(group);used.set(item.fanCode,prior);
  for(const part of roots.slice(1))parent[part]=roots[0];
 }
 return true;
}
function optimum(candidates){
 let best=0;
 for(let mask=1;mask<2**candidates.length;mask++){
  const selected=candidates.filter((_,index)=>(mask&(1<<index))!==0),points=selected.reduce((sum,item)=>sum+item.points,0);
  if(points>best&&legal(selected))best=points;
 }
 return best;
}
const seen=new Set(),byHonorCount=[0,0,0,0,0];let hands=0,candidateCount=0,maxCandidates=0,checks=0;
for(let first=0;first<34;first++)for(let second=first+1;second<34;second++)for(let third=second+1;third<34;third++)for(let fourth=third+1;fourth<34;fourth++){
 const original=[first,second,third,fourth].map(index=>types[index]);
 // Same physical four tile kinds: ordinary closed triplets; all declared
 // kongs in reverse order; alternating kongs/pungs split across registration
 // lists. Associations do not depend on exposure or a fourth matching tile.
 const variants=[
  {items:original,closed:4,kongs:[]},
  {items:original.slice().reverse(),closed:0,kongs:[0,1,2,3]},
  {items:[original[0],original[2],original[3],original[1]],closed:2,kongs:[0,2]},
 ];
 for(const [variant,v] of variants.entries()){
 const sets=v.items,expected=referenceCandidates(sets),melds=sets.map((item,index)=>({kind:v.kongs.includes(index)?'kong':'triplet',tile:item.face})),decomposition={concealedMelds:melds.slice(0,v.closed),declaredMelds:melds.slice(v.closed)};
 const before=JSON.stringify(decomposition),actual=selectMcrAssociatedStructureFans(decomposition),label=`${sets.map(item=>item.face).join(',')}/${variant}`;
 assert.equal(JSON.stringify(decomposition),before,`${label}: input not mutated`);
 assert.equal(actual.points,optimum(expected),label);assert.ok(legal(actual.candidates),`${label}: no group reuse`);
 for(const item of actual.candidates)assert.ok(expected.some(candidate=>candidate.fanCode===item.fanCode&&candidate.points===item.points&&candidate.groups.join(',')===item.matchedGroups.join(',')),`${label}: unexpected ${item.fanCode}/${item.matchedGroups}`);
 assert.deepEqual(actual.fanCodes,actual.candidates.map(item=>item.fanCode),`${label}: reported fan codes`);
 for(const item of expected)seen.add(item.fanCode);maxCandidates=Math.max(maxCandidates,expected.length);checks++;
 if(variant===0)candidateCount+=expected.length;
 }
 byHonorCount[original.filter(item=>item.suit===null).length]++;hands++;
}
assert.equal(hands,46376);assert.equal(checks,139128);assert.deepEqual(byHonorCount,[17550,20475,7371,945,35]);assert.deepEqual([...seen].sort(),['mcr-15','mcr-24','mcr-32','mcr-42','mcr-65'].sort());
console.log(`PASS: ${hands} exhaustive four-distinct-Pung structures including honors [${byHonorCount}], ${candidateCount} independent numeric-association candidates (${seen.size} fan codes), max ${maxCandidates}/hand; ${checks} closed/declared-Kong/mixed registration checks, exact optimal points, group attribution, no reuse and immutable inputs. Not honor-fan detection, full-hand scoring, events or browser evidence.`);

// Also exercise the public scoring entry with complete, physically possible
// fixed open-meld hands. This does not independently certify their OTHER fans.
(async()=>{
 const Module=require('node:module'),core=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load;
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-analysis-core'?core:load.call(this,request,...args);};
 require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
 const {scoreMcrHand:score}=require('../lib/mahjong/mcr-score.ts');
 let complete=0;
 for(let a=0;a<34;a++)for(let b=a+1;b<34;b++)for(let c=b+1;c<34;c++)for(let d=c+1;d<34;d++){
  const indexes=[a,b,c,d],sets=indexes.map(i=>types[i]),pair=types.findIndex((_,i)=>!indexes.includes(i));
  for(const selfDraw of [false,true]){
  const input={concealedBeforeWin:[pair],winningTile:pair,melds:indexes.map(i=>({kind:'pung',tiles:[i,i,i],open:true})),winner:0,from:selfDraw?0:1,roundWind:0,seatWind:0,source:selfDraw?'wall':'discard',flowers:[],lastWallEvent:false,lastCopy:false};
  const before=JSON.stringify(input),result=score(input),label=`${indexes.join(',')}/${selfDraw?'self':'discard'}`;
  assert.ok(result.ok,`${label}: complete fixed-meld hand must be eligible`);
  assert.equal(JSON.stringify(input),before,`${label}: public score input unchanged`);
  const associated=result.analysis.occurrences.filter(o=>seen.has(o.fanCode)),expected=referenceCandidates(sets);
  assert.equal(associated.reduce((sum,o)=>sum+o.points,0),optimum(expected),`${label}: public entry preserves exact numeric association score`);
  for(const occurrence of associated)assert.ok(expected.some(e=>e.fanCode===occurrence.fanCode&&e.points===occurrence.points),`${label}: public entry invents numeric association`);
  // Payment oracle is independent arithmetic, with the scorer's hand value;
  // it does not establish that all other fan values are independently correct.
  assert.deepEqual(result.settlement.transfers.map(p=>[p.from,p.to,p.amount]).sort((x,y)=>x[0]-y[0]),[1,2,3].map(from=>[from,0,8+(selfDraw||from===1?result.analysis.total:0)]),`${label}: payments`);
  complete++;
  }
 }
 assert.equal(complete,92752);
 console.log(`PASS: ${complete} complete physical open-Pung self-draw/discard hands through public scorer, each with independent optimal five-family association score, no invented honor associations, immutable input and exact payment arithmetic. Other fans, alternative decompositions, events and browser play are not certified.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
