// Actual added-kong claim -> match ledger -> bilingual production component.
// Authored inventory-valid middle hand; SSR is not native browser acceptance.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-analysis-core'),rules=await import('miaoda-game-mcr-mahjong-rules'),load=Module._load,resolve=Module._resolveFilename,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-analysis-core'?core:request==='miaoda-game-mcr-mahjong-rules'?rules:load.call(this,request,...args);};
 Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.resolve(__dirname,'..',request.slice(2)):request,...args);};
 require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const React=require('react'),{renderToStaticMarkup:render}=require('react-dom/server'),Table=require('../components/cards/McrPractice.tsx').default;
 const {newMcrMatch,actMcrMatch,mcrMatchView}=require('../lib/mahjong/mcr-match.ts');
 let match=newMcrMatch(42);const round=structuredClone(match.session.round),pool=[...core.createMcrTileSet()];
 const take=face=>{const index=pool.findIndex(tile=>tile.face===face);assert.ok(index>=0,face);return pool.splice(index,1)[0];};
 round.hands=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
 round.melds=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
 round.flowers=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
 round.hands['seat-2']=['1m','2m','3m','4p','4p','4p','7s','7s','7s','C','C','7m','8m'].map(take);
 const fourth=take('9m'),pung=['9m','9m','9m'].map(take);
 round.melds['seat-1']=[{kind:'pung',exposure:'melded',tiles:pung,claimedTileId:pung[0].id,fromPlayerId:'seat-3'}];
 round.hands['seat-1'].push(fourth);
 for(const id of round.playerOrder)if(id!=='seat-2')while(round.hands[id].length<(id==='seat-1'?11:13)){
  const index=pool.findIndex(tile=>core.isMcrStructureTile(tile.face));assert.ok(index>=0);round.hands[id].push(pool.splice(index,1)[0]);
 }
 round.wall=[pool.splice(pool.findIndex(tile=>core.isMcrStructureTile(tile.face)),1)[0]];
 round.discardPile=pool.filter(tile=>core.isMcrStructureTile(tile.face));
 round.flowers['seat-4']=pool.filter(tile=>!core.isMcrStructureTile(tile.face));
 round.activePlayerId='seat-1';round.phase='discard';round.turnSource='wall';round.drewThisTurn=true;round.lastDrawnTileId=fourth.id;
 round.pendingFlowerTileId=null;round.claimWindow=null;round.actionHistory=[];round.winResult=null;round.drawResult=null;
 match={...match,session:{...match.session,round,opening:[]}};
 function inventory(s){const r=s.session.round,tiles=[...r.wall,...r.discardPile,...Object.values(r.hands).flat(),...Object.values(r.melds).flat().flatMap(m=>m.tiles),...Object.values(r.flowers).flat()];assert.equal(tiles.length,144);assert.equal(new Set(tiles.map(t=>t.id)).size,144);}
 function step(s,seat,type){const view=mcrMatchView(s,seat),choice=view.choices.find(c=>c.type===type);assert.ok(choice,`${type} seat ${seat}`);const before=JSON.stringify(s),next=actMcrMatch(s,seat,s.revision,choice.index);assert.equal(JSON.stringify(s),before);assert.equal(next.revision,s.revision+1);inventory(next);return next;}
 inventory(match);
 match=step(match,0,'declare-added-kong');
 assert.equal(match.session.round.claimWindow.kind,'added-kong');
 assert.equal(match.session.round.melds['seat-1'][0].kind,'pung','No premature kong before responses');
 match=step(match,1,'claim-added-kong-win');
 for(const seat of [2,3])if(match.session.round.phase==='claim')match=step(match,seat,'pass-claim');
 const win=match.session.round.winResult;assert.ok(win);assert.equal(match.session.round.phase,'finished');
 assert.equal(match.session.round.melds['seat-1'][0].kind,'pung');
 assert.equal(win.winnerId,'seat-2');assert.equal(win.discarderId,'seat-1');
 // The independent shape has Robbing the Kong 8, Concealed Hand 2, Two
 // Concealed Pungs 2, and Old Young Pair 1. The offered tile is not a normal
 // discard, a replacement draw, or Last Tile despite the public pung.
 assert.deepEqual([...win.analysis.fanCodes].sort(),['mcr-47','mcr-62','mcr-66','mcr-72']);
 const points=win.analysis.total;assert.equal(points,13);
 assert.deepEqual(match.ledger.balances,[-21,37,-8,-8]);
 for(const locale of ['zh','en']){
  const html=render(React.createElement(Table,{locale,remote:{view:mcrMatchView(match,0),disabled:false,onAction:()=>{}}}));
  assert.ok(html.includes(locale==='zh'?'抢杠和 · 8 分':'Robbing the Kong · 8 points'));
  assert.ok(html.includes(locale==='zh'?'不是胡普通弃牌':'not an ordinary discard win'));
  assert.ok(html.includes(locale==='zh'?'不是普通弃牌':'not an ordinary discard'));
  assert.ok(html.includes(`+${points+24}`),'winner payment must be visible');
 }
 for(let seat=0;seat<4;seat++){assert.equal(mcrMatchView(match,0).canNext,false);match=actMcrMatch(match,seat,match.revision,'confirm');assert.deepEqual(match.ledger.balances,[-points-8,points+24,-8,-8]);}
 assert.equal(mcrMatchView(match,0).canNext,true);
 console.log(`PASS: native-rule added-kong claim through MCR match ledger; ${points} non-flower points [${win.analysis.fanCodes.join(',')}], winner +${points+24}; both production table locales render Robbing the Kong fan and source-specific payment, not ordinary discard; four confirmations do not settle twice. Authored middle hand and SSR only, not browser modal/mobile/LAN acceptance.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
