// Complete authored starting deals, with no pre-existing melds or discards.
// Every pung, draw and added-kong response is performed through session actions.
// EMA MCR fan 47: rob an added tile of a melded pung; do not also count Last Tile.
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const rules=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?rules:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {newMcrSession:create,mcrSessionView:view,actMcrSession:act}=require('../lib/mahjong/mcr-session.ts');
 const ids=['seat-1','seat-2','seat-3','seat-4'],orphans=['1m','9m','1p','9p','1s','9s','E','S','W','N','C','F','P'];
 function inventory(s){
  const r=s.round,all=[...r.wall,...r.discardPile,...Object.values(r.hands).flat(),...Object.values(r.melds).flat().flatMap(m=>m.tiles),...Object.values(r.flowers).flat()];
  assert.equal(all.length,144);assert.equal(new Set(all.map(t=>t.id)).size,144);
 }
 function opening(face,dealer,offset){
  const original=create(918,dealer),r=structuredClone(original.round),pool=[...analysis.createMcrTileSet()];
  const owner=dealer,donor=(dealer+3)%4,winner=(dealer+offset)%4;
  const take=face=>{const at=pool.findIndex(t=>t.face===face);assert.ok(at>=0,face);return pool.splice(at,1)[0];};
  const pair=face==='E'?'S':'E',ready=[...orphans.filter(f=>f!==face),pair].map(take);
  const two=[take(face),take(face)],offered=take(face),fourth=take(face);
  const filler=()=>{const at=pool.findIndex(t=>analysis.isMcrStructureTile(t.face));assert.ok(at>=0);return pool.splice(at,1)[0];};
  const early=Array.from({length:6},filler),replacement=filler();
  r.hands=Object.fromEntries(ids.map((id,i)=>[id,i===winner?ready:i===owner?[...two]:i===donor?[offered]:[]]));
  for(let seat=0;seat<4;seat++)while(r.hands[ids[seat]].length<(seat===owner?14:13))r.hands[ids[seat]].push(filler());
  r.melds=Object.fromEntries(ids.map(id=>[id,[]]));r.flowers=Object.fromEntries(ids.map(id=>[id,[]]));
  r.wall=[...early,fourth,...pool,replacement];r.discardPile=[];
  Object.assign(r,{activePlayerId:ids[owner],phase:'discard',turnSource:'deal',drewThisTurn:true,lastDrawnTileId:r.hands[ids[owner]].at(-1).id,
   pendingFlowerTileId:null,claimWindow:null,actionHistory:[],winResult:null,drawResult:null});
  const session={...original,round:r,opening:[]};
  assert.deepEqual(ids.map(id=>r.hands[id].length),ids.map((_,i)=>i===owner?14:13));assert.equal(r.wall.length,91);inventory(session);
  return {session,owner,donor,winner,offered,fourth,replacement};
 }
 function step(s,trace,seat,type,predicate=()=>true){
  const c=view(s,seat).choices.find(c=>c.type===type&&predicate(c));assert.ok(c,`${type} seat ${seat} phase ${s.round.phase}`);
  const before=JSON.stringify(s),next=act(s,seat,s.revision,c.index);
  assert.equal(JSON.stringify(s),before);assert.equal(next.revision,s.revision+1);inventory(next);trace.push({seat,choice:c.index});return next;
 }
 function responses(s,trace,seat=-1,claim=null){
  if(seat>=0)s=step(s,trace,seat,claim==='rob'?'claim-added-kong-win':'claim-discard',c=>claim==='rob'||c.claim===claim);
  let guard=0;
  while(s.round.phase==='claim'){
   assert.ok(guard++<4);const passer=ids.findIndex((_,i)=>view(s,i).choices.some(c=>c.type==='pass-claim'));
   assert.ok(passer>=0,'pending response exists');s=step(s,trace,passer,'pass-claim');
  }
  return s;
 }
 function discard(s,trace,seat,tile){return responses(step(s,trace,seat,'discard',c=>c.tileIds.includes(tile)),trace);}
 function replay(initial,trace,expected){
  let s=structuredClone(initial);for(const a of trace)s=act(s,a.seat,s.revision,a.choice);
  assert.deepEqual(s,expected,'all recorded actions replay from the unmodified complete starting deal');
 }
 let paths=0;
 for(const face of orphans)for(let dealer=0;dealer<4;dealer++)for(const offset of [1,2]){
  const b=opening(face,dealer,offset),trace=[];let s=b.session;
  s=discard(s,trace,b.owner,s.round.hands[ids[b.owner]].at(-1).id);
  for(let offset=1;offset<=3;offset++){
   const seat=(dealer+offset)%4;s=step(s,trace,seat,'draw');
   if(seat===b.donor){
    s=step(s,trace,seat,'discard',c=>c.tileIds.includes(b.offered.id));
    assert.ok(view(s,b.winner).choices.some(c=>c.claim==='win'),'orphans could win the earlier discard but deliberately pass');
    s=responses(s,trace,b.owner,'pung');
   }else s=discard(s,trace,seat,s.round.lastDrawnTileId);
  }
  const pung=s.round.melds[ids[b.owner]][0];assert.equal(pung.kind,'pung');assert.equal(pung.fromPlayerId,ids[b.donor]);
  assert.equal(pung.claimedTileId,b.offered.id);assert.equal(pung.tiles.length,3);
  assert.equal(s.round.activePlayerId,ids[b.owner]);
  s=discard(s,trace,b.owner,s.round.hands[ids[b.owner]].at(-1).id);
  for(let offset=1;offset<=3;offset++){
   const seat=(dealer+offset)%4;s=step(s,trace,seat,'draw');s=discard(s,trace,seat,s.round.lastDrawnTileId);
  }
  s=step(s,trace,b.owner,'draw');assert.equal(s.round.lastDrawnTileId,b.fourth.id);assert.equal(s.round.wall.length,84);
  for(const branch of ['rob','ordinary','pass']){
   let end=structuredClone(s),record=[...trace];const wallBefore=end.round.wall.length;
   if(branch==='ordinary'){
    end=step(end,record,b.owner,'discard',c=>c.tileIds.includes(b.fourth.id));end=responses(end,record,b.winner,'win');
   }else{
    end=step(end,record,b.owner,'declare-added-kong',c=>c.tileIds.includes(b.fourth.id));
    assert.equal(end.round.melds[ids[b.owner]][0].kind,'pung','pending added kong has not committed');
    assert.equal(end.round.wall.length,wallBefore);
    assert.ok(view(end,b.winner).choices.some(c=>c.type==='claim-added-kong-win'));
    assert.equal(view(end,b.owner).choices.length,0,'kong owner cannot draw or discard during peer responses');
    const pending=JSON.stringify(end);assert.throws(()=>act(end,b.owner,end.revision,0),/Unavailable/);assert.equal(JSON.stringify(end),pending);
    end=responses(end,record,branch==='rob'?b.winner:-1,branch==='rob'?'rob':null);
   }
   if(branch==='pass'){
    assert.equal(end.round.phase,'replacement');assert.equal(end.round.winResult,null);
    const kong=end.round.melds[ids[b.owner]][0];assert.equal(kong.kind,'kong');assert.equal(kong.tiles.length,4);
    assert.ok(kong.tiles.some(t=>t.id===b.fourth.id));assert.equal(end.round.wall.length,wallBefore);
    end=step(end,record,b.owner,'draw-replacement');assert.equal(end.round.lastDrawnTileId,b.replacement.id);
    assert.equal(end.round.turnSource,'kong-replacement');assert.equal(end.round.wall.length,wallBefore-1);
   }else{
    assert.equal(end.round.phase,'finished');assert.equal(end.round.wall.length,wallBefore,'winning claim never draws a replacement');
    assert.equal(end.round.melds[ids[b.owner]][0].kind,'pung');
    assert.ok(!end.round.hands[ids[b.owner]].some(t=>t.id===b.fourth.id));
    assert.ok(end.round.hands[ids[b.winner]].some(t=>t.id===b.fourth.id),'fourth physical tile belongs to winner');
    const result=end.round.winResult,total=branch==='rob'?96:92;
    assert.equal(result.winnerId,ids[b.winner]);assert.equal(result.discarderId,ids[b.owner]);
    assert.deepEqual(result.analysis.fanCodes,['mcr-07',branch==='rob'?'mcr-47':'mcr-58']);
    assert.equal(result.analysis.nonFlowerTotal,total);assert.equal(result.analysis.total,total);
    assert.deepEqual(result.settlement.deltas,Object.fromEntries(ids.map((id,i)=>[id,i===b.winner?total+24:i===b.owner?-total-8:-8])));
    for(let seat=0;seat<4;seat++){
     const old=JSON.stringify(end.round);end=act(end,seat,end.revision,'confirm');record.push({seat,choice:'confirm'});
     assert.equal(JSON.stringify(end.round),old,'confirmation does not repeat settlement');
    }
    assert.deepEqual(end.confirmed,[true,true,true,true]);
    const finished=JSON.stringify(end);assert.throws(()=>act(end,b.winner,end.revision,'confirm'),/No unconfirmed/);assert.equal(JSON.stringify(end),finished);
   }
   replay(b.session,record,end);paths++;
  }
 }
 console.log(`PASS: ${paths} paths from 104 complete authored openings (13 terminal/honor faces × 4 dealers × 2 claimant seats): actual pung, seven wall draws, added-kong robbery versus ordinary last-copy win versus all-pass commitment/replacement; exact tile ownership, fans, payments, confirmations and opening replay. Not random-seed or browser evidence.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
