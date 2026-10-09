const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.tsx']=require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
const resolve=Module._resolveFilename;
Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.resolve(__dirname,'..',request.slice(2)):request,...args);};
const React=require('react'),{renderToStaticMarkup:render}=require('react-dom/server'),load=Module._load;
let stateIndex=0,failure='rules';
// Inject only error states into the real SSR component. No claim of browser interaction.
Module._load=function(request,...args){if(request==='react')return {...React,useState(initial){const index=stateIndex++;const actual=React.useState(initial);return index===(failure==='rules'?1:3)?[true,actual[1]]:actual;}};return load.call(this,request,...args);};
const Board=require('../components/board/BoardGame.tsx').default,{getDict}=require('../lib/i18n.ts');
for(const game of ['chess','xiangqi','shogi'])for(const locale of ['zh','en'])for(const kind of ['rules','ai']){
 failure=kind;stateIndex=0;const html=render(React.createElement(Board,{game,locale,dict:getDict(locale)}));
 assert.ok(html.includes('role="alert"'));
 assert.ok(html.includes(kind==='rules'?(locale==='zh'?'重新加载棋盘':'Retry loading the board'):(locale==='zh'?'保留棋盘，重试电脑走棋':'Retry computer move; keep board')));
}
console.log('PASS: 12 localized board error-state renders, alert and appropriate retry controls. Injected states only; failure-to-retry interaction needs browser acceptance.');
