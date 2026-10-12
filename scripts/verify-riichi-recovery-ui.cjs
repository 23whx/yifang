const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),assert=require('node:assert/strict');
const {expandRoomKit}=require('./lib/room-kit-tree.cjs');
require.extensions['.tsx']=require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
const resolve=Module._resolveFilename;
Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.resolve(__dirname,'..',request.slice(2)):request,...args);};
const {RIICHI_SAVE_KEY}=require('../lib/mahjong/riichi-save.ts');
const React=require('react'),load=Module._load;
let hooks=[],cursor=0,effects=[],checkpointText='private-checkpoint';
const hosts=[];
function slot(make){const i=cursor++;if(!(i in hooks))hooks[i]=make();return i;}
class Host{
 constructor(onMessage){hosts.push(this);this.onMessage=onMessage;this.room={status:'lobby',recoveryCheckpoint(){return checkpointText;}};}
 ready(){this.onMessage({payload:{kind:'lobby',connected:[true,true,true,true]}});}
 start(){this.room.status='playing';this.onMessage({payload:{kind:'state'}});return true;}
 close(){}
}
function Practice(){}
Module._load=function(request,...args){
 if(request==='react')return {...React,
  useState(initial){const i=slot(()=>typeof initial==='function'?initial():initial);return [hooks[i],v=>{hooks[i]=typeof v==='function'?v(hooks[i]):v;}];},
  useRef(initial){return hooks[slot(()=>({current:initial}))];},
  useMemo(make){return hooks[slot(make)];},
  useEffect(effect){slot(()=>{effects.push(effect);return true;});}
 };
 if(request==='@/lib/mahjong/riichi-manual')return {ManualRiichiHost:Host};
 if(request==='./RiichiPractice')return {__esModule:true,default:Practice};
 return load.call(this,request,...args);
};
const Remote=require('../components/cards/RiichiRemote.tsx').default;
function text(node){if(node==null||typeof node==='boolean')return '';if(typeof node!=='object')return String(node);return Array.isArray(node)?node.map(text).join(''):text(node.props?.children);}
function nodes(node){if(!node||typeof node!=='object')return [];if(Array.isArray(node))return node.flatMap(nodes);return [node,...nodes(node.props?.children)];}
const confirmAlias={'创建四人房间':'确认创建新房','Create four-player room':'Confirm new room','生成回复码':'确认加入新房','Create reply code':'Confirm joining new room','生成邀请码':'确认创建新房','Create invitation code':'Confirm new room','创建房间':'确认创建新房','Create room':'Confirm new room','加入房间':'确认加入新房','Join room':'Confirm joining new room'};
function button(tree,label){const found=nodes(tree).find(n=>n.type==='button'&&(text(n)===label||text(n)===confirmAlias[label]));assert.ok(found,`Missing button: ${label}`);assert.ok(!found.props.disabled);return found;}
function render(locale){cursor=0;return expandRoomKit(Remote({locale}));}
(async()=>{
 for(const locale of ['zh','en']){
  hooks=[];effects=[];checkpointText='private-checkpoint';
  const data=new Map([[RIICHI_SAVE_KEY,JSON.stringify({version:1,role:'host',checkpoint:'saved-checkpoint'})]]);
  global.sessionStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
  render(locale);effects.splice(0).forEach(fn=>fn());await Promise.resolve();let tree=render(locale);
  const before=hosts.length;
  button(tree,locale==='zh'?'创建四人房间':'Create four-player room').props.onClick();tree=render(locale);
  assert.equal(hosts.length,before);
  assert.equal(JSON.parse(data.get(RIICHI_SAVE_KEY)).checkpoint,'saved-checkpoint');
  button(tree,locale==='zh'?'创建四人房间':'Create four-player room').props.onClick();tree=render(locale);
  assert.equal(hosts.length,before+1);
  assert.equal(JSON.parse(data.get(RIICHI_SAVE_KEY)).checkpoint,'saved-checkpoint','New lobby must retain old save');
  button(tree,locale==='zh'?'离开房间':'Leave room').props.onClick();tree=render(locale);
  button(tree,locale==='zh'?'确认离开，停止本场':'Confirm leave and stop match').props.onClick();tree=render(locale);
  const invite=nodes(tree).find(n=>n.type==='textarea'&&n.props['aria-label']===(locale==='zh'?'房主邀请':'Host invitation'));
  invite.props.onChange({target:{value:'{"not":"an invitation"}'}});tree=render(locale);
  button(tree,locale==='zh'?'生成回复码':'Create reply code').props.onClick();tree=render(locale);
  assert.ok(text(tree).includes(locale==='zh'?'邀请文本无效':'Invalid invitation'));
  assert.equal(JSON.parse(data.get(RIICHI_SAVE_KEY)).checkpoint,'saved-checkpoint','Invalid offer must retain old save');
  button(tree,locale==='zh'?'恢复上次牌局':'Restore previous match').props.onClick();tree=render(locale);
  hosts.at(-1).ready();tree=render(locale);
  button(tree,locale==='zh'?'四人到齐，继续原牌局':'All four ready — resume original match').props.onClick();tree=render(locale);
  assert.equal(JSON.parse(data.get(RIICHI_SAVE_KEY)).checkpoint,'saved-checkpoint','A state message alone must not invent a checkpoint');
  checkpointText='committed-before-send-failure';
  hosts.at(-1).onMessage({payload:{kind:'closed',reason:'player-left',player:2}});tree=render(locale);
  assert.equal(JSON.parse(data.get(RIICHI_SAVE_KEY)).checkpoint,checkpointText,'Closed transport must checkpoint the latest committed host state');
 }
 console.log('PASS: bilingual riichi UI handlers preserve an old save through new lobby, cancellation and malformed guest offer, then checkpoint the latest host state on transport close. Hook/transport doubles, not native browser proof.');
})().catch(e=>{console.error(e);process.exitCode=1;});
