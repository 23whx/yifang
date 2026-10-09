const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {SichuanRoom}=require('../lib/mahjong/sichuan-room.ts');
const {validSichuanPayload}=require('../lib/mahjong/sichuan-wire.ts');
const deck=Array(108).fill(null),pool=Array.from({length:108},(_,i)=>Math.floor(i/4));
const opening=[0,0,0,0,1,2,3,4,9,10,11,12,13,14];
opening.forEach((t,i)=>{deck[i<13?i*4:52]=t;pool.splice(pool.indexOf(t),1);});
for(let i=0;i<108;i++)if(deck[i]===null)deck[i]=pool.shift();
const views=[],sequences=[0,0,0,0],requests=[0,0,0,0],match='sichuan-opening-kong-room';
function receive(id,m){
 assert.equal(m.sequence,++sequences[id]);assert.equal(m.recipient,id);assert.ok(validSichuanPayload(m.payload,id));
 if(m.payload.kind==='view'){
  views[id]=m.payload.view;
  if(views[id].stage==='play')for(let other=0;other<4;other++)if(other!==id)assert.deepEqual(views[id].round.players[other].hand,[]);
 }
}
const room=new SichuanRoom(match,m=>receive(0,m));
for(let id=1;id<4;id++)assert.ok(room.join(id,m=>receive(id,m)));
assert.ok(room.start(deck));
function submit(id,action){
 const msg={v:1,game:'sichuan-four',match,request:++requests[id],move:{revision:views[id].revision,action}};
 assert.ok(room.receive(id,msg),JSON.stringify(action));return msg;
}
for(let id=0;id<4;id++){
 const hand=views[id].setup.hand;
 const tiles=[0,1,2].map(s=>hand.filter(t=>t!==0&&Math.floor(t/9)===s)).find(t=>t.length>=3).slice(0,3);
 submit(id,{kind:'exchange',tiles});
}
assert.ok(views[0].setup.hand.every(t=>t<18),'Prepared opening must retain no bamboo after real exchange');
for(let id=0;id<4;id++)submit(id,{kind:'missing',suit:2});
assert.equal(views[0].stage,'play');assert.equal(views[0].round.phase,'turn');
assert.ok(views[0].round.legal.concealedKongs.includes(0),'Dealer opening kong must cross the session and room view');
const wall=views[0].round.wallCount;
const declaration=submit(0,{kind:'concealed-kong',tile:0});
assert.equal(views[0].round.phase,'draw');assert.equal(views[0].round.canDraw,true);
assert.deepEqual(views[0].balances,[6,-2,-2,-2]);
assert.equal(views[0].payments.length,3);
const before=JSON.stringify(views);
assert.equal(room.receive(0,declaration),false);assert.equal(JSON.stringify(views),before,'Replayed declaration must not charge again');
submit(0,{kind:'draw'});
assert.equal(views[0].round.wallCount,wall-1);assert.equal(views[0].round.phase,'turn');
assert.equal(views[0].round.players[0].hand.length,11);
assert.deepEqual(views[0].balances,[6,-2,-2,-2]);assert.equal(views[0].payments.length,3);
console.log('PASS: valid dealt wall -> four real exchanges -> four missing-suit choices -> dealer opening concealed kong -> replacement draw through seat-bound room requests; exact +6/-2/-2/-2, no duplicate charge, recipient privacy and ordered validated frames. Mock senders, not native WebRTC/device evidence.');
