const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {ManualHeadsUpPokerHost:Host,ManualHeadsUpPokerGuest:Guest}=require('../lib/holdem-headsup-manual.ts');
const {recoveryProof:sign,verifyRecoveryProof:verify}=require('../lib/recovery-auth.ts');
const choose=v=>v.legal?{kind:v.legal.canCheck?'check':'call'}:null;
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
(async()=>{
 const all=[];
 try{
  const views=[],take=id=>m=>{if(m.payload.kind==='view')views[id]=m.payload.view;};
  const host=new Host(take(0),()=>{},factory);all.push(host);const guests=[];
  for(let id=1;id<2;id++){const g=new Guest(take(id),()=>{},factory);all.push(g);guests[id]=g;await host.finish(id,await g.answer(await host.offer(id)));}
  assert.ok(host.start());
  let hostRequest=0;
  for(let n=0;n<4;n++){
   const id=[0,1].find(i=>choose(views[i]));assert.notEqual(id,undefined);
   const move={hand:views[id].hand,revision:views[id].revision,action:choose(views[id])};
   assert.ok(id===0?host.submit(++hostRequest,move):guests[id].submit(move));
  }
  const snapshot=structuredClone(views),hostSave=host.room.recoveryCheckpoint(),guestSaves=guests.map(g=>g?.recoveryCheckpoint());
  guests[1].close();assert.equal(host.room.status,'closed');assert.equal(host.room.recoveryCheckpoint(),hostSave);
  // Interrupt recovery after just one guest authenticates but before Start.
  // Saved guests must still recognize a second attempt's stable match lineage.
  const interrupted=new Host(()=>{},()=>{},factory,hostSave);all.push(interrupted);
  const early=new Guest(()=>{},()=>{},factory,guestSaves[1]);all.push(early);
  await interrupted.finish(1,await early.answer(await interrupted.offer(1)));await until(()=>early.identity);
  const partialSave=interrupted.room.recoveryCheckpoint();interrupted.close();
  const resumedViews=[],connected=[true,false];
  const receive=id=>m=>{if(m.payload.kind==='view')resumedViews[id]=m.payload.view;if(m.payload.kind==='lobby')connected.splice(0,2,...m.payload.connected);};
  const restored=new Host(receive(0),()=>{},factory,partialSave);all.push(restored);
  const restoredGuests=[],start=traffic.length;
  for(let id=1;id<2;id++){
   const g=new Guest(receive(id),()=>{},factory,guestSaves[id]);all.push(g);restoredGuests[id]=g;
   await restored.finish(id,await g.answer(await restored.offer(id)));await until(()=>connected[id]);
   assert.equal(g.identity.match,restored.room.match);assert.equal(g.identity.seat,id);
  }
  assert.equal(resumedViews.length,0,'No table state before explicit continuation');assert.ok(restored.start());
  assert.deepEqual(resumedViews,snapshot);
  const id=[0,1].find(i=>choose(resumedViews[i])),revision=resumedViews[id].revision;
  const move={hand:resumedViews[id].hand,revision,action:choose(resumedViews[id])};
  assert.ok(id===0?restored.submit(1,move):restoredGuests[id].submit(move));
  assert.equal(resumedViews[id].revision,revision+1);
  for(const {value} of traffic.slice(start)){
   for(const save of guestSaves.filter(Boolean))assert.ok(!JSON.stringify(value).includes(JSON.parse(save).key),'Do not send bearer secret in challenge/proof');
  }
  // An impostor host cannot solicit the guest's saved view or proof.
  let pipe,closed=0;const victim=new Guest(()=>assert.fail('Unauthenticated delivery'),()=>closed++,()=>pipe=new Channel(),guestSaves[1]);all.push(victim);
  const saved=JSON.parse(guestSaves[1]);
  const challenge={game:'holdem-two',previousMatch:saved.match,match:crypto.randomUUID(),seat:1,nonce:'a'.repeat(64)};
  const hostProof=await sign(saved.key,challenge,'host');
  assert.ok(await verify(saved.key,challenge,'host',hostProof));
  assert.equal(await verify(saved.key,challenge,'guest',hostProof,saved.lastView),false,'No reflection');
  assert.equal(await verify(saved.key,{...challenge,nonce:'b'.repeat(64)},'host',hostProof),false,'No challenge replay');
  assert.equal(await verify(saved.key,{...challenge,game:'sichuan-four'},'host',hostProof),false,'Game bound');
  await assert.rejects(()=>verify(saved.key,{...challenge,seat:2},'host',hostProof),/Invalid recovery proof context/);
  const guestProof=await sign(saved.key,challenge,'guest',saved.lastView);
  assert.equal(await verify(saved.key,challenge,'guest',guestProof,saved.lastView+' '),false,'View bound');
  pipe.ondata({kind:'holdem-recovery-challenge',v:1,challenge,proof:'0'.repeat(64)});await until(()=>closed===1);
  assert.equal(pipe.open,false);
  console.log('PASS: one original channel -> 4 actions -> disconnect -> mutually authenticated recovery channel -> explicit continuation -> legal next action; no plaintext bearer in proofs, forged host/reflection/nonce replay/seat/view tampering rejected. Mock data channels + real WebCrypto, not native RTC or persistent browser storage.');
 }finally{all.forEach(x=>x.close());}
})().catch(error=>{console.error(error);process.exitCode=1;});
