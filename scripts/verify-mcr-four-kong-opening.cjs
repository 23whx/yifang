// Fan #05 from a legal authored four-seat opening, not a mid-hand injection.
// The four replacement tiles are deliberately at the tail of a full wall;
// this proves the action path, not the probability of a random seed.
// EMA rulebook: https://mahjong-europe.org/portal/images/docs/mcr_ENa5.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
(async()=>{
 const rules=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?rules:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](module,file):js(module,file);
 const {newMcrSession,mcrSessionView,actMcrSession}=require('../lib/mahjong/mcr-session.ts');
 const suits=['m','p','s'],orders=suits.flatMap(first=>suits.filter(second=>second!==first).map(second=>[first,second,suits.find(third=>third!==first&&third!==second)]));
 function opening(order,wind,dragon,kongCount){
  const original=newMcrSession(405),round=structuredClone(original.round),pool=[...analysis.createMcrTileSet()];
  const take=face=>{const at=pool.findIndex(t=>t.face===face);assert.ok(at>=0,face);return pool.splice(at,1)[0];};
  const faces=[`2${order[0]}`,`4${order[1]}`,`6${order[2]}`,wind],dealer=[...Array.from({length:4},()=>take(faces[0]))];
  for(const face of faces.slice(1))dealer.push(...Array.from({length:3},()=>take(face)));
  dealer.push(take(dragon));
  const replacement=[take(faces[1]),take(faces[2]),...(kongCount===4?[take(faces[3])]:[]),take(dragon)];
  const filler=count=>Array.from({length:count},()=>{
   const at=pool.findIndex(t=>analysis.isMcrStructureTile(t.face)&&!faces.includes(t.face)&&t.face!==dragon);
   assert.ok(at>=0,'enough ordinary filler');return pool.splice(at,1)[0];
  });
  round.hands={'seat-1':dealer,'seat-2':filler(13),'seat-3':filler(13),'seat-4':filler(13)};
  round.melds=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.flowers=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.wall=[...pool,...replacement.toReversed()];round.discardPile=[];
  Object.assign(round,{activePlayerId:'seat-1',phase:'discard',turnSource:'deal',drewThisTurn:true,
   lastDrawnTileId:dealer[3].id,pendingFlowerTileId:null,claimWindow:null,actionHistory:[],winResult:null,drawResult:null});
  return {session:{...original,round,opening:[]},faces,replacement};
 }
 const inventory=session=>{
  const r=session.round,tiles=[...r.wall,...r.discardPile,...Object.values(r.hands).flat(),...Object.values(r.melds).flat().flatMap(m=>m.tiles),...Object.values(r.flowers).flat()];
  assert.equal(tiles.length,144);assert.equal(new Set(tiles.map(t=>t.id)).size,144);
 };
 function step(session,type,predicate=()=>true){
  const before=JSON.stringify(session),choice=mcrSessionView(session,0).choices.find(c=>c.type===type&&predicate(c));
  assert.ok(choice,type);const next=actMcrSession(session,0,session.revision,choice.index);
  assert.equal(JSON.stringify(session),before);assert.equal(next.revision,session.revision+1);inventory(next);return next;
 }
 const points=(result,code)=>result.analysis.occurrences.filter(o=>o.fanCode==='mcr-'+String(code).padStart(2,'0')).reduce((sum,o)=>sum+o.points,0);
 let count=0;
 for(const order of orders)for(const wind of ['E','S','W','N'])for(const dragon of ['C','F','P'])for(const kongCount of [3,4]){
  const label=JSON.stringify({order,wind,dragon,kongCount}),built=opening(order,wind,dragon,kongCount);let session=built.session;inventory(session);
  assert.deepEqual(session.round.playerOrder.map(id=>session.round.hands[id].length),[14,13,13,13],label);
  assert.equal(session.round.wall.length,91,label);assert.equal(mcrSessionView(session,0).table.turnSource,'deal',label);
  for(let i=0;i<kongCount;i++){
   session=step(session,'declare-concealed-kong',c=>c.tileIds.every(id=>session.round.hands['seat-1'].find(t=>t.id===id)?.face===built.faces[i]));
   assert.equal(session.round.phase,'replacement',label);
   assert.equal(session.round.melds['seat-1'].filter(m=>m.kind==='kong'&&m.exposure==='concealed').length,i+1,label);
   session=step(session,'draw-replacement');assert.equal(session.round.lastDrawnTileId,built.replacement[i].id,label);
   assert.equal(session.round.phase,'discard',label);
  }
  session=step(session,'declare-self-draw');assert.equal(session.round.phase,'finished',label);
  const result=session.round.winResult,n=result.analysis.total;
  assert.equal(points(result,5),kongCount===4?88:0,`${label}: Four Kongs`);
  assert.equal(points(result,17),kongCount===3?32:0,`${label}: Three Kongs is included by Four Kongs`);
  if(kongCount===4)assert.equal(points(result,79),0,`${label}: Four Kongs excludes Single Wait`);
  assert.deepEqual(Object.values(result.settlement.deltas),[3*(n+8),-n-8,-n-8,-n-8],label);
  for(const seat of [0,1,2,3]){
   const before=JSON.stringify(session.round);session=actMcrSession(session,seat,session.revision,'confirm');
   assert.equal(JSON.stringify(session.round),before,`${label}: confirmation does not re-award points`);
  }
  assert.deepEqual(session.confirmed,[true,true,true,true],label);count++;
 }
 console.log(`PASS: ${count} legal authored openings -> three/four consecutive concealed-Kong declarations and wall-tail replacements -> self-draw -> four confirmations; Three Kongs 32 versus Four Kongs 88, lower exclusions, 144 unique tiles and exact payments. Not a random-seed claim.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
