const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
const source=ts.transpileModule(fs.readFileSync('lib/board/engine.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function harness(factory){
 const exports={},timers=new Map();let id=0;
 vm.runInNewContext(source,{exports,window:{Stockfish:factory},setTimeout:fn=>{timers.set(++id,fn);return id;},clearTimeout:id=>timers.delete(id)});
 return {...exports,timers};
}
function module(){let listener;return {commands:[],silent:false,removed:0,emit(line){listener?.(line);},addMessageListener(fn){listener=fn;},removeMessageListener(fn){assert.equal(fn,listener);listener=null;this.removed++;},postMessage(cmd){this.commands.push(cmd);if(cmd==='uci')listener?.('uciok');if(cmd==='isready')listener?.('readyok');if(cmd.startsWith('go ')&&!this.silent)listener?.('bestmove e2e4');}};}
(async()=>{
 const sf=module(),h=harness(async()=>sf),e=new h.Engine('chess');
 await e.newGame();assert.equal(await e.bestMove('start',[],{skill:0,movetime:10}),'e2e4');assert.equal(h.timers.size,0);
 sf.silent=true;const search=e.bestMove('start',[],{skill:0,movetime:10});await Promise.resolve();e.dispose();await assert.rejects(search,/disposed/);assert.equal(h.timers.size,0);assert.equal(sf.removed,1);e.dispose();assert.equal(sf.commands.filter(c=>c==='quit').length,1);
 await assert.rejects(e.newGame(),/disposed/);
 const concurrent=module(),q=harness(async()=>concurrent),qe=new q.Engine('chess');await qe.newGame();concurrent.silent=true;
 const first=qe.bestMove('first',[],{skill:0,movetime:10});await Promise.resolve();
 const superseded=qe.bestMove('obsolete',[],{skill:0,movetime:10}),latest=qe.bestMove('latest',[],{skill:0,movetime:10});
 await assert.rejects(superseded,/superseded/);assert.equal(concurrent.commands.filter(c=>c.startsWith('go ')).length,1);
 concurrent.emit('bestmove a2a3');assert.equal(await first,'a2a3');
 for(let i=0;i<5;i++)await Promise.resolve();
 assert.equal(concurrent.commands.filter(c=>c.startsWith('go ')).length,2);assert.ok(!concurrent.commands.includes('position fen obsolete'));
 concurrent.emit('bestmove b2b3');assert.equal(await latest,'b2b3');assert.equal(q.timers.size,0);
 const queued=qe.bestMove('cancelled-before-start',[],{skill:0,movetime:10});qe.stop();await assert.rejects(queued,/superseded/);assert.ok(!concurrent.commands.includes('position fen cancelled-before-start'));qe.dispose();
 // A transport exception does not prove the command was never delivered.
 // Retire that instance so a late bestmove cannot satisfy a subsequent job.
 const broken=module(),send=broken.postMessage;
 broken.postMessage=function(cmd){if(cmd.startsWith('go ')){this.commands.push(cmd);throw Error('worker transport failed');}send.call(this,cmd);};
 const b=harness(async()=>broken),be=new b.Engine('chess');await be.newGame();
 await assert.rejects(be.bestMove('uncertain',[],{skill:0,movetime:10}),/transport failed/);
 assert.equal(b.timers.size,0);assert.equal(broken.removed,1,'Transport failure detaches the old listener');
 assert.equal(broken.commands.filter(c=>c==='quit').length,1);
 broken.emit('bestmove a2a4');
 await assert.rejects(be.bestMove('must-not-start',[],{skill:0,movetime:10}),/disposed/);
 assert.ok(!broken.commands.includes('position fen must-not-start'));
 let finish;const late=module(),l=harness(()=>new Promise(r=>finish=r)),le=new l.Engine('chess');for(let i=0;i<5&&!finish;i++)await Promise.resolve();assert.equal(typeof finish,'function');le.dispose();finish(late);await assert.rejects(le.newGame(),/disposed/);assert.deepEqual(late.commands,['quit']);
 const silent=module(),t=harness(async()=>silent),te=new t.Engine('chess');await te.newGame();silent.silent=true;const timeout=te.bestMove('start',[],{skill:0,movetime:10});await Promise.resolve();assert.equal(t.timers.size,1);const callback=[...t.timers.values()][0];callback();await assert.rejects(timeout,/timed out/);assert.ok(silent.commands.includes('quit'));await assert.rejects(te.bestMove('start',[],{skill:0,movetime:10}),/disposed/);te.dispose();
 console.log('PASS: synchronous UCI/readiness/bestmove replies, pending-search disposal, late initialization cleanup, idempotent quit and response timeout. Mock UCI, not browser WASM acceptance.');
})().catch(e=>{console.error(e);process.exitCode=1;});
