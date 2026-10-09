// Independently enumerate small associated-fan candidate sets to check the
// 2021 MCR no-splitting, no-identical-group and once-only combination model.
// This validates optimizer search, not whether a particular fan candidate was
// detected from a hand. https://www.mindmahjong.com/adobe/MCR2021.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const js=require.extensions['.js'];require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file):js(module,file);
const {optimizeMcrAssociatedFans}=require('../lib/mahjong/vendor/analysis/combination-optimizer.js');
function legal(candidates,groupCount){
 const parent=Array.from({length:groupCount},(_,index)=>index),used=new Map();
 const root=index=>{while(parent[index]!==index)index=parent[index];return index;};
 for(const item of candidates){
  const sameFan=used.get(item.fanCode)??new Set();
  if(item.matchedGroups.some(group=>sameFan.has(group)))return false;
  const roots=item.matchedGroups.map(root);
  if(new Set(roots).size!==roots.length)return false;
  for(const group of item.matchedGroups)sameFan.add(group);
  used.set(item.fanCode,sameFan);
  for(const part of roots.slice(1))parent[part]=roots[0];
 }
 return true;
}
function brute(candidates,groupCount){
 let best=0;
 for(let mask=0;mask<2**candidates.length;mask++){
  const selected=candidates.filter((_,index)=>(mask&(1<<index))!==0);
  const score=selected.reduce((sum,item)=>sum+item.points,0);
  if(score>best&&legal(selected,groupCount))best=score;
 }
 return best;
}
let state=81234567;
const random=limit=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state%limit;};
const groups=[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3],[0,1,2],[0,1,3],[0,2,3],[1,2,3],[0,1,2,3]],fans=['mcr-69','mcr-70','mcr-71','mcr-72','mcr-23','mcr-28','mcr-39'],values=[1,1,1,1,24,16,8];
const fixed=[
 [
  {fanCode:'mcr-69',key:'a',points:1,matchedGroups:[0,1]},
  {fanCode:'mcr-70',key:'b',points:1,matchedGroups:[1,2]},
  {fanCode:'mcr-71',key:'c',points:1,matchedGroups:[2,3]},
  {fanCode:'mcr-72',key:'d',points:1,matchedGroups:[0,3]},
 ],
 [
  {fanCode:'mcr-69',key:'a',points:1,matchedGroups:[0,1]},
  {fanCode:'mcr-69',key:'b',points:1,matchedGroups:[2,3]},
  {fanCode:'mcr-28',key:'c',points:16,matchedGroups:[0,1,2]},
 ],
];
let cases=0;
for(const candidates of fixed){
 const target=brute(candidates,4),actual=optimizeMcrAssociatedFans(candidates,4);
 assert.equal(actual.points,target);assert.ok(legal(actual.candidates,4));cases++;
}
for(let trial=0;trial<600;trial++){
 const size=6+random(8),candidates=[];
 for(let index=0;index<size;index++){
  const fanIndex=random(fans.length),matchedGroups=groups[random(groups.length)];
  candidates.push({fanCode:fans[fanIndex],key:`trial-${trial}-candidate-${index}`,points:values[fanIndex],matchedGroups});
 }
 const target=brute(candidates,4),actual=optimizeMcrAssociatedFans(candidates,4),reordered=optimizeMcrAssociatedFans([...candidates].reverse(),4);
 assert.equal(actual.points,target,`trial ${trial}`);assert.equal(reordered.points,target,`reverse trial ${trial}`);
 assert.ok(legal(actual.candidates,4),`trial ${trial}: chosen candidates must be legal`);
 assert.deepEqual(actual.candidates.map(item=>item.key),reordered.candidates.map(item=>item.key),`trial ${trial}: input order must not affect choice`);
 cases++;
}
console.log(`PASS: ${cases} independently brute-forced associated-fan candidate sets; optimum points, no group reuse/cycles, and input-order invariance.`);
