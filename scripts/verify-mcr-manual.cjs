const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load;
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?core:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 const js=require.extensions['.js'];require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);

let serial=0;const registry=new Map();
class Channel{
  constructor(host){this.host=host;this.id=++serial;this.open=false;this.stopped=false;this.onopen=()=>{};this.ondata=()=>{};this.onclose=()=>{};this.onerror=()=>{};registry.set(this.id,this);}
  async offer(){return String(this.id);}
  async answer(offer){this.peer=registry.get(Number(offer));return String(this.id);}
  async finish(answer){this.peer=registry.get(Number(answer));assert.equal(this.peer.peer,this);this.open=this.peer.open=true;this.peer.onopen();this.onopen();}
  send(value){if(!this.open)throw new Error('closed');this.peer.ondata(JSON.parse(JSON.stringify(value)));}
  close(){if(this.stopped)return;this.stopped=true;this.open=false;this.onclose();this.peer?.close();}
}

 const {ManualMcrHost,ManualMcrGuest}=require('../lib/mahjong/mcr-manual.ts');
 const views=[],frames=[],departures=[];let count=0;
 const receive=id=>m=>{frames.push(m);assert.equal(m.recipient,id);if(m.payload.kind==='view')views[id]=m.payload.view;};
 const host=new ManualMcrHost(receive(0),id=>departures.push(id),h=>new Channel(h));
 const guests=[];
 assert.equal(host.start(),false);
 for(let id=1;id<4;id++){const g=new ManualMcrGuest(receive(id),()=>departures.push(id),h=>new Channel(h));guests[id]=g;const offer=await host.offer(id);const answer=await g.answer(offer);await host.finish(id,answer);assert.equal(g.identity.seat,id);}
 assert.equal(host.room.start(42),true);
 const act=(id,choice)=>{const move={revision:views[id].revision,choice};return id===0?host.submit(++count,move):guests[id].submit(move);};
 let moves=0;
 while(views[0].table.phase!=='finished'){const v=views.find(v=>v.choices.length);assert.ok(v);const c=v.choices.find(c=>c.claim==='win'||c.type==='declare-self-draw')??v.choices.find(c=>c.type==='replace-flower')??v.choices[0];assert.ok(act(v.seat,c.index));assert.ok(++moves<1000);}
 for(let id=0;id<4;id++)assert.ok(act(id,'confirm'));
 assert.ok(act(3,'next'));assert.equal(views[0].hand,2);
 guests[2].close();assert.equal(host.room.status,'closed');assert.equal(guests[1].submit({revision:views[1].revision,choice:0}),false);
 // A malformed first welcome must immediately freeze that guest.
 let badChannel,closed=false;const bad=new ManualMcrGuest(()=>assert.fail('unsafe message'),()=>closed=true,h=>badChannel=new Channel(h));
 badChannel.ondata({kind:'mcr-four-welcome',v:1,match:'mcr-test-room-123',seat:1,hiddenHands:[]});assert.ok(closed);bad.close();host.close();
 console.log('PASS: manual MCR 3-offer mock exchange, seat pinning, '+moves+' actions, matching acknowledgements, unanimous next hand, malformed welcome and disconnect cascade. No real RTC/network/browser claim.');
})().catch(e=>{console.error(e);process.exitCode=1;});
