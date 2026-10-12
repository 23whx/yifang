const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),assert=require('node:assert/strict');
const {expandRoomKit}=require('./lib/room-kit-tree.cjs');
require.extensions['.tsx']=require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
const resolve=Module._resolveFilename;
Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.resolve(__dirname,'..',request.slice(2)):request,...args);};
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),vendorLoad=Module._load;
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?core:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:vendorLoad.call(this,request,...args);};
 const js=require.extensions['.js'];require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {newMcrMatch,actMcrMatch,mcrMatchView}=require('../lib/mahjong/mcr-match.ts');
 const {MCR_SAVE_KEY}=require('../lib/mahjong/mcr-save.ts');
 let session=newMcrMatch(42),steps=0;
 const initialView=mcrMatchView(session,0);
 while(!mcrMatchView(session,0).complete){
  assert.ok(++steps<15000);
  const views=[0,1,2,3].map(i=>mcrMatchView(session,i));
  const active=views.find(v=>v.choices.length),confirm=views.findIndex(v=>v.canConfirm);
  const seat=active?active.seat:confirm>=0?confirm:0;
  const choice=active?(active.choices.find(c=>c.claim==='win'||c.type==='declare-self-draw')??active.choices[0]).index:confirm>=0?'confirm':'next';
  session=actMcrMatch(session,seat,session.revision,choice);
 }
 const endedView=mcrMatchView(session,0);
 assert.equal(endedView.history.length,16);
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
 // Code-mode fallback under test; link mode is covered by the browser duel scripts.
 if(request==='@/components/remote/useFourSeatLink')return {useFourSeatLink:()=>({mode:'code',setMode(){},code:'',note:'',setNote(){},entry:'',setEntry(){},invited:'',canJoin:false,hasStoredRoom:()=>false,forgetRoom(){},visitors:[],lounge:null,reconnect:'',reconnectSince:null,setReconnect(){},admit(){},deny(){},kick(){},async host(){},async join(){},stop(){},leave(){}})};
 if(request==='react')return {...React,
  useState(initial){const i=slot(()=>typeof initial==='function'?initial():initial);return [hooks[i],v=>{hooks[i]=typeof v==='function'?v(hooks[i]):v;}];},
  useRef(initial){return hooks[slot(()=>({current:initial}))];},
  useEffect(effect){slot(()=>{effects.push(effect);return true;});}
 };
 if(request==='@/lib/mahjong/mcr-manual')return {ManualMcrHost:Host};
 if(request==='./McrPractice')return {__esModule:true,default:Practice};
 return load.call(this,request,...args);
};
const Remote=require('../components/cards/McrRemote.tsx').default;
function text(node){if(node==null||typeof node==='boolean')return '';if(typeof node!=='object')return String(node);return Array.isArray(node)?node.map(text).join(''):text(node.props?.children);}
function nodes(node){if(!node||typeof node!=='object')return [];if(Array.isArray(node))return node.flatMap(nodes);return [node,...nodes(node.props?.children)];}
const confirmAlias={'创建四人房间':'确认创建新房','Create four-player room':'Confirm new room','生成回复码':'确认加入新房','Create reply code':'Confirm joining new room','生成邀请码':'确认创建新房','Create invitation code':'Confirm new room','创建房间':'确认创建新房','Create room':'Confirm new room','加入房间':'确认加入新房','Join room':'Confirm joining new room'};
function button(tree,label){const found=nodes(tree).find(n=>n.type==='button'&&(text(n)===label||text(n)===confirmAlias[label]));assert.ok(found,`Missing button: ${label}`);assert.ok(!found.props.disabled);return found;}
function render(locale){cursor=0;return expandRoomKit(Remote({locale}));}
async function mount(locale){
 hooks=[];cursor=0;effects=[];
 const data=new Map([[MCR_SAVE_KEY,JSON.stringify({version:1,role:'host',checkpoint:'saved-checkpoint'})]]);
 global.sessionStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 render(locale);effects.splice(0).forEach(fn=>fn());await Promise.resolve();return render(locale);
}
 for(const locale of ['zh','en'])for(const ended of [false,true])for(const failure of [false,true]){
  deliveredView=ended?endedView:initialView;failCheckpoint=failure;checkpointText='private-checkpoint';
  let tree=await mount(locale);
  const priorHosts=hosts.length;
  global.window={isSecureContext:false};
  button(tree,locale==='zh'?'创建四人房间':'Create four-player room').props.onClick();tree=render(locale);
  assert.equal(hosts.length,priorHosts,'Insecure origin must not construct a host or clear a saved match');
  assert.equal(JSON.parse(sessionStorage.getItem(MCR_SAVE_KEY)).checkpoint,'saved-checkpoint');
  assert.ok(text(tree).includes(locale==='zh'?'当前页面不是安全上下文':'This page is not a secure context'));
  delete global.window;
  button(tree,locale==='zh'?'创建四人房间':'Create four-player room').props.onClick();tree=render(locale);
  assert.equal(hosts.length,priorHosts,'First new-room click must not replace the saved match');
  assert.ok(text(tree).includes(locale==='zh'?'旧存档会保留':'old save stays'));
  assert.equal(JSON.parse(sessionStorage.getItem(MCR_SAVE_KEY)).checkpoint,'saved-checkpoint');
  button(tree,locale==='zh'?'创建四人房间':'Create four-player room').props.onClick();tree=render(locale);
  assert.equal(hosts.length,priorHosts+1,'Confirmed new room should be created');
  assert.equal(JSON.parse(sessionStorage.getItem(MCR_SAVE_KEY)).checkpoint,'saved-checkpoint','Old save must survive a new lobby until a new checkpoint is written');
  button(tree,locale==='zh'?'离开房间':'Leave room').props.onClick();tree=render(locale);
  button(tree,locale==='zh'?'确认离开，停止本场':'Confirm leave and stop match').props.onClick();tree=render(locale);
  assert.equal(JSON.parse(sessionStorage.getItem(MCR_SAVE_KEY)).checkpoint,'saved-checkpoint','Abandoning an unstarted room must preserve the original save');
  const invite=nodes(tree).find(n=>n.type==='textarea'&&n.props['aria-label']===(locale==='zh'?'房主邀请':'Host invitation'));
  invite.props.onChange({target:{value:'{"not":"an invitation"}'}});tree=render(locale);
  button(tree,locale==='zh'?'生成回复码':'Create reply code').props.onClick();tree=render(locale);
  assert.ok(text(tree).includes(locale==='zh'?'邀请文本无效':'Invalid invitation'));
  assert.equal(JSON.parse(sessionStorage.getItem(MCR_SAVE_KEY)).checkpoint,'saved-checkpoint','Malformed offer must preserve the original save');
  // A half-confirmed delete must not remain armed after entering recovery.
  button(tree,locale==='zh'?'删除这个存档':'Delete this save').props.onClick();tree=render(locale);
  button(tree,locale==='zh'?'恢复上次牌局':'Restore previous match').props.onClick();
  hosts.at(-1).ready();tree=render(locale);
  assert.doesNotThrow(()=>button(tree,locale==='zh'?'四人到齐，继续原牌局':'All four ready — resume original match').props.onClick());
  tree=render(locale);const body=text(tree),practice=nodes(tree).find(n=>n.type===Practice);
  assert.ok(body.includes(locale==='zh'?'已恢复原牌局':'Original match restored'));
  assert.ok(!body.includes(locale==='zh'?'等待重新连接':'keep your original seat and reconnect'));
  assert.equal(practice.props.remote.disabled,ended,'Completed match must remain disabled after start callback');
  if(ended){assert.ok(body.includes(locale==='zh'?'本场结束':'Match finished'));button(tree,locale==='zh'?'删除这个存档':'Delete this save');}
  else assert.ok(body.includes(locale==='zh'?'对局中':'Playing'));
  assert.equal(body.includes(locale==='zh'?'本次进度保存失败':'This update could not be saved'),failure);
  if(failure)assert.equal(JSON.parse(sessionStorage.getItem(MCR_SAVE_KEY)).checkpoint,'saved-checkpoint');
  // The action journal may advance just before an ACK send fails, closing the
  // room before a fresh table view can arrive. Preserve the host's latest log.
  checkpointText='committed-before-send-failure';
  hosts.at(-1).onMessage({payload:{kind:'closed',player:2}});
  tree=render(locale);
  assert.equal(JSON.parse(sessionStorage.getItem(MCR_SAVE_KEY)).checkpoint,failure?'saved-checkpoint':checkpointText,'A closure must save the host journal even without a final view');
  assert.ok(text(tree).includes(locale==='zh'?'连接已结束':'Connection ended'));
 }
 console.log(`PASS: 8 bilingual recovery UI handler scenarios, real ${steps}-action terminal view, delayed new-match save replacement, invalid-offer preservation, authoritative terminal status and checkpoint-error containment. Hook/transport doubles, not native browser proof.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
