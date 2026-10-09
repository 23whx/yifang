// EMA MCR fan 46 applies to the kong replacement itself, not a later flower
// replacement. Start with a full authored deal; no pre-existing melds/discards.
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const rules=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?rules:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {newMcrSession:create,mcrSessionView:view,actMcrSession:act}=require('../lib/mahjong/mcr-session.ts');
 const ids=['seat-1','seat-2','seat-3','seat-4'],suits=['mps','msp','pms','psm','smp','spm'];
 function inventory(s){const r=s.round,all=[...r.wall,...r.discardPile,...Object.values(r.hands).flat(),...Object.values(r.melds).flat().flatMap(m=>m.tiles),...Object.values(r.flowers).flat()];assert.equal(all.length,144);assert.equal(new Set(all.map(t=>t.id)).size,144);}
 function opening(suit,pair,dealer,offset,flowerCount){
  const original=create(620,dealer),r=structuredClone(original.round),pool=[...analysis.createMcrTileSet()],winner=(dealer+offset)%4;
  const take=face=>{const i=pool.findIndex(t=>t.face===face);assert.ok(i>=0,face);return pool.splice(i,1)[0];};
  const ready=[...Array(3).fill(`1${suit[0]}`),...Array(3).fill(`4${suit[1]}`),...Array(3).fill(`7${suit[2]}`),...Array(3).fill('C'),pair].map(take);
  const offered=take(`1${suit[0]}`),winning=take(pair);
  const flowers=Array.from({length:flowerCount},()=>{const i=pool.findIndex(t=>!analysis.isMcrStructureTile(t.face));return pool.splice(i,1)[0];});
  const filler=()=>{const i=pool.findIndex(t=>analysis.isMcrStructureTile(t.face));assert.ok(i>=0);return pool.splice(i,1)[0];};
  r.hands=Object.fromEntries(ids.map((id,i)=>[id,i===winner?ready:i===dealer?[offered]:[]]));
  for(let seat=0;seat<4;seat++)while(r.hands[ids[seat]].length<(seat===dealer?14:13))r.hands[ids[seat]].push(filler());
  r.melds=Object.fromEntries(ids.map(id=>[id,[]]));r.flowers=Object.fromEntries(ids.map(id=>[id,[]]));r.wall=[...pool,winning,...flowers.slice().reverse()];r.discardPile=[];
  Object.assign(r,{activePlayerId:ids[dealer],phase:'discard',turnSource:'deal',drewThisTurn:true,lastDrawnTileId:r.hands[ids[dealer]].at(-1).id,
   pendingFlowerTileId:null,claimWindow:null,actionHistory:[],winResult:null,drawResult:null});
  const session={...original,round:r,opening:[]};inventory(session);
  assert.deepEqual(ids.map(id=>r.hands[id].length),ids.map((_,i)=>i===dealer?14:13));assert.equal(r.wall.length,91);
  return {session,winner,offered,winning,flowers};
 }
 function step(s,trace,seat,type,predicate=()=>true){
  const c=view(s,seat).choices.find(c=>c.type===type&&predicate(c));assert.ok(c,`${type} seat ${seat} phase ${s.round.phase}`);
  const before=JSON.stringify(s),next=act(s,seat,s.revision,c.index);assert.equal(JSON.stringify(s),before);assert.equal(next.revision,s.revision+1);inventory(next);trace.push({seat,choice:c.index});return next;
 }
 let cases=0;
 for(const suit of suits)for(const pair of ['E','S','W','N'])for(let dealer=0;dealer<4;dealer++)for(const offset of [1,2,3])for(let flowerCount=0;flowerCount<=8;flowerCount++){
  const b=opening(suit,pair,dealer,offset,flowerCount),trace=[];let s=b.session;
  s=step(s,trace,dealer,'discard',c=>c.tileIds.includes(b.offered.id));
  s=step(s,trace,b.winner,'claim-discard',c=>c.claim==='kong');
  assert.equal(s.round.phase,'claim');assert.equal(s.round.melds[ids[b.winner]].length,0,'claim waits for other peers before adding the kong');
  assert.equal(view(s,b.winner).choices.length,0,'claimant cannot draw replacement prematurely');
  while(s.round.phase==='claim'){
   const passer=ids.findIndex((_,i)=>view(s,i).choices.some(c=>c.type==='pass-claim'));assert.ok(passer>=0);s=step(s,trace,passer,'pass-claim');
  }
  assert.equal(s.round.phase,'replacement');const kong=s.round.melds[ids[b.winner]][0];
  assert.equal(kong.kind,'kong');assert.equal(kong.exposure,'melded');assert.equal(kong.fromPlayerId,ids[dealer]);assert.equal(kong.claimedTileId,b.offered.id);
  assert.equal(kong.tiles.length,4);assert.ok(!s.round.discardPile.some(t=>t.id===b.offered.id));
  s=step(s,trace,b.winner,'draw-replacement');
  for(let n=0;n<flowerCount;n++){
   assert.equal(s.round.phase,'flower');assert.equal(s.round.pendingFlowerTileId,b.flowers[n].id);
   assert.ok(!view(s,b.winner).choices.some(c=>c.type==='declare-self-draw'));
   s=step(s,trace,b.winner,'replace-flower');assert.equal(s.round.flowers[ids[b.winner]].length,n+1);
  }
  assert.equal(s.round.lastDrawnTileId,b.winning.id);assert.equal(s.round.wall.length,90-flowerCount);
  assert.equal(s.round.turnSource,flowerCount?'flower-replacement':'kong-replacement');
  s=step(s,trace,b.winner,'declare-self-draw');const result=s.round.winResult;
  assert.equal(s.round.phase,'finished');assert.equal(result.winnerId,ids[b.winner]);assert.equal(result.discarderId,null);
  const expected=flowerCount?['mcr-33','mcr-49','mcr-52','mcr-59','mcr-73','mcr-74','mcr-79','mcr-80','mcr-81']:['mcr-33','mcr-46','mcr-49','mcr-52','mcr-59','mcr-73','mcr-74','mcr-79'];
  assert.deepEqual(result.analysis.fanCodes,expected,'flower replacement removes only the kong-win event and adds ordinary self-draw/flowers');
  const nonFlower=flowerCount?34:41,total=nonFlower+flowerCount,payment=total+8;
  assert.equal(result.analysis.nonFlowerTotal,nonFlower);assert.equal(result.analysis.flowerPoints,flowerCount);assert.equal(result.analysis.total,total);
  assert.equal(result.analysis.occurrences.filter(o=>o.fanCode==='mcr-81').length,flowerCount);
  assert.deepEqual(result.settlement.payments,Object.fromEntries(ids.map((id,i)=>[id,i===b.winner?0:payment])));
  assert.deepEqual(result.settlement.deltas,Object.fromEntries(ids.map((id,i)=>[id,i===b.winner?3*payment:-payment])));
  for(let seat=0;seat<4;seat++){const before=JSON.stringify(s.round);s=act(s,seat,s.revision,'confirm');trace.push({seat,choice:'confirm'});assert.equal(JSON.stringify(s.round),before);}
  let replay=structuredClone(b.session);for(const a of trace)replay=act(replay,a.seat,replay.revision,a.choice);assert.deepEqual(replay,s,'entire action history replays from the original complete deal');cases++;
 }
 console.log(`PASS: ${cases} complete authored opening replays: 6 suit permutations × 4 wind pairs × 4 dealers × 3 kong claimants × 0–8 consecutive replacement flowers; actual discard/kong responses/replacement/self-draw/confirmation, exact event exclusions, flowers, 144 physical tiles and four-seat payments. Not random-seed or browser evidence.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
