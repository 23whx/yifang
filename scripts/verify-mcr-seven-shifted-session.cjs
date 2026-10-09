// Authored 144-tile mid-hands: complete seven-shifted-pairs action chains.
// EMA Green Book fan 6 and its All Simples / Fully Concealed combinations.
const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load;
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?core:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 const js=require.extensions['.js'];require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {newMcrSession:create,mcrSessionView:view,actMcrSession:act}=require('../lib/mahjong/mcr-session.ts');
 function fixture(suit,start,selfDraw){
  const s=create(61),r=structuredClone(s.round),pool=[...analysis.createMcrTileSet()];
  const take=face=>{const i=pool.findIndex(t=>t.face===face);assert.ok(i>=0,face);return pool.splice(i,1)[0];};
  const faces=Array.from({length:7},(_,i)=>`${start+i}${suit}`).flatMap(face=>[face,face]);
  const hand=faces.map(take),winning=hand.pop(),winner=selfDraw?'seat-1':'seat-2';
  r.hands=Object.fromEntries(r.playerOrder.map(id=>[id,[]]));
  r.melds=Object.fromEntries(r.playerOrder.map(id=>[id,[]]));
  r.flowers=Object.fromEntries(r.playerOrder.map(id=>[id,[]]));
  r.hands[winner]=selfDraw?[...hand,winning]:hand;
  if(!selfDraw)r.hands['seat-1'].push(winning);
  for(const id of r.playerOrder)if(id!==winner)while(r.hands[id].length<(id==='seat-1'?selfDraw?13:14:13)){
   const i=pool.findIndex(t=>analysis.isMcrStructureTile(t.face)&&t.face!==winning.face);assert.ok(i>=0);
   r.hands[id].push(pool.splice(i,1)[0]);
  }
  r.wall=pool;r.discardPile=[];r.activePlayerId='seat-1';r.phase='discard';r.turnSource='wall';r.drewThisTurn=true;
  r.lastDrawnTileId=winning.id;r.pendingFlowerTileId=null;r.claimWindow=null;r.actionHistory=[];r.winResult=null;r.drawResult=null;
  return {session:{...s,round:r,opening:[]},winningId:winning.id};
 }
 function inventory(s){const r=s.round,tiles=[...r.wall,...r.discardPile,...Object.values(r.hands).flat(),...Object.values(r.melds).flat().flatMap(m=>m.tiles),...Object.values(r.flowers).flat()];assert.equal(tiles.length,144);assert.equal(new Set(tiles.map(t=>t.id)).size,144);}
 function step(s,seat,type,predicate=()=>true){const before=JSON.stringify(s),choice=view(s,seat).choices.find(c=>c.type===type&&predicate(c));assert.ok(choice,`${type} seat ${seat}`);const next=act(s,seat,s.revision,choice.index);assert.equal(JSON.stringify(s),before,'prior session immutable');assert.equal(next.revision,s.revision+1);inventory(next);return next;}
 let cases=0;
 for(const suit of ['m','p','s'])for(const start of [1,2,3])for(const selfDraw of [false,true]){
  const f=fixture(suit,start,selfDraw);let s=f.session;inventory(s);
  if(selfDraw)s=step(s,0,'declare-self-draw');
  else{
   s=step(s,0,'discard',c=>c.tileIds.includes(f.winningId));
   s=step(s,1,'claim-discard',c=>c.claim==='win');
   for(const seat of [2,3])if(s.round.phase==='claim')s=step(s,seat,'pass-claim');
  }
  assert.equal(s.round.phase,'finished');
  const result=s.round.winResult,points=(start===2?90:88)+(selfDraw?4:0),codes=result.analysis.fanCodes;
  assert.equal(result.winnerId,selfDraw?'seat-1':'seat-2');
  assert.equal(result.discarderId,selfDraw?null:'seat-1');
  assert.equal(result.analysis.nonFlowerTotal,points);
  assert.ok(codes.includes('mcr-06'));
  assert.equal(codes.includes('mcr-68'),start===2);
  assert.equal(codes.includes('mcr-56'),selfDraw);
  for(const code of ['mcr-19','mcr-22','mcr-62','mcr-76','mcr-79','mcr-80'])assert.ok(!codes.includes(code),`${suit}/${start}/${selfDraw}: ${code}`);
  assert.deepEqual(Object.values(result.settlement.deltas),selfDraw?[3*(points+8),-points-8,-points-8,-points-8]:[-points-8,points+24,-8,-8]);
  cases++;
 }
 console.log(`PASS: ${cases} physical-144-tile authored mid-hand seven-shifted-pair self-draw / discard-claim transitions; exact fans, payments, immutable revisions. Not seeded-opening reachability or browser evidence.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
