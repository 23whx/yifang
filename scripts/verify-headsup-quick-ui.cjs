const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),assert=require('node:assert/strict');
const {expandRoomKit}=require('./lib/room-kit-tree.cjs');
const {AsyncLocalStorage}=require('node:async_hooks');
require.extensions['.tsx']=require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
const resolve=Module._resolveFilename;
Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.resolve(__dirname,'..',request.slice(2)):request,...args);};
const {HeadsUpPokerRoom}=require('../lib/holdem-headsup-room.ts');
const {readHeadsUpGuestRecovery}=require('../lib/holdem-headsup-manual.ts');
const {HEADSUP_POKER_SAVE_KEY:key}=require('../lib/holdem-headsup-save.ts');
const scope=new AsyncLocalStorage(),React=require('react'),load=Module._load;
const peers=new Map(),traffic=[];
class Events{
 constructor(){this.listeners=new Map();}
 on(event,fn){const owner=scope.getStore();this.listeners.set(event,[...(this.listeners.get(event)||[]),(...args)=>scope.run(owner,()=>fn(...args))]);return this;}
 emit(event,...args){for(const fn of this.listeners.get(event)||[])fn(...args);}
}
class Connection extends Events{
 constructor(){super();this.open=false;this.closed=false;}
 send(value){assert.ok(this.open);traffic.push(structuredClone(value));this.other.emit('data',structuredClone(value));}
 close(){if(this.closed)return;this.closed=true;this.open=false;this.emit('close');this.other?.close();}
}
class Peer extends Events{
 constructor(id){super();this.id=id||crypto.randomUUID();this.connections=[];peers.set(this.id,this);queueMicrotask(()=>this.emit('open',this.id));}
 connect(id){const remote=peers.get(id);assert.ok(remote);const a=new Connection(),b=new Connection();a.other=b;b.other=a;this.connections.push(a);remote.connections.push(b);queueMicrotask(()=>{remote.emit('connection',b);a.open=b.open=true;a.emit('open');b.emit('open');});return a;}
 destroy(){this.connections.forEach(c=>c.close());peers.delete(this.id);}
}
function slot(make){const tab=scope.getStore(),i=tab.cursor++;if(!(i in tab.hooks))tab.hooks[i]=make();return [tab,i];}
Module._load=function(request,...args){
 if(request==='peerjs')return {__esModule:true,default:Peer,Peer};
 if(request==='react')return {...React,useState(initial){const [tab,i]=slot(()=>typeof initial==='function'?initial():initial);return [tab.hooks[i],v=>{tab.hooks[i]=typeof v==='function'?v(tab.hooks[i]):v;}];},useRef(initial){const [tab,i]=slot(()=>({current:initial}));return tab.hooks[i];},useEffect(effect){slot(()=>{scope.getStore().effects.push(effect);return true;});},useSyncExternalStore(){slot(()=>true);return '';}};
 return load.call(this,request,...args);
};
globalThis.RTCPeerConnection??=function(){};
Object.defineProperty(global,'sessionStorage',{configurable:true,get(){return scope.getStore().storage;}});
const Remote=require('../components/cards/HoldemRemote.tsx').default;
function tab(locale){const data=new Map();return {locale,data,cursor:0,hooks:[],effects:[],cleanups:[],storage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}};}
function render(t){return scope.run(t,()=>{t.cursor=0;return expandRoomKit(Remote({locale:t.locale}));});}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
async function mount(t){render(t);scope.run(t,()=>t.effects.splice(0).forEach(fn=>{const clean=fn();if(clean)t.cleanups.push(clean);}));await flush();}
function text(n){if(n==null||typeof n==='boolean')return '';if(typeof n!=='object')return String(n);return Array.isArray(n)?n.map(text).join(''):text(n.props?.children);}
function nodes(n){if(!n||typeof n!=='object')return [];if(Array.isArray(n))return n.flatMap(nodes);return [n,...nodes(n.props?.children)];}
async function click(t,label){const n=nodes(render(t)).find(n=>n.type==='button'&&text(n)===label);assert.ok(n,`Missing ${label}`);assert.ok(!n.props.disabled,`Disabled ${label}`);await scope.run(t,()=>n.props.onClick());await flush();}
function save(t){return JSON.parse(t.data.get(key));}
(async()=>{
 {
  const blocked=tab('zh');await mount(blocked);
  global.window={isSecureContext:false};
  try{
   await click(blocked,'创建房间');
   assert.ok(text(render(blocked)).includes('当前页面不是安全上下文'));
   assert.equal(peers.size,0,'Insecure quick room must not contact PeerJS');
  }finally{delete global.window;scope.run(blocked,()=>blocked.cleanups.forEach(fn=>fn()));}
 }
 for(const locales of [['zh','en'],['en','zh']]){
  const h=tab(locales[0]),g=tab(locales[1]),zh=t=>t.locale==='zh';
  try{
   await mount(h);await mount(g);
   for(const t of [h,g])for(const phrase of zh(t)?['PeerJS 公共服务','第三方 STUN','TURN 中继','邀请码 + 回复码']:['PeerJS public service','third-party STUN','through TURN','Invitation + reply codes'])assert.ok(text(render(t)).includes(phrase),`Missing ${t.locale} quick-room network disclosure: ${phrase}`);
   await click(h,zh(h)?'创建房间':'Create room');
   const code=nodes(render(h)).find(n=>n.type==='code');assert.ok(code);const room=text(code);
   const input=nodes(render(g)).find(n=>n.type==='input'&&n.props.placeholder==='https://…?room=…');
   scope.run(g,()=>input.props.onChange({target:{value:room}}));
   await click(g,zh(g)?'加入房间':'Join room');
   assert.ok(text(render(h)).includes(zh(h)?'双方已连接，请房主确认':'Both connected — waiting for the host'));
   assert.equal(h.data.has(key),false);assert.equal(g.data.has(key),false,'No save or deal before explicit start');
   await click(h,zh(h)?'双方已连接，开始发牌':'Both connected — deal cards');
   assert.equal(save(h).role,'host');assert.equal(save(g).role,'guest');
   await click(h,zh(h)?'跟注：补 5':'Call: add 5');
   await click(g,zh(g)?'过牌：不投入，交给对手':'Check: add nothing');
   const guest=readHeadsUpGuestRecovery(save(g).checkpoint),view=JSON.parse(guest.lastView);
   assert.equal(view.street,1);assert.deepEqual(view.stacks,[190,190]);assert.deepEqual(view.committed,[10,10]);assert.equal(view.opponentCards.length,0);
   const hostSave=save(h).checkpoint,guestSave=save(g).checkpoint,roomAgain=HeadsUpPokerRoom.restoreCheckpoint(hostSave,()=>{});
   assert.ok(roomAgain.resume(1,guest.key,guest.lastView,()=>{}));assert.ok(roomAgain.start());
   const beforeH=JSON.stringify(save(h)),beforeG=JSON.stringify(save(g));
   scope.run(g,()=>g.cleanups.forEach(fn=>fn()));await flush();
   assert.equal(JSON.stringify(save(h)),beforeH);assert.equal(JSON.stringify(save(g)),beforeG);
   assert.ok(text(render(h)).includes(zh(h)?'连接已停止':'Connection stopped'));
   const savedH=h.data.get(key),savedG=g.data.get(key);
   scope.run(h,()=>h.cleanups.forEach(fn=>fn()));
   for(const [t,value] of [[h,savedH],[g,savedG]]){t.hooks=[];t.effects=[];t.cleanups=[];t.data.set(key,value);await mount(t);assert.ok(text(render(t)).includes(zh(t)?'本标签页已保存上次的牌局':'This tab has a saved match'));}
   assert.equal(save(h).checkpoint,hostSave);assert.equal(save(g).checkpoint,guestSave);
   for(const m of traffic.filter(m=>m.payload))assert.ok(!/"(?:keys|deck|archive)":/.test(JSON.stringify(m)));
  }finally{for(const t of [h,g])scope.run(t,()=>t.cleanups.forEach(fn=>fn()));}
 }
 console.log('PASS: actual heads-up component quick host/join handlers in both locale-role pairings, explicit deal, call/check flop, separate host/guest saves, exact compatible recovery, disconnect without awards and remount readback. Hook/PeerJS/Storage doubles; actual protocol, room and rules. Not native signaling or browser acceptance.');
})().catch(e=>{console.error(e);process.exitCode=1;});
