// Random-policy fuzzing of the four-human riichi table in controlled mode
// (no timers). Each pending seat decision is answered with a random legal
// choice, biased toward wins so scoring branches are exercised. Every match
// must finish, and final scores must conserve the 100,000-point table total.
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {RiichiSession,chooseRiichiPractice}=require('../lib/mahjong/riichi-session.ts');
const matches=Number(process.argv[2]??12);
let seed=4242;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
const saved=Math.random;Math.random=rand; // Wall shuffles become reproducible.
const pick=list=>list[Math.floor(rand()*list.length)];
const stats={matches:0,decisions:0,hands:0,wins:0,riichi:0,calls:0};
try{
 for(let n=0;n<matches;n++){
  const pending=new Map();let finished;
  const session=new RiichiSession({controlled:true,thinkMs:0,onEvent:()=>{},onDecision:()=>{},onFinish:s=>finished=s,
   multiplayer:{onEvent:(id,e)=>{if(id===0&&e.qipai)stats.hands++;if(id===0&&e.hule)stats.wins++;},onDecision:(id,d)=>pending.set(id,d),onState:()=>{}}});
  assert.equal(session.start(),true);
  let guard=0;
  while(!finished){
   session.drain();
   if(finished)break;
   assert.ok(++guard<20000,`riichi match ${n} did not finish`);
   assert.ok(pending.size,`riichi match ${n}: no seat has a decision (deadlock)`);
   const [id,d]=pick([...pending]);pending.delete(id);
   const wins=d.choices.filter(c=>c.kind==='ron'||c.kind==='tsumo');
   // Mostly the shanten-reducing practice policy (reaches tenpai and wins), sometimes random.
   const c=wins.length&&rand()<0.9?pick(wins):d.choices.find(c=>c.kind==='continue')||(rand()<0.7?chooseRiichiPractice(session.players[id],d.choices):pick(d.choices));
   if(c.kind==='riichi')stats.riichi++;if(['chi','pon','kan'].includes(c.kind))stats.calls++;
   assert.equal(session.submitFor(id,d.revision,c.id),true,'legal choice accepted');
   assert.equal(session.submitFor(id,d.revision,c.id),false,'a decision cannot be answered twice');
   stats.decisions++;
  }
  // Leftover riichi deposits may remain on the table at match end under WRC-style rules.
  const total=finished.scores.reduce((a,b)=>a+b,0);
  assert.ok(total<=100000&&(100000-total)%1000===0,`riichi match ${n}: scores ${finished.scores} do not conserve the table total`);
  assert.deepEqual([...finished.ranks].sort(),[1,2,3,4],'ranks are a permutation');
  stats.matches++;session.stop();
 }
}finally{Math.random=saved;}
console.log(`PASS riichi fuzz: ${stats.matches} random-policy East-round matches, ${stats.hands} hands, ${stats.decisions} decisions, ${stats.wins} wins, ${stats.riichi} riichi, ${stats.calls} calls; all finish, scores conserve 100,000 less table deposits, no deadlocks or double answers.`);
