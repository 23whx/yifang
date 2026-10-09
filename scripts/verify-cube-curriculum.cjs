const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {tutorials}=require('../content/tutorials.ts');
const all=tutorials.filter(t=>t.game==='cube');
assert.deepEqual(all.map(t=>t.slug),['cube-first-lesson','notation','beginner-lbl','cfop-f2l','cfop-2look-ll','patterns']);
assert.deepEqual(all[0].steps.map(s=>s.id),['beginner-welcome','beginner-parts','beginner-controls','right-inverse','beginner-path']);
assert.deepEqual(all[1].steps.map(s=>s.id),['prerequisites','faces','suffixes','half-turn','trigger','sledge']);
assert.ok(!all[2].steps.some(s=>s.id==='notation'));
assert.deepEqual(all[2].steps.slice(0,4).map(s=>s.id),['what-counts-as-solved','two-kinds-of-recovery','recorded-scramble-recovery','unknown-scramble-roadmap']);
for(const t of all)for(const lang of ['zh','en']){
 const paragraphs=t.steps.flatMap(s=>s.body[lang]);
 assert.equal(new Set(paragraphs).size,paragraphs.length,t.slug);
 assert.ok(t.steps.every(s=>s.title[lang]&&s.body[lang].length>0&&s.body[lang].every(Boolean)),`${t.slug}/${lang} missing content`);
}
const ll=all[4].steps[0].body;
assert.ok(ll.zh.join('').includes('顺序不同'));
assert.ok(ll.en.join('').includes('orders differ'));
const sune=all[4].steps.find(s=>s.id==='co-sune');
assert.ok(sune.body.zh.join('').includes('三项都对'));
assert.ok(sune.body.en.join('').includes('do not simply replace R with L'));
assert.ok(!all[4].description.en.includes('cost-effective'),'course summary describes scope instead of unsupported learning promises');
assert.ok(all[5].steps[0].body.zh[0].includes('独立图案支线'));
// The interleaved trigger is taught once, not repeated as another introduction.
assert.equal(all.slice(0,2).flatMap(t=>t.steps).filter(s=>s.alg==="R U R' U'").length,1);
// Later solving cases may reuse a move sequence for a different prepared state.
assert.ok(!all[2].steps.some(s=>s.id==='notation'));
assert.equal(all[0].steps.find(s=>s.alg).alg,"R R'");
assert.ok(all[0].steps.find(s=>s.id==='right-inverse').body.zh[0].includes('「下一步」'),'instructions use the visible player button name');
assert.equal(all[1].steps.find(s=>s.id==='half-turn').alg,"R2 R' R'");
console.log('PASS: six stable cube courses, single basic trigger lesson, preserved inverse and half-turn examples, explicit prerequisites and distinct LBL/CFOP orders. Algorithm and browser checks remain separate.');
