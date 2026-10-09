// Complete fixed open-Chow hands, independent whole-hand facts and exclusions.
// EMA definitions: https://mahjong-europe.org/portal/images/docs/mcr_EN.pdf
// A last-wall event supplies independent eligibility, NOT event-history proof.
const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-analysis-core'?core:load.call(this,request,...args);};
 require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {scoreMcrHand:score}=require('../lib/mahjong/mcr-score.ts');
 const types=Array.from({length:21},(_,i)=>({suit:Math.floor(i/7),start:i%7+1,tiles:[0,1,2].map(n=>9*Math.floor(i/7)+i%7+n)}));
 const codes=['13','22','25','26','27','29','31','36','37','40','50','55','63','64','68','75'];
 const positive=Object.fromEntries(codes.map(c=>[c,0])),negative={...positive};
 const reversible=new Set([9,10,11,12,13,16,17,19,21,22,23,25,26,33]);
 let structures=0,cases=0,physicalPairs=0,rejectedPairs=0;
 for(let a=0;a<21;a++)for(let b=a;b<21;b++)for(let c=b;c<21;c++)for(let d=c;d<21;d++){
  const indexes=[a,b,c,d],groups=indexes.map(i=>types[i]),faces=groups.flatMap(g=>g.tiles),base=new Array(34).fill(0);
  faces.forEach(t=>base[t]++);assert.ok(base.every(n=>n<=4));structures++;
  for(let pair=0;pair<34;pair++){
   if(base[pair]>2){rejectedPairs++;continue;}physicalPairs++;
   const all=[...faces,pair,pair],numeric=pair<27,suits=new Set(all.filter(t=>t<27).map(t=>Math.floor(t/9))),rank=(t)=>t%9+1;
   const pure=numeric&&suits.size===1,upper=numeric&&all.every(t=>rank(t)>=7),middle=numeric&&all.every(t=>rank(t)>=4&&rank(t)<=6),lower=numeric&&all.every(t=>rank(t)<=3);
   const simples=numeric&&all.every(t=>rank(t)>=2&&rank(t)<=8),five=numeric&&rank(pair)===5&&groups.every(g=>g.start>=3&&g.start<=5);
   const starts=groups.map(g=>g.start).sort((x,y)=>x-y);
   const dragon=pure&&rank(pair)===5&&starts.join(',')==='1,1,7,7';
   const groupSuits=new Set(groups.map(g=>g.suit));
   const mixedDragon=numeric&&rank(pair)===5&&groupSuits.size===2&&!groupSuits.has(Math.floor(pair/9))&&[...groupSuits].every(s=>groups.filter(g=>g.suit===s).map(g=>g.start).sort((x,y)=>x-y).join(',')==='1,7');
   const push=all.every(t=>reversible.has(t)),counts=[...base];counts[pair]+=2;
   const expected={
    '13':dragon?64:0,'22':pure&&!dragon?24:0,'25':upper?24:0,'26':middle?24:0,'27':lower?24:0,'29':mixedDragon?16:0,'31':five?16:0,
    '36':numeric&&all.every(t=>rank(t)>=6)&&!upper?12:0,'37':numeric&&all.every(t=>rank(t)<=4)&&!lower?12:0,
    '40':push?8:0,'50':!numeric&&groupSuits.size===1?6:0,
    '55':groups.every(g=>g.start===1||g.start===7)&&(pair>=27||rank(pair)===1||rank(pair)===9)?4:0,
    '63':numeric&&!dragon&&!mixedDragon?2:0,
    '64':a===d?0:2*counts.filter(n=>n===4).length,
    '68':simples&&!middle&&!five?2:0,'75':suits.size===2&&!push?1:0,
   };
   for(const self of [false,true]){
    const input={concealedBeforeWin:[pair],winningTile:pair,melds:groups.map(g=>({kind:'chow',tiles:[...g.tiles],open:true})),winner:0,from:self?0:1,source:self?'wall':'discard',roundWind:0,seatWind:1,flowers:[],lastWallEvent:true,lastCopy:false};
    const before=JSON.stringify(input),r=score(input),label=`${indexes}/${pair}/${self}`;
    assert.ok(r.ok,label);assert.equal(JSON.stringify(input),before,label);
    for(const code of codes){
     assert.equal(r.analysis.occurrences.filter(o=>o.fanCode===`mcr-${code}`).reduce((n,o)=>n+o.points,0),expected[code],`${label}: ${code}`);
     (expected[code]?positive:negative)[code]++;
    }
    // A number pair inherently gives All Chows (or a containing dragon fan),
    // so No Honors never contributes separately to a four-open-Chow hand.
    assert.ok(!r.analysis.fanCodes.includes('mcr-76'),`${label}: No Honors duplicate`);
    assert.ok(counts.every(n=>n<=4));assert.equal(counts.reduce((x,y)=>x+y,0),14);
    const due=r.analysis.total+8;assert.deepEqual(r.settlement.delta,self?[3*due,-due,-due,-due]:[r.analysis.total+24,-due,-8,-8],label);
    cases++;
   }
  }
  if(structures%2000===0)console.log(`Progress: ${structures}/10626 structures, ${cases} complete hands`);
 }
 assert.equal(structures,10626);assert.equal(physicalPairs+rejectedPairs,10626*34);assert.equal(cases,2*physicalPairs);
 for(const code of codes){assert.ok(positive[code]>0,`${code}: positive`);assert.ok(negative[code]>0,`${code}: negative`);}
 console.log(`PASS: ${cases} complete four-open-Chow last-wall hands, all ${structures} Chow multisets, all ${physicalPairs} legal pairs (${rejectedPairs} physical fifth/sixth-copy pairs rejected), both sources. Independent exact 16 whole-hand contributions/exclusions and No Honors invariant, inventory, immutability and payments: ${JSON.stringify({positive,negative})}. Not other fans, concealed/Kong/mixed/decomposition choices, actual event histories, browser or LAN proof.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
