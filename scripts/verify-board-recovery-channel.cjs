const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {BoardRecoverySession:Session}=require('../lib/board/recovery-session.ts');
const {BoardRecoveryChannel:Channel}=require('../lib/board/recovery-channel.ts');
const {newBoardRecoverySecret:secret}=require('../lib/board/recovery-agreement.ts');
async function connect(rules,game,hostText,guestText,attack){
 const key=secret(),ready=[],frames=[];let failed=false,mutated=false,closed=false,finish;
 const done=new Promise(resolve=>finish=resolve);
 const endpoints=[];
 const transport=side=>({open:true,on(){},send(frame){
  const copy=structuredClone(frame),wire=JSON.stringify(copy);assert.ok(Buffer.byteLength(wire,'utf8')<=65536);assert.ok(!wire.includes(key),'Stored bearer secret must never be transmitted');frames.push({side,...copy});
  if(attack&&typeof attack==='function'&&!mutated){mutated=attack(copy);}
  queueMicrotask(()=>{if(!closed)endpoints[1-side].receive(copy);});
 },close(){closed=true;queueMicrotask(()=>{endpoints.forEach(e=>e.stop());});}});
 const accept=side=>text=>{ready[side]=text;if(ready[0]&&ready[1])finish();};
 const failure=()=>{failed=true;finish();};
 endpoints.push(new Channel(transport(0),rules,game,'host',key,hostText,accept(0),failure));
 endpoints.push(new Channel(transport(1),rules,game,'guest',attack==='wrong-key'?secret():key,guestText,accept(1),failure));
 let timer;
 try{
  endpoints[1].open();endpoints[0].open();
  // The production handshake has a 30-second deadline. This outer test
  // watchdog must not prematurely abort real-WASM replay/crypto under load;
  // protocol timeout/failure still makes the non-attack assertion fail.
  await Promise.race([done,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Recovery test timed out')),35000);})]);
  if(attack){assert.ok(failed);assert.equal(ready.length,0,'Failure must not expose an accepted checkpoint');}
  else{assert.ok(!failed);assert.equal(ready[0],ready[1]);}
  return {ready,frames};
 }finally{clearTimeout(timer);closed=true;endpoints.forEach(e=>e.stop());}
}
(async()=>{
 const {default:create}=await import('../node_modules/ffish-es6/ffish.js');const rules=await create({wasmBinary:fs.readFileSync(require.resolve('ffish-es6/ffish.wasm'))});
 let success=0,rejected=0;
 for(const game of ['chess','xiangqi','shogi']){
  const s=new Session(rules,game,`chunked-${game}-recovery`);let previous;
  try{
   // Many legal rematches make a real standard-start history exceed one RTC
   // frame without inventing FENs or weakening the production message limit.
   for(let round=0;round<400;round++)for(const [seat,kind] of [[0,'resign'],[0,'rematch'],[1,'rematch']]){
    previous=s.checkpoint();const v=s.view();s.apply({seat,round:v.match.round,revision:v.revision,action:{kind}});
   }
   const full=s.checkpoint();assert.ok(full.length>65536);
   for(const [h,g] of [[full,full],[full,previous],[previous,full]]){
    const result=await connect(rules,game,h,g);assert.equal(result.ready[0],full);assert.ok(result.frames.some(f=>f.total>1));success++;
   }
   for(const attack of ['wrong-key',frame=>{if(frame.kind==='chunk'){frame.index=1;return true;}return false;},frame=>{if(frame.kind==='ack'){frame.id=crypto.randomUUID();return true;}return false;}]){
    await connect(rules,game,full,full,attack);rejected++;
   }
  }finally{s.dispose();}
 }
 console.log(`PASS: ${success} three-variant real-WASM/WebCrypto recovery-channel handshakes with >64KB legal histories, host/guest lag, bounded ACK-paced frames and identical accepted checkpoints; ${rejected} wrong-key/out-of-order/wrong-ACK attacks fail closed without bearer transmission. Mock connection transport, not browser RTC/storage.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
