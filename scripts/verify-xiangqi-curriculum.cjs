const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,f);
const {tutorials}=require('../content/tutorials.ts');
const courses=tutorials.filter(t=>t.game==='xiangqi');
assert.deepEqual(courses.map(t=>t.slug),['xiangqi-first-lesson','xiangqi-basics','xiangqi-captures','xiangqi-defense']);
for(const t of courses){
  assert.equal(new Set(t.steps.map(s=>s.id)).size,t.steps.length);
  for(const s of t.steps)for(const lang of ['zh','en']){assert.ok(s.title[lang]);assert.ok(s.body[lang].length>=2);}
}
const intro=courses[0];
assert.equal(intro.steps.filter(s=>s.id==='pieces').length,1);
assert.ok(!intro.steps.some(s=>['setup','blocked','beginner-pieces','board','rook-horse-cannon','palace','end'].includes(s.id)));
for(const id of ['blocked-horse','blocked-elephant','cannon-capture','pawn','guided-opening'])assert.ok(intro.steps.some(s=>s.id===id));
for(const lang of ['zh','en']){
  const paragraphs=courses.flatMap(t=>t.steps.flatMap(s=>s.body[lang]));
  assert.equal(new Set(paragraphs).size,paragraphs.length,'no verbatim paragraph duplicates across the four published courses');
}
(async()=>{
 const {default:create}=await import('../node_modules/ffish-es6/ffish.js');
 const f=await create({wasmBinary:fs.readFileSync(require.resolve('ffish-es6/ffish.wasm'))});
 const exchange=courses[2].steps.find(s=>s.id==='protection').position;
 assert.deepEqual(exchange.moves,['a1a7','c8a7']);
 const exchangeBoard=new f.Board('xiangqi',exchange.fen);
 try{
   assert.equal(f.validateFen(exchange.fen,'xiangqi'),1);
   const rank7=()=>exchangeBoard.fen().split(' ')[0].split('/')[3];
   const material=()=>exchangeBoard.fen().split(' ')[0].replace(/[^a-z]/gi,'').split('').sort().join('');
   assert.equal(rank7(),'p8');
   assert.equal(material(),'KRknpp');
   assert.ok(exchangeBoard.push('a1a7'));assert.equal(rank7(),'R8');assert.equal(material(),'KRknp');
   assert.ok(exchangeBoard.push('c8a7'));assert.equal(rank7(),'n8');assert.equal(material(),'Kknp');
   assert.ok(!exchangeBoard.isGameOver(),'a completed exchange is not a full-game win');
 }finally{exchangeBoard.delete();}
 for(const s of courses[3].steps.filter(s=>s.position)){
  const b=new f.Board('xiangqi',s.position.fen);
  try{assert.ok(b.isCheck(),s.id+' begins in check');assert.ok(b.push(s.position.moves[0]));
    // Switch to the same side using a fresh FEN to ask whether its general is safe.
    const redFen=b.fen().replace(' b ',' w '),red=new f.Board('xiangqi',redFen);
    try{assert.ok(!red.isCheck(),s.id+' actually removes all checks');}finally{red.delete();}
  }finally{b.delete();}
 }
 console.log('PASS: consolidated intro, three distinct lessons, stable slugs, no duplicate paragraphs; capture/recapture changes actual occupants and losses without ending the game; three check responses resolve check.');
})().catch(e=>{console.error(e);process.exitCode=1;});
