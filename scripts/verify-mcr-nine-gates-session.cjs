// MCR Nine Gates depends on the 13-tile nine-way pre-win wait, not only the
// final 14-tile shape. Exercise actual self-draw and discard-claim sessions.
// EMA Green Book fan 4: https://mahjong-europe.org/portal/images/docs/mcr_EN.pdf
const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const rules=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load;
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?rules:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 const js=require.extensions['.js'];require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {newMcrSession:create,mcrSessionView:view,actMcrSession:act}=require('../lib/mahjong/mcr-session.ts');
 function fixture(suit,extra,winningRank,selfDraw){
  const original=create(61),round=structuredClone(original.round),pool=[...analysis.createMcrTileSet()];
  const take=face=>{const index=pool.findIndex(tile=>tile.face===face);assert.ok(index>=0,face);return pool.splice(index,1)[0];};
  const faces=[1,1,1,2,3,4,5,6,7,8,9,9,9,extra].map(rank=>`${rank}${suit}`);
  const hand=faces.map(take),winningIndex=hand.findIndex(tile=>tile.face===`${winningRank}${suit}`);
  assert.ok(winningIndex>=0);
  const [winning]=hand.splice(winningIndex,1),winner=selfDraw?'seat-1':'seat-2';
  round.hands=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.melds=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.flowers=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.hands[winner]=selfDraw?[...hand,winning]:hand;
  if(!selfDraw)round.hands['seat-1'].push(winning);
  for(const id of round.playerOrder)if(id!==winner)while(round.hands[id].length<(id==='seat-1'&&!selfDraw?14:13)){
   const index=pool.findIndex(tile=>analysis.isMcrStructureTile(tile.face)&&tile.face!==winning.face);
   assert.ok(index>=0);round.hands[id].push(pool.splice(index,1)[0]);
  }
  round.wall=pool;round.discardPile=[];round.activePlayerId='seat-1';round.phase='discard';
  round.turnSource='wall';round.drewThisTurn=true;round.lastDrawnTileId=winning.id;
  round.pendingFlowerTileId=null;round.claimWindow=null;round.actionHistory=[];round.winResult=null;round.drawResult=null;
  return {session:{...original,round,opening:[]},winningId:winning.id};
 }
 function inventory(session){
  const round=session.round,tiles=[...round.wall,...round.discardPile,...Object.values(round.hands).flat(),...Object.values(round.melds).flat().flatMap(meld=>meld.tiles),...Object.values(round.flowers).flat()];
  assert.equal(tiles.length,144);assert.equal(new Set(tiles.map(tile=>tile.id)).size,144);
 }
 function step(session,seat,type,predicate=()=>true){
  const previous=JSON.stringify(session),choice=view(session,seat).choices.find(candidate=>candidate.type===type&&predicate(candidate));
  assert.ok(choice,`${type} seat ${seat}`);
  const next=act(session,seat,session.revision,choice.index);
  assert.equal(JSON.stringify(session),previous,'prior session immutable');assert.equal(next.revision,session.revision+1);
  inventory(next);return next;
 }
 let positive=0,negative=0;
 for(const suit of ['m','p','s'])for(let extra=1;extra<=9;extra++)for(let winningRank=1;winningRank<=9;winningRank++)for(const selfDraw of [false,true]){
  const test=fixture(suit,extra,winningRank,selfDraw);let session=test.session;inventory(session);
  if(selfDraw)session=step(session,0,'declare-self-draw');
  else{
   session=step(session,0,'discard',choice=>choice.tileIds.includes(test.winningId));
   session=step(session,1,'claim-discard',choice=>choice.claim==='win');
   for(const seat of [2,3])if(session.round.phase==='claim')session=step(session,seat,'pass-claim');
  }
  assert.equal(session.round.phase,'finished');
  const result=session.round.winResult,codes=result.analysis.fanCodes,isNineGates=winningRank===extra;
  assert.equal(result.winnerId,selfDraw?'seat-1':'seat-2');
  assert.equal(result.discarderId,selfDraw?null:'seat-1');
  assert.equal(codes.includes('mcr-04'),isNineGates,`${suit}/${extra}/${winningRank}/${selfDraw}`);
  if(isNineGates){
   const endTile=[1,9].includes(extra);
   assert.equal(result.analysis.nonFlowerTotal,88+(endTile?18:0)+(selfDraw?4:0),`${suit}/${extra}/${winningRank}/${selfDraw}: ${codes.join(',')}`);
   assert.equal(codes.includes('mcr-28'),endTile,'Only an end completion has an independent Pure Straight');
   assert.equal(codes.includes('mcr-64'),endTile,'Only a fourth 1 or 9 is Tile Hog');
   for(const code of ['mcr-22','mcr-62','mcr-73','mcr-80'])assert.ok(!codes.includes(code),`${suit}/${extra}/${selfDraw}: ${code}`);
   assert.equal(codes.includes('mcr-56'),selfDraw);
   positive++;
  }else negative++;
  const points=result.analysis.total;
  assert.deepEqual(Object.values(result.settlement.deltas),selfDraw?[3*(points+8),-points-8,-points-8,-points-8]:[-points-8,points+24,-8,-8]);
 }
 console.log(`PASS: ${positive} nine-way winning-tile sessions and ${negative} same-final-shape wrong-wait sessions across three suits, both win sources; physical inventory, revision, exact fans and payments.`);
 console.log('Authored mid-hands, not seeded-opening reachability or browser evidence.');
})().catch(error=>{console.error(error);process.exitCode=1;});
