// Executes real component callbacks with a minimal hook store. No DOM/RTC claim.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.tsx']=require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
const resolve=Module._resolveFilename,load=Module._load;
Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.resolve(__dirname,'..',request.slice(2)):request,...args);};
const React=require('react');let slots=[],cursor=0,opened=0,closed=0;
Module._load=function(request,...args){if(request==='react')return {...React,
 useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value;}];},
 useRef(){const i=cursor++;return slots[i]??(slots[i]={current:{showModal(){opened++;},close(){closed++;}}});},
};return load.call(this,request,...args);};
const Practice=require('../components/cards/MahjongVariantPractice.tsx').default;
const Tile=require('../components/cards/MahjongTile.tsx').default;
const {getMahjongCourse}=require('../content/mahjong-variants.ts');
function nodes(n){if(Array.isArray(n))return n.flatMap(nodes);if(!n||typeof n!=='object')return [];return [n,...nodes(n.props?.children)];}
function words(n){if(Array.isArray(n))return n.map(words).join('');if(n==null||typeof n==='boolean')return '';return typeof n==='object'?words(n.props?.children):String(n);}
let steps=0;
for(const slug of ['mahjong-riichi','mahjong-mcr','mahjong-sichuan'])for(const locale of ['zh','en'])for(const supplementary of slug==='mahjong-mcr'?[false,true]:[false]){
 slots=[];opened=0;closed=0;
 const source=getMahjongCourse(slug),course={exercises:supplementary?source.supplementaryExercises:source.exercises},render=()=>{cursor=0;return Practice({slug,locale,supplementary});};
 const tiles=tree=>nodes(tree).filter(n=>n.type===Tile).map(n=>n.props.tile);
 const button=(tree,label)=>{const found=nodes(tree).find(n=>n.type==='button'&&words(n)===label);assert.ok(found,`Missing button: ${label}`);return found;};
 const click=b=>{assert.ok(!b.props.disabled,'Cannot click disabled button');b.props.onClick();};
 for(const [i,e] of course.exercises.entries()){
  let tree=render();const next=i===course.exercises.length-1?(locale==='zh'?'查看完成原因':'Review completion'):(locale==='zh'?'下一步':'Next step');
  assert.deepEqual(tiles(tree),e.hand);assert.ok(button(tree,next).props.disabled);
  for(const [j,choice] of e.choices.entries())if(j!==e.correct){
   click(button(tree,choice[locale]));tree=render();assert.deepEqual(tiles(tree),e.hand);assert.ok(button(tree,next).props.disabled);
   if(e.hint)assert.ok(words(tree).includes(e.hint[locale]));
  }
  click(button(tree,e.choices[e.correct][locale]));tree=render();
  assert.deepEqual(tiles(tree),e.after);assert.ok(words(tree).includes(e.explanation[locale]));
  assert.deepEqual(tiles(render()),e.after,'Rerender cannot auto-advance or reset result');
  for(const choice of e.choices)assert.ok(button(tree,choice[locale]).props.disabled);
  assert.equal(opened,0,'No premature final dialog');
  click(button(tree,next));steps++;
 }
 let tree=render();assert.equal(opened,1);assert.deepEqual(tiles(tree),course.exercises.at(-1).after);
 assert.ok(words(tree).includes(supplementary?(locale==='zh'?'辨认完成：复核最后的反例':'Recognition complete: review the counterexample'):(locale==='zh'?'练习完成：为什么可以和牌？':'Practice complete: why is this a legal win?')));
 assert.ok(button(tree,locale==='zh'?'查看完成原因':'Review completion').props.disabled);
 click(button(tree,locale==='zh'?'明白了，保留完成牌型':'Understood; keep the finished hand'));
 assert.equal(closed,1);assert.deepEqual(tiles(render()),course.exercises.at(-1).after);
 click(button(render(),locale==='zh'?'重新练习':'Restart practice'));
 tree=render();assert.deepEqual(tiles(tree),course.exercises[0].hand);assert.equal(slots[3],false);
}
console.log(`PASS: ${steps} real component steps across three rulesets and two languages: wrong-answer retention, hints, correct result, explicit next, final dialog call, retained finish and restart. Hook harness only; native dialog/layout needs browser acceptance.`);
