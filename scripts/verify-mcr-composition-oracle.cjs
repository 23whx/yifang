// Independent whole-hand composition oracle, fixed four open distinct Pungs.
// EMA Green Book definitions (not scorer/catalog-derived expectations):
// https://mahjong-europe.org/portal/images/docs/mcr_EN.pdf
const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-analysis-core'?core:load.call(this,request,...args);};
 require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {scoreMcrHand:score}=require('../lib/mahjong/mcr-score.ts');
 const codes=['21','22','25','26','27','36','37','49','50','52','68','75','76'];
 const positive=Object.fromEntries(codes.map(c=>[c,0])),negative={...positive};
 const terminal=t=>t<27&&(t%9===0||t%9===8),outside=t=>t>=27||terminal(t);
 // Dots 1–5,8,9; bamboo 2,4,5,6,8,9; White Dragon.
 const reversible=new Set([9,10,11,12,13,16,17,19,21,22,23,25,26,33]);
 let structures=0,cases=0;
 for(let a=0;a<34;a++)for(let b=a+1;b<34;b++)for(let c=b+1;c<34;c++)for(let d=c+1;d<34;d++){
  const groups=[a,b,c,d];structures++;
  for(let pair=0;pair<34;pair++){
   if(groups.includes(pair))continue; // otherwise five physical copies
   const all=[...groups,pair],numeric=all.every(t=>t<27),honors=all.some(t=>t>=27);
   const suits=new Set(all.filter(t=>t<27).map(t=>Math.floor(t/9))),ranks=all.filter(t=>t<27).map(t=>t%9+1);
   const even=numeric&&ranks.every(r=>r%2===0),upper=numeric&&ranks.every(r=>r>=7),middle=numeric&&ranks.every(r=>r>=4&&r<=6),lower=numeric&&ranks.every(r=>r<=3);
   const pure=numeric&&suits.size===1,simples=numeric&&ranks.every(r=>r>=2&&r<=8);
   const shifted=groups.every(t=>t<27&&Math.floor(t/9)===Math.floor(a/9))&&b===a+1&&c===a+2&&d===a+3;
   const allOutside=all.every(outside),bigWinds=groups.every(t=>t>=27&&t<31);
   const expected={
    '21':even?24:0,'22':pure?24:0,'25':upper?24:0,'26':middle?24:0,'27':lower?24:0,
    '36':numeric&&ranks.every(r=>r>=6)&&!upper?12:0,
    '37':numeric&&ranks.every(r=>r<=4)&&!lower?12:0,
    '49':!allOutside&&!bigWinds&&!even&&!shifted?6:0,
    '50':honors&&suits.size===1?6:0,
    '52':suits.size===3&&all.some(t=>t>=27&&t<31)&&all.some(t=>t>=31)?6:0,
    '68':simples&&!even&&!middle?2:0,
    '75':suits.size===2&&!all.every(t=>reversible.has(t))?1:0,
    '76':numeric&&!pure&&!simples&&!upper&&!lower&&!all.every(terminal)&&!ranks.every(r=>r>=6)&&!ranks.every(r=>r<=4)?1:0,
   };
   for(const selfDraw of [false,true]){
    const input={concealedBeforeWin:[pair],winningTile:pair,melds:groups.map(t=>({kind:'pung',tiles:[t,t,t],open:true})),winner:0,from:selfDraw?0:1,source:selfDraw?'wall':'discard',roundWind:0,seatWind:1,flowers:[],lastWallEvent:false,lastCopy:false};
    const before=JSON.stringify(input),r=score(input),label=`${groups}/${pair}/${selfDraw}`;
    assert.ok(r.ok,label);assert.equal(JSON.stringify(input),before,label);
    for(const code of codes){
     const actual=r.analysis.occurrences.filter(o=>o.fanCode===`mcr-${code}`).reduce((n,o)=>n+o.points,0);
     assert.equal(actual,expected[code],`${label}: ${code}`);
     (expected[code]?positive:negative)[code]++;
    }
    // Every group has three distinct-kind copies and the unused pair has two.
    assert.equal(new Set(all).size,5);assert.equal(input.melds.flatMap(m=>m.tiles).length+2,14);
    const due=r.analysis.total+8;
    assert.deepEqual(r.settlement.delta,selfDraw?[3*due,-due,-due,-due]:[r.analysis.total+24,-due,-8,-8],label);
    cases++;
   }
  }
  if(structures%5000===0)console.log(`Progress: ${structures}/46376 structures, ${cases} hands`);
 }
 assert.equal(structures,46376);assert.equal(cases,2782560);
 for(const code of codes){assert.ok(positive[code]>0,`${code}: positive evidence`);assert.ok(negative[code]>0,`${code}: negative evidence`);}
 console.log(`PASS: ${cases} complete fixed open-Pung hands, all ${structures} four-kind subsets of 34 faces, all 30 unused pair faces and both sources. Independent exact 13 composition-fan contributions and intrinsic exclusions, physical inventory, unchanged inputs and payment arithmetic: ${JSON.stringify({positive,negative})}. Not all other fans, Kongs/concealed/chow decompositions, winds/events, browser or LAN proof.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
