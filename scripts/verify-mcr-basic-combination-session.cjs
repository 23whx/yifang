// WMO/EMA Greenbook 2021: ordinary 6-point combinations and Melded Hand.
// Authored mid-round physical tiles are followed through real session actions.
// https://mahjongclublausanne.ch/wp-content/uploads/2024/03/Greenbook2021_Chinese-EN.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
(async()=>{
 const rules=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?rules:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](module,file):js(module,file);
 const {newMcrSession,mcrSessionView,actMcrSession}=require('../lib/mahjong/mcr-session.ts');
 const chow=(rank,suit)=>[rank,rank+1,rank+2].map(n=>String(n)+suit),pung=face=>[face,face,face];
 const cases=[
  {name:'all pungs with independent numbered and wind pungs',groups:[pung('2m'),pung('3p'),pung('4s'),pung('E')],pair:'5m',fans:{49:6},absent:[18,38]},
  {name:'half flush plus pure straight and independent dragon pung',groups:[chow(1,'m'),chow(4,'m'),chow(7,'m'),pung('C')],pair:'E',fans:{50:6,28:16,59:2},absent:[22,25]},
  {name:'all five types plus mixed straight',groups:[chow(1,'m'),chow(4,'p'),chow(7,'s'),pung('E')],pair:'C',fans:{52:6,39:8},absent:[50,54]},
  {name:'two dragon pungs with half flush',groups:[pung('C'),pung('F'),chow(1,'m'),chow(4,'m')],pair:'5m',fans:{54:6,50:6},absent:[2,10,59]},
 ];
 function fixture(spec,winningFace,selfDraw,declaredCount){
  const original=newMcrSession(113),round=structuredClone(original.round),pool=[...analysis.createMcrTileSet()],winner=selfDraw?'seat-1':'seat-2';
  const take=face=>{const at=pool.findIndex(tile=>tile.face===face);assert.ok(at>=0,'missing '+face);return pool.splice(at,1)[0];};
  const completeGroups=spec.groups.map(group=>group.map(take)),pair=[take(spec.pair),take(spec.pair)];
  const declared=completeGroups.slice(0,declaredCount);
  const concealed=[...completeGroups.slice(declaredCount).flat(),...pair];
  const winningAt=concealed.findIndex(tile=>tile.face===winningFace);assert.ok(winningAt>=0,'winning face '+winningFace+' must be concealed');
  const [winning]=concealed.splice(winningAt,1);
  round.hands=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.melds=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.flowers=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.melds[winner]=declared.map(tiles=>({kind:tiles[0].face===tiles[1].face?'pung':'chow',exposure:'melded',tiles,claimedTileId:tiles[0].id,fromPlayerId:'seat-3'}));
  round.hands[winner]=selfDraw?[...concealed,winning]:concealed;
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
  const before=JSON.stringify(session),choice=mcrSessionView(session,seat).choices.find(item=>item.type===type&&predicate(item));assert.ok(choice,type+' seat '+seat);
  const next=actMcrSession(session,seat,session.revision,choice.index);assert.equal(JSON.stringify(session),before);assert.equal(next.revision,session.revision+1);inventory(next);return next;
 }
 function points(result,code){return result.analysis.occurrences.filter(item=>item.fanCode==='mcr-'+String(code).padStart(2,'0')).reduce((sum,item)=>sum+item.points,0);}
 let count=0;
 const variants=[...cases.flatMap(spec=>[spec.pair,spec.groups[3][0]].flatMap(winningFace=>[false,true].flatMap(selfDraw=>(spec.fans[49]?[1]:[0,1]).map(declaredCount=>({spec,winningFace,selfDraw,declaredCount}))))),
  ...[false,true].flatMap(selfDraw=>[3,4].map(declaredCount=>({spec:cases[2],winningFace:cases[2].pair,selfDraw,declaredCount})))];
 for(const {spec,winningFace,selfDraw,declaredCount} of variants){
  const label=JSON.stringify({name:spec.name,winningFace,selfDraw,declaredCount}),test=fixture(spec,winningFace,selfDraw,declaredCount);let session=test.session;inventory(session);
  if(selfDraw)session=step(session,0,'declare-self-draw');
  else{session=step(session,0,'discard',choice=>choice.tileIds.includes(test.winningId));assert.ok(mcrSessionView(session,1).choices.some(choice=>choice.type==='claim-discard'&&choice.claim==='win'),label+': no winning claim');session=step(session,1,'claim-discard',choice=>choice.claim==='win');for(const seat of [2,3])if(session.round.phase==='claim')session=step(session,seat,'pass-claim');}
  assert.equal(session.round.phase,'finished',label);const result=session.round.winResult;
  for(const [code,expected] of Object.entries(spec.fans))assert.equal(points(result,code),expected,label+': fan '+code+'; '+JSON.stringify(result.analysis.fanCodes));
  for(const code of spec.absent)assert.equal(points(result,code),0,label+': fan '+code+' must be absent');
  const meldedHand=declaredCount===4&&!selfDraw;
  assert.equal(points(result,53),meldedHand?6:0,label+': all four sets and the pair must come from others discards');
  if(meldedHand){
   assert.equal(points(result,79),0,label+': single wait is absorbed by Melded Hand');
   assert.ok(result.analysis.exclusions.some(item=>item.fanCode==='mcr-79'&&item.excludedBy.some(cause=>cause.fanCode==='mcr-53')),label+': explain single-wait exclusion; '+JSON.stringify(result.analysis.exclusions));
  }
  const due=result.analysis.total+8;
  assert.deepEqual(Object.values(result.settlement.deltas),selfDraw?[3*due,-due,-due,-due]:[-due,result.analysis.total+24,-8,-8],label+': four-seat settlement');
  assert.equal(Object.values(result.settlement.deltas).reduce((sum,delta)=>sum+delta,0),0,label+': zero-sum settlement');
  count++;
 }
 const suits=['m','p','s'],orders=suits.flatMap(first=>suits.filter(second=>second!==first).map(second=>[first,second,suits.find(third=>third!==first&&third!==second)]));
 let halfFlushChecks=0;
 for(const suit of suits){
  const other=suits.find(candidate=>candidate!==suit),straight=[chow(1,suit),chow(4,suit),chow(7,suit)];
  const halfFlushCases=[
   ...['E','S','W','N','C','F','P'].flatMap(honor=>[
    {name:`${honor} honor pair only`,groups:[...straight,chow(1,suit)],pair:honor,half:6,full:0},
    {name:`${honor} honor pung only`,groups:[...straight,pung(honor)],pair:`5${suit}`,half:6,full:0},
   ]),
   {name:'one suit without honor',groups:[...straight,pung(`5${suit}`)],pair:`2${suit}`,half:0,full:24},
   {name:'honor and second suit',groups:[...straight,pung(`5${other}`)],pair:'E',half:0,full:0},
   {name:'second suit without honor',groups:[...straight,pung(`5${other}`)],pair:`2${suit}`,half:0,full:0},
  ];
  for(const spec of halfFlushCases)for(const winningFace of [spec.pair,spec.groups[3][0]])for(const selfDraw of [false,true])for(const declaredCount of [0,1]){
   const label=JSON.stringify({suit,name:spec.name,winningFace,selfDraw,declaredCount});
   const test=fixture(spec,winningFace,selfDraw,declaredCount);let session=test.session;inventory(session);
   if(selfDraw)session=step(session,0,'declare-self-draw');
   else{session=step(session,0,'discard',choice=>choice.tileIds.includes(test.winningId));session=step(session,1,'claim-discard',choice=>choice.claim==='win');for(const seat of [2,3])if(session.round.phase==='claim')session=step(session,seat,'pass-claim');}
   assert.equal(session.round.phase,'finished',label);
   const result=session.round.winResult;
   assert.equal(points(result,50),spec.half,`${label}: one suit plus at least one honor only`);
   assert.equal(points(result,22),spec.full,`${label}: pure flush only without honors or second suit`);
   assert.equal(points(result,28),16,`${label}: pure straight remains an independent anchor`);
   const due=result.analysis.total+8;
   assert.deepEqual(Object.values(result.settlement.deltas),selfDraw?[3*due,-due,-due,-due]:[-due,result.analysis.total+24,-8,-8],label);
   halfFlushChecks++;
  }
 }
 assert.equal(halfFlushChecks,408,'three suits, seven winds/dragons as pair or pung, three negative types, two winning positions, two sources and two exposure states');
 let allPungsChecks=0;
 for(const suit of suits)for(const dragon of ['C','F','P'])for(const oneChow of [false,true]){
  const spec={name:oneChow?'one chow instead of a pung':'four pungs',
   groups:[pung(`2${suit}`),pung(`5${suit}`),oneChow?chow(7,suit):pung(`8${suit}`),pung(dragon)],pair:`7${suit}`};
  for(const declaredCount of [0,1,2,3,4])for(const winningFace of declaredCount===4?[spec.pair]:[spec.pair,dragon])for(const selfDraw of [false,true]){
   const label=JSON.stringify({suit,dragon,oneChow,declaredCount,winningFace,selfDraw});
   const test=fixture(spec,winningFace,selfDraw,declaredCount);let session=test.session;inventory(session);
   if(selfDraw)session=step(session,0,'declare-self-draw');
   else{session=step(session,0,'discard',choice=>choice.tileIds.includes(test.winningId));session=step(session,1,'claim-discard',choice=>choice.claim==='win');for(const seat of [2,3])if(session.round.phase==='claim')session=step(session,seat,'pass-claim');}
   assert.equal(session.round.phase,'finished',label);const result=session.round.winResult;
   const fourConcealed=!oneChow&&declaredCount===0&&(selfDraw||winningFace===spec.pair);
   assert.equal(points(result,49),!oneChow&&!fourConcealed?6:0,`${label}: All Pungs or higher Four Concealed Pungs`);
   assert.equal(points(result,12),fourConcealed?64:0,`${label}: four concealed pungs absorb their lower All Pungs`);
   assert.equal(points(result,50),6,`${label}: Half Flush independent of all-pungs shape`);
   assert.equal(points(result,59),2,`${label}: independent Dragon Pung`);
   const due=result.analysis.total+8;
   assert.deepEqual(Object.values(result.settlement.deltas),selfDraw?[3*due,-due,-due,-due]:[-due,result.analysis.total+24,-8,-8],label);
   allPungsChecks++;
  }
 }
 assert.equal(allPungsChecks,324,'three suits, three dragon pungs, all-pung/one-chow, five exposure counts, legal finishing positions and two sources');
 let twoDragonChecks=0;
 for(const suit of suits)for(const third of ['C','F','P']){
  const two=['C','F','P'].filter(dragon=>dragon!==third),chows=[chow(1,suit),chow(4,suit)];
  const dragonCases=[
   {name:'two independent dragon pungs',groups:[pung(two[0]),pung(two[1]),...chows],pair:`5${suit}`,two:6,little:0,big:0,single:0},
   {name:'one dragon replaced by wind',groups:[pung(two[0]),pung('E'),...chows],pair:`5${suit}`,two:0,little:0,big:0,single:2},
   {name:'third dragon is pair',groups:[pung(two[0]),pung(two[1]),...chows],pair:third,two:0,little:64,big:0,single:0},
   {name:'third dragon is pung',groups:[pung(two[0]),pung(two[1]),pung(third),chow(1,suit)],pair:`5${suit}`,two:0,little:0,big:88,single:0},
  ];
  for(const spec of dragonCases)for(const winningFace of [spec.pair,spec.groups[1][0]])for(const selfDraw of [false,true])for(const declaredCount of [0,1]){
   const label=JSON.stringify({suit,third,name:spec.name,winningFace,selfDraw,declaredCount});
   const test=fixture(spec,winningFace,selfDraw,declaredCount);let session=test.session;inventory(session);
   if(selfDraw)session=step(session,0,'declare-self-draw');
   else{session=step(session,0,'discard',choice=>choice.tileIds.includes(test.winningId));session=step(session,1,'claim-discard',choice=>choice.claim==='win');for(const seat of [2,3])if(session.round.phase==='claim')session=step(session,seat,'pass-claim');}
   assert.equal(session.round.phase,'finished',label);const result=session.round.winResult;
   for(const [code,expected] of [[54,spec.two],[10,spec.little],[2,spec.big],[59,spec.single],[50,6]])
    assert.equal(points(result,code),expected,`${label}: fan ${code}; ${JSON.stringify(result.analysis.fanCodes)}`);
   const due=result.analysis.total+8;
   assert.deepEqual(Object.values(result.settlement.deltas),selfDraw?[3*due,-due,-due,-due]:[-due,result.analysis.total+24,-8,-8],label);
   twoDragonChecks++;
  }
 }
 assert.equal(twoDragonChecks,288,'three suits, three choices of third dragon, four structural contrasts, two winning positions, two sources and two exposure states');
 let meldedHandChecks=0;
 for(const [first,second,third] of orders)for(const wind of ['E','S','W','N'])for(const pair of ['C','F','P',`5${first}`])for(const declaredCount of [3,4])for(const selfDraw of [false,true]){
  const label=JSON.stringify({order:[first,second,third],wind,pair,declaredCount,selfDraw});
  const spec={name:'melded-hand boundary',groups:[chow(1,first),chow(4,second),chow(7,third),pung(wind)],pair};
  const test=fixture(spec,pair,selfDraw,declaredCount);let session=test.session;inventory(session);
  if(selfDraw)session=step(session,0,'declare-self-draw');
  else{session=step(session,0,'discard',choice=>choice.tileIds.includes(test.winningId));session=step(session,1,'claim-discard',choice=>choice.claim==='win');for(const seat of [2,3])if(session.round.phase==='claim')session=step(session,seat,'pass-claim');}
  assert.equal(session.round.phase,'finished',label);const result=session.round.winResult;
  const melded=declaredCount===4&&!selfDraw;
  assert.equal(points(result,53),melded?6:0,`${label}: all four sets exposed and final pair claimed from another player`);
  assert.equal(points(result,39),8,`${label}: Mixed Straight independently clears eight-point minimum`);
  if(melded){
   assert.equal(points(result,79),0,`${label}: Single Wait is absorbed`);
   assert.ok(result.analysis.exclusions.some(item=>item.fanCode==='mcr-79'&&item.excludedBy.some(cause=>cause.fanCode==='mcr-53')),`${label}: explicit exclusion reason`);
  }
  const due=result.analysis.total+8;
  assert.deepEqual(Object.values(result.settlement.deltas),selfDraw?[3*due,-due,-due,-due]:[-due,result.analysis.total+24,-8,-8],label);
  meldedHandChecks++;
 }
 assert.equal(meldedHandChecks,384,'six mixed-straight suit orders, four wind pungs, three dragon pairs plus one numbered pair, three or four exposed sets and two sources');
 let allTypeChecks=0;
 for(const [first,second,third] of orders){
  const base=[pung(`2${first}`),pung(`3${second}`),pung(`4${third}`),pung('C')];
  const allTypeCases=[
   {name:'all five types',groups:base,pair:'N',expectedTypes:6,expectedShift:8,expectedDragon:2},
   {name:`missing ${first}`,groups:[pung(`2${second}`),...base.slice(1)],pair:'N',expectedTypes:0,expectedShift:0,expectedDragon:2},
   {name:`missing ${second}`,groups:[base[0],pung(`3${first}`),...base.slice(2)],pair:'N',expectedTypes:0,expectedShift:0,expectedDragon:2},
   {name:`missing ${third}`,groups:[...base.slice(0,2),pung(`4${first}`),base[3]],pair:'N',expectedTypes:0,expectedShift:0,expectedDragon:2},
   {name:'missing wind',groups:base,pair:`5${first}`,expectedTypes:0,expectedShift:8,expectedDragon:2},
   {name:'missing dragon',groups:[...base.slice(0,3),pung(`6${first}`)],pair:'N',expectedTypes:0,expectedShift:8,expectedDragon:0},
  ];
  for(const spec of allTypeCases)for(const winningFace of [spec.pair,spec.groups[3][0]])for(const selfDraw of [false,true])for(const declaredCount of [0,1]){
   const label=JSON.stringify({order:[first,second,third],name:spec.name,winningFace,selfDraw,declaredCount});
   const test=fixture(spec,winningFace,selfDraw,declaredCount);let session=test.session;inventory(session);
   if(selfDraw)session=step(session,0,'declare-self-draw');
   else{session=step(session,0,'discard',choice=>choice.tileIds.includes(test.winningId));session=step(session,1,'claim-discard',choice=>choice.claim==='win');for(const seat of [2,3])if(session.round.phase==='claim')session=step(session,seat,'pass-claim');}
   assert.equal(session.round.phase,'finished',label);const result=session.round.winResult;
   assert.equal(points(result,52),spec.expectedTypes,`${label}: exactly five categories are required`);
   assert.equal(points(result,42),spec.expectedShift,`${label}: shifted pungs depend on three distinct suited pungs`);
   assert.equal(points(result,59),spec.expectedDragon,`${label}: an independent dragon pung must remain when present`);
   const due=result.analysis.total+8;assert.deepEqual(Object.values(result.settlement.deltas),selfDraw?[3*due,-due,-due,-due]:[-due,result.analysis.total+24,-8,-8],`${label}: four-seat payment`);
   allTypeChecks++;
  }
 }
 assert.equal(allTypeChecks,288,'six suit orders, six category variants and eight win/declaration combinations');
 console.log('PASS: '+count+' ordinary-fan sessions, '+halfFlushChecks+' Half Flush, '+allPungsChecks+' All Pungs, '+twoDragonChecks+' Two Dragons, '+meldedHandChecks+' Melded Hand and '+allTypeChecks+' all-types endings; declared-set boundaries, inventory, revisions and settlement.');
})().catch(error=>{console.error(error);process.exitCode=1;});
