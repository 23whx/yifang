const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {newSichuanSetup,chooseSichuanMissing}=require('../lib/mahjong/sichuan-setup.ts');
const {startSichuanRound}=require('../lib/mahjong/sichuan-round.ts');
const {sichuanRoundView}=require('../lib/mahjong/sichuan-view.ts');
let setup=newSichuanSetup(Array.from({length:108},(_,i)=>i%27),0,1,false);
for(let i=0;i<4;i++)setup=chooseSichuanMissing(setup,i,2);
const s=startSichuanRound(setup);
for(let id=0;id<4;id++){
 const v=sichuanRoundView(s,id);assert.equal('wall' in v,false);assert.equal('passed' in v,false);assert.equal('seats' in v,false);
 for(let i=0;i<4;i++)assert.equal(v.players[i].hand.length,i===id?s.seats[i].hand.length:0);
 assert.equal(v.legal!==null,id===s.actor);
 const changed=structuredClone(s);const others=[0,1,2,3].filter(i=>i!==id);
 [changed.seats[others[0]].hand[0],changed.wall[0]]=[changed.wall[0],changed.seats[others[0]].hand[0]];
 assert.deepEqual(sichuanRoundView(changed,id),v);
 v.players[id].hand[0]=99;assert.notEqual(s.seats[id].hand[0],99);
}
assert.throws(()=>sichuanRoundView(s,4));
console.log('PASS: per-seat concealed-card allowlist, no wall/internal state, actor-only actions, detached hands and hidden-card/wall noninterference.');
