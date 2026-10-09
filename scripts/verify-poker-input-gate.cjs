const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {PokerInputGate}=require('../lib/holdem-input-gate.ts');
const gate=new PokerInputGate();
assert.equal(gate.begin(),true);
for(let i=0;i<3;i++){gate.view();assert.equal(gate.pending,true);assert.equal(gate.begin(),false);}
gate.ack();assert.equal(gate.pending,true);assert.equal(gate.begin(),false);
gate.view();assert.equal(gate.pending,false);assert.equal(gate.begin(),true);
gate.failed();assert.equal(gate.begin(),true);
gate.ack();gate.view();assert.equal(gate.begin(),true);
gate.close();gate.ack();gate.view();gate.failed();assert.equal(gate.closed,true);assert.equal(gate.begin(),false);
console.log('PASS: unrelated broadcasts retain pending lock; acknowledgement plus refreshed view unlocks; failed sends recover; close remains terminal.');
