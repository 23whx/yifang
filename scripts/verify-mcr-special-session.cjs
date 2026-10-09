// Special MCR hands through real round choices, not scorer-only calls.
// EMA Green Book fans 7, 19, 20, 34 and 35:
// https://mahjong-europe.org/portal/images/docs/mcr_EN.pdf
const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const rules=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load;
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?rules:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 const js=require.extensions['.js'];require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {newMcrSession:create,mcrSessionView:view,actMcrSession:act}=require('../lib/mahjong/mcr-session.ts');
 const {mcrTileFace:face}=require('../lib/mahjong/mcr-score.ts');
 function fixture(faces,winningFace,selfDraw){
  const original=create(61),round=structuredClone(original.round),pool=[...analysis.createMcrTileSet()];
  const take=tileFace=>{const index=pool.findIndex(tile=>tile.face===tileFace);assert.ok(index>=0,tileFace);return pool.splice(index,1)[0];};
  const hand=faces.map(take),winningIndex=hand.findIndex(tile=>tile.face===winningFace);
  assert.equal(hand.length,14);assert.ok(winningIndex>=0);
  const [winning]=hand.splice(winningIndex,1),winner=selfDraw?'seat-1':'seat-2';
  round.hands=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.melds=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.flowers=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.hands[winner]=selfDraw?[...hand,winning]:hand;
  if(!selfDraw)round.hands['seat-1'].push(winning);
  for(const id of round.playerOrder)if(id!==winner)while(round.hands[id].length<(id==='seat-1'&&!selfDraw?14:13)){
   const index=pool.findIndex(tile=>analysis.isMcrStructureTile(tile.face)&&tile.face!==winning.face);
   assert.ok(index>=0);round.hands[id].push(pool.splice(index,1)[0]);
  }
  round.wall=pool;round.discardPile=[];round.activePlayerId='seat-1';round.phase='discard';
  round.turnSource='wall';round.drewThisTurn=true;round.lastDrawnTileId=winning.id;
  round.pendingFlowerTileId=null;round.claimWindow=null;round.actionHistory=[];round.winResult=null;round.drawResult=null;
  return {session:{...original,round,opening:[]},winningId:winning.id};
 }
 function declaredFixture(knitted,kind,selfDraw){
  const original=create(62),round=structuredClone(original.round),pool=[...analysis.createMcrTileSet()];
  const take=tileFace=>{const index=pool.findIndex(tile=>tile.face===tileFace);assert.ok(index>=0,tileFace);return pool.splice(index,1)[0];};
  const winner=selfDraw?'seat-1':'seat-2';
  const concealed=kind==='chow'?[...knitted,'5m','5m'].map(take):[...knitted,'E','E'].map(take);
  const [winning]=concealed.splice(concealed.length-1,1);
  const meldFaces=kind==='chow'?['1m','2m','3m']:Array.from({length:kind==='kong'?4:3},()=> 'C');
  const meldTiles=meldFaces.map(take);
  round.hands=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.melds=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.flowers=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.melds[winner]=[{kind,exposure:'melded',tiles:meldTiles,claimedTileId:meldTiles[0].id,fromPlayerId:selfDraw?'seat-4':'seat-1'}];
  round.hands[winner]=selfDraw?[...concealed,winning]:concealed;
  if(!selfDraw)round.hands['seat-1'].push(winning);
  for(const id of round.playerOrder)if(id!==winner)while(round.hands[id].length<(id==='seat-1'&&!selfDraw?14:13)){
   const index=pool.findIndex(tile=>analysis.isMcrStructureTile(tile.face)&&tile.face!==winning.face);
   assert.ok(index>=0);round.hands[id].push(pool.splice(index,1)[0]);
  }
  round.wall=pool;round.discardPile=[];round.activePlayerId='seat-1';round.phase='discard';
  round.turnSource='wall';round.drewThisTurn=true;round.lastDrawnTileId=winning.id;
  round.pendingFlowerTileId=null;round.claimWindow=null;round.actionHistory=[];round.winResult=null;round.drawResult=null;
  return {session:{...original,round,opening:[]},winningId:winning.id};
 }
 function addedKongFixture(knitted,flowerReplacement){
  const original=create(63),round=structuredClone(original.round),pool=[...analysis.createMcrTileSet()];
  const take=tileFace=>{const index=pool.findIndex(tile=>tile.face===tileFace);assert.ok(index>=0,tileFace);return pool.splice(index,1)[0];};
  round.hands=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.melds=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.flowers=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  const pung=['C','C','C'].map(take),fourth=take('C'),winning=take('E');
  round.melds['seat-1']=[{kind:'pung',exposure:'melded',tiles:pung,claimedTileId:pung[0].id,fromPlayerId:'seat-2'}];
  round.hands['seat-1']=[fourth,...knitted.map(take),take('E')];
  for(const id of round.playerOrder.slice(1))while(round.hands[id].length<13){
   const index=pool.findIndex(tile=>analysis.isMcrStructureTile(tile.face));
   assert.ok(index>=0);round.hands[id].push(pool.splice(index,1)[0]);
  }
  const flower=flowerReplacement?pool.splice(pool.findIndex(tile=>!analysis.isMcrStructureTile(tile.face)),1)[0]:null;
  round.wall=flower?[winning,flower]:[winning];
  round.discardPile=pool.filter(tile=>analysis.isMcrStructureTile(tile.face));
  round.flowers['seat-4']=pool.filter(tile=>!analysis.isMcrStructureTile(tile.face));
  round.activePlayerId='seat-1';round.phase='discard';round.turnSource='wall';round.drewThisTurn=true;
  round.lastDrawnTileId=fourth.id;round.pendingFlowerTileId=null;round.claimWindow=null;
  round.actionHistory=[];round.winResult=null;round.drawResult=null;
  return {session:{...original,round,opening:[]},fourthId:fourth.id};
 }
 function robbedKongFixture(knitted){
  const original=create(64),round=structuredClone(original.round),pool=[...analysis.createMcrTileSet()];
  const take=tileFace=>{const index=pool.findIndex(tile=>tile.face===tileFace);assert.ok(index>=0,tileFace);return pool.splice(index,1)[0];};
  round.hands=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.melds=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.flowers=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  const target=knitted[0],ownerPung=[target,target,target].map(take),fourth=take(target);
  round.melds['seat-1']=[{kind:'pung',exposure:'melded',tiles:ownerPung,claimedTileId:ownerPung[0].id,fromPlayerId:'seat-3'}];
  const winnerPung=['C','C','C'].map(take);
  round.melds['seat-2']=[{kind:'pung',exposure:'melded',tiles:winnerPung,claimedTileId:winnerPung[0].id,fromPlayerId:'seat-1'}];
  round.hands['seat-2']=[...knitted.slice(1).map(take),take('E'),take('E')];
  round.hands['seat-1']=[fourth];
  for(const id of round.playerOrder)if(id!=='seat-2')while(round.hands[id].length<(id==='seat-1'?11:13)){
   const index=pool.findIndex(tile=>analysis.isMcrStructureTile(tile.face));
   assert.ok(index>=0);round.hands[id].push(pool.splice(index,1)[0]);
  }
  round.wall=pool;round.discardPile=[];round.activePlayerId='seat-1';round.phase='discard';
  round.turnSource='wall';round.drewThisTurn=true;round.lastDrawnTileId=fourth.id;
  round.pendingFlowerTileId=null;round.claimWindow=null;round.actionHistory=[];round.winResult=null;round.drawResult=null;
  return {session:{...original,round,opening:[]},fourthId:fourth.id};
 }
 function inventory(session){
  const round=session.round,tiles=[...round.wall,...round.discardPile,...Object.values(round.hands).flat(),...Object.values(round.melds).flat().flatMap(meld=>meld.tiles),...Object.values(round.flowers).flat()];
  assert.equal(tiles.length,144);assert.equal(new Set(tiles.map(tile=>tile.id)).size,144);
 }
 function step(session,seat,type,predicate=()=>true){
  const previous=JSON.stringify(session),choice=view(session,seat).choices.find(candidate=>candidate.type===type&&predicate(candidate));
  assert.ok(choice,`${type} seat ${seat}`);
  const next=act(session,seat,session.revision,choice.index);
  assert.equal(JSON.stringify(session),previous,'prior session immutable');assert.equal(next.revision,session.revision+1);
  inventory(next);return next;
 }
 function play(faces,winningFace,selfDraw,expected,absent=[]){
  const test=fixture(faces,winningFace,selfDraw);let session=test.session;inventory(session);
  if(selfDraw)session=step(session,0,'declare-self-draw');
  else{
   session=step(session,0,'discard',choice=>choice.tileIds.includes(test.winningId));
   session=step(session,1,'claim-discard',choice=>choice.claim==='win');
   for(const seat of [2,3])if(session.round.phase==='claim')session=step(session,seat,'pass-claim');
  }
  assert.equal(session.round.phase,'finished');const result=session.round.winResult;
  assert.equal(result.winnerId,selfDraw?'seat-1':'seat-2');assert.equal(result.discarderId,selfDraw?null:'seat-1');
  for(const [code,points] of Object.entries(expected))assert.equal(result.analysis.occurrences.filter(item=>item.fanCode===`mcr-${code}`).reduce((sum,item)=>sum+item.points,0),points,`${code}/${winningFace}/${selfDraw}`);
  for(const code of absent)assert.ok(!result.analysis.fanCodes.includes(`mcr-${code}`),`${code}/${winningFace}/${selfDraw}`);
  const points=result.analysis.total;
  assert.deepEqual(Object.values(result.settlement.deltas),selfDraw?[3*(points+8),-points-8,-points-8,-points-8]:[-points-8,points+24,-8,-8]);
  return result;
 }
 function reject(faces,winningFace,selfDraw){
  const test=fixture(faces,winningFace,selfDraw);inventory(test.session);
  if(selfDraw)assert.ok(!view(test.session,0).choices.some(choice=>choice.type==='declare-self-draw'),'invalid special hand cannot self-draw win');
  else{
   const afterDiscard=step(test.session,0,'discard',choice=>choice.tileIds.includes(test.winningId));
   assert.ok(!view(afterDiscard,1).choices.some(choice=>choice.type==='claim-discard'&&choice.claim==='win'),'invalid special hand cannot claim win');
  }
 }
 function playDeclared(knitted,kind,selfDraw){
  const test=declaredFixture(knitted,kind,selfDraw);let session=test.session;inventory(session);
  if(selfDraw)session=step(session,0,'declare-self-draw');
  else{
   session=step(session,0,'discard',choice=>choice.tileIds.includes(test.winningId));
   session=step(session,1,'claim-discard',choice=>choice.claim==='win');
   for(const seat of [2,3])if(session.round.phase==='claim')session=step(session,seat,'pass-claim');
  }
  assert.equal(session.round.phase,'finished');const result=session.round.winResult;
  assert.equal(result.winnerId,selfDraw?'seat-1':'seat-2');
  assert.equal(result.discarderId,selfDraw?null:'seat-1');
  const expected=kind==='chow'?{'35':12,'63':2,'79':1}:{'35':12,'52':6,'59':2,'79':1,...(kind==='kong'?{'74':1}:{})};
  for(const [code,points] of Object.entries(expected))assert.equal(result.analysis.occurrences.filter(item=>item.fanCode===`mcr-${code}`).reduce((sum,item)=>sum+item.points,0),points,`${kind}/${code}/${selfDraw}: ${JSON.stringify(result.analysis.occurrences)}`);
  assert.ok(!result.analysis.fanCodes.includes('mcr-34'),'Declared combination dragon must not be lesser-honors knitted');
  assert.equal(result.analysis.nonFlowerTotal,(kind==='chow'?15:kind==='kong'?22:21)+(selfDraw?1:0));
  const points=result.analysis.total;
  assert.deepEqual(Object.values(result.settlement.deltas),selfDraw?[3*(points+8),-points-8,-points-8,-points-8]:[-points-8,points+24,-8,-8]);
 }
 function playAddedKong(knitted,flowerReplacement){
  const test=addedKongFixture(knitted,flowerReplacement);let session=test.session;inventory(session);
  session=step(session,0,'declare-added-kong');
  assert.equal(session.round.phase,'claim');assert.equal(session.round.melds['seat-1'][0].kind,'pung');
  for(const seat of [1,2,3])session=step(session,seat,'pass-claim');
  assert.equal(session.round.phase,'replacement');
  assert.equal(session.round.melds['seat-1'][0].kind,'kong');
  assert.ok(session.round.melds['seat-1'][0].tiles.some(tile=>tile.id===test.fourthId));
  session=step(session,0,'draw-replacement');
  if(flowerReplacement){assert.equal(session.round.phase,'flower');session=step(session,0,'replace-flower');}
  assert.equal(session.round.turnSource,flowerReplacement?'flower-replacement':'kong-replacement');
  session=step(session,0,'declare-self-draw');assert.equal(session.round.phase,'finished');
  const result=session.round.winResult;assert.equal(result.winnerId,'seat-1');
  const expected={'35':12,'52':6,'59':2,'74':1,'79':1,[flowerReplacement?'80':'46']:flowerReplacement?1:8};
  for(const [code,points] of Object.entries(expected))assert.equal(result.analysis.occurrences.filter(item=>item.fanCode===`mcr-${code}`).reduce((sum,item)=>sum+item.points,0),points,`${code}/${flowerReplacement}: ${JSON.stringify(result.analysis.occurrences)}`);
  assert.ok(!result.analysis.fanCodes.includes(`mcr-${flowerReplacement?'46':'80'}`));
  assert.equal(result.analysis.nonFlowerTotal,flowerReplacement?23:30);
  assert.equal(result.analysis.total,flowerReplacement?24:30);
  const payment=result.analysis.total+8;
  assert.deepEqual(Object.values(result.settlement.deltas),[3*payment,-payment,-payment,-payment]);
 }
 function playRobbedKong(knitted){
  const test=robbedKongFixture(knitted);let session=test.session;inventory(session);
  session=step(session,0,'declare-added-kong');
  assert.equal(session.round.phase,'claim');assert.equal(session.round.melds['seat-1'][0].kind,'pung');
  session=step(session,1,'claim-added-kong-win');
  for(const seat of [2,3])if(session.round.phase==='claim')session=step(session,seat,'pass-claim');
  assert.equal(session.round.phase,'finished');assert.equal(session.round.melds['seat-1'][0].kind,'pung');
  assert.ok(!session.round.hands['seat-1'].some(tile=>tile.id===test.fourthId));
  const result=session.round.winResult;assert.equal(result.winnerId,'seat-2');assert.equal(result.discarderId,'seat-1');
  for(const [code,points] of Object.entries({'35':12,'52':6,'59':2,'47':8}))assert.equal(result.analysis.occurrences.filter(item=>item.fanCode===`mcr-${code}`).reduce((sum,item)=>sum+item.points,0),points,`${code}: ${JSON.stringify(result.analysis.occurrences)}`);
  for(const code of ['mcr-46','mcr-58'])assert.ok(!result.analysis.fanCodes.includes(code));
  assert.equal(result.analysis.nonFlowerTotal,28);
  assert.deepEqual(Object.values(result.settlement.deltas),[-36,52,-8,-8]);
 }
 let thirteen=0,pairs=0,greater=0,lesser=0;
 const orphanSingles=[0,8,9,17,18,26,27,28,29,30,31,32,33].map(face);
 for(const pair of orphanSingles)for(const selfDraw of [false,true]){
  play([...orphanSingles,pair],pair,selfDraw,{'07':88,'56':selfDraw?4:0},['19','20','34','62','79','80']);thirteen++;
 }
 const pairRanks=[0,4,10,13,20,23,27];
 for(const selfDraw of [false,true])for(const winningRank of pairRanks){
  const tiles=pairRanks.flatMap(rank=>[face(rank),face(rank)]);
  play(tiles,face(winningRank),selfDraw,{'19':24},['06','07','20','34','62','79']);pairs++;
 }
 const permutations=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
 for(const suits of permutations){
  const knitted=suits.flatMap((suit,index)=>[index,index+3,index+6].map(rank=>face(9*suit+rank)));
  for(const kind of ['pung','chow','kong'])for(const selfDraw of [false,true])playDeclared(knitted,kind,selfDraw);
  for(const flowerReplacement of [false,true])playAddedKong(knitted,flowerReplacement);
  playRobbedKong(knitted);
  for(const selfDraw of [false,true])for(const omitted of [0,4,8]){
   const lesserTiles=[...knitted.filter((_,index)=>index!==omitted),...'ESWNCF'];
   play(lesserTiles,lesserTiles.at(-1),selfDraw,{'34':12,'35':0},['20','62','79']);lesser++;
  }
  for(const selfDraw of [false,true]){
   const comboTiles=[...knitted,...'ESWCF'];
   play(comboTiles,comboTiles.at(-1),selfDraw,{'34':12,'35':12},['20','62','79']);lesser++;
   const greaterTiles=[...knitted.slice(0,7),...'ESWNCFP'];
   play(greaterTiles,greaterTiles.at(-1),selfDraw,{'20':24,'34':0},['35','62','79']);greater++;
  }
 }
 const baseKnitted=permutations[0].flatMap((suit,index)=>[index,index+3,index+6].map(rank=>face(9*suit+rank)));
 for(const selfDraw of [false,true]){
  reject([...orphanSingles.slice(0,-1),orphanSingles[0],orphanSingles[0]],orphanSingles[0],selfDraw);
  reject([...pairRanks.flatMap(rank=>[face(rank),face(rank)]).slice(0,-1),face(28)],face(28),selfDraw);
  reject([...baseKnitted.slice(0,6),baseKnitted[0],...'ESWNCFP'], 'P',selfDraw);
  reject([baseKnitted[1],...baseKnitted.slice(1,8),...'ESWNCF'],'F',selfDraw);
 }
 const clearStraight=fixture(['1m','2m','3m','4m','5m','6m','7m','8m','9m','1p','2p','3p','E','E'],'E',true);
 const explained=step(clearStraight.session,0,'declare-self-draw').round.winResult;
 assert.ok(explained.analysis.fanCodes.includes('mcr-28'));
 assert.ok(!explained.analysis.fanCodes.includes('mcr-72'));
 assert.deepEqual(explained.analysis.exclusions.find(item=>item.fanCode==='mcr-72')?.excludedBy.map(item=>item.fanCode),['mcr-28']);
 const explainedPayment=explained.analysis.total+8;
 assert.deepEqual(Object.values(explained.settlement.deltas),[3*explainedPayment,-explainedPayment,-explainedPayment,-explainedPayment]);
 let threeWindSessions=0;
 for(const omittedWind of 'ESWN')for(let suit=0;suit<3;suit++)for(const rank of [1,2,8,9])for(const selfDraw of [false,true]){
  const winds=[...'ESWN'].filter(wind=>wind!==omittedWind).flatMap(wind=>[wind,wind,wind]);
  const numerical=face(suit*9+rank-1),terminal=rank===1||rank===9;
  const result=play([...winds,numerical,numerical,numerical,'5p','5p'],'5p',selfDraw,{'38':12,'73':terminal?1:0});
  const excluded=result.analysis.exclusions.find(item=>item.fanCode==='mcr-73');
  assert.ok(excluded?.excludedBy.some(cause=>cause.fanCode==='mcr-38'));
  assert.equal(new Set(excluded.occurrenceKeys).size,3);
  threeWindSessions++;
 }
 let outsideSessions=0;
 for(const suits of permutations)for(const pairRank of [1,9,5])for(const selfDraw of [false,true]){
  const sequences=[0,6].flatMap(start=>[suits[0],suits[1]].flatMap(suit=>[0,1,2].map(offset=>face(suit*9+start+offset))));
  const pair=face(suits[2]*9+pairRank-1),upgraded=pairRank===5;
  const expected=upgraded?{'29':16,'55':0,'63':0,'72':0,'70':0,'76':0}:{'29':0,'55':4,'63':2,'72':1,'70':2};
  const result=play([...sequences,pair,pair],pair,selfDraw,expected);
  if(upgraded)for(const code of ['63','70','72','76']){
   const excluded=result.analysis.exclusions.find(item=>item.fanCode===`mcr-${code}`);
   assert.ok(excluded?.excludedBy.some(cause=>cause.fanCode==='mcr-29'));
  }
  outsideSessions++;
 }
 let triplePungSessions=0;
 for(const suits of permutations)for(const rank of [1,9])for(let chowSuit=0;chowSuit<3;chowSuit++)for(const selfDraw of [false,true])for(const middlePair of [false,true]){
  const triple=suits.flatMap(suit=>Array.from({length:3},()=>face(suit*9+rank-1)));
  const chowStart=suits[chowSuit]*9+(rank===1?6:0),chow=[0,1,2].map(offset=>face(chowStart+offset));
  const pair=face(suits[2]*9+(middlePair?4:rank===1?8:0));
  play([...triple,...chow,pair,pair],pair,selfDraw,{'32':16,'55':middlePair?0:4,'76':1,'73':3});
  triplePungSessions++;
 }
 let closedKnittedSessions=0;
 for(const suits of permutations)for(const wind of 'ESWN')for(const dragon of 'CFP')for(const selfDraw of [false,true])for(const final of [wind,dragon]){
  const knitted=suits.flatMap((s,i)=>[i,i+3,i+6].map(rank=>face(s*9+rank)));
  const result=play([...knitted,dragon,dragon,dragon,wind,wind],final,selfDraw,{'35':12,'52':6,'59':2,'79':final===wind?1:0,'56':selfDraw?4:0,'62':selfDraw?0:2,'80':0});
  assert.equal(result.analysis.nonFlowerTotal,22+(final===wind?1:0)+(selfDraw?2:0));
  closedKnittedSessions++;
 }
 let decompositionSessions=0;
 for(let suit=0;suit<3;suit++)for(let start=1;start<=6;start++)for(const selfDraw of [false,true])for(const pairFinish of [false,true]){
  const pungs=[0,1,2,3].map(offset=>face(suit*9+start-1+offset));
  const pair=face(suit*9+(start===1?4:0)),final=pairFinish?pair:pungs[3];
  const result=play([...pungs.flatMap(tile=>[tile,tile,tile]),pair,pair],final,selfDraw,{'15':48,'22':24,'12':selfDraw||pairFinish?64:0,'33':!selfDraw&&!pairFinish?16:0,'73':start===1||start===6?1:0},['23','24','49']);
  assert.ok(result.analysis.nonFlowerTotal>=72,'The highest valid decomposition must reach both structure fans');
  assert.ok(!result.analysis.exclusions.some(item=>item.fanCode==='mcr-73'&&item.excludedBy.some(cause=>cause.fanCode==='mcr-15')),'The actual result must not invent a terminal-pung exclusion');
  decompositionSessions++;
 }
 console.log(`PASS: ${thirteen} thirteen-orphans, ${pairs} seven-pairs, ${greater} seven-honors knitted and ${lesser} lesser-honors knitted/combination-dragon action chains.`);
 console.log('PASS: 36 declared combination-dragon real action chains: six suit permutations, pung/chow/kong, self-draw/discard claim, exact fan exclusions and settlement.');
 console.log('PASS: 12 combination-dragon added-kong action chains: three peer responses, replacement with/without flower, mutually exclusive event fan and exact settlement.');
 console.log('PASS: six combination-dragon robbed-added-kong action chains: uncommitted kong, transferred tile, fan 47 versus last-copy exclusion and exact payer.');
 console.log('PASS: one actual clear-straight self-draw retains the absorbed Old Young Pair explanation in the terminal result and exact settlement.');
 console.log(`PASS: ${threeWindSessions} actual three-wind self-draw/discard-claim endings retain absorbed wind-pung explanation, independent terminal point and four-seat settlement.`);
 console.log(`PASS: ${outsideSessions} actual Outside Hand compound / Three-Suited Terminal Chows upgraded endings retain exact fans, explicit lower-fan causes and four-seat settlement.`);
 console.log(`PASS: ${triplePungSessions} actual Triple Pung / Outside Hand combination and middle-pair counterexample endings retain four independent fan contributions and settlement.`);
 console.log(`PASS: ${closedKnittedSessions} actual concealed Knitted Straight + All Types + Dragon Pung endings distinguish pair-wait from dragon completion and self-draw from discard settlement.`);
 console.log(`PASS: ${decompositionSessions} actual multi-decomposition high-score endings retain Four Concealed / Three Concealed Pungs, Four Pure Shifted Pungs and lower-fan exclusions.`);
 console.log('Eight broken-shape self-draw/claim refusals; 144 physical IDs, revision, exclusion and four-seat settlement checked. Authored mid-hands, not random-opening or browser proof.');
})().catch(error=>{console.error(error);process.exitCode=1;});
