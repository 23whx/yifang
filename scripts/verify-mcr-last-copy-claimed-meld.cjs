// A claimed discard moves into the meld: it must remain publicly visible for
// Last Tile (#58), but cannot exist twice in the authoritative tile inventory.
// WMO definition: https://www.mindmahjong.com/adobe/z20140402.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
(async()=>{
 const rules=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?rules:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](module,file):js(module,file);
 const {newMcrSession,mcrSessionView,actMcrSession}=require('../lib/mahjong/mcr-session.ts');
 const {scoreMcrHand}=require('../lib/mahjong/mcr-score.ts');
 function fixture(last,claimKind,priorPublic){
  const original=newMcrSession(421),round=structuredClone(original.round),pool=[...analysis.createMcrTileSet()];
  const take=face=>{const index=pool.findIndex(tile=>tile.face===face);assert.ok(index>=0,face);return pool.splice(index,1)[0];};
  const takeOther=()=>{const index=pool.findIndex(tile=>analysis.isMcrStructureTile(tile.face)&&tile.face!=='3m');assert.ok(index>=0);return pool.splice(index,1)[0];};
  round.hands=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.melds=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.flowers=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.hands['seat-1']=['1m','2m','4m','5m','6m','7m','8m','9m','C','C','C','E','E'].map(take);
  const third=take('3m');round.hands['seat-2'].push(third);
  const priorDiscards=[];
  if(claimKind==='pung')round.hands['seat-3'].push(take('3m'),take('3m'));
  else if(claimKind==='chow'){
   round.hands['seat-3'].push(take('1m'),take('2m'));
   const otherCopies=[take('3m'),take('3m')];
   priorDiscards.push(...otherCopies.slice(0,priorPublic));
   round.hands['seat-3'].push(...otherCopies.slice(priorPublic));
  }
  else throw new Error('Invalid claim kind');
  const winning=take('3m');
  for(const [id,count] of [['seat-2',14],['seat-3',13],['seat-4',13]])while(round.hands[id].length<count)round.hands[id].push(takeOther());
  const spare=takeOther(),extra=last?null:takeOther();
  round.wall=[spare,winning,...(extra?[extra]:[])];
  round.discardPile=[...priorDiscards,...pool.filter(tile=>analysis.isMcrStructureTile(tile.face))];
  round.flowers['seat-4']=pool.filter(tile=>!analysis.isMcrStructureTile(tile.face));
  round.activePlayerId='seat-2';round.phase='discard';round.turnSource='wall';round.drewThisTurn=true;round.lastDrawnTileId=third.id;
  round.pendingFlowerTileId=null;round.claimWindow=null;round.actionHistory=[];round.winResult=null;round.drawResult=null;
  return {session:{...original,round,opening:[]},thirdId:third.id,winningId:winning.id,spareId:spare.id};
 }
 function inventory(session){
  const round=session.round,tiles=[...round.wall,...round.discardPile,...Object.values(round.hands).flat(),...Object.values(round.melds).flat().flatMap(meld=>meld.tiles),...Object.values(round.flowers).flat()];
  assert.equal(tiles.length,144);assert.equal(new Set(tiles.map(tile=>tile.id)).size,144);
 }
 function step(session,seat,type,predicate=()=>true){
  const before=JSON.stringify(session),choice=mcrSessionView(session,seat).choices.find(item=>item.type===type&&predicate(item));assert.ok(choice,type+' seat '+seat);
  const next=actMcrSession(session,seat,session.revision,choice.index);assert.equal(JSON.stringify(session),before);assert.equal(next.revision,session.revision+1);inventory(next);return next;
 }
 const chowOutcomes=new Map();
 for(const claimKind of ['pung','chow'])for(const last of [false,true])for(const priorPublic of (claimKind==='pung'?[2]:[1,2])){
  const f=fixture(last,claimKind,priorPublic);let session=f.session;inventory(session);
  session=step(session,1,'discard',choice=>choice.tileIds.includes(f.thirdId));
  session=step(session,0,'pass-claim');
  session=step(session,2,'claim-discard',choice=>choice.claim===claimKind);
  session=step(session,3,'pass-claim');
  assert.equal(session.round.phase,'discard');assert.equal(session.round.activePlayerId,'seat-3');
  const claimed=session.round.melds['seat-3'][0];assert.equal(claimed.kind,claimKind);assert.equal(claimed.claimedTileId,f.thirdId);
  assert.ok(claimed.tiles.some(tile=>tile.id===f.thirdId));
  assert.ok(!session.round.discardPile.some(tile=>tile.id===f.thirdId),'claimed discard leaves pool');
  assert.equal(new Set(claimed.tiles.map(tile=>tile.id)).size,3);
  const seat3Discard=session.round.hands['seat-3'].find(tile=>tile.face!=='3m');assert.ok(seat3Discard);
  session=step(session,2,'discard',choice=>choice.tileIds.includes(seat3Discard.id));
  for(const seat of [0,1,3])session=step(session,seat,'pass-claim');
  assert.equal(session.round.phase,'draw');assert.equal(session.round.activePlayerId,'seat-4');
  session=step(session,3,'draw');assert.equal(session.round.lastDrawnTileId,f.spareId);
  session=step(session,3,'discard',choice=>choice.tileIds.includes(f.spareId));
  for(const seat of [0,1,2])session=step(session,seat,'pass-claim');
  assert.equal(session.round.phase,'draw');assert.equal(session.round.activePlayerId,'seat-1');
  session=step(session,0,'draw');assert.equal(session.round.lastDrawnTileId,f.winningId);
  assert.equal(session.round.wall.length,last?0:1);
  const visible=[...session.round.discardPile,...session.round.playerOrder.flatMap(id=>session.round.melds[id].filter(meld=>meld.exposure==='melded').flatMap(meld=>meld.tiles))];
  const expectedVisible=claimKind==='pung'?3:priorPublic+1;
  assert.equal(new Set(visible.filter(tile=>tile.face==='3m').map(tile=>tile.id)).size,expectedVisible,'unique public copies');
  const expectedFaces=['1m','2m','4m','5m','6m','7m','8m','9m','C','C','C','E','E'];
  assert.deepEqual(session.round.hands['seat-1'].filter(tile=>tile.id!==f.winningId).map(tile=>tile.face).sort(),expectedFaces.sort(),'winning hand retains its independent expected shape');
  const expected=scoreMcrHand({concealedBeforeWin:[0,1,3,4,5,6,7,8,31,31,31,27,27],winningTile:2,melds:[],winner:0,from:0,roundWind:0,seatWind:0,source:'wall',flowers:[],lastWallEvent:last,lastCopy:expectedVisible===3});
  assert.ok(expected.ok);
  session=step(session,0,'declare-self-draw');assert.equal(session.round.phase,'finished');
  const result=session.round.winResult;
  assert.equal(result.analysis.fanCodes.includes('mcr-58'),expectedVisible===3,'claimed tile counts once and hidden copies do not count');
  assert.equal(result.analysis.fanCodes.includes('mcr-44'),last,'last ordinary wall tile only');
  assert.equal(result.analysis.total,expected.analysis.total);
  assert.deepEqual([...result.analysis.fanCodes].sort(),[...expected.analysis.fanCodes].sort());
  assert.deepEqual(Object.values(result.settlement.deltas),expected.settlement.delta);
  if(claimKind==='chow')chowOutcomes.set(`${last}:${priorPublic}`,result);
 }
 for(const last of [false,true]){
  const hidden=chowOutcomes.get(`${last}:1`),publicThree=chowOutcomes.get(`${last}:2`);
  assert.deepEqual(publicThree.analysis.fanCodes.filter(code=>code!=='mcr-58').sort(),hidden.analysis.fanCodes.sort(),'only Last Tile differs when third other copy becomes public');
  assert.equal(publicThree.analysis.total-hidden.analysis.total,4);
  for(const id of ['seat-1','seat-2','seat-3','seat-4'])assert.equal(publicThree.settlement.deltas[id]-hidden.settlement.deltas[id],id==='seat-1'?12:-4,'self-draw payment difference');
 }
 console.log('PASS: six actual discard -> pung/chow claim -> intervening turns -> fourth-copy wall win endings; claimed tile moved exactly once, two versus three public copies isolate Last Tile +4, optional Last Tile Draw, 144 physical tiles and exact four-seat settlement. Authored mid-hand start, not a random opening replay.');
})().catch(error=>{console.error(error);process.exitCode=1;});
