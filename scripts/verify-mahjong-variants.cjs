const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, file);
const { mahjongCourses, variantFigures } = require('../content/mahjong-variants.ts');
const order = [...['万','筒','条'].flatMap(s=>[...'一二三四五六七八九'].map(n=>n+s)), '东','南','西','北','中','发','白'];
const flowers=['春','夏','秋','冬','梅','兰','竹','菊'];
function complete(tiles) {
  if(tiles.length!==14||tiles.some(t=>!order.includes(t))) return false;
  const counts=order.map(t=>tiles.filter(x=>x===t).length);
  function sets(c) {
    const i=c.findIndex(n=>n>0);if(i<0)return true;
    if(c[i]>=3) {const n=[...c];n[i]-=3;if(sets(n))return true;}
    if(i<27&&i%9<7&&c[i+1]&&c[i+2]) {const n=[...c];n[i]--;n[i+1]--;n[i+2]--;if(sets(n))return true;}
    return false;
  }
  return counts.some((n,i)=>{if(n<2)return false;const c=[...counts];c[i]-=2;return sets(c);});
}
assert.equal(mahjongCourses.length,3);
const jp=mahjongCourses.find(c=>c.tutorial.slug==='mahjong-riichi');
assert.equal(jp.exercises[0].after.length,14,'selecting is not discarding');
assert.equal(jp.exercises[1].hand.length,14,'riichi declaration precedes its discard');
assert.equal(jp.exercises[1].after.length,13);
const ids=new Set();
for(const course of mahjongCourses) {
  assert.equal(course.tutorial.steps.length,6);
  assert.equal(course.exercises.length,3,'Each core route completes its basic hand in three steps');
  assert.equal(course.supplementaryExercises?.length??0,course.tutorial.slug==='mahjong-mcr'?7:0,'All seven optional MCR exercises remain');
  const exercises=[...course.exercises,...(course.supplementaryExercises??[])];
  for(const step of course.tutorial.steps) {
    assert.ok(!ids.has(step.id));ids.add(step.id);
    for(const locale of ['zh','en']) assert.ok(step.body[locale].length>=2&&step.body[locale].every(p=>p.length>50));
    assert.ok(variantFigures[step.id].panels.length);
  }
  const allHands=[...course.tutorial.steps.flatMap(s=>variantFigures[s.id].panels.map(p=>p.tiles)),...exercises.flatMap(e=>[e.hand,e.after])];
  for(const hand of allHands) {
    assert.ok(hand.every(t=>order.includes(t)||(course.tutorial.slug==='mahjong-mcr'&&flowers.includes(t))));
    for(const tile of hand)assert.ok(hand.filter(t=>t===tile).length<=(flowers.includes(tile)?1:4));
    if(course.tutorial.slug==='mahjong-sichuan')assert.ok(hand.every(t=>/[万筒条]$/.test(t)),'Sichuan has no honours');
  }
  for(const e of exercises)assert.ok(e.choices[e.correct]&&e.explanation.zh&&e.explanation.en);
  const final=course.exercises.at(-1).after;
  assert.ok(complete(final),`${course.tutorial.slug}: final hand must form four sets and a pair`);
  assert.ok(!complete([...final.slice(0,-1),'春']),'a flower cannot replace a pair tile');
  assert.ok(!complete(final.slice(0,-1)));
  if(course.tutorial.slug==='mahjong-sichuan')assert.ok(final.every(t=>!t.endsWith('条')));
  if(course.tutorial.slug==='mahjong-mcr')for(const rank of '一二三四五六七八九')assert.ok(final.includes(rank+'万'),'Pure Straight example');
}
console.log('PASS: 3 separate bilingual courses, 18 illustrated sections, 16 guided steps, legal tile inventories and independently checked completed hands.');
