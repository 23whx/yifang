// WMO MCR2021 fan57 explicitly assigns six points to one open + one closed kong.
// https://www.mindmahjong.com/adobe/MCR2021.pdf
// WMO's Chinese 2021 definitions for fans 05/17 explicitly permit concealed
// kong add-ons; fan 12 counts concealed kongs as concealed pungs. Distinct
// lower kong/concealed-set tiers are not stacked on the same sets.
const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-analysis-core'?core:load.call(this,request,...args);};
 require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {scoreMcrHand:score}=require('../lib/mahjong/mcr-score.ts');
 const count=n=>n.toString(2).replaceAll('0','').length;
 let cases=0;
 for(let kongMask=0;kongMask<16;kongMask++)if(count(kongMask)<=2)for(let closedMask=0;closedMask<16;closedMask++)if((closedMask&kongMask)===closedMask){
  const k=count(kongMask),c=count(closedMask);
  const expected=k===0?[]:k===1?(c?['mcr-67']:['mcr-74']):c===2?['mcr-48']:c===1?['mcr-57','mcr-67']:['mcr-57'];
  const kongPoints=k===0?0:k===1?(c?2:1):c===2?8:c===1?6:4;
  for(const self of [false,true]){
   const melds=[1,13,25,27].map((t,i)=>({kind:kongMask&(1<<i)?'kong':'pung',tiles:Array(kongMask&(1<<i)?4:3).fill(t),open:!(closedMask&(1<<i))}));
   const r=score({concealedBeforeWin:[28],winningTile:28,melds,winner:0,from:self?0:1,roundWind:0,seatWind:1,source:self?'wall':'discard',flowers:[],lastWallEvent:false,lastCopy:false});
   const label=`kong ${kongMask}, closed ${closedMask}, self ${self}`;
   assert.ok(r.ok,label);
   for(const code of ['mcr-05','mcr-17','mcr-48','mcr-57','mcr-67','mcr-74'])assert.equal(r.analysis.fanCodes.includes(code),expected.includes(code),`${label}: ${code}`);
   assert.ok(!r.analysis.fanCodes.includes('mcr-66'),'two concealed kongs already include these two concealed sets');
   // All Pungs6 + East prevailing2; all-exposed ron adds Melded Hand6,
   // otherwise Single Wait1, and self draw adds1. No other associations.
   const total=8+kongPoints+(self?2:c===0?6:1);
   assert.equal(r.analysis.nonFlowerTotal,total,label);
   assert.deepEqual(r.settlement.delta,self?[3*(total+8),-total-8,-total-8,-total-8]:[total+24,-total-8,-8,-8],label);
   cases++;
  }
 }
 const high=new Map();
 for(let mask=0;mask<16;mask++)if(count(mask)>=2){
  const melds=[1,13,25,27].map((t,i)=>({kind:mask&(1<<i)?'kong':'pung',tiles:Array(mask&(1<<i)?4:3).fill(t),open:true}));
  const r=score({concealedBeforeWin:[28],winningTile:28,melds,winner:0,from:0,roundWind:0,seatWind:1,source:'wall',flowers:[],lastWallEvent:false,lastCopy:false});
  assert.ok(r.ok,`high all-open ${mask}`);
  const tier=count(mask),code=tier===4?'mcr-05':tier===3?'mcr-17':'mcr-57';
  for(const c of ['mcr-05','mcr-17','mcr-57','mcr-74','mcr-48','mcr-67'])assert.equal(r.analysis.fanCodes.includes(c),c===code,`high all-open ${mask}: ${c}`);
  if(tier>=3){const total=tier===4?97:42;assert.equal(r.analysis.nonFlowerTotal,total,`high all-open ${mask}: total`);assert.deepEqual(r.settlement.delta,[3*(total+8),-total-8,-total-8,-total-8],`high all-open ${mask}: payment`);}
  high.set(mask,r.analysis.nonFlowerTotal);
 }
 for(const [mask,total] of high){
  if(count(mask)<3)continue;
  // WMO's Four Kongs definition explicitly excludes Single Wait: +56 tier
  // replacement minus the one-point wait present in the three-kong hand.
  for(let bit=0;bit<4;bit++)if(mask&(1<<bit))assert.equal(total-high.get(mask&~(1<<bit)),count(mask)===4?55:28,`high-tier delta ${mask}, bit ${bit}`);
 }
 let highConcealCases=0;
 for(let mask=0;mask<16;mask++)if(count(mask)>=3)for(let closedMask=0;closedMask<16;closedMask++)if((closedMask&mask)===closedMask)for(const self of [false,true]){
  const tier=count(mask),concealed=count(closedMask),addon=concealed===4?'mcr-12':concealed===3?'mcr-33':concealed===2?'mcr-48':concealed===1?'mcr-67':null;
  const melds=[1,13,25,27].map((t,i)=>({kind:mask&(1<<i)?'kong':'pung',tiles:Array(mask&(1<<i)?4:3).fill(t),open:!(closedMask&(1<<i))}));
  const r=score({concealedBeforeWin:[28],winningTile:28,melds,winner:0,from:self?0:1,roundWind:0,seatWind:1,source:self?'wall':'discard',flowers:[],lastWallEvent:false,lastCopy:false});
  const label=`high kong/concealment ${mask}/${closedMask}/${self?'self':'discard'}`;
  assert.ok(r.ok,label);
  for(const code of ['mcr-05','mcr-17','mcr-57','mcr-74','mcr-12','mcr-33','mcr-48','mcr-67','mcr-66'])
   assert.equal(r.analysis.fanCodes.includes(code),code===(tier===4?'mcr-05':'mcr-17')||code===addon,`${label}: ${code}`);
  assert.equal(r.analysis.fanCodes.includes('mcr-79'),tier===3&&(self||concealed>0),`${label}: Single Wait`);
  assert.equal(r.analysis.fanCodes.includes('mcr-53'),!self&&concealed===0,`${label}: Melded Hand`);
  assert.equal(r.analysis.fanCodes.includes('mcr-56'),self&&tier===4&&concealed===4,`${label}: Fully Concealed Hand`);
  // Four Concealed Pungs already implies Concealed Hand on a discard win.
  assert.equal(r.analysis.fanCodes.includes('mcr-62'),false,`${label}: Concealed Hand`);
  const add=[0,2,8,16][concealed],total=self?(tier===3?42+add:concealed===4?158:97+add):tier===3?(concealed===0?46:41+add):concealed===4?154:concealed===0?102:96+add;
  assert.equal(r.analysis.nonFlowerTotal,total,`${label}: total`);
  assert.deepEqual(r.settlement.delta,self?[3*(total+8),-total-8,-total-8,-total-8]:[total+24,-total-8,-8,-8],`${label}: payment`);
  highConcealCases++;
 }
 console.log(`PASS: ${cases} complete 0/1/2-kong hands plus ${highConcealCases} three/four-kong concealed/melded and win-source assignments; exact high/add-on fans, lower-tier and Single Wait exclusions, totals and self-draw/discard payments.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
