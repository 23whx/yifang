const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),assert=require('node:assert/strict');
const {expandRoomKit}=require('./lib/room-kit-tree.cjs');
require.extensions['.tsx']=require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
const resolve=Module._resolveFilename;
Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.resolve(__dirname,'..',request.slice(2)):request,...args);};
const {newMultiSession,applyMultiRequest,multiView}=require('../lib/holdem-multi-session.ts');
const {shuffle}=require('../lib/holdem.ts');
const {MULTI_POKER_SAVE_KEY}=require('../lib/holdem-multi-save.ts');
let seed=42;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
let session=newMultiSession([200,200,200,200],0,shuffle(random)),steps=0;
const initialView=multiView(session,0);
while(!session.table.over||session.table.stacks.filter(n=>n>0).length>1){
 assert.ok(++steps<2000);
 const seat=session.table.over?session.next.findIndex((v,i)=>!v&&session.table.stacks[i]>0):session.table.actor;
 const v=multiView(session,seat),l=v.legal;
 const action=v.over?{kind:'next'}:l.canRaise?{kind:'raise',to:l.maxTo}:{kind:l.canCheck?'check':'call'};
 session=applyMultiRequest(session,seat,{hand:session.hand,revision:session.revision,action},shuffle(random));
}
const endedView=multiView(session,0);
// Exercise the actual component's handlers with a minimal hook scheduler.
// The transport is a synchronous callback double, not React DOM or WebRTC.
const React=require('react'),load=Module._load;
let hooks=[],cursor=0,effects=[],deliveredView,failCheckpoint=false,checkpointText='private-checkpoint';
const hosts=[];
function slot(make){const i=cursor++;if(!(i in hooks))hooks[i]=make();return i;}
class Host {
 constructor(onMessage){hosts.push(this);this.onMessage=onMessage;this.room={status:'lobby',recoveryCheckpoint(){if(failCheckpoint)throw Error('checkpoint serialization failed');return checkpointText;}};}
 ready(){this.onMessage({payload:{kind:'lobby',connected:[true,true,true,true]}});}
 start(){this.room.status='playing';this.onMessage({payload:{kind:'view',view:deliveredView}});return true;}
 close(){}
}
function Practice(){}
Module._load=function(request,...args){
 if(request==='react')return {...React,
  useState(initial){const i=slot(()=>typeof initial==='function'?initial():initial);return [hooks[i],v=>{hooks[i]=typeof v==='function'?v(hooks[i]):v;}];},
  useRef(initial){return hooks[slot(()=>({current:initial}))];},
  useEffect(effect){slot(()=>{effects.push(effect);return true;});}
 };
 if(request==='@/lib/holdem-multi-manual')return {ManualPokerHost:Host};
 if(request==='./MultiPokerTable')return {__esModule:true,default:Practice};
 return load.call(this,request,...args);
};
const Remote=require('../components/cards/MultiPokerRemote.tsx').default;
function text(node){if(node==null||typeof node==='boolean')return '';if(typeof node!=='object')return String(node);return Array.isArray(node)?node.map(text).join(''):text(node.props?.children);}
function nodes(node){if(!node||typeof node!=='object')return [];if(Array.isArray(node))return node.flatMap(nodes);return [node,...nodes(node.props?.children)];}
const confirmAlias={'创建四人房间':'确认创建新房','Create four-player room':'Confirm new room','生成回复码':'确认加入新房','Create reply code':'Confirm joining new room','生成邀请码':'确认创建新房','Create invitation code':'Confirm new room','创建房间':'确认创建新房','Create room':'Confirm new room','加入房间':'确认加入新房','Join room':'Confirm joining new room'};
function button(tree,label){const found=nodes(tree).find(n=>n.type==='button'&&(text(n)===label||text(n)===confirmAlias[label]));assert.ok(found,`Missing button: ${label}`);assert.ok(!found.props.disabled);return found;}
function render(locale){cursor=0;return expandRoomKit(Remote({locale}));}
async function mount(locale){
 hooks=[];cursor=0;effects=[];
 const data=new Map([[MULTI_POKER_SAVE_KEY,JSON.stringify({version:1,role:'host',checkpoint:'saved-checkpoint'})]]);
 global.sessionStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 render(locale);effects.splice(0).forEach(fn=>fn());await Promise.resolve();return render(locale);
}
(async()=>{
 for(const locale of ['zh','en'])for(const ended of [false,true])for(const failure of [false,true]){
  deliveredView=ended?endedView:initialView;failCheckpoint=failure;checkpointText='private-checkpoint';
  let tree=await mount(locale);
  const before=hosts.length;
  button(tree,locale==='zh'?'创建四人房间':'Create four-player room').props.onClick();tree=render(locale);
  assert.equal(hosts.length,before);
  button(tree,locale==='zh'?'创建四人房间':'Create four-player room').props.onClick();tree=render(locale);
  assert.equal(hosts.length,before+1);
  assert.equal(JSON.parse(sessionStorage.getItem(MULTI_POKER_SAVE_KEY)).checkpoint,'saved-checkpoint','New lobby must not delete original save');
  button(tree,locale==='zh'?'离开房间':'Leave room').props.onClick();tree=render(locale);
  button(tree,locale==='zh'?'确认离开，停止本场':'Confirm leave and stop match').props.onClick();tree=render(locale);
  const invite=nodes(tree).find(n=>n.type==='textarea'&&n.props['aria-label']===(locale==='zh'?'房主邀请':'Host invitation'));
  invite.props.onChange({target:{value:'{"not":"an invitation"}'}});tree=render(locale);
  button(tree,locale==='zh'?'生成回复码':'Create reply code').props.onClick();tree=render(locale);
  assert.ok(text(tree).includes(locale==='zh'?'邀请文本无效':'Invalid invitation'));
  assert.equal(JSON.parse(sessionStorage.getItem(MULTI_POKER_SAVE_KEY)).checkpoint,'saved-checkpoint','Invalid offer must not delete original save');
  const priorHosts=hosts.length;
  button(tree,locale==='zh'?'创建四人房间':'Create four-player room').props.onClick();tree=render(locale);
  assert.equal(hosts.length,priorHosts,'First new-room click must not replace the saved match');
  assert.ok(text(tree).includes(locale==='zh'?'旧存档会保留':'old save stays'));
  assert.equal(JSON.parse(sessionStorage.getItem(MULTI_POKER_SAVE_KEY)).checkpoint,'saved-checkpoint');
  // A half-confirmed delete must not remain armed after entering recovery.
  button(tree,locale==='zh'?'删除这个存档':'Delete this save').props.onClick();tree=render(locale);
  button(tree,locale==='zh'?'恢复上次牌局':'Restore previous match').props.onClick();
  hosts.at(-1).ready();tree=render(locale);
  assert.doesNotThrow(()=>button(tree,locale==='zh'?'四人到齐，继续原牌局':'All four ready — resume original match').props.onClick());
  tree=render(locale);const body=text(tree),practice=nodes(tree).find(n=>n.type===Practice);
  assert.ok(body.includes(locale==='zh'?'已恢复原牌局':'Original match restored'));
  assert.ok(!body.includes(locale==='zh'?'等待重新连接':'keep your original seat and reconnect'));
  assert.equal(practice.props.disabled,ended,'Completed match must remain disabled after start callback');
  if(ended){assert.ok(body.includes(locale==='zh'?'本场结束':'Match finished'));button(tree,locale==='zh'?'删除这个存档':'Delete this save');}
  else assert.ok(body.includes(locale==='zh'?'对局中':'Playing'));
  assert.equal(body.includes(locale==='zh'?'本次进度保存失败':'This update could not be saved'),failure);
  if(failure)assert.equal(JSON.parse(sessionStorage.getItem(MULTI_POKER_SAVE_KEY)).checkpoint,'saved-checkpoint');
  checkpointText='committed-before-send-failure';
  hosts.at(-1).onMessage({payload:{kind:'closed',player:2}});tree=render(locale);
  assert.equal(JSON.parse(sessionStorage.getItem(MULTI_POKER_SAVE_KEY)).checkpoint,failure?'saved-checkpoint':checkpointText,'Closed transport must checkpoint the latest committed host state');
 }
 console.log(`PASS: 8 bilingual recovery UI handler scenarios, real ${steps}-action terminal view, delayed new-match save replacement, invalid-offer preservation, authoritative terminal status and checkpoint-error containment. Hook/transport doubles, not native browser proof.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
