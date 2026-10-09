// Deterministic structural coverage audit; no random network or game state.
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-analysis-core'?core:load.call(this,request,...args);};
 require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {scoreMcrHand}=require('../lib/mahjong/mcr-score.ts');
 let seed=0x4d435232;const rand=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
 const groups=[];
 for(let t=0;t<34;t++)groups.push({kind:'pung',tiles:[t,t,t],open:true});
 for(let t=0;t<34;t++)groups.push({kind:'kong',tiles:[t,t,t,t],open:true});
 for(let s=0;s<3;s++)for(let r=0;r<7;r++){const t=s*9+r;groups.push({kind:'chow',tiles:[t,t+1,t+2],open:true});}
 const counts={ok:0,'below-minimum':0,unsupported:0,'not-winning':0,'invalid-input':0};const samples=[];
 const expanded={hands:0,contexts:0,ok:0,'below-minimum':0,concealedKongVariants:0,wall:0,discard:0,'kong-replacement':0,'flower-replacement':0,lastWall:0};
 function checkContext(input){
  const before=JSON.stringify(input),result=scoreMcrHand(input);
  assert.equal(JSON.stringify(input),before,'scoring must not mutate its input');
  assert.ok(result.ok||result.reason==='below-minimum',`Valid completed shape rejected: ${JSON.stringify({input,result})}`);
  const allFlowers=scoreMcrHand({...input,flowers:[34,35,36,37,38,39,40,41]});
  assert.equal(allFlowers.ok,result.ok,'flowers cannot promote a below-eight hand');
  if(result.ok){
   assert.equal(allFlowers.analysis.nonFlowerTotal,result.analysis.nonFlowerTotal,'flower count cannot alter structural/event fan total');
   assert.equal(allFlowers.analysis.total-result.analysis.total,8-input.flowers.length);
   for(const scored of [result,allFlowers]){
    const p=scored.analysis.total,selfDraw=input.winner===input.from;
    assert.deepEqual(scored.settlement.delta,[0,1,2,3].map(seat=>seat===input.winner?(selfDraw?3*(p+8):p+24):selfDraw||seat===input.from?-(p+8):-8),'independent source-specific four-seat payment');
   }
  }else assert.equal(allFlowers.reason,'below-minimum');
  expanded[result.ok?'ok':'below-minimum']++;
  expanded.contexts++;expanded[input.source]++;if(input.lastWallEvent)expanded.lastWall++;
 }
 for(let declared=0;declared<=4;declared++)for(let i=0;i<3000;i++){
  const melds=[],concealed=[],physical=new Array(34).fill(0);
  let possible=true;
  for(let k=0;k<4;k++){
   let chosen;
   for(let tries=0;tries<200;tries++){
    const group=groups[rand(groups.length)];
    if((k<declared||group.kind!=='kong')&&group.tiles.every((t,j)=>physical[t]+group.tiles.slice(0,j+1).filter(x=>x===t).length<=4)){chosen=group;break;}
   }
   if(!chosen){possible=false;break;}
   for(const t of chosen.tiles)physical[t]++;
   if(k<declared)melds.push(chosen);else concealed.push(...chosen.tiles);
  }
  if(!possible)continue;
  const candidates=[];for(let t=0;t<34;t++)if(physical[t]<=2)candidates.push(t);
  const pair=candidates[rand(candidates.length)];concealed.push(pair,pair);
  const winningTile=concealed.splice(rand(concealed.length),1)[0];
  const input={concealedBeforeWin:concealed,winningTile,melds,winner:0,from:1,roundWind:0,seatWind:1,source:'discard',flowers:[],lastWallEvent:false,lastCopy:false};
  const result=scoreMcrHand(input),kind=result.ok?'ok':result.reason;
  counts[kind]=(counts[kind]||0)+1;
  if(kind==='unsupported'&&samples.length<8)samples.push({input,reason:result.reason});
  expanded.hands++;
  const variants=[melds];
  if(melds.some(meld=>meld.kind==='kong')){
   variants.push(melds.map(meld=>meld.kind==='kong'?{...meld,open:false}:meld));
   expanded.concealedKongVariants++;
  }
  for(const variant of variants){
   // Pure scorer contexts, not claimed as complete round histories. Wall-tail
   // kong draws require an actual declared kong; flower draws have a flower.
   const base={...input,melds:variant,roundWind:i%4,seatWind:Math.floor(i/4)%4,winner:i%4};
   for(const source of ['wall','discard','flower-replacement',...(variant.some(meld=>meld.kind==='kong')?['kong-replacement']:[])]){
    const selfDraw=source!=='discard';
    for(const lastWallEvent of ['wall','discard'].includes(source)?[false,true]:[false]){
     checkContext({...base,source,from:selfDraw?base.winner:(base.winner+1)%4,flowers:source==='flower-replacement'?[34]:[],lastWallEvent});
    }
   }
  }
 }
 console.log(JSON.stringify({counts,samples,expanded},null,2));
 console.log('Scorer-only finite structural/event sweep, including immutable inputs, eight-flower gate invariance and independent payments. Not an oracle for all fan values/exclusions, actual event histories or browser play.');
 if(counts['not-winning']||counts['invalid-input']||counts.unsupported)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
