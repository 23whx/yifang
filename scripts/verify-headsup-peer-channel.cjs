const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {PokerPeerChannel}=require('../lib/holdem-peer-channel.ts');
const {ManualHeadsUpPokerHost:Host,ManualHeadsUpPokerGuest:Guest}=require('../lib/holdem-headsup-manual.ts');
class Connection{
 constructor(){this.open=false;this.closed=false;this.listeners=new Map();}
 on(event,fn){this.listeners.set(event,[...(this.listeners.get(event)||[]),fn]);}
 emit(event,value){for(const fn of this.listeners.get(event)||[])fn(value);}
 send(value){if(!this.open)throw Error('closed');this.peer.emit('data',structuredClone(value));}
 close(){if(this.closed)return;this.closed=true;this.open=false;this.emit('close');this.peer?.close();}
}
function pair(){const a=new Connection(),b=new Connection();a.peer=b;b.peer=a;return [a,b];}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 for(const alreadyOpen of [false,true]){
  const [a,b]=pair();a.open=b.open=alreadyOpen;
  const views=[],take=i=>m=>{if(m.payload.kind==='view')views[i]=m.payload.view;};
  const host=new Host(take(0),()=>{},()=>new PokerPeerChannel(a));
  const guest=new Guest(take(1),()=>{},()=>new PokerPeerChannel(b));
  const offering=host.offer(1);
  if(!alreadyOpen){a.open=b.open=true;a.emit('open');b.emit('open');}
  await offering;await flush();assert.ok(host.start());
  const originalIdentity=host.room.recoveryIdentity;
  let request=0;
  for(let step=0;step<4;step++){
   const id=views[0].actor,v=views[id],move={hand:v.hand,revision:v.revision,action:{kind:v.legal.canCheck?'check':'call'}};
   assert.ok(id===0?host.submit(++request,move):guest.submit(move));
  }
  const snapshot=structuredClone(views),hostSave=host.room.recoveryCheckpoint(),guestSave=guest.recoveryCheckpoint();
  a.emit('open');await flush();assert.equal(host.room.recoveryCheckpoint(),hostSave,'duplicate open cannot welcome or deal again');
  a.close();assert.equal(host.room.status,'closed');assert.equal(host.room.recoveryCheckpoint(),hostSave);
  // The same checkpoint format is consumed by the manual adapter: no Peer IDs
  // or public signaling credentials are required for recovery.
  const [c,d]=pair(),resumed=[];
  const h=new Host(m=>{if(m.payload.kind==='view')resumed[0]=m.payload.view;},()=>{},()=>new PokerPeerChannel(c),hostSave);
  const g=new Guest(m=>{if(m.payload.kind==='view')resumed[1]=m.payload.view;},()=>{},()=>new PokerPeerChannel(d),guestSave);
  await h.offer(1);c.open=d.open=true;c.emit('open');d.emit('open');
  const end=Date.now()+3000;while(!g.identity){assert.ok(Date.now()<end);await flush();}
  assert.equal(h.room.recoveryIdentity,originalIdentity);assert.notEqual(h.room.match,host.room.match);
  assert.equal(resumed.length,0);assert.ok(h.start());assert.deepEqual(resumed,snapshot);
  const id=resumed[0].actor,v=resumed[id],move={hand:v.hand,revision:v.revision,action:{kind:v.legal.canCheck?'check':'call'}};
  assert.ok(id===0?h.submit(1,move):g.submit(move));assert.equal(resumed[0].revision,v.revision+1);
  h.close();g.close();host.close();guest.close();
 }
 const [a,b]=pair(),channel=new PokerPeerChannel(a);let opened=0,closed=0,errors=0,data=0;
 channel.onopen=()=>opened++;channel.onclose=()=>closed++;channel.onerror=()=>errors++;channel.ondata=()=>data++;
 a.open=b.open=true;a.emit('open');channel.close();await flush();a.emit('open');a.emit('data',{});a.emit('error');
 assert.deepEqual([opened,closed,errors,data],[0,1,0,0]);assert.throws(()=>channel.send({}));
 console.log('PASS: Peer-compatible connection before/after open, four actions, private compatible checkpoints, fresh authenticated recovery and continued action; duplicate-open and disposed callbacks suppressed. Connection double + actual room/protocol/WebCrypto, not real PeerJS service or page integration.');
})().catch(e=>{console.error(e);process.exitCode=1;});
