// MCR fan 40 is defined by faces, not by the absence of kongs.
// EMA rulebook: https://mahjong-europe.org/portal/images/docs/mcr_ENa5.pdf
const fs = require('node:fs'), ts = require('typescript'), Module = require('node:module');
const assert = require('node:assert/strict');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, f);
(async () => {
  const core = await import('miaoda-game-mcr-mahjong-analysis-core');
  const rules = await import('miaoda-game-mcr-mahjong-rules');
  const load = Module._load, js = require.extensions['.js'];
  Module._load = function (request, ...args) { return request === 'miaoda-game-mcr-mahjong-analysis-core' ? core : request === 'miaoda-game-mcr-mahjong-rules' ? rules : load.call(this, request, ...args); };
  require.extensions['.js'] = (m, f) => f.replaceAll('\\', '/').includes('/mahjong/vendor/') ? require.extensions['.ts'](m, f) : js(m, f);
  const { scoreMcrHand: score, mcrTileFace } = require('../lib/mahjong/mcr-score.ts');
  const groups = [10, 12, 23, 25]; // 222p 444p 666s 888s, pair White
  const make = (mask, pair = 33) => ({
    concealedBeforeWin: [pair], winningTile: pair,
    melds: groups.map((tile, i) => ({ kind: mask & (1 << i) ? 'kong' : 'pung', tiles: Array(mask & (1 << i) ? 4 : 3).fill(tile), open: true })),
    winner: 0, from: 0, roundWind: 0, seatWind: 1, source: 'wall', flowers: [], lastWallEvent: false, lastCopy: false,
  });
  for (let mask = 0; mask < 16; mask++) {
    const input = make(mask), before = JSON.stringify(input), result = score(input);
    assert.ok(result.ok, `kong mask ${mask}`);
    assert.ok(result.analysis.fanCodes.includes('mcr-40'), `Reversible Tiles lost with kong mask ${mask}`);
    assert.equal(result.analysis.occurrences.filter(o => o.fanCode === 'mcr-40').reduce((n, o) => n + o.points, 0), 8);
    assert.equal(result.analysis.occurrences.filter(o => o.fanCode === 'mcr-49').reduce((n, o) => n + o.points, 0), 6,'Kongs still count as Pungs for All Pungs');
    assert.ok(!result.analysis.fanCodes.includes('mcr-75'), 'do not add One Voided Suit');
    assert.equal(JSON.stringify(input), before);
    // Four pungs + single wait + self draw = 6+1+1 in addition to fan40.
    // A single exposed kong adds exactly one point and does not erase fan40.
    if (mask === 0 || (mask & (mask - 1)) === 0) {
      const points = mask === 0 ? 16 : 17;
      assert.equal(result.analysis.nonFlowerTotal, points);
      assert.deepEqual(result.settlement.delta, [3 * (points + 8), -points - 8, -points - 8, -points - 8]);
    }
    for (const pair of [0, 14, 15, 18, 20, 24, 27, 31, 32]) {
      const counter = score(make(mask, pair));
      assert.ok(!counter.ok || !counter.analysis.fanCodes.includes('mcr-40'), `non-reversible pair ${pair}`);
      if (!counter.ok) assert.equal(counter.reason, 'below-minimum');
    }
  }
  // EMA MCR rule 40, example 1: two 345p chows, two 456s chows,
  // and a 5p pair. All five tiles are reversible; the pair supplies a
  // non-kong fourth 5p for Tile Hog, and both chow pairs are independent.
  const chowTiles=[11,12,13,21,22,23,21,22,23];
  const chowInput=pair=>({concealedBeforeWin:[...chowTiles,pair],winningTile:pair,
    melds:[{kind:'chow',tiles:[11,12,13],open:true}],
    winner:0,from:0,roundWind:0,seatWind:1,source:'wall',flowers:[],lastWallEvent:false,lastCopy:false});
  for(const pair of [12,13,22,23]){
    const input=chowInput(pair),result=score(input),codes=result.analysis?.fanCodes??[];
    assert.ok(result.ok,`Reversible four-chow hand with pair ${pair}`);
    assert.ok(codes.includes('mcr-40'),`Reversible Tiles with pair ${pair}`);
    assert.ok(codes.includes('mcr-63'),`All Chows can combine with Reversible Tiles: ${pair} ${JSON.stringify(codes)}`);
    assert.equal(result.analysis.occurrences.filter(o=>o.fanCode==='mcr-69').length,2,'Two disjoint Pure Double Chows');
    assert.equal(codes.includes('mcr-31'),pair===13||pair===22,'All Fives requires the pair to be a five');
    assert.equal(codes.includes('mcr-64'),true,'Pair makes four physical copies without a kong');
    assert.equal(result.analysis.occurrences.filter(o=>o.fanCode==='mcr-64').reduce((n,o)=>n+o.points,0),2);
    assert.ok(!codes.includes('mcr-75'),'Reversible Tiles absorbs One Voided Suit');
    const n=result.analysis.nonFlowerTotal;
    assert.deepEqual(result.settlement.delta,[3*(n+8),-n-8,-n-8,-n-8]);
  }
  const {newMcrSession, mcrSessionView, actMcrSession} = require('../lib/mahjong/mcr-session.ts');
  // Authored valid-inventory middle-hand states, not browser/state injection or
  // a claim that these histories have been played from the initial shuffle.
  for (let mask = 0; mask < 16; mask++) {
    const session = newMcrSession(42), round = structuredClone(session.round);
    const pool = [...core.createMcrTileSet()];
    const take = face => { const i = pool.findIndex(t => t.face === face); assert.ok(i >= 0); return pool.splice(i, 1)[0]; };
    round.hands = Object.fromEntries(round.playerOrder.map(id => [id, []]));
    round.melds = Object.fromEntries(round.playerOrder.map(id => [id, []]));
    round.flowers = Object.fromEntries(round.playerOrder.map(id => [id, []]));
    round.hands['seat-1'] = [take('P'), take('P')];
    round.melds['seat-1'] = ['2p', '4p', '6s', '8s'].map((face, i) => {
      const kong = Boolean(mask & (1 << i)), tiles = Array.from({length: kong ? 4 : 3}, () => take(face));
      return {kind: kong ? 'kong' : 'pung', exposure: 'melded', tiles, claimedTileId: tiles[0].id, fromPlayerId: 'seat-2'};
    });
    for (const id of round.playerOrder.slice(1)) while (round.hands[id].length < 13) {
      const i = pool.findIndex(t => core.isMcrStructureTile(t.face));
      round.hands[id].push(pool.splice(i, 1)[0]);
    }
    Object.assign(round, {wall: pool, discardPile: [], activePlayerId: 'seat-1', phase: 'discard', turnSource: 'wall',
      drewThisTurn: true, lastDrawnTileId: round.hands['seat-1'][1].id, pendingFlowerTileId: null,
      claimWindow: null, actionHistory: [], winResult: null, drawResult: null});
    const inventory = [...pool, ...Object.values(round.hands).flat(), ...Object.values(round.melds).flat().flatMap(m => m.tiles)];
    assert.equal(inventory.length, 144); assert.equal(new Set(inventory.map(t => t.id)).size, 144);
    const state = {...session, round, opening: []}, before = JSON.stringify(state);
    const choice = mcrSessionView(state, 0).choices.find(c => c.type === 'declare-self-draw');
    assert.ok(choice, `live legal win mask ${mask}`);
    const next = actMcrSession(state, 0, state.revision, choice.index);
    assert.equal(next.round.phase, 'finished');
    assert.ok(next.round.winResult.analysis.fanCodes.includes('mcr-40'));
    assert.equal(next.round.winResult.analysis.occurrences.filter(o=>o.fanCode==='mcr-49').reduce((n,o)=>n+o.points,0),6);
    assert.equal(next.round.winResult.analysis.nonFlowerTotal, score(make(mask)).analysis.nonFlowerTotal);
    assert.equal(JSON.stringify(state), before);
  }
  for(const pair of [12,13,22,23])for(const selfDraw of [false,true]){
    const initial=newMcrSession(199),round=structuredClone(initial.round),pool=[...core.createMcrTileSet()];
    const winner=selfDraw?'seat-1':'seat-2',take=index=>{
      const face=mcrTileFace(index),at=pool.findIndex(t=>t.face===face);assert.ok(at>=0,'missing '+face);
      return pool.splice(at,1)[0];
    };
    const exposed=[11,12,13].map(take),concealed=[...chowTiles,pair].map(take),winning=take(pair);
    round.hands=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
    round.melds=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
    round.flowers=Object.fromEntries(round.playerOrder.map(id=>[id,[]]));
    round.melds[winner]=[{kind:'chow',exposure:'melded',tiles:exposed,claimedTileId:exposed[0].id,fromPlayerId:'seat-3'}];
    round.hands[winner]=selfDraw?[...concealed,winning]:concealed;
    if(!selfDraw)round.hands['seat-1'].push(winning);
    for(const id of round.playerOrder)if(id!==winner)while(round.hands[id].length<(id==='seat-1'&&!selfDraw?14:13)){
      const at=pool.findIndex(t=>core.isMcrStructureTile(t.face)&&t.face!==winning.face);assert.ok(at>=0);
      round.hands[id].push(pool.splice(at,1)[0]);
    }
    Object.assign(round,{wall:pool,discardPile:[],activePlayerId:'seat-1',phase:'discard',turnSource:'wall',
      drewThisTurn:true,lastDrawnTileId:winning.id,pendingFlowerTileId:null,claimWindow:null,
      actionHistory:[],winResult:null,drawResult:null});
    let session={...initial,round,opening:[]};
    const inventory=()=>{const tiles=[...session.round.wall,...session.round.discardPile,...Object.values(session.round.hands).flat(),
      ...Object.values(session.round.melds).flat().flatMap(m=>m.tiles),...Object.values(session.round.flowers).flat()];
      assert.equal(tiles.length,144);assert.equal(new Set(tiles.map(t=>t.id)).size,144);};
    const step=(seat,type,predicate=()=>true)=>{
      const before=JSON.stringify(session),choice=mcrSessionView(session,seat).choices.find(c=>c.type===type&&predicate(c));
      assert.ok(choice,`${type} pair ${pair} selfDraw ${selfDraw}`);
      const next=actMcrSession(session,seat,session.revision,choice.index);
      assert.equal(JSON.stringify(session),before);assert.equal(next.revision,session.revision+1);session=next;inventory();
    };
    inventory();
    if(selfDraw)step(0,'declare-self-draw');
    else{
      step(0,'discard',c=>c.tileIds.includes(winning.id));step(1,'claim-discard',c=>c.claim==='win');
      for(const seat of [2,3])if(session.round.phase==='claim')step(seat,'pass-claim');
    }
    assert.equal(session.round.phase,'finished');
    const result=session.round.winResult,codes=result.analysis.fanCodes;
    assert.ok(codes.includes('mcr-40'));
    assert.equal(codes.includes('mcr-31'),pair===13||pair===22);
    assert.equal(result.analysis.occurrences.filter(o=>o.fanCode==='mcr-69').length,2);
    assert.ok(codes.includes('mcr-64')&&codes.includes('mcr-63'));
    assert.ok(!codes.includes('mcr-75'));
    for(const [code,points] of [['mcr-40',8],['mcr-63',2],['mcr-64',2],['mcr-69',2]])
      assert.equal(result.analysis.occurrences.filter(o=>o.fanCode===code).reduce((sum,o)=>sum+o.points,0),points);
    const n=result.analysis.nonFlowerTotal,expected=selfDraw?[3*(n+8),-n-8,-n-8,-n-8]:[-n-8,n+24,-8,-8];
    assert.deepEqual(Object.values(result.settlement.deltas),expected);
  }
  console.log('PASS: Reversible Tiles survives all 16 pung/kong subsets (14–18 physical tiles); 144 invalid-pair negatives, exact base/single-kong payments and voided-suit exclusion.');
  console.log('PASS: 16 pung/kong and 8 official-style all-chow valid-inventory authored sessions, both win sources, exact payments and combinations. Not native or opening-history evidence.');
})().catch(error => { console.error(error); process.exitCode = 1; });
