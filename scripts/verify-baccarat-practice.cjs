const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const { exampleDeck, points } = require('../lib/baccarat.ts');
const { initialBaccaratPractice, baccaratReturnCents, commitBaccaratPractice, advanceBaccaratPractice, settleBaccaratPractice, nextBaccaratPractice } = require('../lib/baccarat-practice.ts');

assert.equal(baccaratReturnCents('player', 7, 5, 1000), 2000);
assert.equal(baccaratReturnCents('banker', 5, 7, 1000), 1950);
assert.equal(baccaratReturnCents('banker', 5, 7, 500), 975);
assert.equal(baccaratReturnCents('tie', 7, 7, 1000), 9000);
assert.equal(baccaratReturnCents('player', 7, 7, 1000), 1000);
assert.equal(baccaratReturnCents('banker', 7, 7, 1000), 1000);
assert.equal(baccaratReturnCents('tie', 7, 5, 1000), 0);
assert.equal(baccaratReturnCents('player', 5, 7, 1000), 0);

for (const selection of ['player', 'banker', 'tie']) for (let i = 0; i < 5; i++) {
  let state = { ...initialBaccaratPractice(), selection };
  const before = state.balanceCents;
  state = commitBaccaratPractice(state, exampleDeck(i));
  assert.equal(state.balanceCents, before - state.stakeCents);
  assert.equal(state.committedCents, state.stakeCents);
  assert.throws(() => commitBaccaratPractice(state, exampleDeck(i)));
  assert.throws(() => settleBaccaratPractice(state));
  while (state.stepIndex < state.steps.length - 1) state = advanceBaccaratPractice(state);
  assert.throws(() => advanceBaccaratPractice(state));
  const final = state.steps.at(-1);
  const expectedReturn = baccaratReturnCents(selection, points(final.player), points(final.banker), state.stakeCents);
  state = settleBaccaratPractice(state);
  assert.equal(state.balanceCents, before - state.stakeCents + expectedReturn);
  assert.equal(state.committedCents, 0);
  assert.throws(() => settleBaccaratPractice(state));
  state = nextBaccaratPractice(state);
  assert.equal(state.phase, 'choose');
  assert.equal(state.steps.length, 0);
  assert.equal(state.balanceCents, before - state.stakeCents + expectedReturn);
}

for (const balanceCents of [0, 499]) {
  assert.throws(() => commitBaccaratPractice({ ...initialBaccaratPractice(), balanceCents, stakeCents: 500 }, exampleDeck(0)));
}
assert.throws(() => commitBaccaratPractice({ ...initialBaccaratPractice(), stakeCents: 0 }, exampleDeck(0)));
console.log('Baccarat free practice: 15 completed cases, stake locking, payout arithmetic, settlement guards and insufficient balance passed.');
