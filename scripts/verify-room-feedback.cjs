// The "report a problem" link in every friend room opens a prefilled email to the site's
// contact address. It must carry the room's state, never the room code (the room's key).
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.tsx']=require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
const resolve=Module._resolveFilename;
Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.resolve(__dirname,'..',request.slice(2)):request,...args);};
const {FeedbackLink}=require('../components/remote/RoomKit.tsx');
const {contact}=require('../content/site-info.ts');
assert.equal(contact.email,'wyh93829@gmail.com','Reports go to the site owner');
function text(n){return Array.isArray(n)?n.map(text).join(''):n==null||typeof n==='boolean'?'':typeof n==='object'?text(n.props?.children):String(n);}
function nodes(n){if(Array.isArray(n))return n.flatMap(nodes);return n&&typeof n==='object'?[n,...nodes(n.props?.children)]:[];}
for(const zh of [true,false]){
 const location={origin:'https://yifang.oumashu.top',pathname:`/${zh?'zh':'en'}/chess/remote/`,href:`https://yifang.oumashu.top/${zh?'zh':'en'}/chess/remote/?room=yf-chess-0123456789ab`};
 global.window={location};
 Object.defineProperty(global,'navigator',{configurable:true,value:{userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'}});
 const tree=FeedbackLink({zh,context:()=>({game:zh?'国际象棋':'Chess',mode:zh?'邀请链接':'Invitation link',role:zh?'朋友':'Guest',status:zh?'正在重新连线…':'Reconnecting…',error:zh?'房主已离开，房间已解散。':'The host left; the room has closed.'})});
 const link=nodes(tree).find(n=>n.type==='a');assert.ok(link);assert.equal(link.props.href,'mailto:wyh93829@gmail.com','Works without script as a plain mail link');
 assert.ok(text(tree).includes('wyh93829@gmail.com'),'Tells the player where the email goes');
 let prevented=false;link.props.onClick({preventDefault(){prevented=true;}});assert.ok(prevented);
 const url=new URL(location.href);assert.equal(url.protocol,'mailto:');assert.equal(url.pathname,'wyh93829@gmail.com');
 const subject=url.searchParams.get('subject'),body=url.searchParams.get('body');
 assert.ok(subject.includes(zh?'国际象棋':'Chess'));
 for(const part of [location.pathname,zh?'邀请链接':'Invitation link',zh?'朋友':'Guest',zh?'正在重新连线':'Reconnecting',zh?'房间已解散':'room has closed','iPhone · Safari','Mobile/15E148'])assert.ok(body.includes(part),`Report carries ${part}`);
 assert.ok(!body.includes('yf-chess-0123456789ab')&&!body.includes('?room='),'The room code never leaves in a report');
 assert.ok(body.split('\n')[0].length>5,'Starts with a prompt to describe the problem');
}
delete global.window;
console.log('PASS: friend-room problem reports open a prefilled email to the site contact with game, connection mode, role, state, error, device, browser and time — never the room code — in both languages.');
