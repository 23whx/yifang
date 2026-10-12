// Friend play must explain *why* it cannot start: an insecure origin and a browser
// without WebRTC (chat-app webviews, privacy modes) need different advice.
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const ctx=require('../lib/network-context.ts');
const saved=globalThis.RTCPeerConnection;
try{
 delete globalThis.window;assert.equal(ctx.secureMultiplayerContext(),true,'Node test runners are not blocked');
 globalThis.window={isSecureContext:true};globalThis.RTCPeerConnection=function(){};
 assert.equal(ctx.secureMultiplayerContext(),true,'secure HTTPS page with WebRTC can play');
 delete globalThis.RTCPeerConnection;
 assert.equal(ctx.secureMultiplayerContext(),false,'missing WebRTC blocks friend play');
 for(const locale of ['zh','en']){const text=ctx.insecureMultiplayerMessage(locale);assert.ok(text.includes('WebRTC'),'names the missing capability');assert.ok(!text.includes(locale==='zh'?'安全上下文':'secure context'),'does not blame HTTPS');}
 globalThis.window={isSecureContext:false};
 for(const locale of ['zh','en'])assert.ok(ctx.insecureMultiplayerMessage(locale).includes(locale==='zh'?'有效 HTTPS':'valid HTTPS'),'insecure origin still explains HTTPS');
}finally{delete globalThis.window;if(saved)globalThis.RTCPeerConnection=saved;}
console.log('PASS: friend play checks both a secure context and WebRTC support, with distinct bilingual guidance for each failure.');
