const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.tsx']=require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
const resolve=Module._resolveFilename;
Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.resolve(__dirname,'..',request.slice(2)):request,...args);};
const React=require('react'),{renderToStaticMarkup:render}=require('react-dom/server');
const Board=require('../components/board/Board.tsx').default,{VARIANTS}=require('../lib/board/variants.ts');
const names={zh:['飞车','角行','金将','银将','桂马','香车','步兵'],en:['Rook','Bishop','Gold','Silver','Knight','Lance','Pawn']};
let cases=0;
for(const locale of ['zh','en'])for(const orientation of ['w','b'])for(const movable of ['w',undefined]) {
  const html=render(React.createElement(Board,{spec:VARIANTS.shogi,fen:'4k4/9/4K4/9/9/9/9/9/9[RRBGSNLPrbgsnlp] w - - 0 1',orientation,movable,locale,legalMoves:['R@a1','B@b1','G@c1','S@d1','N@e1','L@f1']}));
  const hands=Array.from(html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)).filter(m=>m[1].includes('×'));
  assert.equal(hands.length,14);
  for(const name of names[locale]) assert.equal(hands.filter(m=>m[1].includes(name)).length,2);
  assert.equal(hands.filter(m=>!m[1].includes('disabled=""')).length,movable==='w'?6:0,'turn and actual legal drops control availability');
  assert.equal(hands.filter(m=>m[1].includes(`${names[locale][0]} × 2`)).length,1,'duplicate rook count is visible once');
  for(const hand of hands) {
    assert.ok(hand[1].includes('aria-pressed="false"'));
    assert.ok(hand[1].includes('min-h-11'),'44px minimum target');
    assert.ok(!hand[1].includes('rotate-180'),'never rotate the label/count button');
  }
  assert.ok(html.includes(locale==='zh'?'持驹（吃来后可放回棋盘的棋子）':'Pieces in hand (captured pieces you can place on the board)'));
  cases++;
}
for(const locale of ['zh','en']) {
 const html=render(React.createElement(Board,{spec:VARIANTS.shogi,fen:'4k4/9/4K4/9/9/9/9/9/9[] w - - 0 1',orientation:'w',locale}));
 assert.equal(html.split(locale==='zh'?'暂无持驹':'No pieces in hand').length-1,2);
}
console.log(`PASS: ${cases} bilingual/orientation/read-only hand renders; all seven names, counts, legal-drop disabling, upright labels, empty hands. SSR only, native interaction pending.`);
