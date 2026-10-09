const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {goTactics,setupGoTactic,goReplay}=require('../content/go-tactics.ts');
const {pointAt}=require('../content/go-exercises.ts');
const {playGo,group}=require('../lib/go/rules.ts');
for(const t of goTactics) {
  const initial=setupGoTactic(t), serialized=JSON.stringify(initial);
  assert.equal(new Set([...t.black,...t.white]).size,t.black.length+t.white.length,'no overlapping initial stones');
  for(let i=0;i<=t.line.length;i++) {
    const state=goReplay(t,i);
    assert.equal(state.turn,i%2===0?1:2);
    if(t.replayOnly) {
      assert.equal(group(state.board,pointAt('E5'),9).liberties.size,[2,1,1,0][i]);
      assert.equal(state.captures[0],i===3?1:0);
    }
  }
  const end=goReplay(t,t.line.length);
  assert.equal(end.captures[0],t.captures);
  for(const p of t.white)assert.equal(end.board[pointAt(p)],0,'target stones removed');
  assert.equal(end.passes,0,'capture is not whole-game termination');
  assert.deepEqual(goReplay(t,0),initial,'rewind restores board, history, turn and capture counters');
  assert.throws(()=>goReplay(t,-1));assert.throws(()=>goReplay(t,t.line.length+1));
  if(!t.replayOnly) {
    const solutions=[];
    for(let p=0;p<81;p++) {
      const result=playGo(initial,p);
      if(result.state?.captures[0]===t.captures)solutions.push(p);
    }
    assert.deepEqual(solutions,[pointAt(t.line[0].point)],'all board intersections checked');
  }
  assert.equal(JSON.stringify(initial),serialized,'attempts do not mutate starting position');
}
console.log(`PASS: ${goTactics.length} Go practice/replay datasets, all practice points, liberty sequence, captures, turn order, rewind and nonterminal capture verified.`);
