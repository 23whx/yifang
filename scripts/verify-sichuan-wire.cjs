const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {validSichuanPayload:valid}=require('../lib/mahjong/sichuan-wire.ts');
const {newSichuanSession,applySichuanSession:apply,sichuanSessionView:view}=require('../lib/mahjong/sichuan-session.ts');
const {sichuanTeachingAction:policy}=require('../lib/mahjong/sichuan-teaching.ts');
let s=newSichuanSession(Array.from({length:108},(_,i)=>i%27));
const setup=view(s,0);assert.equal(valid({kind:'view',view:setup},0),true);
for(const mutate of [v=>v.setup.hand.push(99),v=>v.setup.wall=[1,2],v=>v.setup.missing[1]=1,v=>v.setup.handCounts[0]=0,v=>v.preset='other-rules']){
 const v=structuredClone(setup);mutate(v);assert.equal(valid({kind:'view',view:v},0),false);
}
while(!s.game){const id=[0,1,2,3].find(i=>policy(view(s,i)));s=apply(s,id,s.revision,policy(view(s,id)));}
const play=view(s,0);assert.equal(valid({kind:'view',view:play},0),true);
for(const mutate of [v=>v.round.players[1].hand=[1],v=>v.round.players[0].hand[0]=27,v=>v.round.wall=[0],v=>v.balances[0]=1,v=>v.round.canDraw=true,v=>v.round.legal.discards=[99],v=>v.round.events=[{}],v=>v.payments=[{}],v=>v.wallChecks=[{}],v=>v.round.seat=2]){
 const v=structuredClone(play);mutate(v);assert.equal(valid({kind:'view',view:v},0),false);
}
for(const bad of [null,[],{}, {kind:'ack',request:0,accepted:true},{kind:'closed',player:9},{kind:'lobby',connected:[true,false,false]}])assert.equal(valid(bad,0),false);
console.log('PASS: valid setup/play views accepted; hidden hands, wall injection, tile ranges, rule identity, actor controls, malformed result/payment fields and inconsistent balances rejected.');
