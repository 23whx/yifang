// Authored 144-tile mid-hand positions, then real session actions: each kong
// must be declared and its replacement actually drawn before the next one.
// They are not a claim that a full seeded opening naturally reached this hand.
const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load;
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?core:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 const js=require.extensions['.js'];require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {newMcrSession:create,mcrSessionView:view,actMcrSession:act}=require('../lib/mahjong/mcr-session.ts');
 function inventory(s){const r=s.round,tiles=[...r.wall,...r.discardPile,...Object.values(r.hands).flat(),...Object.values(r.melds).flat().flatMap(m=>m.tiles),...Object.values(r.flowers).flat()];assert.equal(tiles.length,144);assert.equal(new Set(tiles.map(t=>t.id)).size,144);}
 function fixture(kongs,mixed=false,rob=false){
  const s=create(42),r=structuredClone(s.round),pool=[...analysis.createMcrTileSet()];
  const take=face=>{const i=pool.findIndex(t=>t.face===face);assert.ok(i>=0,face);return pool.splice(i,1)[0];};
  r.hands=Object.fromEntries(r.playerOrder.map(id=>[id,[]]));r.melds=Object.fromEntries(r.playerOrder.map(id=>[id,[]]));r.flowers=Object.fromEntries(r.playerOrder.map(id=>[id,[]]));
  const owner='seat-1',pairFace=rob?'5p':'E',first=rob?'2m':'1m',third=rob?'6s':'7s',pair=take(pairFace);
  r.hands[owner]=[...Array.from({length:4},()=>take(first)),...Array.from({length:3},()=>take('4p')),...Array.from({length:3},()=>take(third)),pair];
  if(kongs===4&&!mixed)r.hands[owner].push(...Array.from({length:3},()=>take('C')));
  else {const meld=Array.from({length:3},()=>take('C'));r.melds[owner]=[{kind:'pung',exposure:'melded',tiles:meld,claimedTileId:meld[0].id,fromPlayerId:'seat-2'}];}
  const replacements=[take('4p'),take(third),...(kongs===4?[take('C')]:[]),take(pairFace)];
  if(rob)r.hands['seat-2']=['1m','9m','1p','9p','1s','9s','E','E','S','W','N','F','P'].map(take);
  for(const id of r.playerOrder)if(id!==owner)while(r.hands[id].length<13){const i=pool.findIndex(t=>analysis.isMcrStructureTile(t.face));r.hands[id].push(pool.splice(i,1)[0]);}
  const spare=pool.splice(pool.findIndex(t=>analysis.isMcrStructureTile(t.face)),1)[0];
  r.wall=[spare,...replacements.reverse()];r.discardPile=pool.filter(t=>analysis.isMcrStructureTile(t.face));r.flowers['seat-4']=pool.filter(t=>!analysis.isMcrStructureTile(t.face));
  r.activePlayerId=owner;r.phase='discard';r.turnSource='wall';r.drewThisTurn=true;r.lastDrawnTileId=pair.id;r.pendingFlowerTileId=null;r.claimWindow=null;r.actionHistory=[];r.winResult=null;r.drawResult=null;
  const session={...s,round:r,opening:[]};inventory(session);return session;
 }
 function step(s,type,seat=0){const before=JSON.stringify(s),choice=view(s,seat).choices.find(c=>c.type===type);assert.ok(choice,`${type}: legal option for seat ${seat}`);const next=act(s,seat,s.revision,choice.index);assert.equal(JSON.stringify(s),before,'previous state immutable');assert.equal(next.revision,s.revision+1);inventory(next);return next;}
 for(const {kongs,mixed} of [{kongs:3,mixed:false},{kongs:4,mixed:false},{kongs:4,mixed:true}]){
  let s=fixture(kongs,mixed);
  for(let n=1;n<=kongs-(mixed?1:0);n++){
   const prior=s.round.melds['seat-1'].length;
   s=step(s,'declare-concealed-kong');assert.equal(s.round.phase,'replacement');assert.equal(s.round.melds['seat-1'].length,prior+1);assert.equal(s.round.winResult,null);
   s=step(s,'draw-replacement');assert.equal(s.round.phase,'discard');assert.equal(s.round.turnSource,'kong-replacement');assert.equal(s.round.melds['seat-1'].filter(m=>m.kind==='kong').length,n);
  }
  if(mixed){
   s=step(s,'declare-added-kong');assert.equal(s.round.phase,'claim');assert.equal(s.round.melds['seat-1'][0].kind,'pung','pending added kong is not yet committed');
   for(const seat of [1,2,3])s=step(s,'pass-claim',seat);
   assert.equal(s.round.phase,'replacement');assert.equal(s.round.melds['seat-1'][0].kind,'kong','all three passed, fourth kong commits once');
   s=step(s,'draw-replacement');assert.equal(s.round.turnSource,'kong-replacement');
  }
  s=step(s,'declare-self-draw');assert.equal(s.round.phase,'finished');assert.equal(s.round.winResult.winnerId,'seat-1');
  const result=s.round.winResult,fan=result.analysis.fanCodes;
  const expected=mixed?['mcr-05','mcr-33','mcr-46','mcr-49','mcr-52','mcr-59','mcr-73']:kongs===4?['mcr-05','mcr-12','mcr-46','mcr-52','mcr-56','mcr-59','mcr-73']:['mcr-17','mcr-33','mcr-46','mcr-49','mcr-52','mcr-59','mcr-73','mcr-79'];
  assert.deepEqual(fan,expected,`${kongs} kongs: only applicable high/add-on/context fans`);
  const total=mixed?127:kongs===4?173:72;
  assert.equal(result.analysis.nonFlowerTotal,total,`${kongs} kongs: exact WMO-based total`);
  assert.deepEqual(Object.values(result.settlement.deltas),[3*(total+8),-total-8,-total-8,-total-8],`${kongs} kongs: exact payments`);
  assert.equal(s.round.wall.length,1,'spare wall tile stays unspent');
  assert.equal(Object.values(result.settlement.deltas).reduce((a,b)=>a+b,0),0,'zero-sum settlement');
 }
 {
  let s=fixture(4,true,true);
  for(let n=1;n<=3;n++){s=step(s,'declare-concealed-kong');s=step(s,'draw-replacement');assert.equal(s.round.melds['seat-1'].filter(m=>m.kind==='kong').length,n);}
  const wallBefore=s.round.wall.length;
  s=step(s,'declare-added-kong');assert.equal(s.round.melds['seat-1'][0].kind,'pung','fourth kong not committed during robbing window');
  s=step(s,'claim-added-kong-win',1);
  for(const seat of [2,3])s=step(s,'pass-claim',seat);
  assert.equal(s.round.phase,'finished');assert.equal(s.round.melds['seat-1'][0].kind,'pung','robbed fourth kong remains a pung');
  assert.equal(s.round.melds['seat-1'].filter(m=>m.kind==='kong').length,3);assert.equal(s.round.wall.length,wallBefore,'no replacement draw after robbery');
  assert.equal(s.round.winResult.winnerId,'seat-2');assert.equal(s.round.winResult.discarderId,'seat-1');
  assert.deepEqual(s.round.winResult.analysis.fanCodes,['mcr-07','mcr-47'],'Thirteen Orphans plus Robbing Kong, not Four Kongs or Last Copy');
  assert.equal(s.round.winResult.analysis.nonFlowerTotal,96);
  assert.deepEqual(Object.values(s.round.winResult.settlement.deltas),[-104,120,-8,-8],'discarder alone pays winning fan plus base');
 }
 console.log('PASS: authored complete 144-tile mid-hands perform three/four sequential legal concealed-kong declarations, a fourth added kong after all three peers pass, or robbery of the fourth added kong before commitment. Not full-opening reachability.');
})().catch(e=>{console.error(e);process.exitCode=1;});
