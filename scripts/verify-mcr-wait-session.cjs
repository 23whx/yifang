// WMO/EMA Greenbook 2021 fans 77–79: each wait point requires exactly one
// winning tile face, not merely a decomposition that looks like that wait.
// https://mahjongclublausanne.ch/wp-content/uploads/2024/03/Greenbook2021_Chinese-EN.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
(async()=>{
 const rules=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?rules:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](module,file):js(module,file);
 const {newMcrSession,mcrSessionView,actMcrSession}=require('../lib/mahjong/mcr-session.ts');
 const {mcrTileFace}=require('../lib/mahjong/mcr-score.ts');
 const patterns=[
  {held:[0,1,27,27],win:2,fan:'77',name:'123 edge'},
  {held:[7,8,27,27],win:6,fan:'77',name:'789 edge'},
  {held:[1,3,27,27],win:2,fan:'78',name:'123 middle'},
  {held:[3,5,27,27],win:4,fan:'78',name:'345 middle'},
  {held:[6,8,27,27],win:7,fan:'78',name:'789 middle'},
  {held:[0,1,2,28],win:28,fan:'79',name:'honor pair'},
  {held:[0,1,2,4],win:4,fan:'79',name:'suit pair'},
  {held:[1,2,27,27],win:0,fan:null,name:'two-sided low'},
  {held:[1,2,27,27],win:3,fan:null,name:'two-sided high'},
  {held:[0,1,2,3],win:0,fan:null,name:'multiple pair low'},
  {held:[0,1,2,3],win:3,fan:null,name:'multiple pair high'},
 ];
 const waitCodes=new Set(['mcr-77','mcr-78','mcr-79']);
 function makeFixture(openSuit,waitSuit,pattern,selfDraw){
  const original=newMcrSession(77),round=structuredClone(original.round),pool=[...analysis.createMcrTileSet()],winner=selfDraw?'seat-1':'seat-2';
  const take=index=>{const name=mcrTileFace(index),at=pool.findIndex(tile=>tile.face===name);assert.ok(at>=0,`missing ${name}`);return pool.splice(at,1)[0];};
  const suitTile=(suit,rank)=>suit*9+rank;
  round.hands=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.melds=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.flowers=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  for(const start of [0,3,6]){
   const meldTiles=[start,start+1,start+2].map(rank=>take(suitTile(openSuit,rank)));
   round.melds[winner].push({kind:'chow',exposure:'melded',tiles:meldTiles,claimedTileId:meldTiles[0].id,fromPlayerId:'seat-3'});
  }
  const before=pattern.held.map(index=>take(index<27?suitTile(waitSuit,index):index));
  const winning=take(pattern.win<27?suitTile(waitSuit,pattern.win):pattern.win);
  round.hands[winner]=selfDraw?[...before,winning]:before;
  if(!selfDraw)round.hands['seat-1'].push(winning);
  for(const id of round.playerOrder)if(id!==winner)while(round.hands[id].length<(id==='seat-1'&&!selfDraw?14:13)){
   const at=pool.findIndex(tile=>analysis.isMcrStructureTile(tile.face)&&tile.face!==winning.face);
   assert.ok(at>=0);round.hands[id].push(pool.splice(at,1)[0]);
  }
  round.wall=pool;round.discardPile=[];round.activePlayerId='seat-1';round.phase='discard';round.turnSource='wall';round.drewThisTurn=true;
  round.lastDrawnTileId=winning.id;round.pendingFlowerTileId=null;round.claimWindow=null;round.actionHistory=[];round.winResult=null;round.drawResult=null;
  return {session:{...original,round,opening:[]},winningId:winning.id};
 }
 function checkInventory(session){
  const round=session.round,tiles=[...round.wall,...round.discardPile,...Object.values(round.hands).flat(),...Object.values(round.melds).flat().flatMap(meld=>meld.tiles),...Object.values(round.flowers).flat()];
  assert.equal(tiles.length,144);assert.equal(new Set(tiles.map(tile=>tile.id)).size,144);
 }
 function step(session,seat,type,predicate=()=>true){
  const original=JSON.stringify(session),choice=mcrSessionView(session,seat).choices.find(item=>item.type===type&&predicate(item));
  assert.ok(choice,`${type} seat ${seat}`);
  const next=actMcrSession(session,seat,session.revision,choice.index);
  assert.equal(JSON.stringify(session),original,'previous state immutable');assert.equal(next.revision,session.revision+1);checkInventory(next);
  return next;
 }
 let cases=0;
 for(let openSuit=0;openSuit<3;openSuit++)for(let waitSuit=0;waitSuit<3;waitSuit++)if(waitSuit!==openSuit)for(const pattern of patterns)for(const selfDraw of [false,true]){
  const label=JSON.stringify({openSuit,waitSuit,name:pattern.name,selfDraw}),fixture=makeFixture(openSuit,waitSuit,pattern,selfDraw);
  let session=fixture.session;checkInventory(session);
  if(selfDraw)session=step(session,0,'declare-self-draw');
  else{
   session=step(session,0,'discard',choice=>choice.tileIds.includes(fixture.winningId));
   session=step(session,1,'claim-discard',choice=>choice.claim==='win');
   for(const seat of [2,3])if(session.round.phase==='claim')session=step(session,seat,'pass-claim');
  }
  assert.equal(session.round.phase,'finished',label);
  const result=session.round.winResult,actual=result.analysis.fanCodes.filter(code=>waitCodes.has(code));
  assert.deepEqual(actual,pattern.fan?[`mcr-${pattern.fan}`]:[],`${label}: only a unique wait may score`);
  assert.ok(result.analysis.fanCodes.includes('mcr-28'),`${label}: declared Pure Straight keeps the hand above eight points`);
  const total=result.analysis.total,due=total+8;
  assert.deepEqual(Object.values(result.settlement.deltas),selfDraw?[3*due,-due,-due,-due]:[-due,total+24,-8,-8],`${label}: four-seat payment`);
  cases++;
 }
 console.log(`PASS: ${cases} actual session endings across six open/wait suit assignments, eleven unique/multiple-wait shapes and both win sources; 144 physical tiles, immutable steps, precise wait fans and four-seat payment.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
