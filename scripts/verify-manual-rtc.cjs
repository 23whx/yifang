const assert = require('node:assert/strict'), fs = require('node:fs'), ts = require('typescript');
require.extensions['.ts'] = (m,f) => m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {ManualRTC,readManualSignal}=require('../lib/manual-rtc.ts');
const {secureMultiplayerContext,insecureMultiplayerMessage}=require('../lib/network-context.ts');
const peers=[];
class FakePeer {
  constructor(config){ assert.deepEqual(config,{iceServers:[]}); peers.push(this); this.signalingState='stable'; this.iceGatheringState='complete'; this.connectionState='new'; this.listeners=new Map(); }
  addEventListener(type,callback){const callbacks=this.listeners.get(type)??new Set();callbacks.add(callback);this.listeners.set(type,callbacks);}
  removeEventListener(type,callback){this.listeners.get(type)?.delete(callback);}
  emit(type){for(const callback of this.listeners.get(type)??[])callback();}
  createDataChannel(label,options){assert.equal(label,'yifang');assert.deepEqual(options,{ordered:true});return this.channel={label,readyState:'open',bufferedAmount:0,send:m=>{this.sent=m;},close:()=>{this.channel.readyState='closed';}};}
  async createOffer(){return {type:'offer',sdp:'v=0\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\n'};}
  async createAnswer(){return {...await this.createOffer(),type:'answer'};}
  async setLocalDescription(d){this.localDescription=d;this.signalingState=d.type==='offer'?'have-local-offer':'stable';}
  async setRemoteDescription(d){this.remoteDescription=d;this.signalingState=d.type==='offer'?'have-remote-offer':'stable';}
  close(){this.connectionState='closed';}
}
global.RTCPeerConnection=FakePeer;
(async()=>{
  assert.equal(secureMultiplayerContext(),true,'Node test runner has no Window');
  global.window={isSecureContext:false};
  assert.equal(secureMultiplayerContext(),false,'LAN HTTP must be rejected');
  assert.throws(()=>new ManualRTC('holdem',true),/Secure multiplayer context required/);
  assert.equal(peers.length,0,'no RTCPeerConnection before secure-context check');
  assert.ok(insecureMultiplayerMessage('zh').includes('有效 HTTPS'));
  assert.ok(insecureMultiplayerMessage('en').includes('valid HTTPS'));
  delete global.window;
  const host=new ManualRTC('holdem',true), guest=new ManualRTC('holdem',false);
  const offer=await host.offer();
  assert.equal(readManualSignal(offer,'holdem','offer').type,'offer');
  const answer=await guest.answer(offer);
  assert.equal(JSON.parse(answer).id,JSON.parse(offer).id);
  await assert.rejects(()=>guest.answer(offer),/Wrong step/,'a guest must not reuse one channel for a second offer');
  const wrong=JSON.stringify({...JSON.parse(answer),id:'f'.repeat(24)});
  await assert.rejects(()=>host.finish(wrong));
  assert.equal(peers[0].signalingState,'have-local-offer');
  await host.finish(answer);
  assert.equal(peers[0].remoteDescription.type,'answer');
  await assert.rejects(()=>host.finish(answer));
  await assert.rejects(()=>host.offer(),/Wrong step/,'a completed host channel must not silently renegotiate');
  for(const bad of ['', 'null', '{}', 'x'.repeat(65537), JSON.stringify({...JSON.parse(offer),game:'go'}), JSON.stringify({...JSON.parse(offer),type:'answer'}), JSON.stringify({...JSON.parse(offer),sdp:'v=0\r\nm=audio 9 x\r\nm=application 9 x'})])assert.throws(()=>readManualSignal(bad,'holdem','offer'));
  host.send({kind:'hello'});assert.deepEqual(JSON.parse(peers[0].sent),{kind:'hello'});
  host.send('x'.repeat(65534));assert.equal(peers[0].sent.length,65536,'Maximum serialized message is allowed');
  const beforeOversize=peers[0].sent;
  assert.throws(()=>host.send('x'.repeat(65535)),/Message limit exceeded/);
  assert.equal(peers[0].sent,beforeOversize,'Oversize messages are never sent');
  // RTCDataChannel.send measures UTF-8 bytes, not JavaScript string units.
  for(const atLimit of ['棋'.repeat(21844)+'ab','😀'.repeat(16383)+'ab','\ud800'.repeat(10922)+'ab']){
    assert.equal(Buffer.byteLength(JSON.stringify(atLimit),'utf8'),65536);
    host.send(atLimit);assert.equal(peers[0].sent,JSON.stringify(atLimit));
  }
  for(const overLimit of ['棋'.repeat(21845),'😀'.repeat(16384),'\ud800'.repeat(10923)]){
    const previous=peers[0].sent;assert.throws(()=>host.send(overLimit),/Message limit exceeded/);
    assert.equal(peers[0].sent,previous,'UTF-8/JSON escaped over-limit text must never reach SCTP');
  }
  peers[0].sctp={maxMessageSize:32768};
  host.send('x'.repeat(32766));
  const beforeNegotiatedLimit=peers[0].sent;
  assert.throws(()=>host.send('x'.repeat(32767)),/Message limit exceeded/);
  assert.equal(peers[0].sent,beforeNegotiatedLimit,'Respect a smaller negotiated SCTP frame size');
  for(const maxMessageSize of [0,Infinity]){peers[0].sctp={maxMessageSize};host.send('x'.repeat(65534));assert.throws(()=>host.send('x'.repeat(65535)),/Message limit exceeded/);}
  delete peers[0].sctp;
  assert.throws(()=>host.send(undefined),/Invalid message/);
  peers[0].channel.bufferedAmount=262144;host.send({kind:'at-buffer-boundary'});
  const beforeBackpressure=peers[0].sent;
  peers[0].channel.bufferedAmount=262145;
  assert.throws(()=>host.send({kind:'over-buffer-boundary'}),/Message limit exceeded/);
  assert.equal(peers[0].sent,beforeBackpressure,'Backpressure rejects before delivery');
  peers[0].channel.bufferedAmount=0;
  let received;host.ondata=v=>received=v;
  peers[0].channel.onmessage({data:'{"move":"check"}'});assert.deepEqual(received,{move:'check'});
  const incomingAtLimit=JSON.stringify('棋'.repeat(21844)+'ab');
  peers[0].channel.onmessage({data:incomingAtLimit});assert.equal(received,JSON.parse(incomingAtLimit));assert.equal(host.open,true,'Accept a UTF-8 message at 64KiB');
  let closed=0;host.onclose=()=>closed++;
  peers[0].connectionState='disconnected';peers[0].onconnectionstatechange();
  assert.equal(host.open,true,'a transient ICE disconnect must not end the match immediately');
  peers[0].connectionState='connected';peers[0].onconnectionstatechange();
  assert.equal(host.open,true,'a recovered ICE connection keeps the channel alive');
  peers[0].channel.onmessage({data:'not json'});
  assert.equal(closed,1);assert.equal(host.open,false);
  host.close();assert.equal(closed,1);assert.throws(()=>host.send({}));
  guest.close();
  const stalled=new ManualRTC('holdem',true),stalledPeer=peers.at(-1);
  let stalledCloses=0;stalled.onclose=()=>stalledCloses++;
  stalledPeer.connectionState='disconnected';stalledPeer.onconnectionstatechange();
  assert.equal(stalledCloses,0);
  await new Promise(resolve=>setTimeout(resolve,5100));
  assert.equal(stalledCloses,1,'a sustained ICE disconnect must still close the channel');
  stalled.close();assert.equal(stalledCloses,1);
  const failed=new ManualRTC('holdem',true),failedPeer=peers.at(-1);
  let failedCloses=0;failed.onclose=()=>failedCloses++;
  failedPeer.connectionState='failed';failedPeer.onconnectionstatechange();
  assert.equal(failedCloses,1,'a failed ICE connection must close immediately');
  const gathering=new ManualRTC('holdem',true),gatheringPeer=peers.at(-1);
  gatheringPeer.iceGatheringState='gathering';
  const unfinished=gathering.offer();
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(gatheringPeer.listeners.get('icegatheringstatechange')?.size,1);
  await assert.rejects(()=>gathering.offer(),/Negotiation already in progress/);
  let cancelledCloses=0;gathering.onclose=()=>cancelledCloses++;
  gathering.close();await assert.rejects(unfinished,/Connection cancelled/);
  assert.equal(gatheringPeer.listeners.get('icegatheringstatechange')?.size,0,'cancelled gathering must remove its listener');
  assert.equal(cancelledCloses,1);assert.equal(gathering.open,false);
  const completed=new ManualRTC('holdem',true),completedPeer=peers.at(-1);
  completedPeer.iceGatheringState='gathering';
  const completing=completed.offer();
  await new Promise(resolve=>setTimeout(resolve,0));
  completedPeer.iceGatheringState='complete';completedPeer.emit('icegatheringstatechange');
  assert.equal(readManualSignal(await completing,'holdem','offer').type,'offer');
  assert.equal(completedPeer.listeners.get('icegatheringstatechange')?.size,0,'finished gathering must remove its listener');
  completed.close();
  // Closing a room must isolate callbacks from its old RTC object. Browsers
  // can already have queued a datachannel/error event when close is called.
  const lateGuest=new ManualRTC('holdem',false),latePeer=peers.at(-1);
  let lateOpened=0,lateErrors=0,lateClosed=0;
  lateGuest.onopen=()=>lateOpened++;lateGuest.onerror=()=>lateErrors++;lateGuest.onclose=()=>lateClosed++;
  lateGuest.close();
  const incoming=()=>({label:'yifang',ordered:true,maxRetransmits:null,maxPacketLifeTime:null,readyState:'open',close(){this.readyState='closed';}});
  const lateChannel=incoming();latePeer.ondatachannel({channel:lateChannel});
  assert.equal(lateChannel.readyState,'closed','Reject an incoming channel after the room closed');
  assert.equal(lateChannel.onopen,undefined,'Do not attach stale channel callbacks');
  assert.deepEqual([lateOpened,lateErrors,lateClosed],[0,0,1]);
  const reliabilityGuest=new ManualRTC('holdem',false),reliabilityPeer=peers.at(-1);
  let reliabilityOpens=0;reliabilityGuest.onopen=()=>reliabilityOpens++;
  for(const options of [{ordered:false},{maxRetransmits:0},{maxRetransmits:5},{maxPacketLifeTime:0},{maxPacketLifeTime:20}]){
    const rejected=Object.assign(incoming(),options);reliabilityPeer.ondatachannel({channel:rejected});
    assert.equal(rejected.readyState,'closed',`Reject incompatible reliability ${JSON.stringify(options)}`);
    assert.equal(rejected.onopen,undefined,'Rejected channel must have no callbacks');
    assert.equal(reliabilityGuest.open,false,'Unreliable channel must not become the formal channel');
  }
  const reliable=incoming();reliabilityPeer.ondatachannel({channel:reliable});reliable.onopen();
  assert.equal(reliabilityGuest.open,true);assert.equal(reliabilityOpens,1,'Valid channel accepted after incompatible channels');reliabilityGuest.close();
  const activeGuest=new ManualRTC('holdem',false),activePeer=peers.at(-1),accepted=incoming(),duplicate=incoming(),wrongChannel=incoming();
  wrongChannel.label='another-room';activePeer.ondatachannel({channel:wrongChannel});
  assert.equal(wrongChannel.readyState,'closed');
  activePeer.ondatachannel({channel:accepted});activePeer.ondatachannel({channel:duplicate});
  assert.equal(duplicate.readyState,'closed');assert.equal(accepted.readyState,'open');
  let opens=0,errors=0,closes=0,deliveries=0;
  activeGuest.onopen=()=>opens++;activeGuest.onerror=()=>errors++;activeGuest.onclose=()=>closes++;activeGuest.ondata=()=>deliveries++;
  accepted.onopen();activeGuest.close();
  accepted.onopen();accepted.onerror();accepted.onmessage({data:'{}'});accepted.onclose();
  assert.deepEqual([opens,errors,closes,deliveries],[1,0,1,0],'Closed room receives no open/error/data callbacks');
  for(const invalidMessage of ['not json',new Uint8Array(1),'x'.repeat(65537),JSON.stringify('棋'.repeat(21845)),JSON.stringify('😀'.repeat(16384)),JSON.stringify('\ud800'.repeat(10923))]){
    const rtc=new ManualRTC('holdem',true),p=peers.at(-1);let count=0;
    rtc.onerror=()=>{throw Error('consumer error handler failed');};rtc.onclose=()=>count++;
    assert.throws(()=>p.channel.onmessage({data:invalidMessage}),/consumer error handler failed/);
    assert.equal(rtc.open,false);assert.equal(count,1,'Error notification exceptions must not prevent shutdown');
    rtc.close();assert.equal(count,1);
  }
  const errored=new ManualRTC('holdem',true),errorPeer=peers.at(-1);let errorCloses=0;
  errored.onerror=()=>{throw Error('failed error handler');};errored.onclose=()=>errorCloses++;
  assert.throws(()=>errorPeer.channel.onerror(),/failed error handler/);assert.equal(errored.open,false);assert.equal(errorCloses,1);
  // Controlled clock tests the grace boundary without claiming native network
  // interruption. Repeated events cannot keep a disconnected room alive forever.
  const realSetTimeout=global.setTimeout,realClearTimeout=global.clearTimeout;
  let now=0,nextTimer=0;const timers=new Map();
  global.setTimeout=(fn,delay)=>{const id=++nextTimer;timers.set(id,{fn,at:now+delay});return id;};
  global.clearTimeout=id=>timers.delete(id);
  const tick=ms=>{now+=ms;for(const [id,timer] of [...timers])if(timer.at<=now){timers.delete(id);timer.fn();}};
  try{
    const repeated=new ManualRTC('holdem',true),rp=peers.at(-1);let count=0;repeated.onclose=()=>count++;
    rp.connectionState='disconnected';rp.onconnectionstatechange();tick(4000);rp.onconnectionstatechange();
    assert.equal(timers.size,1);tick(999);assert.equal(count,0);tick(1);assert.equal(count,1);assert.equal(timers.size,0);
    const bounced=new ManualRTC('holdem',true),bp=peers.at(-1);let bounceCloses=0;bounced.onclose=()=>bounceCloses++;
    bp.connectionState='disconnected';bp.onconnectionstatechange();tick(4000);
    bp.connectionState='connected';bp.onconnectionstatechange();assert.equal(timers.size,0);tick(2000);assert.equal(bounceCloses,0);
    bp.connectionState='disconnected';bp.onconnectionstatechange();tick(4999);assert.equal(bounceCloses,0);tick(1);assert.equal(bounceCloses,1);
    const cancelled=new ManualRTC('holdem',true),cp=peers.at(-1);let cancelledCount=0;cancelled.onclose=()=>cancelledCount++;
    cp.connectionState='disconnected';cp.onconnectionstatechange();cancelled.close();assert.equal(timers.size,0);tick(6000);assert.equal(cancelledCount,1);
    // Defensive stale-callback isolation. The fake explicitly supplies a
    // stale disconnected state after close; this is NOT native jitter proof.
    const oldRoom=new ManualRTC('holdem',true),oldPeer=peers.at(-1);let oldCloses=0;oldRoom.onclose=()=>oldCloses++;oldRoom.close();
    const newRoom=new ManualRTC('holdem',true),newPeer=peers.at(-1);let newCloses=0;newRoom.onclose=()=>newCloses++;
    newPeer.connectionState='disconnected';newPeer.onconnectionstatechange();assert.equal(timers.size,1);
    oldPeer.connectionState='disconnected';oldPeer.onconnectionstatechange();
    assert.equal(timers.size,1,'Closed-room stale state callback must not start a timer');
    for(const state of ['connected','failed','closed','disconnected']){oldPeer.connectionState=state;oldPeer.onconnectionstatechange();assert.equal(timers.size,1);}
    tick(4999);assert.equal(newCloses,0);tick(1);assert.equal(newCloses,1);assert.equal(oldCloses,1);assert.equal(timers.size,0);
  }finally{global.setTimeout=realSetTimeout;global.clearTimeout=realClearTimeout;}
  const source=fs.readFileSync(require.resolve('../lib/manual-rtc.ts'),'utf8');
  assert.doesNotMatch(source,/new WebSocket|fetch\(|stun:|turn:|getUserMedia/);
  console.log('PASS: data-only SDP, session/game/type guards, no ICE servers, matching offer/answer, one negotiation per channel; exact UTF-8 64KiB send/receive boundaries for Chinese, emoji and escaped lone surrogates, smaller negotiated SCTP send limits and undefined rejection; invalid-payload shutdown even with throwing error handlers, late/duplicate channel rejection, closed-room event isolation, transient/sustained/repeated ICE disconnection and grace reset/cancellation, gathering cancellation/completion and idempotent cleanup. Mock transport and controlled clock; not native network interruption.');
})().catch(e=>{console.error(e);process.exitCode=1;});
