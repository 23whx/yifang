// Reproducible end-to-end rule-engine sweep from genuine shuffled openings.
// This complements, but does not replace, authored rare-fan fixtures.
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
(async()=>{
 const roundsPerStyle=process.argv[2]===undefined?48:Number(process.argv[2]);
 assert.ok(Number.isInteger(roundsPerStyle)&&roundsPerStyle>=48&&roundsPerStyle<=1000,'rounds per style must be an integer from 48 to 1000');
 const rules=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?rules:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](module,file):js(module,file);
 const {newMcrSession,mcrSessionView,actMcrSession}=require('../lib/mahjong/mcr-session.ts');
 function inventory(session){
  const r=session.round,tiles=[...r.wall,...r.discardPile,...Object.values(r.hands).flat(),...Object.values(r.flowers).flat(),...Object.values(r.melds).flatMap(melds=>melds.flatMap(meld=>meld.tiles))];
  assert.equal(tiles.length,144,'all physical tiles remain accounted for');
  assert.equal(new Set(tiles.map(tile=>tile.id)).size,144,'physical tile IDs remain unique');
 }
 const counts={rounds:0,actions:0,wins:0,selfDrawWins:0,discardWins:0,flowerWins:0,openingFlowerWins:0,laterFlowerWins:0,draws:0,openingFlowers:0,drawnFlowers:0,discardedFlowers:0,emptyWallFlowerReplacements:0,claims:0,kongs:0};
 const fanCounts=new Map();
 for(const style of ['claim','pass'])for(let n=1;n<=roundsPerStyle;n++){
  const seed=(style==='claim'?0:1000)+n,dealer=n%4,roundWind=['E','S','W','N'][Math.floor((n-1)/12)%4];
  let session=newMcrSession(seed,dealer,roundWind),steps=0;
  const ids=session.round.playerOrder;
  const openingFlowerCounts=Object.fromEntries(ids.map(id=>[id,session.round.flowers[id].length]));
  inventory(session);
  while(session.round.phase!=='finished'){
   const options=[];
   for(let seat=0;seat<4;seat++){
    const view=mcrSessionView(session,seat);
    assert.equal('initialSeed' in view.table,false);
    assert.equal('wall' in view.table,false);
    assert.equal('hands' in view.table,false);
    if(view.table.phase!=='flower')assert.ok(!view.choices.some(choice=>choice.type==='discard-flower'),'flower discard is available only during immediate flower resolution');
    for(const choice of view.choices)options.push({seat,choice});
   }
   assert.ok(options.length,`no available action: ${style}/${seed}/${session.round.phase}`);
   const find=predicate=>options.find(({choice})=>predicate(choice));
   const selected=find(c=>c.type==='declare-self-draw'||c.claim==='win')
    ||(style==='pass'&&n%2===1&&find(c=>c.type==='discard-flower'))
    ||find(c=>c.type==='replace-flower')
    ||(style==='claim'&&find(c=>c.type==='declare-added-kong'||c.type==='declare-concealed-kong'||c.claim==='kong'||c.claim==='pung'||c.claim==='chow'))
    ||(style==='pass'&&find(c=>c.type==='pass-claim'))
    ||find(c=>c.type==='draw-replacement'||c.type==='draw')
    ||find(c=>c.type==='pass-claim')
    ||(()=>{const discards=options.filter(({choice})=>choice.type==='discard');return discards.length?discards[(seed+steps*7)%discards.length]:null;})()
    ||options[0];
   const prior=session,before=JSON.stringify(session),revision=session.revision,opening=session.opening.length;
   session=actMcrSession(session,selected.seat,revision,selected.choice.index);
   assert.equal(session.revision,revision+1);
   assert.equal(JSON.stringify(prior),before,'prior session must stay immutable');
   if(selected.choice.type==='discard-flower'){
    const player=`seat-${selected.seat+1}`;
    assert.equal(prior.round.phase,'flower');assert.ok(prior.round.pendingFlowerTileId);
    assert.equal(session.round.discardPile.length,prior.round.discardPile.length+1,'discarded flower must enter discard pile');
    assert.equal(session.round.discardPile.at(-1).id,prior.round.pendingFlowerTileId);
    assert.equal(session.round.flowers[player].length,prior.round.flowers[player].length,'discarded flower must not earn a flower point');
   }
   if(selected.choice.type==='replace-flower'&&!opening){
    const player=`seat-${selected.seat+1}`;
    assert.equal(session.round.flowers[player].length,prior.round.flowers[player].length+1,'replaced flower must become exposed');
    if(prior.round.wall.length){assert.equal(session.round.wall.length,prior.round.wall.length-1,'replacement must consume one wall tile');}
    else{
     counts.emptyWallFlowerReplacements++;
     assert.equal(session.round.wall.length,0);
     assert.equal(session.round.phase,'finished');
     assert.equal(session.round.drawResult?.reason,'wall-exhausted');
    }
   }
   inventory(session);
   counts.actions++;
   if(opening&&selected.choice.type==='replace-flower')counts.openingFlowers++;
   else if(selected.choice.type==='replace-flower')counts.drawnFlowers++;
   if(selected.choice.type==='discard-flower')counts.discardedFlowers++;
   if(selected.choice.claim&&selected.choice.claim!=='win')counts.claims++;
   if(selected.choice.type.includes('kong'))counts.kongs++;
   assert.ok(++steps<1500,`runaway round: ${style}/${seed}`);
  }
  counts.rounds++;
  const result=session.round.winResult;
  if(result){
   counts.wins++;
   counts[result.discarderId===null?'selfDrawWins':'discardWins']++;
   assert.ok(result.analysis.nonFlowerTotal>=8,`below minimum: ${style}/${seed}`);
   const flowers=session.round.flowers[result.winnerId].length;
   const openingFlowers=openingFlowerCounts[result.winnerId];
   if(flowers){counts.flowerWins++;if(openingFlowers)counts.openingFlowerWins++;if(flowers>openingFlowers)counts.laterFlowerWins++;}
   assert.equal(result.analysis.flowerPoints,flowers,`exposed flowers: ${style}/${seed}`);
   const flowerOccurrences=result.analysis.occurrences.filter(o=>o.fanCode==='mcr-81');
   assert.equal(flowerOccurrences.length,flowers,`one fan occurrence per exposed flower: ${style}/${seed}`);
   assert.ok(flowerOccurrences.every(o=>o.points===1&&o.source==='flower'),`flower points and source: ${style}/${seed}`);
   assert.equal(new Set(flowerOccurrences.map(o=>o.key)).size,flowers,`unique flower fan occurrences: ${style}/${seed}`);
   assert.equal(result.analysis.total,result.analysis.nonFlowerTotal+flowers);
   assert.equal(result.settlement.totalFan,result.analysis.total);
   assert.equal(result.winMethod,result.discarderId===null?'self-draw':'discard');
   const expectedPayments=Object.fromEntries(ids.map(id=>[id,id===result.winnerId?0:
    8+(result.discarderId===null||id===result.discarderId?result.analysis.total:0)]));
   const received=Object.values(expectedPayments).reduce((sum,n)=>sum+n,0);
   const expectedDeltas=Object.fromEntries(ids.map(id=>[id,id===result.winnerId?received:-expectedPayments[id]]));
   assert.deepEqual(result.settlement.payments,expectedPayments,`independent payer amounts: ${style}/${seed}`);
   assert.deepEqual(result.settlement.deltas,expectedDeltas,`independent four-seat deltas: ${style}/${seed}`);
   assert.equal(Object.values(result.settlement.deltas).reduce((a,b)=>a+b,0),0);
   for(const code of result.analysis.fanCodes)fanCounts.set(code,(fanCounts.get(code)||0)+1);
  }else{counts.draws++;assert.ok(session.round.drawResult,`missing draw result: ${style}/${seed}`);}
  const terminal=JSON.stringify(session.round);
  for(let seat=0;seat<4;seat++){
   const view=mcrSessionView(session,seat);assert.equal(view.canConfirm,true);
   session=actMcrSession(session,seat,session.revision,'confirm');
   assert.equal(JSON.stringify(session.round),terminal,'result must survive confirmation');
   assert.equal(mcrSessionView(session,seat).canConfirm,false);
  }
  assert.deepEqual(session.confirmed,[true,true,true,true]);
 }
 assert.ok(counts.selfDrawWins>0&&counts.discardWins>0&&counts.draws>0&&counts.claims>0&&counts.openingFlowers>0&&counts.discardedFlowers>0&&counts.emptyWallFlowerReplacements>0,'sweep must exercise both win sources, draws, claims, flower replacement/discard and empty-wall replacement draw');
 assert.ok(counts.flowerWins>0&&counts.flowerWins<counts.wins&&counts.openingFlowerWins>0&&counts.laterFlowerWins>0,'sweep must settle flower and flower-free wins, including opening and later exposed flowers');
 console.log(`PASS: ${counts.rounds} seeded MCR rounds, ${counts.actions} actions, ${counts.wins} wins (${counts.selfDrawWins} self-draw / ${counts.discardWins} discard; ${counts.flowerWins} with flowers, ${counts.openingFlowerWins} with opening flowers, ${counts.laterFlowerWins} with later flowers) / ${counts.draws} draws, ${counts.openingFlowers} opening and ${counts.drawnFlowers} drawn flowers, ${counts.discardedFlowers} flower discards, ${counts.emptyWallFlowerReplacements} empty-wall flower replacements, ${counts.claims} claims, ${counts.kongs} Kong actions; ${fanCounts.size} observed fan codes. Four dealers/winds, 144 unique physical IDs per step, legal views, eight-point gate, independently checked payer amounts and four-seat deltas, retained four-way confirmation. Not rare-event exhaustiveness or browser/LAN proof.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
