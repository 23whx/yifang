// Independent sticker simulation; checks the working grips, not just inverse cancellation.
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {tutorials}=require('../content/tutorials.ts'),{invertAlg}=require('../lib/cube/alg.ts');
const lesson=tutorials.find(t=>t.slug==='beginner-lbl'),trigger=lesson.steps.find(s=>s.id==='white-corners').alg;
const axes={R:[0,1],L:[0,-1],U:[1,1],D:[1,-1],F:[2,1],B:[2,-1]};
function fresh(){return Object.entries(axes).flatMap(([color,[axis,side]])=>{
 const out=[];for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const p=[0,0,0],n=[0,0,0];p[axis]=side;n[axis]=side;p[(axis+1)%3]=a;p[(axis+2)%3]=b;out.push({p,n,color});}return out;
});}
function move(s,alg){for(const token of alg.split(/\s+/).filter(Boolean)){
 const [axis,side]=axes[token[0]],turns=token.endsWith('2')?2:token.endsWith("'")?-1:1;
 for(const t of s.filter(t=>t.p[axis]===side))for(let i=0;i<(4-turns*side)%4;i++)for(const v of [t.p,t.n]){const a=(axis+1)%3,b=(axis+2)%3;[v[a],v[b]]=[-v[b],v[a]];}
}return s;}
const at=(s,p)=>s.filter(t=>t.p.every((v,i)=>v===p[i]));
const normal=face=>{const v=[0,0,0];const [a,side]=axes[face];v[a]=side;return v;};
const solved=t=>t.n.every((v,i)=>v===normal(t.color)[i]);
const cornerSolved=s=>at(s,[1,-1,1]).every(solved);
const crossSolved=s=>s.filter(t=>t.p[1]===-1&&t.p.filter(Boolean).length===2).every(solved);
const orientations=new Set();
for(const groups of [1,3,5]){
 const s=move(fresh(),invertAlg(Array(groups).fill(trigger).join(' ')));
 const target=at(s,[1,1,1]);assert.deepEqual(target.map(t=>t.color).sort(),['D','F','R']);
 orientations.add(target.find(t=>t.color==='D').n.join(','));
 assert.ok(crossSolved(s));let performed=0;
 while(!cornerSolved(s)&&performed<6){move(s,trigger);performed++;assert.ok(crossSolved(s),'cross restored after each full group');}
 assert.equal(performed,groups);assert.ok(cornerSolved(s));
 const elsewhere=s.filter(t=>t.p[1]===-1&&!(t.p[0]===1&&t.p[2]===1));assert.ok(elsewhere.every(solved),'other bottom pieces retained');
}
assert.equal(orientations.size,3,'cover every white-sticker orientation at upper-front-right');
for(const alg of [lesson.steps.find(s=>s.id==='second-layer').alg,"U' L' U L U F U' F'"]){
 const s=move(fresh(),invertAlg(alg));assert.ok(s.filter(t=>t.p[1]===-1).every(solved));
 const candidate=at(s,[0,1,1]);assert.equal(candidate.find(t=>t.n[2]===1).color,'F','front sticker matches front center');
 const side=alg.startsWith("U'")?'L':'R';assert.equal(candidate.find(t=>t.n[1]===1).color,side,'top sticker determines insertion side');
 move(s,alg);assert.ok(s.every(solved));
}
const body=lesson.steps.find(s=>s.id==='white-corners').body;
assert.ok(body.zh.join('').includes('前右'));assert.ok(body.en.join('').includes('do not chase'));
assert.ok(lesson.steps.find(s=>s.id==='second-layer').body.zh[0].includes('不要上下翻转'));
function grip(s){for(const t of s)for(const v of [t.p,t.n]){[v[2],v[0]]=[-v[0],v[2]];}}
const petals=s=>s.filter(t=>t.color==='D'&&t.p.filter(Boolean).length===2&&t.n[1]===1);
const liftCases={down:0,middleLeft:0,middleRight:0,frontUp:0,frontDown:0};
function clear(s,p){for(let n=0;n<4;n++){if(!at(s,p).some(t=>t.color==='D'&&t.n[1]===1))return;move(s,'U');}throw Error('no free petal slot');}
function orient(s,condition){for(let n=0;n<4;n++){if(condition())return;grip(s);}throw Error('orientation not found');}
function crossFromText(s){
 let targets=0;
 while(petals(s).length<4){
  assert.ok(targets++<4,'each lift must gain one petal');const before=petals(s).length;
  const target=s.find(t=>t.color==='D'&&t.p.filter(Boolean).length===2&&t.n[1]!==1);
  if(target.n[1]===-1){liftCases.down++;orient(s,()=>target.p[2]===1);clear(s,[0,1,1]);move(s,'F2');}
  else{
   orient(s,()=>target.n[2]===1);
   if(target.p[1]!==0){liftCases[target.p[1]===-1?'frontDown':'frontUp']++;if(target.p[1]===-1)clear(s,[0,1,1]);move(s,'F');}
   const right=target.p[0]===1;liftCases[right?'middleRight':'middleLeft']++;clear(s,[right?1:-1,1,0]);move(s,right?'R':"L'");
  }
  assert.ok(petals(s).length>=before+1,'gain the target petal without losing completed petals; another may be lifted incidentally');
 }
 for(let n=0;n<4;n++){
  const white=petals(s)[0],other=at(s,white.p).find(t=>t!==white).color;
  orient(s,()=>at(s,[0,0,1])[0].color===other);
  for(let i=0;white.p[2]!==1&&i<4;i++)move(s,'U');
  assert.equal(white.p[2],1);assert.equal(at(s,[0,1,1]).find(t=>t.n[2]===1).color,other);move(s,'F2');
 }
 for(const t of s.filter(t=>t.p[1]===-1&&t.p.filter(Boolean).length===2))assert.equal(t.color,at(s,t.n)[0].color);
}
let seed=20260921;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
for(let trial=0;trial<300;trial++){
 const tokens=Array.from({length:25},()=>Object.keys(axes)[random()%6]+['',"'",'2'][random()%3]);
 crossFromText(move(fresh(),tokens.join(' ')));
}
for(const [name,count] of Object.entries(liftCases))assert.ok(count>0,`${name} must actually be exercised`);
console.log('PASS: white-corner 1/3/5 groups with cross/bottom preservation; both middle insertion grips; written four-case daisy procedure gains petals and builds aligned crosses on 300 deterministic 25-move legal scrambles. Native teaching/layout checked separately.');
