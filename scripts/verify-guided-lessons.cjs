const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
const { baccaratGuide, holdemGuide, mahjongGuide, settleTeachingStake } = require('../content/guided-tables.ts');
const { beginnerHandbook } = require('../content/beginner-handbook.ts');
const { firstLessons } = require('../content/first-lessons.ts');
const { winConditions } = require('../content/win-conditions.ts');
const { games } = require('../content/games.ts');
// Entry copy must not undo the regional eligibility distinctions taught below.
const mahjongEntry = games.find(game => game.slug === 'mahjong');
for (const locale of ['zh', 'en']) {
  const intro = mahjongEntry.intro[locale].join(' ');
  for (const count of ['108', '136', '144']) assert.ok(intro.includes(count));
  assert.ok(!intro.includes('即为和牌'));
  assert.ok(mahjongEntry.facts[0].value[locale].includes('108'));
}
for (const term of ['摸牌就是', '打牌就是', '顺子', '刻子', '对子', '结构凑齐不一定', '不含花牌分', '整场']) {
  assert.ok(mahjongEntry.intro.zh.join(' ').includes(term), `Missing novice Mahjong entry explanation: ${term}`);
}
for (const term of ['To draw means', 'to discard means', 'sequence', 'triplet', 'pair', 'does not guarantee', 'excluding flowers', 'whole match']) {
  assert.ok(mahjongEntry.intro.en.join(' ').includes(term), `Missing English Mahjong entry explanation: ${term}`);
}
const { mahjongFigures, mahjongTermsTutorial, mahjongGlossary } = require('../content/mahjong-lessons.ts');
const legalTiles = new Set([...['万','筒','条'].flatMap(s => [...'一二三四五六七八九'].map(n=>n+s)), '东','南','西','北','中','发','白']);
assert.equal(mahjongTermsTutorial.steps.length, 12);
assert.equal(mahjongGlossary.length, 12);
const illustratedSteps = [...firstLessons.find(t=>t.game==='mahjong').steps, ...mahjongTermsTutorial.steps];
for (const step of illustratedSteps) {
  const figure = mahjongFigures[step.id];
  assert.ok(figure?.panels.length, `Missing illustration: ${step.id}`);
  for (const language of ['zh','en']) assert.ok(figure.caption[language] && step.body[language].length >= 2);
  for (const panel of figure.panels) {
    assert.ok(panel.label.zh && panel.label.en);
    for (const tile of panel.tiles) assert.ok(legalTiles.has(tile), `Unknown sprite tile: ${tile}`);
    for (const tile of new Set(panel.tiles)) assert.ok(panel.tiles.filter(t=>t===tile).length <= 4);
  }
}
assert.equal(mahjongFigures.tenpai.panels[0].tiles.length, 13);
assert.equal(mahjongFigures.tsumo.panels[1].tiles.length, 14);
assert.equal(mahjongFigures.riichi.panels[0].tiles.length, 14);
assert.equal(mahjongFigures.riichi.panels[2].tiles.length, 13);
// Independently verify the teaching hand's wait, not just its tile count.
function completesMahjongShape(tiles) {
  if (tiles.length !== 14) return false;
  const order = [...legalTiles], counts = order.map(t=>tiles.filter(x=>x===t).length);
  if (counts.some(n=>n>4)) return false;
  function sets(left) {
    const i = left.findIndex(n=>n>0);
    if (i < 0) return true;
    if (left[i]>=3) { const next=[...left]; next[i]-=3; if(sets(next)) return true; }
    if (i<27 && i%9<7 && left[i+1]>0 && left[i+2]>0) {
      const next=[...left]; next[i]--; next[i+1]--; next[i+2]--; if(sets(next)) return true;
    }
    return false;
  }
  return counts.some((n,i)=>{if(n<2)return false;const next=[...counts];next[i]-=2;return sets(next);});
}
const waitingHand = mahjongFigures.tenpai.panels[0].tiles;
assert.deepEqual([...legalTiles].filter(t=>completesMahjongShape([...waitingHand,t])), ['东']);
assert.ok(completesMahjongShape(mahjongFigures.tsumo.panels[1].tiles));
console.log('PASS: 19 illustrated Mahjong sections, 12 bilingual vocabulary entries, legal sprite keys and 13/14-tile examples.');
assert.equal(Object.keys(winConditions).length, 8);
for (const lesson of firstLessons) for (const language of ['zh', 'en']) {
  for (const field of ['rule', 'example', 'practice']) assert.ok(winConditions[lesson.game][field][language].length > 20);
}
assert.ok(winConditions.go.example.zh.includes('47.5'));
// Shared banners appear above both fixed exercises and complete free-play
// tables. Never describe the entire page as a no-kong, fourteen-tile demo.
assert.ok(!winConditions.mahjong.rule.zh.includes('本页先学'));
for(const [locale,terms] of [['zh',['七对','杠','日式','国标','四川']],['en',['seven pairs','kong','Japanese','Chinese Official','Sichuan']]]){
  for(const term of terms)assert.ok(winConditions.mahjong.rule[locale].includes(term),`Missing scope distinction: ${locale} ${term}`);
}
assert.ok(winConditions.mahjong.practice.zh.includes('不等于'));
assert.ok(winConditions.mahjong.practice.en.includes('not a regional game won'));
assert.ok(winConditions.holdem.practice.zh.includes('有资格'));
assert.ok(winConditions.holdem.practice.en.includes('eligible'));
const tileAtlas = fs.readFileSync(require('node:path').join(__dirname, '../public/mahjong/tiles-generated-v1.png'));
assert.equal(tileAtlas.readUInt32BE(16), 1536);
assert.equal(tileAtlas.readUInt32BE(20), 1024);
const { parseUci } = require('../lib/board/variants.ts');
assert.deepEqual(parseUci('h10g8'), { from: 'h10', to: 'g8', suffix: '', drop: null });
assert.deepEqual(parseUci('a9a10'), { from: 'a9', to: 'a10', suffix: '', drop: null });
assert.deepEqual(parseUci('e7e8q'), { from: 'e7', to: 'e8', suffix: 'q', drop: null });
assert.deepEqual(parseUci('P@e5'), { from: null, to: 'e5', suffix: '', drop: 'p' });
assert.equal(firstLessons.length, 8);
for (const lesson of firstLessons) {
  assert.ok(beginnerHandbook[lesson.game].length >= 5);
  assert.equal(new Set(lesson.steps.map(s => s.id)).size, lesson.steps.length);
  for (const language of ['zh', 'en']) {
    assert.ok(lesson.steps.every(s => s.body[language].length > 0));
    assert.ok(beginnerHandbook[lesson.game].every(s => s.body[language].join('').length > 100));
  }
}
const guides = [...Array.from({ length: 5 }, (_, n) => baccaratGuide(n)), holdemGuide(), mahjongGuide()];
assert.equal(baccaratGuide(0)[0].title.en,'Before dealing: recognise the suits');
for(let n=1;n<5;n++){
 assert.equal(baccaratGuide(n)[0].title.en,'Select a result');
 assert.ok(!baccaratGuide(n).some(s=>s.title.en==='Before dealing: recognise the suits'),'Only the foundational example repeats recognition');
}
for (const guide of guides) for (const step of guide) {
  assert.ok(step.correct >= 0 && step.correct < step.options.length);
  for (const l of ['zh', 'en']) assert.ok(step.title[l] && step.instruction[l] && step.feedback[l] && step.options.every(o => o[l]));
  if (step.scene.balance !== undefined) assert.ok(step.scene.balance >= 0);
}
assert.deepEqual(Array.from({ length: 5 }, (_, n) => baccaratGuide(n).at(-1).scene.balance), [110, 100, 109.5, 90, 180]);
for (const selection of ['player', 'banker', 'tie']) for (let p = 0; p < 10; p++) for (let b = 0; b < 10; b++) {
  const returned = settleTeachingStake(selection, p, b, 10);
  assert.ok(returned >= 0 && returned <= 90);
}
for (const guide of guides.slice(0, 5)) {
  const confirm = guide.findIndex(s => s.title.en === 'Commit the stake');
  assert.equal(guide[confirm].scene.balance, 100);
  assert.equal(guide[confirm + 1].scene.balance, 90);
  assert.equal(guide.at(-1).scene.committed, 0);
}
const poker = holdemGuide();
for (const s of poker) assert.equal(s.scene.balance + s.scene.opponentBalance + s.scene.pot, 200);
const show = poker.findIndex(s => s.title.en === 'Find the best five of seven');
assert.ok(poker.slice(0, show).every(s => s.scene.other.every(c => c === '?')));
assert.deepEqual(poker.at(-1).scene, { hand: ['A♠','K♠'], other: ['Q♥','Q♦'], shared: ['A♥','7♣','2♦','9♠','3♣'], balance: 110, opponentBalance: 90, pot: 0 });
const mahjong = mahjongGuide();
assert.deepEqual(mahjong.map(s => s.scene.hand.length), [13, 14, 13, 14, 13, 14]);
assert.deepEqual(mahjong.at(-1).scene.discarded, ['白','九筒']);
assert.equal(mahjong.at(-1).scene.hand.filter(t => t === '东').length, 2);
assert.equal(new Set(mahjong.at(-1).scene.hand.filter(t => t !== '东')).size, 12);
console.log(`PASS: 8 bilingual first lessons; ${guides.length} guided scenarios; 300 Baccarat settlements; conserved poker chips; hidden hole cards; Mahjong draw/discard counts.`);
