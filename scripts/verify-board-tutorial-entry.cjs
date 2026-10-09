// Real component effects and real WASM rules; this does not replace browser layout checks.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.tsx']=require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
const resolve=Module._resolveFilename,load=Module._load;
Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.resolve(__dirname,'..',request.slice(2)):request,...args);};
const React=require('react');let slots=[],cursor=0,effects=[],rules;
Module._load=function(request,...args){
 if(request==='react')return {...React,
  useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},
  useRef(initial){const i=cursor++;return slots[i]??(slots[i]={current:initial});},
  useEffect(effect){effects.push(effect);},
 };
 if(request==='@/lib/board/ffish')return {loadFfish:async()=>rules};
 return load.call(this,request,...args);
};
function nodes(n){if(Array.isArray(n))return n.flatMap(nodes);return n&&typeof n==='object'?[n,...nodes(n.props?.children)]:[];}
function words(n){if(Array.isArray(n))return n.map(words).join('');return n==null||typeof n==='boolean'?'':typeof n==='object'?words(n.props?.children):String(n);}
(async()=>{
 const {default:create}=await import('../node_modules/ffish-es6/ffish.js');
 rules=await create({wasmBinary:fs.readFileSync(require.resolve('ffish-es6/ffish.wasm'))});
 const Player=require('../components/board/BoardTutorialPlayer.tsx').default,Board=require('../components/board/Board.tsx').default;
 const {tutorials,localizeTutorial}=require('../content/tutorials.ts'),{getDict}=require('../lib/i18n.ts');
 let checks=0,dropChecks=0,readableChecks=0;
 for(const t of tutorials.filter(t=>['chess','xiangqi','shogi'].includes(t.game)))for(const locale of ['zh','en']){
  slots=[];const tutorial=localizeTutorial(t,locale);
  const render=()=>{cursor=0;effects=[];return Player({game:t.game,tutorial,locale,dict:getDict(locale)});};
  let tree=render();
  assert.ok(words(nodes(tree).find(n=>n.type==='aside')).startsWith('01'+tutorial.steps[0].title),t.slug+' must start with section one');
  for(let i=0;i<tutorial.steps.length;i++){
   const button=nodes(tree).find(n=>n.type==='button'&&words(n).includes(tutorial.steps[i].title));
   button.props.onClick();render();effects.forEach(effect=>effect());await new Promise(resolve=>setImmediate(resolve));tree=render();
   const board=nodes(tree).find(n=>n.type===Board);assert.ok(board,`${t.slug}/${tutorial.steps[i].id} must not show perpetual loading`);
   const pos=t.steps[i].position;const expected=pos?new rules.Board(t.game,pos.fen):new rules.Board(t.game);
   assert.equal(board.props.fen,expected.fen());expected.delete();
   if(!t.steps[i].position)assert.ok(words(tree).includes(locale==='zh'?'棋盘仅供对照标准开局摆法':'board is a reference starting setup'));
   const firstMove=pos?.moves?.[0];
   if(t.game==='shogi'&&firstMove?.includes('@')){
    const toggle=nodes(tree).find(n=>n.type==='button'&&words(n)===(locale==='zh'?'我来走 · 从初始局面练习':'Try the moves · Start from setup'));
    toggle.props.onClick();tree=render();
    const {HAND_NAMES}=require('../components/board/Board.tsx');
    const letter=firstMove[0];
    assert.ok(words(tree).includes(`${HAND_NAMES[letter.toLowerCase()][locale]} (${letter.toUpperCase()})`),'drop instructions must use the same translated piece name as the hand button');
    dropChecks++;
    nodes(tree).find(n=>n.type==='button'&&words(n)===(locale==='zh'?'切回观看模式':'Switch to watching')).props.onClick();tree=render();
   }
   if(firstMove){
    const {parseUci}=require('../lib/board/variants.ts');
    const {HAND_NAMES}=require('../components/board/Board.tsx');
    const p=parseUci(firstMove);
    let readable=p.drop ? (locale==='zh'?`${HAND_NAMES[p.drop.toLowerCase()].zh}打入 ${p.to}`:`Drop ${HAND_NAMES[p.drop.toLowerCase()].en} on ${p.to}`) : `${p.from} → ${p.to}`;
    if(p.suffix==='+')readable+=locale==='zh'?' · 升级（成）':' · promote';
    if('qrbn'.includes(p.suffix??'')&&p.suffix){const names={q:['后','queen'],r:['车','rook'],b:['象','bishop'],n:['马','knight']};readable+=locale==='zh'?` · 升变为${names[p.suffix][0]}`:` · promote to ${names[p.suffix][1]}`;}
    assert.ok(words(tree).includes(readable),'demo list uses taught coordinates and named special actions');
    nodes(tree).find(n=>n.type==='button'&&n.props['aria-label']===(locale==='zh'?'前进一着':'Next move')).props.onClick();
    tree=render();
    assert.ok(words(tree).includes(`${locale==='zh'?'当前着法':'Current move'}: ${readable}`),'current move agrees with readable demo list');
    readableChecks++;
   }
   checks++;
  }
 }
 assert.ok(dropChecks>=4,'both localized drop and mate cases must exercise named hand prompts');
 console.log(`PASS: ${checks} localized chapter selections, correct reference setups; ${dropChecks} named drop prompts; ${readableChecks} readable demo/current move labels, including drops and promotion.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
