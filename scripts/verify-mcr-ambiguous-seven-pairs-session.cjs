// Each hand is both Seven Pairs and four Chows plus a pair. Seven Pairs + Pure
// Flush wins the score comparison; ordinary-only associations cannot leak in.
// WMO MCR2021 #19/#22: https://www.mindmahjong.com/adobe/MCR2021.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
(async()=>{
 const rules=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?rules:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](module,file):js(module,file);
 const {decomposeHand}=require('../lib/mahjong/shape.ts'),{scoreMcrHand,mcrTileFace}=require('../lib/mahjong/mcr-score.ts');
 const {newMcrSession,mcrSessionView,actMcrSession}=require('../lib/mahjong/mcr-session.ts');
 function fixture(complete,winningTile,selfDraw){
  const original=newMcrSession(1919),round=structuredClone(original.round),pool=[...analysis.createMcrTileSet()],winner=selfDraw?'seat-1':'seat-2';
  const take=index=>{const face=mcrTileFace(index),at=pool.findIndex(tile=>tile.face===face);assert.ok(at>=0,face);return pool.splice(at,1)[0];};
  const held=[...complete],at=held.indexOf(winningTile);assert.ok(at>=0);held.splice(at,1);
  const concealed=held.map(take),winning=take(winningTile);
  round.hands=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.melds=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.flowers=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.hands[winner]=concealed;
  for(const id of round.playerOrder)if(id!==winner)while(round.hands[id].length<13){const next=pool.findIndex(tile=>analysis.isMcrStructureTile(tile.face)&&tile.face!==winning.face);assert.ok(next>=0);round.hands[id].push(pool.splice(next,1)[0]);}
  round.wall=[winning,...pool];round.discardPile=[];round.activePlayerId='seat-1';round.phase='draw';round.turnSource=null;round.drewThisTurn=false;round.lastDrawnTileId=null;round.pendingFlowerTileId=null;round.claimWindow=null;round.actionHistory=[];round.winResult=null;round.drawResult=null;
  return {session:{...original,round,opening:[]},winningId:winning.id,held};
 }
 function inventory(session){const r=session.round,tiles=[...r.wall,...r.discardPile,...Object.values(r.hands).flat(),...Object.values(r.melds).flat().flatMap(meld=>meld.tiles),...Object.values(r.flowers).flat()];assert.equal(tiles.length,144);assert.equal(new Set(tiles.map(tile=>tile.id)).size,144);}
 function step(session,seat,type,predicate=()=>true){const before=JSON.stringify(session),choice=mcrSessionView(session,seat).choices.find(item=>item.type===type&&predicate(item));assert.ok(choice,`${type}/${seat}`);const next=actMcrSession(session,seat,session.revision,choice.index);assert.equal(JSON.stringify(session),before);assert.equal(next.revision,session.revision+1);inventory(next);return next;}
 function points(result,code){return result.analysis.occurrences.filter(item=>item.fanCode===`mcr-${code}`).reduce((sum,item)=>sum+item.points,0);}
 let endings=0;
 for(let suit=0;suit<3;suit++)for(const [start,extra] of [[1,8],[2,9],[3,1]])for(const selfDraw of [false,true])for(const finishPair of [false,true]){
  const complete=[...Array.from({length:6},(_,index)=>suit*9+start+index-1),suit*9+extra-1].flatMap(index=>[index,index]),winningTile=suit*9+(finishPair?extra:start)-1,label=JSON.stringify({suit,start,extra,selfDraw,finishPair});
  const shapes=decomposeHand(complete,[],{variant:'mcr'});assert.ok(shapes.some(item=>item.kind==='standard'),`${label}: ordinary alternative`);assert.ok(shapes.some(item=>item.kind==='seven-pairs'),`${label}: special alternative`);
  const built=fixture(complete,winningTile,selfDraw);let session=built.session;inventory(session);
  const expected=scoreMcrHand({concealedBeforeWin:built.held,winningTile,melds:[],winner:selfDraw?0:1,from:0,roundWind:0,seatWind:selfDraw?0:1,source:selfDraw?'wall':'discard',flowers:[],lastWallEvent:false,lastCopy:false});
  assert.ok(expected.ok,label);assert.equal(points(expected,19),24,label);assert.equal(points(expected,22),24,label);assert.equal(points(expected,6),0,`${label}: gap prevents Seven Shifted Pairs`);
  for(const code of [63,69,71])assert.equal(points(expected,code),0,`${label}: ordinary-only ${code} must not leak into Seven Pairs`);
  session=step(session,0,'draw');assert.equal(session.round.lastDrawnTileId,built.winningId,label);
  if(selfDraw)session=step(session,0,'declare-self-draw');
  else{session=step(session,0,'discard',choice=>choice.tileIds.includes(built.winningId));session=step(session,1,'claim-discard',choice=>choice.claim==='win');for(const seat of [2,3])if(session.round.phase==='claim')session=step(session,seat,'pass-claim');}
  assert.equal(session.round.phase,'finished',label);const result=session.round.winResult;assert.equal(points(result,19),24,label);assert.equal(points(result,22),24,label);
  for(const code of [6,63,69,71])assert.equal(points(result,code),0,label);
  assert.deepEqual([...result.analysis.fanCodes].sort(),[...expected.analysis.fanCodes].sort(),label);assert.equal(result.analysis.total,expected.analysis.total,label);assert.deepEqual(Object.values(result.settlement.deltas),expected.settlement.delta,label);endings++;
 }
 console.log(`PASS: ${endings} genuinely ambiguous Seven Pairs/four-Chow real endings; preferred scoring path, no ordinary-fan leakage, physical inventory, revisions and payments.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
