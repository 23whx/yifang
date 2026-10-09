// WMO/EMA Greenbook 2021 fan 35 example 1: Knitted Straight with All Types,
// Concealed Hand, Dragon Pung and Single Wait.
// https://mahjongclublausanne.ch/wp-content/uploads/2024/03/Greenbook2021_Chinese-EN.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-analysis-core'),rules=await import('miaoda-game-mcr-mahjong-rules'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-analysis-core'?core:request==='miaoda-game-mcr-mahjong-rules'?rules:load.call(this,request,...args);};
 require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {scoreMcrHand,mcrTileFace}=require('../lib/mahjong/mcr-score.ts');
 const {newMcrSession,mcrSessionView,actMcrSession}=require('../lib/mahjong/mcr-session.ts');
 const permutations=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
 let cases=0;
 for(const suits of permutations)for(let wind=27;wind<=30;wind++)for(let dragon=31;dragon<=33;dragon++)for(const selfDraw of [false,true]){
  const knitted=suits.flatMap((s,i)=>[i,i+3,i+6].map(r=>s*9+r));
  const complete=[...knitted,dragon,dragon,dragon,wind,wind];
  for(const final of [wind,dragon]){
   const before=[...complete];before.splice(before.lastIndexOf(final),1);
   const input={concealedBeforeWin:before,winningTile:final,melds:[],winner:0,from:selfDraw?0:1,roundWind:0,seatWind:1,source:selfDraw?'wall':'discard',flowers:[],lastWallEvent:false,lastCopy:false};
   const result=scoreMcrHand(input),label=JSON.stringify({suits,wind,dragon,selfDraw,final});
   assert.ok(result.ok,label);
   const points=code=>result.analysis.occurrences.filter(o=>o.fanCode===`mcr-${code}`).reduce((sum,o)=>sum+o.points,0);
   assert.equal(points('35'),12,`${label}: knitted straight`);
   assert.equal(points('52'),6,`${label}: all types`);
   assert.equal(points('59'),2,`${label}: dragon pung`);
   assert.equal(points('79'),final===wind?1:0,`${label}: pair wait only when the pair is completed`);
   assert.equal(points('56'),selfDraw?4:0,`${label}: fully concealed self draw`);
   assert.equal(points('62'),selfDraw?0:2,`${label}: concealed discard claim`);
   assert.equal(points('80'),0,`${label}: self draw must not repeat fully concealed`);
   const total=22+(final===wind?1:0)+(selfDraw?2:0),due=total+8;
   assert.equal(result.analysis.nonFlowerTotal,total,`${label}: non-flower points`);
   assert.deepEqual(result.settlement.delta,selfDraw?[3*due,-due,-due,-due]:[total+24,-due,-8,-8],`${label}: four-seat payment`);
   cases++;
  }
 }
 // The 9 knitted tiles leave one ordinary three-tile group and a pair. A
 // sequence that looks like an edge or middle wait is worth one point only
 // when the whole 13-tile hand has exactly one winning face.
 const waits=[
  {held:[0,1],win:2,code:'77',name:'123 edge'},
  {held:[3,5],win:4,code:'78',name:'345 middle'},
  {held:[7,8],win:6,code:'77',name:'789 edge'},
  {held:[1,2],win:0,code:null,name:'23 two-sided low'},
  {held:[1,2],win:3,code:null,name:'23 two-sided high'},
 ];
 function independentKnittedWin(tiles){
  for(const suits of permutations){
   const counts=Array(34).fill(0);for(const tile of tiles)counts[tile]++;
   const knitted=suits.flatMap((s,i)=>[i,i+3,i+6].map(r=>s*9+r));
   if(knitted.some(tile=>counts[tile]===0))continue;
   for(const tile of knitted)counts[tile]--;
   for(let pair=0;pair<34;pair++)if(counts[pair]>=2){
    counts[pair]-=2;
    const rest=[];for(let tile=0;tile<34;tile++)for(let copy=0;copy<counts[tile];copy++)rest.push(tile);
    counts[pair]+=2;
    if(rest.length===3&&(rest[0]===rest[2]||rest[0]<27&&rest[2]<27&&Math.floor(rest[0]/9)===Math.floor(rest[2]/9)&&rest[1]===rest[0]+1&&rest[2]===rest[0]+2))return true;
   }
  }
  return false;
 }
 function independentStandardWin(tiles){
  const counts=Array(34).fill(0);for(const tile of tiles)counts[tile]++;
  function groupsLeft(groups){
   if(groups===0)return counts.every(count=>count===0);
   const tile=counts.findIndex(count=>count>0);if(tile<0)return false;
   if(counts[tile]>=3){counts[tile]-=3;const yes=groupsLeft(groups-1);counts[tile]+=3;if(yes)return true;}
   if(tile<27&&tile%9<=6&&counts[tile+1]>0&&counts[tile+2]>0){
    counts[tile]--;counts[tile+1]--;counts[tile+2]--;
    const yes=groupsLeft(groups-1);
    counts[tile]++;counts[tile+1]++;counts[tile+2]++;
    if(yes)return true;
   }
   return false;
  }
  for(let pair=0;pair<34;pair++)if(counts[pair]>=2){counts[pair]-=2;const yes=groupsLeft(4);counts[pair]+=2;if(yes)return true;}
  return false;
 }
 function independentWinningFaces(before){
  const counts=Array(34).fill(0);for(const tile of before)counts[tile]++;
  return Array.from({length:34},(_,tile)=>tile).filter(tile=>counts[tile]<4&&(independentKnittedWin([...before,tile])||independentStandardWin([...before,tile])));
 }
 for(const suits of permutations)for(let residualSuit=0;residualSuit<3;residualSuit++)for(const shape of waits)for(const selfDraw of [false,true]){
  const knitted=suits.flatMap((s,i)=>[i,i+3,i+6].map(r=>s*9+r));
  const ordinary=shape.held.map(r=>residualSuit*9+r),winningTile=residualSuit*9+shape.win;
  const input={concealedBeforeWin:[...knitted,...ordinary,27,27],winningTile,melds:[],winner:0,from:selfDraw?0:1,roundWind:0,seatWind:1,source:selfDraw?'wall':'discard',flowers:[],lastWallEvent:false,lastCopy:false};
  const result=scoreMcrHand(input),label=JSON.stringify({suits,residualSuit,shape:shape.name,selfDraw});
  const expectedFaces=(shape.code?[shape.win]:[0,3]).map(rank=>residualSuit*9+rank);
  assert.deepEqual(independentWinningFaces(input.concealedBeforeWin),expectedFaces,`${label}: independent 13-tile winning-face oracle`);
  assert.ok(result.ok,label);
  const codes=new Set(result.analysis.fanCodes);
  assert.ok(codes.has('mcr-35'),`${label}: knitted straight`);
  for(const code of ['77','78','79'])assert.equal(codes.has(`mcr-${code}`),code===shape.code,`${label}: globally unique wait, not local sequence appearance`);
  assert.equal(result.analysis.nonFlowerTotal,12+(selfDraw?4:2)+(shape.code?1:0),`${label}: exact non-flower points`);
  const due=result.analysis.total+8;
  assert.deepEqual(result.settlement.delta,selfDraw?[3*due,-due,-due,-due]:[result.analysis.total+24,-due,-8,-8],`${label}: four-seat payment`);
  cases++;
 }
 function sessionFixture(before,winningTile,selfDraw){
  const original=newMcrSession(457),round=structuredClone(original.round),pool=[...core.createMcrTileSet()],winner=selfDraw?'seat-1':'seat-2';
  const take=index=>{const face=mcrTileFace(index),at=pool.findIndex(tile=>tile.face===face);assert.ok(at>=0,`missing ${face}`);return pool.splice(at,1)[0];};
  const hand=before.map(take),winning=take(winningTile);
  round.hands=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.melds=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.flowers=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.hands[winner]=selfDraw?[...hand,winning]:hand;
  if(!selfDraw)round.hands['seat-1'].push(winning);
  for(const id of round.playerOrder)if(id!==winner)while(round.hands[id].length<(id==='seat-1'&&!selfDraw?14:13)){
   const at=pool.findIndex(tile=>core.isMcrStructureTile(tile.face)&&tile.face!==winning.face);assert.ok(at>=0);round.hands[id].push(pool.splice(at,1)[0]);
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
  const previous=JSON.stringify(session),choice=mcrSessionView(session,seat).choices.find(item=>item.type===type&&predicate(item));assert.ok(choice,`${type} seat ${seat}`);
  const next=actMcrSession(session,seat,session.revision,choice.index);assert.equal(JSON.stringify(session),previous);assert.equal(next.revision,session.revision+1);inventory(next);return next;
 }
 let endings=0;
 for(const suits of permutations)for(const shape of [waits[0],waits[1],waits[3]])for(const selfDraw of [false,true]){
  const knitted=suits.flatMap((s,i)=>[i,i+3,i+6].map(r=>s*9+r));
  const before=[...knitted,...shape.held,27,27],winningTile=shape.win,fixture=sessionFixture(before,winningTile,selfDraw);
  let session=fixture.session;inventory(session);
  if(selfDraw)session=step(session,0,'declare-self-draw');
  else{
   session=step(session,0,'discard',choice=>choice.tileIds.includes(fixture.winningId));
   session=step(session,1,'claim-discard',choice=>choice.claim==='win');
   for(const seat of [2,3])if(session.round.phase==='claim')session=step(session,seat,'pass-claim');
  }
  const label=JSON.stringify({suits,shape:shape.name,selfDraw}),result=session.round.winResult;assert.equal(session.round.phase,'finished',label);
  assert.ok(result.analysis.fanCodes.includes('mcr-35'),label);
  for(const code of ['77','78','79'])assert.equal(result.analysis.fanCodes.includes(`mcr-${code}`),code===shape.code,label);
  const total=12+(selfDraw?4:2)+(shape.code?1:0),due=total+8;
  assert.equal(result.analysis.total,total,label);
  assert.deepEqual(Object.values(result.settlement.deltas),selfDraw?[3*due,-due,-due,-due]:[-due,total+24,-8,-8],label);
  endings++;
 }
 console.log(`PASS: ${cases} closed knitted-straight official-combination and unique/two-sided sequence-wait score cases, plus ${endings} physical-tile session endings with actual draw/discard/claim, exact wait fans and four-seat payment.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
