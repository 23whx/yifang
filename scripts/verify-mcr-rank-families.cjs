// Complete hands authored from MCR definitions, not copied from detector output.
// EMA Green Book, fans 21,25,26,27,31,36,37:
// https://mahjong-europe.org/portal/images/docs/mcr_ENa5.pdf
const fs = require('node:fs'), ts = require('typescript'), Module = require('node:module');
const assert = require('node:assert/strict');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, f);

(async () => {
  const core = await import('miaoda-game-mcr-mahjong-analysis-core');
  const load = Module._load, js = require.extensions['.js'];
  Module._load = function (request, ...args) { return request === 'miaoda-game-mcr-mahjong-analysis-core' ? core : load.call(this, request, ...args); };
  require.extensions['.js'] = (m, f) => f.replaceAll('\\', '/').includes('/mahjong/vendor/') ? require.extensions['.ts'](m, f) : js(m, f);
  const { scoreMcrHand: score } = require('../lib/mahjong/mcr-score.ts');
  const tile = (rank, suit) => 9 * suit + rank - 1;
  const pung = (rank, suit) => ({ kind: 'pung', tiles: Array(3).fill(tile(rank, suit)), open: true });
  const chow = (rank, suit) => ({ kind: 'chow', tiles: [0, 1, 2].map(n => tile(rank + n, suit)), open: true });
  const rows = [
    { code: 'mcr-21', points: 24, groups: [pung(2, 0), pung(4, 1), pung(6, 2), pung(8, 0)], pair: tile(4, 2), bad: tile(5, 2), excludes: ['mcr-49', 'mcr-68', 'mcr-76'] },
    { code: 'mcr-25', points: 24, groups: [chow(7, 0), chow(7, 1), chow(7, 2), pung(7, 0)], pair: tile(9, 1), bad: tile(6, 1), excludes: ['mcr-36', 'mcr-76'] },
    { code: 'mcr-26', points: 24, groups: [chow(4, 0), chow(4, 1), chow(4, 2), pung(4, 0)], pair: tile(6, 1), bad: tile(7, 1), excludes: ['mcr-68', 'mcr-76'] },
    { code: 'mcr-27', points: 24, groups: [chow(1, 0), chow(1, 1), chow(1, 2), pung(1, 0)], pair: tile(2, 1), bad: tile(4, 1), excludes: ['mcr-37', 'mcr-76'] },
    { code: 'mcr-31', points: 16, groups: [chow(3, 0), chow(4, 1), chow(5, 2), pung(5, 0)], pair: tile(5, 1), bad: tile(4, 1), excludes: ['mcr-68', 'mcr-76'] },
    { code: 'mcr-36', points: 12, groups: [chow(6, 0), chow(6, 1), chow(7, 2), pung(9, 0)], pair: tile(6, 1), bad: tile(5, 1), excludes: ['mcr-25', 'mcr-76'] },
    { code: 'mcr-37', points: 12, groups: [chow(1, 0), chow(2, 1), chow(2, 2), pung(4, 0)], pair: tile(1, 1), bad: tile(5, 1), excludes: ['mcr-27', 'mcr-76'] },
  ];
  const permutations = [[0,1,2], [0,2,1], [1,0,2], [1,2,0], [2,0,1], [2,1,0]];
  let positives = 0, negatives = 0;
  for (const row of rows) for (const permutation of permutations) {
    const map = t => t < 27 ? permutation[Math.floor(t / 9)] * 9 + t % 9 : t;
    const groups = row.groups.map(m => ({ ...m, tiles: m.tiles.map(map) }));
    const make = (pair, selfDraw, flowers) => ({
      concealedBeforeWin: [pair], winningTile: pair, melds: groups,
      winner: 0, from: selfDraw ? 0 : 2, roundWind: 0, seatWind: 1,
      source: selfDraw ? 'wall' : 'discard', flowers, lastWallEvent: false, lastCopy: false,
    });
    for (const selfDraw of [false, true]) for (const flowers of [[], [34, 37]]) {
      const input = make(map(row.pair), selfDraw, flowers), before = JSON.stringify(input);
      const result = score(input), label = `${row.code}/${permutation}/${selfDraw}/${flowers}`;
      assert.ok(result.ok, label);
      assert.ok(result.analysis.fanCodes.includes(row.code), label);
      assert.equal(result.analysis.occurrences.filter(o => o.fanCode === row.code).reduce((n, o) => n + o.points, 0), row.points, label);
      for (const code of row.excludes) assert.ok(!result.analysis.fanCodes.includes(code), `${label}: intrinsic/incompatible ${code}`);
      for (const code of row.excludes.filter(code => code === 'mcr-68' || code === 'mcr-76')) {
        const exclusion = result.analysis.exclusions.find(item => item.fanCode === code);
        assert.ok(exclusion, `${label}: report why ${code} was excluded`);
        assert.ok(exclusion.excludedBy.some(cause => cause.fanCode === row.code || cause.fanCode === 'mcr-68'), `${label}: upper-rank or All Simples must explain ${code}`);
      }
      // Independent payment arithmetic; do not use the settlement implementation as oracle.
      const points = result.analysis.nonFlowerTotal + flowers.length;
      assert.equal(result.analysis.total, points);
      const delta = selfDraw ? [3 * (8 + points), -8 - points, -8 - points, -8 - points] : [24 + points, -8, -8 - points, -8];
      assert.deepEqual(result.settlement.delta, delta, label);
      assert.equal(JSON.stringify(input), before);
      positives++;
    }
    // Change only the pair: still a legal four-group structure, but it no longer
    // satisfies the whole-hand rank condition (or All Fives' pair requirement).
    for (const pair of [map(row.bad), 27]) {
      const result = score(make(pair, true, []));
      assert.ok(!result.ok || !result.analysis.fanCodes.includes(row.code), `${row.code}: invalid pair ${pair}`);
      if (!result.ok) assert.equal(result.reason, 'below-minimum');
      negatives++;
    }
  }
  // All Even Pungs also requires groups to be pungs/kongs: an even pair alone
  // does not make a 234 chow an even pung.
  const even = rows[0];
  const broken = score({ concealedBeforeWin: [even.pair], winningTile: even.pair,
    melds: [chow(2,0), ...even.groups.slice(1)], winner: 0, from: 0, roundWind: 0, seatWind: 1,
    source: 'wall', flowers: [], lastWallEvent: false, lastCopy: false });
  assert.ok(!broken.ok || !broken.analysis.fanCodes.includes('mcr-21'));
  if (!broken.ok) assert.equal(broken.reason, 'below-minimum');
  console.log(`PASS: seven rank families, ${positives} complete-hand positives with suit/source/flower permutations, ${negatives + 1} boundary/honor/chow counterexamples; exclusions and payments. Not all 81 fans.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
