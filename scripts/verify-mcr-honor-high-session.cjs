// WMO/EMA Greenbook 2021 appendix 1: big/little winds and dragons plus pure
// terminal/honor and mixed terminal/honor hands; exclusions and extra groups.
// https://mahjongclublausanne.ch/wp-content/uploads/2024/03/Greenbook2021_Chinese-EN.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
(async()=>{
 const rules=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?rules:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](module,file):js(module,file);
 const {newMcrSession,mcrSessionView,actMcrSession}=require('../lib/mahjong/mcr-session.ts');
 const cases=[
  {name:'four winds with honor pair',groups:['E','S','W','N'],pair:'C',points:{'01':88,'11':64},absent:['02','09','38','49','60','61','73'],absorbed:{'38':'01','49':'01','60':'01','61':'01','73':'01'}},
  {name:'four winds with suit pair',groups:['E','S','W','N'],pair:'1m',points:{'01':88,'50':6},absent:['02','09','11','38','49','60','61','73'],absorbed:{'38':'01','49':'01','60':'01','61':'01','73':'01'}},
  {name:'three dragons and independent round wind',groups:['C','F','P','E'],pair:'N',points:{'02':88,'11':64,'60':2},absent:['01','10','54','59'],absorbed:{'54':'02','59':'02'}},
  {name:'three dragons with suit pair',groups:['C','F','P','E'],pair:'1m',points:{'02':88,'50':6,'60':2},absent:['01','10','11','54','59'],absorbed:{'54':'02','59':'02'}},
  {name:'little four winds and independent dragon',groups:['E','S','W','C'],pair:'N',points:{'09':64,'11':64,'59':2},absent:['01','02','38','73'],absorbed:{'38':'09','73':'09'}},
  {name:'little three dragons and independent terminal',groups:['C','F','1m','2m'],pair:'P',points:{'10':64,'73':1},absent:['02','09','54','59'],absorbed:{'54':'10','59':'10'}},
  {name:'little three dragons with honor groups',groups:['C','F','E','S'],pair:'P',points:{'10':64,'11':64},absent:['01','02','54','59'],absorbed:{'54':'10','59':'10'}},
  {name:'three winds without fourth wind pair',groups:['E','S','W','C'],pair:'1m',points:{'38':12,'59':2},absent:['01','09','11']},
  {name:'two dragons without dragon pair',groups:['C','F','1m','2m'],pair:'3m',points:{'54':6},absent:['02','10','59']},
  {name:'all terminals with two double pungs',groups:['1m','9m','1p','9p'],pair:'1s',points:{'08':64,'65':4},absent:['11','18','49','55','73','76'],absorbed:{'49':'08','55':'08','73':'08','76':'08'}},
  {name:'all terminals with triple pung',groups:['1m','1p','1s','9m'],pair:'9p',points:{'08':64,'32':16},absent:['11','18','49','55','73','76'],absorbed:{'49':'08','55':'08','73':'08','76':'08'}},
  {name:'all honors with double dragon pung',groups:['E','S','C','F'],pair:'N',points:{'11':64,'54':6},absent:['08','18','49','55','59','73'],absorbed:{'49':'11','55':'11','73':'11'}},
  {name:'mixed terminals and honors with all types',groups:['1m','1p','E','C'],pair:'9s',points:{'18':32,'52':6,'65':2,'59':2},absent:['08','11','49','55','73'],absorbed:{'49':'18','55':'18','73':'18'}},
  {name:'all terminals broken by middle pair',groups:['1m','9m','1p','9p'],pair:'2s',points:{'65':4},absent:['08','11','18']},
  {name:'all honors downgraded to mixed by terminal pair',groups:['E','S','C','F'],pair:'1m',points:{'18':32,'54':6},absent:['08','11']},
  {name:'mixed terminals broken by middle pung',groups:['2m','1p','E','C'],pair:'9s',points:{'52':6,'59':2},absent:['08','11','18']},
 ];
 function fixture(spec,winningFace,selfDraw,declared){
  const original=newMcrSession(81),round=structuredClone(original.round),pool=[...analysis.createMcrTileSet()],winner=selfDraw?'seat-1':'seat-2';
  const take=face=>{const at=pool.findIndex(tile=>tile.face===face);assert.ok(at>=0,`missing ${face}`);return pool.splice(at,1)[0];};
  const complete=[...spec.groups.flatMap(face=>[face,face,face]),spec.pair,spec.pair].map(take);
  const declaredTiles=declared?complete.splice(9,3):[];
  const winningAt=complete.findIndex(tile=>tile.face===winningFace);
  assert.ok(winningAt>=0);const [winning]=complete.splice(winningAt,1);
  round.hands=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.melds=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.flowers=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  if(declared)round.melds[winner]=[{kind:'pung',exposure:'melded',tiles:declaredTiles,claimedTileId:declaredTiles[0].id,fromPlayerId:'seat-3'}];
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
 for(const spec of cases)for(const winningFace of [spec.pair,spec.groups[0]])for(const selfDraw of [false,true])for(const declared of [false,true]){
  const label=JSON.stringify({name:spec.name,winningFace,selfDraw,declared}),test=fixture(spec,winningFace,selfDraw,declared);let session=test.session;inventory(session);
  if(selfDraw)session=step(session,0,'declare-self-draw');
  else{
   session=step(session,0,'discard',choice=>choice.tileIds.includes(test.winningId));
   session=step(session,1,'claim-discard',choice=>choice.claim==='win');
   for(const seat of [2,3])if(session.round.phase==='claim')session=step(session,seat,'pass-claim');
  }
  assert.equal(session.round.phase,'finished',label);const result=session.round.winResult;
  for(const [number,points] of Object.entries(spec.points))assert.equal(result.analysis.occurrences.filter(item=>item.fanCode===`mcr-${number}`).reduce((sum,item)=>sum+item.points,0),points,`${label}: fan ${number}`);
  for(const number of spec.absent)assert.ok(!result.analysis.fanCodes.includes(`mcr-${number}`),`${label}: fan ${number} must be absent`);
  for(const [number,higher] of Object.entries(spec.absorbed??{}))assert.ok(result.analysis.exclusions.some(item=>item.fanCode===`mcr-${number}`&&item.excludedBy.some(cause=>cause.fanCode===`mcr-${higher}`)),`${label}: fan ${number} absorbed by ${higher} needs a reason`);
  const total=result.analysis.total,due=total+8;
  assert.deepEqual(Object.values(result.settlement.deltas),selfDraw?[3*due,-due,-due,-due]:[-due,total+24,-8,-8],`${label}: four-seat payment`);
  count++;
 }
 console.log(`PASS: ${count} real big/little wind/dragon terminal sessions, high/lower fan exclusions, independent wind/dragon/terminal additions, 144-tile conservation, revision and four-seat payment.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
