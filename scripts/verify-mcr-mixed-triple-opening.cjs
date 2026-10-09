// WMO/EMA fan 41: three identical chows, one in each suit. These are authored
// legal opening deals, not outcomes claimed from a particular random seed.
// https://mahjong-europe.org/portal/images/docs/mcr_EN.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
(async()=>{
 const rules=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?rules:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](module,file):js(module,file);
 const {newMcrSession,mcrSessionView,actMcrSession}=require('../lib/mahjong/mcr-session.ts');
 const suits=['m','p','s'],orders=suits.flatMap(first=>suits.filter(second=>second!==first).map(second=>[first,second,suits.find(third=>third!==first&&third!==second)]));
 const chow=(rank,suit)=>[rank,rank+1,rank+2].map(value=>`${value}${suit}`);
 function opening([first,second,third],start,pairCompletion){
  const original=newMcrSession(93),round=structuredClone(original.round),pool=[...analysis.createMcrTileSet()];
  const take=face=>{const index=pool.findIndex(tile=>tile.face===face);assert.ok(index>=0,`missing ${face}`);return pool.splice(index,1)[0];};
  const faces=[...chow(start,first),...chow(start,second),...chow(start,third),...chow(7,first),`5${second}`,`5${second}`];
  const target=faces.map(take),winningFace=pairCompletion?`5${second}`:`${start+2}${third}`;
  const winIndex=target.findIndex(tile=>tile.face===winningFace);assert.ok(winIndex>=0);const [winning]=target.splice(winIndex,1);
  const filler=count=>Array.from({length:count},()=>{
   const index=pool.findIndex(tile=>analysis.isMcrStructureTile(tile.face)&&tile.face!==winningFace);
   assert.ok(index>=0,'enough non-flower filler');return pool.splice(index,1)[0];
  });
  round.hands={'seat-1':[...filler(13),winning],'seat-2':target,'seat-3':filler(13),'seat-4':filler(13)};
  round.melds=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.flowers=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  round.wall=pool;round.discardPile=[];round.activePlayerId='seat-1';round.phase='discard';
  round.turnSource='deal';round.drewThisTurn=true;round.lastDrawnTileId=winning.id;
  round.pendingFlowerTileId=null;round.claimWindow=null;round.actionHistory=[];round.winResult=null;round.drawResult=null;
  return {session:{...original,round,opening:[]},winning};
 }
 function inventory(session){
  const round=session.round,tiles=[...round.wall,...round.discardPile,...Object.values(round.hands).flat(),...Object.values(round.melds).flat().flatMap(meld=>meld.tiles),...Object.values(round.flowers).flat()];
  assert.equal(tiles.length,144);assert.equal(new Set(tiles.map(tile=>tile.id)).size,144);
 }
 function step(session,seat,type,predicate=()=>true){
  const before=JSON.stringify(session),choice=mcrSessionView(session,seat).choices.find(item=>item.type===type&&predicate(item));assert.ok(choice,`${type} seat ${seat}`);
  const next=actMcrSession(session,seat,session.revision,choice.index);assert.equal(JSON.stringify(session),before);assert.equal(next.revision,session.revision+1);inventory(next);return next;
 }
 let count=0;
 for(const order of orders)for(let start=1;start<=7;start++)for(const pairCompletion of [false,true]){
  const label=JSON.stringify({order,start,pairCompletion}),deal=opening(order,start,pairCompletion);let session=deal.session;inventory(session);
  assert.deepEqual(session.round.playerOrder.map(id=>session.round.hands[id].length),[14,13,13,13],label);
  assert.equal(session.round.wall.length,91,label);assert.ok(session.round.wall.every(tile=>!session.round.hands['seat-2'].some(held=>held.id===tile.id)),label);
  assert.equal(mcrSessionView(session,0).table.turnSource,'deal',label);
  session=step(session,0,'discard',choice=>choice.tileIds.includes(deal.winning.id));
  session=step(session,1,'claim-discard',choice=>choice.claim==='win');
  for(const seat of [2,3])if(session.round.phase==='claim')session=step(session,seat,'pass-claim');
  assert.equal(session.round.phase,'finished',label);
  const result=session.round.winResult;
  assert.equal(result.analysis.occurrences.filter(item=>item.fanCode==='mcr-41').reduce((sum,item)=>sum+item.points,0),8,label);
  assert.ok(!result.analysis.fanCodes.includes('mcr-70'),`${label}: included mixed double chow must not be counted again`);
  const total=result.analysis.total;assert.deepEqual(Object.values(result.settlement.deltas),[-(total+8),total+24,-8,-8],label);
  for(const seat of [0,1,2,3]){
   const before=JSON.stringify(session);session=actMcrSession(session,seat,session.revision,'confirm');
   assert.equal(JSON.stringify(session.round),JSON.stringify(JSON.parse(before).round),`${label}: confirmation cannot resettle`);
  }
  assert.deepEqual(session.confirmed,[true,true,true,true],label);count++;
 }
 console.log(`PASS: ${count} authored legal opening deals reach a real fan-41 discard win; six suit orders, seven starts, pair/chow completion, 144-tile inventory, exact payment and four confirmations. Not random-seed reachability.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
