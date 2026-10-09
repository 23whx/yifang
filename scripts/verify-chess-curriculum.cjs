const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,f);
const {tutorials}=require('../content/tutorials.ts');
const courses=tutorials.filter(t=>t.game==='chess');
assert.deepEqual(courses.map(t=>t.slug),['chess-first-lesson','chess-basics']);
assert.deepEqual(courses[0].steps.map(s=>s.id),['beginner-welcome','beginner-address','pieces','beginner-ending','beginner-first-turn','long-range','guided-opening']);
assert.ok(courses[0].steps.findIndex(s=>s.id==='beginner-ending')<courses[0].steps.findIndex(s=>s.id==='long-range'),'define check and escaping check before the queen-path example uses them');
assert.deepEqual(courses[1].steps.map(s=>s.id),['prerequisites','special','en-passant-demo','promotion-demo','check-mate','opening','draw']);
for(const lang of ['zh','en']){
 const paragraphs=courses.flatMap(t=>t.steps.flatMap(s=>s.body[lang]));
 assert.equal(new Set(paragraphs).size,paragraphs.length);
 assert.ok(courses[1].steps[0].body[lang].join(' ').includes(lang==='zh'?'第一课':'Lesson 1'));
}
assert.match(courses[1].steps.find(s=>s.id==='draw').body.zh.join(' '),/五次重复与 75/);
assert.match(courses[1].steps.find(s=>s.id==='opening').body.zh.join(' '),/不是强制顺序/);
console.log('PASS: chess retains both URLs, one core introduction, prerequisite-first follow-up, unique paragraphs and corrected draw/opening boundaries. Not a semantic proof for all game tutorials.');
