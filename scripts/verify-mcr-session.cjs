const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
(async()=>{
 const core=await import('miaoda-game-mcr-mahjong-rules'),analysis=await import('miaoda-game-mcr-mahjong-analysis-core'),load=Module._load;
 Module._load=function(request,...args){return request==='miaoda-game-mcr-mahjong-rules'?core:request==='miaoda-game-mcr-mahjong-analysis-core'?analysis:load.call(this,request,...args);};
 const js=require.extensions['.js'];require.extensions['.js']=(m,f)=>f.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](m,f):js(m,f);
 const {newMcrSession:create,mcrSessionView:view,actMcrSession:act,closeMcrSession:close}=require('../lib/mahjong/mcr-session.ts');
 const {mcrDisplayChoices:display,mcrMeldDisplayTiles}=require('../lib/mahjong/mcr-choice-display.ts');
 for(const suit of ['m','p','s'])for(let first=1;first<=7;first++)for(let claimed=0;claimed<3;claimed++){
  const tiles=[0,1,2].map((n)=>({face:`${first+n}${suit}`,id:`${first+n}${suit}:0`}));
  const source=[...tiles.filter((_,i)=>i!==claimed),tiles[claimed]],before=JSON.stringify(source);
  assert.deepEqual(mcrMeldDisplayTiles({kind:'chow',tiles:source}),tiles);
  assert.equal(JSON.stringify(source),before,'display must not reorder host meld tiles');
  assert.deepEqual(mcrMeldDisplayTiles({kind:'pung',tiles:source}),source,'only chow display is sorted');
 }
 const example=[
  {index:4,type:'claim-discard',claim:'chow',tileIds:['2m:0','3m:0']},
  {index:5,type:'claim-discard',claim:'chow',tileIds:['3m:1','2m:1']},
  {index:6,type:'claim-discard',claim:'chow',tileIds:['3m:0','4m:0']},
  {index:7,type:'discard',claim:null,tileIds:['2m:0']},
  {index:8,type:'discard',claim:null,tileIds:['2m:1']},
 ];
 const untouched=JSON.stringify(example);
 assert.deepEqual(display(example).map(c=>c.index),[4,6,7,8]);
 assert.equal(display(example)[0],example[0]);assert.equal(JSON.stringify(example),untouched);
 const faceKey=c=>c.tileIds.map(id=>id.split(':')[0]).sort().join('|');
 // Ignore physical-copy identity and concealed-hand display order only.
 // Wall order, action order, meld order, claim responses and turn data remain.
 const faceState=s=>{
  const round=JSON.parse(JSON.stringify(s.round,(key,value)=>key==='copy'?undefined:typeof value==='string'?value.replace(/\b([1-9][mps]|[ESWNCFP]):\d+\b/g,'$1'):value));
  for(const hand of Object.values(round.hands))hand.sort((a,b)=>a.face.localeCompare(b.face));
  return round;
 };
 let collapsed=0;
 // Authored physical-inventory-valid mid-hand, not a claimed generated replay.
 // It forces the previously missing declared-pung knitted straight into the
 // real session's legal-action and terminal settlement path.
 const directed=create(81),r=structuredClone(directed.round),pool=[...analysis.createMcrTileSet()];
 const take=face=>{const i=pool.findIndex(t=>t.face===face);assert.ok(i>=0);return pool.splice(i,1)[0];};
 r.hands['seat-1']=['1m','4m','7m','2p','5p','8p','3s','6s','9s','E','E'].map(take);
 const pung=['C','C','C'].map(take);
 r.melds=Object.fromEntries(r.playerOrder.map(id=>[id,[]]));r.melds['seat-1']=[{kind:'pung',exposure:'melded',tiles:pung,claimedTileId:pung[0].id,fromPlayerId:'seat-2'}];
 for(const id of r.playerOrder.slice(1)){r.hands[id]=[];while(r.hands[id].length<13){const i=pool.findIndex(t=>analysis.isMcrStructureTile(t.face));r.hands[id].push(pool.splice(i,1)[0]);}}
 r.flowers=Object.fromEntries(r.playerOrder.map(id=>[id,[]]));r.wall=pool;r.discardPile=[];r.activePlayerId='seat-1';r.phase='discard';r.drewThisTurn=true;r.lastDrawnTileId=r.hands['seat-1'].at(-1).id;r.turnSource='wall';r.pendingFlowerTileId=null;r.claimWindow=null;r.actionHistory=[];r.winResult=null;r.drawResult=null;
 const fixture={...directed,round:r,opening:[]},win=view(fixture,0).choices.find(c=>c.type==='declare-self-draw');assert.ok(win,'Corrected Hu option must exist');
 const won=act(fixture,0,fixture.revision,win.index);assert.equal(won.round.phase,'finished');assert.equal(won.round.winResult.analysis.nonFlowerTotal,22);assert.deepEqual(Object.values(won.round.winResult.settlement.deltas),[90,-30,-30,-30]);
 let actions=0,wins=0,draws=0;const phases=new Set();
 for(let seed=1;seed<=12;seed++){
  let s=create(seed),steps=0;
  while(s.round.phase!=='finished'){
   phases.add(s.round.phase);let selected;
   for(let id=0;id<4;id++){
    const v=view(s,id);assert.equal('initialSeed' in v.table,false);assert.equal('hands' in v.table,false);assert.equal('wall' in v.table,false);assert.equal(v.table.viewerId,`seat-${id+1}`);
    const shown=display(v.choices);
    for(const choice of v.choices.filter(c=>!shown.includes(c))){
     const representative=shown.find(c=>c.type===choice.type&&c.claim===choice.claim&&faceKey(c)===faceKey(choice));
     assert.ok(representative);
     const a=faceState(act(s,id,s.revision,representative.index)),b=faceState(act(s,id,s.revision,choice.index));
     for(const key of Object.keys(a))assert.deepEqual(a[key],b[key],`Equivalent chow differs at ${key}`);
     collapsed++;
    }
    const live=JSON.stringify(s);if(v.table.ownHand[0])v.table.ownHand[0].face='BAD';assert.equal(JSON.stringify(s),live);
    if(v.choices.length&&!selected){
     const choice=shown.find(c=>c.claim==='win'||c.type==='declare-self-draw')??shown.find(c=>c.type==='replace-flower')??shown.find(c=>c.claim==='kong'||c.claim==='pung'||c.claim==='chow')??shown[0];selected={id,choice:choice.index};
    }
   }
   assert.ok(selected,'Nonterminal state must permit an action');const before=JSON.stringify(s),old=s;
   s=act(s,selected.id,s.revision,selected.choice);assert.equal(JSON.stringify(old),before);assert.throws(()=>act(s,selected.id,old.revision,selected.choice));
   const all=[...s.round.wall,...s.round.discardPile,...Object.values(s.round.hands).flat(),...Object.values(s.round.flowers).flat(),...Object.values(s.round.melds).flatMap(ms=>ms.flatMap(m=>m.tiles))];
   assert.equal(all.length,144);assert.equal(new Set(all.map(t=>t.id)).size,144);
   actions++;assert.ok(++steps<1000);
  }
  if(s.round.winResult){wins++;assert.equal(Object.values(s.round.winResult.settlement.deltas).reduce((a,b)=>a+b,0),0);}else {draws++;assert.ok(s.round.drawResult);}
  const result=JSON.stringify(s.round);for(let id=0;id<4;id++){s=act(s,id,s.revision,'confirm');assert.equal(JSON.stringify(s.round),result);assert.throws(()=>act(s,id,s.revision,'confirm'));}
  assert.ok(s.confirmed.every(Boolean));const stopped=close(s);assert.equal(view(stopped,0).choices.length,0);assert.throws(()=>act(stopped,0,stopped.revision,0));
 }
 console.log(`PASS: 12 real MCR library rounds, ${actions} actions, ${wins} wins, ${draws} draws; phases ${[...phases]}; physical inventory, seat views, stale input, retained four-way result confirmation and shutdown. Headless library integration, not complete rules/browser proof.`);
 assert.ok(collapsed>0,'Generated rounds must exercise duplicate physical chow choices');
 console.log(`PASS: ${collapsed} duplicate chow choices have equivalent face-level outcomes; displayed choices retain original host indexes.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
