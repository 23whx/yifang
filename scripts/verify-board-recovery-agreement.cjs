const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {BoardRecoverySession:Session}=require('../lib/board/recovery-session.ts');
const {proposeBoardRecovery:propose,newBoardRecoverySecret:secret,boardRecoveryProof:sign,verifyBoardRecoveryProof:verify,validBoardRecoveryChallenge:valid,BoardRecoveryAgreement:Agreement}=require('../lib/board/recovery-agreement.ts');
(async()=>{
 const {default:create}=await import('../node_modules/ffish-es6/ffish.js');const f=await create({wasmBinary:fs.readFileSync(require.resolve('ffish-es6/ffish.wasm'))});
 let agreements=0,attacks=0;
 for(const game of ['chess','xiangqi','shogi']){
  const s=new Session(f,game,`agreement-${game}-test`),snapshots=[];
  try{
   snapshots.push(s.checkpoint());
   for(let i=0;i<8;i++){const v=s.view();s.apply({seat:v.turn?0:1,round:1,revision:v.revision,action:{kind:'move',uci:v.legal[0]}});snapshots.push(s.checkpoint());}
   for(const [hi,gi] of [[8,8],[8,7],[7,8],[0,8],[8,0]]){
    const p=await propose(f,game,snapshots[hi],snapshots[gi]);assert.equal(p.checkpoint,snapshots[Math.max(hi,gi)]);assert.equal(p.hostRevision,hi);assert.equal(p.guestRevision,gi);
    const challenge={game,identity:p.identity,epoch:crypto.randomUUID(),hostNonce:secret(),guestNonce:secret(),hostDigest:p.hostDigest,guestDigest:p.guestDigest,agreedDigest:p.agreedDigest};assert.ok(valid(challenge));
    const key=secret(),hostProof=await sign(key,challenge,'host'),guestProof=await sign(key,challenge,'guest');
    assert.notEqual(hostProof,guestProof);assert.ok(await verify(key,challenge,'host',hostProof));assert.ok(await verify(key,challenge,'guest',guestProof));
    assert.equal(await verify(key,challenge,'guest',hostProof),false);assert.equal(await verify(secret(),challenge,'host',hostProof),false);
    for(const field of ['game','identity','epoch','hostNonce','guestNonce','hostDigest','guestDigest','agreedDigest']){
     const changed={...challenge,[field]:field==='game'?(game==='chess'?'shogi':'chess'):field==='identity'||field==='epoch'?crypto.randomUUID():secret()};
     assert.equal(await verify(key,changed,'host',hostProof),false,`Must bind ${field}`);attacks++;
    }
    assert.equal(await verify(key,{...challenge,hostNonce:challenge.guestNonce,guestNonce:challenge.hostNonce},'guest',guestProof),false);
    assert.equal(await verify(key,{...challenge,epoch:challenge.identity},'guest',guestProof),false);
    assert.equal(await verify(key,{...challenge,hostNonce:challenge.guestNonce},'guest',guestProof),false);
    assert.equal(await verify(key,challenge,'guest','not-a-proof'),false);agreements++;
    const host=new Agreement(key,'host',game,p.identity,challenge.epoch),guest=new Agreement(key,'guest',game,p.identity,challenge.epoch);
    const fresh={...challenge,hostNonce:host.nonce,guestNonce:guest.nonce};
    await Promise.all([host.prepare(f,fresh,snapshots[hi],snapshots[gi]),guest.prepare(f,fresh,snapshots[hi],snapshots[gi])]);
    assert.throws(()=>host.confirmedCheckpoint());assert.throws(()=>guest.confirmedCheckpoint());
    const hp=await host.proof();assert.ok(await guest.acceptPeer(hp));assert.throws(()=>guest.confirmedCheckpoint(),'Must create own proof too');
    const gp=await guest.proof();const raced=await Promise.all([host.acceptPeer(gp),host.acceptPeer(gp)]);assert.deepEqual(raced,[true,false]);
    assert.equal(host.confirmedCheckpoint(),p.checkpoint);assert.equal(guest.confirmedCheckpoint(),p.checkpoint);
    await assert.rejects(()=>host.proof());await assert.rejects(()=>host.prepare(f,fresh,snapshots[hi],snapshots[gi]));
    const oldReplay=new Agreement(key,'guest',game,p.identity,challenge.epoch);
    await assert.rejects(()=>oldReplay.prepare(f,fresh,snapshots[hi],snapshots[gi]),/attempt mismatch/);
    assert.equal(await oldReplay.acceptPeer(hp),false);
    const wrongDigest=new Agreement(key,'guest',game,p.identity,challenge.epoch);
    await assert.rejects(()=>wrongDigest.prepare(f,{...fresh,guestNonce:wrongDigest.nonce,agreedDigest:secret()},snapshots[hi],snapshots[gi]),/digest mismatch/);
    assert.throws(()=>wrongDigest.confirmedCheckpoint());
   }
   const parsed=JSON.parse(snapshots[8]);parsed.events=parsed.events.map(e=>({action:{uci:e.action.uci,kind:e.action.kind},revision:e.revision,round:e.round,seat:e.seat}));
   const reordered=await propose(f,game,JSON.stringify(parsed),snapshots[8]);assert.equal(reordered.hostDigest,reordered.guestDigest,'JSON key order is not a history fork');
   const fork=new Session(f,game,`agreement-${game}-test`);try{const v=fork.view();fork.apply({seat:0,round:1,revision:0,action:{kind:'move',uci:v.legal[1]}});await assert.rejects(()=>propose(f,game,snapshots[8],fork.checkpoint()),/Divergent/);}finally{fork.dispose();}
   const other=new Session(f,game,`another-${game}-identity`);try{await assert.rejects(()=>propose(f,game,snapshots[8],other.checkpoint()),/Different/);}finally{other.dispose();}
   const corrupt=JSON.parse(snapshots[8]);corrupt.events[7].action.uci='a1a1';await assert.rejects(()=>propose(f,game,snapshots[8],JSON.stringify(corrupt)));
   await assert.rejects(()=>propose(f,game,snapshots[8],'{'));
  }finally{s.dispose();}
 }
 // Same final FEN is not enough: different legal histories remain a fork.
 const a=new Session(f,'chess','same-fen-history-test'),b=new Session(f,'chess','same-fen-history-test');
 try{
  for(const [s,moves] of [[a,['g1f3','g8f6','f3g1','f6g8']],[b,['b1c3','b8c6','c3b1','c6b8']]])for(const uci of moves){const v=s.view();s.apply({seat:v.turn?0:1,round:1,revision:v.revision,action:{kind:'move',uci}});}
  assert.equal(a.view().fen,b.view().fen);await assert.rejects(()=>propose(f,'chess',a.checkpoint(),b.checkpoint()),/Divergent/);
 }finally{a.dispose();b.dispose();}
 console.log(`PASS: ${agreements} three-variant exact/host-ahead/guest-ahead prefix agreements, canonical JSON, invalid/forked/same-FEN histories rejected; ${attacks} transcript-field tamper checks plus wrong-key/reflection/nonce-swap; 15 fresh mutually proven agreement instances with duplicate/concurrent proof and old-attempt rejection. Real WASM/WebCrypto; transport and persisted credentials still need integration.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
