// Supplemental final-acceptance action check. Run from the project root:
// node docs/verification/mcr-final-rules-2026-10-01/claim-priority.cjs
// WMO 3.6.7 / 3.7.1: win > pung/kong > chow. Same-win requests use
// this platform's single-winner, nearest-in-turn-order preset, not arrival time.
/* eslint @typescript-eslint/no-require-imports: "off" -- CommonJS acceptance runner installs synchronous transpilation hooks. */
const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-analysis-core'),rules=await import('miaoda-game-mcr-mahjong-rules'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-analysis-core'?core:request==='miaoda-game-mcr-mahjong-rules'?rules:load.call(this,request,...args);};
 require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {newMcrMatch,actMcrMatch,mcrMatchView}=require('../../../lib/mahjong/mcr-match.ts');
 const ids=['seat-1','seat-2','seat-3','seat-4'],orders=[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]];
 function fixture(source,kind){
  const match=newMcrMatch(42),r=structuredClone(match.session.round),pool=[...core.createMcrTileSet()],at=d=>ids[(source+d)%4];
  const take=face=>{const i=pool.findIndex(t=>t.face===face);assert.ok(i>=0,face);return pool.splice(i,1)[0];};
  r.hands=Object.fromEntries(ids.map(id=>[id,[]]));r.melds=Object.fromEntries(ids.map(id=>[id,[]]));r.flowers=Object.fromEntries(ids.map(id=>[id,[]]));
  const discard=take('5m');r.hands[at(0)].push(discard);
  if(kind==='multi'){
   for(const [d,faces] of [[1,['1m','2m','3m','6m','7m','8m']],[2,['1p','2p','3p','4p','5p','6p']],[3,['1s','2s','3s','4s','5s','6s']]])r.hands[at(d)]=['5m',...faces.flatMap(f=>[f,f])].map(take);
  }else{
   r.hands[at(1)]=['4m','6m','C','C','C','1p','1p','1p','7s','7s','7s','N','N'].map(take);
   if(kind!=='kong')r.hands[at(2)]=['5m',...['1s','2s','3s','4s','5s','6s'].flatMap(f=>[f,f])].map(take);
   if(kind!=='chow')r.hands[at(3)]=Array(kind==='kong'?3:2).fill('5m').map(take);
  }
  for(let d=0;d<4;d++)while(r.hands[at(d)].length<(d===0?14:13)){
   const i=pool.findIndex(t=>core.isMcrStructureTile(t.face)&&t.face!=='5m');assert.ok(i>=0);r.hands[at(d)].push(pool.splice(i,1)[0]);
  }
  r.wall=pool;r.discardPile=[];r.phase='discard';r.activePlayerId=at(0);r.turnSource='wall';r.drewThisTurn=true;r.lastDrawnTileId=discard.id;
  r.pendingFlowerTileId=null;r.claimWindow=null;r.actionHistory=[];r.winResult=null;r.drawResult=null;
  return {match:{...match,session:{...match.session,round:r,opening:[]}},discard};
 }
 function inventory(m){const r=m.session.round,tiles=[...r.wall,...r.discardPile,...Object.values(r.hands).flat(),...Object.values(r.melds).flat().flatMap(g=>g.tiles),...Object.values(r.flowers).flat()];assert.equal(tiles.length,144);assert.equal(new Set(tiles.map(t=>t.id)).size,144);}
 function step(m,seat,predicate){const choices=mcrMatchView(m,seat).choices,c=choices.find(predicate);assert.ok(c,JSON.stringify({seat,choices}));const before=JSON.stringify(m),next=actMcrMatch(m,seat,m.revision,c.index);assert.equal(JSON.stringify(m),before);assert.equal(next.revision,m.revision+1);inventory(next);return next;}
 let cases=0;
 for(let source=0;source<4;source++)for(const order of orders)for(const wins of [[1,2],[1,3],[2,3],[1,2,3]]){
  const f=fixture(source,'multi');let m=f.match;inventory(m);m=step(m,source,c=>c.type==='discard'&&c.tileIds.includes(f.discard.id));
  for(const [i,d] of order.entries()){
   m=step(m,(source+d)%4,c=>wins.includes(d)?c.claim==='win':c.type==='pass-claim');
   if(i<2){assert.equal(m.session.round.phase,'claim');assert.equal(m.ledger.hands.length,0,'No provisional winner or payment before all responses');}
  }
  const winner=(source+Math.min(...wins))%4,win=m.session.round.winResult;assert.ok(win);assert.equal(win.winnerId,ids[winner]);assert.equal(win.discarderId,ids[source]);assert.equal(m.ledger.hands.length,1);
  const points=win.analysis.total;assert.deepEqual(m.ledger.balances,ids.map((_,seat)=>seat===winner?points+24:seat===source?-(points+8):-8));
  for(const seat of [0,1,2,3])m=actMcrMatch(m,seat,m.revision,'confirm');assert.equal(m.ledger.hands.length,1);cases++;
 }
 for(let source=0;source<4;source++)for(const order of orders)for(const kind of ['chow','pung','kong']){
  const f=fixture(source,kind);let m=step(f.match,source,c=>c.type==='discard'&&c.tileIds.includes(f.discard.id));
  const winningDistance=kind==='chow'?2:1;
  for(const [i,d] of order.entries()){
   m=step(m,(source+d)%4,c=>d===winningDistance?c.claim==='win':kind==='chow'&&d===1?c.claim==='chow':kind!=='chow'&&d===3?c.claim===kind:c.type==='pass-claim');
   if(i<2)assert.equal(m.session.round.phase,'claim');
  }
  assert.equal(m.session.round.winResult.winnerId,ids[(source+winningDistance)%4]);assert.equal(m.ledger.hands.length,1);
  assert.ok(Object.values(m.session.round.melds).every(groups=>groups.length===0),'Losing lower claim must not move tiles into a meld');cases++;
 }
 console.log(`PASS: ${cases} inventory-valid actual match arbitration paths; all 4 source seats and 6 response orders; 2/3 simultaneous wins use nearest turn order; wins beat chow/pung/kong; no early settlement, losing meld, duplicate confirmation payment or input mutation. Authored middle hands, not browser/network or full-history replays.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
