const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {BoardRecoverySession:Session}=require('../lib/board/recovery-session.ts');
(async()=>{
 const {default:create}=await import('../node_modules/ffish-es6/ffish.js');
 const f=await create({wasmBinary:fs.readFileSync(require.resolve('ffish-es6/ffish.wasm'))});
 let comparisons=0;
 function compare(session){const v=session.view(),restored=Session.restore(f,session.checkpoint(),v.game);try{
  assert.deepEqual(restored.view(),v);comparisons++;
  if(!v.ended&&v.legal.length){
   const oracle=new f.Board(v.game);
   try{if(v.moves)oracle.pushMoves(v.moves);const uci=v.legal[0];assert.ok(oracle.push(uci));
    restored.apply({seat:v.turn?0:1,round:v.match.round,revision:v.revision,action:{kind:'move',uci}});
    assert.equal(restored.view().fen,oracle.fen());assert.equal(restored.view().moves,oracle.moveStack());
   }finally{oracle.delete();}
  }
  assert.deepEqual(session.view(),v,'Recovery continuation must not mutate the original session');
 }finally{restored.dispose();}}
 function move(session,uci){const v=session.view();assert.ok(v.legal.includes(uci),`Fixture move ${uci} is illegal after ${v.moves}; legal: ${v.legal.join(' ')}`);session.apply({seat:v.turn?0:1,round:v.match.round,revision:v.revision,action:{kind:'move',uci}});compare(session);}
 for(const game of ['chess','xiangqi','shogi']){
  const session=new Session(f,game,`board-recovery-${game}`),oracle=new f.Board(game);compare(session);
  let seed=7123;
  try{
   for(let step=0;step<90&&!oracle.isGameOver();step++){
    const legal=oracle.legalMoves().trim().split(/\s+/);seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const uci=legal[seed%legal.length];assert.ok(oracle.push(uci));move(session,uci);
    const actual=session.view();assert.equal(actual.fen,oracle.fen());assert.equal(actual.moves,oracle.moveStack());assert.equal(actual.result,oracle.result());
   }
   const v=session.view(),before=session.checkpoint();
   const event={seat:v.turn?0:1,round:v.match.round,revision:v.revision,action:{kind:'move',uci:'a1a1'}};
   for(const bad of [event,{...event,seat:4},{...event,round:0},{...event,revision:-1},{...event,fen:v.fen},{...event,action:{kind:'move',uci:'e2e4',force:true}}]){
    assert.throws(()=>session.apply(bad));assert.equal(session.checkpoint(),before);assert.deepEqual(session.view(),v);
   }
   if(!v.ended){session.apply({...event,action:{kind:'resign'}});compare(session);assert.equal(session.view().result,v.turn?'0-1':'1-0');}
   let state=session.view();session.apply({seat:0,round:state.match.round,revision:state.revision,action:{kind:'rematch'}});compare(session);
   state=session.view();assert.equal(state.match.round,1);
   assert.throws(()=>session.apply({seat:0,round:1,revision:state.revision,action:{kind:'rematch'}}));
   session.apply({seat:1,round:1,revision:state.revision,action:{kind:'rematch'}});compare(session);
   state=session.view();const start=new f.Board(game);try{assert.equal(state.fen,start.fen());}finally{start.delete();}
   assert.equal(state.moves,'');assert.equal(state.match.round,2);assert.equal(state.ended,false);
   const frozen=session.checkpoint();
   for(const mutate of [
    x=>{x.version=2;},x=>{x.game='go';},x=>{x.identity='short';},x=>{x.fen='injected';},x=>{x.result='1-0';},
    x=>{x.events[0].seat=1;},x=>{x.events[0].action.uci='a1a1';},x=>{x.events[0].revision=1;},x=>{x.events[0].round=2;},
    x=>{x.events.splice(1,0,x.events[0]);},x=>{x.events=x.events.slice(1);},x=>{x.events=Array(10001).fill(x.events[0]);},
   ]){const bad=JSON.parse(frozen);mutate(bad);assert.throws(()=>Session.restore(f,JSON.stringify(bad),game));}
   assert.throws(()=>Session.restore(f,frozen,game==='chess'?'shogi':'chess'));
   assert.throws(()=>Session.restore(f,'x'.repeat(1500001),game));assert.throws(()=>Session.restore(f,'{',game));
  }finally{session.dispose();session.dispose();oracle.delete();}
  assert.throws(()=>session.view());assert.throws(()=>session.checkpoint());
 }
 // From a standard shogi start: promote a bishop, capture the enemy bishop,
 // then drop it. Replaying only FEN or forgetting captured pieces would fail.
 const shogi=new Session(f,'shogi','shogi-hands-recovery');
 try{
  for(const uci of ['c3c4','a7a6','b2g7+','e9d8','g7h8','a6a5','B@e4'])move(shogi,uci);
  assert.ok(shogi.view().moves.includes('B@e4'));
 }finally{shogi.dispose();}
 // Special moves and repetition must survive replay, not FEN-only loading.
 for(const line of [
  ['e2e4','e7e5','g1f3','b8c6','f1c4','g8f6','e1g1'],
  ['e2e4','a7a6','e4e5','d7d5','e5d6'],
  ['f2f3','e7e5','g2g4','d8h4'],
  ['g1f3','g8f6','f3g1','f6g8','g1f3','g8f6','f3g1','f6g8']
 ]){
  const s=new Session(f,'chess','special-recovery-test'),oracle=new f.Board('chess');
  try{for(const uci of line){assert.ok(oracle.push(uci));move(s,uci);}assert.equal(s.view().ended,oracle.isGameOver());assert.equal(s.view().result,oracle.result());assert.equal(s.view().fen,oracle.fen());}
  finally{s.dispose();oracle.delete();}
 }
 console.log(`PASS: ${comparisons} real-WASM replay comparisons across chess/xiangqi/shogi, ordinary continuation, castling/en-passant/mate/repetition histories, resignation/bilateral rematch and strict malformed/stale/cross-game rejection. Recovery core only; no peer authentication, storage or UI claim.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
