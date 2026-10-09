const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {RiichiRoomHost}=require('../lib/mahjong/riichi-room.ts');
const {validRiichiPayload}=require('../lib/mahjong/riichi-wire.ts');
const saved={setTimeout,clearTimeout,random:Math.random};
let next=0,seed=7421,queue=new Map();
global.setTimeout=f=>{const id=++next;queue.set(id,f);return id;};global.clearTimeout=id=>queue.delete(id);
Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
const drain=()=>{let count=0;while(queue.size){assert.ok(++count<60000);const [id,f]=queue.entries().next().value;queue.delete(id);f();}};
try{
  let room,auto=false,hold,held=false,starts=0,frames=0;
  const seq=[0,0,0,0],requests=[0,0,0,0],pending=[],finished=[],lastFrames=[[],[],[],[]];
  function answer(id,d){
    const choice=d.choices.find(c=>c.kind==='tsumo'||c.kind==='ron'||c.kind==='continue')||d.choices.find(c=>c.kind==='discard')||d.choices.find(c=>c.kind==='pass')||d.choices[0];
    const message={v:1,game:'riichi',match:room.match,request:++requests[id],revision:d.revision,choice:choice.id};
    assert.equal(room.receive(id,JSON.parse(JSON.stringify(message))),true);
    assert.equal(room.receive(id,message),false,'duplicate cannot apply twice');
    if(room.status==='playing'){
      assert.deepEqual(lastFrames[id].map(p=>p.kind),['ack','checkpoint'],'duplicate request gets a fresh seat-projected checkpoint');
      assert.equal(lastFrames[id][0].accepted,false);
    }
  }
  const receive=id=>wire=>{
    const message=JSON.parse(JSON.stringify(wire));frames++;
    assert.equal(message.recipient,id);assert.equal(message.sequence,++seq[id]);
    const p=message.payload;
    lastFrames[id].push(p);if(lastFrames[id].length>2)lastFrames[id].shift();
    assert.ok(validRiichiPayload(p,id),'serialized room payload must be accepted by guest schema');
    if(p.kind==='state'){
      assert.equal(p.view.ids[p.view.seat],id,'seat winds rotate but recipient identity does not');
      assert.equal(p.view.deck,undefined);
    }
    if(p.kind==='event'&&p.event.qipai){
      starts++;assert.equal(p.event.qipai.shoupai.filter(Boolean).length,1,'no other starting hands');
    }
    if(p.kind==='event'&&p.event.jieju)assert.equal(p.event.jieju.log,undefined,'no private full replay');
    if(p.kind==='decision'){
      pending[id]=p.decision;
      if(auto){
        if(id===2&&!held&&p.decision.choices.some(c=>c.kind==='continue')){hold=p.decision;held=true;}
        else setTimeout(()=>answer(id,p.decision),0);
      }
    }
    if(p.kind==='finished')finished[id]=p.summary;
    // A malicious receiver modifying its payload must not corrupt host objects.
    if(wire.payload.kind==='state')wire.payload.view.hands.fill('malicious');
  };
  room=new RiichiRoomHost('room-test-000001',receive(0));
  assert.equal(room.start(),false);
  assert.equal(room.join(0,()=>{}),false);
  for(let id=1;id<4;id++)assert.equal(room.join(id,receive(id)),true);
  assert.equal(room.join(1,()=>{}),false);assert.equal(room.join(4,()=>{}),false);
  assert.equal(room.start(),true);assert.equal(room.start(),false);drain();
  assert.ok(pending[0]);assert.equal(pending[1],undefined,'not every player gets the dealer decision');
  const bad={v:1,game:'riichi',match:room.match,request:1,revision:pending[0].revision,choice:pending[0].choices[0].id};
  assert.equal(room.receive(0,{...bad,match:'another-room'}),false);
  assert.equal(room.receive(99,bad),false);
  assert.equal(room.receive(0,{...bad,request:Infinity}),false);
  assert.equal(room.receive(3,bad),false,'seat 3 cannot act for the dealer');requests[3]=1;
  assert.equal(room.receive(0,{...bad,choice:'invalid-choice'}),false,'rejected choice cannot consume the current decision');requests[0]=1;
  assert.deepEqual(lastFrames[0].map(p=>p.kind),['ack','checkpoint']);
  assert.equal(lastFrames[0][0].accepted,false);
  assert.deepEqual(lastFrames[0][1].snapshot.decision,pending[0],'rejection checkpoint restores the legal choice set');
  auto=true;answer(0,pending[0]);drain();
  assert.ok(hold,'one participant can withhold result consent');
  assert.equal(room.status,'playing');const heldStarts=starts;drain();assert.equal(starts,heldStarts);
  answer(2,hold);drain();
  assert.equal(room.status,'finished');assert.equal(finished.filter(Boolean).length,4);
  for(const summary of finished){assert.deepEqual(summary,finished[0]);assert.equal(summary.scores.reduce((a,b)=>a+b,0),100000);}
  assert.equal(room.receive(0,bad),false);room.leave(0);assert.equal(room.status,'closed');
  let closed=[];
  const cancelled=new RiichiRoomHost('room-test-cancel',m=>{if(m.payload.kind==='closed')closed.push(m.payload);});
  for(let id=1;id<4;id++)cancelled.join(id,m=>{if(m.payload.kind==='closed')closed.push(m.payload);});
  cancelled.start();drain();cancelled.leave(2);drain();
  assert.equal(cancelled.status,'closed');assert.equal(closed.length,4);
  assert.ok(closed.every(p=>p.reason==='player-left'&&p.player===2));
  assert.equal(cancelled.receive(0,bad),false);assert.equal(cancelled.start(),false);
  const failed=new RiichiRoomHost('room-test-failed',()=>{});
  for(let id=1;id<4;id++)failed.join(id,m=>{if(id===2&&m.payload.kind==='state')throw new Error('channel closed');});
  failed.start();drain();assert.equal(failed.status,'closed','synchronous send failure terminates safely');
  const lateDecisions=[],lateFrames=[];let failAck=false;
  const late=new RiichiRoomHost('room-test-late-ack',m=>{lateFrames.push(m);if(m.payload.kind==='decision')lateDecisions[0]=m.payload.decision;});
  for(let id=1;id<4;id++)late.join(id,m=>{if(m.payload.kind==='ack'&&failAck)throw Error('ack send failed');if(m.payload.kind==='decision')lateDecisions[id]=m.payload.decision;});
  assert.equal(late.start(),true);drain();
  assert.ok(lateDecisions[0]);
  const first=lateDecisions[0],discard=first.choices.find(c=>c.kind==='discard')??first.choices[0];
  assert.equal(late.receive(0,{v:1,game:'riichi',match:late.match,request:1,revision:first.revision,choice:discard.id}),true);drain();
  const actor=lateDecisions.findIndex((d,i)=>i>0&&d);assert.ok(actor>0,'Expected a guest decision after dealer discard');
  const beforeActions=JSON.parse(late.recoveryCheckpoint()).archive.actions.length;
  const beforeCheckpoints=lateFrames.filter(m=>m.payload.kind==='checkpoint').length;
  const decision=lateDecisions[actor],choice=decision.choices.find(c=>c.kind==='pass')??decision.choices[0];
  failAck=true;
  assert.equal(late.receive(actor,{v:1,game:'riichi',match:late.match,request:1,revision:decision.revision,choice:choice.id}),true);
  assert.equal(late.status,'closed');
  assert.equal(JSON.parse(late.recoveryCheckpoint()).archive.actions.length,beforeActions+1,'Host journal retains accepted guest action');
  assert.equal(lateFrames.filter(m=>m.payload.kind==='checkpoint').length,beforeCheckpoints,'Host gets no new checkpoint after failed ack');
  assert.ok(lateFrames.some(m=>m.payload.kind==='closed'&&m.payload.player===actor));
  console.log(`Riichi room coordinator PASS: ${frames} serialized recipient frames, ${starts/4} hands, four-seat consent, identity/revision guards, private starting hands and disconnect stop. No actual WebRTC/browser room yet.`);
}finally{global.setTimeout=saved.setTimeout;global.clearTimeout=saved.clearTimeout;Math.random=saved.random;}
