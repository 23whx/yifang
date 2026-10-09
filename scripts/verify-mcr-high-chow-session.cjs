// WMO/EMA Greenbook 2021 fans 13, 14 and 16: high-valued chow structures
// and their explicitly absorbed lower structures/decomposition alternatives.
// https://mahjongclublausanne.ch/wp-content/uploads/2024/03/Greenbook2021_Chinese-EN.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
(async()=>{
 const rules=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?rules:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](module,file):js(module,file);
 const {newMcrSession,mcrSessionView,actMcrSession}=require('../lib/mahjong/mcr-session.ts');
 const chow=start=>[start,start+1,start+2].map(rank=>`${rank}m`);
 const cases=[
  {name:'pure terminal chows',groups:[chow(1),chow(1),chow(7),chow(7)],pair:'5m',points:{'13':64},absent:['14','16','19','22','63','69','72'],absorbed:{'19':'13','22':'13','63':'13','69':'13','72':'13'}},
  {name:'quadruple chow',groups:[chow(1),chow(1),chow(1),chow(1)],pair:'5p',points:{'14':48,'63':2},absent:['13','16','23','24','64','69'],absorbed:{'23':'14','24':'14','64':'14','69':'14'}},
  {name:'four shifted chows by one',groups:[chow(2),chow(3),chow(4),chow(5)],pair:'8p',points:{'16':32,'63':2,'68':2,'75':1},absent:['13','14','30','71','72']},
  {name:'four shifted chows by two',groups:[chow(1),chow(3),chow(5),chow(7)],pair:'5p',points:{'16':32,'63':2,'75':1},absent:['13','14','30','71','72'],absorbed:{'72':'16'}},
  {name:'terminal chows broken by one changed chow',groups:[chow(1),chow(2),chow(7),chow(7)],pair:'5m',points:{'22':24},absent:['13','14','16']},
  {name:'quadruple chow broken with two lower decompositions',groups:[chow(1),chow(1),chow(1),chow(2)],pair:'5p',points:{},oneOf:['23','24'],absent:['13','14']},
  {name:'four shifted chows broken at final step',groups:[chow(2),chow(3),chow(4),chow(6)],pair:'8p',points:{'30':16,'63':2,'68':2},absent:['13','14','16']},
 ];
 function fixture(spec,winningFace,selfDraw,declared){
  const original=newMcrSession(89),round=structuredClone(original.round),pool=[...analysis.createMcrTileSet()],winner=selfDraw?'seat-1':'seat-2';
  const take=face=>{const at=pool.findIndex(tile=>tile.face===face);assert.ok(at>=0,`missing ${face}`);return pool.splice(at,1)[0];};
  const complete=[...spec.groups.flat(),spec.pair,spec.pair].map(take),declaredTiles=declared?complete.splice(9,3):[];
  const winningAt=complete.findIndex(tile=>tile.face===winningFace);assert.ok(winningAt>=0);const [winning]=complete.splice(winningAt,1);
  round.hands=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.melds=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.flowers=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  if(declared)round.melds[winner]=[{kind:'chow',exposure:'melded',tiles:declaredTiles,claimedTileId:declaredTiles[0].id,fromPlayerId:'seat-3'}];
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
  for(const [number,points] of Object.entries(spec.points))assert.equal(result.analysis.occurrences.filter(item=>item.fanCode===`mcr-${number}`).reduce((sum,item)=>sum+item.points,0),points,`${label}: fan ${number}`);
  if(spec.oneOf){
   const selected=spec.oneOf.filter(number=>result.analysis.fanCodes.includes(`mcr-${number}`));
   assert.equal(selected.length,1,`${label}: choose exactly one valid 24-point decomposition`);
   assert.equal(result.analysis.occurrences.filter(item=>item.fanCode===`mcr-${selected[0]}`).reduce((sum,item)=>sum+item.points,0),24,`${label}: chosen lower fan points`);
   assert.equal(result.analysis.fanCodes.includes('mcr-63'),selected[0]==='23',`${label}: All Chows depends on chosen decomposition`);
  }
  for(const number of spec.absent)assert.ok(!result.analysis.fanCodes.includes(`mcr-${number}`),`${label}: fan ${number} must be absent`);
  for(const [number,higher] of Object.entries(spec.absorbed??{})){
   if(number==='19'&&declared)continue; // An exposed chow makes Seven Pairs impossible.
   assert.ok(result.analysis.exclusions.some(item=>item.fanCode===`mcr-${number}`&&item.excludedBy.some(cause=>cause.fanCode===`mcr-${higher}`)),`${label}: fan ${number} absorbed by ${higher} needs a reason; ${JSON.stringify(result.analysis.exclusions)}`);
  }
  if(spec.points['13']&&declared)assert.ok(!result.analysis.exclusions.some(item=>item.fanCode==='mcr-19'),`${label}: an open chow cannot form Seven Pairs`);
  const total=result.analysis.total,due=total+8;
  assert.deepEqual(Object.values(result.settlement.deltas),selfDraw?[3*due,-due,-due,-due]:[-due,total+24,-8,-8],`${label}: four-seat payment`);
  count++;
 }
 console.log(`PASS: ${count} high-chow authored session endings with best decomposition, absorbed lower fans, unique physical tiles and exact four-seat settlement.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
