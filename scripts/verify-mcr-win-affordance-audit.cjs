// Deterministic differential audit: host scoring eligibility must match the
// actual player's self-draw or discard-claim button and final settlement.
// WMO/EMA 2021 requires a lawful structure and at least 8 non-flower points.
// https://mahjongclublausanne.ch/wp-content/uploads/2024/03/Greenbook2021_Chinese-EN.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
(async()=>{
 const rules=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?rules:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](module,file):js(module,file);
 const {scoreMcrHand,mcrTileFace}=require('../lib/mahjong/mcr-score.ts');
 const {newMcrSession,mcrSessionView,actMcrSession}=require('../lib/mahjong/mcr-session.ts');
 let seed=0x4d435233;const rand=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
 const groups=[];
 for(let tile=0;tile<34;tile++)groups.push({kind:'pung',tiles:[tile,tile,tile],open:true});
 for(let suit=0;suit<3;suit++)for(let rank=0;rank<7;rank++){const tile=suit*9+rank;groups.push({kind:'chow',tiles:[tile,tile+1,tile+2],open:true});}
 const kongGroups=Array.from({length:34},(_,tile)=>({kind:'kong',tiles:[tile,tile,tile,tile],open:true}));
 function makeHand(declaredCount,withKongs=false){
  const used=new Array(34).fill(0),chosen=[];
  const pool=withKongs?[...groups,...kongGroups]:groups;
  for(let group=0;group<4;group++){
   let choice;
   for(let tries=0;tries<200;tries++){
    const candidate=pool[rand(pool.length)];
    if(candidate.kind==='kong'&&group>=declaredCount)continue;
    if(candidate.tiles.every((tile,index)=>used[tile]+candidate.tiles.slice(0,index+1).filter(value=>value===tile).length<=4)){choice=candidate;break;}
   }
   assert.ok(choice,'four valid groups');
   chosen.push(choice);for(const tile of choice.tiles)used[tile]++;
  }
  const pairOptions=used.flatMap((count,index)=>count<=2?[index]:[]);
  const pair=pairOptions[rand(pairOptions.length)],concealed=[...chosen.slice(declaredCount).flatMap(group=>group.tiles),pair,pair];
  const [winningTile]=concealed.splice(rand(concealed.length),1);
  return {melds:chosen.slice(0,declaredCount),concealedBeforeWin:concealed,winningTile};
 }
 function fixture(hand,selfDraw){
  const original=newMcrSession(131),round=structuredClone(original.round),pool=[...analysis.createMcrTileSet()],winner=selfDraw?'seat-1':'seat-2';
  const take=kind=>{const face=mcrTileFace(kind),index=pool.findIndex(tile=>tile.face===face);assert.ok(index>=0,'physical tile '+face);return pool.splice(index,1)[0];};
  const melds=hand.melds.map(meld=>meld.tiles.map(take)),concealed=hand.concealedBeforeWin.map(take),winning=take(hand.winningTile);
  round.hands=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.melds=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.flowers=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.melds[winner]=melds.map((tiles,index)=>({kind:hand.melds[index].kind,exposure:hand.melds[index].open?'melded':'concealed',tiles,claimedTileId:hand.melds[index].open?tiles[0].id:null,fromPlayerId:hand.melds[index].open?'seat-3':null}));
  round.hands[winner]=selfDraw?[...concealed,winning]:concealed;
  if(!selfDraw)round.hands['seat-1'].push(winning);
  for(const id of round.playerOrder)if(id!==winner)while(round.hands[id].length<(id==='seat-1'&&!selfDraw?14:13)){
   const index=pool.findIndex(tile=>analysis.isMcrStructureTile(tile.face)&&tile.face!==winning.face);assert.ok(index>=0);round.hands[id].push(pool.splice(index,1)[0]);
  }
  round.wall=pool;round.discardPile=[];round.activePlayerId='seat-1';round.phase='discard';round.turnSource='wall';round.drewThisTurn=true;
  round.lastDrawnTileId=winning.id;round.pendingFlowerTileId=null;round.claimWindow=null;round.actionHistory=[];round.winResult=null;round.drawResult=null;
  return {session:{...original,round,opening:[]},winningId:winning.id};
 }
 function inventory(session){
  const round=session.round,tiles=[...round.wall,...round.discardPile,...Object.values(round.hands).flat(),...Object.values(round.melds).flat().flatMap(meld=>meld.tiles),...Object.values(round.flowers).flat()];
  assert.equal(tiles.length,144);assert.equal(new Set(tiles.map(tile=>tile.id)).size,144);
 }
 function step(session,seat,type,predicate=()=>true){
  const before=JSON.stringify(session),choice=mcrSessionView(session,seat).choices.find(item=>item.type===type&&predicate(item));assert.ok(choice,type+' seat '+seat);
  const next=actMcrSession(session,seat,session.revision,choice.index);assert.equal(JSON.stringify(session),before);assert.equal(next.revision,session.revision+1);inventory(next);return next;
 }
 const countsByMode={ordinary:{eligible:0,belowMinimum:0,selfDraw:0,discard:0,lastCopy:0,withKong:0,withConcealedKong:0,kongCounts:[0,0,0,0,0]},kongAware:{eligible:0,belowMinimum:0,selfDraw:0,discard:0,lastCopy:0,withKong:0,withConcealedKong:0,kongCounts:[0,0,0,0,0]}};
 for(const withKongs of [false,true]){
 const counts=countsByMode[withKongs?'kongAware':'ordinary'];
 for(let declaredCount=0;declaredCount<=4;declaredCount++)for(const selfDraw of [false,true])for(let trial=0;trial<100;trial++){
  const base=makeHand(declaredCount,withKongs),kongIndexes=base.melds.flatMap((meld,index)=>meld.kind==='kong'?[index]:[]);
  for(let mask=0;mask<(1<<kongIndexes.length);mask++){
  const hand={...base,melds:base.melds.map((meld,index)=>({...meld,open:meld.kind==='kong'?!(mask&(1<<kongIndexes.indexOf(index))):true}))},label=JSON.stringify({declaredCount,selfDraw,trial,mask,hand});
  if(kongIndexes.length)counts.withKong++;
  counts.kongCounts[kongIndexes.length]++;
  if(hand.melds.some(meld=>meld.kind==='kong'&&!meld.open))counts.withConcealedKong++;
  const publicCopies=hand.melds.filter(meld=>meld.open).flatMap(meld=>meld.tiles).filter(tile=>tile===hand.winningTile).length;
  if(publicCopies===3)counts.lastCopy++;
  const expected=scoreMcrHand({...hand,winner:selfDraw?0:1,from:0,roundWind:0,seatWind:selfDraw?0:1,source:selfDraw?'wall':'discard',flowers:[],lastWallEvent:false,lastCopy:publicCopies===3});
  assert.ok(expected.ok||expected.reason==='below-minimum',label+': a structurally valid hand cannot be unsupported');
  const test=fixture(hand,selfDraw);let session=test.session;inventory(session);
  if(!selfDraw)session=step(session,0,'discard',choice=>choice.tileIds.includes(test.winningId));
  const choice=mcrSessionView(session,selfDraw?0:1).choices.find(item=>item.type===(selfDraw?'declare-self-draw':'claim-discard')&&(selfDraw||item.claim==='win'));
  assert.equal(Boolean(choice),expected.ok,label+': legal win button must match scorer eligibility; scorer '+JSON.stringify(expected.ok?expected.analysis.fanCodes:expected.reason));
  if(expected.ok){
   session=step(session,selfDraw?0:1,selfDraw?'declare-self-draw':'claim-discard',item=>selfDraw||item.claim==='win');
   if(!selfDraw)for(const seat of [2,3])if(session.round.phase==='claim')session=step(session,seat,'pass-claim');
   assert.equal(session.round.phase,'finished',label);
   assert.equal(session.round.winResult.analysis.total,expected.analysis.total,label+': terminal points equal pre-action score');
   assert.deepEqual([...session.round.winResult.analysis.fanCodes].sort(),[...expected.analysis.fanCodes].sort(),label+': terminal fans equal pre-action score');
   assert.deepEqual(Object.values(session.round.winResult.settlement.deltas),expected.settlement.delta,label+': terminal settlement equals pre-action payment');
   counts.eligible++;
  }else counts.belowMinimum++;
  counts[selfDraw?'selfDraw':'discard']++;
  }
 }
 }
 assert.equal(countsByMode.ordinary.selfDraw+countsByMode.ordinary.discard,1000,'preserve the original no-kong baseline');
 assert.ok(countsByMode.kongAware.withKong>0&&countsByMode.kongAware.withConcealedKong>0,'exercise melded and concealed kong eligibility');
 assert.ok(countsByMode.kongAware.kongCounts.every(count=>count>0),'exercise every declared-kong count from zero through four');
 console.log('PASS: '+JSON.stringify(countsByMode)+' authored hands agree between host score, actual player win affordance and final settlement; all kong-exposure subsets, 144-tile inventory and immutable revisions checked. Authored middle-hand starts, not opening or browser proof.');
})().catch(error=>{console.error(error);process.exitCode=1;});
