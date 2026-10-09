// Find a reproducible shuffled first hand that reaches a win under the
// practice page's one-action-at-a-time choice policy. This is a browser
// acceptance fixture, not a claim that rare fans are statistically covered.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);

(async () => {
  const maxSeed = process.argv[2] === undefined ? 184 : Number(process.argv[2]);
  const targetFan = process.argv[3] ?? null;
  assert.ok(Number.isInteger(maxSeed) && maxSeed >= 15 && maxSeed <= 1000, 'maximum seed must be 15–1000');
  assert.ok(targetFan === null || ['mcr-44', 'mcr-45', 'mcr-46', 'mcr-47'].includes(targetFan), 'target must be a supported rare event fan');
  const rules = await import('miaoda-game-mcr-mahjong-rules');
  const analysis = await import('miaoda-game-mcr-mahjong-analysis-core');
  const load = Module._load;
  const js = require.extensions['.js'];
  Module._load = function (request, ...args) {
    return request === 'miaoda-game-mcr-mahjong-rules' ? rules : request === 'miaoda-game-mcr-mahjong-analysis-core' ? analysis : load.call(this, request, ...args);
  };
  require.extensions['.js'] = (module, file) => file.replaceAll('\\', '/').includes('/mahjong/vendor/') ? require.extensions['.ts'](module, file) : js(module, file);
  const { newMcrMatch, mcrMatchView, actMcrMatch } = require('../lib/mahjong/mcr-match.ts');

  let best = null;
  let browserReplay = null;
  let targetReplay = null;
  let lastWallReplay = null;
  let replacementReplay = null;
  for (let seed = 1; seed <= maxSeed; seed++) {
    let match = newMcrMatch(seed);
    const trace = [];
    const openingFlowers = match.session.opening.length;
    const checkReplay = seed === 58 || seed === 184;
    let actions = 0;
    while (match.session.round.phase !== 'finished') {
      const views = [0, 1, 2, 3].map(seat => mcrMatchView(match, seat));
      const view = views.find(v => v.choices.length);
      assert.ok(view, `No available action at seed ${seed}`);
      const choice = view.choices.find(c => c.claim === 'win' || c.type === 'declare-self-draw')
        ?? view.choices.find(c => c.type === 'replace-flower')
        ?? view.choices[0];
      const previous = checkReplay ? JSON.stringify(match) : null;
      const priorMatch = match;
      match = actMcrMatch(match, view.seat, match.revision, choice.index);
      if (checkReplay) {
        assert.equal(JSON.stringify(priorMatch), previous);
        const r = match.session.round;
        const tiles = [...r.wall, ...r.discardPile, ...Object.values(r.hands).flat(), ...Object.values(r.flowers).flat(), ...Object.values(r.melds).flat().flatMap(m => m.tiles)];
        assert.equal(tiles.length, 144);
        assert.equal(new Set(tiles.map(t => t.id)).size, 144);
        trace.push({seat:view.seat, choice:choice.index, type:choice.type, claim:choice.claim});
      }
      assert.ok(++actions < 1000, `Runaway hand at seed ${seed}`);
    }
    const win = match.session.round.winResult;
    if (!win) continue;
    assert.equal(match.ledger.hands.length, 1);
    assert.equal(match.ledger.balances.reduce((sum, n) => sum + n, 0), 0);
    assert.ok(win.analysis.nonFlowerTotal >= 8);
    const candidate = { seed, openingFlowers, actions, winner: win.winnerId, discarder:win.discarderId, source: win.winMethod, wallTiles:match.session.round.wall.length, nonFlowerPoints: win.analysis.nonFlowerTotal, flowers: win.analysis.flowerPoints, fanCodes: win.analysis.fanCodes, balances:match.ledger.balances };
    if (seed === 15) browserReplay = candidate;
    if (seed === 58) {
      lastWallReplay = candidate;
      assert.equal(openingFlowers, 1);
      assert.equal(actions, 487);
      assert.equal(candidate.winner, 'seat-4');
      assert.equal(candidate.source, 'discard');
      assert.equal(candidate.wallTiles, 0);
      assert.equal(candidate.nonFlowerPoints, 10);
      assert.equal(candidate.flowers, 2);
      assert.deepEqual(candidate.fanCodes, ['mcr-45', 'mcr-59', 'mcr-81']);
    }
    if (seed === 184) {
      replacementReplay = candidate;
      assert.equal(openingFlowers, 1);
      assert.equal(actions, 351);
      assert.equal(candidate.winner, 'seat-3');
      assert.equal(candidate.discarder, null);
      assert.equal(candidate.source, 'self-draw');
      assert.equal(candidate.wallTiles, 25);
      assert.equal(candidate.nonFlowerPoints, 14);
      assert.equal(candidate.flowers, 1);
      assert.equal(match.session.round.turnSource, 'kong-replacement');
      assert.deepEqual(candidate.fanCodes, ['mcr-46','mcr-60','mcr-71','mcr-74','mcr-75','mcr-79','mcr-81']);
      assert.deepEqual(trace.slice(-2).map(a=>a.type), ['draw-replacement','declare-self-draw']);
      assert.ok(trace.some(a=>a.claim==='kong'||a.type==='declare-added-kong'||a.type==='declare-concealed-kong'));
    }
    if (checkReplay) {
      const ids = match.session.round.playerOrder, total = candidate.nonFlowerPoints + candidate.flowers;
      assert.deepEqual(candidate.balances, ids.map(id => id === win.winnerId ? win.discarderId===null?3*(total+8):total+24 : win.discarderId===null||id===win.discarderId ? -total-8 : -8));
      const ledger = JSON.stringify(match.ledger);
      for (let seat = 0; seat < 4; seat++) {
        match = actMcrMatch(match, seat, match.revision, 'confirm');
        trace.push({seat, choice:'confirm'});
        assert.equal(JSON.stringify(match.ledger), ledger);
      }
      let replay = newMcrMatch(seed);
      for (const a of trace) replay = actMcrMatch(replay, a.seat, replay.revision, a.choice);
      assert.deepEqual(replay, match, 'rare terminal and confirmations replay from a genuine seeded opening');
    }
    if (targetFan && candidate.fanCodes.includes(targetFan) && !targetReplay) targetReplay = candidate;
    if (!best || actions < best.actions) best = candidate;
    if (seed >= 15 && (targetFan ? targetReplay : seed >= 184 && best.actions <= 80)) break;
  }
  if (!best) throw new Error(`No first-hand win found among the first ${maxSeed} deterministic seeds`);
  assert.ok(browserReplay, 'Browser replay seed 15 must still finish with a win');
  assert.equal(browserReplay.openingFlowers, 4);
  assert.equal(browserReplay.winner, 'seat-2');
  assert.equal(browserReplay.source, 'discard');
  assert.equal(browserReplay.nonFlowerPoints, 8);
  assert.equal(browserReplay.flowers, 2);
  if (!targetFan && maxSeed >= 58) assert.ok(lastWallReplay, 'Known last-wall seed 58 must be exercised');
  if (!targetFan && maxSeed >= 184) assert.ok(replacementReplay, 'Known kong-replacement seed 184 must be exercised');
  console.log(JSON.stringify({ browserReplay, lastWallReplay, replacementReplay, shortestWin: best, ...(targetFan ? { targetFan, targetReplay, maxSeed } : {}) }));
  if (targetFan) assert.ok(targetReplay, `No ${targetFan} browser-policy replay found through seed ${maxSeed}`);
})().catch(error => { console.error(error); process.exitCode = 1; });
