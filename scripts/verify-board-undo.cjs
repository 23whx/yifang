const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');

require.extensions['.ts']=(module,file)=>module._compile(
  ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file,
);
const {boardUndoPlies}=require('../lib/board/undo.ts');

assert.equal(boardUndoPlies('ai','b','b',0),0);
assert.equal(boardUndoPlies('ai','b','b',1),0,'computer-only opening cannot be usefully undone');
assert.equal(boardUndoPlies('ai','b','b',3),2,'after a human reply, undo the human move and computer answer');
assert.equal(boardUndoPlies('ai','w','w',2),2,'first-player undo returns to their own previous turn');
assert.equal(boardUndoPlies('ai','w','b',1),1,'a pending computer answer can be cancelled by the caller');
assert.equal(boardUndoPlies('local','b','b',1),1,'local two-player mode undoes one ply');
console.log('PASS: second-player computer-only opening has no fake undo; completed AI pairs and local mode retain their undo depths.');
