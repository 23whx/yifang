// WMO/EMA Greenbook 2021 fans 21, 25, 26, 27, 31, 36 and 37.
// Exercise actual middle-hand draw/discard/claim transitions, not only the scorer.
// https://mahjongclublausanne.ch/wp-content/uploads/2024/03/Greenbook2021_Chinese-EN.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
(async()=>{
 const rules=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?rules:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](module,file):js(module,file);
 const {newMcrSession,mcrSessionView,actMcrSession}=require('../lib/mahjong/mcr-session.ts');
 const pung=(rank,suit)=>Array(3).fill(`${rank}${suit}`),chow=(rank,suit)=>[rank,rank+1,rank+2].map(n=>`${n}${suit}`);
 const cases=[
  {name:'all even pungs',code:21,points:24,groups:[pung(2,'m'),pung(4,'p'),pung(6,'s'),pung(8,'m')],pair:'4s',absent:[49,68,76]},
  {name:'upper tiles',code:25,points:24,groups:[chow(7,'m'),chow(7,'p'),chow(7,'s'),pung(7,'m')],pair:'9p',absent:[36,76]},
  {name:'middle tiles',code:26,points:24,groups:[chow(4,'m'),chow(4,'p'),chow(4,'s'),pung(4,'m')],pair:'6p',absent:[68,76]},
  {name:'lower tiles',code:27,points:24,groups:[chow(1,'m'),chow(1,'p'),chow(1,'s'),pung(1,'m')],pair:'2p',absent:[37,76]},
  {name:'all fives',code:31,points:16,groups:[chow(3,'m'),chow(4,'p'),chow(5,'s'),pung(5,'m')],pair:'5p',absent:[68,76]},
  {name:'upper four',code:36,points:12,groups:[chow(6,'m'),chow(6,'p'),chow(7,'s'),pung(9,'m')],pair:'6p',absent:[25,76]},
  {name:'lower four',code:37,points:12,groups:[chow(1,'m'),chow(2,'p'),chow(2,'s'),pung(4,'m')],pair:'1p',absent:[27,76]},
 ];
 function fixture(spec,winningFace,selfDraw,declared){
  const original=newMcrSession(91),round=structuredClone(original.round),pool=[...analysis.createMcrTileSet()],winner=selfDraw?'seat-1':'seat-2';
  const take=face=>{const at=pool.findIndex(tile=>tile.face===face);assert.ok(at>=0,`missing ${face}`);return pool.splice(at,1)[0];};
  const complete=[...spec.groups.flat(),spec.pair,spec.pair].map(take),declaredTiles=declared?complete.splice(9,3):[];
  const winningAt=complete.findIndex(tile=>tile.face===winningFace);assert.ok(winningAt>=0);const [winning]=complete.splice(winningAt,1);
  round.hands=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.melds=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.flowers=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  if(declared)round.melds[winner]=[{kind:spec.groups[3][0]===spec.groups[3][1]?'pung':'chow',exposure:'melded',tiles:declaredTiles,claimedTileId:declaredTiles[0].id,fromPlayerId:'seat-3'}];
  round.hands[winner]=selfDraw?[...complete,winning]:complete;
  if(!selfDraw)round.hands['seat-1'].push(winning);
  for(const id of round.playerOrder)if(id!==winner)while(round.hands[id].length<(id==='seat-1'&&!selfDraw?14:13)){
   const at=pool.findIndex(tile=>analysis.isMcrStructureTile(tile.face)&&tile.face!==winning.face);
   assert.ok(at>=0);round.hands[id].push(pool.splice(at,1)[0]);
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
  const original=JSON.stringify(session),choice=mcrSessionView(session,seat).choices.find(item=>item.type===type&&predicate(item));
  assert.ok(choice,`${type} seat ${seat}`);
  const next=actMcrSession(session,seat,session.revision,choice.index);
  assert.equal(JSON.stringify(session),original,'previous state immutable');assert.equal(next.revision,session.revision+1);inventory(next);
  return next;
 }
 let count=0;
 for(const spec of cases)for(const winningFace of [spec.pair,spec.groups[0][0]])for(const selfDraw of [false,true])for(const declared of [false,true]){
  const label=JSON.stringify({name:spec.name,winningFace,selfDraw,declared}),test=fixture(spec,winningFace,selfDraw,declared);let session=test.session;inventory(session);
  if(selfDraw)session=step(session,0,'declare-self-draw');
  else{
   session=step(session,0,'discard',choice=>choice.tileIds.includes(test.winningId));
   session=step(session,1,'claim-discard',choice=>choice.claim==='win');
   for(const seat of [2,3])if(session.round.phase==='claim')session=step(session,seat,'pass-claim');
  }
  assert.equal(session.round.phase,'finished',label);const result=session.round.winResult;
  assert.equal(result.analysis.occurrences.filter(item=>item.fanCode===`mcr-${spec.code}`).reduce((sum,item)=>sum+item.points,0),spec.points,`${label}: primary rank fan`);
  for(const number of spec.absent)assert.ok(!result.analysis.fanCodes.includes(`mcr-${number}`),`${label}: absorbed/incompatible fan ${number}`);
  const total=result.analysis.total,due=total+8;
  assert.deepEqual(Object.values(result.settlement.deltas),selfDraw?[3*due,-due,-due,-due]:[-due,total+24,-8,-8],`${label}: four-seat payment`);
  count++;
 }
 console.log(`PASS: ${count} authored rank-family session endings with draw/discard claim, pair/group finish, open/closed hand, unique tile inventory and four-seat settlement.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
