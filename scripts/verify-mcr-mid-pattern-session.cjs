// WMO/EMA Greenbook 2021 fans 23, 24, 30, 39, 41, 42 and 51.
// Authored mid-round wins exercise the session choice/settlement boundary.
// https://mahjongclublausanne.ch/wp-content/uploads/2024/03/Greenbook2021_Chinese-EN.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
(async()=>{
 const rules=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?rules:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](module,file):js(module,file);
 const {newMcrSession,mcrSessionView,actMcrSession}=require('../lib/mahjong/mcr-session.ts');
 const chow=(rank,suit)=>[rank,rank+1,rank+2].map(n=>`${n}${suit}`),pung=(rank,suit)=>Array(3).fill(`${rank}${suit}`);
 const suits=['m','p','s'];
 const pureTripleChowCases=suits.flatMap((suit,index)=>[1,2,3,4,5,6,7].map(start=>({
  name:`pure triple chow ${suit} start ${start}`,code:23,points:24,
  groups:[chow(1,suits[(index+1)%3]),chow(start,suit),chow(start,suit),chow(start,suit)],
  pair:`5${suits[(index+2)%3]}`,absent:[14,69],
 })));
 const pureShiftedCases=suits.flatMap((suit,index)=>[1,2].map(step=>({
  name:`pure shifted chows ${suit} step ${step}`,code:30,points:16,
  groups:[chow(1,suit),chow(1+step,suit),chow(1+2*step,suit),chow(7,suits[(index+1)%3])],
  pair:`5${suits[(index+2)%3]}`,absent:[16],
 })));
 const suitOrders=suits.flatMap(first=>suits.filter(second=>second!==first).map(second=>[first,second,suits.find(third=>third!==first&&third!==second)]));
 const mixedShiftedCases=suitOrders.flatMap(([first,second,third])=>[1,2,3,4,5].map(start=>({
  name:`mixed shifted chows ${first}${second}${third} start ${start}`,code:51,points:6,
  groups:[chow(start,first),chow(start+1,second),chow(start+2,third),chow(7,first)],
  pair:`5${second}`,absent:[],
 })));
 const alternativeMixedCases=suitOrders.map(([first,second,third])=>({
  name:`mixed shifted chows via fourth group ${first}${second}${third}`,code:51,points:6,
  groups:[chow(3,first),chow(5,second),chow(6,third),chow(7,first)],
  pair:`5${second}`,absent:[],
 }));
 const mixedStraightCases=suitOrders.flatMap(([first,second,third])=>[
  {name:`mixed straight ${first}${second}${third}`,code:39,points:8,
   groups:[chow(1,first),chow(4,second),chow(7,third),chow(2,first)],pair:`5${second}`,absent:[]},
  {name:`mixed straight via fourth group ${first}${second}${third}`,code:39,points:8,
   groups:[chow(1,first),chow(4,second),chow(6,third),chow(7,third)],pair:`5${second}`,absent:[]},
 ]);
 const mixedShiftedPungCases=suitOrders.flatMap(([first,second,third])=>[1,2,3,4,5,6,7].map(start=>({
  name:`mixed shifted pungs ${first}${second}${third} start ${start}`,code:42,points:8,
  groups:[pung(start,first),pung(start+1,second),pung(start+2,third),pung('C','')],
  pair:'N',absent:[],
 })));
 const mixedTripleChowCases=suitOrders.flatMap(([first,second,third])=>[1,2,3,4,5,6,7].map(start=>({
  name:`mixed triple chow ${first}${second}${third} start ${start}`,code:41,points:8,
  groups:[chow(start,first),chow(start,second),chow(start,third),chow(7,first)],
  pair:`5${second}`,absent:[70],
 })));
 const cases=[
  ...pureTripleChowCases,
  {name:'pure shifted pungs',code:24,points:24,groups:[pung(2,'m'),pung(3,'m'),pung(4,'m'),pung(9,'p')],pair:'N',absent:[15,23]},
  ...pureShiftedCases,
  ...mixedStraightCases,
  ...mixedTripleChowCases,
  ...mixedShiftedPungCases,
  ...mixedShiftedCases,
  ...alternativeMixedCases,
  {name:'mixed shifted chows with independent dragon pung',code:51,points:6,groups:[chow(1,'m'),chow(2,'p'),chow(3,'s'),pung('C','')],pair:'5p',absent:[]},
 ];
 function fixture(spec,winningFace,selfDraw,declared){
  const original=newMcrSession(93),round=structuredClone(original.round),pool=[...analysis.createMcrTileSet()],winner=selfDraw?'seat-1':'seat-2';
  const take=face=>{const at=pool.findIndex(tile=>tile.face===face);assert.ok(at>=0,`missing ${face}`);return pool.splice(at,1)[0];};
  const complete=[...spec.groups.flat(),spec.pair,spec.pair].map(take),declaredTiles=declared?complete.splice(9,3):[];
  const winningAt=complete.findIndex(tile=>tile.face===winningFace);assert.ok(winningAt>=0);const [winning]=complete.splice(winningAt,1);
  round.hands=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.melds=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.flowers=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  if(declared)round.melds[winner]=[{kind:spec.groups[3][0]===spec.groups[3][1]?'pung':'chow',exposure:'melded',tiles:declaredTiles,claimedTileId:declaredTiles[0].id,fromPlayerId:'seat-3'}];
  round.hands[winner]=selfDraw?[...complete,winning]:complete;
  if(!selfDraw)round.hands['seat-1'].push(winning);
  for(const id of round.playerOrder)if(id!==winner)while(round.hands[id].length<(id==='seat-1'&&!selfDraw?14:13)){
   const at=pool.findIndex(tile=>analysis.isMcrStructureTile(tile.face)&&tile.face!==winning.face);assert.ok(at>=0);round.hands[id].push(pool.splice(at,1)[0]);
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
  const before=JSON.stringify(session),choice=mcrSessionView(session,seat).choices.find(item=>item.type===type&&predicate(item));assert.ok(choice,`${type} seat ${seat}`);
  const next=actMcrSession(session,seat,session.revision,choice.index);assert.equal(JSON.stringify(session),before);assert.equal(next.revision,session.revision+1);inventory(next);return next;
 }
 let count=0;
 for(const spec of cases)for(const winningFace of [spec.pair,spec.groups[0][0]])for(const selfDraw of [false,true])for(const declared of [false,true]){
  const label=JSON.stringify({name:spec.name,winningFace,selfDraw,declared}),test=fixture(spec,winningFace,selfDraw,declared);let session=test.session;inventory(session);
  if(selfDraw)session=step(session,0,'declare-self-draw');
  else{session=step(session,0,'discard',choice=>choice.tileIds.includes(test.winningId));session=step(session,1,'claim-discard',choice=>choice.claim==='win');for(const seat of [2,3])if(session.round.phase==='claim')session=step(session,seat,'pass-claim');}
  assert.equal(session.round.phase,'finished',label);const result=session.round.winResult;
  const expectedCode=spec.code===23&&!declared?24:spec.code;
  assert.equal(result.analysis.occurrences.filter(item=>item.fanCode===`mcr-${expectedCode}`).reduce((sum,item)=>sum+item.points,0),spec.points,`${label}: selected decomposition; fans ${JSON.stringify(result.analysis.fanCodes)}`);
  if(spec.code===23){
   assert.ok(!result.analysis.fanCodes.includes(`mcr-${declared?24:23}`),`${label}: incompatible alternative decomposition`);
   if(!declared)assert.ok(result.analysis.exclusions.some(item=>item.fanCode==='mcr-23'&&item.excludedBy.some(cause=>cause.fanCode==='mcr-24')),`${label}: explain why the alternative three identical chows do not score; ${JSON.stringify(result.analysis.exclusions)}`);
  }
  for(const number of spec.absent)assert.ok(!result.analysis.fanCodes.includes(`mcr-${number}`),`${label}: incompatible fan ${number}`);
  if(spec.name==='mixed shifted chows with independent dragon pung'){
   assert.equal(result.analysis.occurrences.filter(item=>item.fanCode==='mcr-59').reduce((sum,item)=>sum+item.points,0),2,`${label}: unrelated dragon pung must independently count`);
   assert.ok(result.analysis.total>=8,`${label}: valid minimum must be reached without counting flowers`);
  }
  if(spec.code===42){
   assert.equal(result.analysis.occurrences.filter(item=>item.fanCode==='mcr-52').reduce((sum,item)=>sum+item.points,0),6,`${label}: wind pair plus dragon pung and three suits must independently score all types`);
   assert.equal(result.analysis.occurrences.filter(item=>item.fanCode==='mcr-59').reduce((sum,item)=>sum+item.points,0),2,`${label}: independent dragon pung`);
  }
  const total=result.analysis.total,due=total+8;assert.deepEqual(Object.values(result.settlement.deltas),selfDraw?[3*due,-due,-due,-due]:[-due,total+24,-8,-8],`${label}: four-seat payment`);
  count++;
 }
 const brokenCases=[
  ...suits.flatMap((suit,index)=>[1,2,3,4,5,6].map(start=>({
   name:`broken pure triple chow ${suit} ${start}-${start}-${start+1}`,
   groups:[chow(1,suits[(index+1)%3]),chow(start,suit),chow(start,suit),chow(start+1,suit)],
   pair:`5${suits[(index+2)%3]}`,absent:23,
  }))),
  ...suitOrders.flatMap(([first,second,third])=>[1,2,3,4,5].map(start=>({
   name:`broken mixed triple chow ${first}${second}${third} start ${start}`,
   groups:[chow(start,first),chow(start,second),chow(start+1,third),chow(7,first)],
   pair:`5${second}`,absent:41,
  }))),
  ...suitOrders.flatMap(([first,second,third])=>[1,2,3,4,5,6].flatMap(start=>[[start,start+1,start+3],[start,start+2,start+3]].map(ranks=>({
   name:`broken mixed shifted pungs ${first}${second}${third} ${ranks.join('-')}`,
   groups:[pung(ranks[0],first),pung(ranks[1],second),pung(ranks[2],third),pung('C','')],
   pair:'N',absent:42,
  })))),
  ...suitOrders.map(([first,second,third])=>({
   name:`broken mixed straight ${first}${second}${third}`,
   groups:[chow(1,first),chow(4,second),chow(6,third),chow(2,first)],
   pair:`5${second}`,absent:39,
  })),
  {name:'broken mixed shifted chows with dragon pung',groups:[chow(1,'m'),chow(2,'p'),chow(4,'s'),pung('C','')],pair:'5p',absent:51},
  ...suitOrders.flatMap(([first,second,third])=>[1,2,3,4].flatMap(start=>[[start,start+1,start+3],[start,start+2,start+3]].filter(starts=>starts.join('-')!=='3-5-6').map(starts=>({
   name:`broken mixed shifted chows ${first}${second}${third} ${starts.join('-')}`,
   groups:[chow(starts[0],first),chow(starts[1],second),chow(starts[2],third),chow(7,first)],
   pair:`5${second}`,absent:51,
  })))),
  ...suits.flatMap((suit,index)=>[[1,2,4],[1,3,4]].map(starts=>({
   name:`broken pure shifted chows ${suit} ${starts.join('-')}`,
   groups:[...starts.map(rank=>chow(rank,suit)),chow(7,suits[(index+1)%3])],
   pair:`5${suits[(index+2)%3]}`,absent:30,
  }))),
 ];
 let rejected=0,validWithoutShift=0,pureRejected=0,pureValidWithoutShift=0,straightRejected=0,shiftedPungLegal=0,tripleRejected=0,tripleLegalWithoutTarget=0;
 for(const broken of brokenCases)for(const winningFace of [broken.pair,broken.groups[0][0]])for(const selfDraw of [false,true])for(const declared of [false,true]){
  const label=JSON.stringify({name:broken.name,winningFace,selfDraw,declared}),test=fixture(broken,winningFace,selfDraw,declared);let session=test.session;inventory(session);
  if(selfDraw){
   const available=mcrSessionView(session,0).choices.some(choice=>choice.type==='declare-self-draw');
   if(available)session=step(session,0,'declare-self-draw');
   else{rejected++;if(broken.absent===30)pureRejected++;if(broken.absent===39)straightRejected++;if(broken.absent===23)tripleRejected++;}
  }else{
   session=step(session,0,'discard',choice=>choice.tileIds.includes(test.winningId));
   const available=mcrSessionView(session,1).choices.some(choice=>choice.type==='claim-discard'&&choice.claim==='win');
   if(available){session=step(session,1,'claim-discard',choice=>choice.claim==='win');for(const seat of [2,3])if(session.round.phase==='claim')session=step(session,seat,'pass-claim');}
   else{rejected++;if(broken.absent===30)pureRejected++;if(broken.absent===39)straightRejected++;if(broken.absent===23)tripleRejected++;}
  }
  if(session.round.winResult){
   const result=session.round.winResult;assert.ok(result.analysis.nonFlowerTotal>=8,`${label}: another fan must independently reach the win gate`);
   assert.ok(!result.analysis.fanCodes.includes(`mcr-${broken.absent}`),`${label}: broken structure must not score its target fan`);
   assert.notEqual(broken.absent,39,`${label}: incomplete mixed straight must not reach eight points`);
   if(broken.absent===42){
    assert.equal(result.analysis.occurrences.filter(item=>item.fanCode==='mcr-52').reduce((sum,item)=>sum+item.points,0),6,`${label}: all types still scores without shifted pungs`);
    assert.equal(result.analysis.occurrences.filter(item=>item.fanCode==='mcr-59').reduce((sum,item)=>sum+item.points,0),2,`${label}: dragon pung still scores`);
    shiftedPungLegal++;
   }
   if(broken.absent===23)tripleLegalWithoutTarget++;
   if(broken.absent===30){assert.ok(selfDraw&&!declared&&winningFace===broken.pair,`${label}: unexpected pure-shift alternative win`);pureValidWithoutShift++;}
   const total=result.analysis.total,due=total+8;assert.deepEqual(Object.values(result.settlement.deltas),selfDraw?[3*due,-due,-due,-due]:[-due,total+24,-8,-8],`${label}: alternative-fan payment`);
   validWithoutShift++;
  }
 }
 assert.equal(pureValidWithoutShift,6,'only the six concealed self-draw pure-shift counterexamples reach eight points through other fans');
 assert.equal(pureRejected,42,'the other pure-shift counterexamples must fail the eight-point gate');
 assert.equal(straightRejected,48,'all six incomplete mixed-straight suit orders must fail in both win methods and declaration states');
 assert.equal(shiftedPungLegal,576,'all nonconsecutive mixed-pung hands can still legally win without fan 42');
 assert.equal(tripleRejected+tripleLegalWithoutTarget,144,'all broken pure-triple-chow counterexamples were classified');
 console.log(`PASS: ${count} mid-value session endings, ${rejected} negative-case win-gate denials and ${validWithoutShift} legal wins without their targeted fan (${tripleRejected} rejected / ${tripleLegalWithoutTarget} legal but no pure triple chow in new cases); exact fans, inventory, immutable revisions and four-seat payments.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
