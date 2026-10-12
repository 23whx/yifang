// Link rooms: room codes, buffered delivery, guest retry while the host is away,
// host re-registration after a dropped signaling socket, and JSON framing.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
const resolve=Module._resolveFilename;
Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.resolve(__dirname,'..',request.slice(2)):request,...args);};
class Events{constructor(){this.l=new Map();}on(e,f){this.l.set(e,[...(this.l.get(e)||[]),f]);return this;}emit(e,...a){for(const f of this.l.get(e)||[])f(...a);}}
const peers=new Map(),connects=[];let silent=false;
class Conn extends Events{constructor(options){super();this.open=false;this.metadata=options?.metadata;this.options=options;}send(v){this.sent=(this.sent||[]).concat([v]);}close(){if(this.closed)return;this.closed=true;this.open=false;this.emit('close');}}
class Peer extends Events{
 constructor(id){super();this.id=id||'guest-'+Math.random().toString(16).slice(2);this.disconnected=false;this.destroyed=false;this.reconnects=0;peers.set(this.id,this);if(!silent)queueMicrotask(()=>{this.open=true;this.emit('open',this.id);});}
 connect(id,options){const c=new Conn(options);connects.push({id,options});const host=peers.get(id);
  queueMicrotask(()=>{if(!host||host.disconnected||host.destroyed){this.emit('error',{type:'peer-unavailable'});return;}const remote=new Conn(options);host.emit('connection',remote);c.open=remote.open=true;c.emit('open');remote.emit('open');});return c;}
 reconnect(){this.reconnects++;this.disconnected=false;peers.set(this.id,this);queueMicrotask(()=>this.emit('open',this.id));}
 drop(){this.disconnected=true;peers.delete(this.id);this.emit('disconnected',this.id);}
 destroy(){this.destroyed=true;peers.delete(this.id);}
}
const load=Module._load;
Module._load=function(request,...args){if(request==='peerjs')return {Peer};return load.call(this,request,...args);};
globalThis.RTCPeerConnection=function(){};
const room=require('../lib/peer-room.ts');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 // Codes and links
 const code=room.newRoomCode('riichi');assert.match(code,/^yf-riichi-[a-f0-9]{12}$/);
 assert.equal(room.readRoomCode(code,'riichi'),code);
 assert.equal(room.readRoomCode(`https://example.com/zh/mahjong/remote/?room=${code}`,'riichi'),code);
 assert.equal(room.readRoomCode(code,'mcr-four'),'','A room code only opens its own game');
 assert.equal(room.readRoomCode('https://example.com/?room=yf-riichi-XYZ','riichi'),'');
 assert.equal(room.readRoomCode('x'.repeat(5000),'riichi'),'');

 // Buffered delivery waits for a microtask so a wrapper's owner can attach its handler.
 {const c=new Conn();const b=room.buffered(c);c.emit('data',{n:1});const got=[];let late=null;
  b.on('data',v=>{got.push(['first',v]);if(late)late(v);});late=v=>got.push(['late',v]);
  const second=[];b.on('data',v=>second.push(v));
  await Promise.resolve();await Promise.resolve();
  assert.deepEqual(got,[['first',{n:1}],['late',{n:1}]],'Queued data reaches a handler set right after subscribing');
  assert.deepEqual(second,[{n:1}],'Every subscriber sees queued data');
  c.emit('data',{n:2});await Promise.resolve();assert.equal(second.length,2,'Live data keeps flowing in order');}

 // Guest retries while the host is away, then joins once the host registers.
 {const target=room.newRoomCode('chess');const waits=[];let opened=null,failed=null;
  const guest=await room.joinPeerRoom(target,{seat:2},{onOpen:c=>{opened=c;},onWaiting:()=>waits.push(1),onFailure:r=>{failed=r;}});
  await wait(50);assert.ok(waits.length>=1,'Guest reports waiting while the host is missing');assert.equal(opened,null);
  let hostConn=null;const host=await room.hostPeerRoom(target,{onConnection:(c,meta)=>{hostConn={c,meta};},onFailure:r=>{throw Error('host failure '+r);}});
  await wait(room.JOIN_RETRY_MS+200);
  assert.ok(opened,'Guest joins after the host appears');assert.equal(failed,null);
  assert.deepEqual(hostConn.meta,{seat:2},'Recovery seat travels with the connection');
  assert.ok(connects.every(c=>c.options.serialization==='json'),'JSON framing keeps undefined fields absent');
  guest.destroy();host.destroy();}

 // Host re-registers the same room id after the signaling socket drops.
 {const target=room.newRoomCode('go');let reconnecting=0;
  const host=await room.hostPeerRoom(target,{onReconnecting:()=>reconnecting++,onFailure:r=>{throw Error('host failure '+r);}});
  await wait(10);const peer=peers.get(target);assert.ok(peer);
  peer.drop();assert.equal(reconnecting,1);await wait(1200);
  assert.equal(peer.reconnects,1,'Dropped host reconnects with the same id');assert.ok(peers.has(target));
  // Socket-level errors are retried, not reported as a failed room.
  peer.emit('error',{type:'socket-closed'});peer.emit('error',{type:'network'});
  host.destroy();assert.ok(peer.destroyed);}

 // A taken room id is reported, not retried forever.
 {let reason='';const target=room.newRoomCode('xiangqi');const h=await room.hostPeerRoom(target,{onFailure:r=>{reason=r;}});
  peers.get(target).emit('error',{type:'unavailable-id'});assert.equal(reason,'room-taken');h.destroy();}

 // An unreachable room service fails visibly instead of waiting forever.
 {silent=true;const reasons=[];let services=0;
  const g=await room.joinPeerRoom(room.newRoomCode('shogi'),{},{onOpen(){},onService:()=>services++,onFailure:r=>reasons.push('guest '+r)});
  const h=await room.hostPeerRoom(room.newRoomCode('shogi'),{onFailure:r=>reasons.push('host '+r)});
  await wait(room.SERVICE_LIMIT_MS+300);silent=false;
  assert.deepEqual(reasons.sort(),['guest service','host service']);assert.equal(services,0);g.destroy();h.destroy();}
 for(const reason of ['service','room-taken','host-gone','network','browser'])for(const zh of [true,false])assert.ok(room.peerFailureMessage(reason,zh).length>10);
 console.log('PASS: link rooms parse codes per game, buffer data until handlers attach, retry while the host is away, carry the recovery seat, use JSON framing, re-register a dropped host under the same id, and report an unreachable room service instead of waiting forever.');
})().catch(e=>{console.error(e);process.exit(1);});
