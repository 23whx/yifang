// Authored complete hands distinguish concealed tiles from an exposed pung,
// and discard-completed pungs from self-drawn pungs. No scorer-derived oracle.
// MCR fans 12,33,66: https://mahjong-europe.org/portal/images/docs/mcr_ENa5.pdf
const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-analysis-core'?core:load.call(this,request,...args);};
 require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {scoreMcrHand:score}=require('../lib/mahjong/mcr-score.ts');
 let cases=0;
 for(const suits of [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]]) {
  const groups=[suits[0]*9+1,suits[1]*9+4,suits[2]*9+7,27],pair=30;
  for(let mask=0;mask<16;mask++) {
   const hidden=groups.filter((_,i)=>mask&(1<<i));
   const melds=groups.filter((_,i)=>!(mask&(1<<i))).map(t=>({kind:'pung',tiles:[t,t,t],open:true}));
   const complete=[...hidden.flatMap(t=>[t,t,t]),pair,pair];
   for(const winningTile of [pair,...hidden])for(const self of [false,true]) {
    const before=[...complete];before.splice(before.indexOf(winningTile),1);
    const input={concealedBeforeWin:before,winningTile,melds,winner:0,from:self?0:1,roundWind:0,seatWind:1,source:self?'wall':'discard',flowers:[],lastWallEvent:false,lastCopy:false};
    const original=JSON.stringify(input),r=score(input),label=`${suits}/${mask}/${winningTile}/${self}`;
    assert.ok(r.ok,label);
    const count=hidden.length-Number(!self&&winningTile!==pair);
    const required=count===4?'mcr-12':count===3?'mcr-33':count===2?'mcr-66':null;
    for(const code of ['mcr-12','mcr-33','mcr-66'])assert.equal(r.analysis.fanCodes.includes(code),code===required,`${label} count ${count}, ${code}`);
    if(required)assert.equal(r.analysis.occurrences.filter(o=>o.fanCode===required).reduce((n,o)=>n+o.points,0),count===4?64:count===3?16:2);
    if(count===4){assert.ok(!r.analysis.fanCodes.includes('mcr-49'));assert.ok(!r.analysis.fanCodes.includes('mcr-62'));}
    assert.equal(r.analysis.fanCodes.includes('mcr-56'),hidden.length===4&&self,`${label}: fully concealed self draw`);
    assert.equal(r.analysis.fanCodes.includes('mcr-80'),hidden.length!==4&&self,`${label}: standalone self draw`);
    assert.equal(JSON.stringify(input),original);
    cases++;
   }
  }
 }
 console.log(`PASS: ${cases} complete-hand concealed-pung fixtures across all exposed subsets, six suit assignments, pair/pung completions and discard/self-draw; exact tier and absorbed lower fans.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
