const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const { points, bankerDraw, shuffledDeck, roundSteps, exampleDeck } = require('../lib/baccarat.ts');
const cards = ranks => ranks.map((rank, i) => ({ rank, suit: '♠', id: String(i) }));
assert.equal(points(cards([1, 10, 11, 12, 13])), 1);
assert.equal(points(cards([9, 8, 7])), 4);
const expected = ['1111111111', '1111111111', '1111111111', '1111111101', '0011111100', '0000111100', '0000001100', '0000000000'];
for (let b = 0; b < 8; b++) {
  assert.equal(bankerDraw(b), b <= 5);
  for (let p = 0; p < 10; p++) assert.equal(bankerDraw(b, p), expected[b][p] === '1', `Banker ${b}, Player third ${p}`);
}
for (const ranks of [[4, 1, 4, 1, 9, 9], [1, 4, 1, 5, 9, 9]]) {
  const steps = roundSteps(cards(ranks)), last = steps.at(-1);
  assert.equal(last.player.length, 2); assert.equal(last.banker.length, 2);
}
const exception = roundSteps(exampleDeck(1));
assert.equal(exception.at(-1).player.length, 3); assert.equal(exception.at(-1).banker.length, 2);
assert.equal(exception[0].player.length, 0); assert.equal(exception[1].banker.length, 0);
assert.equal(exception[4].player.length, 2); assert.equal(exception[4].banker.length, 2);
const six = roundSteps(exampleDeck(2)).at(-1);
assert.equal(six.banker.length, 3); assert.equal(points(six.banker), 9);
const stand = roundSteps(exampleDeck(3)).at(-1);
assert.equal(stand.player.length, 2); assert.equal(stand.banker[2].rank, 4);
const tie = roundSteps(exampleDeck(4)).at(-1);
assert.equal(points(tie.player), points(tie.banker));
for (let i = 0; i < 100; i++) {
  const deck = shuffledDeck(); assert.equal(deck.length, 416); assert.equal(new Set(deck.map(c => c.id)).size, 416);
  const end = roundSteps(deck).at(-1);
  assert.ok(end.player.length <= 3 && end.banker.length <= 3);
  assert.equal(new Set([...end.player, ...end.banker].map(c => c.id)).size, end.player.length + end.banker.length);
}
console.log('Baccarat: 80 draw-table cells, 8 stand rules, scoring, naturals, examples, step isolation and 100 random rounds passed.');
