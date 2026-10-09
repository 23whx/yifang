// Independently authored complete open hands, fixing melds to avoid silently
// changing a chow into a pung decomposition when testing associations.
// EMA MCR definitions 13/14/16/23/28/29/30/39/41/51.
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
  const {scoreMcrHand: score} = require('../lib/mahjong/mcr-score.ts');
  // Chow start tile indexes: 0=123m, 3=456m, 6=789m, 9=123p etc.
  const cases = [
    {code:'mcr-13', points:64, starts:[0,0,6,6], pair:4, excluded:['mcr-19','mcr-22','mcr-63','mcr-69','mcr-72']},
    {code:'mcr-14', points:48, starts:[0,0,0,0], pair:30, excluded:['mcr-23','mcr-24','mcr-64','mcr-69']},
    {code:'mcr-16', points:32, starts:[0,1,2,3], pair:30, excluded:['mcr-30','mcr-71','mcr-72']},
    {code:'mcr-23', points:24, starts:[1,1,1,15], pair:30, excluded:['mcr-69']},
    {code:'mcr-28', points:16, starts:[0,3,6,10], pair:30, excluded:['mcr-71','mcr-72']},
    {code:'mcr-29', points:16, starts:[0,6,9,15], pair:22, excluded:['mcr-63','mcr-70','mcr-72','mcr-76']},
    {code:'mcr-30', points:16, starts:[0,1,2,15], pair:30, excluded:[]},
    {code:'mcr-39', points:8, starts:[0,12,24,1], pair:30, excluded:[]},
    {code:'mcr-41', points:8, starts:[1,10,19,6], pair:30, excluded:['mcr-70']},
    {code:'mcr-51', points:6, starts:[0,10,20,6], pair:30, excluded:[]},
    // Shift-by-two is allowed; do not only exercise consecutive starts.
    {code:'mcr-16', points:32, starts:[0,2,4,6], pair:30, excluded:['mcr-30','mcr-71','mcr-72']},
    {code:'mcr-30', points:16, starts:[0,2,4,15], pair:30, excluded:[]},
  ];
  let positive = 0, negative = 0;
  for (const row of cases) for (const permutation of [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]]) {
    const map = t => t < 27 ? permutation[Math.floor(t/9)] * 9 + t%9 : t;
    const original = row.starts.map(start => ({kind:'chow',tiles:[start,start+1,start+2].map(map),open:true}));
    const pair = map(row.pair);
    for (let rotation = 0; rotation < 4; rotation++) {
      const melds = [...original.slice(rotation),...original.slice(0,rotation)];
      for (const self of [false,true]) {
        const input = {concealedBeforeWin:[pair], winningTile:pair, melds, winner:0,from:self?0:2,
          roundWind:0,seatWind:1,source:self?'wall':'discard',flowers:[],lastWallEvent:false,lastCopy:false};
        const result = score(input), label = `${row.code}/${row.starts}/${permutation}/${rotation}/${self}`;
        assert.ok(result.ok,label);
        assert.equal(result.analysis.occurrences.filter(o=>o.fanCode===row.code).reduce((n,o)=>n+o.points,0),row.points,label);
        for (const excluded of row.excluded) assert.ok(!result.analysis.fanCodes.includes(excluded),`${label}: duplicate ${excluded}`);
        if (['mcr-13','mcr-29'].includes(row.code)) {
          const exclusion = result.analysis.exclusions.find(item => item.fanCode === 'mcr-72');
          assert.ok(exclusion,`${label}: explain why the present 123/789 terminal-chow pair is not scored again`);
          assert.ok(exclusion.excludedBy.some(cause => cause.fanCode === row.code),`${label}: terminal-chow pair must be absorbed by ${row.code}`);
        }
        positive++;
      }
      // Remove the first participating chow, retaining a complete physical
      // structure. A wind pung cannot stand in for the missing chow.
      const bad = [{kind:'pung',tiles:[27,27,27],open:true},...original.slice(1)];
      const badOrder = [...bad.slice(rotation),...bad.slice(0,rotation)];
      const result = score({concealedBeforeWin:[pair],winningTile:pair,melds:badOrder,winner:0,from:0,
        roundWind:0,seatWind:1,source:'wall',flowers:[],lastWallEvent:false,lastCopy:false});
      assert.ok(!result.ok || !result.analysis.fanCodes.includes(row.code),`${row.code}: missing chow`);
      if (!result.ok) assert.equal(result.reason,'below-minimum');
      negative++;
    }
  }
  console.log(`PASS: ten chow families, ${positive} complete-hand suit/meld-order/source fixtures, ${negative} missing-chow counterexamples; main fan values and absorbed lower combinations.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
