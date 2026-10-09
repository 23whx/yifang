const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.tsx']=require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
const resolve=Module._resolveFilename;
Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.resolve(__dirname,'..',request.slice(2)):request,...args);};
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load;
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?core:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 const js=require.extensions['.js'];require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {newMcrMatch:create,mcrMatchView:view,actMcrMatch:act,closeMcrMatch:close,mcrRemotePhase}=require('../lib/mahjong/mcr-match.ts');
 const {validMcrPayload}=require('../lib/mahjong/mcr-wire.ts');
 let s=create(42),moves=0,wins=0;const winds=['E','S','W','N'];
 for(let hand=0;hand<16;hand++){
  assert.equal(s.hand,hand);assert.equal(s.session.round.dealerId,`seat-${hand%4+1}`);assert.equal(s.session.round.roundWind,winds[Math.floor(hand/4)]);
  assert.throws(()=>act(s,0,s.revision,'next'));let steps=0;
  while(s.session.round.phase!=='finished'){
   let selected;for(let id=0;id<4;id++){
    const v=view(s,id);assert.equal('nextSeed' in v,false);assert.equal('initialSeed' in v.table,false);assert.ok(validMcrPayload({kind:'view',view:v},id),'invalid genuine view '+JSON.stringify(v));
    if(v.choices.length&&!selected){const c=v.choices.find(c=>c.claim==='win'||c.type==='declare-self-draw')??v.choices.find(c=>c.type==='replace-flower')??v.choices.find(c=>['kong','pung','chow'].includes(c.claim))??v.choices[0];selected={id,index:c.index};}
   }
   assert.ok(selected);const old=s;s=act(s,selected.id,s.revision,selected.index);assert.throws(()=>act(s,selected.id,old.revision,selected.index));moves++;assert.ok(++steps<1000);
  }
  for(let id=0;id<4;id++)assert.ok(validMcrPayload({kind:'view',view:view(s,id)},id),'invalid finished view '+JSON.stringify(view(s,id).table.winResult?.analysis));
  wins+=!!s.session.round.winResult;assert.equal(s.ledger.hands.length,hand+1);assert.equal(s.ledger.balances.reduce((a,b)=>a+b,0),0);
  if(s.session.round.winResult){
   for(const mutate of [
    v=>v.table.winResult.winnerId=`seat-${(Number(v.table.winResult.winnerId.slice(-1))%4)+1}`,
    v=>v.table.winResult.settlement.totalFan++,
    v=>v.table.winResult.settlement.payments['seat-1']++,
    v=>{v.table.winResult.settlement.deltas['seat-1']++;v.table.winResult.settlement.deltas['seat-2']--;},
    v=>v.table.winResult.winMethod=v.table.winResult.winMethod==='discard'?'self-draw':'discard',
    v=>v.table.winResult.discarderId=v.table.winResult.winnerId,
    v=>v.table.winResult.analysis.fanCodes.push(v.table.winResult.analysis.fanCodes[0]),
    v=>v.table.winResult.analysis.fanCodes.pop(),
   ]){const bad=structuredClone(view(s,0));mutate(bad);assert.equal(validMcrPayload({kind:'view',view:bad},0),false,String(mutate));}
  }
  const retained=JSON.stringify(s.session.round),balances=[...s.ledger.balances];
  for(let id=0;id<4;id++){
   assert.equal(mcrRemotePhase(view(s,id)),'playing','Do not finish before final confirmation');
   s=act(s,id,s.revision,'confirm');assert.equal(JSON.stringify(s.session.round),retained);assert.deepEqual(s.ledger.balances,balances);assert.equal(s.ledger.hands.length,hand+1);
   for(let seat=0;seat<4;seat++)assert.equal(mcrRemotePhase(view(s,seat)),hand===15&&id===3?'finished':'playing','All clients agree on full-match completion');
   assert.throws(()=>act(s,id,s.revision,'confirm'));if(id<3)assert.throws(()=>act(s,0,s.revision,'next'));
  }
  if(hand<15){const old=s;s=act(s,0,s.revision,'next');assert.throws(()=>act(s,0,old.revision,'next'));assert.ok(s.session.confirmed.every(x=>!x));}else {assert.ok(view(s,0).complete);assert.throws(()=>act(s,0,s.revision,'next'));}
 }
 const {mcrMatchResultReason}=require('../lib/mahjong/mcr-result-copy.ts');
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),Practice=require('../components/cards/McrPractice.tsx').default;
 for(const locale of ['zh','en']){
  const highest=Math.max(...s.ledger.balances),copy=mcrMatchResultReason(s.ledger.balances,locale);
  assert.ok(copy.includes(String(highest)));
  s.ledger.balances.forEach((score,seat)=>{if(score===highest)assert.ok(copy.includes(locale==='zh'?`座位 ${seat+1}`:`Seat ${seat+1}`));});
  const tied=mcrMatchResultReason([10,-10,10,-10],locale);
  assert.ok(tied.includes(locale==='zh'?'座位 1、座位 3并列获胜':'Seat 1, Seat 3 tie for first place'));
  assert.ok(mcrMatchResultReason([0,0,0,0],locale).includes(locale==='zh'?'座位 1、座位 2、座位 3、座位 4并列获胜':'Seat 1, Seat 2, Seat 3, Seat 4 tie for first place'));
  assert.ok(mcrMatchResultReason([-20,5,10,5],locale).includes(locale==='zh'?'座位 3获胜':'Seat 3 wins'));
  const html=renderToStaticMarkup(React.createElement(Practice,{locale,remote:{view:view(s,0),disabled:false,onAction:()=>{}}}));
  assert.ok(html.includes(locale==='zh'?'本场结果':'Match result'));
  assert.ok(html.includes(copy));
  assert.ok(html.includes(locale==='zh'?'圈风 北风':'prevailing wind North'));
 }
 console.log('PASS: actual completed-match component markup names the cumulative winner, distinguishes match from final-hand result, uses full wind names; bilingual single/two-way/four-way ties verified. Server rendering only, not modal interaction evidence.');
 const v=view(s,0);v.balances[0]=999;assert.notEqual(s.ledger.balances[0],999);v.history[0].settlement.delta[0]=999;assert.notEqual(s.ledger.hands[0].settlement.delta[0],999);
 const ended=close(s);assert.equal(view(ended,0).choices.length,0);assert.throws(()=>act(ended,0,ended.revision,0));
 console.log(`PASS: complete fixed-seat 16-hand MCR match, ${moves} actions, ${wins} wins; four wind/dealer cycles, exactly-once zero-sum ledger, unanimous consent, retained final results, stale next-hand rejection and private seed. Headless, not full rule/UI/network proof.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
