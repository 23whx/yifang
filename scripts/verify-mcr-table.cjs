const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load;
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?core:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 const js=require.extensions['.js'];require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);

 require.extensions['.tsx']=require.extensions['.ts'];
 const path=require('node:path'),resolve=Module._resolveFilename;
 Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.resolve(__dirname,'..',request.slice(2)):request,...args);};
 const React=require('react'),{renderToStaticMarkup:render}=require('react-dom/server');
 const Table=require('../components/cards/McrPractice.tsx').default;
 for(const componentName of ['McrRemote','RiichiRemote','SichuanRemote'])for(const locale of ['zh','en']){
  const Remote=require('../components/cards/'+componentName+'.tsx').default;
  const html=render(React.createElement(Remote,{locale}));
  assert.ok(html.includes(locale==='zh'?'尚未连接':'Not connected'),componentName+' initial status');
  assert.ok(html.includes(locale==='zh'?'创建四人房间':'Create four-player room'),componentName+' create control');
  assert.ok(html.includes(locale==='zh'?'作为朋友加入':'Join as a guest'),componentName+' join control');
  assert.ok(!html.includes(locale==='zh'?'等待房主确认……':'Waiting for host acknowledgement…'),componentName+' must not start pending');
 }
 console.log('PASS: six localized initial Mahjong remote panels expose create/join, disconnected status and no spurious pending action. SSR only.');
 const {newMcrMatch,mcrMatchView,actMcrMatch}=require('../lib/mahjong/mcr-match.ts');
 // Authored display-only fixture: the engine keeps the claimed tile last.
 // The table should teach a sequence in numeric order, without altering it.
 for(const locale of ['zh','en']){
  const displayView=mcrMatchView(newMcrMatch(42),0);
  displayView.table.melds['seat-1']=[{kind:'chow',exposure:'melded',tiles:[2,4,3].map(n=>({id:`${n}m:0`,face:`${n}m`,copy:0})),claimedTileId:'3m:0',fromPlayerId:'seat-4'}];
  const before=JSON.stringify(displayView);
  const html=render(React.createElement(Table,{locale,remote:{view:displayView,disabled:false,onAction(){assert.fail('render dispatch');}}}));
  const seat=html.split(`<h3>${locale==='zh'?'座位 1 · 累计 0 分':'Seat 1 · total 0 points'}</h3>`)[1]?.split('</section>')[0];
  assert.ok(seat,'actual seat section');
  const labels=[...seat.matchAll(/role="img" aria-label="([^"]+)"/g)].map(m=>m[1]);
  const {tileEnglish}=require('../content/guided-tables.ts');
  assert.deepEqual(labels,['二万','三万','四万'].map(t=>locale==='zh'?t:tileEnglish(t)));
  assert.equal(JSON.stringify(displayView),before,'renderer keeps original command/claimed tile data');
  if(locale==='en')for(const [count,expected] of [[1,'1 tile left'],[2,'2 tiles left']]){
   const countView=structuredClone(displayView);countView.table.wallCount=count;
   const countHtml=render(React.createElement(Table,{locale,remote:{view:countView,disabled:false,onAction(){assert.fail('render dispatch');}}}));
   assert.ok(countHtml.includes(expected),`wall count ${count} must use the correct English noun`);
  }
 }
 const {validMcrPayload}=require('../lib/mahjong/mcr-wire.ts');
 let s=newMcrMatch(42),renders=0;const phases=new Set();
 while(true){
  for(let id=0;id<4;id++)for(const locale of ['zh','en'])for(const disabled of [false,true]){
   const view=mcrMatchView(s,id),html=render(React.createElement(Table,{locale,remote:{view,disabled,onAction(){assert.fail('render dispatch');}}}));
   assert.ok(validMcrPayload({kind:'view',view},id),'real flower views pass wire validation');
   const expectedFlowers=s.session.opening[0]?.flowers??s.session.round.flowers;
   for(let seat=0;seat<4;seat++){
    const key=`seat-${seat+1}`,flowers=view.table.publicFlowers[key];
    assert.deepEqual(flowers,expectedFlowers[key]??expectedFlowers[seat],'only already exposed flowers, including opening snapshots');
    assert.ok(html.includes(locale==='zh'?`座位 ${seat+1} · 已亮出 ${flowers.length} 张花牌`:`Seat ${seat+1} · ${flowers.length} exposed ${flowers.length===1?'flower':'flowers'}`));
   }
   const publicSection=html.split('<section aria-label="'+(locale==='zh'?'各座位已亮出的花牌':'Exposed flowers by seat')+'"')[1]?.split('</section>')[0];
   assert.ok(publicSection,'public flower section');
   assert.equal((publicSection.match(/role="img"/g)||[]).length,Object.values(view.table.publicFlowers).flat().length,'each public flower has artwork');
   if(renders===0){
    const missing=structuredClone(view);delete missing.table.publicFlowers;
    assert.equal(validMcrPayload({kind:'view',view:missing},id),false);
    const forged=structuredClone(view);forged.table.publicFlowers['seat-2']=[{id:'1m:0',face:'1m',copy:0}];
    assert.equal(validMcrPayload({kind:'view',view:forged},id),false,'structural tiles cannot be smuggled as flowers');
   }
   const exposed=Object.values(view.table.publicFlowers).flat();
   if(exposed.length){
    const forged=structuredClone(view),other=`seat-${(id+1)%4+1}`;
    forged.table.publicFlowers[other].push({...exposed[0]});
    forged.table.otherFlowerCounts[other]++;
    assert.equal(validMcrPayload({kind:'view',view:forged},id),false,'duplicate public physical flower rejected');
    const before=JSON.stringify(s);exposed[0].face='BAD';assert.equal(JSON.stringify(s),before,'public flower view cannot mutate host state');
   }
   assert.ok(html.includes(locale==='en'?'You are seat '+(id+1):'你是座位 '+(id+1)));
   assert.ok(!html.includes('One computer action')&&!html.includes('电脑行动一步'));
   assert.ok(!html.includes('End practice')&&!html.includes('结束练习'));
   const buttons=[...html.replace(/<dialog[\s\S]*?<\/dialog>/g,'').matchAll(/<button\b([^>]*)>/g)].map(x=>x[1]);
   const chows=view.choices.filter(c=>c.type==='claim-discard'&&c.claim==='chow');
   const distinctChows=new Set(chows.map(c=>JSON.stringify(c.tileIds.map(id=>id.split(':')[0]).sort())));
   assert.equal(buttons.length,view.choices.length-chows.length+distinctChows.size+(view.table.phase==='finished'?2:0));
   assert.equal((html.match(new RegExp(locale==='zh'?'吃牌：同一花色的连续三张':'<span>Chow: three consecutive tiles in one suit</span>','g'))||[]).length,distinctChows.size,'one rendered button per distinct chow, including locked state');
   if(locale==='en')for(const term of ['chow','pung','kong','win'])assert.ok(!html.includes(`<span>${term}</span>`),'Do not expose raw unexplained command labels: '+term);
   const hasSetClaim=view.choices.some(c=>c.type==='claim-discard'&&['chow','pung','kong'].includes(c.claim??''));
   assert.equal(html.includes(locale==='zh'?'上面是别人刚打出的牌。':'The tile above was just discarded by another player.'),hasSetClaim,'Explain contributed tiles only when this player has a set claim');
   if(disabled)assert.ok(buttons.every(b=>b.includes('disabled=""')));
   phases.add(view.table.phase);renders++;
  }
  if(s.session.round.phase==='finished')break;
  const v=[0,1,2,3].map(id=>mcrMatchView(s,id)).find(v=>v.choices.length),c=v.choices.find(c=>c.claim==='win'||c.type==='declare-self-draw')??v.choices.find(c=>c.type==='replace-flower')??v.choices[0];
  s=actMcrMatch(s,v.seat,s.revision,c.index);assert.ok(renders<16000);
 }
 console.log('PASS: '+renders+' bilingual four-seat table renders across '+[...phases]+', remote seat identity, no bots/local restart, locked buttons. Not browser acceptance.');
})().catch(e=>{console.error(e);process.exitCode=1;});
