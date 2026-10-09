// WMO MCR2021 #28: three same-suit consecutive chows make Pure Straight.
// A fourth independent chow can score Mixed/Pure Double Chow; the old/young
// pair already inside the straight cannot be charged again.
// https://www.mindmahjong.com/adobe/MCR2021.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
(async()=>{
 const rules=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?rules:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](module,file):js(module,file);
 const {scoreMcrHand,mcrTileFace}=require('../lib/mahjong/mcr-score.ts');
 const {newMcrSession,mcrSessionView,actMcrSession}=require('../lib/mahjong/mcr-session.ts');
 const suitMaps=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
 function hand(suits,otherSuit){
  const chow=(suit,start)=>{const first=suit*9+start;return {kind:'chow',tiles:[first,first+1,first+2],open:true};};
  return {melds:[chow(suits[0],0),chow(suits[0],3),chow(suits[0],6),chow(suits[otherSuit],0)],concealedBeforeWin:[27],winningTile:27};
 }
 function fixture(input,selfDraw){
  const original=newMcrSession(181),round=structuredClone(original.round),pool=[...analysis.createMcrTileSet()],winner=selfDraw?'seat-1':'seat-2';
  const take=index=>{const face=mcrTileFace(index),at=pool.findIndex(tile=>tile.face===face);assert.ok(at>=0,'missing '+face);return pool.splice(at,1)[0];};
  const declared=input.melds.map(meld=>meld.tiles.map(take)),concealed=input.concealedBeforeWin.map(take),winning=take(input.winningTile);
  round.hands=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.melds=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.flowers=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.melds[winner]=declared.map(tiles=>({kind:'chow',exposure:'melded',tiles,claimedTileId:tiles[0].id,fromPlayerId:'seat-3'}));
  round.hands[winner]=selfDraw?[...concealed,winning]:concealed;
  if(!selfDraw)round.hands['seat-1'].push(winning);
  for(const id of round.playerOrder)if(id!==winner)while(round.hands[id].length<(id==='seat-1'&&!selfDraw?14:13)){
   const at=pool.findIndex(tile=>analysis.isMcrStructureTile(tile.face)&&tile.face!==winning.face);assert.ok(at>=0);round.hands[id].push(pool.splice(at,1)[0]);
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
  const previous=JSON.stringify(session),choice=mcrSessionView(session,seat).choices.find(item=>item.type===type&&predicate(item));assert.ok(choice,type+' seat '+seat);
  const next=actMcrSession(session,seat,session.revision,choice.index);assert.equal(JSON.stringify(session),previous);assert.equal(next.revision,session.revision+1);inventory(next);return next;
 }
 function points(result,code){return result.analysis.occurrences.filter(item=>item.fanCode==='mcr-'+code).reduce((sum,item)=>sum+item.points,0);}
 let cases=0;
 for(const suits of suitMaps)for(const otherSuit of [0,1])for(const selfDraw of [false,true]){
  const label=JSON.stringify({suits,otherSuit,selfDraw}),input=hand(suits,otherSuit);
  const expected=scoreMcrHand({...input,winner:selfDraw?0:1,from:0,roundWind:0,seatWind:selfDraw?0:1,source:selfDraw?'wall':'discard',flowers:[],lastWallEvent:false,lastCopy:false});
  assert.ok(expected.ok,label);assert.equal(points(expected,28),16,label);
  assert.equal(points(expected,69),otherSuit===0?1:0,label);assert.equal(points(expected,70),otherSuit===1?1:0,label);assert.equal(points(expected,72),0,label);
  const test=fixture(input,selfDraw);let session=test.session;inventory(session);
  if(selfDraw)session=step(session,0,'declare-self-draw');
  else{session=step(session,0,'discard',choice=>choice.tileIds.includes(test.winningId));session=step(session,1,'claim-discard',choice=>choice.claim==='win');for(const seat of [2,3])if(session.round.phase==='claim')session=step(session,seat,'pass-claim');}
  assert.equal(session.round.phase,'finished',label);
  const result=session.round.winResult;
  for(const [code,amount] of [[28,16],[69,otherSuit===0?1:0],[70,otherSuit===1?1:0],[72,0]])assert.equal(points(result,code),amount,label+': fan '+code);
  assert.ok(result.analysis.exclusions.some(item=>item.fanCode==='mcr-72'&&item.excludedBy.some(cause=>cause.fanCode==='mcr-28')),label+': absorbed Old Young Pair explanation');
  assert.deepEqual([...result.analysis.fanCodes].sort(),[...expected.analysis.fanCodes].sort(),label);
  assert.equal(result.analysis.total,expected.analysis.total,label);
  assert.deepEqual(Object.values(result.settlement.deltas),expected.settlement.delta,label);
  cases++;
 }
 console.log('PASS: '+cases+' Pure Straight sessions with an independent same/cross-suit chow; exact associated fans, exclusion explanation, inventory, revisions and four-seat settlement.');
})().catch(error=>{console.error(error);process.exitCode=1;});
