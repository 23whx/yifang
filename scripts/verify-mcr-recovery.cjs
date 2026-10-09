const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load;
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?core:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 const js=require.extensions['.js'];require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {McrRecoverySession:S}=require('../lib/mahjong/mcr-recovery.ts');
 const {newMcrMatch,actMcrMatch,mcrMatchView}=require('../lib/mahjong/mcr-match.ts');
 const {validMcrPayload}=require('../lib/mahjong/mcr-wire.ts');
 const s=new S('mcr-recovery-original',42);let reference=newMcrMatch(42),steps=0,checks=0;
 const prefixes=[];
 function step(id,choice,restore=false){
  const revision=s.view(id).revision,move={revision,choice},copy=restore?S.restore(s.checkpoint()):null;
  if(restore)prefixes.push({revision,views:[0,1,2,3].map(i=>s.view(i))});
  s.apply(id,move);reference=actMcrMatch(reference,id,revision,choice);
  if(copy){copy.apply(id,move);assert.equal(copy.checkpoint(),s.checkpoint());checks++;}
  for(let seat=0;seat<4;seat++){
   const view=s.view(seat);assert.deepEqual(view,mcrMatchView(reference,seat));assert.ok(validMcrPayload({kind:'view',view},seat));
   for(const k of ['seed','initialSeed','nextSeed','archive','session','wall'])assert.ok(!(k in view)&&!(k in view.table));
   assert.equal(view.balances.reduce((a,b)=>a+b),0);
  }
  const after=s.checkpoint();assert.throws(()=>s.apply(id,move));assert.equal(s.checkpoint(),after);steps++;
 }
 for(let hand=0;hand<2;hand++){
  while(s.view(0).table.phase!=='finished'){
   assert.ok(steps<2000);const v=[0,1,2,3].map(i=>s.view(i)).find(v=>v.choices.length);assert.ok(v);
   const c=v.choices.find(c=>c.claim==='win'||c.type==='declare-self-draw')??v.choices.find(c=>c.type==='replace-flower')??v.choices.find(c=>['kong','pung','chow'].includes(c.claim))??v.choices[0];
   step(v.seat,c.index,steps%150===0);
  }
  assert.equal(s.view(0).history.length,hand+1);const ledger=JSON.stringify(s.view(0).history);
  for(let id=0;id<4;id++){step(id,'confirm',id===0||id===2);assert.equal(JSON.stringify(s.view(0).history),ledger);}
  if(hand===0)step(0,'next',true);
 }
 for(const p of prefixes.slice(0,2))for(let id=0;id<4;id++)assert.deepEqual(s.viewAt(id,p.revision),p.views[id]);
 const raw=JSON.parse(s.checkpoint());
 for(const bad of [{...raw,version:2},{...raw,game:'sichuan-four'},{...raw,preset:'other-rules'},{...raw,seed:-1},{...raw,balances:[99,0,0,0]},{...raw,actions:[...raw.actions,raw.actions[0]]},{...raw,actions:[{seat:9,move:{revision:0,choice:0}}]},{...raw,actions:[{seat:0,move:{revision:0,choice:0,score:88}}]}])assert.throws(()=>S.restore(JSON.stringify(bad)));
 assert.throws(()=>S.restore('x'.repeat(2000001)));assert.throws(()=>s.viewAt(0,steps+1));
 const original=s.checkpoint(),view=s.view(0);view.balances.fill(999);view.table.ownHand.length=0;assert.equal(s.checkpoint(),original);
 console.log(`PASS MCR private recovery: ${steps} live actions across two hands, ${checks} restore-and-continue checkpoints including result/partial confirmations/next hand, all four exact views, zero-sum nonduplicated ledger, historical projections and malformed archives. No transport authentication or page recovery claim.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
