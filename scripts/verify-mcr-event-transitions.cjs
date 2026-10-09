const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load;
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?core:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 const js=require.extensions['.js'];require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {newMcrSession:create,mcrSessionView:view,actMcrSession:act}=require('../lib/mahjong/mcr-session.ts');
 const {mcrResultReason,mcrPaymentSourceReason}=require('../lib/mahjong/mcr-result-copy.ts');
 // Authored, inventory-valid mid-hand positions. The tested events are actions,
 // not supplied scoring flags; these fixtures are not opening-history replays.
 function fixture(kind,last,lastCopyMode='original'){
  const s=create(42),r=structuredClone(s.round),pool=[...analysis.createMcrTileSet()];
  const take=face=>{const i=pool.findIndex(t=>t.face===face);assert.ok(i>=0,face);return pool.splice(i,1)[0];};
  r.hands=Object.fromEntries(r.playerOrder.map(id=>[id,[]]));
  r.melds=Object.fromEntries(r.playerOrder.map(id=>[id,[]]));
  r.flowers=Object.fromEntries(r.playerOrder.map(id=>[id,[]]));
  const winner=kind==='discard'||kind==='rob'?'seat-2':'seat-1';
  const copyContrast=lastCopyMode!=='original';
  r.hands[winner]=(kind==='rob'?['1m','2m','3m','4p','4p','4p','7s','7s','7s','C','C','7m','8m']:copyContrast?['1m','1m','1m','4p','4p','4p','7s','7s','7s','C','C','7m','8m']:['1m','1m','1m','4p','4p','4p','7s','7s','7s','C','C','C','E']).map(take);
  if(kind==='kong')r.hands[winner].push(take('1m'));
  const winning=take(kind==='rob'||copyContrast?'9m':'E');
  if(kind==='rob'){
   const tiles=['9m','9m','9m'].map(take);
   r.melds['seat-1']=[{kind:'pung',exposure:'melded',tiles,claimedTileId:tiles[0].id,fromPlayerId:'seat-3'}];
   r.hands['seat-1'].push(winning);
  }
  if(copyContrast){
   const otherCopies=['9m','9m','9m'].map(take);
   if(lastCopyMode==='visible')r.melds['seat-4']=[{kind:'pung',exposure:'melded',tiles:otherCopies,claimedTileId:otherCopies[0].id,fromPlayerId:'seat-3'}];
   else if(lastCopyMode==='hidden')r.hands['seat-4'].push(...otherCopies);
   else throw new Error('Invalid last-copy contrast');
  }
  const flower=kind==='flower'?pool.splice(pool.findIndex(t=>!analysis.isMcrStructureTile(t.face)),1)[0]:null;
  for(const id of r.playerOrder)if(id!==winner)while(r.hands[id].length<(kind==='rob'&&id==='seat-1'?11:lastCopyMode==='visible'&&id==='seat-4'?10:13)){const i=pool.findIndex(t=>analysis.isMcrStructureTile(t.face));r.hands[id].push(pool.splice(i,1)[0]);}
  const spare=last?[]:[pool.splice(pool.findIndex(t=>analysis.isMcrStructureTile(t.face)),1)[0]];
  r.wall=kind==='rob'?spare:kind==='flower'?[flower,...spare,winning]:kind==='kong'?[...spare,winning]:[winning,...spare];
  r.discardPile=pool.filter(t=>analysis.isMcrStructureTile(t.face));
  r.flowers['seat-4']=pool.filter(t=>!analysis.isMcrStructureTile(t.face));
  const ready=kind==='kong'||kind==='rob';
  r.activePlayerId='seat-1';r.phase=ready?'discard':'draw';r.turnSource=ready?'wall':null;
  r.drewThisTurn=ready;r.lastDrawnTileId=kind==='rob'?winning.id:kind==='kong'?r.hands[winner].at(-1).id:null;
  r.pendingFlowerTileId=null;r.claimWindow=null;r.actionHistory=[];r.winResult=null;r.drawResult=null;
  return {session:{...s,round:r,opening:[]},winningId:winning.id};
 }
 function inventory(s){const r=s.round,tiles=[...r.wall,...r.discardPile,...Object.values(r.hands).flat(),...Object.values(r.melds).flat().flatMap(m=>m.tiles),...Object.values(r.flowers).flat()];assert.equal(tiles.length,144);assert.equal(new Set(tiles.map(t=>t.id)).size,144);}
 function step(s,seat,type,predicate=()=>true){
  const before=JSON.stringify(s),c=view(s,seat).choices.find(c=>c.type===type&&predicate(c));assert.ok(c,`${type} seat ${seat}`);
  const next=act(s,seat,s.revision,c.index);assert.equal(JSON.stringify(s),before,'Action must not mutate prior session');assert.equal(next.revision,s.revision+1);inventory(next);return next;
 }
 for(const kind of ['self','discard','kong','flower'])for(const last of [false,true]){
  const f=fixture(kind,last);let s=f.session;inventory(s);
  if(kind==='kong'){s=step(s,0,'declare-concealed-kong');assert.equal(s.round.phase,'replacement');s=step(s,0,'draw-replacement');}
  else {s=step(s,0,'draw');if(kind==='flower')s=step(s,0,'replace-flower');}
  assert.equal(s.round.wall.length,last?0:1);
  assert.equal(s.round.turnSource,kind==='kong'?'kong-replacement':kind==='flower'?'flower-replacement':'wall');
  if(kind==='discard'){
   s=step(s,0,'discard',c=>c.tileIds.includes(f.winningId));
   s=step(s,1,'claim-discard',c=>c.claim==='win');
   for(const seat of [2,3])if(s.round.phase==='claim')s=step(s,seat,'pass-claim');
  }else s=step(s,0,'declare-self-draw');
  assert.equal(s.round.phase,'finished');assert.ok(s.round.winResult);
  const codes=s.round.winResult.analysis.fanCodes;
  assert.equal(codes.includes('mcr-44'),kind==='self'&&last,`${kind}/${last}: last ordinary draw only`);
  assert.equal(codes.includes('mcr-45'),kind==='discard'&&last,`${kind}/${last}: last ordinary discard only`);
  assert.equal(codes.includes('mcr-46'),kind==='kong',`${kind}/${last}: kong replacement only`);
  assert.ok(!codes.includes('mcr-47'));
  const reasonZh=mcrResultReason(s.round.winResult,s.round.turnSource,'zh');
  const reasonEn=mcrResultReason(s.round.winResult,s.round.turnSource,'en');
  const route=kind==='kong'?'杠上开花':kind==='flower'?'补花不算':kind==='self'?(last?'妙手回春':'自己摸到'):last?'海底捞月':'刚打出的牌';
  const routeEn=kind==='kong'?'Out with Replacement Tile':kind==='flower'?'Replacing a flower':kind==='self'?(last?'Last Tile Draw':'drew the tile'):last?'Last Tile Claim':'just discarded';
  assert.ok(reasonZh.includes(route),`${kind}/${last}: Chinese result must explain its real route`);
  assert.ok(reasonEn.includes(routeEn),`${kind}/${last}: English result must explain its real route`);
  assert.ok(reasonZh.includes(`${s.round.winResult.analysis.nonFlowerTotal} 分`)&&reasonZh.includes('八分起和门槛'));
  const paymentZh=mcrPaymentSourceReason(s.round.winResult,'zh');
  const paymentEn=mcrPaymentSourceReason(s.round.winResult,'en');
  assert.ok(paymentZh.includes(kind==='discard'?'弃牌':'自摸'));
  assert.ok(paymentEn.includes(kind==='discard'?'discarded':'self-draw'));
 }
 // Official WMO #58 distinguishes three publicly visible copies from copies
 // hidden in another hand. Keep all 144 physical tiles and the winning route
 // unchanged while moving those three copies between Seat 4's exposed pung
 // and concealed hand. Last Tile may coexist with #44/#45/#46, but a flower
 // replacement must not inherit the earlier Kong replacement event.
 // https://www.mindmahjong.com/adobe/z20140402.pdf
 for(const kind of ['self','discard','kong','flower'])for(const last of [false,true]){
  const outcomes=[];
  for(const mode of ['hidden','visible']){
   const f=fixture(kind,last,mode);let s=f.session;inventory(s);
   if(kind==='kong'){s=step(s,0,'declare-concealed-kong');s=step(s,0,'draw-replacement');}
   else{s=step(s,0,'draw');if(kind==='flower')s=step(s,0,'replace-flower');}
   assert.equal(s.round.wall.length,last?0:1);
   if(kind==='discard'){
    s=step(s,0,'discard',c=>c.tileIds.includes(f.winningId));
    s=step(s,1,'claim-discard',c=>c.claim==='win');
    for(const seat of [2,3])if(s.round.phase==='claim')s=step(s,seat,'pass-claim');
   }else s=step(s,0,'declare-self-draw');
   assert.equal(s.round.phase,'finished');
   const result=s.round.winResult,codes=result.analysis.fanCodes;
   assert.equal(codes.includes('mcr-58'),mode==='visible',`${kind}/${last}/${mode}: public copies only`);
   assert.equal(codes.includes('mcr-44'),kind==='self'&&last);
   assert.equal(codes.includes('mcr-45'),kind==='discard'&&last);
   assert.equal(codes.includes('mcr-46'),kind==='kong');
   assert.ok(!codes.includes('mcr-47'));
   outcomes.push(result);
  }
  const [hidden,visible]=outcomes;
  assert.deepEqual(visible.analysis.fanCodes.filter(code=>code!=='mcr-58').sort(),hidden.analysis.fanCodes.sort(),`${kind}/${last}: only #58 differs`);
  assert.equal(visible.analysis.total-hidden.analysis.total,4,`${kind}/${last}: Last Tile adds four points`);
  for(const id of ['seat-1','seat-2','seat-3','seat-4']){
   const difference=visible.settlement.deltas[id]-hidden.settlement.deltas[id];
   const expected=kind==='discard'?(id==='seat-2'?4:id==='seat-1'?-4:0):id==='seat-1'?12:-4;
   assert.equal(difference,expected,`${kind}/${last}/${id}: exact Last Tile payment`);
  }
 }
 for(const rob of [false,true]){
  const f=fixture('rob',false);let s=f.session;inventory(s);
  s=step(s,0,'declare-added-kong');assert.equal(s.round.claimWindow.kind,'added-kong');
  assert.equal(s.round.melds['seat-1'][0].kind,'pung','Kong must not be committed before responses');
  s=step(s,1,rob?'claim-added-kong-win':'pass-claim');
  s=step(s,2,'pass-claim');s=step(s,3,'pass-claim');
  assert.ok(!s.round.hands['seat-1'].some(t=>t.id===f.winningId));
  if(rob){
   assert.equal(s.round.phase,'finished');assert.equal(s.round.melds['seat-1'][0].kind,'pung');
   assert.equal(s.round.winResult.winnerId,'seat-2');assert.equal(s.round.winResult.discarderId,'seat-1');
   assert.ok(s.round.winResult.analysis.fanCodes.includes('mcr-47'));
   const reasonZh=mcrResultReason(s.round.winResult,s.round.turnSource,'zh');
   const reasonEn=mcrResultReason(s.round.winResult,s.round.turnSource,'en');
   assert.ok(reasonZh.includes('抢杠和')&&!reasonZh.includes('刚打出的牌'));
   assert.ok(reasonEn.includes('Robbing the Kong')&&!reasonEn.includes('just discarded'));
   assert.ok(mcrPaymentSourceReason(s.round.winResult,'zh').includes('不是普通弃牌'));
   assert.ok(mcrPaymentSourceReason(s.round.winResult,'en').includes('not an ordinary discard'));
   for(const code of ['mcr-44','mcr-45','mcr-46','mcr-58'])assert.ok(!s.round.winResult.analysis.fanCodes.includes(code),code);
  }else{
   assert.equal(s.round.phase,'replacement');assert.equal(s.round.winResult,null);
   assert.equal(s.round.melds['seat-1'][0].kind,'kong');assert.equal(s.round.melds['seat-1'][0].tiles.length,4);
   s=step(s,0,'draw-replacement');assert.equal(s.round.turnSource,'kong-replacement');
  }
 }
 // Keep the exact same 144 physical tiles, winner and exposed three-copy pung.
 // The fourth tile is either discarded normally or offered as an added Kong.
 // Only the event route may decide Last Tile versus Robbing the Kong.
 const ordinaryFixture=fixture('rob',false);let ordinary=ordinaryFixture.session;inventory(ordinary);
 ordinary=step(ordinary,0,'discard',choice=>choice.tileIds.includes(ordinaryFixture.winningId));
 ordinary=step(ordinary,1,'claim-discard',choice=>choice.claim==='win');
 for(const seat of [2,3])if(ordinary.round.phase==='claim')ordinary=step(ordinary,seat,'pass-claim');
 assert.equal(ordinary.round.phase,'finished');
 const robbedFixture=fixture('rob',false);assert.equal(ordinaryFixture.winningId,robbedFixture.winningId);
 let robbed=robbedFixture.session;inventory(robbed);
 robbed=step(robbed,0,'declare-added-kong');
 robbed=step(robbed,1,'claim-added-kong-win');
 for(const seat of [2,3])if(robbed.round.phase==='claim')robbed=step(robbed,seat,'pass-claim');
 assert.equal(robbed.round.phase,'finished');
 const ordinaryResult=ordinary.round.winResult,robbedResult=robbed.round.winResult;
 assert.ok(ordinaryResult.analysis.fanCodes.includes('mcr-58'),'ordinary discard of fourth public copy is Last Tile');
 assert.ok(!ordinaryResult.analysis.fanCodes.includes('mcr-47'));
 assert.ok(mcrResultReason(ordinaryResult,ordinary.round.turnSource,'zh').includes('刚打出的牌'));
 assert.ok(mcrResultReason(ordinaryResult,ordinary.round.turnSource,'en').includes('discarded. The hand'));
 assert.ok(mcrPaymentSourceReason(ordinaryResult,'zh').includes('打出完成赢家牌型的弃牌'));
 assert.ok(robbedResult.analysis.fanCodes.includes('mcr-47'),'offered added-Kong tile is Robbing the Kong');
 assert.ok(!robbedResult.analysis.fanCodes.includes('mcr-58'));
 assert.ok(mcrResultReason(robbedResult,robbed.round.turnSource,'zh').includes('抢杠和'));
 assert.ok(mcrPaymentSourceReason(robbedResult,'zh').includes('正要把一张牌加到已亮出的碰牌'));
 assert.ok(mcrResultReason(null,null,'zh').includes('流局'));
 assert.ok(mcrResultReason(null,null,'en').includes('draw'));
 const points=(result,code)=>result.analysis.occurrences.filter(item=>item.fanCode==='mcr-'+code).reduce((sum,item)=>sum+item.points,0);
 assert.equal(points(ordinaryResult,58),4);assert.equal(points(robbedResult,47),8);
 assert.deepEqual(ordinaryResult.analysis.fanCodes.filter(code=>code!=='mcr-58').sort(),robbedResult.analysis.fanCodes.filter(code=>code!=='mcr-47').sort());
 assert.equal(robbedResult.analysis.total-ordinaryResult.analysis.total,4,'the two event fans differ by exactly four points');
 for(const id of ordinary.round.playerOrder){
  const delta=robbedResult.settlement.deltas[id]-ordinaryResult.settlement.deltas[id];
  assert.equal(delta,id==='seat-2'?4:id==='seat-1'?-4:0,'only the same discarder/added-Kong declarer pays the extra four');
 }
 console.log('PASS: actual draw/discard/claim/concealed-kong/replacement/flower/added-kong paths, eight hidden-versus-public Last Tile contrasts across event sources, plus the same physical fourth public copy discarded normally versus robbed on added Kong; exact event fans and four-seat payment, 144 unique tiles, revisions and immutable prior states. Authored mid-hand fixtures, not opening replays.');
})().catch(e=>{console.error(e);process.exitCode=1;});
