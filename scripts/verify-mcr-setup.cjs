const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {newMcrSetup:create,replaceMcrSetupFlower:replace,mcrSetupView:view,validateMcrDeck:validate}=require('../lib/mahjong/mcr-setup.ts');
const canonical=[...Array.from({length:136},(_,i)=>Math.floor(i/4)),...Array.from({length:8},(_,i)=>34+i)];
const sorted=a=>[...a].sort((a,b)=>a-b);let seed=31,steps=0;
for(let trial=0;trial<100;trial++)for(let dealer=0;dealer<4;dealer++){
 const deck=[...canonical];for(let i=143;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[deck[i],deck[j]]=[deck[j],deck[i]];}
 let s=create(deck,dealer),count=0;assert.equal(s.wall.length,91);
 while(s.phase==='flowers'){
  const id=s.actor,before=JSON.stringify(s),flower=s.hands[id].find(t=>t>=34),tail=s.wall.at(-1);
  assert.throws(()=>replace(s,(id+1)%4,s.revision,flower));assert.throws(()=>replace(s,id,s.revision+1,flower));assert.throws(()=>replace(s,id,s.revision,0));
  const next=replace(s,id,s.revision,flower);assert.equal(JSON.stringify(s),before);assert.equal(next.wall.length,s.wall.length-1);assert.equal(next.lastReplacement.tile,tail);
  assert.deepEqual(sorted([...next.wall,...next.hands.flat(),...next.flowers.flat()]),canonical);
  for(let who=0;who<4;who++){
   assert.equal(next.hands[who].length,who===dealer?14:13);
   const v=view(next,who);assert.equal('wall' in v,false);assert.equal('hands' in v,false);
   assert.equal(v.lastReplacement.tile,who===id?tail:null);
   v.hand[0]=99;assert.notEqual(next.hands[who][0],99);v.flowers[id].push(99);assert.ok(!next.flowers[id].includes(99));
  }
  s=next;steps++;assert.ok(++count<=8);
 }
 assert.equal(s.actor,null);assert.ok(s.hands.flat().every(t=>t<34));assert.throws(()=>replace(s,dealer,s.revision,34));
 assert.deepEqual(deck.length,144);
}
// Force a tail flower chain: each call consumes exactly one physical tile.
const chain=[...canonical];function swapTo(tile,index){const at=chain.indexOf(tile);[chain[at],chain[index]]=[chain[index],chain[at]];}
swapTo(34,0);swapTo(35,143);swapTo(36,142);
let s=create(chain);assert.equal(s.actor,0);s=replace(s,0,0,34);assert.equal(s.actor,0);assert.equal(s.lastReplacement.tile,35);assert.equal(s.revision,1);
s=replace(s,0,1,35);assert.equal(s.lastReplacement.tile,36);assert.equal(s.revision,2);
for(const bad of [canonical.slice(1),[...canonical,0],canonical.map(t=>t===41?40:t),canonical.map(t=>t===41?42:t)])assert.throws(()=>validate(bad));
assert.throws(()=>create(canonical,4));assert.throws(()=>view(s,-1));
console.log(`PASS: 400 MCR setups, ${steps} explicit replacements, all dealer positions, chained flowers, 144-tile conservation, revision/ownership and private-view guards. Setup only, not complete MCR play.`);
