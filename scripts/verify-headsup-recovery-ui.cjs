const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),assert=require('node:assert/strict');
const {expandRoomKit}=require('./lib/room-kit-tree.cjs');
require.extensions['.tsx']=require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
const resolve=Module._resolveFilename;
Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.resolve(__dirname,'..',request.slice(2)):request,...args);};
const {newPokerSession,applyPokerRequest,pokerView}=require('../lib/holdem-remote.ts');
const {HEADSUP_POKER_SAVE_KEY:key}=require('../lib/holdem-headsup-save.ts');
const initial=newPokerSession(Array.from({length:52},(_,i)=>i));
const ended=applyPokerRequest(initial,0,{hand:1,revision:0,action:{kind:'fold'}});
const React=require('react'),load=Module._load;
let hooks=[],cursor=0,effects=[],deliveredView,failCheckpoint=false,checkpointText='new-checkpoint';
const hosts=[];
function slot(make){const i=cursor++;if(!(i in hooks))hooks[i]=make();return i;}
class Host{
 constructor(onMessage,onClose){hosts.push(this);this.onMessage=onMessage;this.onClose=onClose;this.room={recoveryCheckpoint(){if(failCheckpoint)throw Error('serialize');return checkpointText;}};}
 async offer(){return 'fresh-invitation';}
 ready(){this.onMessage({payload:{kind:'lobby',connected:[true,true]}});}
 start(){this.onMessage({payload:{kind:'view',view:deliveredView}});return true;}
 close(){}
}
Module._load=function(request,...args){
 if(request==='react')return {...React,useState(initial){const i=slot(()=>typeof initial==='function'?initial():initial);return [hooks[i],v=>{hooks[i]=typeof v==='function'?v(hooks[i]):v;}];},useRef(initial){return hooks[slot(()=>({current:initial}))];},useEffect(effect){slot(()=>{effects.push(effect);return true;});},useSyncExternalStore(){slot(()=>true);return '';}};
 if(request==='@/lib/holdem-headsup-manual')return {ManualHeadsUpPokerHost:Host};
 return load.call(this,request,...args);
};
const Remote=require('../components/cards/HoldemRemote.tsx').default;
function text(node){if(node==null||typeof node==='boolean')return '';if(typeof node!=='object')return String(node);return Array.isArray(node)?node.map(text).join(''):text(node.props?.children);}
function nodes(node){if(!node||typeof node!=='object')return [];if(Array.isArray(node))return node.flatMap(nodes);return [node,...nodes(node.props?.children)];}
const confirmAlias={'创建四人房间':'确认创建新房','Create four-player room':'Confirm new room','生成回复码':'确认加入新房','Create reply code':'Confirm joining new room','生成邀请码':'确认创建新房','Create invitation code':'Confirm new room','创建房间':'确认创建新房','Create room':'Confirm new room','加入房间':'确认加入新房','Join room':'Confirm joining new room'};
function button(tree,label){const n=nodes(tree).find(n=>n.type==='button'&&(text(n)===label||text(n)===confirmAlias[label]));assert.ok(n,`Missing ${label}`);assert.ok(!n.props.disabled);return n;}
function render(locale){cursor=0;return expandRoomKit(Remote({locale}));}
(async()=>{
 for(const locale of ['zh','en'])for(const over of [false,true])for(const failure of [false,true]){
  hooks=[];effects=[];deliveredView=pokerView(over?ended:initial,0);failCheckpoint=failure;checkpointText='new-checkpoint';
  const data=new Map([[key,JSON.stringify({version:1,role:'host',checkpoint:'old-checkpoint'})]]);
  global.sessionStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
  render(locale);effects.splice(0).forEach(fn=>fn());await Promise.resolve();let tree=render(locale);
  // These scenarios cover the code-exchange fallback; the default is link mode.
  nodes(tree).find(n=>n.type==='select').props.onChange({target:{value:'code'}});tree=render(locale);
  const before=hosts.length;
  await button(tree,locale==='zh'?'生成邀请码':'Create invitation code').props.onClick();tree=render(locale);
  assert.equal(hosts.length,before);assert.equal(JSON.parse(data.get(key)).checkpoint,'old-checkpoint');
  assert.ok(nodes(tree).some(n=>n.props?.role==='alert'&&text(n).includes(locale==='zh'?'旧存档会保留':'old save stays')),'New-room confirmation must be shown');
  await button(tree,locale==='zh'?'生成邀请码':'Create invitation code').props.onClick();tree=render(locale);
  assert.equal(hosts.length,before+1);
  assert.equal(JSON.parse(data.get(key)).checkpoint,'old-checkpoint','New invitation must not clear old save before a hand starts');
  button(tree,locale==='zh'?'离开房间':'Leave room').props.onClick();tree=render(locale);
  assert.equal(JSON.parse(data.get(key)).checkpoint,'old-checkpoint','Leaving an unstarted room must retain old save');
  const received=nodes(tree).find(n=>n.type==='textarea'&&n.props.value==='');
  assert.ok(received,'Received-information textarea should exist');
  received.props.onChange({target:{value:'{"not":"an invitation"}'}});tree=render(locale);
  await button(tree,locale==='zh'?'生成回复码':'Create reply code').props.onClick();tree=render(locale);
  assert.ok(text(tree).includes(locale==='zh'?'邀请文本无效':'Invalid invitation'));
  assert.ok(nodes(tree).some(n=>n.props?.role==='alert'&&text(n).includes(locale==='zh'?'邀请文本无效':'Invalid invitation')),'Manual errors must be shown as an alert');
  assert.equal(JSON.parse(data.get(key)).checkpoint,'old-checkpoint','Invalid offer must preserve old save');
  button(tree,locale==='zh'?'删除这个存档':'Delete this save').props.onClick();tree=render(locale);
  await button(tree,locale==='zh'?'恢复上次牌局':'Restore previous match').props.onClick();hosts.at(-1).ready();tree=render(locale);
  assert.ok(nodes(tree).some(n=>n.props?.className==='room-steps'),'Recovery must reveal its connection steps');
  const statuses=nodes(tree).filter(n=>n.props?.role==='status').map(text).join('\n');
  assert.ok(statuses.includes(locale==='zh'?'双方已连接，请房主确认':'Both connected — waiting for the host'));
  for(const stale of ['正在尝试局域网直连','Attempting a direct LAN connection','邀请码已生成：','Invitation ready:','回复码已生成：','Response ready:'])assert.ok(!statuses.includes(stale));
  button(tree,locale==='zh'?'双方已连接，继续原局':'Both connected — continue saved match').props.onClick();tree=render(locale);
  assert.equal(text(tree).includes(locale==='zh'?'本次保存失败':'Save failed'),failure);
  assert.equal(JSON.parse(data.get(key)).checkpoint,failure?'old-checkpoint':'new-checkpoint');
  assert.ok(text(tree).includes(locale==='zh'?(over?'本手已结束':'轮到你了'):(over?'Hand complete':'Your turn')));
  if(over)button(tree,locale==='zh'?'同意下一手':'Agree to next hand');
  else assert.equal(nodes(tree).find(n=>n.type==='fieldset').props.disabled,false);
  checkpointText='committed-before-send-failure';
  hosts.at(-1).onClose();tree=render(locale);
  assert.equal(JSON.parse(data.get(key)).checkpoint,failure?'old-checkpoint':checkpointText,'Disconnect must checkpoint the latest committed host state before disposal');
  // A dropped connection returns to the role choice; Leave is only offered while a room is live.
  const leave=nodes(tree).find(n=>n.type==='button'&&text(n)===(locale==='zh'?'离开房间':'Leave room'));if(leave){leave.props.onClick();tree=render(locale);}
  button(tree,locale==='zh'?'删除这个存档':'Delete this save');
 }
 console.log('PASS: 8 bilingual heads-up recovery UI handler cases; delayed new-match save replacement, invalid-offer preservation, restored active/ended views, explicit continue and contained serialization failure. Hook/transport doubles, not native browser.');
})().catch(e=>{console.error(e);process.exitCode=1;});
