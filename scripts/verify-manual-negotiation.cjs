const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const peers=[];
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
global.RTCPeerConnection=class {
 constructor(config){assert.deepEqual(config,{iceServers:[]});this.signalingState='stable';this.iceGatheringState='complete';this.pending=deferred();this.localCalls=0;this.offerCalls=0;peers.push(this);}
 createDataChannel(){return {close(){},readyState:'connecting'};}
 createOffer(){this.offerCalls++;return this.pending.promise;}
 async setLocalDescription(d){this.localCalls++;this.localDescription=d;this.signalingState='have-local-offer';}
 close(){this.signalingState='closed';}
};
const {ManualRTC}=require('../lib/manual-rtc.ts');
(async()=>{
 const cancelled=new ManualRTC('chess',true),pc=peers.at(-1);
 const first=cancelled.offer();
 await assert.rejects(cancelled.offer(),/already in progress/);
 assert.equal(pc.offerCalls,1);
 cancelled.close();pc.pending.resolve({type:'offer',sdp:'v=0\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel'});
 await assert.rejects(first,/cancelled/);assert.equal(pc.localCalls,0,'No local SDP mutation after closing');
 await assert.rejects(cancelled.offer(),/cancelled/);
 const retry=new ManualRTC('go',true),other=peers.at(-1);
 other.createOffer=async()=>{throw Error('temporary browser error');};
 await assert.rejects(retry.offer(),/temporary/);
 other.createOffer=async()=>({type:'offer',sdp:'v=0\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel'});
 assert.equal(JSON.parse(await retry.offer()).game,'go','Failure releases busy gate');retry.close();
 const guest=new ManualRTC('chess',false),g=peers.at(-1),remote=deferred();let answers=0;
 g.setRemoteDescription=()=>remote.promise;g.createAnswer=async()=>{answers++;return {};};
 const invite=JSON.stringify({v:1,game:'chess',id:'a'.repeat(24),type:'offer',sdp:'v=0\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel'});
 const answering=guest.answer(invite);await assert.rejects(guest.answer(invite),/already in progress/);
 guest.close();remote.resolve();await assert.rejects(answering,/cancelled/);assert.equal(answers,0);
 const host=new ManualRTC('chess',true),h=peers.at(-1),finishGate=deferred();
 h.pending.resolve({type:'offer',sdp:'v=0\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel'});
 const offer=JSON.parse(await host.offer());h.setRemoteDescription=()=>finishGate.promise;
 const answer=JSON.stringify({...offer,type:'answer'}),finishing=host.finish(answer);
 await assert.rejects(host.finish(answer),/already in progress/);
 host.close();finishGate.resolve();await assert.rejects(finishing,/cancelled/);
 console.log('PASS: concurrent offers rejected, closed pending offer cannot mutate SDP or succeed, failed negotiation releases gate. Mock browser API, not native connectivity.');
})().catch(e=>{console.error(e);process.exitCode=1;});
