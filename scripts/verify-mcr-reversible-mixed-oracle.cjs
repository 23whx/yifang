// WMO 2021 #40: 1234589p, 245689s and White; no One Voided Suit.
// https://www.mindmahjong.com/adobe/ZC2021.pdf
// Exhaustive within fixed OPEN mixed groups made from that face alphabet.
// Every legal pair (including outside-alphabet negatives), both win sources.
const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-analysis-core'?core:load.call(this,request,...args);};
 require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {scoreMcrHand:score}=require('../lib/mahjong/mcr-score.ts');
 const allowed=new Set([9,10,11,12,13,16,17,19,21,22,23,25,26,33]);
 const groups=[...allowed].map(t=>({kind:'pung',tiles:[t,t,t],open:true}));
 for(let suit=0;suit<3;suit++)for(let start=0;start<7;start++){
  const tiles=[0,1,2].map(n=>suit*9+start+n);
  if(tiles.every(t=>allowed.has(t)))groups.push({kind:'chow',tiles,open:true});
 }
 assert.equal(groups.length,18); // 14 Pungs + 123p/234p/345p/456s.
 const codes=['40','75','64','55','59','22','50'];
 const counts=Object.fromEntries(codes.map(c=>[c,{positive:0,zero:0}]));
 const ratios=Object.fromEntries([1,2,3].map(n=>[n,{structures:0,hands:0,reversible:0,nonReversible:0,tileHog:0}]));
 let cases=0,invalidStructures=0,invalidPairs=0;
 for(let a=0;a<groups.length;a++)for(let b=a;b<groups.length;b++)for(let c=b;c<groups.length;c++)for(let d=c;d<groups.length;d++){
  const melds=[a,b,c,d].map(i=>groups[i]),chows=melds.filter(g=>g.kind==='chow').length;
  if(chows===0||chows===4)continue; // Already-covered pure families are not this oracle's claim.
  const faces=melds.flatMap(g=>g.tiles),base=Array(34).fill(0);faces.forEach(t=>base[t]++);
  if(base.some(n=>n>4)){invalidStructures++;continue;}
  ratios[chows].structures++;
  for(let pair=0;pair<34;pair++){
   if(base[pair]>2){invalidPairs++;continue;}
   const all=[...faces,pair,pair],inventory=[...base];inventory[pair]+=2;
   const reversible=allowed.has(pair),numeric=all.every(t=>t<27),hasHonor=!numeric;
   const suits=new Set(all.filter(t=>t<27).map(t=>Math.floor(t/9))),rank=t=>t%9+1;
   // A mixed hand has neither Quadruple Chow nor pure/mixed terminal-only
   // all-Pung hands. No declared Kong may create a false Tile Hog here.
   const expected={
    '40':reversible?8:0,
    '75':suits.size===2&&!reversible?1:0,
    '64':2*inventory.filter(n=>n===4).length,
    '55':melds.every(g=>g.tiles.some(t=>t>=27||rank(t)===1||rank(t)===9))&&(pair>=27||rank(pair)===1||rank(pair)===9)?4:0,
    '59':melds.some(g=>g.kind==='pung'&&g.tiles[0]===33)?2:0,
    '22':numeric&&suits.size===1?24:0,
    '50':hasHonor&&suits.size===1?6:0,
   };
   for(const self of [false,true]){
    const input={concealedBeforeWin:[pair],winningTile:pair,melds:structuredClone(melds),winner:0,from:self?0:1,source:self?'wall':'discard',roundWind:0,seatWind:1,flowers:[],lastWallEvent:true,lastCopy:false};
    const before=JSON.stringify(input),r=score(input),label=`${[a,b,c,d]}/${pair}/${self}`;
    assert.ok(r.ok,label);assert.equal(JSON.stringify(input),before,label);
    for(const code of codes){
     const actual=r.analysis.occurrences.filter(o=>o.fanCode===`mcr-${code}`).reduce((n,o)=>n+o.points,0);
     assert.equal(actual,expected[code],`${label}: fan ${code}`);
     counts[code][expected[code]?'positive':'zero']++;
    }
    if(reversible&&suits.size===2){
     assert.ok(r.analysis.exclusions.some(o=>o.fanCode==='mcr-75'&&o.excludedBy.some(cause=>cause.fanCode==='mcr-40')),`${label}: explicit One Voided Suit exclusion`);
    }
    assert.ok(inventory.every(n=>n<=4));assert.equal(inventory.reduce((x,y)=>x+y,0),14);
    const due=r.analysis.total+8;assert.deepEqual(r.settlement.delta,self?[3*due,-due,-due,-due]:[r.analysis.total+24,-due,-8,-8],label);
    const ratio=ratios[chows];ratio.hands++;ratio[reversible?'reversible':'nonReversible']++;if(expected['64'])ratio.tileHog++;
    cases++;
   }
  }
 }
 for(const code of codes){assert.ok(counts[code].positive>0,`${code} positive`);assert.ok(counts[code].zero>0,`${code} zero`);}
 for(const ratio of Object.values(ratios))assert.ok(ratio.structures>0&&ratio.reversible>0&&ratio.nonReversible>0&&ratio.tileHog>0);
 assert.equal(Object.values(ratios).reduce((n,r)=>n+r.structures,0),2383);
 assert.equal(cases,149542);assert.equal(invalidStructures,1187);assert.equal(invalidPairs,6251);
 console.log(`PASS: ${cases} complete fixed open mixed reversible-alphabet hands, all legal pairs and both sources; independent 7 fan contributions/exclusions, inventory, immutability and payment arithmetic. ${JSON.stringify({ratios,counts,invalidStructures,invalidPairs})}. Invalid inventory screened by independent constructor, not engine-rejection evidence. Last-wall eligibility is fixed, not event-history proof. Not arbitrary non-reversible melds, concealed/Kong/redecomposition, other 74 fan truths, browser or LAN.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
