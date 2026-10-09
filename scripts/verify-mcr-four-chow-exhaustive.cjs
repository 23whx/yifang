// Exhaust all four-Chow multisets over three suits and starts 1..7. An
// independent rule table builds associated-fan candidates, then a separate
// exhaustive subset search checks the production detector + optimizer.
// This is the associated-Chow layer, not a complete 81-fan hand scorer.
// https://www.mindmahjong.com/adobe/MCR2021.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const js=require.extensions['.js'];require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file):js(module,file);
const {selectMcrAssociatedStructureFans}=require('../lib/mahjong/vendor/analysis/associated-fan-research.js');
const types=Array.from({length:21},(_,index)=>({suit:Math.floor(index/7),start:index%7+1}));
const pairGroups=[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]],tripleGroups=[[0,1,2],[0,1,3],[0,2,3],[1,2,3]];
function referenceCandidates(chows){
 const found=[];
 const add=(code,points,groups)=>found.push({fanCode:`mcr-${code}`,points,groups});
 for(const groups of pairGroups){
  const [left,right]=groups.map(index=>chows[index]);
  if(left.start===right.start)add(left.suit===right.suit?'69':'70',1,groups);
  if(left.suit===right.suit){
   if(Math.abs(left.start-right.start)===3)add('71',1,groups);
   if(Math.min(left.start,right.start)===1&&Math.max(left.start,right.start)===7)add('72',1,groups);
  }
 }
 for(const groups of tripleGroups){
  const selected=groups.map(index=>chows[index]),suits=new Set(selected.map(item=>item.suit)),starts=selected.map(item=>item.start).sort((a,b)=>a-b),flat=starts.join(',');
  if(suits.size===1){
   if(starts[0]===starts[2])add('23',24,groups);
   if(flat==='1,4,7')add('28',16,groups);
   if(starts[1]-starts[0]===starts[2]-starts[1]&&[1,2].includes(starts[1]-starts[0]))add('30',16,groups);
  }
  if(suits.size===3){
   if(starts[0]===starts[2])add('41',8,groups);
   if(flat==='1,4,7')add('39',8,groups);
   if(starts[1]===starts[0]+1&&starts[2]===starts[1]+1)add('51',6,groups);
  }
 }
 const suits=new Set(chows.map(item=>item.suit)),starts=chows.map(item=>item.start).sort((a,b)=>a-b);
 if(suits.size===1){
  if(starts[0]===starts[3])add('14',48,[0,1,2,3]);
  if(starts.every((start,index)=>index===0||start-starts[index-1]===starts[1]-starts[0])&&[1,2].includes(starts[1]-starts[0]))add('16',32,[0,1,2,3]);
 }
 return found;
}
function legal(items){
 const parent=[0,1,2,3],used=new Map();
 const root=index=>{while(parent[index]!==index)index=parent[index];return index;};
 for(const item of items){
  const groups=item.groups??item.matchedGroups,usedGroups=used.get(item.fanCode)??new Set();
  if(groups.some(group=>usedGroups.has(group)))return false;
  const roots=groups.map(root);if(new Set(roots).size!==roots.length)return false;
  for(const group of groups)usedGroups.add(group);used.set(item.fanCode,usedGroups);
  for(const part of roots.slice(1))parent[part]=roots[0];
 }
 return true;
}
function bestPoints(candidates){
 let best=0;
 for(let mask=1;mask<2**candidates.length;mask++){
  const selected=candidates.filter((_,index)=>(mask&(1<<index))!==0),points=selected.reduce((sum,item)=>sum+item.points,0);
  if(points>best&&legal(selected))best=points;
 }
 return best;
}
const faces=['m','p','s'],seen=new Set();let hands=0,candidateCount=0,maxCandidates=0;
for(let first=0;first<21;first++)for(let second=first;second<21;second++)for(let third=second;third<21;third++)for(let fourth=third;fourth<21;fourth++){
 const chows=[first,second,third,fourth].map(index=>types[index]),expected=referenceCandidates(chows);
 const decomposition={concealedMelds:chows.map(({suit,start})=>({kind:'sequence',tiles:[start,start+1,start+2].map(rank=>`${rank}${faces[suit]}`)})),declaredMelds:[]};
 const actual=selectMcrAssociatedStructureFans(decomposition),label=chows.map(item=>`${item.start}${faces[item.suit]}`).join(',');
 assert.equal(actual.points,bestPoints(expected),label);assert.ok(legal(actual.candidates),`${label}: selected associations must not reuse groups`);
 for(const item of actual.candidates)assert.ok(expected.some(candidate=>candidate.fanCode===item.fanCode&&candidate.groups.join(',')===item.matchedGroups.join(',')),`${label}: unexpected ${item.fanCode}/${item.matchedGroups}`);
 assert.deepEqual(actual.fanCodes,actual.candidates.map(item=>item.fanCode),`${label}: reported fan codes`);
 for(const item of expected)seen.add(item.fanCode);candidateCount+=expected.length;maxCandidates=Math.max(maxCandidates,expected.length);hands++;
}
assert.equal(hands,10626);assert.deepEqual([...seen].sort(),['mcr-14','mcr-16','mcr-23','mcr-28','mcr-30','mcr-39','mcr-41','mcr-51','mcr-69','mcr-70','mcr-71','mcr-72'].sort());
console.log(`PASS: ${hands} exhaustive four-Chow multisets, ${candidateCount} independently detected association candidates (${seen.size} fan codes), max ${maxCandidates}/hand; exact optimal points and no reused groups.`);
