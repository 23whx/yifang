// WMO/EMA Greenbook 2021 #65/#66: same-number pungs in two suits differ
// from two pungs made without melding. Vary rank and exposure independently.
// https://mahjongclublausanne.ch/wp-content/uploads/2024/03/Greenbook2021_Chinese-EN.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
(async()=>{
 const rules=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?rules:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](module,file):js(module,file);
 const {scoreMcrHand,mcrTileFace}=require('../lib/mahjong/mcr-score.ts');
 const {newMcrSession,mcrSessionView,actMcrSession}=require('../lib/mahjong/mcr-session.ts');
 function hand(sameRank,mask,completion){
  const groups=[{kind:'pung',tiles:[1,1,1]},{kind:'pung',tiles:Array(3).fill(sameRank?10:11)},{kind:'chow',tiles:[23,24,25]},{kind:'pung',tiles:[31,31,31]}];
  const melds=groups.filter((_,index)=>index>=2||Boolean(mask&(1<<index))).map(group=>({...group,open:true}));
  const concealedBeforeWin=[...groups.filter((_,index)=>index<2&&!(mask&(1<<index))).flatMap(group=>group.tiles),27,27];
  const winningTile=completion==='pung'?1:27;
  assert.ok(concealedBeforeWin.includes(winningTile));
  concealedBeforeWin.splice(concealedBeforeWin.indexOf(winningTile),1);
  return {melds,concealedBeforeWin,winningTile};
 }
 function fixture(input,selfDraw){
  const original=newMcrSession(173),round=structuredClone(original.round),pool=[...analysis.createMcrTileSet()],winner=selfDraw?'seat-1':'seat-2';
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
 function points(analysisResult,code){return analysisResult.occurrences.filter(item=>item.fanCode==='mcr-'+code).reduce((sum,item)=>sum+item.points,0);}
 let count=0;
 for(const sameRank of [false,true])for(let mask=0;mask<4;mask++)for(const selfDraw of [false,true])for(const completion of (mask&1)?['pair']:['pair','pung']){
  const label=JSON.stringify({sameRank,mask,selfDraw,completion}),input=hand(sameRank,mask,completion);
  const twoConcealed=mask===0&&(completion==='pair'||selfDraw);
  const expected=scoreMcrHand({...input,winner:selfDraw?0:1,from:0,roundWind:0,seatWind:selfDraw?0:1,source:selfDraw?'wall':'discard',flowers:[],lastWallEvent:false,lastCopy:false});
  assert.ok(expected.ok,label+': All Types and Dragon Pung meet the 8-point minimum');
  assert.equal(points(expected.analysis,65),sameRank?2:0,label+': same numerical rank in two suits');
  assert.equal(points(expected.analysis,66),twoConcealed?2:0,label+': a discard-completed pung is not concealed');
  const test=fixture(input,selfDraw);let session=test.session;inventory(session);
  if(selfDraw)session=step(session,0,'declare-self-draw');
  else{session=step(session,0,'discard',choice=>choice.tileIds.includes(test.winningId));session=step(session,1,'claim-discard',choice=>choice.claim==='win');for(const seat of [2,3])if(session.round.phase==='claim')session=step(session,seat,'pass-claim');}
  assert.equal(session.round.phase,'finished',label);
  assert.equal(points(session.round.winResult.analysis,65),sameRank?2:0,label);
  assert.equal(points(session.round.winResult.analysis,66),twoConcealed?2:0,label);
  assert.deepEqual([...session.round.winResult.analysis.fanCodes].sort(),[...expected.analysis.fanCodes].sort(),label);
  assert.equal(session.round.winResult.analysis.total,expected.analysis.total,label);
  assert.deepEqual(Object.values(session.round.winResult.settlement.deltas),expected.settlement.delta,label);
  count++;
 }
 console.log('PASS: '+count+' #65/#66 action endings vary rank, exposure, pair/pung completion and win source independently, with full inventory and settlement.');
})().catch(error=>{console.error(error);process.exitCode=1;});
