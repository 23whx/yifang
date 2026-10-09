const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {ManualSichuanHost,ManualSichuanGuest}=require('../lib/mahjong/sichuan-manual.ts');
const saved={setTimeout,clearTimeout};let tick=0,timers=new Map();
global.setTimeout=f=>{const id=++tick;timers.set(id,f);return id;};global.clearTimeout=id=>timers.delete(id);
function drain(){let i=0;while(timers.size){assert.ok(++i<10000);const [id,f]=timers.entries().next().value;timers.delete(id);f();}}
let serial=0;const registry=new Map();
class Channel{
  constructor(host){this.host=host;this.id=++serial;this.open=false;this.stopped=false;this.onopen=()=>{};this.ondata=()=>{};this.onclose=()=>{};this.onerror=()=>{};registry.set(this.id,this);}
  async offer(){return String(this.id);}
  async answer(offer){this.peer=registry.get(Number(offer));return String(this.id);}
  async finish(answer){this.peer=registry.get(Number(answer));assert.equal(this.peer.peer,this);this.open=this.peer.open=true;this.peer.onopen();this.onopen();}
  send(value){if(!this.open)throw new Error('closed');this.peer.ondata(JSON.parse(JSON.stringify(value)));}
  close(){if(this.stopped)return;this.stopped=true;this.open=false;this.onclose();this.peer?.close();}
}
(async()=>{
  try{
    const pending=[],frames=[],closed=[];let hostRequest=0;
    const receive=id=>message=>{frames.push(message);assert.equal(message.recipient,id);if(message.payload.kind==='view')pending[id]=message.payload.view;};
    const host=new ManualSichuanHost(receive(0),id=>closed.push(id),h=>new Channel(h));
    const guests=[];
    assert.equal(host.start(),false);
    for(let id=1;id<4;id++){
      const guest=new ManualSichuanGuest(receive(id),()=>closed.push('guest'+id),h=>new Channel(h));guests[id]=guest;
      const offer=await host.offer(id);const answer=await guest.answer(offer);await host.finish(id,answer);
      assert.equal(guest.identity.seat,id);assert.equal(guest.identity.match,host.room.match);
    }
    await assert.rejects(()=>host.offer(1));
    assert.equal(host.start(),true);drain();
    const {sichuanTeachingAction:policy}=require('../lib/mahjong/sichuan-teaching.ts');
    let actions=0;
    while(pending[0].stage!=='play'||pending[0].round.phase!=='ended'){
      assert.ok(++actions<500);
      const id=[0,1,2,3].find(i=>policy(pending[i])!==null);assert.notEqual(id,undefined);
      const request={revision:pending[id].revision,action:policy(pending[id])};
      assert.ok(id===0?host.submit(++hostRequest,request):guests[id].submit(request));drain();
    }
    assert.ok(frames.some(m=>m.recipient===3&&m.payload.kind==='view'));
    assert.ok(frames.filter(m=>m.payload.kind==='ack').every(m=>m.payload.accepted));
    guests[2].close();drain();
    assert.equal(host.room.status,'closed');assert.equal(host.start(),false);
    assert.equal(host.submit(++hostRequest,{revision:0,action:{kind:'draw'}}),false);
    assert.ok(closed.includes(2));assert.ok(closed.includes('guest1'));assert.ok(closed.includes('guest3'));
    // Cancel unconnected offers; retry gets a fresh channel and old answer cannot apply.
    const replacement=new ManualSichuanHost(()=>{},()=>{},h=>new Channel(h));
    await replacement.offer(1);assert.equal(replacement.cancelOffer(1),true);
    await assert.rejects(()=>replacement.finish(1,'old'));
    await replacement.offer(1);replacement.close();
    // Envelope spoof/replay closes guest; callbacks receive no foreign seat state.
    let pipe,deliveries=0,disconnects=0;
    const guest=new ManualSichuanGuest(()=>deliveries++,()=>disconnects++,h=>(pipe=new Channel(h)));
    pipe.ondata({kind:'sichuan-four-welcome',v:1,match:'valid-match-123',seat:1,recoveryKey:'a'.repeat(64),recoveryMatch:'valid-match-123'});
    const envelope={v:1,game:'sichuan-four',match:'valid-match-123',recipient:1,sequence:1,payload:{kind:'lobby',connected:[true,true,false,false]}};
    pipe.ondata(envelope);pipe.ondata(envelope);
    assert.equal(deliveries,1);assert.equal(disconnects,1);assert.equal(guest.submit({revision:0,action:{kind:'draw'}}),false);
    let silentPipe,silentClosed=0;
    const silent=new ManualSichuanGuest(()=>{},()=>silentClosed++,h=>(silentPipe=new Channel(h)));
    silentPipe.ondata({kind:'sichuan-four-welcome',v:1,match:'valid-match-456',seat:2,recoveryKey:'b'.repeat(64),recoveryMatch:'valid-match-456'});
    silentPipe.open=true;silentPipe.peer={ondata:()=>{},close:()=>{}};
    assert.equal(silent.submit({revision:0,action:{kind:'draw'}}),1);
    assert.equal(silent.submit({revision:0,action:{kind:'draw'}}),false,'no second action while acknowledgement is pending');
    drain();assert.equal(silentClosed,1,'missing acknowledgement terminates uncertain connection');
    assert.equal(silent.submit({revision:1,action:{kind:'draw'}}),false);
    console.log('Manual four-seat Sichuan adapter PASS: three independent guest channels, assigned seats, legal round traffic, acknowledgements, disconnect cascade, offer cancellation and replay rejection. Mock channels, not real WebRTC proof.');
  }finally{global.setTimeout=saved.setTimeout;global.clearTimeout=saved.clearTimeout;}
})().catch(error=>{console.error(error);process.exitCode=1;});
