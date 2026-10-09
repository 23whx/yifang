const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText, file);
const { tutorials } = require('../content/tutorials.ts');
const { recoveryScramble } = require('../content/cube/recovery.ts');
const { invertAlg } = require('../lib/cube/alg.ts');
const { stickerGrids } = require('../lib/cube/stickers.ts');
const solved = stickerGrids('');
let count=0;
for(const tutorial of tutorials.filter(t=>t.game==='cube')) for(const step of tutorial.steps) {
  if(!step.alg) continue;
  const fromSolved=['notation','cube-first-lesson','patterns'].includes(tutorial.slug);
  const initial=fromSolved?'':invertAlg(step.alg);
  const tokens=step.alg.split(/\s+/);
  // Every forward step can be undone exactly, including the last one.
  for(let i=1;i<=tokens.length;i++) {
    const before=`${initial} ${tokens.slice(0,i-1).join(' ')}`;
    assert.deepEqual(stickerGrids(`${before} ${tokens[i-1]} ${invertAlg(tokens[i-1])}`),stickerGrids(before));
  }
  const finish=`${initial} ${step.alg}`;
  if(fromSolved) {
    const backwards=invertAlg(step.alg).split(/\s+/);
    for(let i=0;i<=backwards.length;i++) {
      assert.deepEqual(stickerGrids(`${finish} ${backwards.slice(0,i).join(' ')}`),stickerGrids(tokens.slice(0,tokens.length-i).join(' ')));
    }
    assert.deepEqual(stickerGrids(`${finish} ${invertAlg(step.alg)}`),solved);
  } else assert.deepEqual(stickerGrids(finish),solved);
  count++;
}
const beginner=tutorials.find(t=>t.slug==='beginner-lbl');
const recovery=beginner.steps.find(s=>s.id==='recorded-scramble-recovery');
assert.equal(recovery.alg,invertAlg(recoveryScramble));
assert.equal(recovery.alg.split(' ').length,20);
assert.notDeepEqual(stickerGrids(recoveryScramble),solved);
assert.deepEqual(stickerGrids(`${recoveryScramble} ${recovery.alg}`),solved);
const twist=beginner.steps.find(s=>s.id==='corner-permutation');
const start=stickerGrids(invertAlg(twist.alg));
assert.deepEqual(start.D,solved.D);
for(const side of ['F','R','B','L']) assert.deepEqual(start[side].slice(3),solved[side].slice(3),'two-corner exercise starts with two lower layers solved');
assert.equal([0,2,6,8].filter(i=>start.U[i]!=='U').length,2);
const ui=fs.readFileSync('components/cube/TutorialPlayer.tsx','utf8');
assert.match(ui,/setRestoring\(true\)/);
assert.match(ui,/cursor === \(restoring \? forward.length : 0\)/);
assert.match(ui,/setRestoring\(false\)/);
assert.doesNotMatch(ui,/setInterval|setTimeout/);
console.log(`PASS: ${count} tutorial algorithms: forward/back checkpoints, all inverse recoveries, 20-move recorded recovery, two-twisted-corner starting condition and manual UI guards.`);
