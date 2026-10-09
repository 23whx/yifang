// WMO MCR2021 #12/#33/#66: concealed-pung tiers are exclusive. A discard
// completing a pung makes that group open for this count; self-draw does not.
// https://www.mindmahjong.com/adobe/MCR2021.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
(async()=>{
 const rules=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?rules:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](module,file):js(module,file);
 const {scoreMcrHand,mcrTileFace}=require('../lib/mahjong/mcr-score.ts');
 const {newMcrSession,mcrSessionView,actMcrSession}=require('../lib/mahjong/mcr-session.ts');
 const groupTiles=[1,13,25,27],pair=31;
 function hand(hiddenMask,winningGroup){
  const melds=groupTiles.filter((_,index)=>!(hiddenMask&(1<<index))).map(tile=>({kind:'pung',tiles:[tile,tile,tile],open:true}));
  const concealedBeforeWin=[...groupTiles.filter((_,index)=>hiddenMask&(1<<index)).flatMap(tile=>[tile,tile,tile]),pair,pair];
  const winningTile=winningGroup===null?pair:groupTiles[winningGroup];assert.ok(concealedBeforeWin.includes(winningTile));
  concealedBeforeWin.splice(concealedBeforeWin.indexOf(winningTile),1);
  return {melds,concealedBeforeWin,winningTile};
 }
 function fixture(input,selfDraw){
  const original=newMcrSession(179),round=structuredClone(original.round),pool=[...analysis.createMcrTileSet()],winner=selfDraw?'seat-1':'seat-2';
  const take=index=>{const face=mcrTileFace(index),at=pool.findIndex(tile=>tile.face===face);assert.ok(at>=0,'missing '+face);return pool.splice(at,1)[0];};
  const declared=input.melds.map(meld=>meld.tiles.map(take)),concealed=input.concealedBeforeWin.map(take),winning=take(input.winningTile);
  round.hands=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.melds=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.flowers=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.melds[winner]=declared.map(tiles=>({kind:'pung',exposure:'melded',tiles,claimedTileId:tiles[0].id,fromPlayerId:'seat-3'}));
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
 function fanPoints(result,code){return result.analysis.occurrences.filter(item=>item.fanCode==='mcr-'+code).reduce((sum,item)=>sum+item.points,0);}
 const counts={cases:0,tier64:0,tier16:0,tier2:0,noTier:0};
 for(let hiddenMask=0;hiddenMask<16;hiddenMask++){
  const completions=[null,...groupTiles.map((_,index)=>index).filter(index=>hiddenMask&(1<<index))];
  for(const winningGroup of completions)for(const selfDraw of [false,true]){
   const label=JSON.stringify({hiddenMask,winningGroup,selfDraw}),input=hand(hiddenMask,winningGroup);
   const concealedCount=groupTiles.filter((_,index)=>hiddenMask&(1<<index)).length-Number(!selfDraw&&winningGroup!==null);
   const tier=concealedCount===4?{code:12,points:64}:concealedCount===3?{code:33,points:16}:concealedCount===2?{code:66,points:2}:null;
   const fullyUnmelded=hiddenMask===15;
   const sourceFans={56:fullyUnmelded&&selfDraw?4:0,62:fullyUnmelded&&!selfDraw&&concealedCount<4?2:0,80:!fullyUnmelded&&selfDraw?1:0};
   const expected=scoreMcrHand({...input,winner:selfDraw?0:1,from:0,roundWind:0,seatWind:selfDraw?0:1,source:selfDraw?'wall':'discard',flowers:[],lastWallEvent:false,lastCopy:false});
   assert.ok(expected.ok,label+': All Types and All Pungs clear the win threshold');
   for(const [code,points] of [[12,64],[33,16],[66,2]])assert.equal(fanPoints(expected,code),tier?.code===code?points:0,label+': exclusive tier '+code);
   for(const [code,points] of Object.entries(sourceFans))assert.equal(fanPoints(expected,code),points,label+': source/concealment fan '+code);
   const test=fixture(input,selfDraw);let session=test.session;inventory(session);
   if(selfDraw)session=step(session,0,'declare-self-draw');
   else{session=step(session,0,'discard',choice=>choice.tileIds.includes(test.winningId));session=step(session,1,'claim-discard',choice=>choice.claim==='win');for(const seat of [2,3])if(session.round.phase==='claim')session=step(session,seat,'pass-claim');}
   assert.equal(session.round.phase,'finished',label);
   for(const [code,points] of [[12,64],[33,16],[66,2]])assert.equal(fanPoints(session.round.winResult,code),tier?.code===code?points:0,label+': terminal tier '+code);
   for(const [code,points] of Object.entries(sourceFans))assert.equal(fanPoints(session.round.winResult,code),points,label+': terminal source/concealment fan '+code);
   if(fullyUnmelded&&!selfDraw&&concealedCount===4)assert.ok(session.round.winResult.analysis.exclusions.some(item=>item.fanCode==='mcr-62'&&item.excludedBy.some(cause=>cause.fanCode==='mcr-12')),label+': four concealed pungs absorb the closed-discard fan with an explanation');
   assert.deepEqual([...session.round.winResult.analysis.fanCodes].sort(),[...expected.analysis.fanCodes].sort(),label);
   assert.equal(session.round.winResult.analysis.total,expected.analysis.total,label);
   assert.deepEqual(Object.values(session.round.winResult.settlement.deltas),expected.settlement.delta,label);
   counts[tier?'tier'+tier.points:'noTier']++;counts.cases++;
  }
 }
 console.log('PASS: '+JSON.stringify(counts)+' actual concealed-pung tier endings, all exposure masks, pair/pung completion and both win sources; inventory, revisions and settlement checked.');
})().catch(error=>{console.error(error);process.exitCode=1;});
