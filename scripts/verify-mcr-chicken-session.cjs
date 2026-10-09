// WMO/EMA Greenbook 2021: Chicken Hand is eight points only when the
// otherwise legal hand scores zero before flowers. Exercise real actions.
// https://mahjongclublausanne.ch/wp-content/uploads/2024/03/Greenbook2021_Chinese-EN.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
(async()=>{
 const rules=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?rules:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](module,file):js(module,file);
 const {scoreMcrHand,mcrTileFace}=require('../lib/mahjong/mcr-score.ts');
 const {newMcrSession,mcrSessionView,actMcrSession}=require('../lib/mahjong/mcr-session.ts');
 const hand={melds:[{kind:'chow',tiles:[12,13,14],open:true},{kind:'chow',tiles:[23,24,25],open:true},{kind:'pung',tiles:[10,10,10],open:true}],concealedBeforeWin:[1,2,27,27],winningTile:0};
 function fixture(selfDraw,flowerCount){
  const original=newMcrSession(167),round=structuredClone(original.round),pool=[...analysis.createMcrTileSet()],winner=selfDraw?'seat-1':'seat-2';
  const take=face=>{const at=pool.findIndex(tile=>tile.face===face);assert.ok(at>=0,'missing '+face);return pool.splice(at,1)[0];};
  const melds=hand.melds.map(meld=>meld.tiles.map(index=>take(mcrTileFace(index))));
  const concealed=hand.concealedBeforeWin.map(index=>take(mcrTileFace(index))),winning=take(mcrTileFace(hand.winningTile));
  round.hands=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.melds=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.flowers=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.melds[winner]=melds.map((tiles,index)=>({kind:hand.melds[index].kind,exposure:'melded',tiles,claimedTileId:tiles[0].id,fromPlayerId:'seat-3'}));
  round.flowers[winner]=pool.filter(tile=>!analysis.isMcrStructureTile(tile.face)).slice(0,flowerCount);
  for(const tile of round.flowers[winner])pool.splice(pool.findIndex(candidate=>candidate.id===tile.id),1);
  round.hands[winner]=selfDraw?[...concealed,winning]:concealed;
  if(!selfDraw)round.hands['seat-1'].push(winning);
  for(const id of round.playerOrder)if(id!==winner)while(round.hands[id].length<(id==='seat-1'&&!selfDraw?14:13)){
   const at=pool.findIndex(tile=>analysis.isMcrStructureTile(tile.face)&&tile.face!==winning.face);assert.ok(at>=0);round.hands[id].push(pool.splice(at,1)[0]);
  }
  round.wall=pool;round.discardPile=[];round.activePlayerId='seat-1';round.phase='discard';round.turnSource='wall';round.drewThisTurn=true;
  round.lastDrawnTileId=winning.id;round.pendingFlowerTileId=null;round.claimWindow=null;round.actionHistory=[];round.winResult=null;round.drawResult=null;
  return {session:{...original,round,opening:[]},winningId:winning.id,flowers:Array.from({length:flowerCount},(_,index)=>34+index)};
 }
 function inventory(session){
  const round=session.round,tiles=[...round.wall,...round.discardPile,...Object.values(round.hands).flat(),...Object.values(round.melds).flat().flatMap(meld=>meld.tiles),...Object.values(round.flowers).flat()];
  assert.equal(tiles.length,144);assert.equal(new Set(tiles.map(tile=>tile.id)).size,144);
 }
 function step(session,seat,type,predicate=()=>true){
  const previous=JSON.stringify(session),choice=mcrSessionView(session,seat).choices.find(item=>item.type===type&&predicate(item));assert.ok(choice,type+' seat '+seat);
  const next=actMcrSession(session,seat,session.revision,choice.index);assert.equal(JSON.stringify(session),previous);assert.equal(next.revision,session.revision+1);inventory(next);return next;
 }
 let count=0;
 for(const selfDraw of [false,true])for(const flowerCount of [0,1,8]){
  const label=JSON.stringify({selfDraw,flowerCount}),test=fixture(selfDraw,flowerCount);let session=test.session;inventory(session);
  const expected=scoreMcrHand({...hand,winner:selfDraw?0:1,from:0,roundWind:0,seatWind:selfDraw?0:1,source:selfDraw?'wall':'discard',flowers:test.flowers,lastWallEvent:false,lastCopy:false});
  if(selfDraw){
   assert.equal(expected.ok,false,label);assert.equal(expected.reason,'below-minimum',label);
   assert.ok(!mcrSessionView(session,0).choices.some(choice=>choice.type==='declare-self-draw'),label+': self-draw must not award Chicken Hand');
  }else{
   assert.ok(expected.ok,label);assert.deepEqual(expected.analysis.fanCodes.filter(code=>code!=='mcr-81'),['mcr-43'],label);
   assert.equal(expected.analysis.nonFlowerTotal,8,label);assert.equal(expected.analysis.total,8+flowerCount,label);
   session=step(session,0,'discard',choice=>choice.tileIds.includes(test.winningId));
   assert.ok(mcrSessionView(session,1).choices.some(choice=>choice.type==='claim-discard'&&choice.claim==='win'),label+': win claim visible');
   session=step(session,1,'claim-discard',choice=>choice.claim==='win');
   for(const seat of [2,3])if(session.round.phase==='claim')session=step(session,seat,'pass-claim');
   assert.equal(session.round.phase,'finished',label);
   assert.equal(session.round.winResult.analysis.nonFlowerTotal,8,label);
   assert.equal(session.round.winResult.analysis.total,8+flowerCount,label);
   assert.deepEqual([...session.round.winResult.analysis.fanCodes].sort(),[...expected.analysis.fanCodes].sort(),label);
   assert.deepEqual(Object.values(session.round.winResult.settlement.deltas),[-(16+flowerCount),32+flowerCount,-8,-8],label);
  }
  count++;
 }
 console.log('PASS: '+count+' Chicken Hand action cases: 0/1/8 flowers, discard wins, self-draw rejection, 144-tile inventory, revisions and settlement.');
})().catch(error=>{console.error(error);process.exitCode=1;});
