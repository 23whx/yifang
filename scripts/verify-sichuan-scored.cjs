const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {newSichuanSetup,chooseSichuanMissing}=require('../lib/mahjong/sichuan-setup.ts');
const {newScoredSichuan,moveScoredSichuan}=require('../lib/mahjong/sichuan-scored.ts');
const rules={base:1,capMultiplier:32,missingSuitPenalty:32,retiredReceiveMissingPenalty:true,selfDrawExtra:1,afterKongDoublings:1,robbingDoublings:1,concealedKong:2,addedKong:1,discardKong:2};
const sessions=new WeakMap();let settled=0,entries=0;
function startSichuanRound(setup){const s=newScoredSichuan(setup,rules);sessions.set(s.round,s);return s.round;}
function moveSichuanRound(round,id,revision,move){
 const state=sessions.get(round);assert.ok(state);
 const before=JSON.stringify(state),s=moveScoredSichuan(state,id,revision,move);
 assert.equal(JSON.stringify(state),before);assert.equal(s.ledger.balances.reduce((a,b)=>a+b,0),0);
 assert.equal(new Set(s.ledger.events).size,s.ledger.events.length);
 for(let seat=0;seat<4;seat++)assert.equal(s.ledger.balances[seat],s.ledger.entries.reduce((n,e)=>n+(e.to===seat?e.amount:0)-(e.from===seat?e.amount:0),0));
 if(s.round.phase==='ended'){settled++;entries+=s.ledger.entries.length;if(s.round.end==='wall-empty')assert.ok(s.wallChecks);}
 sessions.set(s.round,s);return s.round;
}
const {sichuanOwnOptions}=require('../lib/mahjong/sichuan-actions.ts');
const base=Array.from({length:108},(_,i)=>Math.floor(i/4));let seed=51,steps=0,wins=0,kongs=0;
function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
function setup(deck){let s=newSichuanSetup(deck,0,1,false);for(let id=0;id<4;id++){const counts=[0,1,2].map(suit=>s.hands[id].filter(t=>Math.floor(t/9)===suit).length);s=chooseSichuanMissing(s,id,counts.indexOf(Math.min(...counts)));}return startSichuanRound(s);}
function inventory(s){const tiles=[...s.wall,...s.seats.flatMap(p=>[...p.hand,...p.melds.flatMap(m=>m.tiles)]),...s.rivers.filter(r=>!r.claimed).map(r=>r.tile)];assert.deepEqual(tiles.sort((a,b)=>a-b),base);}
for(let trial=0;trial<100;trial++){
 const deck=[...base];for(let i=107;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
 let s=setup(deck),limit=0;
 while(s.phase!=='ended'){
  assert.ok(++limit<500);inventory(s);const before=JSON.stringify(s);let id=s.actor,move;
  if(s.phase==='result'){id=0;move={kind:'ack'};wins++;}
  else if(s.phase==='claims'){id=s.claims.replies.indexOf(null);const o=s.claims.options[id];move={kind:'claim',choice:o.win?'win':o.kong?'kong':o.pung&&random()<0.3?'pung':'pass'};}
  else if(s.phase==='draw')move={kind:'draw'};
  else {
   const o=sichuanOwnOptions(s.seats[id],{drawn:s.drawn,wallRemaining:s.wall.length,passedWin:s.passed[id]});
   move=o.win?{kind:'win'}:o.concealedKongs.length?{kind:'concealed-kong',tile:o.concealedKongs[0]}:o.addedKongs.length?{kind:'added-kong',meld:o.addedKongs[0]}:{kind:'discard',tile:o.discards[Math.floor(random()*o.discards.length)]};
  }
  const next=moveSichuanRound(s,id,s.revision,move);assert.equal(JSON.stringify(s),before);assert.equal(next.revision,s.revision+1);
  assert.throws(()=>moveSichuanRound(next,id,s.revision,move));s=next;steps++;
 }
 inventory(s);assert.ok(['wall-empty','three-winners'].includes(s.end));kongs+=s.events.filter(e=>e.kind==='kong').length;
}
// A physically valid opening win fixture: fill dealer slots, then all others.
const hand=[0,1,2,3,4,5,9,10,11,12,13,14,8,8],deck=Array(108).fill(null),remaining=[...base];
hand.forEach((t,i)=>{deck[i<13?i*4:52]=t;remaining.splice(remaining.indexOf(t),1);});
for(let i=0;i<108;i++)if(deck[i]===null)deck[i]=remaining.shift();
let s=setup(deck);const start=structuredClone(s);s=moveSichuanRound(s,0,0,{kind:'win'});
assert.equal(s.phase,'result');assert.equal(s.seats[0].retired,true);assert.equal(s.wall.length,55);
assert.throws(()=>moveSichuanRound(s,1,s.revision,{kind:'draw'}));
s=moveSichuanRound(s,0,s.revision,{kind:'ack'});assert.equal(s.actor,1);assert.equal(s.phase,'draw');inventory(s);
assert.deepEqual(start,setup(deck));
assert.deepEqual(sessions.get(s).ledger.balances,[6,-2,-2,-2]);
assert.equal(settled,100);assert.ok(entries>100);
console.log(`Scored integration PASS: ${settled} terminal rounds, ${entries} payment entries; atomic transitions, duplicate guards, per-seat reconciled balances and zero-sum totals. Explicit test preset, not UI acceptance.`);
console.log(`PASS: 100 full wall-valid rounds, ${steps} actions, ${wins} win pauses, ${kongs} kong events; inventory/revisions/immutability plus opening win retirement and explicit acknowledgement. No scoring/UI claim.`);
