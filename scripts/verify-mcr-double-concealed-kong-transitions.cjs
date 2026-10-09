// WMO MCR2021 #48: two actually declared concealed Kongs versus a preexisting
// melded Kong plus one declared concealed Kong. Authored inventory-valid
// mid-hands; the first exposed Kong in the contrast is not replayed here.
// https://www.mindmahjong.com/adobe/MCR2021.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
(async()=>{
 const rules=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?rules:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](module,file):js(module,file);
 const {newMcrSession,mcrSessionView,actMcrSession}=require('../lib/mahjong/mcr-session.ts');
 function fixture(twoConcealed){
  const original=newMcrSession(1448),round=structuredClone(original.round),pool=[...analysis.createMcrTileSet()];
  const take=face=>{const at=pool.findIndex(tile=>tile.face===face);assert.ok(at>=0,face);return pool.splice(at,1)[0];};
  round.hands=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.melds=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));round.flowers=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
  for(const face of ['7s','C']){const tiles=Array.from({length:3},()=>take(face));round.melds['seat-1'].push({kind:'pung',exposure:'melded',tiles,claimedTileId:tiles[0].id,fromPlayerId:'seat-2'});}
  const first=Array.from({length:4},()=>take('1m'));
  if(twoConcealed)round.hands['seat-1'].push(...first);
  else round.melds['seat-1'].push({kind:'kong',exposure:'melded',tiles:first,claimedTileId:first[0].id,fromPlayerId:'seat-2'});
  round.hands['seat-1'].push(...Array.from({length:twoConcealed?3:4},()=>take('4p')),take('E'));
  const replacement=twoConcealed?take('4p'):null,winning=take('E');
  for(const id of round.playerOrder)if(id!=='seat-1')while(round.hands[id].length<13){const at=pool.findIndex(tile=>analysis.isMcrStructureTile(tile.face)&&tile.face!==winning.face);assert.ok(at>=0);round.hands[id].push(pool.splice(at,1)[0]);}
  const spare=pool.splice(pool.findIndex(tile=>analysis.isMcrStructureTile(tile.face)),1)[0];
  round.wall=twoConcealed?[spare,winning,replacement]:[spare,winning];round.discardPile=pool.filter(tile=>analysis.isMcrStructureTile(tile.face));round.flowers['seat-4']=pool.filter(tile=>!analysis.isMcrStructureTile(tile.face));
  round.activePlayerId='seat-1';round.phase='discard';round.turnSource='wall';round.drewThisTurn=true;round.lastDrawnTileId=round.hands['seat-1'][0].id;round.pendingFlowerTileId=null;round.claimWindow=null;round.actionHistory=[];round.winResult=null;round.drawResult=null;
  return {...original,round,opening:[]};
 }
 function inventory(session){const r=session.round,tiles=[...r.wall,...r.discardPile,...Object.values(r.hands).flat(),...Object.values(r.melds).flat().flatMap(meld=>meld.tiles),...Object.values(r.flowers).flat()];assert.equal(tiles.length,144);assert.equal(new Set(tiles.map(tile=>tile.id)).size,144);}
 function step(session,type){const before=JSON.stringify(session),choice=mcrSessionView(session,0).choices.find(item=>item.type===type);assert.ok(choice,type);const next=actMcrSession(session,0,session.revision,choice.index);assert.equal(JSON.stringify(session),before);assert.equal(next.revision,session.revision+1);inventory(next);return next;}
 function points(result,code){return result.analysis.occurrences.filter(item=>item.fanCode===`mcr-${code}`).reduce((sum,item)=>sum+item.points,0);}
 const endings=[];
 for(const twoConcealed of [true,false]){
  let session=fixture(twoConcealed);inventory(session);
  for(let index=0;index<(twoConcealed?2:1);index++){
   const count=session.round.melds['seat-1'].filter(meld=>meld.kind==='kong'&&meld.exposure==='concealed').length;
   session=step(session,'declare-concealed-kong');assert.equal(session.round.phase,'replacement');assert.equal(session.round.melds['seat-1'].filter(meld=>meld.kind==='kong'&&meld.exposure==='concealed').length,count+1);
   session=step(session,'draw-replacement');assert.equal(session.round.phase,'discard');assert.equal(session.round.turnSource,'kong-replacement');
  }
  assert.equal(session.round.wall.length,1);session=step(session,'declare-self-draw');assert.equal(session.round.phase,'finished');
  const result=session.round.winResult;assert.equal(points(result,48),twoConcealed?8:0);assert.equal(points(result,57),twoConcealed?0:4);assert.equal(points(result,67),twoConcealed?0:2);assert.equal(points(result,46),8);
  assert.equal(Object.values(result.settlement.deltas).reduce((sum,delta)=>sum+delta,0),0);
  endings.push(result);
 }
 assert.equal(endings[0].analysis.total-endings[1].analysis.total,2,'two concealed Kongs beat one melded + one concealed by two points');
 assert.deepEqual(Object.values(endings[0].settlement.deltas).map((value,index)=>value-Object.values(endings[1].settlement.deltas)[index]),[6,-2,-2,-2]);
 console.log('PASS: two actual concealed-Kong declarations and replacement draws versus one preexisting melded Kong plus actual concealed Kong; #48/#57/#67/#46, inventory, revisions, and settlement difference.');
})().catch(error=>{console.error(error);process.exitCode=1;});
