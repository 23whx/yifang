const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load;
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?core:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 const js=require.extensions['.js'];require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
const {ManualMcrHost:Host,ManualMcrGuest:Guest}=require('../lib/mahjong/mcr-manual.ts');
const {recoveryProof:sign,verifyRecoveryProof:verify}=require('../lib/recovery-auth.ts');
const choose=v=>v.choices.length?v.choices[0].index:null;
const registry=new Map(),traffic=[];let serial=0;
class Channel{
 constructor(){this.id=++serial;registry.set(this.id,this);this.open=false;this.stopped=false;this.onopen=()=>{};this.ondata=()=>{};this.onclose=()=>{};this.onerror=()=>{};}
 async offer(){return String(this.id);}
 async answer(offer){this.peer=registry.get(Number(offer));return String(this.id);}
 async finish(answer){this.peer=registry.get(Number(answer));assert.equal(this.peer.peer,this);this.open=this.peer.open=true;this.peer.onopen();this.onopen();}
 send(value){if(!this.open)throw new Error('closed');assert.ok(Buffer.byteLength(JSON.stringify(value),'utf8')<=65536,'Real UTF-8 frame must fit ManualRTC');traffic.push({from:this.id,value:structuredClone(value)});this.peer.ondata(structuredClone(value));}
 close(){if(this.stopped)return;this.stopped=true;this.open=false;this.onclose();this.peer?.close();}
}
const factory=()=>new Channel();
async function until(test){const end=Date.now()+3000;while(!test()){assert.ok(Date.now()<end,'Handshake timed out');await new Promise(resolve=>setTimeout(resolve,5));}}
const all=[];
 try{
  const views=[],take=id=>m=>{if(m.payload.kind==='view')views[id]=m.payload.view;};
  const host=new Host(take(0),()=>{},factory);all.push(host);const guests=[];
  for(let id=1;id<4;id++){const g=new Guest(take(id),()=>{},factory);all.push(g);guests[id]=g;await host.finish(id,await g.answer(await host.offer(id)));}
  assert.ok(host.room.start(42));
  let hostRequest=0;
  for(let n=0;n<12;n++){
   const id=[0,1,2,3].find(i=>choose(views[i])!==null);assert.notEqual(id,undefined);
   const move={revision:views[id].revision,choice:choose(views[id])};
   assert.ok(id===0?host.submit(++hostRequest,move):guests[id].submit(move));
  }
  const snapshot=structuredClone(views),hostSave=host.room.recoveryCheckpoint(),guestSaves=guests.map(g=>g?.recoveryCheckpoint());
  guests[2].close();assert.equal(host.room.status,'closed');assert.equal(host.room.recoveryCheckpoint(),hostSave);
  // Interrupt recovery after just one guest authenticates but before Start.
  // Saved guests must still recognize a second attempt's stable match lineage.
  const interrupted=new Host(()=>{},()=>{},factory,hostSave);all.push(interrupted);
  const early=new Guest(()=>{},()=>{},factory,guestSaves[1]);all.push(early);
  await interrupted.finish(1,await early.answer(await interrupted.offer(1)));await until(()=>early.identity);
  const partialSave=interrupted.room.recoveryCheckpoint();interrupted.close();
  const resumedViews=[],connected=[true,false,false,false];
  const receive=id=>m=>{if(m.payload.kind==='view')resumedViews[id]=m.payload.view;if(m.payload.kind==='lobby')connected.splice(0,4,...m.payload.connected);};
  const restored=new Host(receive(0),()=>{},factory,partialSave);all.push(restored);
  const restoredGuests=[],start=traffic.length;
  for(let id=1;id<4;id++){
   const g=new Guest(receive(id),()=>{},factory,guestSaves[id]);all.push(g);restoredGuests[id]=g;
   await restored.finish(id,await g.answer(await restored.offer(id)));await until(()=>connected[id]);
   assert.equal(g.identity.match,restored.room.match);assert.equal(g.identity.seat,id);
  }
  assert.equal(resumedViews.length,0,'No table state before explicit continuation');assert.ok(restored.start());
  assert.deepEqual(resumedViews,snapshot);
  const id=[0,1,2,3].find(i=>choose(resumedViews[i])!==null),revision=resumedViews[id].revision;
  const move={revision,choice:choose(resumedViews[id])};
  assert.ok(id===0?restored.submit(1,move):restoredGuests[id].submit(move));
  assert.equal(resumedViews[id].revision,revision+1);
  for(const {value} of traffic.slice(start)){
   for(const save of guestSaves.filter(Boolean))assert.ok(!JSON.stringify(value).includes(JSON.parse(save).key),'Do not send bearer secret in challenge/proof');
  }
  // An impostor host cannot solicit the guest's saved view or proof.
  let pipe,closed=0;const victim=new Guest(()=>assert.fail('Unauthenticated delivery'),()=>closed++,()=>pipe=new Channel(),guestSaves[1]);all.push(victim);
  const saved=JSON.parse(guestSaves[1]);
  const challenge={game:'mcr-four',previousMatch:saved.match,match:crypto.randomUUID(),seat:1,nonce:'a'.repeat(64)};
  const hostProof=await sign(saved.key,challenge,'host');
  assert.ok(await verify(saved.key,challenge,'host',hostProof));
  assert.equal(await verify(saved.key,challenge,'guest',hostProof,saved.lastView),false,'No reflection');
  assert.equal(await verify(saved.key,{...challenge,nonce:'b'.repeat(64)},'host',hostProof),false,'No challenge replay');
  assert.equal(await verify(saved.key,{...challenge,game:'sichuan-four'},'host',hostProof),false,'Game bound');
  assert.equal(await verify(saved.key,{...challenge,seat:2},'host',hostProof),false,'Seat bound');
  const guestProof=await sign(saved.key,challenge,'guest',saved.lastView);
  assert.equal(await verify(saved.key,challenge,'guest',guestProof,saved.lastView+' '),false,'View bound');
  pipe.ondata({kind:'mcr-recovery-challenge',v:1,challenge,proof:'0'.repeat(64)});await until(()=>closed===1);
  assert.equal(pipe.open,false);
  let finishingActions=0,hostFinalRequest=1;
  while(!resumedViews[0].complete){
   assert.ok(++finishingActions<15000,'16-hand match did not terminate');
   const active=resumedViews.find(v=>v.choices.length),confirm=resumedViews.findIndex(v=>v.canConfirm);
   const seat=active?active.seat:confirm>=0?confirm:0;
   const choice=active?(active.choices.find(c=>c.claim==='win'||c.type==='declare-self-draw')??active.choices[0]).index:confirm>=0?'confirm':'next';
   const move={revision:resumedViews[seat].revision,choice};
   assert.ok(seat===0?restored.submit(++hostFinalRequest,move):restoredGuests[seat].submit(move));
  }
  assert.equal(resumedViews[0].history.length,16);
  const terminalViews=structuredClone(resumedViews),terminalSave=restored.room.recoveryCheckpoint(),terminalGuestSaves=restoredGuests.map(g=>g?.recoveryCheckpoint());
  restoredGuests[2].close();assert.equal(restored.room.status,'closed');
  assert.equal(restored.room.recoveryCheckpoint(),terminalSave,'Disconnect does not settle again');
  const finishedViews=[],finishedConnected=[true,false,false,false];
  const finishedReceive=id=>m=>{if(m.payload.kind==='view')finishedViews[id]=m.payload.view;if(m.payload.kind==='lobby')finishedConnected.splice(0,4,...m.payload.connected);};
  const finishedHost=new Host(finishedReceive(0),()=>{},factory,terminalSave);all.push(finishedHost);
  for(let id=1;id<4;id++){
   const guest=new Guest(finishedReceive(id),()=>{},factory,terminalGuestSaves[id]);all.push(guest);
   await finishedHost.finish(id,await guest.answer(await finishedHost.offer(id)));await until(()=>finishedConnected[id]);
  }
  assert.equal(finishedViews.length,0,'Terminal table withheld before explicit continuation');
  const beforeResume=finishedHost.room.recoveryCheckpoint();assert.ok(finishedHost.start());
  assert.deepEqual(finishedViews,terminalViews,'Terminal match and four private projections survive authenticated recovery');
  assert.equal(finishedHost.room.recoveryCheckpoint(),beforeResume,'Resume does not settle or advance');
  assert.equal(finishedHost.submit(1,{revision:finishedViews[0].revision,choice:'next'}),false,'Completed match rejects next-hand request');
  assert.equal(finishedHost.room.recoveryCheckpoint(),beforeResume,'Rejected terminal request leaves ledger untouched');
  console.log(`PASS: three original channels -> 12 actions -> interrupted recovery -> authenticated continuation -> ${finishingActions} actions to completed 16-hand match -> four authenticated terminal restores, exact projections, no next hand or duplicate settlement.`);
  console.log('PASS: no plaintext bearer in proofs, forged host/reflection/nonce replay/seat/view tampering rejected. Mock data channels + real WebCrypto, not native RTC or persistent browser storage.');
 }finally{all.forEach(x=>x.close());}
})().catch(error=>{console.error(error);process.exitCode=1;});
