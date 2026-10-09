const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {moveSichuanRound}=require('../lib/mahjong/sichuan-round.ts');
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
function inventory(s){assert.deepEqual([...s.wall,...s.seats.flatMap(p=>[...p.hand,...p.melds.flatMap(m=>m.tiles)]),...s.rivers.filter(r=>!r.claimed).map(r=>r.tile)].sort((a,b)=>a-b),all);}
function act(s,id,move){const before=JSON.stringify(s),next=moveSichuanRound(s,id,s.revision,move);assert.equal(JSON.stringify(s),before);inventory(next);return next;}
for(const order of [[1,2],[2,1]]){
 let s=fixture();inventory(s);s=act(s,0,{kind:'added-kong',meld:0});
 assert.equal(s.phase,'claims');assert.equal(s.seats[0].melds[0].kind,'pung');assert.equal(s.seats[0].hand.includes(0),true);
 s=act(s,order[0],{kind:'claim',choice:'win'});assert.equal(s.phase,'claims');
 s=act(s,order[1],{kind:'claim',choice:'win'});assert.equal(s.phase,'result');
 assert.equal(s.events.filter(e=>e.kind==='kong').length,0);assert.equal(s.seats[0].melds[0].tiles.length,3);
 assert.equal(s.seats[0].hand.includes(0),false);assert.deepEqual(s.events[0].seats,[1,2]);
 assert.equal(s.events[0].robbing,true);assert.equal(s.wall.length,55);
 s=act(s,0,{kind:'ack'});assert.equal(s.phase,'ended');assert.equal(s.end,'three-winners');
}
let s=act(fixture(),0,{kind:'added-kong',meld:0});
s=act(s,1,{kind:'claim',choice:'pass'});s=act(s,2,{kind:'claim',choice:'pass'});
assert.equal(s.phase,'draw');assert.equal(s.replacement,true);assert.equal(s.events.length,1);
assert.equal(s.seats[0].melds[0].tiles.length,4);assert.equal(s.passed[1],true);assert.equal(s.passed[2],true);
const replacement=s.wall.at(-1);s=act(s,0,{kind:'draw'});assert.equal(s.drawn,replacement);assert.equal(s.wall.length,54);
// A single winner retires; next active player after that winner draws, not the discarder.
s=act(fixture(),0,{kind:'added-kong',meld:0});s=act(s,1,{kind:'claim',choice:'win'});s=act(s,2,{kind:'claim',choice:'pass'});
s=act(s,0,{kind:'ack'});assert.equal(s.phase,'draw');assert.equal(s.actor,2);
s=act(s,2,{kind:'draw'});assert.equal(s.passed[2],false);assert.equal(s.seats[1].retired,true);
console.log('PASS: inventory-valid double rob-kong in both response orders, rollback vs commit, retained result, third-winner end, tail replacement and single-winner turn/pass reset. Fixtures start mid-round, not generated histories.');
