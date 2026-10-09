const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {tutorials}=require('../content/tutorials.ts');
const {goExercises,setupGoExercise,pointAt}=require('../content/go-exercises.ts');
const {group,playGo,scoreGo,newGo}=require('../lib/go/rules.ts');
const lessons=tutorials.filter(t=>t.game==='go');assert.equal(lessons.length,1);
assert.equal(lessons[0].slug,'go-first-lesson');
assert.deepEqual(lessons[0].steps.map(s=>s.id),['goal','coordinates','groups-liberties','captures','legality','survival','scoring']);
for(const lang of ['zh','en']){const p=lessons[0].steps.flatMap(s=>s.body[lang]);assert.equal(new Set(p).size,p.length);}
assert.equal(goExercises.length,14);
assert.deepEqual(['liberties','capture','suicide'].map(c=>goExercises.filter(e=>e.category===c).length),[6,4,4]);
for(const e of goExercises){
 const initial=setupGoExercise(e),saved=JSON.stringify(initial),p=pointAt(e.target);
 if(e.category==='liberties')assert.equal(group(initial.board,p,9).liberties.size,e.expected,e.id);
 else {const result=playGo(initial,p);if(e.expected==='suicide')assert.equal(result.error,'suicide',e.id);else{assert.ok(result.state,e.id);assert.equal(result.state.captures[0],e.expected,e.id);}}
 assert.equal(JSON.stringify(initial),saved,'exercise must not mutate its starting state');
 // Area totals do not receive an additional captured-stone bonus.
 assert.deepEqual(scoreGo(initial),scoreGo({...initial,captures:[30,20]}));
}
assert.equal(28+13+7.5-(30+10),8.5);
// Follow the written interface exercise, rather than manufacture its final score.
let preview=newGo(9);
for(const point of [pointAt('C3'),pointAt('G7'),null,null]){const result=playGo(preview,point);assert.ok(result.state);preview=result.state;}
assert.equal(preview.passes,2);assert.deepEqual(scoreGo(preview),{black:1,white:8.5});
assert.equal(playGo(preview,pointAt('D3')).error,'finished');
assert.ok(playGo({...preview,passes:0},pointAt('D3')).state,'resuming allows another legal move');
const scoring=lessons[0].steps.find(s=>s.id==='scoring');
assert.ok(scoring.body.zh.join('').includes('同屏练习由操作者代双方检查'));
assert.ok(scoring.body.en.join('').includes('deliberately early passes'));
console.log('PASS: seven-stage Go course, unique paragraphs, unchanged 14 exercises match their actual rule outcomes, immutable starts, no prisoner bonus in area scoring. Not full ko/life-and-death instruction acceptance.');
