const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {newSichuanSession,applySichuanSession:apply,sichuanSessionView:view,closeSichuanSession:close}=require('../lib/mahjong/sichuan-session.ts');
const {sichuanTeachingAction:policy}=require('../lib/mahjong/sichuan-teaching.ts');
let seed=31,results=0,frames=0;
function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
for(let trial=0;trial<40;trial++){
 const deck=Array.from({length:108},(_,i)=>i%27);for(let i=107;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
 let s=newSichuanSession(deck),steps=0;
 while(!s.game||s.game.round.phase!=='ended'){
  assert.ok(++steps<500);let id,action;
  id=[0,1,2,3].find(i=>policy(view(s,i))!==null);assert.notEqual(id,undefined);action=policy(view(s,id));
  for(let seat=0;seat<4;seat++){const v=view(s,seat);assert.equal('game' in v,false);if(v.stage==='play')for(let other=0;other<4;other++)if(other!==seat&&!v.round.players[other].retired)assert.deepEqual(v.round.players[other].hand,[]);frames++;}
  const before=JSON.stringify(s),next=apply(s,id,s.revision,action);assert.equal(JSON.stringify(s),before);
  assert.throws(()=>apply(next,id,s.revision,action));
  if(action.kind==='ack'&&s.confirmed.filter(Boolean).length<3){assert.deepEqual(next.game,s.game);assert.throws(()=>apply(next,id,next.revision,action));}
  if(action.kind==='ack'&&s.confirmed.filter(Boolean).length===3)results++;
  s=next;
 }
 assert.equal(s.game.ledger.balances.reduce((a,b)=>a+b,0),0);
 const ended=close(s);assert.equal(ended.closed,true);assert.deepEqual(ended.game,s.game);assert.throws(()=>apply(ended,0,ended.revision,{kind:'draw'}));
}
assert.ok(results>0);
console.log(`PASS: view-only teaching policy, 40 preset-backed sessions from exchange to settlement, ${results} four-seat result confirmations, ${frames} private views; stale/duplicate actions and closed-session rejection. Headless only.`);
