const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),assert=require('node:assert/strict');
const resolve=Module._resolveFilename,load=Module._load;
Module._resolveFilename=function(r,...args){return resolve.call(this,r.startsWith('@/')?path.resolve(__dirname,'..',r.slice(2)):r,...args);};
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
const React=require('react');let selected=[],index=0;
Module._load=function(r,...args){return r==='react'?{...React,useRef:()=>({current:null}),useState:initial=>[index++===1?selected:initial,()=>{}]}:load.call(this,r,...args);};
const Table=require('../components/cards/SichuanPractice.tsx').default;
const {newSichuanSession,sichuanSessionView}=require('../lib/mahjong/sichuan-session.ts');
function nodes(n){if(Array.isArray(n))return n.flatMap(nodes);if(!n||typeof n!=='object')return [];return [n,...nodes(n.props?.children)];}
const session=newSichuanSession(Array.from({length:108},(_,i)=>i%27));let cases=0;
for(let seat=0;seat<4;seat++)for(const locale of ['zh','en'])for(const locked of [false,true]){
 const view=sichuanSessionView(session,seat),hand=view.setup.hand;
 const groups=[0,1,2].map(s=>hand.flatMap((t,i)=>Math.floor(t/9)===s?[i]:[]));
 const same=groups.find(g=>g.length>=3).slice(0,3),mixed=[same[0],same[1],hand.findIndex(t=>Math.floor(t/9)!==Math.floor(hand[same[0]]/9))];
 for(const choice of [[],same.slice(0,2),same,mixed]){
  selected=choice;index=0;const sent=[];
  const all=nodes(Table({locale,remote:{view,disabled:locked,onAction:a=>sent.push(a)}}));
  const button=all.find(n=>n.type==='button'&&n.props.children===(locale==='zh'?'确认交换这三张':'Confirm these three tiles'));
  const valid=choice===same&&!locked;assert.equal(button.props.disabled,!valid);
  button.props.onClick();assert.equal(sent.length,valid?1:0);
  if(valid)assert.deepEqual(sent[0].tiles,same.map(i=>hand[i]));
  if(choice===mixed)assert.ok(all.some(n=>n.props.role==='status'&&typeof n.props.children==='string'&&n.props.children.includes(locale==='zh'?'不是同一花色':'mix suits')));
  cases++;
 }
}
console.log(`PASS: ${cases} four-seat bilingual exchange-input cases, mixed-suit/incomplete guards, valid dispatch and locked state. Component harness, browser retest pending.`);
