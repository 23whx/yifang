const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,f);
const {tutorials}=require('../content/tutorials.ts');
const courses=tutorials.filter(t=>t.game==='shogi');
assert.deepEqual(courses.map(t=>t.slug),['shogi-first-lesson','shogi-basics']);
assert.deepEqual(courses[0].steps.map(s=>s.id),['beginner-welcome','coordinates','pieces','beginner-turn','guided-opening','ready-for-next']);
assert.deepEqual(courses[1].steps.map(s=>s.id),['prerequisites','beginner-captured','drops','promotion','mate','repetition','strategy']);
for(const locale of ['zh','en'])for(const glyph of ['王','玉','金','銀','飛','角','香','桂','歩'])assert.ok(courses[0].steps.find(s=>s.id==='pieces').body[locale].join('').includes(glyph),'connect each basic piece name to its actual board glyph');
for(const lang of ['zh','en']){
 const all=courses.flatMap(t=>t.steps.flatMap(s=>s.body[lang]));assert.equal(new Set(all).size,all.length);
 assert.ok(courses[1].steps[0].body[lang].join(' ').includes(lang==='zh'?'第一课':'Lesson 1'));
}
(async()=>{
 const {default:create}=await import('../node_modules/ffish-es6/ffish.js');
 const f=await create({wasmBinary:fs.readFileSync(require.resolve('ffish-es6/ffish.wasm'))});
 for(const id of ['drops','promotion','mate']){
  const s=courses[1].steps.find(s=>s.id===id),b=new f.Board('shogi',s.position.fen);
  try{
   for(const m of s.position.moves)assert.ok(b.push(m));
   if(id==='mate'){assert.ok(b.isCheck());assert.equal(b.legalMoves(),'');}
   if(id==='drops'){assert.ok(b.isCheck());assert.ok(b.legalMoves().length>0,'silver drop checks but is not mate');assert.ok(b.legalMoves().split(' ').includes('f9f8'),'king can capture unprotected silver');}
   if(id==='promotion'){assert.match(b.fen(),/\+P/);assert.ok(!b.isCheck(),'promotion example does not check or mate');}
  }finally{b.delete();}
 }
 console.log('PASS: shogi nonduplicated two-course sequence, prerequisites, promotion, checking-but-not-mating silver drop, and actual gold-drop mate.');
})().catch(e=>{console.error(e);process.exitCode=1;});
