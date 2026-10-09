// Independent complete-hand fixtures, not detector-output snapshots.
// MCR Green Book fans 8, 11, 18: terminal-only, honor-only, and mixed.
// https://mahjong-europe.org/portal/images/docs/mcr_EN.pdf
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const assert = require('node:assert/strict');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, f);

(async () => {
  const core = await import('miaoda-game-mcr-mahjong-analysis-core');
  const load = Module._load, js = require.extensions['.js'];
  Module._load = function (request, ...args) {
    return request === 'miaoda-game-mcr-mahjong-analysis-core' ? core : load.call(this, request, ...args);
  };
  require.extensions['.js'] = (m, f) => f.replaceAll('\\', '/').includes('/mahjong/vendor/') ? require.extensions['.ts'](m, f) : js(m, f);
  const { scoreMcrHand: score } = require('../lib/mahjong/mcr-score.ts');
  const terminals = [0, 8, 9, 17, 18, 26], honors = [27, 28, 29, 30, 31, 32, 33];
  function combinations(xs, n) {
    if (!n) return [[]];
    return xs.flatMap((x, i) => combinations(xs.slice(i + 1), n - 1).map(rest => [x, ...rest]));
  }
  function hand(groups, pair, kong = -1) {
    return {
      concealedBeforeWin: [pair], winningTile: pair,
      melds: groups.map((t, i) => ({ kind: i === kong ? 'kong' : 'pung', tiles: Array(i === kong ? 4 : 3).fill(t), open: true })),
      winner: 0, from: 0, roundWind: 0, seatWind: 1, source: 'wall',
      flowers: [], lastWallEvent: false, lastCopy: false,
    };
  }
  let positive = 0, negative = 0;
  for (const [pool, required, absent] of [
    [terminals, 'mcr-08', ['mcr-11', 'mcr-18', 'mcr-49', 'mcr-55', 'mcr-73', 'mcr-76']],
    [honors, 'mcr-11', ['mcr-08', 'mcr-18', 'mcr-49', 'mcr-55', 'mcr-73']],
  ]) {
    for (const groups of combinations(pool, 4)) for (const pair of pool.filter(t => !groups.includes(t))) {
      for (const kong of [-1, 0, 1, 2, 3]) {
        const input = hand(groups, pair, kong), before = JSON.stringify(input), result = score(input);
        const label = `${required}/${groups}/${pair}/${kong}`;
        assert.ok(result.ok, label);
        assert.ok(result.analysis.fanCodes.includes(required), label);
        assert.equal(result.analysis.occurrences.filter(o => o.fanCode === required).reduce((sum, o) => sum + o.points, 0), 64, label);
        for (const code of absent) assert.ok(!result.analysis.fanCodes.includes(code), `${label}: absorbed or incompatible ${code}`);
        assert.equal(result.settlement.delta.reduce((a, b) => a + b, 0), 0);
        assert.equal(JSON.stringify(input), before);
        positive++;
      }
      // A middle-number pair destroys the whole-hand property, while leaving
      // a structurally complete four-pung hand. It may be below the 8-point gate.
      const counter = score(hand(groups, 4));
      assert.ok(!counter.ok || !counter.analysis.fanCodes.includes(required));
      if (!counter.ok) assert.equal(counter.reason, 'below-minimum');
      negative++;
    }
  }
  // Exactly two terminal groups and two honor groups, with either kind of pair.
  // These cannot accidentally qualify for the two pure higher-valued patterns.
  for (const groups of [[0, 17, 27, 31], [8, 18, 28, 33], [9, 26, 29, 32]]) {
    for (const pair of [...terminals, ...honors].filter(t => !groups.includes(t))) {
      for (const kong of [-1, 0, 1, 2, 3]) {
        const result = score(hand(groups, pair, kong));
        assert.ok(result.ok);
        assert.ok(result.analysis.fanCodes.includes('mcr-18'));
        assert.equal(result.analysis.occurrences.filter(o => o.fanCode === 'mcr-18').reduce((n, o) => n + o.points, 0), 32);
        for (const code of ['mcr-08', 'mcr-11', 'mcr-49', 'mcr-55', 'mcr-73']) assert.ok(!result.analysis.fanCodes.includes(code));
        positive++;
      }
      const counter = score(hand(groups, 4));
      assert.ok(!counter.ok || !counter.analysis.fanCodes.includes('mcr-18'));
      if (!counter.ok) assert.equal(counter.reason, 'below-minimum');
      negative++;
    }
  }
  console.log(`PASS: ${positive} terminal/honor family complete hands with pung/kong variants; ${negative} middle-pair counterexamples; intrinsic lower-fan exclusions. Not all 81 fans or all combined totals.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
