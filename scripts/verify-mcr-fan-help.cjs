const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.tsx']=require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
const resolve=Module._resolveFilename;
Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.resolve(__dirname,'..',request.slice(2)):request,...args);};
const React=require('react'),{renderToStaticMarkup:render}=require('react-dom/server');
const Help=require('../components/cards/McrHandExplanation.tsx').default;
const {mcrFanHelp}=require('../content/mcr-fan-help.ts');
const {tileNames}=require('../lib/mahjong/shape.ts');
const {decomposeHand}=require('../lib/mahjong/shape.ts');
const {mcrWaitExercises}=require('../content/mcr-wait-exercises.ts');
const {mcrSpecialExercises}=require('../content/mcr-special-exercises.ts');
const {mcrGreenExercises}=require('../content/mcr-green-exercises.ts');
const {getMahjongCourse}=require('../content/mahjong-variants.ts');
assert.deepEqual(getMahjongCourse('mahjong-mcr').supplementaryExercises.slice(0,3),mcrWaitExercises);
assert.deepEqual(getMahjongCourse('mahjong-mcr').supplementaryExercises.slice(3,5),mcrSpecialExercises);
assert.deepEqual(getMahjongCourse('mahjong-mcr').supplementaryExercises.slice(5,7),mcrGreenExercises);
for(const [i,e] of mcrGreenExercises.entries()) {
 assert.equal(e.hand.length,14);assert.deepEqual(e.after,e.hand,'recognition must retain the actual example, not replace wrong-looking tiles');
 assert.equal(e.correct,i===0?1:0);
 assert.ok(decomposeHand(e.hand.map(t=>tileNames.indexOf(t)),[],{variant:'mcr'}).length,'both examples are complete shapes');
 assert.equal(e.hand.filter(t=>t===(i===0?'发':'白')).length,2);
 for(const locale of ['zh','en'])assert.ok(e.prompt[locale]&&e.hint[locale]&&e.explanation[locale]);
}
for(const [index,e] of mcrSpecialExercises.entries()){
 const held=e.hand.map(t=>tileNames.indexOf(t)),after=e.after.map(t=>tileNames.indexOf(t));
 assert.equal(held.length,13);assert.equal(after.length,14);
 assert.ok(held.every(t=>t>=0)&&after.every(t=>t>=0));
 const missing=after.slice();for(const t of held){const i=missing.indexOf(t);assert.ok(i>=0);missing.splice(i,1);}
 const waits=Array.from({length:34},(_,t)=>t).filter(t=>decomposeHand([...held,t],[],{variant:'mcr'}).length);
 assert.deepEqual(waits,missing,'Special exercise has only its taught completion, not the wrong offered tile');
 assert.ok(decomposeHand(after,[],{variant:'mcr'}).some(s=>s.kind===(index===0?'seven-pairs':'thirteen-orphans')));
}
for(const slug of ['mahjong-mcr','mahjong-riichi','mahjong-sichuan']){
 const last=getMahjongCourse(slug).exercises.at(-1);
 assert.equal(last.after.length,14,`${slug} must retain its completed final hand`);
 assert.ok(last.explanation.zh&&last.explanation.en);
}
for(const e of mcrWaitExercises){
 assert.equal(e.hand.length,13);assert.equal(e.after.length,14);assert.ok(e.hint.zh&&e.hint.en);
 const held=e.hand.map(t=>tileNames.indexOf(t)),after=e.after.map(t=>tileNames.indexOf(t));
 assert.ok(held.every(t=>t>=0)&&after.every(t=>t>=0));
 const missing=after.slice();for(const t of held){const i=missing.indexOf(t);assert.ok(i>=0);missing.splice(i,1);}assert.equal(missing.length,1);
 const waits=Array.from({length:34},(_,t)=>t).filter(t=>decomposeHand([...held,t],[],{variant:'mcr'}).length);
 assert.deepEqual(waits,missing,'Whole example must have precisely the taught winning tile kind');
 assert.ok(decomposeHand(after,[],{variant:'mcr'}).length);
}
for(const [code,help] of Object.entries(mcrFanHelp)){
 for(const tile of help.tiles)assert.ok(tileNames.includes(tile));
 if(help.completingTile)assert.ok(tileNames.includes(help.completingTile));
 for(const locale of ['zh','en']){
  // Presentation fixture only; this script does not validate hand scoring.
  const analysis={handKind:'ordinary',groups:[],fanCodes:[code],occurrences:[],exclusions:[]};
  const html=render(React.createElement(Help,{analysis,locale}));
  assert.ok(html.includes(help[locale]));
  assert.equal((html.match(/role="img"/g)||[]).length,help.tiles.length+(help.completingTile?1:0));
  if(help.completingTile){assert.ok(html.includes(locale==='zh'?'已经有：':'Already holding:'));assert.ok(html.includes(locale==='zh'?'还缺这一张：':'Missing tile:'));}
  assert.ok(html.includes(locale==='zh'?'不是你本局的手牌':'not your actual tiles'));
  assert.ok(!html.includes(locale==='zh'?'也不是完整和牌':'or a complete winning hand'),'Do not call every illustration incomplete: All Green shows a complete hand');
  if(locale==='en')assert.ok(!/[\u3400-\u9fff]/.test(html),'English help leaks Chinese');
 }
}
const unknown=render(React.createElement(Help,{analysis:{handKind:'ordinary',groups:[],fanCodes:['unknown'],occurrences:[],exclusions:[]},locale:'en'}));
assert.ok(!unknown.includes('Teaching example'));
console.log(`PASS: ${Object.keys(mcrFanHelp).length} bilingual fan explanations, tile artwork/labels, example disclaimer and unknown-code handling; presentation only.`);
