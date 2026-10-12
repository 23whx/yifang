const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.tsx']=require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
const resolve=Module._resolveFilename;
Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.resolve(__dirname,'..',request.slice(2)):request,...args);};
const React=require('react'),{renderToStaticMarkup:render}=require('react-dom/server');
const Remote=require('../components/board/RemoteGame.tsx').default;
const {siteInfo}=require('../content/site-info.ts');
const source=fs.readFileSync(path.resolve(__dirname,'../components/board/RemoteGame.tsx'),'utf8');
const peerBundle=fs.readFileSync(require.resolve('peerjs'),'utf8');
for(const endpoint of ['0.peerjs.com'])assert.ok(peerBundle.includes(endpoint),`PeerJS default endpoint changed: ${endpoint}; review quick-room disclosure`);
for(const phrase of ['第三方 STUN','TURN 中继','third-party STUN','through TURN'])assert.ok(source.includes(phrase),`Public room disclosure missing: ${phrase}`);
for(const game of ['chess','xiangqi','shogi','go'])for(const locale of ['zh','en']){
 const html=render(React.createElement(Remote,{game,locale}));
 assert.ok(html.includes(locale==='zh'?'当前为邀请链接方式':'Link mode:'),'Default is the invitation-link mode');
 assert.ok(html.includes(locale==='zh'?'PeerJS 公共服务':'PeerJS public service'),'Default mode discloses the public service');
 assert.ok(source.includes(locale==='zh'?'不要关闭防火墙':'Do not disable the firewall'),'Fallback keeps firewall advice');
 assert.ok(!html.includes(locale==='zh'?'当前为邀请码方式':'Code mode:'));
 assert.ok(html.includes(locale==='zh'?'邀请码 + 回复码 · 不经过任何服务':'Invitation + reply codes · no service involved'),'Service-free fallback stays selectable');
 assert.ok(html.includes(locale==='zh'?'有效 HTTPS':'valid HTTPS'),'Cross-device manual entry must disclose HTTPS requirement');
}
for(const name of ['McrRemote','RiichiRemote','SichuanRemote','MultiPokerRemote','HoldemRemote']){
 const source=fs.readFileSync(path.resolve(__dirname,`../components/cards/${name}.tsx`),'utf8');
 assert.ok(source.includes('有效 HTTPS')&&source.includes('valid HTTPS'),`${name} must explain secure cross-device access in both languages`);
 assert.ok(source.includes('局域网IP')&&source.includes('LAN IP'),`${name} must distinguish LAN HTTP from secure localhost`);
 assert.ok(source.includes('secureMultiplayerContext()'),`${name} must check origin before constructing a room`);
}
assert.ok(source.includes('secureMultiplayerContext()'),'Board room must check origin before replacing a save');
for(const locale of ['zh','en']){
 const prose=siteInfo[locale].privacy.sections.find(section=>section.title===(locale==='zh'?'好友连接会传递什么':'What friend connections exchange')).paragraphs.join(' ');
 assert.ok(prose.includes(locale==='zh'?'有效 HTTPS':'valid HTTPS'),'Privacy page must disclose cross-device secure access');
 assert.ok(prose.includes(locale==='zh'?'局域网IP':'LAN IP'),'Privacy page must distinguish plain LAN HTTP');
 assert.ok(prose.includes(locale==='zh'?'拒绝创建或加入':'cannot create or join'),'Privacy page must disclose insecure-origin refusal');
}
console.log('PASS: eight initial board/Go localized renders identify the link default, its public-service disclosure and the service-free code fallback; quick-room copy covers packaged PeerJS signaling/STUN/TURN defaults. Mode switching/native connections not tested.');
