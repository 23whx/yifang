// Independent complete fixed-meld oracle for terminals/honors and local winds.
// WMO fans 8/11/18/38/60/61/73, not detector/catalog-derived expectations.
// https://www.mindmahjong.com/adobe/ZC2021.pdf
const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-analysis-core'?core:load.call(this,request,...args);};
 require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {scoreMcrHand:score}=require('../lib/mahjong/mcr-score.ts');
 const terminal=t=>t<27&&(t%9===0||t%9===8),outside=t=>t>=27||terminal(t),wind=t=>t>=27&&t<31;
 const face=t=>t<27?`${t%9+1}${['m','p','s'][Math.floor(t/9)]}`:['E','S','W','N','C','F','P'][t-27];
 const pool=[0,8,9,17,18,26,27,28,29,30,31,32,33,4];
 const codes=['08','11','18','60','61','73'],positive=Object.fromEntries(codes.map(c=>[c,0])),negative={...positive};
 const kongMasks=new Set();let structures=0,cases=0;
 for(let a=0;a<pool.length;a++)for(let b=a+1;b<pool.length;b++)for(let c=b+1;c<pool.length;c++)for(let d=c+1;d<pool.length;d++){
  const groups=[pool[a],pool[b],pool[c],pool[d]],winds=groups.filter(wind);structures++;
  for(let pair=0;pair<34;pair++){
   if(groups.includes(pair))continue;
   const all=[...groups,pair],allOutside=all.every(outside),allHonors=all.every(t=>t>=27),allTerminals=all.every(terminal);
   for(let roundWind=0;roundWind<4;roundWind++)for(let seatWind=0;seatWind<4;seatWind++)for(const selfDraw of [false,true]){
    // Across all 16 wind contexts each structure/pair covers all 16 masks.
    // Kong mask is paired with context, not independently crossed with it.
    const mask=(4*roundWind+seatWind+pair)%16;kongMasks.add(mask);
    const expectedFaces=allOutside?[]:groups.filter(t=>terminal(t)||(wind(t)&&winds.length<3&&t!==27+roundWind&&t!==27+seatWind)).map(face).sort();
    const expected={'08':allTerminals?64:0,'11':allHonors?64:0,'18':allOutside&&!allHonors&&!allTerminals?32:0,'60':winds.length<4&&winds.includes(27+roundWind)?2:0,'61':winds.length<4&&winds.includes(27+seatWind)?2:0,'73':expectedFaces.length};
    const input={concealedBeforeWin:[pair],winningTile:pair,melds:groups.map((t,i)=>({kind:mask&(1<<i)?'kong':'pung',tiles:Array(mask&(1<<i)?4:3).fill(t),open:true})),winner:0,from:selfDraw?0:1,source:selfDraw?'wall':'discard',roundWind,seatWind,flowers:[],lastWallEvent:false,lastCopy:false};
    const before=JSON.stringify(input),label=`${groups}/${pair}/${roundWind}/${seatWind}/${selfDraw}`,r=score(input);
    assert.ok(r.ok,label);assert.equal(JSON.stringify(input),before,label);
    for(const code of codes){
     const occurrences=r.analysis.occurrences.filter(o=>o.fanCode===`mcr-${code}`);
     assert.equal(occurrences.reduce((n,o)=>n+o.points,0),expected[code],`${label}: ${code}`);
     if(code==='73'){
      assert.ok(occurrences.every(o=>o.points===1&&o.matchedGroups.length===1&&new Set(o.matchedTiles).size===1),`${label}: each point belongs to one set`);
      assert.deepEqual(occurrences.map(o=>o.matchedTiles[0]).sort(),expectedFaces,`${label}: exact retained sets, not only aggregate count`);
     }
     (expected[code]?positive:negative)[code]++;
    }
    const inventory=new Array(34).fill(0);for(const m of input.melds)for(const t of m.tiles)inventory[t]++;inventory[pair]+=2;
    assert.ok(inventory.every(n=>n<=4));assert.equal(inventory.reduce((a,b)=>a+b,0),14+input.melds.filter(m=>m.kind==='kong').length);
    const due=r.analysis.total+8;assert.deepEqual(r.settlement.delta,selfDraw?[3*due,-due,-due,-due]:[r.analysis.total+24,-due,-8,-8],label);
    cases++;
   }
  }
 }
 assert.equal(structures,1001);assert.equal(cases,960960);assert.equal(kongMasks.size,16);
 for(const code of codes){assert.ok(positive[code]>0);assert.ok(negative[code]>0);}
 console.log(`PASS: ${cases} complete fixed-meld hands from ${structures} four-set subsets of six numerical terminals/seven honors/one middle face, all 30 unused pair faces, 16 wind contexts and both sources; all 16 Pung/Kong masks paired with wind context. Independent exact 08/11/18/60/61/73 contributions and retained terminal/wind-set identities, inventory, immutable input and payments: ${JSON.stringify({positive,negative})}. Not all middle-rank combinations, independent Kong-context cross product, concealed/sequence decomposition, event history or browser/LAN proof.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
