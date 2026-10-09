// Small-fan fixtures have a last-wall event as an explicit eight-point anchor,
// so loss of the tested fan can be inspected without hiding behind eligibility.
// Source: WMO MCR2021 definitions, https://www.mindmahjong.com/adobe/MCR2021.pdf
const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-analysis-core'?core:load.call(this,request,...args);};
 require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {scoreMcrHand:score}=require('../lib/mahjong/mcr-score.ts');
 const p=t=>({kind:'pung',tiles:[t,t,t],open:true}),c=t=>({kind:'chow',tiles:[t,t+1,t+2],open:true});
 const h=(melds,pair)=>({melds,concealedBeforeWin:[pair],winningTile:pair,winner:0,from:0,roundWind:0,seatWind:1,source:'wall',flowers:[],lastWallEvent:true,lastCopy:false});
 const rows=[
  ['38',12,h([p(27),p(28),p(29),c(12)],1),[h([p(27),p(28),p(31),c(12)],1),h([p(27),p(28),p(29),c(12)],30)]],
  ['22',24,h([c(0),c(3),c(6),p(1)],4),[h([c(0),c(3),c(6),p(1)],13),h([c(0),c(3),c(6),p(1)],27)]],
  ['49',6,h([p(1),p(13),p(25),p(27)],28),[h([c(0),p(13),p(25),p(27)],28)]],
  ['50',6,h([c(0),c(3),c(6),p(1)],27),[h([c(0),c(3),c(6),p(1)],4),h([c(9),c(3),c(6),p(1)],27)]],
  ['52',6,h([c(0),c(12),c(24),p(31)],27),[h([c(9),c(12),c(24),p(31)],27),h([c(0),c(3),c(24),p(31)],27),h([c(0),c(12),c(6),p(31)],27),h([c(0),c(12),c(24),p(31)],13),h([c(0),c(12),c(24),p(28)],27)]],
  ['54',6,h([p(31),p(32),c(0),c(12)],30),[h([p(31),p(26),c(0),c(12)],30)]],
  ['55',4,h([c(0),c(15),c(18),p(27)],28),[h([c(0),c(15),c(18),p(27)],4),h([c(1),c(15),c(18),p(27)],28)]],
  ['59',2,h([p(31),c(0),c(12),c(24)],30),[h([p(26),c(0),c(12),c(24)],30),h([p(26),c(0),c(12),c(24)],31)]],
  ['63',2,h([c(0),c(12),c(19),c(6)],13),[h([c(0),c(12),c(19),c(6)],27),h([p(1),c(12),c(19),c(6)],13)]],
  ['64',2,h([c(0),c(0),c(12),c(24)],0),[h([c(0),c(0),c(12),c(24)],27),h([{kind:'kong',tiles:[0,0,0,0],open:true},c(12),c(19),p(31)],27)]],
  ['68',2,h([c(1),c(12),c(23),p(10)],13),[h([c(1),c(12),c(23),p(10)],0),h([c(1),c(12),c(23),p(10)],27)]],
  ['69',1,h([c(0),c(0),c(12),c(23)],27),[h([c(0),c(1),c(12),c(23)],27)]],
  ['70',1,h([c(0),c(9),c(23),p(31)],27),[h([c(0),c(10),c(23),p(31)],27)]],
  ['71',1,h([c(0),c(3),c(23),p(31)],27),[h([c(0),c(4),c(23),p(31)],27)]],
  ['72',1,h([c(0),c(6),c(12),p(31)],27),[h([c(0),c(5),c(12),p(31)],27)]],
  ['73',1,h([p(0),c(12),c(23),c(3)],27),[h([p(1),c(12),c(23),c(3)],27)]],
  ['75',1,h([c(0),c(3),c(12),p(31)],27),[h([c(0),c(3),c(21),p(13)],27),h([c(0),c(3),c(6),p(31)],27),h([p(27),p(28),p(31),p(32)],30)]],
  ['76',1,h([c(0),c(12),c(23),p(1)],13),[h([c(0),c(12),c(23),p(1)],27)]],
 ];
 let checks=0;
 for(const [code,points,good,bad] of rows){
  for(const [input,expected] of [[good,points],...bad.map(x=>[x,0])]){
   const r=score(input);assert.ok(r.ok,`${code}: ${JSON.stringify(input)}`);
   assert.equal(r.analysis.occurrences.filter(o=>o.fanCode===`mcr-${code}`).reduce((n,o)=>n+o.points,0),expected,`${code}: ${JSON.stringify(input)}`);
   checks++;
  }
 }
 const twice=score(h([c(0),c(0),c(1),c(1)],27));
 assert.ok(twice.ok);assert.equal(twice.analysis.occurrences.filter(o=>o.fanCode==='mcr-64').reduce((n,o)=>n+o.points,0),4,'two independent four-copy faces');
 const exposed={...h([c(0),c(12),c(23),p(31)],27),source:'discard',from:1};
 const concealed={...exposed,melds:[],concealedBeforeWin:[0,1,2,12,13,14,23,24,25,31,31,31,27]};
 const closedKong={...concealed,melds:[{kind:'kong',tiles:[31,31,31,31],open:false}],concealedBeforeWin:[0,1,2,12,13,14,23,24,25,27]};
 const partlyClosed={...exposed,melds:exposed.melds.slice(1),concealedBeforeWin:[0,1,2,27]};
 const checkFan=(input,code,points)=>{
  const r=score(input);assert.ok(r.ok);
  assert.equal(r.analysis.occurrences.filter(o=>o.fanCode===code).reduce((n,o)=>n+o.points,0),points,code);
  checks++;
 };
 checkFan(exposed,'mcr-53',6);
 checkFan({...exposed,source:'wall',from:0},'mcr-53',0);
 checkFan(partlyClosed,'mcr-53',0);
 checkFan({...exposed,melds:[...exposed.melds.slice(0,3),{kind:'kong',tiles:[31,31,31,31],open:false}]},'mcr-53',0);
 for(const closed of [concealed,closedKong]){
  checkFan(closed,'mcr-62',2);
  checkFan({...closed,source:'wall',from:0},'mcr-62',0);
  checkFan({...closed,source:'wall',from:0},'mcr-56',4);
 }
 checkFan(partlyClosed,'mcr-62',0);
 checkFan({...closedKong,melds:[{...closedKong.melds[0],open:true}]},'mcr-62',0);
 checkFan({...closedKong,melds:[{...closedKong.melds[0],open:true}],source:'wall',from:0},'mcr-56',0);
 // No eight-point anchor here: a genuinely zero-fan ron becomes Chicken Hand.
 const chicken={...h([c(12),c(23),p(10)],27),concealedBeforeWin:[1,2,27,27],winningTile:0,source:'discard',from:1,lastWallEvent:false};
 for(const flowers of [[],[34],[34,35,36,37,38,39,40,41]]){
  const r=score({...chicken,flowers});assert.ok(r.ok);assert.deepEqual(r.analysis.fanCodes.filter(x=>x!=='mcr-81'),['mcr-43']);
  assert.equal(r.analysis.nonFlowerTotal,8);assert.equal(r.analysis.total,8+flowers.length);
 }
 const self=score({...chicken,source:'wall',from:0});
 assert.equal(self.ok,false);assert.equal(self.reason,'below-minimum','one point for self draw prevents Chicken Hand, rather than adding to it');
 // All Simples inherently has no Honors, but the one-point No Honors fan must
 // not be counted again. Terminal-bearing suited hands may still earn it.
 const allSimples=score(h([c(1),c(12),c(23),p(10)],13));
 assert.ok(allSimples.ok);
 assert.ok(allSimples.analysis.fanCodes.includes('mcr-68'));
 assert.ok(!allSimples.analysis.fanCodes.includes('mcr-76'));
 assert.ok(allSimples.analysis.exclusions.some(x=>x.fanCode==='mcr-76'&&x.excludedBy.some(cause=>cause.fanCode==='mcr-68')),'No Honors exclusion must identify All Simples');
 const terminalSuited=score(h([c(0),c(12),c(23),p(10)],13));
 assert.ok(terminalSuited.ok);
 assert.ok(!terminalSuited.analysis.fanCodes.includes('mcr-68'));
 assert.ok(terminalSuited.analysis.fanCodes.includes('mcr-76'),'A suited terminal breaks All Simples, not No Honors');
 // MCR2021 #55 explicitly permits Outside Hand with All Chows (#63).
 // Alter only the pair, one chow, or one chow's kind to test each condition
 // independently, rather than inferring either fan from the total score.
 const outsideChows=h([c(0),c(6),c(9),c(15)],18);
 const outsideCases=[
  [outsideChows,4,2,'terminal pair and four terminal chows'],
  [{...outsideChows,concealedBeforeWin:[19],winningTile:19},0,2,'middle pair breaks Outside Hand only'],
  [{...outsideChows,melds:[c(1),c(6),c(9),c(15)]},0,2,'inner chow breaks Outside Hand only'],
  [{...outsideChows,melds:[p(0),c(6),c(9),c(15)]},4,0,'terminal pung breaks All Chows only'],
 ];
 for(const [input,outsidePoints,chowsPoints,label] of outsideCases){
  const result=score(input);assert.ok(result.ok,label);
  const points=code=>result.analysis.occurrences.filter(item=>item.fanCode===code).reduce((sum,item)=>sum+item.points,0);
  assert.equal(points('mcr-55'),outsidePoints,`${label}: Outside Hand`);
  assert.equal(points('mcr-63'),chowsPoints,`${label}: All Chows`);
  const due=8+result.analysis.total;
  assert.deepEqual(result.settlement.delta,[3*due,-due,-due,-due],`${label}: self-draw payment`);
 }
 // A pure suit and All Chows each imply No Honors. Remove just the relevant
 // upper pattern to ensure the independent one-point fan becomes countable.
 for(let shift=0;shift<3;shift++){
  const t=(s,r)=>((s+shift)%3)*9+r;
  const noHonorsCases=[
   [h([c(t(0,0)),c(t(0,3)),c(t(0,6)),p(t(0,1))],t(0,4)),24,0,0,['mcr-22'],'pure suit'],
   [h([c(t(0,0)),c(t(0,3)),c(t(1,3)),p(t(0,1))],t(0,4)),0,0,1,[],'second suit breaks pure suit'],
   [h([c(t(0,0)),c(t(1,3)),c(t(2,1)),c(t(0,6))],t(1,4)),0,2,0,['mcr-63'],'four chows'],
   [h([c(t(0,0)),c(t(1,3)),c(t(2,1)),p(t(0,6))],t(1,4)),0,0,1,[],'pung breaks All Chows'],
   [h([c(t(0,0)),c(t(0,3)),c(t(0,6)),c(t(0,0))],t(0,4)),24,2,0,['mcr-22','mcr-63'],'pure suit and four chows'],
  ];
  for(const [input,pure,chows,noHonors,causes,label] of noHonorsCases){
   const result=score(input);assert.ok(result.ok,`${label}, suit ${shift}`);
   const points=code=>result.analysis.occurrences.filter(item=>item.fanCode===code).reduce((sum,item)=>sum+item.points,0);
   assert.equal(points('mcr-22'),pure,`${label}, suit ${shift}: Full Flush`);
   assert.equal(points('mcr-63'),chows,`${label}, suit ${shift}: All Chows`);
   assert.equal(points('mcr-76'),noHonors,`${label}, suit ${shift}: No Honors`);
   const excluded=result.analysis.exclusions.find(item=>item.fanCode==='mcr-76');
   assert.deepEqual(excluded?.excludedBy.map(item=>item.fanCode)??[],causes,`${label}, suit ${shift}: exclusion cause`);
   const due=8+result.analysis.total;
   assert.deepEqual(result.settlement.delta,[3*due,-due,-due,-due],`${label}, suit ${shift}: self-draw payment`);
   checks++;
  }
 }
 console.log(`PASS: ${rows.length+3} basic/context fan definitions, ${checks} positive/counterexample checks, repeatable Tile Hog, zero-fan ron/flowers and one-point self-draw rejection.`);
 console.log('PASS: All Simples suppresses its inherent No Honors point with an explicit exclusion cause; a terminal-bearing suited hand retains No Honors.');
 console.log('PASS: Outside Hand + All Chows combine, with pair/chow/pung counterexamples and conserved payments.');
 console.log('PASS: three-suit Full Flush/All Chows imply No Honors; removing either upper pattern restores its independent point and exact self-draw payment.');
})().catch(e=>{console.error(e);process.exitCode=1;});
