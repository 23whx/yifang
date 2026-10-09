const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load;
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?core:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 const js=require.extensions['.js'];require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);

 const {McrRoom}=require('../lib/mahjong/mcr-room.ts');
 const {McrRecoverySession}=require('../lib/mahjong/mcr-recovery.ts');
 const {validMcrRequest}=require('../lib/mahjong/mcr-request.ts');
 const {validMcrPayload}=require('../lib/mahjong/mcr-wire.ts');
 for(const bad of [null,[],{revision:0,choice:-1},{revision:0,choice:256},{revision:NaN,choice:0},{revision:0,choice:0,seat:1},{revision:0,choice:{score:88}}])assert.equal(validMcrRequest(bad),false);
 const views=[],seq=[0,0,0,0],requests=[0,0,0,0],frames=[];let room;
 const sink=id=>frame=>{
  assert.ok(validMcrPayload(frame.payload,id),'invalid genuine payload: '+JSON.stringify(frame.payload));
  assert.equal(frame.recipient,id);assert.ok(frame.sequence>seq[id]);seq[id]=frame.sequence;frames.push(frame);
  if(frame.payload.kind==='view'){
   const v=frame.payload.view;assert.equal(v.seat,id);assert.equal(v.table.viewerId,'seat-'+(id+1));
   for(const key of ['nextSeed','session','ledger','seed','hands','wall','initialSeed'])assert.ok(!(key in v)&&!(key in v.table));
   assert.equal(Object.keys(v.table.otherHandCounts).length,3);
   assert.ok(!Object.hasOwn(v.table.otherHandCounts,v.table.viewerId));views[id]=v;
  }
 };
 room=new McrRoom('mcr-test-room-123',sink(0));
 assert.equal(room.start(42),false);
 for(let id=1;id<4;id++)assert.equal(room.join(id,sink(id)),true);
 assert.equal(room.join(1,sink(1)),false);assert.equal(room.start(42),true);
 for(const mutate of [v=>v.seat=2,v=>v.table.viewerId='seat-2',v=>v.table.wall=[],v=>v.table.legalActions={},v=>v.table.ownHand[0].copy=99,v=>v.table.ownHand.push(v.table.ownHand[0]),v=>v.table.lastDrawnTileId='unknown:0',v=>v.balances[0]=999,v=>v.choices.push({index:0,type:'hack',tileIds:[],claim:null}),v=>v.table.melds['seat-2'].push({kind:'kong',exposure:'concealed',tiles:v.table.ownHand.slice(0,4),claimedTileId:null,fromPlayerId:null})]){
  const bad=structuredClone(views[0]);mutate(bad);assert.equal(validMcrPayload({kind:'view',view:bad},0),false,String(mutate));
 }
 const send=(id,choice,revision=views[id].revision)=>{
  const r={v:1,game:'mcr-four',match:room.match,request:++requests[id],move:{revision,choice}};
  const accepted=room.receive(id,r);assert.equal(room.receive(id,r),false);return accepted;
 };
 assert.equal(room.receive(7,{}),false);
 assert.equal(room.receive(0,{v:1,game:'mcr-four',match:room.match,request:99,move:{revision:0,choice:0},player:1}),false);
 let moves=0;
 while(views[0].table.phase!=='finished'){
  const v=views.find(v=>v.choices.length);assert.ok(v);const c=v.choices.find(c=>c.claim==='win'||c.type==='declare-self-draw')??v.choices.find(c=>c.type==='replace-flower')??v.choices[0];
  assert.ok(send(v.seat,c.index));assert.ok(++moves<1000);
 }
 assert.equal(views[0].history.length,1);assert.equal(views[0].balances.reduce((a,b)=>a+b),0);
 const result=JSON.stringify(views[0].history);
 for(let id=0;id<4;id++){assert.ok(send(id,'confirm'));assert.equal(JSON.stringify(views[0].history),result);assert.equal(views[0].canNext,id===3);}
 assert.ok(send(0,'next'));assert.equal(views[0].hand,2);assert.equal(send(0,0,0),false);
 const archive=room.recoveryArchive(),restored=McrRecoverySession.restore(archive);
 for(let id=0;id<4;id++)assert.deepEqual(restored.view(id),views[id]);
 assert.equal(JSON.parse(archive).actions.length,views[0].revision,'Only accepted actions enter journal');
 const retained=JSON.stringify(views);room.leave(2);assert.equal(room.status,'closed');assert.equal(send(0,0),false);assert.equal(JSON.stringify(views),retained);
 assert.equal(room.recoveryArchive(),archive,'Disconnect retains exact last journal');
 assert.ok(frames.some(f=>f.payload.kind==='closed'&&f.payload.player===2));
 const failure=new McrRoom('mcr-failure-123',()=>{});for(let id=1;id<4;id++)failure.join(id,f=>{if(f.payload.kind==='view')throw Error('send failed');});
 assert.equal(failure.start(1),false);assert.equal(failure.status,'closed');
 // A guest's move may commit before its ack send fails. The host receives
 // closed instead of the newer view, so its UI must save the room checkpoint.
 const lateViews=[],lateHostFrames=[];let failAck=false;
 const late=new McrRoom('mcr-late-ack-123',f=>{lateHostFrames.push(f);if(f.payload.kind==='view')lateViews[0]=f.payload.view;});
 for(let id=1;id<4;id++)late.join(id,f=>{if(f.payload.kind==='ack'&&failAck)throw Error('ack send failed');if(f.payload.kind==='view')lateViews[id]=f.payload.view;});
 assert.equal(late.start(42),true);
 let lateSteps=0,lateRequest=0;
 while(!lateViews.slice(1).some(v=>v?.choices.length)){
  assert.ok(++lateSteps<100,'Expected a guest turn');
  const v=lateViews.find(v=>v?.choices.length);assert.ok(v);
  assert.equal(late.receive(v.seat,{v:1,game:'mcr-four',match:late.match,request:++lateRequest,move:{revision:v.revision,choice:v.choices[0].index}}),true);
 }
 const actor=lateViews.findIndex((v,i)=>i>0&&v?.choices.length),beforeRevision=lateViews[0].revision;
 const beforeActions=JSON.parse(late.recoveryArchive()).actions.length;
 failAck=true;
 const committed=late.receive(actor,{v:1,game:'mcr-four',match:late.match,request:lateRequest+1,move:{revision:lateViews[actor].revision,choice:lateViews[actor].choices[0].index}});
 assert.equal(committed,true);assert.equal(late.status,'closed');
 assert.equal(lateViews[0].revision,beforeRevision,'Host view is stale after the failed guest ack');
 assert.equal(JSON.parse(late.recoveryArchive()).actions.length,beforeActions+1,'Committed move remains in host-private archive');
 assert.ok(lateHostFrames.some(f=>f.payload.kind==='closed'&&f.payload.player===actor));
 console.log('PASS: MCR room complete hand '+moves+' actions, '+frames.length+' frames; recipient views, duplicate/stale/extra-field rejection, four confirmations, next hand, disconnect and send failure. In-memory transport, not WebRTC or full rule coverage.');
})().catch(e=>{console.error(e);process.exitCode=1;});
