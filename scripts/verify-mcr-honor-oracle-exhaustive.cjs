// Independent honor predicates, complete physical fixed-meld hands. WMO/EMA:
// https://mahjong-europe.org/portal/images/docs/mcr_EN.pdf
// This certifies only the listed honor contributions, not the other 71 fans.
const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-analysis-core'?core:load.call(this,request,...args);};
 require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {scoreMcrHand:score}=require('../lib/mahjong/mcr-score.ts');
 const codes=['01','02','09','10','11','38','54','59','60','61'],positive=Object.fromEntries(codes.map(c=>[c,0])),negative={...positive};
 const numeric=[0,4,11,24];let masks=0,hands=0;
 for(let mask=0;mask<128;mask++){
  const honors=Array.from({length:7},(_,i)=>27+i).filter((_,i)=>mask&(1<<i));if(honors.length>4)continue;masks++;
  const groups=[...honors,...numeric.slice(0,4-honors.length)],winds=honors.filter(t=>t<31),dragons=honors.filter(t=>t>=31);
  for(let pair=0;pair<34;pair++){
   if(groups.includes(pair))continue;
   const bigWinds=winds.length===4,bigDragons=dragons.length===3;
   const littleWinds=winds.length===3&&pair>=27&&pair<31;
   const littleDragons=dragons.length===2&&pair>=31;
   const threeWinds=winds.length===3&&!littleWinds;
   const doubleDragons=dragons.length===2&&!littleDragons;
   const expected={
    '01':bigWinds?88:0,'02':bigDragons?88:0,'09':littleWinds?64:0,'10':littleDragons?64:0,
    '11':honors.length===4&&pair>=27?64:0,'38':threeWinds?12:0,'54':doubleDragons?6:0,
    '59':bigDragons||littleDragons||doubleDragons?0:2*dragons.length,
   };
   for(let roundWind=0;roundWind<4;roundWind++)for(let seatWind=0;seatWind<4;seatWind++)for(const selfDraw of [false,true])for(const kongs of [false,true]){
    const input={concealedBeforeWin:[pair],winningTile:pair,melds:groups.map(t=>({kind:kongs?'kong':'pung',tiles:Array(kongs?4:3).fill(t),open:true})),winner:0,from:selfDraw?0:1,source:selfDraw?'wall':'discard',roundWind,seatWind,flowers:[],lastWallEvent:false,lastCopy:false};
    expected['60']=!bigWinds&&winds.includes(27+roundWind)?2:0;
    expected['61']=!bigWinds&&winds.includes(27+seatWind)?2:0;
    const label=`${mask}/${pair}/${roundWind}/${seatWind}/${selfDraw}/${kongs}`,before=JSON.stringify(input),r=score(input);
    assert.ok(r.ok,`${label}: valid completed fixed-meld hand`);assert.equal(JSON.stringify(input),before,`${label}: immutable input`);
    const counts=new Array(34).fill(0);for(const m of input.melds)for(const t of m.tiles)counts[t]++;counts[pair]+=2;
    assert.ok(counts.every(c=>c<=4));assert.equal(counts.reduce((a,b)=>a+b,0),kongs?18:14);
    for(const code of codes){
     const points=r.analysis.occurrences.filter(o=>o.fanCode===`mcr-${code}`).reduce((sum,o)=>sum+o.points,0);
     assert.equal(points,expected[code],`${label}: honor ${code}`);
     (expected[code]?positive:negative)[code]++;
    }
    const due=r.analysis.total+8;
    assert.deepEqual(r.settlement.delta,selfDraw?[3*due,-due,-due,-due]:[r.analysis.total+24,-due,-8,-8],`${label}: payment arithmetic`);
    hands++;
   }
  }
 }
 assert.equal(masks,99);assert.equal(hands,190080);
 for(const code of codes){assert.ok(positive[code]>0,`${code}: positive required`);assert.ok(negative[code]>0,`${code}: negative required`);}
 console.log(`PASS: ${hands} complete fixed-meld hands from all ${masks} honor subsets of size 0–4, all 30 unused pair faces, 16 round/seat-wind contexts, self-draw/discard and Pung/Kong variants. Ten honor families have independent exact positive/negative contributions: ${JSON.stringify({positive,negative})}. Physical inventory, immutable input and payments checked. Other fans, closed hands, alternative decomposition, event history and browser/LAN are not certified.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
