const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {tutorials}=require('../content/tutorials.ts');
const {mahjongFigures}=require('../content/mahjong-lessons.ts');
const {mahjongCourses,variantFigures}=require('../content/mahjong-variants.ts');
const all=tutorials.filter(t=>t.game==='mahjong');
assert.deepEqual(all.map(t=>t.slug),['mahjong-first-lesson','mahjong-riichi','mahjong-mcr','mahjong-sichuan','mahjong-terms']);
assert.deepEqual(all[0].steps.map(s=>s.id),['beginner-scope','beginner-names','beginner-draw','beginner-finish','beginner-calls','choose-rules']);
assert.deepEqual(all[4].steps.map(s=>s.id),['tenpai','closed','yaku','tsumo','ron','riichi','dora','furiten','draw-end']);
assert.ok(all[4].title.zh.includes('可选'));
assert.ok(!all[4].title.zh.includes('第二课'));
for(const course of all){
  assert.equal(new Set(course.steps.map(s=>s.id)).size,course.steps.length);
  for(const lang of ['zh','en']){
    const paras=course.steps.flatMap(s=>s.body[lang]);
    assert.equal(new Set(paras).size,paras.length,course.slug);
    assert.ok(course.steps.every(s=>s.title[lang]&&s.body[lang].length>=2));
  }
  for(const s of course.steps){
    if(['choose-rules','branch-prerequisites'].includes(s.id))continue;
    const figure=mahjongFigures[s.id]??variantFigures[s.id];
    assert.ok(figure?.panels.length,`Missing retained picture ${course.slug}/${s.id}`);
  }
}
for(const branch of all.slice(1,4)){
  assert.equal(branch.steps[0].id,'branch-prerequisites');
  const original=mahjongCourses.find(c=>c.tutorial.slug===branch.slug);
  assert.deepEqual(branch.title,original.tutorial.title,'ruleset navigation and published course must share one title');
  assert.ok(original?.exercises.length>=3,'manual practice retained');
  assert.deepEqual([...branch.steps.slice(1).map(s=>s.id)].sort(),original.tutorial.steps.map(s=>s.id).sort(),'preserve every topic while permitting prerequisite order fixes');
}
const inventory=mahjongFigures['beginner-names'].panels.flatMap(p=>p.tiles);
const jp=all.find(t=>t.slug==='mahjong-riichi');
assert.ok(jp.steps.find(s=>s.id==='jp-goal').body.zh[1].includes('先认识本节要用的“门前”'));
assert.ok(jp.steps.find(s=>s.id==='jp-riichi').body.zh[0].includes('把前面“门前”的定义用到当前牌'));
assert.deepEqual(jp.steps.map(s=>s.id),['branch-prerequisites','jp-goal','jp-tiles','jp-riichi','jp-score','jp-source','jp-end']);
assert.ok(jp.steps.find(s=>s.id==='jp-source').body.en[0].includes('previous section'));
assert.ok(!jp.steps.find(s=>s.id==='jp-source').body.en[0].includes('han are scoring units'),'do not repeat the scoring definition');
assert.ok(jp.steps.find(s=>s.id==='jp-goal').body.en[1].includes('four matching tiles already in your hand'),'define concealed kong before relying on closed status');
assert.ok(jp.steps.find(s=>s.id==='jp-end').body.en[0].includes('Recall the riichi step'));
assert.ok(!jp.title.zh.includes('从认牌'),'branch must not advertise repeating the foundation');
const sc=all.find(t=>t.slug==='mahjong-sichuan');
assert.ok(sc.steps.find(s=>s.id==='sc-tiles').body.en[1].includes('called tenpai'));
assert.ok(sc.steps.find(s=>s.id==='sc-end').body.en[2].includes('A cap limits'));
const flowers=variantFigures['mcr-tiles'].panels.flatMap(p=>p.tiles);
for(const flower of ['春','夏','秋','冬','梅','兰','竹','菊'])assert.ok(flowers.includes(flower),'each new flower must have a picture');
const mcr=all.find(t=>t.slug==='mahjong-mcr'),flowerLesson=mcr.steps.find(s=>s.id==='mcr-tiles');
for(const language of ['zh','en']){
 const prose=flowerLesson.body[language].join(' ');
 assert.ok(prose.includes(language==='zh'?'放弃花分，打出花牌':'Discard flower without its bonus'));
 assert.ok(prose.includes(language==='zh'?'本次不补牌':'gives no replacement'));
 assert.ok(prose.includes(language==='zh'?'留到以后':'later turn'));
}
assert.ok(variantFigures['mcr-tiles'].panels.some(p=>p.label.zh.includes('弃花')&&p.label.en.includes('Discard Spring')),'flower-discard branch needs its own illustrated panel');
assert.equal(variantFigures['sc-tiles'].panels[0].tiles.length,13,'the new applied wait explanation needs the actual thirteen-tile picture');
for(const tile of ['一万','一筒','一条','东','白'])assert.ok(inventory.includes(tile));
console.log('PASS: five stable Mahjong URLs, shared foundation, three prerequisite branches, optional ordered reference, retained illustrations and manual exercises. Regional rule and browser tests are separate gates.');
