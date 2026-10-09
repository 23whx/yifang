const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.tsx']=require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
const resolve=Module._resolveFilename;
Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.resolve(__dirname,'..',request.slice(2)):request,...args);};
const React=require('react'),load=Module._load;
let hooks=[],cursor=0,effects=[],attempts=0;
function slot(make){const i=cursor++;if(!(i in hooks))hooks[i]=make();return i;}
class FailedConnection{
 constructor(){attempts++;this.open=false;this.rtc={offer:async()=>{throw Error('negotiation failure');},answer:async()=>{throw Error('negotiation failure');}};}
 on(){}close(){}
}
Module._load=function(request,...args){
 if(request==='react')return {...React,useState(initial){const i=slot(()=>typeof initial==='function'?initial():initial);return [hooks[i],v=>{hooks[i]=typeof v==='function'?v(hooks[i]):v;}];},useRef(initial){return hooks[slot(()=>({current:initial}))];},useEffect(effect){slot(()=>{effects.push(effect);return true;});},useSyncExternalStore(_subscribe,_snapshot,server){return server();}};
 if(request==='@/lib/board/ffish')return {loadFfish:async()=>{attempts++;throw Error('rules load failure');}};
 if(request==='@/lib/board/manual-connection')return {ManualBoardConnection:FailedConnection};
 if(request==='./Board'||request==='../go/GoBoard')return {__esModule:true,default:()=>null};
 return load.call(this,request,...args);
};
const Remote=require('../components/board/RemoteGame.tsx').default;
function text(n){return Array.isArray(n)?n.map(text).join(''):n==null||typeof n==='boolean'?'':typeof n==='object'?text(n.props?.children):String(n);}
function nodes(n){if(Array.isArray(n))return n.flatMap(nodes);return n&&typeof n==='object'?[n,...nodes(n.props?.children)]:[];}
function button(tree,label){const n=nodes(tree).find(n=>n.type==='button'&&text(n)===label);assert.ok(n,`Missing ${label}`);assert.ok(!n.props.disabled);return n;}
(async()=>{
 let cases=0;
 for(const game of ['chess','xiangqi','shogi','go'])for(const locale of ['zh','en'])for(const mode of ['host-save','guest-save','malformed','read-denied'])for(const guest of [false,true]){
  hooks=[];effects=[];attempts=0;
  const key=`yifang:board:${game}:recovery:v1`,old=mode==='malformed'?'{damaged':JSON.stringify({version:1,game,role:mode==='guest-save'?'guest':'host',secret:'a'.repeat(64),checkpoint:'original-checkpoint'});
  const data=new Map([[key,old],['unrelated','keep']]);let removals=0,writes=0;
  global.sessionStorage={getItem(k){if(mode==='read-denied')throw Error('blocked');return data.get(k)??null;},setItem(k,v){writes++;data.set(k,v);},removeItem(k){removals++;data.delete(k);}};
  function render(){cursor=0;return Remote({game,locale});}
  render();effects.splice(0).forEach(fn=>fn());await Promise.resolve();await Promise.resolve();let tree=render();
  const zh=locale==='zh',label=guest?(zh?'我是朋友：生成应答':'Guest: generate answer'):(zh?'我是房主：生成邀请':'Host: generate invitation');
  function fill(id){const parent=nodes(render()).find(n=>n.type==='label'&&text(n)===(zh?'朋友：粘贴房主邀请':'Guest: paste host invitation'));assert.ok(parent);nodes(parent).find(n=>n.type==='textarea').props.onChange({target:{value:JSON.stringify({v:1,game,id:id.repeat(24),type:'offer',sdp:'v=0\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\n'})}});}
  if(mode==='guest-save'&&guest){
   await button(tree,zh?'恢复本标签页对局':'Restore this tab’s match').props.onClick();tree=render();
   assert.ok(text(tree).includes(zh?'恢复模式：':'Recovery mode:'));
   for(const value of ['public','manual']){nodes(tree).find(n=>n.type==='select').props.onChange({target:{value}});tree=render();}
   assert.ok(!text(tree).includes(zh?'恢复模式：':'Recovery mode:'),'Changing mode must cancel the selected old guest recovery');
   assert.equal(data.get(key),old,'Cancelling recovery selection must retain the actual save');
  }
  if(guest){fill('a');tree=render();}
  await button(tree,label).props.onClick();tree=render();assert.equal(attempts,0,'First click only confirms replacement');
  assert.equal(data.get(key),old);assert.equal(removals,0);assert.equal(writes,0);
  assert.ok(text(tree).includes(zh?'旧存档会保留':'old save stays'));
  for(const value of ['public','manual']){nodes(tree).find(n=>n.type==='select').props.onChange({target:{value}});tree=render();}
  assert.ok(!text(tree).includes(zh?'再次点击同一个创建':'Click the same host/join button'),'Changing connection mode clears old confirmation');
  if(guest)fill('a');tree=render();
  await button(tree,label).props.onClick();tree=render();assert.equal(attempts,0,'Returning to manual mode requires a fresh confirmation');
  if(guest){fill('b');tree=render();await button(tree,label).props.onClick();tree=render();assert.equal(attempts,0,'Changed invitation requires a fresh confirmation');}
  await button(tree,label).props.onClick();tree=render();
  assert.equal(attempts,1,'Only an explicitly confirmed new connection may start');
  assert.equal(data.get(key),old,'Rule-loading/negotiation failure must preserve original bytes');
  assert.equal(removals,0,'Preparing a new room must not delete the old save');assert.equal(writes,0);
  assert.equal(data.get('unrelated'),'keep');assert.ok(text(tree).includes(zh?'无法加载规则或连接服务':'Could not load the rules or connection service'));
  const leave=nodes(tree).find(n=>n.type==='button'&&text(n)===(zh?'离开并清除连接码':'Leave and clear connection text'));
  assert.ok(leave);leave.props.onClick();tree=render();assert.equal(data.get(key),old);
  if(mode==='host-save'||mode==='guest-save')button(tree,zh?'恢复本标签页对局':'Restore this tab’s match');
  cases++;
 }
 console.log(`PASS: ${cases} four-game bilingual new-room handler cases: host/guest or unreadable saves require confirmation, changed invitations/modes reset it, mode changes cancel old recovery selection, failed rule-load/negotiation and leaving preserve original bytes. Hooks, Storage and failed engine/transport doubles, not native browser evidence.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
