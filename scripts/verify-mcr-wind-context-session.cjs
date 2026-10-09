// WMO/EMA 2021 fans 60/61: round wind and seat wind are independent contexts.
// A wind pung matching both may score both; its generic honor-pung point is not added.
// https://mahjongclublausanne.ch/wp-content/uploads/2024/03/Greenbook2021_Chinese-EN.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
(async()=>{
 const rules=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?rules:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](module,file):js(module,file);
 const {newMcrSession,mcrSessionView,actMcrSession}=require('../lib/mahjong/mcr-session.ts');
 const winds=['E','S','W','N'];
 function fixture(face,roundWind,seatWind,selfDraw,open){
  const winnerIndex=selfDraw?0:1,dealer=(winnerIndex-winds.indexOf(seatWind)+4)%4;
  const original=newMcrSession(117,dealer,roundWind),round=structuredClone(original.round),pool=[...analysis.createMcrTileSet()],winner='seat-'+(winnerIndex+1);
  const take=kind=>{const index=pool.findIndex(tile=>tile.face===kind);assert.ok(index>=0,'missing '+kind);return pool.splice(index,1)[0];};
  const pung=[take(face),take(face),take(face)];
  const chows=[['1m','2m','3m'],['4p','5p','6p'],['7s','8s','9s']].map(group=>group.map(take));
  const pair=[take('5m'),take('5m')],winning=pair.pop();
  round.hands=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.melds=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.flowers=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.melds[winner]=open?[{kind:'pung',exposure:'melded',tiles:pung,claimedTileId:pung[0].id,fromPlayerId:'seat-3'}]:[];
  round.hands[winner]=[...(open?[]:pung),...chows.flat(),...pair,...(selfDraw?[winning]:[])];
  if(!selfDraw)round.hands['seat-1'].push(winning);
  for(const id of round.playerOrder)if(id!==winner)while(round.hands[id].length<(id==='seat-1'&&!selfDraw?14:13)){
   const index=pool.findIndex(tile=>analysis.isMcrStructureTile(tile.face)&&tile.face!=='5m');assert.ok(index>=0);round.hands[id].push(pool.splice(index,1)[0]);
  }
  round.wall=pool;round.discardPile=[];round.activePlayerId='seat-1';round.phase='discard';round.turnSource='wall';round.drewThisTurn=true;
  round.lastDrawnTileId=winning.id;round.pendingFlowerTileId=null;round.claimWindow=null;round.actionHistory=[];round.winResult=null;round.drawResult=null;
  assert.equal(round.roundWind,roundWind);assert.equal(round.players[winner].seat,['east','south','west','north'][winds.indexOf(seatWind)]);
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
 const points=(result,code)=>result.analysis.occurrences.filter(item=>item.fanCode==='mcr-'+code).reduce((sum,item)=>sum+item.points,0);
 let count=0;
 for(const face of winds)for(const roundWind of winds)for(const seatWind of winds)for(const selfDraw of [false,true])for(const open of [false,true]){
  const label=JSON.stringify({face,roundWind,seatWind,selfDraw,open}),test=fixture(face,roundWind,seatWind,selfDraw,open);let session=test.session;inventory(session);
  if(selfDraw)session=step(session,0,'declare-self-draw');
  else{session=step(session,0,'discard',choice=>choice.tileIds.includes(test.winningId));session=step(session,1,'claim-discard',choice=>choice.claim==='win');for(const seat of [2,3])if(session.round.phase==='claim')session=step(session,seat,'pass-claim');}
  assert.equal(session.round.phase,'finished',label);const result=session.round.winResult;
  assert.equal(points(result,39),8,label+': mixed straight anchors the legal win');
  assert.equal(points(result,60),face===roundWind?2:0,label+': prevailing wind');
  assert.equal(points(result,61),face===seatWind?2:0,label+': seat wind');
  assert.equal(points(result,73),face===roundWind||face===seatWind?0:1,label+': generic honor pung only for non-value wind');
  if(face===roundWind||face===seatWind)assert.ok(result.analysis.exclusions.some(item=>item.fanCode==='mcr-73'&&item.excludedBy.some(cause=>cause.fanCode==='mcr-'+(face===roundWind?60:61))),label+': explicit lower-fan exclusion');
  const due=result.analysis.total+8;
  assert.deepEqual(Object.values(result.settlement.deltas),selfDraw?[3*due,-due,-due,-due]:[-due,result.analysis.total+24,-8,-8],label+': four-seat payment');
  count++;
 }
 console.log('PASS: '+count+' real wind-context endings, both wind fans, lower honor exclusion, 144 tiles, revisions and four-seat payments.');
})().catch(error=>{console.error(error);process.exitCode=1;});
