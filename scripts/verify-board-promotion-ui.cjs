// Exercise the real chooser callbacks; native layout is verified separately.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.tsx']=require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
const resolve=Module._resolveFilename,load=Module._load;
Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.resolve(__dirname,'..',request.slice(2)):request,...args);};
const React=require('react');let slots=[],cursor=0;
Module._load=function(request,...args){if(request==='react')return {...React,
 useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],v=>slots[i]=v];},
 useRef(initial){return {current:initial};},useMemo(fn){return fn();},useEffect(){},
};return load.call(this,request,...args);};
const Board=require('../components/board/Board.tsx').default,{VARIANTS}=require('../lib/board/variants.ts');
function nodes(n){if(Array.isArray(n))return n.flatMap(nodes);return n&&typeof n==='object'?[n,...nodes(n.props?.children)]:[];}
function words(n){if(Array.isArray(n))return n.map(words).join('');return n==null||typeof n==='boolean'?'':typeof n==='object'?words(n.props?.children):String(n);}
let checks=0;
for(const locale of ['zh','en'])for(const game of ['shogi','chess']){
 const from=game==='shogi'?'g7':'a7',to=game==='shogi'?'g8':'a8';
 const moves=game==='shogi'?['g7g8','g7g8+']:['a7a8q','a7a8r','a7a8b','a7a8n'];
 const labels=game==='shogi'?(locale==='zh'?['不升级（不成）','升级（成）']:['Do not promote','Promote']):(locale==='zh'?['升变为后','升变为车','升变为象','升变为马']:['Promote to queen','Promote to rook','Promote to bishop','Promote to knight']);
 for(let choice=0;choice<moves.length;choice++){
  slots=[];const played=[];
  const props={spec:VARIANTS[game],fen:game==='shogi'?'4k4/9/6P2/9/9/9/9/9/4K4[] w - - 0 1':'4k3/P7/8/8/8/8/8/4K3 w - - 0 1',orientation:'w',movable:'w',legalMoves:moves,locale,onMove:m=>played.push(m)};
  const render=()=>{cursor=0;return Board(props);};
  let tree=render();const click=name=>{nodes(tree).find(n=>n.type==='button'&&n.props['aria-label']===name).props.onClick();tree=render();};
  click(from);click(to);assert.equal(played.length,0,'moving to last rank must wait for a choice');
  for(const name of labels){const b=nodes(tree).find(n=>n.type==='button'&&n.props['aria-label']===name);assert.ok(b);assert.ok(words(b).includes(name),'choice must be visible, not only an aria label');}
  click(labels[choice]);assert.deepEqual(played,[moves[choice]]);
  assert.ok(!nodes(tree).some(n=>n.type==='button'&&labels.includes(n.props['aria-label'])),'chooser closes after selection');checks++;
 }
}
console.log(`PASS: ${checks} bilingual shogi/chess promotion choices with visible names, delayed move and exact callback.`);
