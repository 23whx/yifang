const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),assert=require('node:assert/strict');
const {expandRoomKit}=require('./lib/room-kit-tree.cjs');
require.extensions['.tsx']=require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
const resolve=Module._resolveFilename;
Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.resolve(__dirname,'..',request.slice(2)):request,...args);};
const React=require('react'),load=Module._load;
let hooks=[],cursor=0,effects=[],constructed=0;
function slot(make){const i=cursor++;if(!(i in hooks))hooks[i]=make();return i;}
class Transport{
 constructor(){constructed++;this.room={status:'lobby'};}
 async offer(){return 'test-invitation';}
 async answer(){return 'test-response';}
 close(){}
}
const adapters={
 '@/lib/holdem-headsup-manual':{ManualHeadsUpPokerHost:Transport,ManualHeadsUpPokerGuest:Transport},
 '@/lib/holdem-multi-manual':{ManualPokerHost:Transport,ManualPokerGuest:Transport},
 '@/lib/mahjong/mcr-manual':{ManualMcrHost:Transport,ManualMcrGuest:Transport},
 '@/lib/mahjong/sichuan-manual':{ManualSichuanHost:Transport,ManualSichuanGuest:Transport},
 '@/lib/mahjong/riichi-manual':{ManualRiichiHost:Transport,ManualRiichiGuest:Transport},
};
Module._load=function(request,...args){
 if(request==='react')return {...React,
  useState(initial){const i=slot(()=>typeof initial==='function'?initial():initial);return [hooks[i],v=>{hooks[i]=typeof v==='function'?v(hooks[i]):v;}];},
  useRef(initial){return hooks[slot(()=>({current:initial}))];},
  useEffect(effect){slot(()=>{effects.push(effect);return true;});},
  useMemo(make){return make();},useSyncExternalStore(){slot(()=>true);return '';},
 };
 if(adapters[request])return adapters[request];
 // Code-mode fallback under test; link mode is covered by the browser duel scripts.
 if(request==='@/components/remote/useFourSeatLink')return {useFourSeatLink:()=>({mode:'code',setMode(){},code:'',note:'',setNote(){},entry:'',setEntry(){},invited:'',canJoin:false,hasStoredRoom:()=>false,forgetRoom(){},visitors:[],lounge:null,reconnect:'',reconnectSince:null,setReconnect(){},admit(){},deny(){},kick(){},async host(){},async join(){},stop(){},leave(){}})};
 if(['./McrPractice','./SichuanPractice','./RiichiPractice','./MultiPokerTable'].includes(request))return {__esModule:true,default:()=>null};
 if(request==='@/lib/mahjong/mcr-match')return {mcrRemotePhase:()=> 'playing'};
 return load.call(this,request,...args);
};
const configs=[
 ['HoldemRemote','holdem-two','yifang:holdem-two:recovery:v1',true],
 ['MultiPokerRemote','holdem-four','yifang:holdem-four:recovery:v1',false],
 ['McrRemote','mcr-four','yifang:mcr-four:recovery:v1',false],
 ['SichuanRemote','sichuan-four','yifang:sichuan:recovery:v1',false],
 ['RiichiRemote','riichi','yifang:riichi-four:recovery:v1',false],
];
function text(node){if(node==null||typeof node==='boolean')return '';if(typeof node!=='object')return String(node);return Array.isArray(node)?node.map(text).join(''):text(node.props?.children);}
function nodes(node){if(!node||typeof node!=='object')return [];if(Array.isArray(node))return node.flatMap(nodes);return [node,...nodes(node.props?.children)];}
function button(tree,label){const n=nodes(tree).find(n=>n.type==='button'&&text(n)===label);assert.ok(n,`Missing ${label}`);assert.ok(!n.props.disabled,`Disabled ${label}`);return n;}
async function flush(){await Promise.resolve();await Promise.resolve();}
(async()=>{
 let cases=0;
 for(const [file,game,key,headsup] of configs){
  const Remote=require(`../components/cards/${file}.tsx`).default;
  function render(locale){cursor=0;return expandRoomKit(Remote({locale}));}
  async function mount(locale,mode){
   hooks=[];effects=[];constructed=0;
   const data=new Map([[key,'{damaged'],['unrelated','keep']]);
   global.sessionStorage={
    getItem(k){if(mode==='read-denied'||mode==='clear-unverifiable')throw Error('blocked');return data.get(k)??null;},
    setItem(k,v){data.set(k,v);},
    removeItem(k){if(mode==='remove-denied')throw Error('blocked');if(mode!=='remove-silent')data.delete(k);},
   };
   render(locale);effects.splice(0).forEach(fn=>fn());await flush();
   // Heads-up keeps its own link/code state: exercise the code fallback here.
   if(headsup){nodes(render(locale)).find(n=>n.type==='select').props.onChange({target:{value:'code'}});}
   return data;
  }
  for(const locale of ['zh','en']){
   const zh=locale==='zh',clear=zh?'删除这个存档':'Delete this save';
   const confirm=headsup?(zh?'确认删除存档（无法撤销）':'Confirm delete (cannot be undone)'):(zh?'确认删除存档（无法撤销）':'Confirm delete (cannot be undone)');
   // An unreadable save is unknown, not evidence that there was no old match.
   for(const mode of ['malformed','read-denied'])for(const guest of [false,true]){
    const data=await mount(locale,mode);let tree=render(locale);
    assert.ok(nodes(tree).some(n=>n.props?.role==='alert'),'Storage failure is visible');
    assert.ok(!nodes(tree).some(n=>n.type==='button'&&text(n).includes(zh?'恢复本标签页':'Restore this tab')),'Do not offer restoration of an unparsed checkpoint');
    button(tree,clear);
    if(guest){
     const label=headsup?(zh?'粘贴房主发来的邀请码':'Paste the host’s invitation code'):(zh?'房主邀请':'Host invitation');
     const field=headsup?nodes(nodes(tree).find(n=>n.type==='label'&&text(n)===label)).find(n=>n.type==='textarea'):nodes(tree).find(n=>n.type==='textarea'&&n.props['aria-label']===label);assert.ok(field,`${file} invitation field`);
     const value=JSON.stringify({v:1,game,id:'a'.repeat(24),type:'offer',sdp:'v=0\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\n'});
     field.props.onChange({target:{value}});tree=render(locale);
    }
    const label=headsup?(guest?(zh?'生成回复码':'Create reply code'):(zh?'生成邀请码':'Create invitation code')):guest?(zh?'生成回复码':'Create reply code'):(zh?'创建四人房间':'Create four-player room');
    await button(tree,label).props.onClick();await flush();tree=render(locale);
    assert.equal(constructed,0,`${file}: first click must not replace unreadable save`);
    assert.equal(data.get(key),'{damaged');
    assert.ok(text(tree).includes(zh?'旧存档会保留':'old save stays'));
    if(guest){
     const field=headsup?nodes(nodes(tree).find(n=>n.type==='label'&&text(n)===(zh?'粘贴房主发来的邀请码':'Paste the host’s invitation code'))).find(n=>n.type==='textarea'):nodes(tree).find(n=>n.type==='textarea'&&n.props['aria-label']===(zh?'房主邀请':'Host invitation'));
     const replacement={...JSON.parse(field.props.value),id:'b'.repeat(24)};
     field.props.onChange({target:{value:JSON.stringify(replacement)}});tree=render(locale);
     await button(tree,label).props.onClick();await flush();tree=render(locale);
     assert.equal(constructed,0,'Changing the invitation must invalidate prior new-room confirmation');
     assert.equal(data.get(key),'{damaged');
    }
    const confirmationLabel=guest?(zh?'确认加入新房':'Confirm joining new room'):(zh?'确认创建新房':'Confirm new room');
    await button(tree,confirmationLabel).props.onClick();await flush();
    assert.equal(constructed,1,`${file}: explicit second click may prepare a new room`);
    assert.equal(data.get(key),'{damaged','Preparing connection must not overwrite unknown old data');
    assert.equal(data.get('unrelated'),'keep');cases++;
   }
   for(const mode of ['malformed','remove-denied','remove-silent','clear-unverifiable']){
    const data=await mount(locale,mode);let tree=render(locale);
    button(tree,clear).props.onClick();tree=render(locale);
    assert.equal(data.get(key),'{damaged','First click only arms removal');
    if(headsup){button(tree,zh?'取消删除':'Keep the save').props.onClick();tree=render(locale);button(tree,clear).props.onClick();tree=render(locale);}
    button(tree,confirm).props.onClick();tree=render(locale);
    assert.equal(data.get('unrelated'),'keep','Clear must be scoped to the game save');
    if(mode==='malformed'){
     assert.equal(data.has(key),false);
     assert.ok(!nodes(tree).some(n=>n.props?.role==='alert'),'Successful scoped clear removes storage warning');
     assert.ok(!nodes(tree).some(n=>n.type==='button'&&text(n)===confirm));
    }else{
     assert.ok(nodes(tree).some(n=>n.props?.role==='alert'),'Unconfirmed clear still shows a warning');
     button(tree,confirm);
     if(mode!=='clear-unverifiable')assert.equal(data.get(key),'{damaged');
     else assert.equal(data.has(key),false,'Removal can succeed while verification is blocked: do not claim retention');
    }
    cases++;
   }
   if(headsup){
    const data=await mount(locale,'malformed');
    nodes(render(locale)).find(n=>n.type==='select').props.onChange({target:{value:'link'}});let tree=render(locale);
    const field=()=>nodes(tree).find(n=>n.type==='input'&&n.props.placeholder==='https://…?room=…');
    field().props.onChange({target:{value:'yf-holdem-aaaaaaaaaaaa'}});tree=render(locale);
    await button(tree,zh?'加入房间':'Join room').props.onClick();tree=render(locale);
    assert.ok(nodes(tree).some(n=>n.props?.role==='alert'&&text(n).includes(zh?'旧存档会保留':'old save stays')));
    field().props.onChange({target:{value:'yf-holdem-bbbbbbbbbbbb'}});tree=render(locale);
    await button(tree,zh?'加入房间':'Join room').props.onClick();tree=render(locale);
    assert.ok(nodes(tree).some(n=>n.props?.role==='alert'&&text(n).includes(zh?'旧存档会保留':'old save stays')),'Changed quick room must request confirmation, not initiate PeerJS');
    assert.equal(data.get(key),'{damaged');assert.equal(constructed,0);
    cases++;
   }
  }
 }
 console.log(`PASS: ${cases} five-table bilingual unreadable-save UI cases: unknown checkpoint protection, changed invitation/quick-room confirmation reset, no premature overwrite or invalid restore, two-click scoped clear, cancellation, denied/silent/unverifiable removal. Actual handlers with hook, transport and Storage doubles; not browser UI/storage evidence.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
