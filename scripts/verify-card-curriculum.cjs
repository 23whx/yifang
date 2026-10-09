const assert = require('node:assert/strict'), fs = require('node:fs'), ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText, f);
const {tutorials} = require('../content/tutorials.ts');
const {bankerDraw, roundSteps, exampleDeck, points} = require('../lib/baccarat.ts');
const {bestHand, compare} = require('../lib/holdem.ts');
const paths = {
  holdem: ['beginner-welcome','beginner-playing-cards','beginner-ranks','beginner-chips','beginner-actions','beginner-streets','beginner-showdown','practice-check'],
  baccarat: ['beginner-welcome','beginner-playing-cards','beginner-values','beginner-wallet','beginner-natural','beginner-settlement','beginner-draw','drawing-reference'],
};
for (const [game, ids] of Object.entries(paths)) {
  const courses = tutorials.filter(t => t.game === game);
  assert.equal(courses.length, 1);
  assert.equal(courses[0].slug, `${game}-first-lesson`);
  assert.deepEqual(courses[0].steps.map(s => s.id), ids);
  for (const lang of ['zh','en']) {
    const paragraphs = courses[0].steps.flatMap(s => s.body[lang]);
    assert.equal(new Set(paragraphs).size, paragraphs.length);
    assert.ok(courses[0].steps.every(s => s.title[lang] && s.body[lang].every(Boolean)));
  }
}
// Independently enumerate the printed Banker table, including stand entries.
const allowed = [[0,1,2,3,4,5,6,7,8,9],[0,1,2,3,4,5,6,7,8,9],[0,1,2,3,4,5,6,7,8,9],[0,1,2,3,4,5,6,7,9],[2,3,4,5,6,7],[4,5,6,7],[6,7],[]];
for (let b=0;b<8;b++) for(let third=0;third<10;third++) assert.equal(bankerDraw(b,third),allowed[b].includes(third));
for (let b=0;b<8;b++) assert.equal(bankerDraw(b), b<=5);
const natural = roundSteps(exampleDeck(0)).at(-1);
assert.deepEqual([natural.player.length,natural.banker.length,points(natural.player),points(natural.banker)],[2,2,8,5]);
const second = roundSteps(exampleDeck(1)).at(-1);
assert.deepEqual([second.player.length,second.banker.length,points(second.player),points(second.banker)],[3,2,3,3]);
const card = (rank,suit) => suit*13+rank-2;
const pairK = [card(14,0),card(14,1),card(13,2),card(9,3),card(7,0)];
const pairQ = [card(14,0),card(14,1),card(12,2),card(11,3),card(10,0)];
assert.equal(compare(bestHand(pairK).score,bestHand(pairQ).score),1);
const board=[10,11,12,13,14].map(r=>card(r,0));
assert.equal(compare(bestHand([...board,card(2,1),card(3,1)]).score,bestHand([...board,card(4,2),card(5,2)]).score),0);
console.log('PASS: two coherent bilingual card courses, stable URLs, unique paragraphs, 88 draw-table entries, natural and third-card cases, kicker and board-only tie examples. Browser acceptance remains separate.');
