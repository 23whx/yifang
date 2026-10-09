// WMO MCR2021 #64: four copies score Tile Hog only when not a declared Kong.
// Pure Straight supplies an independent 16-point winning anchor.
// https://www.mindmahjong.com/adobe/ZC2021.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
(async()=>{
 const rules=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?rules:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](module,file):js(module,file);
 const {scoreMcrHand,mcrTileFace}=require('../lib/mahjong/mcr-score.ts');
 const {newMcrSession,mcrSessionView,actMcrSession}=require('../lib/mahjong/mcr-session.ts');
 const variants=['non-kong-four','other-suit-pung','melded-kong','concealed-kong'];
 function hand(mainSuit,variant){
  const chow=start=>{const first=mainSuit*9+start;return {kind:'chow',tiles:[first,first+1,first+2],open:true};};
  const isKong=variant.endsWith('kong'),tile=(variant==='non-kong-four'?mainSuit:(mainSuit+1)%3)*9+4;
  const fourth={kind:isKong?'kong':'pung',tiles:Array(isKong?4:3).fill(tile),open:variant!=='concealed-kong'};
  return {melds:[chow(0),chow(3),chow(6),fourth],concealedBeforeWin:[27],winningTile:27};
 }
 function fixture(input,selfDraw){
  const original=newMcrSession(191),round=structuredClone(original.round),pool=[...analysis.createMcrTileSet()],winner=selfDraw?'seat-1':'seat-2';
  const take=index=>{const face=mcrTileFace(index),at=pool.findIndex(tile=>tile.face===face);assert.ok(at>=0,'missing '+face);return pool.splice(at,1)[0];};
  const declared=input.melds.map(meld=>meld.tiles.map(take)),concealed=input.concealedBeforeWin.map(take),winning=take(input.winningTile);
  round.hands=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.melds=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.flowers=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.melds[winner]=declared.map((tiles,index)=>({kind:input.melds[index].kind,exposure:input.melds[index].open?'melded':'concealed',tiles,claimedTileId:input.melds[index].open?tiles[0].id:null,fromPlayerId:input.melds[index].open?'seat-3':null}));
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
 for(let mainSuit=0;mainSuit<3;mainSuit++)for(const variant of variants)for(const selfDraw of [false,true]){
  const label=JSON.stringify({mainSuit,variant,selfDraw}),input=hand(mainSuit,variant),tileHog=variant==='non-kong-four';
  const expected=scoreMcrHand({...input,winner:selfDraw?0:1,from:0,roundWind:0,seatWind:selfDraw?0:1,source:selfDraw?'wall':'discard',flowers:[],lastWallEvent:false,lastCopy:false});
  assert.ok(expected.ok,label);assert.equal(points(expected,28),16,label+': Pure Straight anchor');assert.equal(points(expected,64),tileHog?2:0,label+': no Tile Hog for a Kong or only three copies');
  const test=fixture(input,selfDraw);let session=test.session;inventory(session);
  if(selfDraw)session=step(session,0,'declare-self-draw');
  else{session=step(session,0,'discard',choice=>choice.tileIds.includes(test.winningId));session=step(session,1,'claim-discard',choice=>choice.claim==='win');for(const seat of [2,3])if(session.round.phase==='claim')session=step(session,seat,'pass-claim');}
  assert.equal(session.round.phase,'finished',label);const result=session.round.winResult;
  assert.equal(points(result,28),16,label);assert.equal(points(result,64),tileHog?2:0,label);
  assert.deepEqual([...result.analysis.fanCodes].sort(),[...expected.analysis.fanCodes].sort(),label);
  assert.equal(result.analysis.total,expected.analysis.total,label);
  assert.deepEqual(Object.values(result.settlement.deltas),expected.settlement.delta,label);
  cases++;
 }
 let declaredKongs=0;
 for(let mainSuit=0;mainSuit<3;mainSuit++)for(const rank of [2,5,8]){
  const original=newMcrSession(264),round=structuredClone(original.round),pool=[...analysis.createMcrTileSet()],suit=['m','p','s'][mainSuit],other=['m','p','s'][(mainSuit+1)%3],kongFace=`${rank}${other}`;
  const take=face=>{const at=pool.findIndex(t=>t.face===face);assert.ok(at>=0,face);return pool.splice(at,1)[0];};
  round.hands=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.melds=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.flowers=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  for(const start of [1,4,7]){
   const tiles=[start,start+1,start+2].map(n=>take(`${n}${suit}`));
   round.melds['seat-1'].push({kind:'chow',exposure:'melded',tiles,claimedTileId:tiles[0].id,fromPlayerId:'seat-3'});
  }
  const kong=Array.from({length:4},()=>take(kongFace));round.hands['seat-1'].push(...kong,take('E'));
  const winning=take('E');
  for(const id of round.playerOrder.slice(1))while(round.hands[id].length<13){const at=pool.findIndex(t=>analysis.isMcrStructureTile(t.face)&&t.face!=='E');assert.ok(at>=0);round.hands[id].push(pool.splice(at,1)[0]);}
  round.wall=[...pool,winning];round.discardPile=[];
  Object.assign(round,{activePlayerId:'seat-1',phase:'discard',turnSource:'wall',drewThisTurn:true,
   lastDrawnTileId:kong[3].id,pendingFlowerTileId:null,claimWindow:null,actionHistory:[],winResult:null,drawResult:null});
  let session={...original,round,opening:[]};inventory(session);
  session=step(session,0,'declare-concealed-kong');assert.equal(session.round.phase,'replacement');
  assert.equal(session.round.melds['seat-1'][3].exposure,'concealed');
  session=step(session,0,'draw-replacement');assert.equal(session.round.lastDrawnTileId,winning.id);
  session=step(session,0,'declare-self-draw');assert.equal(session.round.phase,'finished');
  const result=session.round.winResult;
  assert.equal(points(result,28),16);assert.equal(points(result,64),0,'A declared Kong must not score Tile Hog');
  assert.equal(points(result,67),2);assert.equal(points(result,46),8);
  const due=result.analysis.total+8;assert.deepEqual(Object.values(result.settlement.deltas),[3*due,-due,-due,-due]);
  declaredKongs++;
 }
 console.log('PASS: '+cases+' Tile Hog authored endings plus '+declaredKongs+' actual concealed-Kong -> replacement -> self-draw endings; four non-Kong copies versus declared Kong, inventory, revisions and exact settlement.');
})().catch(error=>{console.error(error);process.exitCode=1;});
