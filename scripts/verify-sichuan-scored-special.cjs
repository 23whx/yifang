const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {moveScoredSichuan}=require('../lib/mahjong/sichuan-scored.ts');
const {newSichuanLedger}=require('../lib/mahjong/sichuan-ledger.ts');
const all=Array.from({length:108},(_,i)=>Math.floor(i/4));
const waiting=[1,2,3,4,5,9,10,11,12,13,14,8,8];
function fixture(){
 const seats=[
  {hand:[0,18,19,20,21,22,23,24,25,26,18],melds:[{kind:'pung',tiles:[0,0,0],open:true}],missing:1,retired:false},
  {hand:[...waiting],melds:[],missing:2,retired:false},
  {hand:[...waiting],melds:[],missing:2,retired:false},
 ];
 const remaining=[...all];for(const p of seats)for(const t of [...p.hand,...p.melds.flatMap(m=>m.tiles)]){const i=remaining.indexOf(t);assert.ok(i>=0);remaining.splice(i,1);}
 seats.push({hand:remaining.splice(0,13),melds:[],missing:2,retired:true});
 return {revision:0,phase:'turn',actor:0,seats,wall:remaining,drawn:0,replacement:false,passed:[false,false,false,false],rivers:[],claims:null,added:null,events:[],end:null};
}

const rules={base:1,capMultiplier:32,missingSuitPenalty:32,retiredReceiveMissingPenalty:true,selfDrawExtra:1,afterKongDoublings:1,robbingDoublings:1,concealedKong:2,addedKong:1,discardKong:2};
function state(extra={}){return {round:fixture(),ledger:newSichuanLedger(),rules:{...rules,...extra},wallChecks:null};}
function act(s,id,move){const before=JSON.stringify(s),next=moveScoredSichuan(s,id,s.round.revision,move);assert.equal(JSON.stringify(s),before);assert.equal(next.ledger.balances.reduce((a,b)=>a+b,0),0);return next;}
for(const [extra,expected] of [[{},[-4,2,2,0]],[{robbingDoublings:0},[-2,1,1,0]],[{robbingDoublings:8,capMultiplier:4},[-8,4,4,0]]]){
 let s=act(state(extra),0,{kind:'added-kong',meld:0});
 assert.deepEqual(s.ledger.balances,[0,0,0,0]);
 s=act(s,1,{kind:'claim',choice:'win'});assert.equal(s.ledger.entries.length,0);
 s=act(s,2,{kind:'claim',choice:'win'});assert.deepEqual(s.ledger.balances,expected);
 assert.equal(s.ledger.entries.some(e=>e.kind==='kong'),false);
 const settled=JSON.stringify(s.ledger);s=act(s,0,{kind:'ack'});assert.equal(JSON.stringify(s.ledger),settled);
}
let s=act(state(),0,{kind:'added-kong',meld:0});s=act(s,1,{kind:'claim',choice:'pass'});s=act(s,2,{kind:'claim',choice:'pass'});
assert.deepEqual(s.ledger.balances,[2,-1,-1,0]);assert.equal(s.ledger.entries.length,2);
assert.throws(()=>moveScoredSichuan(s,2,s.round.revision-1,{kind:'claim',choice:'pass'}));
// A declared pung is not payable again; retired player 3 stays out.
s=act(s,0,{kind:'draw'});assert.deepEqual(s.ledger.balances,[2,-1,-1,0]);
console.log('PASS: exact double rob-kong payments, bonus disabled/capped, no premature or robbed kong charge, single committed kong charge, retired exclusion and acknowledgement without repeat payment.');
