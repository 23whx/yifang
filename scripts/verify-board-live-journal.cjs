const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),assert=require('node:assert/strict');
const {expandRoomKit}=require('./lib/room-kit-tree.cjs');
require.extensions['.tsx']=require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
const resolve=Module._resolveFilename;
Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.resolve(__dirname,'..',request.slice(2)):request,...args);};
const React=require('react'),load=Module._load,{BoardRecoverySession}=require('../lib/board/recovery-session.ts');
const {BoardRecoveryChannel}=require('../lib/board/recovery-channel.ts');
const {GoRecoverySession}=require('../lib/go/recovery-session.ts');
let runtime,rules,channels=[],journals=[],goJournals=[];
Object.defineProperty(global,'sessionStorage',{configurable:true,get:()=>runtime.store});
const enqueue=queueMicrotask;
const signal=(game,type)=>JSON.stringify({v:1,game,id:'a'.repeat(24),type,sdp:'v=0\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\n'});
global.queueMicrotask=fn=>{const r=runtime;enqueue(()=>{const previous=runtime;runtime=r;try{fn();}finally{runtime=previous;}});};
class ContextChannel extends BoardRecoveryChannel{constructor(...args){const r=runtime,ready=args[6],failure=args[7];args[6]=(...values)=>{runtime=r;ready(...values);};args[7]=()=>{runtime=r;failure();};super(...args);}}
class TrackedSession extends BoardRecoverySession {constructor(...args){super(...args);journals.push(this);}}
class TrackedGoSession extends GoRecoverySession {constructor(...args){super(...args);goJournals.push(this);}}
class Connection {
 constructor(game,host){this.client=runtime;this.game=game;this.host=host;this.open=false;this.handlers=new Map();channels.push(this);this.rtc={offer:async()=> signal(game,'offer'),answer:async()=> signal(game,'answer'),finish:async()=>{
  const other=channels.find(c=>c!==this);assert.equal(other.game,this.game);this.other=other;other.other=this;this.open=other.open=true;this.emit('open');other.emit('open');
 }};}
 on(kind,fn){this.handlers.set(kind,[...(this.handlers.get(kind)??[]),fn]);}
 emit(kind,value){runtime=this.client;for(const fn of this.handlers.get(kind)??[])fn(value);}
 send(value){assert.ok(this.open);if(value.epoch)this.epoch=value.epoch;const copy=structuredClone(value);queueMicrotask(()=>{if(this.other.open)this.other.emit('data',copy);});}
 close(){if(!this.open)return;this.open=false;this.emit('close');if(this.other?.open){this.other.open=false;this.other.emit('close');}}
}
function Board(){}
function GoBoard(){}
Module._load=function(request,...args){
 if(request==='react')return {...React,useState(initial){const r=runtime,i=r.cursor++;if(!(i in r.slots))r.slots[i]=typeof initial==='function'?initial():initial;return [r.slots[i],value=>{r.slots[i]=typeof value==='function'?value(r.slots[i]):value;}];},
  useRef(initial){const r=runtime,i=r.cursor++;return r.slots[i]??(r.slots[i]={current:initial});},
  useEffect(effect){const r=runtime,i=r.cursor++;if(!(i in r.slots)){r.slots[i]=true;r.cleanup.push(effect());}},
  useSyncExternalStore(_subscribe,_snapshot,server){return server();}};
 if(request==='@/lib/board/ffish')return {loadFfish:async()=>rules};
 if(request==='@/lib/board/recovery-session')return {BoardRecoverySession:TrackedSession};
 if(request==='@/lib/go/recovery-session')return {GoRecoverySession:TrackedGoSession};
 if(request==='@/lib/board/recovery-channel')return {BoardRecoveryChannel:ContextChannel};
 if(request==='@/lib/board/manual-connection')return {ManualBoardConnection:Connection};
 if(request==='./Board')return {__esModule:true,default:Board};
 if(request==='../go/GoBoard')return {__esModule:true,default:GoBoard};
 return load.call(this,request,...args);
};
const Remote=require('../components/board/RemoteGame.tsx').default;
function nodes(n){if(Array.isArray(n))return n.flatMap(nodes);return n&&typeof n==='object'?[n,...nodes(n.props?.children)]:[];}
function text(n){return Array.isArray(n)?n.map(text).join(''):n==null||typeof n==='boolean'?'':typeof n==='object'?text(n.props?.children):String(n);}
function render(r){runtime=r;r.cursor=0;return expandRoomKit(Remote(r.props));}
function findButton(r,label){const node=nodes(render(r)).find(n=>n.type==='button'&&text(n)===label);assert.ok(node,`Missing ${label}`);assert.ok(!node.props.disabled);return node;}
async function click(r,label){await findButton(r,label).props.onClick();await new Promise(resolve=>setImmediate(resolve));}
function fill(r,label,value){const parent=nodes(render(r)).find(n=>n.type==='label'&&text(n)===label);assert.ok(parent,`Missing label ${label}`);nodes(parent).find(n=>n.type==='textarea').props.onChange({target:{value}});}
(async()=>{
 const {default:create}=await import('../node_modules/ffish-es6/ffish.js');rules=await create({wasmBinary:fs.readFileSync(require.resolve('ffish-es6/ffish.wasm'))});
 for(const game of ['chess','xiangqi','shogi','go'])for(const locale of ['zh','en']){
  channels=[];journals=[];goJournals=[];const zh=locale==='zh',saveKey=`yifang:board:${game}:recovery:v1`,clients=[0,1].map(seat=>{const data=new Map([[saveKey,JSON.stringify({version:1,game,role:seat?'guest':'host',secret:'a'.repeat(64),checkpoint:'old-unstarted-fixture'})]]);return {props:{game,locale},slots:[],cursor:0,cleanup:[],store:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}};});const [h,g]=clients;
  try{
   const oldSaves=clients.map(c=>c.store.getItem(saveKey));
   for(const c of clients)render(c);await new Promise(resolve=>setImmediate(resolve));
   // Exercise the code-exchange fallback; the default is link mode.
   for(const c of clients)nodes(render(c)).find(n=>n.type==='select').props.onChange({target:{value:'manual'}});
   await click(h,zh?'生成邀请码':'Create invitation code');
   assert.equal(channels.length,0,'First click must preserve the old host save');
   await click(h,zh?'生成邀请码':'Create invitation code');
   assert.equal(channels.length,1);assert.equal(h.store.getItem(saveKey),oldSaves[0],'Unconnected host invitation must not replace the old save');
   fill(g,zh?'粘贴房主发来的邀请码':'Paste the host’s invitation code',signal(game,'offer'));
   await click(g,zh?'生成回复码':'Create reply code');assert.equal(channels.length,1);
   await click(g,zh?'生成回复码':'Create reply code');
   assert.equal(channels.length,2);for(const [i,c] of clients.entries())assert.equal(c.store.getItem(saveKey),oldSaves[i],'Before handshake, original host/guest saves remain intact');
   fill(h,zh?'粘贴朋友发回的回复码':'Paste your friend’s reply code',signal(game,'answer'));await click(h,zh?'使用回复码连接':'Connect with reply code');
   for(const [i,c] of clients.entries())assert.notEqual(c.store.getItem(saveKey),oldSaves[i],'A successful new handshake checkpoints the new match');
   if(game==='go'){
    assert.equal(journals.length,0,'Go uses its own rules, never the ffish recovery journal');
    assert.equal(goJournals.length,2);
    const savedGo=c=>GoRecoverySession.restore(JSON.parse(c.store.getItem('yifang:board:go:recovery:v1')).checkpoint);
    const sameGo=()=>{assert.equal(savedGo(h).checkpoint(),savedGo(g).checkpoint());for(const c of clients)assert.deepEqual(nodes(render(c)).find(n=>n.type===GoBoard).props.state,savedGo(c).view().board);};
    for(const [step,point] of [0,1,9,10].entries()){
     const board=nodes(render(clients[step%2])).find(n=>n.type===GoBoard);assert.ok(!board.props.disabled);board.props.onPoint(point);
     await new Promise(resolve=>setImmediate(resolve));
     assert.deepEqual(nodes(render(h)).find(n=>n.type===GoBoard).props.state,nodes(render(g)).find(n=>n.type===GoBoard).props.state);
     sameGo();
    }
    await click(h,zh?'停一手':'Pass');await click(g,zh?'停一手':'Pass');
    nodes(render(g)).find(n=>n.type===GoBoard).props.onPoint(0);await new Promise(resolve=>setImmediate(resolve));sameGo();
    assert.deepEqual(goJournals[0].view().review.dead,[0,9]);
    await click(h,zh?'我同意这份死子与计分提案':'I agree with this proposal');
    sameGo();assert.deepEqual(goJournals[0].view().review.approved,[true,false]);
    const partial=savedGo(h).view();
    for(const c of clients){runtime=c;for(const cleanup of c.cleanup)cleanup?.();c.slots=[];c.cleanup=[];}
    channels=[];
    for(const c of clients){render(c);await new Promise(resolve=>setImmediate(resolve));assert.ok(text(render(c)).includes(zh?'发现本标签页保存的上次对局':'This tab has a saved match'));}
    for(const c of clients)nodes(render(c)).find(n=>n.type==='select').props.onChange({target:{value:'manual'}});await click(h,zh?'恢复上次对局':'Restore previous match');await click(g,zh?'恢复上次对局':'Restore previous match');
    fill(g,zh?'粘贴房主发来的邀请码':'Paste the host’s invitation code',signal(game,'offer'));await click(g,zh?'生成回复码':'Create reply code');
    fill(h,zh?'粘贴朋友发回的回复码':'Paste your friend’s reply code',signal(game,'answer'));await click(h,zh?'使用回复码连接':'Connect with reply code');
    const deadline=Date.now()+5000;
    while(!clients.every(c=>text(render(c)).includes(zh?'已恢复原对局':'Original match restored'))&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,10));
    for(const c of clients){assert.ok(text(render(c)).includes(zh?'已恢复原对局':'Original match restored'));assert.deepEqual(savedGo(c).view(),partial);}
    sameGo();
    await click(g,zh?'我同意这份死子与计分提案':'I agree with this proposal');
    await click(h,zh?'同意再来一局':'Agree to a rematch');await click(g,zh?'同意再来一局':'Agree to a rematch');
    assert.ok(text(render(h)).includes(zh?'第 2 局':'Round 2'));assert.ok(text(render(g)).includes(zh?'第 2 局':'Round 2'));
    sameGo();assert.equal(savedGo(h).view().match.round,2);
    // Valid-looking state without a matching action must not forge a result.
    channels[0].send({v:5,epoch:channels[0].epoch,game,round:2,kind:'match-state',seq:0,match:{round:2,resigned:0,rematch:[false,false]}});
    await new Promise(resolve=>setImmediate(resolve));assert.ok(text(render(g)).includes(zh?'围棋认输或再开记录不一致':'Go resignation or rematch record mismatch'));
    continue;
   }
   assert.equal(journals.length,2);assert.equal(journals[0].checkpoint(),journals[1].checkpoint());
   assert.ok(text(render(h)).includes(zh?'轮到你了':'Your turn'));
   for(let step=0;step<8;step++){
    const client=clients[step%2],b=nodes(render(client)).find(n=>n.type===Board);assert.ok(b.props.movable);
    b.props.onMove(b.props.legalMoves[0]);await new Promise(resolve=>setImmediate(resolve));
    assert.equal(journals[0].checkpoint(),journals[1].checkpoint());
    for(const c of clients)assert.equal(nodes(render(c)).find(n=>n.type===Board).props.fen,journals[0].view().fen);
   }
   const resigning=zh?g:h;
   await click(resigning,zh?'认输':'Resign');await click(resigning,zh?'确认认输，结束本局':'Confirm resignation');
   assert.equal(journals[0].view().match.resigned,zh?1:0);assert.equal(journals[0].checkpoint(),journals[1].checkpoint());
   await click(h,zh?'同意再来一局':'Agree to a rematch');assert.equal(journals[0].view().match.round,1);
   await click(g,zh?'同意再来一局':'Agree to a rematch');assert.equal(journals[0].view().match.round,2);assert.equal(journals[0].checkpoint(),journals[1].checkpoint());
   const fresh=nodes(render(h)).find(n=>n.type===Board);fresh.props.onMove(fresh.props.legalMoves[0]);await new Promise(resolve=>setImmediate(resolve));
   assert.equal(journals[0].checkpoint(),journals[1].checkpoint());
   const restored=BoardRecoverySession.restore(rules,journals[1].checkpoint(),game);try{assert.deepEqual(restored.view(),journals[0].view());}finally{restored.dispose();}
   const original=journals[0].view(),oldEpoch=channels[0].epoch;
   for(const c of clients){runtime=c;for(const cleanup of c.cleanup)cleanup?.();c.slots=[];c.cleanup=[];}
   channels=[];journals=[];
   for(const c of clients){render(c);await new Promise(resolve=>setImmediate(resolve));assert.ok(text(render(c)).includes(zh?'发现本标签页保存的上次对局':'This tab has a saved match'));}
   for(const c of clients)nodes(render(c)).find(n=>n.type==='select').props.onChange({target:{value:'manual'}});await click(h,zh?'恢复上次对局':'Restore previous match');await click(g,zh?'恢复上次对局':'Restore previous match');
   fill(g,zh?'粘贴房主发来的邀请码':'Paste the host’s invitation code',signal(game,'offer'));await click(g,zh?'生成回复码':'Create reply code');
   fill(h,zh?'粘贴朋友发回的回复码':'Paste your friend’s reply code',signal(game,'answer'));await click(h,zh?'使用回复码连接':'Connect with reply code');
   const deadline=Date.now()+5000;
   while(!clients.every(c=>text(render(c)).includes(zh?'已恢复原对局':'Original match restored'))&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,10));
   for(const c of clients){assert.ok(text(render(c)).includes(zh?'已恢复原对局':'Original match restored'),text(render(c)));assert.equal(nodes(render(c)).find(n=>n.type===Board).props.fen,original.fen);}
   const next=nodes(render(g)).find(n=>n.type===Board);assert.ok(next.props.movable);next.props.onMove(next.props.legalMoves[0]);await new Promise(resolve=>setImmediate(resolve));
   assert.equal(nodes(render(h)).find(n=>n.type===Board).props.fen,nodes(render(g)).find(n=>n.type===Board).props.fen);
   assert.notEqual(channels[1].epoch,oldEpoch);
   // Old epochs cannot move the restored board; current-epoch state-only
   // attempts also cannot forge resignation without a journal event.
   channels[0].send({v:5,epoch:zh?oldEpoch:channels[1].epoch,game,round:2,kind:'match-state',seq:2,match:{round:2,resigned:0,rematch:[false,false]}});
   await new Promise(resolve=>setImmediate(resolve));assert.ok(text(render(g)).includes(zh?'收到旧连接的消息':'Resignation or rematch record mismatch'));
  }finally{for(const c of clients)for(const cleanup of c.cleanup)cleanup?.();}
 }
 console.log('PASS: 8 real RemoteGame bilingual handler flows: three WASM variants retain save/restore and stale-epoch rejection; Go journal-v1 records synchronized moves, passes, whole-group dead marking, partial approval, scoring/rematch and rejects forged state-only resignation. Hook/connection/Storage doubles with real WASM/WebCrypto, not native browser RTC.');
})().catch(e=>{console.error(e);process.exitCode=1;});
