// MCR fan/settlement results must not depend on the order in which otherwise
// identical declared melds or concealed tiles are supplied to the scorer.
// This is a metamorphic check, not an independent oracle for all 81 fans.
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
(async()=>{
 const rules=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?rules:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](module,file):js(module,file);
 const {scoreMcrHand,mcrTileFace}=require('../lib/mahjong/mcr-score.ts');
 const {newMcrSession,mcrSessionView,actMcrSession}=require('../lib/mahjong/mcr-session.ts');
 let seed=0x4d43524f;
 const rand=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
 const choices=[];
 for(let tile=0;tile<34;tile++)choices.push({kind:'pung',tiles:[tile,tile,tile],open:true});
 for(let suit=0;suit<3;suit++)for(let start=0;start<7;start++)choices.push({kind:'chow',tiles:[suit*9+start,suit*9+start+1,suit*9+start+2],open:true});
 function randomGroups(){
  const used=new Array(34).fill(0),groups=[];
  for(let i=0;i<4;i++){
   let found=false;
   for(let attempt=0;attempt<300;attempt++){
    const candidate=choices[rand(choices.length)];
    if(candidate.tiles.some(tile=>used[tile]+candidate.tiles.filter(value=>value===tile).length>4))continue;
    groups.push(candidate);for(const tile of candidate.tiles)used[tile]++;found=true;break;
   }
   assert.ok(found,'legal group available');
  }
  const pair=used.flatMap((count,tile)=>count<=2?[tile]:[]);
  return {groups,pair:pair[rand(pair.length)]};
 }
 function permutations(items){
  if(items.length<2)return [items];
  return items.flatMap((item,index)=>permutations(items.filter((_,i)=>i!==index)).map(rest=>[item,...rest]));
 }
 function comparable(result){
  if(!result.ok)return {ok:false,reason:result.reason};
  return {ok:true,nonFlowerTotal:result.analysis.nonFlowerTotal,flowerPoints:result.analysis.flowerPoints,total:result.analysis.total,
   occurrences:result.analysis.occurrences.map(item=>[item.fanCode,item.points]).sort((a,b)=>a[0].localeCompare(b[0])||a[1]-b[1]),delta:result.settlement.delta};
 }
 const fixtures=[
  {groups:Array.from({length:4},()=>({kind:'chow',tiles:[0,1,2],open:true})),pair:31},
  {groups:[0,1,2,3].map(tile=>({kind:'pung',tiles:[tile,tile,tile],open:true})),pair:31},
  {groups:[{kind:'chow',tiles:[0,1,2],open:true},{kind:'chow',tiles:[3,4,5],open:true},{kind:'chow',tiles:[6,7,8],open:true},{kind:'pung',tiles:[9,9,9],open:true}],pair:31},
 ];
 let hands=0,variants=0,eligible=0,belowMinimum=0;
 for(let declaredCount=2;declaredCount<=4;declaredCount++)for(let trial=0;trial<24;trial++)for(const selfDraw of [false,true]){
  const {groups,pair}=trial<fixtures.length?fixtures[trial]:randomGroups();
  const melds=groups.slice(0,declaredCount),concealed=[...groups.slice(declaredCount).flatMap(group=>group.tiles),pair,pair];
  const winningTile=concealed.splice(rand(concealed.length),1)[0];
  const context={winningTile,winner:selfDraw?0:1,from:0,roundWind:trial%4,seatWind:(trial+1)%4,source:selfDraw?'wall':'discard',flowers:[],lastWallEvent:false,lastCopy:false};
  const expected=comparable(scoreMcrHand({...context,melds,concealedBeforeWin:concealed}));
  const label=JSON.stringify({declaredCount,trial,selfDraw,groups,pair,winningTile});
  for(const [index,orderedMelds] of permutations(melds).entries()){
   const orderedConcealed=index%2?[...concealed].reverse():[...concealed];
   const actual=comparable(scoreMcrHand({...context,melds:orderedMelds,concealedBeforeWin:orderedConcealed}));
   assert.deepEqual(actual,expected,label+': permutation '+index);
   variants++;
  }
  if(expected.ok)eligible++;else belowMinimum++;
  hands++;
 }
 assert.ok(eligible>0&&belowMinimum>0,'both eligible and below-minimum hands sampled');
 function sessionFor(input,selfDraw){
  const original=newMcrSession(131),round=structuredClone(original.round),pool=[...analysis.createMcrTileSet()],winner=selfDraw?'seat-1':'seat-2';
  const take=kind=>{const face=mcrTileFace(kind),index=pool.findIndex(tile=>tile.face===face);assert.ok(index>=0,'physical tile '+face);return pool.splice(index,1)[0];};
  const declared=input.melds.map(meld=>meld.tiles.map(take)),concealed=input.concealedBeforeWin.map(take),winning=take(input.winningTile);
  round.hands=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.melds=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.flowers=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.melds[winner]=declared.map((tiles,index)=>({kind:input.melds[index].kind,exposure:'melded',tiles,claimedTileId:tiles[0].id,fromPlayerId:'seat-3'}));
  round.hands[winner]=selfDraw?[...concealed,winning]:concealed;
  if(!selfDraw)round.hands['seat-1'].push(winning);
  for(const id of round.playerOrder)if(id!==winner)while(round.hands[id].length<(id==='seat-1'&&!selfDraw?14:13)){
   const index=pool.findIndex(tile=>analysis.isMcrStructureTile(tile.face)&&tile.face!==winning.face);assert.ok(index>=0);round.hands[id].push(pool.splice(index,1)[0]);
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
 let endings=0;
 for(const {groups,pair} of fixtures)for(let declaredCount=2;declaredCount<=4;declaredCount++)for(const selfDraw of [false,true]){
  const melds=groups.slice(0,declaredCount),concealedBeforeWin=[...groups.slice(declaredCount).flatMap(group=>group.tiles),pair];
  let baseline;
  for(const orderedMelds of permutations(melds)){
   const input={melds:orderedMelds,concealedBeforeWin,winningTile:pair};
   const expected=scoreMcrHand({...input,winner:selfDraw?0:1,from:0,roundWind:0,seatWind:selfDraw?0:1,source:selfDraw?'wall':'discard',flowers:[],lastWallEvent:false,lastCopy:false});
   assert.ok(expected.ok,'fixed high-fan hand must be eligible');
   const test=sessionFor(input,selfDraw);let session=test.session;inventory(session);
   if(selfDraw)session=step(session,0,'declare-self-draw');
   else{session=step(session,0,'discard',choice=>choice.tileIds.includes(test.winningId));session=step(session,1,'claim-discard',choice=>choice.claim==='win');for(const seat of [2,3])if(session.round.phase==='claim')session=step(session,seat,'pass-claim');}
   assert.equal(session.round.phase,'finished');
   const result=comparable({ok:true,analysis:session.round.winResult.analysis,settlement:{delta:Object.values(session.round.winResult.settlement.deltas)}});
   assert.deepEqual(result,comparable(expected),'actual action settlement agrees with direct scorer');
   if(baseline)assert.deepEqual(result,baseline,'action ending must not depend on declared meld order');
   else baseline=result;
   endings++;
  }
 }
 console.log('PASS: '+hands+' completed hands / '+variants+' direct meld-order variants and '+endings+' actual session endings preserve MCR fan occurrences and four-seat settlement; eligible='+eligible+', belowMinimum='+belowMinimum+'.');
})().catch(error=>{console.error(error);process.exitCode=1;});
