const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.tsx']=require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
const resolve=Module._resolveFilename,load=Module._load,React=require('react');let amount='';
Module._resolveFilename=function(r,...args){return resolve.call(this,r.startsWith('@/')?path.resolve(__dirname,'..',r.slice(2)):r,...args);};
Module._load=function(r,...args){return r==='react'?{...React,useState:()=>[amount,v=>{amount=v;}]}:load.call(this,r,...args);};
const Table=require('../components/cards/MultiPokerTable.tsx').default;
function nodes(n){if(Array.isArray(n))return n.flatMap(nodes);if(!n||typeof n!=='object')return [];return [n,...nodes(n.props?.children)];}
let cases=0;
for(const locale of ['zh','en'])for(const [minTo,maxTo,canRaise] of [[20,190,true],[40,25,true],[20,190,false]])for(const value of ['', '15','20','25','40','190','191','20.5','-1','Infinity']){
 amount=value;const sent=[];
 const view={hand:1,street:0,over:false,actor:0,button:1,community:[],committed:[0,5,10,0],stacks:[190,190,185,220],bets:[0,0,5,10],cards:[[],[],[],[]],cardCounts:[2,2,2,2],folded:[false,false,false,false],seat:0,actions:[],legal:{minTo,maxTo,canRaise,call:10,canCheck:false}};
 const tree=Table({view,locale,onAction:a=>sent.push(a)}),all=nodes(tree);
 const button=all.find(n=>n.type==='button'&&n.props.children===(locale==='zh'?'按填写金额加注':'Raise to entered amount'));
 const n=Number(value),valid=canRaise&&value!==''&&Number.isSafeInteger(n)&&n<=maxTo&&(n>=minTo||n===maxTo);
 assert.equal(button.props.disabled,!valid);
 button.props.onClick();assert.deepEqual(sent,valid?[{kind:'raise',to:n}]:[],'Invalid callback must not reach network or local action handler');
 const input=all.find(n=>n.type==='input');assert.equal(input.props['aria-invalid'],value!==''&&canRaise&&!valid);
 if(value!==''&&canRaise&&!valid)assert.ok(all.some(n=>n.props.role==='status'&&typeof n.props.children==='string'&&n.props.children.includes(locale==='zh'?'当前金额不会提交':'will not be submitted')));
 cases++;
}
console.log(`PASS: ${cases} localized raise-input cases: bounds, integers, empty, disabled raises, short all-in and guarded callbacks. Component harness, browser verification pending.`);
