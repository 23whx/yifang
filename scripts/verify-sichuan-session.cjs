const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {newSichuanSession,applySichuanSession:apply,sichuanSessionView:view,closeSichuanSession:close,sichuanRemotePhase}=require('../lib/mahjong/sichuan-session.ts');
let seed=31,results=0,frames=0;
function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
for(let trial=0;trial<40;trial++){
 const deck=Array.from({length:108},(_,i)=>i%27);for(let i=107;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
 let s=newSichuanSession(deck),steps=0;
 while(!s.game||s.game.round.phase!=='ended'){
  for(let seat=0;seat<4;seat++)assert.equal(sichuanRemotePhase(view(s,seat)),'playing','Intermediate winners must not end the table');
  assert.ok(++steps<500);let id,action;
  if(!s.game){
   if(s.setup.phase==='exchange'){id=s.setup.exchange.indexOf(null);const hand=view(s,id).setup.hand;action={kind:'exchange',tiles:[0,1,2].map(suit=>hand.filter(t=>Math.floor(t/9)===suit)).find(h=>h.length>=3).slice(0,3)};}
   else {id=s.setup.missing.indexOf(null);const hand=view(s,id).setup.hand,counts=[0,1,2].map(suit=>hand.filter(t=>Math.floor(t/9)===suit).length);action={kind:'missing',suit:counts.indexOf(Math.min(...counts))};}
  }else{
   const r=s.game.round;
   if(r.phase==='result'){id=s.confirmed.indexOf(false);action={kind:'ack'};}
   else if(r.phase==='claims'){id=r.claims.replies.indexOf(null);const o=view(s,id).round.claim.options;action={kind:'claim',choice:o.win?'win':o.kong?'kong':o.pung?'pung':'pass'};}
   else if(r.phase==='draw'){id=r.actor;action={kind:'draw'};}
   else {id=r.actor;const o=view(s,id).round.legal;action=o.win?{kind:'win'}:o.concealedKongs.length?{kind:'concealed-kong',tile:o.concealedKongs[0]}:{kind:'discard',tile:o.discards[Math.floor(random()*o.discards.length)]};}
  }
  for(let seat=0;seat<4;seat++){const v=view(s,seat);assert.equal('game' in v,false);if(v.stage==='play')for(let other=0;other<4;other++)if(other!==seat&&!v.round.players[other].retired)assert.deepEqual(v.round.players[other].hand,[]);frames++;}
  const before=JSON.stringify(s),next=apply(s,id,s.revision,action);assert.equal(JSON.stringify(s),before);
  assert.throws(()=>apply(next,id,s.revision,action));
  if(action.kind==='ack'&&s.confirmed.filter(Boolean).length<3){assert.deepEqual(next.game,s.game);assert.throws(()=>apply(next,id,next.revision,action));}
  if(action.kind==='ack'&&s.confirmed.filter(Boolean).length===3)results++;
  s=next;
 }
 assert.equal(s.game.ledger.balances.reduce((a,b)=>a+b,0),0);
 for(let seat=0;seat<4;seat++)assert.equal(sichuanRemotePhase(view(s,seat)),'finished','Terminal view unlocks a fresh room for every player');
 const ended=close(s);assert.equal(ended.closed,true);assert.deepEqual(ended.game,s.game);assert.throws(()=>apply(ended,0,ended.revision,{kind:'draw'}));
}
assert.ok(results>0);
console.log(`PASS: 40 preset-backed sessions from exchange to settlement, ${results} four-seat result confirmations, ${frames} private views; stale/duplicate actions and closed-session rejection. Headless only.`);
