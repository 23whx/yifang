// WMO MCR2021 #22, #59, #65, #68, #70, #71, #72, #75, #76: one-condition contrasts through real
// last-wall draw/discard actions, which supply an independent eight-point fan.
// https://www.mindmahjong.com/adobe/ZC2021.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
(async()=>{
 const rules=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?rules:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](module,file):js(module,file);
 const {scoreMcrHand,mcrTileFace}=require('../lib/mahjong/mcr-score.ts');
 const {newMcrSession,mcrSessionView,actMcrSession}=require('../lib/mahjong/mcr-session.ts');
 const chow=(a,b,c)=>({kind:'chow',tiles:[a,b,c],open:true}),pung=n=>({kind:'pung',tiles:[n,n,n],open:true});
 const cases=[
  ...[0,1,2].flatMap(suit=>[
   {name:`pure-flush-${suit}`,code:22,want:24,melds:[chow(suit*9,suit*9+1,suit*9+2),chow(suit*9+3,suit*9+4,suit*9+5),chow(suit*9+6,suit*9+7,suit*9+8),pung(suit*9+4)],pair:suit*9+1},
   {name:`second-suit-${suit}`,code:22,want:0,melds:[chow(suit*9,suit*9+1,suit*9+2),chow(suit*9+3,suit*9+4,suit*9+5),chow(suit*9+6,suit*9+7,suit*9+8),pung(((suit+1)%3)*9+4)],pair:suit*9+1},
  ]),
  ...[31,32,33].flatMap(dragon=>[
   {name:`dragon-${dragon}`,code:59,want:2,melds:[pung(dragon),chow(0,1,2),chow(12,13,14),chow(24,25,26)],pair:28},
   {name:`wind-instead-${dragon}`,code:59,want:0,melds:[pung(30),chow(0,1,2),chow(12,13,14),chow(24,25,26)],pair:28},
  ]),
  {name:'all-simples',code:68,want:2,melds:[chow(1,2,3),chow(11,12,13),chow(21,22,23),pung(5)],pair:13},
  {name:'terminal-pair',code:68,want:0,melds:[chow(1,2,3),chow(11,12,13),chow(21,22,23),pung(5)],pair:0},
  {name:'short-straight',code:71,want:1,melds:[chow(0,1,2),chow(3,4,5),chow(10,11,12),pung(31)],pair:27},
  {name:'broken-short-straight',code:71,want:0,melds:[chow(0,1,2),chow(4,5,6),chow(10,11,12),pung(31)],pair:27},
  {name:'old-and-young',code:72,want:1,melds:[chow(0,1,2),chow(10,11,12),pung(31),chow(6,7,8)],pair:27},
  {name:'broken-old-and-young',code:72,want:0,melds:[chow(0,1,2),chow(10,11,12),pung(31),chow(5,6,7)],pair:27},
  {name:'old-and-young-absorbed-by-mixed-straight',code:72,want:0,melds:[chow(0,1,2),chow(12,13,14),chow(24,25,26),chow(6,7,8)],pair:31},
  {name:'one-voided-suit',code:75,want:1,melds:[chow(0,1,2),chow(12,13,14),pung(1),pung(11)],pair:31},
  {name:'three-suits',code:75,want:0,melds:[chow(0,1,2),chow(21,22,23),pung(1),pung(11)],pair:31},
  {name:'no-honors',code:76,want:1,melds:[chow(0,1,2),chow(12,13,14),chow(24,25,26),pung(4)],pair:13},
  {name:'honor-pair',code:76,want:0,melds:[chow(0,1,2),chow(12,13,14),chow(24,25,26),pung(4)],pair:31},
  {name:'cross-family-both',code:70,want:1,extra:[65,2],melds:[chow(0,1,2),chow(9,10,11),pung(4),pung(13)],pair:24},
  {name:'cross-family-no-pair',code:70,want:1,extra:[65,0],melds:[chow(0,1,2),chow(9,10,11),pung(4),pung(14)],pair:24},
  {name:'cross-family-no-chow',code:70,want:0,extra:[65,2],melds:[chow(0,1,2),chow(10,11,12),pung(4),pung(13)],pair:24},
  {name:'cross-family-neither',code:70,want:0,extra:[65,0],melds:[chow(0,1,2),chow(10,11,12),pung(4),pung(14)],pair:24},
 ];
 function fixture(input,selfDraw){
  const original=newMcrSession(911),round=structuredClone(original.round),pool=[...analysis.createMcrTileSet()],winner=selfDraw?'seat-1':'seat-2';
  const take=index=>{const face=mcrTileFace(index),at=pool.findIndex(tile=>tile.face===face);assert.ok(at>=0,`${input.name}: missing ${face}`);return pool.splice(at,1)[0];};
  const declared=input.melds.map(meld=>meld.tiles.map(take)),held=take(input.pair),winning=take(input.pair);
  round.hands=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.melds=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.flowers=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.melds[winner]=declared.map((tiles,index)=>({kind:input.melds[index].kind,exposure:'melded',tiles,claimedTileId:tiles[0].id,fromPlayerId:'seat-3'}));
  round.hands[winner]=[held];
  for(const id of round.playerOrder)if(id!==winner)while(round.hands[id].length<13){const at=pool.findIndex(tile=>analysis.isMcrStructureTile(tile.face)&&tile.face!==winning.face);assert.ok(at>=0);round.hands[id].push(pool.splice(at,1)[0]);}
  round.wall=[winning];round.discardPile=pool.filter(tile=>analysis.isMcrStructureTile(tile.face));round.flowers['seat-4']=pool.filter(tile=>!analysis.isMcrStructureTile(tile.face));
  round.activePlayerId='seat-1';round.phase='draw';round.turnSource=null;round.drewThisTurn=false;round.lastDrawnTileId=null;round.pendingFlowerTileId=null;round.claimWindow=null;round.actionHistory=[];round.winResult=null;round.drawResult=null;
  return {session:{...original,round,opening:[]},winningId:winning.id};
 }
 function inventory(session){const round=session.round,tiles=[...round.wall,...round.discardPile,...Object.values(round.hands).flat(),...Object.values(round.melds).flat().flatMap(meld=>meld.tiles),...Object.values(round.flowers).flat()];assert.equal(tiles.length,144);assert.equal(new Set(tiles.map(tile=>tile.id)).size,144);}
 function step(session,seat,type,predicate=()=>true){
  const previous=JSON.stringify(session),choice=mcrSessionView(session,seat).choices.find(item=>item.type===type&&predicate(item));assert.ok(choice,`${type} seat ${seat}`);
  const next=actMcrSession(session,seat,session.revision,choice.index);assert.equal(JSON.stringify(session),previous);assert.equal(next.revision,session.revision+1);inventory(next);return next;
 }
 function points(result,code){return result.analysis.occurrences.filter(item=>item.fanCode===`mcr-${code}`).reduce((sum,item)=>sum+item.points,0);}
 let endings=0;
 for(const input of cases)for(const selfDraw of [false,true]){
  const label=`${input.name}/${selfDraw?'self':'claim'}`,hand={melds:input.melds,concealedBeforeWin:[input.pair],winningTile:input.pair};
  const expected=scoreMcrHand({...hand,winner:selfDraw?0:1,from:0,roundWind:0,seatWind:selfDraw?0:1,source:selfDraw?'wall':'discard',flowers:[],lastWallEvent:true,lastCopy:false});
  assert.ok(expected.ok,label);assert.equal(points(expected,input.code),input.want,label);if(input.extra)assert.equal(points(expected,input.extra[0]),input.extra[1],label);assert.equal(points(expected,selfDraw?44:45),8,label);
  const built=fixture(input,selfDraw);let session=built.session;inventory(session);session=step(session,0,'draw');assert.equal(session.round.wall.length,0,label);
  if(selfDraw)session=step(session,0,'declare-self-draw');
  else{session=step(session,0,'discard',choice=>choice.tileIds.includes(built.winningId));session=step(session,1,'claim-discard',choice=>choice.claim==='win');for(const seat of [2,3])if(session.round.phase==='claim')session=step(session,seat,'pass-claim');}
  assert.equal(session.round.phase,'finished',label);const result=session.round.winResult;assert.equal(points(result,input.code),input.want,label);if(input.extra)assert.equal(points(result,input.extra[0]),input.extra[1],label);assert.equal(points(result,selfDraw?44:45),8,label);
  if(input.name==='old-and-young-absorbed-by-mixed-straight'){
   assert.equal(points(result,39),8,label);
   // Mixed Straight uses the same 123 group; the optimizer must not spend it
   // again on Old and Young. Partial overlap is not an inclusion exclusion.
   assert.equal(points(result,72),0,label);
  }
  assert.deepEqual([...result.analysis.fanCodes].sort(),[...expected.analysis.fanCodes].sort(),label);assert.equal(result.analysis.total,expected.analysis.total,label);
  assert.deepEqual(Object.values(result.settlement.deltas),expected.settlement.delta,label);endings++;
 }
 console.log(`PASS: ${endings} real last-wall endings contrasting Pure Flush, Dragon Pung, Double Pung + Mixed Double Chow, All Simples, Short Straight, Old and Young, One Voided Suit and No Honors; full inventory, revisions, fan lists and settlement.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
