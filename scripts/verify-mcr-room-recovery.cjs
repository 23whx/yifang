const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load;
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?core:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 const js=require.extensions['.js'];require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {McrRoom:R}=require('../lib/mahjong/mcr-room.ts');
 const {validMcrPayload}=require('../lib/mahjong/mcr-wire.ts');
 const views=[],frames=[],counts=[0,0,0,0];
 const sender=(id,out=views)=>m=>{assert.equal(m.recipient,id);assert.ok(validMcrPayload(m.payload,id));assert.ok(!/"(?:keys|archive|seed|initialSeed|nextSeed|wall)":/.test(JSON.stringify(m)));frames.push(m);if(m.payload.kind==='view')out[id]=m.payload.view;};
 const room=new R('mcr-restoration-original',sender(0));for(let i=1;i<4;i++)room.join(i,sender(i));assert.ok(room.start(42));
 const initial=room.recoveryCheckpoint(),old=views.map(v=>JSON.stringify(v)),checks=[];
 const request=(r,vs,id,choice,n)=>({v:1,game:'mcr-four',match:r.match,request:n,move:{revision:vs[id].revision,choice}});
 function chosen(vs){const v=vs.find(v=>v.choices.length);if(v)return [v.seat,(v.choices.find(c=>c.claim==='win'||c.type==='declare-self-draw')??v.choices[0]).index];const id=vs.findIndex(v=>v.canConfirm);return id>=0?[id,'confirm']:[0,'next'];}
 let steps=0;
 while(views[0].table.phase!=='finished'){
  const [id,choice]=chosen(views);assert.ok(room.receive(id,request(room,views,id,choice,++counts[id])));assert.ok(++steps<1000);
  if([1,12,80].includes(steps))checks.push({text:room.recoveryCheckpoint(),views:structuredClone(views)});
 }
 checks.push({text:room.recoveryCheckpoint(),views:structuredClone(views)});
 for(let id=0;id<2;id++)assert.ok(room.receive(id,request(room,views,id,'confirm',++counts[id])));
 checks.push({text:room.recoveryCheckpoint(),views:structuredClone(views)});
 for(const cp of checks){
  const out=[],r=R.restoreCheckpoint(cp.text,sender(0,out));assert.equal(r.status,'lobby');assert.equal(r.recoveryIdentity,room.recoveryIdentity);assert.notEqual(r.match,room.match);
  assert.equal(r.start(),false);assert.equal(r.join(1,sender(1,out)),false);
  const snapshot=r.recoveryCheckpoint();
  for(const [id,key,last] of [[1,'0'.repeat(64),old[1]],[1,room.recoveryCredential(2),old[1]],[1,room.recoveryCredential(1),old[2]],[4,room.recoveryCredential(1),old[1]]])assert.equal(r.resume(id,key,last,sender(1,out)),false);
  const tampered=JSON.parse(old[1]);tampered.balances[1]++;
  assert.equal(r.resume(1,room.recoveryCredential(1),JSON.stringify(tampered),sender(1,out)),false);assert.equal(r.recoveryCheckpoint(),snapshot);
  assert.ok(r.resume(1,room.recoveryCredential(1),old[1],sender(1,out)));
  assert.equal(r.resume(1,room.recoveryCredential(1),old[1],sender(1,out)),false);
  for(let id=2;id<4;id++)assert.ok(r.resume(id,room.recoveryCredential(id),JSON.stringify(cp.views[id]),sender(id,out)));
  assert.equal(out.length,0,'No view before explicit continue');assert.equal(r.start(7),false);assert.ok(r.start());assert.deepEqual(out,cp.views);
  const [id,choice]=chosen(out),move=request(r,out,id,choice,1),before=r.recoveryArchive();
  assert.equal(r.receive(id,{...move,match:room.match}),false);assert.equal(r.recoveryArchive(),before);
  assert.ok(r.receive(id,move));assert.equal(out[0].revision,cp.views[0].revision+1);const after=r.recoveryArchive();assert.equal(r.receive(id,move),false);assert.equal(r.recoveryArchive(),after);
  const again=R.restoreCheckpoint(r.recoveryCheckpoint(),()=>{});assert.equal(again.recoveryIdentity,r.recoveryIdentity);assert.notEqual(again.match,r.match);
  for(let seat=1;seat<4;seat++)assert.ok(again.resume(seat,r.recoveryCredential(seat),JSON.stringify(out[seat]),()=>{}));assert.ok(again.start());
 }
 const stale=R.restoreCheckpoint(initial,()=>{});assert.equal(stale.resume(1,room.recoveryCredential(1),JSON.stringify(views[1]),()=>{}),false);
 const raw=JSON.parse(room.recoveryCheckpoint());for(const bad of [{...raw,version:2},{...raw,game:'holdem-four-room'},{...raw,keys:Array(4).fill(raw.keys[0])},{...raw,keys:['bad',...raw.keys.slice(1)]},{...raw,extra:true}])assert.throws(()=>R.restoreCheckpoint(JSON.stringify(bad),()=>{}));
 for(const secret of raw.keys)assert.ok(!JSON.stringify(frames).includes(secret));
 console.log(`PASS ${checks.length} MCR room restores including opening, midhand, result and half-confirmed result, continued actions and second restore, stable identity/fresh epoch, precise seat prefixes, credential/tamper/ahead/old-message rejection and no secrets in frames. Direct room API, not authenticated transport or browser.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
