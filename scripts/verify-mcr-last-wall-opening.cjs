// An authored complete four-seat starting deal, then every ordinary wall draw.
// This proves the last-wall action chain, not random-seed frequency.
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
(async()=>{
 const rules=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?rules:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](module,file):js(module,file);
 const {newMcrSession,mcrSessionView,actMcrSession}=require('../lib/mahjong/mcr-session.ts');
 const ids=['seat-1','seat-2','seat-3','seat-4'];
 function opening(kind,suit){
  const original=newMcrSession(711),round=structuredClone(original.round),pool=[...analysis.createMcrTileSet()];
  const take=face=>{const at=pool.findIndex(tile=>tile.face===face);assert.ok(at>=0,face);return pool.splice(at,1)[0];};
  const winner=kind==='self'?'seat-4':'seat-2';
  const ready=[...Array(3).fill(`1${suit}`),...Array(3).fill('2p'),...Array(3).fill('3s'),...Array(3).fill('C'),'E'];
  const hand=ready.map(take),lastTile=take('E');
  const flowers=pool.filter(tile=>!analysis.isMcrStructureTile(tile.face));
  for(const flower of flowers)pool.splice(pool.indexOf(flower),1);
  const filler=count=>Array.from({length:count},()=>pool.shift());
  round.hands=Object.fromEntries(ids.map(id=>[id,id===winner?hand:filler(id==='seat-1'?14:13)]));
  round.flowers=Object.fromEntries(ids.map((id,i)=>[id,flowers.slice(i*2,i*2+2)]));
  round.melds=Object.fromEntries(ids.map(id=>[id,[]]));
  // Normal draws shift from the wall's head, so this tile is drawn last.
  round.wall=[...pool,lastTile];round.discardPile=[];
  Object.assign(round,{activePlayerId:'seat-1',phase:'discard',turnSource:'deal',drewThisTurn:true,
   lastDrawnTileId:round.hands['seat-1'].at(-1).id,pendingFlowerTileId:null,claimWindow:null,actionHistory:[],winResult:null,drawResult:null});
  assert.deepEqual(ids.map(id=>round.hands[id].length),[14,13,13,13]);assert.equal(round.wall.length,83);
  return {session:{...original,round,opening:[]},lastTile,winner};
 }
 function inventory(session){
  const r=session.round,tiles=[...r.wall,...r.discardPile,...Object.values(r.hands).flat(),...Object.values(r.melds).flat().flatMap(m=>m.tiles),...Object.values(r.flowers).flat()];
  assert.equal(tiles.length,144);assert.equal(new Set(tiles.map(tile=>tile.id)).size,144);
 }
 function step(session,seat,type,predicate=()=>true){
  const before=JSON.stringify(session),choice=mcrSessionView(session,seat).choices.find(c=>c.type===type&&predicate(c));
  assert.ok(choice,`${type} seat ${seat}, wall ${session.round.wall.length}`);
  const next=actMcrSession(session,seat,session.revision,choice.index);
  assert.equal(JSON.stringify(session),before);assert.equal(next.revision,session.revision+1);inventory(next);return next;
 }
 function settleClaims(session,winningSeat){
  while(session.round.phase==='claim'){
   let responded=false;
   for(let seat=0;seat<4;seat++){
    const choices=mcrSessionView(session,seat).choices;
    const win=seat===winningSeat?choices.find(c=>c.type==='claim-discard'&&c.claim==='win'):null;
    if(win){session=step(session,seat,'claim-discard',c=>c.claim==='win');responded=true;break;}
    if(choices.some(c=>c.type==='pass-claim')){session=step(session,seat,'pass-claim');responded=true;break;}
   }
   assert.ok(responded,'claim window can advance');
  }
  return session;
 }
 let count=0;
 for(const kind of ['self','discard'])for(const suit of ['m','p','s']){
  const built=opening(kind,suit);let session=built.session;inventory(session);
  session=step(session,0,'discard',c=>c.tileIds.includes(built.session.round.hands['seat-1'].at(-1).id));
  session=settleClaims(session,-1);
  for(let draw=1;draw<=83;draw++){
   const seat=draw%4,wallBefore=session.round.wall.length;
   assert.equal(wallBefore,84-draw);assert.equal(session.round.activePlayerId,ids[seat]);
   session=step(session,seat,'draw');
   const drawnId=session.round.lastDrawnTileId;
   if(draw===83){
    assert.equal(seat,3);assert.equal(drawnId,built.lastTile.id);assert.equal(session.round.wall.length,0);
    if(kind==='self')session=step(session,seat,'declare-self-draw');
    else {
     session=step(session,seat,'discard',c=>c.tileIds.includes(drawnId));
     session=settleClaims(session,1);
    }
   }else{
    session=step(session,seat,'discard',c=>c.tileIds.includes(drawnId));
    session=settleClaims(session,-1);
   }
  }
  assert.equal(session.round.phase,'finished');
  const result=session.round.winResult,codes=result.analysis.fanCodes;
  assert.equal(result.winnerId,built.winner);
  assert.equal(codes.includes('mcr-44'),kind==='self');
  assert.equal(codes.includes('mcr-45'),kind==='discard');
  assert.ok(!codes.includes('mcr-46')&&!codes.includes('mcr-47'));
  const eventCode=kind==='self'?'mcr-44':'mcr-45';
  assert.equal(result.analysis.occurrences.filter(o=>o.fanCode===eventCode).reduce((sum,o)=>sum+o.points,0),8);
  const n=result.analysis.total,expected=kind==='self'?
   Object.fromEntries(ids.map(id=>[id,id===built.winner?3*(n+8):-n-8])):
   Object.fromEntries(ids.map(id=>[id,id===built.winner?n+24:id==='seat-4'?-n-8:-8]));
  assert.deepEqual(result.settlement.deltas,expected);
  for(let seat=0;seat<4;seat++){
   const before=JSON.stringify(session.round);session=actMcrSession(session,seat,session.revision,'confirm');
   assert.equal(JSON.stringify(session.round),before);
  }
  assert.deepEqual(session.confirmed,[true,true,true,true]);count++;
 }
 console.log(`PASS: ${count} authored complete four-seat openings -> all 83 wall draws with intervening discards -> last-wall self-draw/discard win -> four confirmations; exact fans, 144 unique tiles and payments. Not a random-seed claim.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
