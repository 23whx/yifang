const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
function load(file,globals){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,...globals});return exports;}
(async()=>{
 let attempts=0;const rules={test:'ready'};
 const f=load('lib/board/ffish.ts',{window:{location:{origin:'http://local.test'}},Function:function(){return async()=>({default:async()=>{if(++attempts===1)throw Error('WASM unavailable');return rules;}});}});
 const first=f.loadFfish();assert.equal(first,f.loadFfish(),'In-flight requests share work');await assert.rejects(first,/unavailable/);
 assert.equal(await f.loadFfish(),rules);assert.equal(await f.loadFfish(),rules);assert.equal(attempts,2,'Successful factory stays cached');
 let scripts=0,removed=0;const window={};
 const document={createElement:()=>({remove(){removed++;}}),head:{appendChild(s){scripts++;queueMicrotask(()=>{if(scripts===1)s.onerror();else if(scripts===2)s.onload();else {window.Stockfish=async()=>{throw Error('factory reached');};s.onload();}});}}};
 const {Engine}=load('lib/board/engine.ts',{window,document,SharedArrayBuffer});
 await assert.rejects(new Engine('chess').newGame(),/failed to load/);
 await assert.rejects(new Engine('chess').newGame(),/did not initialize/);
 await assert.rejects(new Engine('chess').newGame(),/factory reached/);
 await assert.rejects(new Engine('chess').newGame(),/factory reached/);
 assert.equal(scripts,3,'Loaded script reused; failed script retried');assert.equal(removed,2,'Failed elements removed only');
 console.log('PASS: ffish failure retry, in-flight/success caching; Stockfish network and missing-global recovery, failed-element cleanup. Mock loaders, not actual WASM execution.');
})().catch(e=>{console.error(e);process.exitCode=1;});
