// WMO/EMA Greenbook 2021 fan 3 permits only bamboo 2/3/4/6/8 and Green
// Dragon, but may combine with Full/Half Flush, Pure Shifted Pungs or 7 Pairs.
// https://mahjongclublausanne.ch/wp-content/uploads/2024/03/Greenbook2021_Chinese-EN.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
(async()=>{
 const rules=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?rules:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](module,file):js(module,file);
 const {newMcrSession,mcrSessionView,actMcrSession}=require('../lib/mahjong/mcr-session.ts');
 const pung=face=>[face,face,face];
 const cases=[
  {name:'green dragon and three shifted bamboo pungs',groups:[pung('2s'),pung('3s'),pung('4s'),pung('F')],pair:'6s',expected:{'03':88,'24':24,'50':6,'59':2},allPungs:true},
  {name:'bamboo-only green pungs',groups:[pung('2s'),pung('3s'),pung('4s'),pung('6s')],pair:'8s',expected:{'03':88,'22':24,'24':24},allPungs:true},
  {name:'green chow and three pungs',groups:[['2s','3s','4s'],pung('2s'),pung('6s'),pung('8s')],pair:'F',expected:{'03':88,'50':6},absent:['49']},
  {name:'wrong bamboo pair',groups:[pung('2s'),pung('3s'),pung('4s'),pung('F')],pair:'5s',expected:{'24':24,'50':6},absent:['03'],allPungs:true},
  {name:'wrong red dragon pung',groups:[pung('2s'),pung('3s'),pung('4s'),pung('C')],pair:'6s',expected:{'24':24,'50':6},absent:['03'],allPungs:true},
  {name:'green seven pairs absorbs tile hog',faces:[...Array(4).fill('2s'),...['3s','4s','6s','8s','F'].flatMap(face=>[face,face])],winFaces:['F','2s'],expected:{'03':88,'19':24,'50':6},absent:['49','64'],closedOnly:true},
  {name:'seven pairs with wrong dragon',faces:[...Array(4).fill('2s'),...['3s','4s','6s','8s','C'].flatMap(face=>[face,face])],winFaces:['C','2s'],expected:{'19':24,'50':6,'64':2},absent:['03'],closedOnly:true},
 ];
 function fixture(spec,winningFace,selfDraw,declared){
  const original=newMcrSession(83),round=structuredClone(original.round),pool=[...analysis.createMcrTileSet()],winner=selfDraw?'seat-1':'seat-2';
  const take=face=>{const at=pool.findIndex(tile=>tile.face===face);assert.ok(at>=0,`missing ${face}`);return pool.splice(at,1)[0];};
  const complete=(spec.faces??[...spec.groups.flat(),spec.pair,spec.pair]).map(take);
  const declaredTiles=declared?complete.splice(9,3):[];
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
 for(const spec of cases)for(const winningFace of spec.winFaces??[spec.pair,spec.groups[0][0]])for(const selfDraw of [false,true])for(const declared of spec.closedOnly?[false]:[false,true]){
  const label=JSON.stringify({name:spec.name,winningFace,selfDraw,declared}),test=fixture(spec,winningFace,selfDraw,declared);let session=test.session;inventory(session);
  if(selfDraw)session=step(session,0,'declare-self-draw');
  else{
   session=step(session,0,'discard',choice=>choice.tileIds.includes(test.winningId));
   session=step(session,1,'claim-discard',choice=>choice.claim==='win');
   for(const seat of [2,3])if(session.round.phase==='claim')session=step(session,seat,'pass-claim');
  }
  assert.equal(session.round.phase,'finished',label);const result=session.round.winResult;
  for(const [number,points] of Object.entries(spec.expected))assert.equal(result.analysis.occurrences.filter(item=>item.fanCode===`mcr-${number}`).reduce((sum,item)=>sum+item.points,0),points,`${label}: fan ${number}`);
  for(const number of spec.absent??[])assert.ok(!result.analysis.fanCodes.includes(`mcr-${number}`),`${label}: fan ${number} must be absent`);
  if(spec.allPungs){
   const fourConcealed=!declared&&(selfDraw||winningFace===spec.pair);
   assert.equal(result.analysis.fanCodes.includes('mcr-12'),fourConcealed,`${label}: concealed-pung completion`);
   assert.equal(result.analysis.fanCodes.includes('mcr-49'),!fourConcealed,`${label}: All Pungs is independent except when Four Concealed Pungs absorbs it`);
   if(fourConcealed)assert.ok(result.analysis.exclusions.some(item=>item.fanCode==='mcr-49'&&item.excludedBy.some(cause=>cause.fanCode==='mcr-12')),`${label}: explain absorbed All Pungs`);
  }
  const total=result.analysis.total,due=total+8;
  assert.deepEqual(Object.values(result.settlement.deltas),selfDraw?[3*due,-due,-due,-due]:[-due,total+24,-8,-8],`${label}: four-seat payment`);
  count++;
 }
 console.log(`PASS: ${count} green/near-green authored session endings with pungs, chows, seven pairs, one exposed group, exact positive/negative fans and four-seat payments.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
