// Random-policy fuzzing for the Sichuan and MCR engines. Unlike the scripted
// sweeps, every seat picks uniformly among its legal actions, which reaches
// rare branches (robbing kongs, multiple claims, last-tile wins, flower chains).
// Invariants per step: physical tiles conserved, ledgers sum to zero, views
// never leak the wall or other hands, some seat can always act, hands terminate.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),Module=require('node:module');
const root=path.resolve(__dirname,'..'),resolve=Module._resolveFilename;
Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.join(root,request.slice(2)):request,...args);};
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const games=Number(process.argv[2]??150);
let seed=20261011;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const pick=list=>list[Math.floor(rand()*list.length)];

(async()=>{
 // ---------- Sichuan Blood Battle ----------
 const {newSichuanSession,applySichuanSession,sichuanSessionView}=require('../lib/mahjong/sichuan-session.ts');
 const sc={games:0,steps:0,wins:0,kongs:0,claims:0,wallEnds:0,threeWinners:0};
 function sichuanTiles(r){
  const counts=Array(27).fill(0);
  const add=t=>{assert.ok(Number.isInteger(t)&&t>=0&&t<27,'tile id in range');counts[t]++;};
  r.wall.forEach(add);r.seats.forEach(p=>{p.hand.forEach(add);p.melds.forEach(m=>m.tiles.forEach(add));});
  r.rivers.filter(x=>!x.claimed).forEach(x=>add(x.tile));
  if(r.drawn!==null&&r.drawn!==undefined&&r.seats[r.actor]&&!r.seats[r.actor].hand.includes(r.drawn))add(r.drawn);
  return counts;
 }
 function sichuanActions(v){
  const out=[];
  if(v.stage==='setup'){
   const s=v.setup,id=s.seat;
   if(s.phase==='exchange'&&!s.exchangeChosen[id]){
    const suits=[0,1,2].map(suit=>s.hand.filter(t=>Math.floor(t/9)===suit)).filter(h=>h.length>=3);
    const hand=pick(suits);const copy=[...hand];const tiles=[];for(let i=0;i<3;i++)tiles.push(copy.splice(Math.floor(rand()*copy.length),1)[0]);
    out.push({kind:'exchange',tiles});
   }
   if(s.phase==='missing'&&!s.missingChosen[id])out.push({kind:'missing',suit:Math.floor(rand()*3)});
   return out;
  }
  const r=v.round;
  if(r.phase==='result'&&!v.confirmed[r.seat])out.push({kind:'ack'});
  if(r.claim?.reply===null){const o=r.claim.options;out.push({kind:'claim',choice:'pass'});for(const c of ['win','kong','pung'])if(o[c])out.push({kind:'claim',choice:c});}
  if(r.canDraw)out.push({kind:'draw'});
  if(r.legal){const o=r.legal;if(o.win)out.push({kind:'win'});o.concealedKongs.forEach(t=>out.push({kind:'concealed-kong',tile:t}));o.addedKongs.forEach(m=>out.push({kind:'added-kong',meld:m}));o.discards.forEach(t=>out.push({kind:'discard',tile:t}));}
  return out;
 }
 // Mixed policy: nearly always take a win, often keep pairs/sequences, otherwise act randomly.
 function chooseSichuan(options,s){
  const wins=options.filter(o=>o.action.kind==='win'||o.action.choice==='win');
  if(wins.length&&rand()<0.95)return pick(wins);
  const kongs=options.filter(o=>/kong/.test(o.action.kind)||o.action.choice==='kong');
  if(kongs.length&&rand()<0.5)return pick(kongs);
  const discards=options.filter(o=>o.action.kind==='discard');
  if(discards.length&&rand()<0.7&&s.game){const id=discards[0].id,p=s.game.round.seats[id],hand=p.hand;
   const off=t=>Math.floor(t/9)===p.missing?-10:0,strength=t=>off(t)+hand.filter(x=>x===t).length*3+hand.filter(x=>Math.floor(x/9)===Math.floor(t/9)&&Math.abs(x-t)<=2).length;
   return [...discards].sort((x,y)=>strength(x.action.tile)-strength(y.action.tile))[0];}
  return pick(options);
 }
 for(let g=0;g<games;g++){
  const deck=Array.from({length:108},(_,i)=>i%27);for(let i=107;i>0;i--){const j=Math.floor(rand()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
  let s=newSichuanSession(deck,g%4),steps=0;
  while(true){
   assert.ok(++steps<3000,`Sichuan game ${g} did not terminate`);
   if(s.game){
    const counts=sichuanTiles(s.game.round);
    assert.ok(counts.every(n=>n===4),`Sichuan game ${g} step ${steps}: tiles not conserved ${counts.join(',')}`);
    assert.equal(s.game.ledger.balances.reduce((a,b)=>a+b,0),0,`Sichuan game ${g}: ledger does not sum to zero`);
    if(s.game.round.phase==='ended')break;
   }
   const options=[];
   for(let id=0;id<4;id++){
    const v=sichuanSessionView(s,id);
    if(v.stage==='play'){
     assert.equal('wall' in v.round,false,'wall never sent');
     v.round.players.forEach((p,i)=>{if(i!==id&&!p.retired)assert.equal(p.hand.length,0,'other active hands hidden');});
    }
    for(const action of sichuanActions(v))options.push({id,action});
   }
   assert.ok(options.length,`Sichuan game ${g} step ${steps}: no seat can act`);
   const {id,action}=chooseSichuan(options,s);
   const before=s.game?.round.events.length??0;
   s=applySichuanSession(s,id,s.revision,action);
   if(action.kind==='claim'&&action.choice!=='pass')sc.claims++;
   if(s.game){for(const e of s.game.round.events.slice(before)){if(e.kind==='win')sc.wins+=e.seats.length;else sc.kongs++;}}
  }
  sc.games++;sc.steps+=steps;if(s.game.round.end==='wall-empty')sc.wallEnds++;else sc.threeWinners++;
 }
 console.log(`PASS Sichuan fuzz: ${sc.games} random-policy hands, ${sc.steps} steps, ${sc.wins} wins, ${sc.kongs} kongs, ${sc.claims} claims, ${sc.threeWinners} three-winner / ${sc.wallEnds} wall-empty endings; tiles conserved, ledgers zero-sum, no leaks, no deadlocks.`);

 // ---------- MCR ----------
 const rules=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load,js=require.extensions['.js'];
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?rules:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {newMcrMatch,mcrMatchView,actMcrMatch}=require('../lib/mahjong/mcr-match.ts');
 const mc={hands:0,steps:0,wins:0,draws:0};
 const mcrGames=Math.max(4,Math.floor(games/10));
 for(let g=0;g<mcrGames;g++){
  let m=newMcrMatch(9000+g),steps=0;
  while(true){
   assert.ok(++steps<20000,`MCR match ${g} did not terminate`);
   const r=m.session.round,tiles=[...r.wall,...r.discardPile,...Object.values(r.hands).flat(),...Object.values(r.flowers).flat(),...Object.values(r.melds).flatMap(ms=>ms.flatMap(x=>x.tiles))];
   assert.equal(tiles.length,144,`MCR match ${g}: tile count`);assert.equal(new Set(tiles.map(t=>t.id)).size,144,`MCR match ${g}: unique tiles`);
   assert.equal(m.ledger.balances.reduce((a,b)=>a+b,0),0,`MCR match ${g}: ledger zero-sum`);
   const options=[];let complete=false;
   for(let id=0;id<4;id++){
    const v=mcrMatchView(m,id);complete=v.complete;
    assert.equal('wall' in v.table,false,'MCR wall hidden');assert.equal('hands' in v.table,false,'MCR hands hidden');
    v.choices.forEach((c,i)=>options.push({id,choice:i,win:c.type==='declare-self-draw'||c.claim==='win'}));
    if(v.canConfirm)options.push({id,choice:'confirm'});
    if(v.canNext)options.push({id,choice:'next'});
   }
   if(complete)break;
   assert.ok(options.length,`MCR match ${g} step ${steps}: no seat can act`);
   const wins=options.filter(o=>o.win);
   const {id,choice}=wins.length&&rand()<0.95?pick(wins):pick(options),hand=m.hand,phase=m.session.round.phase;
   m=actMcrMatch(m,id,m.revision,choice);
   if(m.hand!==hand){mc.hands++;}
   if(phase!=='finished'&&m.session.round.phase==='finished'){if(m.session.round.winResult)mc.wins++;else mc.draws++;}
  }
  mc.steps+=steps;
 }
 console.log(`PASS MCR fuzz: ${mcrGames} random-policy 16-hand matches, ${mc.steps} steps, ${mc.wins} wins / ${mc.draws} draws; 144 unique tiles conserved, ledgers zero-sum, no leaks, no deadlocks.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
