// WMO MCR2021 #63: four Chows with a numbered pair, not an Honor pair or
// a Pung. Mixed Straight (#39) remains an independent eight-point anchor.
// https://www.mindmahjong.com/adobe/ZC2021.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
(async()=>{
 const rules=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?rules:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](module,file):js(module,file);
 const {scoreMcrHand,mcrTileFace}=require('../lib/mahjong/mcr-score.ts');
 const {newMcrSession,mcrSessionView,actMcrSession}=require('../lib/mahjong/mcr-session.ts');
 const suitMaps=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]],variants=['all-chows','honor-pair','one-pung'];
 function hand(suits,variant){
  const chow=(suit,start)=>{const first=suit*9+start;return {kind:'chow',tiles:[first,first+1,first+2],open:true};};
  const fourth=variant==='one-pung'?{kind:'pung',tiles:Array(3).fill(suits[0]*9+5),open:true}:chow(suits[0],1);
  const pair=variant==='honor-pair'?27:suits[0]*9+4;
  return {melds:[chow(suits[0],0),chow(suits[1],3),chow(suits[2],6),fourth],concealedBeforeWin:[pair],winningTile:pair};
 }
 function fixture(input,selfDraw){
  const original=newMcrSession(199),round=structuredClone(original.round),pool=[...analysis.createMcrTileSet()],winner=selfDraw?'seat-1':'seat-2';
  const take=index=>{const face=mcrTileFace(index),at=pool.findIndex(tile=>tile.face===face);assert.ok(at>=0,'missing '+face);return pool.splice(at,1)[0];};
  const declared=input.melds.map(meld=>meld.tiles.map(take)),concealed=input.concealedBeforeWin.map(take),winning=take(input.winningTile);
  round.hands=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.melds=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.flowers=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.melds[winner]=declared.map((tiles,index)=>({kind:input.melds[index].kind,exposure:'melded',tiles,claimedTileId:tiles[0].id,fromPlayerId:'seat-3'}));
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
 for(const suits of suitMaps)for(const variant of variants)for(const selfDraw of [false,true]){
  const label=JSON.stringify({suits,variant,selfDraw}),input=hand(suits,variant),allChows=variant==='all-chows';
  const expected=scoreMcrHand({...input,winner:selfDraw?0:1,from:0,roundWind:0,seatWind:selfDraw?0:1,source:selfDraw?'wall':'discard',flowers:[],lastWallEvent:false,lastCopy:false});
  assert.ok(expected.ok,label);assert.equal(points(expected,39),8,label+': Mixed Straight anchor');assert.equal(points(expected,63),allChows?2:0,label);
  assert.equal(points(expected,76),variant==='one-pung'?1:0,label+': No Honors is absorbed only by All Chows');
  const test=fixture(input,selfDraw);let session=test.session;inventory(session);
  if(selfDraw)session=step(session,0,'declare-self-draw');
  else{session=step(session,0,'discard',choice=>choice.tileIds.includes(test.winningId));session=step(session,1,'claim-discard',choice=>choice.claim==='win');for(const seat of [2,3])if(session.round.phase==='claim')session=step(session,seat,'pass-claim');}
  assert.equal(session.round.phase,'finished',label);const result=session.round.winResult;
  assert.equal(points(result,39),8,label);assert.equal(points(result,63),allChows?2:0,label);assert.equal(points(result,76),variant==='one-pung'?1:0,label);
  if(allChows)assert.ok(result.analysis.exclusions.some(item=>item.fanCode==='mcr-76'&&item.excludedBy.some(cause=>cause.fanCode==='mcr-63')),label+': All Chows explains absorbed No Honors');
  assert.deepEqual([...result.analysis.fanCodes].sort(),[...expected.analysis.fanCodes].sort(),label);
  assert.equal(result.analysis.total,expected.analysis.total,label);
  assert.deepEqual(Object.values(result.settlement.deltas),expected.settlement.delta,label);
  cases++;
 }
 console.log('PASS: '+cases+' All Chows sessions with numbered/honor pair or one Pung; Mixed Straight anchor, No Honors exclusion, inventory, revisions and settlement.');
})().catch(error=>{console.error(error);process.exitCode=1;});
