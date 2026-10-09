const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load;
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?core:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 const js=require.extensions['.js'];require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);

 const {newMcrSession:create,mcrSessionView:view,actMcrSession:act}=require('../lib/mahjong/mcr-session.ts');
 function fixture(visible){
  const s=create(42),r=structuredClone(s.round),pool=[...analysis.createMcrTileSet()];
  const take=face=>{const i=pool.findIndex(t=>t.face===face);assert.ok(i>=0);return pool.splice(i,1)[0];};
  r.hands=Object.fromEntries(r.playerOrder.map(id=>[id,[]]));
  r.hands['seat-1']=['1m','2m','3m','4p','5p','6p','7s','8s','9s','E','E'].map(take);
  const pung=['C','C','C'].map(take);r.melds=Object.fromEntries(r.playerOrder.map(id=>[id,[]]));
  r.melds['seat-1']=[{kind:'pung',exposure:'melded',tiles:pung,claimedTileId:pung[0].id,fromPlayerId:'seat-2'}];
  r.discardPile=Array.from({length:visible},()=>take('3m'));
  for(const id of r.playerOrder.slice(1))while(r.hands[id].length<13){const i=pool.findIndex(t=>analysis.isMcrStructureTile(t.face)&&t.face!=='3m');r.hands[id].push(pool.splice(i,1)[0]);}
  r.wall=pool;r.flowers=Object.fromEntries(r.playerOrder.map(id=>[id,[]]));
  r.activePlayerId='seat-1';r.phase='discard';r.turnSource='wall';r.drewThisTurn=true;r.lastDrawnTileId=r.hands['seat-1'].find(t=>t.face==='3m').id;
  r.pendingFlowerTileId=null;r.claimWindow=null;r.actionHistory=[];r.winResult=null;r.drawResult=null;
  const all=[...r.wall,...r.discardPile,...Object.values(r.hands).flat(),...Object.values(r.melds).flat().flatMap(m=>m.tiles)];
  assert.equal(all.length,144);assert.equal(new Set(all.map(t=>t.id)).size,144);
  return {...s,round:r,opening:[]};
 }
 const results=[];
 for(const visible of [2,3]){
 const s=fixture(visible),c=view(s,0).choices.find(c=>c.type==='declare-self-draw');assert.ok(c);
  if(visible===3){const old=core.createMcrRoundPlayerView(s.round,'seat-1').legalActions.selfDrawAnalysis;assert.ok(old);assert.ok(!old.fanCodes.includes('mcr-58'),'Pinned upstream reproduces omitted self-draw Last Tile');}
  const next=act(s,0,s.revision,c.index);assert.equal(next.round.phase,'finished');
  const a=next.round.winResult.analysis;assert.equal(a.fanCodes.includes('mcr-58'),visible===3);results.push(a.nonFlowerTotal);
  assert.equal(s.round.phase,'discard');
 }
 assert.equal(results[1]-results[0],4);
 // The same three physical copies can be visible in an opponent's open pung
 // or hidden in their hand. Never use omniscient host inventory as visibility.
 const locations=[];
 for(const location of ['open-pung','concealed-hand']){
  const s=fixture(3),r=s.round,tiles=r.discardPile.splice(0);
  r.wall.push(...r.hands['seat-2'].splice(0,3));
  if(location==='open-pung')r.melds['seat-2']=[{kind:'pung',exposure:'melded',tiles,claimedTileId:tiles[0].id,fromPlayerId:'seat-3'}];
  else r.hands['seat-2'].push(...tiles);
  const inventory=[...r.wall,...r.discardPile,...Object.values(r.hands).flat(),...Object.values(r.melds).flat().flatMap(m=>m.tiles)];
  assert.equal(inventory.length,144);assert.equal(new Set(inventory.map(t=>t.id)).size,144);
  const choice=view(s,0).choices.find(c=>c.type==='declare-self-draw');assert.ok(choice,location);
  const next=act(s,0,s.revision,choice.index),a=next.round.winResult.analysis;
  assert.equal(a.fanCodes.includes('mcr-58'),location==='open-pung',location);
  locations.push(a.nonFlowerTotal);
 }
 assert.equal(locations[0]-locations[1],4,'Open pung vs private hand must differ by exactly Last Tile');
 function discardFixture(visible){
  const s=create(43),r=structuredClone(s.round),pool=[...analysis.createMcrTileSet()];
  const take=face=>{const i=pool.findIndex(t=>t.face===face);assert.ok(i>=0,face);return pool.splice(i,1)[0];};
  r.hands=Object.fromEntries(r.playerOrder.map(id=>[id,[]]));
  r.melds=Object.fromEntries(r.playerOrder.map(id=>[id,[]]));
  r.flowers=Object.fromEntries(r.playerOrder.map(id=>[id,[]]));
  r.hands['seat-2']=['1m','2m','4p','4p','4p','7s','7s','7s','C','C','C','E','E'].map(take);
  r.discardPile=Array.from({length:visible},()=>take('3m'));
  const winning=take('3m');r.hands['seat-1'].push(winning);
  for(const id of r.playerOrder)if(id!=='seat-2')while(r.hands[id].length<(id==='seat-1'?14:13)){
   const i=pool.findIndex(t=>analysis.isMcrStructureTile(t.face)&&t.face!=='3m');assert.ok(i>=0);r.hands[id].push(pool.splice(i,1)[0]);
  }
  r.wall=pool;r.activePlayerId='seat-1';r.phase='discard';r.turnSource='wall';r.drewThisTurn=true;r.lastDrawnTileId=winning.id;
  r.pendingFlowerTileId=null;r.claimWindow=null;r.actionHistory=[];r.winResult=null;r.drawResult=null;
  return {session:{...s,round:r,opening:[]},winningId:winning.id};
 }
 function inventory(s){const r=s.round,tiles=[...r.wall,...r.discardPile,...Object.values(r.hands).flat(),...Object.values(r.melds).flat().flatMap(m=>m.tiles),...Object.values(r.flowers).flat()];assert.equal(tiles.length,144);assert.equal(new Set(tiles.map(t=>t.id)).size,144);}
 function step(s,seat,type,predicate=()=>true){const before=JSON.stringify(s),choice=view(s,seat).choices.find(c=>c.type===type&&predicate(c));assert.ok(choice,`${type} seat ${seat}`);const next=act(s,seat,s.revision,choice.index);assert.equal(JSON.stringify(s),before);assert.equal(next.revision,s.revision+1);inventory(next);return next;}
 const discardResults=[];
 for(const visible of [2,3]){
  const fixture=discardFixture(visible);let s=fixture.session;inventory(s);
  s=step(s,0,'discard',c=>c.tileIds.includes(fixture.winningId));
  s=step(s,1,'claim-discard',c=>c.claim==='win');
  for(const seat of [2,3])if(s.round.phase==='claim')s=step(s,seat,'pass-claim');
  assert.equal(s.round.phase,'finished');assert.equal(s.round.winResult.winnerId,'seat-2');assert.equal(s.round.winResult.discarderId,'seat-1');
  const result=s.round.winResult;assert.equal(result.analysis.fanCodes.includes('mcr-58'),visible===3);
  discardResults.push({points:result.analysis.nonFlowerTotal,deltas:Object.values(result.settlement.deltas)});
 }
 assert.equal(discardResults[1].points-discardResults[0].points,4,'Only the third previously public copy adds Last Tile');
 assert.deepEqual(discardResults[1].deltas.map((amount,i)=>amount-discardResults[0].deltas[i]),[-4,4,0,0],'Discarder alone pays the additional four fan points');
 console.log('PASS: identical 144-tile inventory relocated into opponent open pung versus private hand; only public pung earns +4.');
 console.log('PASS: physical-inventory-valid self-draw transition with 2 versus 3 publicly visible copies, exact +4 Last Tile points and unchanged prior state. Authored mid-hand fixture, not a replayed opening.');
 console.log('PASS: physical-inventory-valid discard, win claim and two passes with 2 versus 3 previously visible copies; exact +4 fan points and discarder-only +4 payment. Authored mid-hand fixture, not a replayed opening.');
})().catch(e=>{console.error(e);process.exitCode=1;});
