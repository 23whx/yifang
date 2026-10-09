const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load;
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?core:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 const js=require.extensions['.js'];require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);

 const {createMcrRoundWithOpening,createMcrRound}=require('../lib/mahjong/vendor/mcr-rules.js'),{mcrOpeningView}=require('../lib/mahjong/mcr-opening.ts');
 const ids=['seat-1','seat-2','seat-3','seat-4'];let count=0,chains=0;
 for(let seed=0;seed<200;seed++){
  const config={playerIds:ids,seed,dealerId:ids[seed%4]},b=createMcrRoundWithOpening(config);
  assert.deepEqual(b.round,createMcrRound(config),'capturing must not alter the actual game');
  for(let i=0;i<b.opening.length;i++){
   count++;const s=b.opening[i],next=b.opening[i+1]??b.round,who=s.playerId;
   const inventory=[...s.wall,...Object.values(s.hands).flat(),...Object.values(s.flowers).flat()];
   assert.equal(inventory.length,144);assert.equal(new Set(inventory.map(t=>t.id)).size,144);
   assert.ok(s.hands[who].some(t=>t.id===s.flowerTile.id));assert.equal(next.wall.length,s.wall.length-1);
   assert.deepEqual(next.hands[who],[...s.hands[who].filter(t=>t.id!==s.flowerTile.id),s.wall.at(-1)]);
   assert.deepEqual(next.flowers[who],[...s.flowers[who],s.flowerTile]);
   for(const id of ids.filter(id=>id!==who)){assert.deepEqual(next.hands[id],s.hands[id]);assert.deepEqual(next.flowers[id],s.flowers[id]);}
   if(analysis.isMcrFlowerTile(s.wall.at(-1).face))chains++;
   for(let seat=0;seat<4;seat++){const v=mcrOpeningView(s,seat);assert.equal(v.flower===null,ids[seat]!==who);assert.ok(!('wall' in v)&&!('hands' in v));assert.deepEqual(v.hand,s.hands[ids[seat]]);v.hand.length=0;assert.ok(s.hands[ids[seat]].length>0);}
  }
 }
 assert.ok(count>0&&chains>0);
 const {newMcrSession,mcrSessionView,actMcrSession,closeMcrSession}=require('../lib/mahjong/mcr-session.ts');
 for(let seed=0;seed<80;seed++){
  let s=newMcrSession(seed,seed%4);const final=JSON.stringify(s.round);
  while(s.opening.length){
   const snap=s.opening[0],actor=ids.indexOf(snap.playerId),before=s;
   for(let id=0;id<4;id++){
    const v=mcrSessionView(s,id);assert.deepEqual(v.table.ownHand,snap.hands[ids[id]]);
    assert.deepEqual(v.table.publicFlowers,snap.flowers,'never reveal future opening flower replacements');
    assert.equal(v.table.wallCount,snap.wall.length);assert.equal(v.table.lastDrawnTileId,null);
    assert.equal(v.choices.length,id===actor?1:0);assert.equal(v.table.turnSource,'deal');
    assert.ok(!('opening' in v)&&!('wall' in v.table));
    if(id!==actor){assert.equal(v.table.pendingFlowerTileId,null);assert.throws(()=>actMcrSession(s,id,s.revision,0));}
    assert.throws(()=>actMcrSession(s,id,s.revision,'confirm'));
   }
   assert.throws(()=>actMcrSession(s,actor,s.revision,1));
   assert.equal(mcrSessionView(closeMcrSession(s),actor).choices.length,0);
   s=actMcrSession(s,actor,s.revision,0);
   assert.equal(s.opening.length,before.opening.length-1);assert.equal(JSON.stringify(s.round),final);
   assert.throws(()=>actMcrSession(s,actor,before.revision,0));
  }
  assert.equal(mcrSessionView(s,seed%4).table.phase,'discard');
 }
 console.log('PASS: 200 real shuffled openings, '+count+' one-flower transitions, '+chains+' chains; 80 session openings with actor-only stepping, stale/invalid guards, no future view, freeze and dealer handoff. Browser acceptance pending.');
})().catch(e=>{console.error(e);process.exitCode=1;});
