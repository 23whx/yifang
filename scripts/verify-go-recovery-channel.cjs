const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {GoRecoverySession:S}=require('../lib/go/recovery-session.ts');
const {BoardRecoveryChannel:C}=require('../lib/board/recovery-channel.ts');
const {proposeBoardRecovery:propose,newBoardRecoverySecret:secret,boardRecoveryProof:proof,verifyBoardRecoveryProof:verify}=require('../lib/board/recovery-agreement.ts');
function apply(s,seat,action){const v=s.view();s.apply({seat,round:v.match.round,revision:v.revision,action});}
async function connect(h,g,wrong=false){
 const key=secret(),ends=[],accepted=[],epochs=[];let finish,failed=false,closed=false,timer,frames=0;
 const done=new Promise(r=>finish=r);
 const conn=i=>({open:true,on(){},send(raw){const frame=structuredClone(raw),text=JSON.stringify(frame);assert.ok(Buffer.byteLength(text,'utf8')<=65536);assert.ok(!text.includes(key));frames++;queueMicrotask(()=>{if(!closed)ends[1-i].receive(frame);});},close(){closed=true;queueMicrotask(()=>ends.forEach(e=>e.stop()));}});
 for(const i of [0,1])ends.push(new C(conn(i),null,'go',i?'guest':'host',wrong&&i?secret():key,i?g:h,(text,epoch)=>{accepted[i]=text;epochs[i]=epoch;if(accepted[0]&&accepted[1])finish();},()=>{failed=true;finish();}));
 try{
  ends[1].open();ends[0].open();await Promise.race([done,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Timeout')),10000);})]);
  if(wrong){assert.ok(failed);assert.equal(accepted.length,0);}else{assert.ok(!failed);assert.equal(accepted[0],accepted[1]);assert.equal(epochs[0],epochs[1]);}
  return {text:accepted[0],frames};
 }finally{clearTimeout(timer);closed=true;ends.forEach(e=>e.stop());}
}
(async()=>{
 const s=new S('go-channel-original-match');apply(s,0,{kind:'move',point:40});apply(s,1,{kind:'move',point:0});apply(s,0,{kind:'move',point:null});apply(s,1,{kind:'move',point:null});
 const before=s.checkpoint();apply(s,0,{kind:'review',proposal:0,action:{kind:'toggle',point:0}});apply(s,1,{kind:'review',proposal:1,action:{kind:'confirm'}});const partial=s.checkpoint();
 for(const [h,g] of [[partial,partial],[before,partial],[partial,before]]){const r=await connect(h,g);assert.equal(r.text,partial);const restored=S.restore(r.text);assert.deepEqual(restored.view().review,{revision:2,dead:[0],approved:[false,true],resumed:false});apply(restored,0,{kind:'review',proposal:2,action:{kind:'confirm'}});assert.ok(restored.view().ended);}
 await connect(partial,partial,true);
 const fork=S.restore(before);apply(fork,0,{kind:'review',proposal:0,action:{kind:'toggle',point:40}});
 await assert.rejects(()=>propose(null,'go',partial,fork.checkpoint()),/Divergent/);
 await assert.rejects(()=>propose(null,'go',partial,new S('different-go-original-match').checkpoint()),/Different/);
 const p=await propose(null,'go',before,partial),key=secret(),c={game:'go',identity:p.identity,epoch:crypto.randomUUID(),hostNonce:secret(),guestNonce:secret(),hostDigest:p.hostDigest,guestDigest:p.guestDigest,agreedDigest:p.agreedDigest};
 const signed=await proof(key,c,'host');assert.ok(await verify(key,c,'host',signed));
 for(const changed of [{...c,game:'chess'},{...c,epoch:crypto.randomUUID()},{...c,agreedDigest:secret()},{...c,guestNonce:secret()}])assert.equal(await verify(key,changed,'host',signed),false);
 assert.equal(await verify(key,c,'guest',signed),false);
 apply(s,0,{kind:'review',proposal:2,action:{kind:'confirm'}});let previous;
 for(let round=0;round<400;round++){for(const [seat,kind] of [[0,'rematch'],[1,'rematch'],[0,'resign']]){previous=s.checkpoint();apply(s,seat,{kind});}}
 assert.ok(s.checkpoint().length>65536);const large=await connect(previous,s.checkpoint());assert.equal(large.text,s.checkpoint());assert.ok(large.frames>10);
 console.log('PASS: Go recovery uses real WebCrypto with no WASM: equal/host-ahead/guest-ahead scoring histories, continued final approval, divergent proposal and identity rejection, wrong credential/cross-game/epoch/nonce/digest/role rejection, >64KB ACK-paced history. Mock connections; no browser UI claim.');
})().catch(e=>{console.error(e);process.exitCode=1;});
