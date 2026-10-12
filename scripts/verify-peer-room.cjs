// Link rooms: room codes, buffered delivery, the knock/admit/deny door, guest retry while the
// host is away, early warning for a missing room, host re-registration, and JSON framing.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
const resolve=Module._resolveFilename;
Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.resolve(__dirname,'..',request.slice(2)):request,...args);};
class Events{constructor(){this.l=new Map();}on(e,f){this.l.set(e,[...(this.l.get(e)||[]),f]);return this;}emit(e,...a){for(const f of this.l.get(e)||[])f(...a);}}
const peers=new Map(),connects=[];let silent=false;
class Conn extends Events{
 constructor(options){super();this.open=false;this.metadata=options?.metadata;this.options=options;this.connectionId='dc_'+Math.random().toString(16).slice(2);}
 send(v){if(!this.open)return;const copy=structuredClone(v);queueMicrotask(()=>{if(this.other?.open)this.other.emit('data',copy);});}
 close(){if(this.closed)return;this.closed=true;this.open=false;this.emit('close');this.other?.close();}
}
class Peer extends Events{
 constructor(id){super();this.id=typeof id==='string'?id:'guest-'+Math.random().toString(16).slice(2);this.disconnected=false;this.destroyed=false;this.reconnects=0;peers.set(this.id,this);if(!silent)queueMicrotask(()=>{this.open=true;this.emit('open',this.id);});}
 connect(id,options){const c=new Conn(options);connects.push({id,options});const host=peers.get(id);
  queueMicrotask(()=>{if(!host||host.disconnected||host.destroyed){this.emit('error',{type:'peer-unavailable'});return;}
   const remote=new Conn(options);remote.connectionId=c.connectionId;c.other=remote;remote.other=c;host.emit('connection',remote);
   queueMicrotask(()=>{c.open=remote.open=true;remote.emit('open');c.emit('open');});});return c;}
 reconnect(){this.reconnects++;this.disconnected=false;peers.set(this.id,this);queueMicrotask(()=>{this.open=true;this.emit('open',this.id);});}
 drop(){this.disconnected=true;peers.delete(this.id);this.emit('disconnected',this.id);}
 destroy(){this.destroyed=true;peers.delete(this.id);}
}
const load=Module._load;
Module._load=function(request,...args){if(request==='peerjs')return {Peer};return load.call(this,request,...args);};
globalThis.RTCPeerConnection=function(){};
const room=require('../lib/peer-room.ts');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 // Codes, links and device labels
 const code=room.newRoomCode('riichi');assert.match(code,/^yf-riichi-[a-f0-9]{12}$/);
 assert.equal(room.readRoomCode(code,'riichi'),code);
 assert.equal(room.readRoomCode(`https://example.com/zh/mahjong/remote/?room=${code}`,'riichi'),code);
 assert.equal(room.readRoomCode(code,'mcr-four'),'','A room code only opens its own game');
 assert.equal(room.readRoomCode('https://example.com/?room=yf-riichi-XYZ','riichi'),'');
 assert.equal(room.readRoomCode('x'.repeat(5000),'riichi'),'');
 assert.equal(room.deviceLabel('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'),'iPhone · Safari');
 assert.equal(room.deviceLabel('Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Mobile/15E148 QQ/9.0.0'),'iPhone · QQ');
 assert.equal(room.deviceLabel('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36 Edg/130.0'),'Windows · Edge');

 // Buffered delivery waits for a microtask so a wrapper's owner can attach its handler.
 {const c=new Conn();const b=room.buffered(c);c.emit('data',{n:1});const got=[];let late=null;
  b.on('data',v=>{got.push(['first',v]);if(late)late(v);});late=v=>got.push(['late',v]);
  const second=[];b.on('data',v=>second.push(v));
  await Promise.resolve();await Promise.resolve();
  assert.deepEqual(got,[['first',{n:1}],['late',{n:1}]],'Queued data reaches a handler set right after subscribing');
  assert.deepEqual(second,[{n:1}],'Every subscriber sees queued data');
  c.emit('data',{n:2});await Promise.resolve();assert.equal(second.length,2,'Live data keeps flowing in order');}

 // The door: the host sees name and device, declines one, admits another; a full room turns people away.
 {const target=room.newRoomCode('chess');const lists=[],admitted=[];
  const host=await room.hostPeerRoom(target,{onVisitors:l=>lists.push(l),onConnection:(c,meta,v)=>admitted.push({c,meta,v}),onFailure:r=>{throw Error('host failure '+r);},policy:v=>v.resume?'admit':admitted.length?'full':'ask'});
  await wait(5);
  const outcome=name=>new Promise(done=>{let knocking=false;room.joinPeerRoom(target,{},{onKnocking:()=>{knocking=true;},onOpen:c=>done({open:c,knocking}),onFailure:r=>done({failed:r,knocking})},{name});});
  const first=outcome('陌生人\u0007');await wait(30);
  const asking=lists.at(-1);assert.equal(asking.length,1);assert.equal(asking[0].state,'knocking');assert.equal(asking[0].name,'陌生人','Control characters are stripped');
  assert.equal(admitted.length,0,'Nobody reaches the game before the host decides');
  host.deny(asking[0].id);const r1=await first;assert.equal(r1.failed,'denied');assert.ok(r1.knocking);
  const second=outcome('小明');await wait(30);const knock=lists.at(-1)[0];assert.equal(knock.name,'小明');
  host.admit(knock.id);const r2=await second;assert.ok(r2.open,'Admitted guest gets the game channel');assert.equal(admitted.length,1);
  // Game data after admission flows both ways; door messages never reach the game.
  const seen=[];admitted[0].c.on('data',v=>seen.push(v));r2.open.send({kind:'hello'});await wait(10);assert.deepEqual(seen,[{kind:'hello'}]);
  const r3=await outcome('迟到的人');assert.equal(r3.failed,'full','A full room turns newcomers away without asking');
  // A returning player is admitted by policy, carrying the resume claim and seat.
  const back=await new Promise(done=>room.joinPeerRoom(target,{seat:2},{onOpen:c=>done(c),onFailure:r=>done(r)},{resume:true}));
  assert.equal(typeof back,'object');assert.equal(admitted.at(-1).v.resume,true);assert.deepEqual(admitted.at(-1).meta,{seat:2,resume:true});
  assert.ok(connects.every(c=>c.options.serialization==='json'),'JSON framing keeps undefined fields absent');
  host.destroy();}

 // A returning guest retries while the host is away, then joins once the host registers.
 {const target=room.newRoomCode('chess');const waits=[];let opened=null,failed=null,missing=0;
  const guest=await room.joinPeerRoom(target,{},{onOpen:c=>{opened=c;},onWaiting:()=>waits.push(1),onMissing:()=>missing++,onFailure:r=>{failed=r;}},{resume:true});
  await wait(50);assert.ok(waits.length>=1,'Guest reports waiting while the host is missing');assert.equal(opened,null);
  const host=await room.hostPeerRoom(target,{onConnection:()=>{},onFailure:r=>{throw Error('host failure '+r);}});
  await wait(room.JOIN_RETRY_MS+200);
  assert.ok(opened,'Guest joins after the host appears');assert.equal(failed,null);assert.equal(missing,0,'Returning players are not told the room is gone');
  guest.destroy();host.destroy();}

 // A freshly opened link that finds no host warns early but keeps trying (a phone host may be in a chat app).
 {const target=room.newRoomCode('go');let missing=0,failed=null,opened=null;
  const guest=await room.joinPeerRoom(target,{},{onOpen:c=>{opened=c;},onMissing:()=>missing++,onFailure:r=>{failed=r;}});
  await wait(room.JOIN_RETRY_MS+300);assert.ok(missing>=1,'Missing room is reported early');assert.equal(failed,null,'…without giving up');
  const host=await room.hostPeerRoom(target,{onConnection:()=>{},onFailure:()=>{}});
  await wait(room.JOIN_RETRY_MS+300);assert.ok(opened,'The link still works once the host is back');guest.destroy();host.destroy();}

 // Host re-registers the same room id after the signaling socket drops.
 {const target=room.newRoomCode('go');let reconnecting=0;
  const host=await room.hostPeerRoom(target,{onReconnecting:()=>reconnecting++,onFailure:r=>{throw Error('host failure '+r);}});
  await wait(10);const peer=peers.get(target);assert.ok(peer);
  peer.drop();assert.equal(reconnecting,1);await wait(1200);
  assert.equal(peer.reconnects,1,'Dropped host reconnects with the same id');assert.ok(peers.has(target));
  // Socket-level errors are retried, not reported as a failed room.
  peer.emit('error',{type:'socket-closed'});peer.emit('error',{type:'network'});
  host.destroy();assert.ok(peer.destroyed);}

 // update() swaps handlers and re-decides waiting knocks.
 {const target=room.newRoomCode('shogi');const lists=[];let admitted=0;
  const host=await room.hostPeerRoom(target,{onVisitors:l=>lists.push(l),onFailure:()=>{},policy:()=>'ask'});await wait(5);
  const joined=new Promise(done=>room.joinPeerRoom(target,{},{onOpen:()=>done(true),onFailure:()=>done(false)}));await wait(30);
  assert.equal(lists.at(-1)[0].state,'knocking');
  host.update({onFailure:()=>{},onConnection:()=>admitted++,policy:()=>'admit'});
  assert.equal(await joined,true);assert.equal(admitted,1,'A new policy admits waiting visitors');host.destroy();}

 // A taken room id is reported, not retried forever.
 {let reason='';const target=room.newRoomCode('xiangqi');const h=await room.hostPeerRoom(target,{onFailure:r=>{reason=r;}});
  await wait(5);peers.get(target).emit('error',{type:'unavailable-id'});assert.equal(reason,'room-taken');h.destroy();}

 // An unreachable room service fails visibly instead of waiting forever.
 {silent=true;const reasons=[];let services=0;
  const g=await room.joinPeerRoom(room.newRoomCode('shogi'),{},{onOpen(){},onService:()=>services++,onFailure:r=>reasons.push('guest '+r)});
  const h=await room.hostPeerRoom(room.newRoomCode('shogi'),{onFailure:r=>reasons.push('host '+r)});
  await wait(room.SERVICE_LIMIT_MS+300);silent=false;
  assert.deepEqual(reasons.sort(),['guest service','host service']);assert.equal(services,0);g.destroy();h.destroy();}

 for(const reason of ['service','room-taken','host-gone','network','browser','no-room','denied','full'])for(const zh of [true,false])assert.ok(room.peerFailureMessage(reason,zh).length>5);
 console.log('PASS: link rooms parse codes per game, label devices, buffer data until handlers attach, keep newcomers at the door until the host admits or declines, turn people away when full, admit returning players, warn early about a missing room without giving up, re-register a dropped host, swap handlers on reconnect, and report an unreachable service.');
})().catch(e=>{console.error(e);process.exit(1);});
