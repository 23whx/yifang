// Actual rule action -> ledger -> bilingual production component rendering.
// Authored middle hand. SSR is NOT native modal or responsive acceptance.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-analysis-core'),rules=await import('miaoda-game-mcr-mahjong-rules'),load=Module._load,resolve=Module._resolveFilename,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-analysis-core'?core:request==='miaoda-game-mcr-mahjong-rules'?rules:load.call(this,request,...args);};
 Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.resolve(__dirname,'..',request.slice(2)):request,...args);};
 require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const React=require('react'),{renderToStaticMarkup:render}=require('react-dom/server'),Table=require('../components/cards/McrPractice.tsx').default;
 const {newMcrMatch,actMcrMatch,mcrMatchView}=require('../lib/mahjong/mcr-match.ts');
 let s=newMcrMatch(42);const r=structuredClone(s.session.round),pool=[...core.createMcrTileSet()];
 const take=face=>{const i=pool.findIndex(t=>t.face===face);assert.ok(i>=0);return pool.splice(i,1)[0];};
 r.hands=Object.fromEntries(r.playerOrder.map(id=>[id,[]]));r.melds=Object.fromEntries(r.playerOrder.map(id=>[id,[]]));r.flowers=Object.fromEntries(r.playerOrder.map(id=>[id,[]]));
 for(const face of ['1m','2m','3m','4m']){const tiles=[take(face),take(face),take(face)];r.melds['seat-1'].push({kind:'pung',exposure:'melded',tiles,claimedTileId:tiles[0].id,fromPlayerId:'seat-2'});}
 const pair=[take('N'),take('N')];r.hands['seat-1']=pair;
 for(const id of r.playerOrder)if(id!=='seat-1')while(r.hands[id].length<13){const i=pool.findIndex(t=>core.isMcrStructureTile(t.face)&&t.face!=='N');assert.ok(i>=0);r.hands[id].push(pool.splice(i,1)[0]);}
 r.wall=pool;r.discardPile=[];r.activePlayerId='seat-1';r.phase='discard';r.turnSource='wall';r.drewThisTurn=true;r.lastDrawnTileId=pair[1].id;r.pendingFlowerTileId=null;r.claimWindow=null;r.actionHistory=[];r.winResult=null;r.drawResult=null;
 s={...s,session:{...s.session,round:r,opening:[]}};
 const inventory=[...r.wall,...Object.values(r.hands).flat(),...Object.values(r.melds).flat().flatMap(m=>m.tiles)];assert.equal(inventory.length,144);assert.equal(new Set(inventory.map(t=>t.id)).size,144);
 const view=mcrMatchView(s,0),choice=view.choices.find(c=>c.type==='declare-self-draw');assert.ok(choice);
 const previous=s,before=JSON.stringify(s);s=actMcrMatch(s,0,s.revision,choice.index);assert.equal(JSON.stringify(previous),before);
 const win=s.session.round.winResult;assert.equal(s.session.round.phase,'finished');assert.ok(win);
 assert.equal(win.analysis.nonFlowerTotal,57);assert.equal(win.analysis.occurrences.find(o=>o.fanCode==='mcr-73').points,1);
 assert.deepEqual(s.ledger.balances,[195,-65,-65,-65]);
 for(const locale of ['zh','en']){
  const html=render(React.createElement(Table,{locale,remote:{view:mcrMatchView(s,0),disabled:false,onAction:()=>{}}}));
  assert.ok(html.includes(locale==='zh'?'一色四节高 · 48 分':'Four Pure Shifted Pungs · 48 points'));
  assert.ok(html.includes(locale==='zh'?'幺九刻 · 1 分':'Pung of Terminals or Honors · 1 point'));
  assert.ok(html.includes('57 + 0 = 57'));
  assert.ok(html.includes(locale==='zh'?'基础 8 + 牌值 57 = 支付 65':'base 8 + hand value 57 = 65'));
  assert.ok(html.includes('+195'));
 }
 for(let seat=0;seat<4;seat++){assert.equal(mcrMatchView(s,0).canNext,false);s=actMcrMatch(s,seat,s.revision,'confirm');assert.deepEqual(s.ledger.balances,[195,-65,-65,-65]);}
 assert.equal(mcrMatchView(s,0).canNext,true);s=actMcrMatch(s,0,s.revision,'next');assert.equal(s.hand,1);assert.deepEqual(s.ledger.balances,[195,-65,-65,-65]);
 console.log('PASS: authored 144-tile four-open-shifted-Pung self-draw via actual match action, 57-point hand including terminal +1, +195/-65 ledger; both production table locales render 48/+1, 57+0 and three 65-point payments; four confirmations do not repeat payment and next hand retains totals. SSR only, not native dialog, phone layout, browser click or LAN proof.');
})().catch(e=>{console.error(e);process.exitCode=1;});
