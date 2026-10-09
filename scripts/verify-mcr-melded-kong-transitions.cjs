// EMA Green Book 3.6.8 and fan 46: claiming a fourth tile from a discard
// requires a replacement draw; a subsequent flower replacement is NOT fan 46.
// https://mahjong-europe.org/portal/images/docs/mcr_EN.pdf
const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load;
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?core:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 const js=require.extensions['.js'];require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {newMcrSession:create,mcrSessionView:view,actMcrSession:act}=require('../lib/mahjong/mcr-session.ts');
 function inventory(s){const r=s.round,tiles=[...r.wall,...r.discardPile,...Object.values(r.hands).flat(),...Object.values(r.melds).flat().flatMap(m=>m.tiles),...Object.values(r.flowers).flat()];assert.equal(tiles.length,144);assert.equal(new Set(tiles.map(t=>t.id)).size,144);}
 function fixture(last,flowerCount){
  const s=create(41),r=structuredClone(s.round),pool=[...analysis.createMcrTileSet()];
  const take=face=>{const i=pool.findIndex(t=>t.face===face);assert.ok(i>=0,face);return pool.splice(i,1)[0];};
  r.hands=Object.fromEntries(r.playerOrder.map(id=>[id,[]]));r.melds=Object.fromEntries(r.playerOrder.map(id=>[id,[]]));r.flowers=Object.fromEntries(r.playerOrder.map(id=>[id,[]]));
  r.hands['seat-2']=['1m','1m','1m','4p','4p','4p','7s','7s','7s','C','C','C','E'].map(take);
  const discard=take('1m'),winning=take('E');r.hands['seat-1'].push(discard);
  const flowers=Array.from({length:flowerCount},()=>pool.splice(pool.findIndex(t=>!analysis.isMcrStructureTile(t.face)),1)[0]);
  for(const id of r.playerOrder)if(id!=='seat-2')while(r.hands[id].length<(id==='seat-1'?14:13)){const i=pool.findIndex(t=>analysis.isMcrStructureTile(t.face));r.hands[id].push(pool.splice(i,1)[0]);}
  const spare=last?[]:[pool.splice(pool.findIndex(t=>analysis.isMcrStructureTile(t.face)),1)[0]];
  r.wall=[...spare,winning,...flowers];
  r.discardPile=pool.filter(t=>analysis.isMcrStructureTile(t.face));r.flowers['seat-4']=pool.filter(t=>!analysis.isMcrStructureTile(t.face));
  r.activePlayerId='seat-1';r.phase='discard';r.turnSource='wall';r.drewThisTurn=true;r.lastDrawnTileId=discard.id;r.pendingFlowerTileId=null;r.claimWindow=null;r.actionHistory=[];r.winResult=null;r.drawResult=null;
  const session={...s,round:r,opening:[]};inventory(session);return {session,discardId:discard.id};
 }
 function addedFixture(last,flowerCount){
  const s=create(43),r=structuredClone(s.round),pool=[...analysis.createMcrTileSet()];
  const take=face=>{const i=pool.findIndex(t=>t.face===face);assert.ok(i>=0,face);return pool.splice(i,1)[0];};
  r.hands=Object.fromEntries(r.playerOrder.map(id=>[id,[]]));r.melds=Object.fromEntries(r.playerOrder.map(id=>[id,[]]));r.flowers=Object.fromEntries(r.playerOrder.map(id=>[id,[]]));
  const openPung=['1m','1m','1m'].map(take),fourth=take('1m');
  r.melds['seat-1']=[{kind:'pung',exposure:'melded',tiles:openPung,claimedTileId:openPung[0].id,fromPlayerId:'seat-2'}];
  r.hands['seat-1']=[fourth,...['4p','4p','4p','7s','7s','7s','C','C','C','E'].map(take)];
  const winning=take('E'),flowers=Array.from({length:flowerCount},()=>pool.splice(pool.findIndex(t=>!analysis.isMcrStructureTile(t.face)),1)[0]);
  for(const id of r.playerOrder)if(id!=='seat-1')while(r.hands[id].length<13){const i=pool.findIndex(t=>analysis.isMcrStructureTile(t.face));r.hands[id].push(pool.splice(i,1)[0]);}
  const spare=last?[]:[pool.splice(pool.findIndex(t=>analysis.isMcrStructureTile(t.face)),1)[0]];
  r.wall=[...spare,winning,...flowers];r.discardPile=pool.filter(t=>analysis.isMcrStructureTile(t.face));r.flowers['seat-4']=pool.filter(t=>!analysis.isMcrStructureTile(t.face));
  r.activePlayerId='seat-1';r.phase='discard';r.turnSource='wall';r.drewThisTurn=true;r.lastDrawnTileId=fourth.id;r.pendingFlowerTileId=null;r.claimWindow=null;r.actionHistory=[];r.winResult=null;r.drawResult=null;
  const session={...s,round:r,opening:[]};inventory(session);return {session,fourthId:fourth.id};
 }
 function step(s,seat,type,predicate=()=>true){const before=JSON.stringify(s),c=view(s,seat).choices.find(c=>c.type===type&&predicate(c));assert.ok(c,`${type} seat ${seat}`);const next=act(s,seat,s.revision,c.index);assert.equal(JSON.stringify(s),before,'prior state immutable');assert.equal(next.revision,s.revision+1);inventory(next);return next;}
 for(const flowerCount of [0,1,2,3])for(const last of [false,true]){
  const f=fixture(last,flowerCount);let s=f.session;
  s=step(s,0,'discard',c=>c.tileIds.includes(f.discardId));assert.equal(s.round.phase,'claim');
  s=step(s,1,'claim-discard',c=>c.claim==='kong');assert.equal(s.round.phase,'claim','wait for every response before committing a meld');
  s=step(s,2,'pass-claim');s=step(s,3,'pass-claim');
  assert.equal(s.round.phase,'replacement');assert.equal(s.round.activePlayerId,'seat-2');
  assert.equal(s.round.melds['seat-2'].length,1);assert.equal(s.round.melds['seat-2'][0].kind,'kong');assert.equal(s.round.melds['seat-2'][0].exposure,'melded');
  assert.equal(s.round.melds['seat-2'][0].claimedTileId,f.discardId);assert.ok(!s.round.discardPile.some(t=>t.id===f.discardId));
  s=step(s,1,'draw-replacement');
  for(let n=0;n<flowerCount;n++){assert.equal(s.round.phase,'flower');s=step(s,1,'replace-flower');}
  assert.equal(s.round.turnSource,flowerCount?'flower-replacement':'kong-replacement');
  assert.equal(s.round.wall.length,last?0:1);
  s=step(s,1,'declare-self-draw');assert.equal(s.round.phase,'finished');assert.equal(s.round.winResult.winnerId,'seat-2');
  const result=s.round.winResult,codes=result.analysis.fanCodes;
  const expected=flowerCount?['mcr-33','mcr-49','mcr-52','mcr-59','mcr-73','mcr-74','mcr-79','mcr-80','mcr-81']:['mcr-33','mcr-46','mcr-49','mcr-52','mcr-59','mcr-73','mcr-74','mcr-79'];
  assert.deepEqual(codes,expected,'exact structural, event and flower fan composition');
  assert.equal(result.analysis.nonFlowerTotal,flowerCount?34:41);
  assert.equal(result.analysis.total,flowerCount?34+flowerCount:41);
  const payment=flowerCount?42+flowerCount:49;
  assert.deepEqual(Object.values(result.settlement.deltas),[-payment,3*payment,-payment,-payment],'four-player payment includes eight-point base and each exposed flower');
  assert.equal(codes.includes('mcr-46'),flowerCount===0,'fan 46 only for the actual kong replacement tile');
  assert.equal(codes.includes('mcr-80'),flowerCount>0,'ordinary self-draw applies after a flower interrupts kong replacement');
  for(const code of ['mcr-44','mcr-45','mcr-47'])assert.ok(!codes.includes(code),`${code} must not be awarded from replacement sequence`);
  assert.equal(Object.values(result.settlement.deltas).reduce((a,b)=>a+b,0),0);
 }
 for(const flowerCount of [0,1,2,3])for(const last of [false,true]){
  const f=addedFixture(last,flowerCount);let s=f.session,originalWall=s.round.wall.length;
  s=step(s,0,'declare-added-kong');assert.equal(s.round.phase,'claim');assert.equal(s.round.melds['seat-1'][0].kind,'pung','added kong is pending during robbing window');
  for(const seat of [1,2,3])s=step(s,seat,'pass-claim');
  assert.equal(s.round.phase,'replacement');assert.equal(s.round.melds['seat-1'][0].kind,'kong');assert.ok(s.round.melds['seat-1'][0].tiles.some(t=>t.id===f.fourthId));
  s=step(s,0,'draw-replacement');for(let n=0;n<flowerCount;n++){assert.equal(s.round.phase,'flower');s=step(s,0,'replace-flower');}
  assert.equal(s.round.turnSource,flowerCount?'flower-replacement':'kong-replacement');
  assert.equal(s.round.wall.length,originalWall-flowerCount-1);
  s=step(s,0,'declare-self-draw');assert.equal(s.round.phase,'finished');assert.equal(s.round.winResult.winnerId,'seat-1');
  const result=s.round.winResult,codes=result.analysis.fanCodes;
  const expected=flowerCount?['mcr-33','mcr-49','mcr-52','mcr-59','mcr-73','mcr-74','mcr-79','mcr-80','mcr-81']:['mcr-33','mcr-46','mcr-49','mcr-52','mcr-59','mcr-73','mcr-74','mcr-79'];
  assert.deepEqual(codes,expected,'added-kong event and flower fan composition');assert.equal(result.analysis.nonFlowerTotal,flowerCount?34:41);assert.equal(result.analysis.total,flowerCount?34+flowerCount:41);
  const payment=flowerCount?42+flowerCount:49;assert.deepEqual(Object.values(result.settlement.deltas),[3*payment,-payment,-payment,-payment]);
 }
 console.log('PASS: sixteen authored 144-tile mid-hands use actual discard-claimed or added-kong windows, all peer responses, replacement/0–3 consecutive flower replacements, self-draw and exact fans/payments. Last-versus-nonlast wall contrast; not seeded-opening or browser evidence.');
})().catch(e=>{console.error(e);process.exitCode=1;});
