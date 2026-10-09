const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,f);
const {TacticsSession}=require('../lib/board/tactics-session.ts');
const {tacticalLessons}=require('../content/board/tactics.ts');
for(const lesson of tacticalLessons){
  let released=0;
  const failure=new Error('Rule initialization failed');
  assert.throws(()=>new TacticsSession({setFen(){throw failure;},delete(){released++;}},lesson),error=>error===failure);
  assert.equal(released,1,'failed construction must release the owned WASM board');
  let retryReleased=0,position='';
  const retry=new TacticsSession({setFen(fen){position=fen;},delete(){retryReleased++;}},lesson);
  assert.equal(position,lesson.fen,'a fresh retry initializes normally');
  retry.close();retry.close();
  assert.equal(retryReleased,1,'successful session releases exactly once');
}
console.log('PASS: all six tactics initialization failures release owned boards; fresh retries initialize and dispose once. Mock lifecycle test, not browser acceptance.');
