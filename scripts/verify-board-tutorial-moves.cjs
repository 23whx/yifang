const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript'),path=require('node:path'),Module=require('node:module');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const resolve=Module._resolveFilename;
Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.resolve(__dirname,'..',request.slice(2)):request,...args);};
(async()=>{
 const {tutorials}=require('../content/tutorials.ts');
 const {default:create}=await import('../node_modules/ffish-es6/ffish.js');
 const f=await create({wasmBinary:fs.readFileSync(require.resolve('ffish-es6/ffish.wasm'))});
 let positions=0,moves=0;const failures=[];
 for(const tutorial of tutorials.filter(t=>['chess','xiangqi','shogi'].includes(t.game)))for(const step of tutorial.steps){
  if(!step.position)continue;
  const label=tutorial.slug+'/'+step.id;
  let board;
  try{
   board=new f.Board(tutorial.game,step.position.fen);const start=board.fen();
   assert.equal(f.validateFen(step.position.fen,tutorial.game),1,label+' invalid FEN');
   for(const move of step.position.moves??[]){assert.ok(board.legalMoves().split(' ').includes(move),label+' illegal '+move);assert.ok(board.push(move));moves++;}
   for(const move of step.position.moves??[]){void move;board.pop();}
   assert.equal(board.fen(),start,label+' rewind mismatch');positions++;
  }catch(error){failures.push(String(error));}finally{board?.delete();}
 }
 assert.deepEqual(failures,[]);
 console.log(`PASS: all ${positions} board tutorial positions and ${moves} scripted moves legal, rewind restores initial FEN. Rules/WASM check, not browser demonstration acceptance.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
