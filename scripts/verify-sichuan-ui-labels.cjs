const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.tsx']=require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
const resolve=Module._resolveFilename;
Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.resolve(__dirname,'..',request.slice(2)):request,...args);};
const React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const Practice=require('../components/cards/SichuanPractice.tsx').default;
const {newSichuanSession,applySichuanSession,sichuanSessionView}=require('../lib/mahjong/sichuan-session.ts');
const {sichuanTeachingAction}=require('../lib/mahjong/sichuan-teaching.ts');
const {tileNames}=require('../lib/mahjong/shape.ts');
const {tileEnglish}=require('../content/guided-tables.ts');
function html(view,locale){return render(React.createElement(Practice,{locale,remote:{view,disabled:false,onAction:()=>{}}}));}
let session=newSichuanSession(Array.from({length:108},(_,i)=>i%27));
const setup=sichuanSessionView(session,0),first=setup.setup.hand[0],zhName=tileNames[first],enName=tileEnglish(zhName);
assert.ok(html(setup,'zh').includes(`aria-label="选择 ${zhName} 1"`));
assert.ok(html(setup,'en').includes(`aria-label="Select ${enName} 1"`));
assert.ok(!html(setup,'en').includes(`aria-label="Select ${zhName} 1"`));
let steps=0;
while(!session.game){
 assert.ok(++steps<20,'all four exchange and missing-suit decisions must finish');
 const views=[0,1,2,3].map(seat=>sichuanSessionView(session,seat));
 const seat=views.findIndex(view=>sichuanTeachingAction(view)!==null);assert.ok(seat>=0);
 session=applySichuanSession(session,seat,session.revision,sichuanTeachingAction(views[seat]));
}
const play=sichuanSessionView(session,0),playName=tileNames[play.round.players[0].hand[0]];
assert.ok(html(play,'zh').includes(`aria-label="打出 ${playName} 1"`));
assert.ok(html(play,'en').includes(`aria-label="Discard ${tileEnglish(playName)} 1"`));
assert.ok(!html(play,'en').includes('aria-label="Select '),'Selection must become Discard after setup');
console.log(`PASS: Sichuan Chinese/English tile action labels match the rendered tile in setup and play after ${steps} real setup actions; no Chinese tile names in English aria labels. Static React render, not browser/WebRTC evidence.`);
