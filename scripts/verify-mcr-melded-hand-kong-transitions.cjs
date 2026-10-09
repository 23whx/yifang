// MCR #53 requires all four groups to be melded. Declaring a concealed Kong
// during play must not turn three exposed Chows into a Melded Hand.
// EMA Green Book: https://mahjong-europe.org/portal/images/docs/mcr_ENa5.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
(async()=>{
 const rules=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?rules:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](module,file):js(module,file);
 const {newMcrSession,mcrSessionView,actMcrSession}=require('../lib/mahjong/mcr-session.ts');
 const suits=['m','p','s'],orders=suits.flatMap(first=>suits.filter(second=>second!==first).map(second=>[first,second,suits.find(third=>third!==first&&third!==second)]));
 const inventory=session=>{const r=session.round,tiles=[...r.wall,...r.discardPile,...Object.values(r.hands).flat(),...Object.values(r.melds).flat().flatMap(m=>m.tiles),...Object.values(r.flowers).flat()];assert.equal(tiles.length,144);assert.equal(new Set(tiles.map(t=>t.id)).size,144);};
 const points=(result,code)=>result.analysis.occurrences.filter(o=>o.fanCode==='mcr-'+String(code).padStart(2,'0')).reduce((sum,o)=>sum+o.points,0);
 function fixture(order,wind){
  const original=newMcrSession(153),r=structuredClone(original.round),pool=[...analysis.createMcrTileSet()];
  const take=face=>{const at=pool.findIndex(t=>t.face===face);assert.ok(at>=0,face);return pool.splice(at,1)[0];};
  const filler=()=>{const at=pool.findIndex(t=>analysis.isMcrStructureTile(t.face)&&t.face!=='C'&&t.face!==wind);assert.ok(at>=0);return pool.splice(at,1)[0];};
  r.hands=Object.fromEntries(r.playerOrder.map(id=>[id,[]]));r.melds=Object.fromEntries(r.playerOrder.map(id=>[id,[]]));r.flowers=Object.fromEntries(r.playerOrder.map(id=>[id,[]]));
  for(const [index,suit] of order.entries()){
   const first=[1,4,7][index],tiles=[first,first+1,first+2].map(n=>take(`${n}${suit}`));
   r.melds['seat-1'].push({kind:'chow',exposure:'melded',tiles,claimedTileId:tiles[0].id,fromPlayerId:'seat-3'});
  }
  const concealedKong=Array.from({length:4},()=>take(wind));r.hands['seat-1'].push(...concealedKong,take('C'));
  const winning=take('C');r.hands['seat-2'].push(winning);
  for(const id of r.playerOrder.slice(1))while(r.hands[id].length<13)r.hands[id].push(filler());
  const replacement=filler(),nextDraw=filler();r.wall=[nextDraw,...pool,replacement];r.discardPile=[];
  Object.assign(r,{activePlayerId:'seat-1',phase:'discard',turnSource:'wall',drewThisTurn:true,
   lastDrawnTileId:concealedKong[3].id,pendingFlowerTileId:null,claimWindow:null,actionHistory:[],winResult:null,drawResult:null});
  return {session:{...original,round:r,opening:[]},replacementId:replacement.id,winningId:winning.id,nextDrawId:nextDraw.id};
 }
 function step(session,seat,type,predicate=()=>true){
  const before=JSON.stringify(session),choice=mcrSessionView(session,seat).choices.find(c=>c.type===type&&predicate(c));
  assert.ok(choice,`${type} seat ${seat}`);const next=actMcrSession(session,seat,session.revision,choice.index);
  assert.equal(JSON.stringify(session),before);assert.equal(next.revision,session.revision+1);inventory(next);return next;
 }
 let count=0;
 for(const order of orders)for(const wind of ['E','S','W','N']){
  const label=JSON.stringify({order,wind}),built=fixture(order,wind);let session=built.session;inventory(session);
  session=step(session,0,'declare-concealed-kong');assert.equal(session.round.phase,'replacement',label);
  assert.equal(session.round.melds['seat-1'][3].exposure,'concealed');
  session=step(session,0,'draw-replacement');assert.equal(session.round.lastDrawnTileId,built.replacementId,label);
  session=step(session,0,'discard',c=>c.tileIds.includes(built.replacementId));
  for(const seat of [1,2,3])session=step(session,seat,'pass-claim');
  assert.equal(session.round.phase,'draw',label);assert.equal(session.round.activePlayerId,'seat-2',label);
  session=step(session,1,'draw');assert.equal(session.round.lastDrawnTileId,built.nextDrawId,label);
  session=step(session,1,'discard',c=>c.tileIds.includes(built.winningId));
  assert.ok(mcrSessionView(session,0).choices.some(c=>c.type==='claim-discard'&&c.claim==='win'),`${label}: still a legal win`);
  session=step(session,0,'claim-discard',c=>c.claim==='win');
  for(const seat of [2,3])if(session.round.phase==='claim')session=step(session,seat,'pass-claim');
  assert.equal(session.round.phase,'finished',label);const result=session.round.winResult;
  assert.equal(points(result,53),0,`${label}: actual concealed Kong must not count as fully melded`);
  assert.equal(points(result,39),8,`${label}: independent Mixed Straight clears the minimum`);
  assert.equal(points(result,67),2,`${label}: concealed Kong still scores on its own`);
  assert.equal(points(result,46),0,`${label}: later discard win is not an immediate Kong replacement win`);
  const n=result.analysis.total;assert.deepEqual(Object.values(result.settlement.deltas),[n+24,-n-8,-8,-8],label);
  count++;
 }
 console.log(`PASS: ${count} authored three-exposed-Chow -> real concealed-Kong -> replacement -> discard -> opponent draw/discard -> claim-win sequences; Melded Hand rejected, Mixed Straight and concealed Kong retained, 144 tiles and exact payment. Not a random opening replay.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
