// Exhaust physically possible 3-Chow/1-Pung and 1-Chow/3-Pung structures.
// Independent rules identify group-associated candidates; this is not a
// complete-hand, wait, event, or 81-fan scoring certification.
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const js=require.extensions['.js'];require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file):js(module,file);
const {selectMcrAssociatedStructureFans}=require('../lib/mahjong/vendor/analysis/associated-fan-research.js');
const suits=['m','p','s'],honors=['E','S','W','N','C','F','P'];
const chows=suits.flatMap((suit,s)=>Array.from({length:7},(_,start)=>({suit:s,start:start+1,tiles:[start,start+1,start+2].map(rank=>s*9+rank),meld:{kind:'sequence',tiles:[start+1,start+2,start+3].map(rank=>`${rank}${suit}`)}})));
const pungs=Array.from({length:34},(_,tile)=>({tile,suit:tile<27?Math.floor(tile/9):null,rank:tile<27?tile%9+1:null,meld:{kind:'triplet',tile:tile<27?`${tile%9+1}${suits[Math.floor(tile/9)]}`:honors[tile-27]}}));
const pairGroups=[[0,1],[0,2],[1,2]];
function candidate(fanCode,points,groups){return {fanCode:`mcr-${fanCode}`,points,groups};}
function candidatesForChows(items){
 const found=[];
 for(const groups of pairGroups){
  const [a,b]=groups.map(index=>items[index]);
  if(a.start===b.start)found.push(candidate(a.suit===b.suit?69:70,1,groups));
  if(a.suit===b.suit){
   if(Math.abs(a.start-b.start)===3)found.push(candidate(71,1,groups));
   if(Math.min(a.start,b.start)===1&&Math.max(a.start,b.start)===7)found.push(candidate(72,1,groups));
  }
 }
 const starts=items.map(item=>item.start).sort((a,b)=>a-b),suitCount=new Set(items.map(item=>item.suit)).size;
 if(suitCount===1){
  if(starts[0]===starts[2])found.push(candidate(23,24,[0,1,2]));
  if(starts.join(',')==='1,4,7')found.push(candidate(28,16,[0,1,2]));
  if([1,2].includes(starts[1]-starts[0])&&starts[2]-starts[1]===starts[1]-starts[0])found.push(candidate(30,16,[0,1,2]));
 }
 if(suitCount===3){
  if(starts[0]===starts[2])found.push(candidate(41,8,[0,1,2]));
  if(starts.join(',')==='1,4,7')found.push(candidate(39,8,[0,1,2]));
  if(starts[1]-starts[0]===1&&starts[2]-starts[1]===1)found.push(candidate(51,6,[0,1,2]));
 }
 return found;
}
function candidatesForPungs(items){
 const found=[];
 for(const groups of pairGroups){
  const [a,b]=groups.map(index=>items[index]);
  if(a.suit!==null&&b.suit!==null&&a.suit!==b.suit&&a.rank===b.rank)found.push(candidate(65,2,groups.map(index=>index+1)));
 }
 if(items.every(item=>item.suit!==null)){
  const ranks=items.map(item=>item.rank).sort((a,b)=>a-b),suitCount=new Set(items.map(item=>item.suit)).size;
  if(suitCount===3&&ranks[0]===ranks[2])found.push(candidate(32,16,[1,2,3]));
  if(suitCount===1&&ranks[1]-ranks[0]===1&&ranks[2]-ranks[1]===1)found.push(candidate(24,24,[1,2,3]));
  if(suitCount===3&&ranks[1]-ranks[0]===1&&ranks[2]-ranks[1]===1)found.push(candidate(42,8,[1,2,3]));
 }
 return found;
}
function legal(items){
 const parent=[0,1,2,3],used=new Map();
 const root=index=>{while(parent[index]!==index)index=parent[index];return index;};
 for(const item of items){
  const groups=item.groups??item.matchedGroups,own=used.get(item.fanCode)??new Set();
  if(groups.some(group=>own.has(group)))return false;
  const roots=groups.map(root);if(new Set(roots).size!==roots.length)return false;
  for(const group of groups)own.add(group);used.set(item.fanCode,own);
  for(const part of roots.slice(1))parent[part]=roots[0];
 }
 return true;
}
function bestPoints(items){let best=0;for(let mask=1;mask<2**items.length;mask++){const selected=items.filter((_,index)=>mask&(1<<index));if(legal(selected))best=Math.max(best,selected.reduce((sum,item)=>sum+item.points,0));}return best;}
function verify(melds,expected,label){
 const actual=selectMcrAssociatedStructureFans({concealedMelds:melds,declaredMelds:[]});
 assert.equal(actual.points,bestPoints(expected),`${label}: optimal score`);
 assert.ok(legal(actual.candidates),`${label}: selected groups cannot be reused`);
 for(const item of actual.candidates)assert.ok(expected.some(reference=>reference.fanCode===item.fanCode&&reference.groups.join(',')===item.matchedGroups.join(',')&&reference.points===item.points),`${label}: unexpected ${item.fanCode}/${item.matchedGroups}`);
 assert.deepEqual(actual.fanCodes,actual.candidates.map(item=>item.fanCode),`${label}: reported fan codes`);
}
const counts=new Array(34).fill(0),seen=new Set();let threeChow=0,threePung=0,skippedChow=0,skippedPung=0;
for(let a=0;a<21;a++)for(let b=a;b<21;b++)for(let c=b;c<21;c++)for(let p=0;p<34;p++){
 counts.fill(0);for(const tile of [...chows[a].tiles,...chows[b].tiles,...chows[c].tiles])counts[tile]++;counts[p]+=3;
 if(counts.some(value=>value>4)){skippedChow++;continue;}
 const selected=[chows[a],chows[b],chows[c]],expected=candidatesForChows(selected);
 verify([...selected.map(item=>item.meld),pungs[p].meld],expected,`3 chow ${a},${b},${c}; pung ${p}`);
 for(const item of expected)seen.add(item.fanCode);threeChow++;
}
for(let c=0;c<21;c++)for(let a=0;a<34;a++)for(let b=a+1;b<34;b++)for(let d=b+1;d<34;d++){
 counts.fill(0);for(const tile of chows[c].tiles)counts[tile]++;for(const p of [a,b,d])counts[p]+=3;
 if(counts.some(value=>value>4)){skippedPung++;continue;}
 const selected=[pungs[a],pungs[b],pungs[d]],expected=candidatesForPungs(selected);
 verify([chows[c].meld,...selected.map(item=>item.meld)],expected,`chow ${c}; 3 pung ${a},${b},${d}`);
 for(const item of expected)seen.add(item.fanCode);threePung++;
}
assert.deepEqual({threeChow,threePung,skippedChow,skippedPung},{threeChow:57952,threePung:125664,skippedChow:2262,skippedPung:0});
assert.deepEqual([...seen].sort(),['mcr-23','mcr-24','mcr-28','mcr-30','mcr-32','mcr-39','mcr-41','mcr-42','mcr-51','mcr-65','mcr-69','mcr-70','mcr-71','mcr-72'].sort());
console.log(`PASS: ${threeChow} physical 3-Chow/1-Pung and ${threePung} 1-Chow/3-Pung structures (${skippedChow+skippedPung} impossible excluded); ${seen.size} fan codes, independent candidates, optimal score and no reused groups.`);
