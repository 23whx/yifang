// WMO MCR2021 #57: two open Kongs score four, one open plus one concealed
// Kong scores four plus the separate two-point Concealed Kong (#67).
// Both second Kongs are actually declared before drawing a replacement win.
// https://www.mindmahjong.com/adobe/ZC2021.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
(async()=>{
 const rules=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?rules:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](module,file):js(module,file);
 const {newMcrSession,mcrSessionView,actMcrSession}=require('../lib/mahjong/mcr-session.ts');
 function fixture(concealed){
  const original=newMcrSession(197),round=structuredClone(original.round),pool=[...analysis.createMcrTileSet()],take=face=>{const at=pool.findIndex(tile=>tile.face===face);assert.ok(at>=0,'missing '+face);return pool.splice(at,1)[0];};
  round.hands=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.melds=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.flowers=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  const first=Array.from({length:4},()=>take('C')),chowA=['1p','2p','3p'].map(take),chowB=['7s','8s','9s'].map(take),second=Array.from({length:4},()=>take('5m'));
  const open=(kind,tiles)=>({kind,exposure:'melded',tiles,claimedTileId:tiles[0].id,fromPlayerId:'seat-3'});
  round.melds['seat-1']=[open('kong',first),open('chow',chowA),open('chow',chowB)];
  if(!concealed)round.melds['seat-1'].push(open('pung',second.slice(0,3)));
  const pair=take('E'),winning=take('E');round.hands['seat-1']=concealed?[...second,pair]:[second[3],pair];
  for(const id of round.playerOrder)if(id!=='seat-1')while(round.hands[id].length<13){const at=pool.findIndex(tile=>analysis.isMcrStructureTile(tile.face)&&tile.face!=='E');assert.ok(at>=0);round.hands[id].push(pool.splice(at,1)[0]);}
  const spare=pool.splice(pool.findIndex(tile=>analysis.isMcrStructureTile(tile.face)),1)[0];
  round.wall=[spare,winning];round.discardPile=pool.filter(tile=>analysis.isMcrStructureTile(tile.face));round.flowers['seat-4']=pool.filter(tile=>!analysis.isMcrStructureTile(tile.face));
  round.activePlayerId='seat-1';round.phase='discard';round.turnSource='wall';round.drewThisTurn=true;round.lastDrawnTileId=second[3].id;
  round.pendingFlowerTileId=null;round.claimWindow=null;round.actionHistory=[];round.winResult=null;round.drawResult=null;
  return {session:{...original,round,opening:[]},secondTileIds:second.map(tile=>tile.id),winningId:winning.id};
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
 const results=[];
 for(const concealed of [false,true]){
  const test=fixture(concealed);let session=test.session;inventory(session);
  session=step(session,0,concealed?'declare-concealed-kong':'declare-added-kong');
  if(!concealed){
   assert.equal(session.round.phase,'claim');assert.equal(session.round.melds['seat-1'][3].kind,'pung','second open Kong must wait for robbing responses');
   for(const seat of [1,2,3])session=step(session,seat,'pass-claim');
  }
  assert.equal(session.round.phase,'replacement');assert.equal(session.round.melds['seat-1'].filter(meld=>meld.kind==='kong').length,2);
  const second=session.round.melds['seat-1'].find(meld=>meld.tiles.some(tile=>test.secondTileIds.includes(tile.id)));
  assert.equal(second.exposure,concealed?'concealed':'melded');assert.deepEqual(second.tiles.map(tile=>tile.id).sort(),[...test.secondTileIds].sort());
  assert.equal(session.round.winResult,null,'the Kong declaration itself is not a win');
  session=step(session,0,'draw-replacement');assert.equal(session.round.turnSource,'kong-replacement');assert.equal(session.round.lastDrawnTileId,test.winningId);
  session=step(session,0,'declare-self-draw');assert.equal(session.round.phase,'finished');
  const result=session.round.winResult;assert.equal(points(result,57),4);assert.equal(points(result,67),concealed?2:0);assert.equal(points(result,46),8);
  for(const code of [5,17,48,64,74,80])assert.equal(points(result,code),0,'no higher/lower Kong or Tile Hog overlap '+code);
  const due=result.analysis.total+8;assert.deepEqual(Object.values(result.settlement.deltas),[3*due,-due,-due,-due]);
  assert.equal(Object.values(result.settlement.deltas).reduce((sum,value)=>sum+value,0),0);
  results.push(result);
 }
 assert.deepEqual(results[1].analysis.fanCodes.filter(code=>code!=='mcr-67'),results[0].analysis.fanCodes,'only Concealed Kong differs after the same two-Kong replacement win');
 assert.equal(results[1].analysis.total-results[0].analysis.total,2);
 assert.deepEqual(Object.values(results[1].settlement.deltas).map((delta,index)=>delta-Object.values(results[0].settlement.deltas)[index]),[6,-2,-2,-2]);
 console.log('PASS: both second-Kong declarations, three added-Kong robbing responses, replacement win, exact 4+2 versus 4 Kong scoring, inventory, revisions and four-seat payment.');
})().catch(error=>{console.error(error);process.exitCode=1;});
