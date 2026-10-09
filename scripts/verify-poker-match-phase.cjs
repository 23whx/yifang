const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {multiRemotePhase}=require('../lib/holdem-multi-session.ts');
for(const stacks of [[0,0,0,0],[10,0,0,0],[0,20,0,0],[10,20,0,0],[10,20,30,40]]){
 assert.equal(multiRemotePhase({over:false,stacks}),'playing','Unsettled all-in must not end match');
 assert.equal(multiRemotePhase({over:true,stacks}),stacks.filter(n=>n>0).length<2?'finished':'playing');
}
console.log('PASS: settled sole-funded winner ends match; unsettled all-in and funded next hands do not. Projection cases, not full match simulation.');
