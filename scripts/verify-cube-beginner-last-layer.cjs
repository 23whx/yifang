// Independent integer-sticker simulation of the written beginner procedure.
// Unlike inverse-fixture tests, this explores every reachable top-corner state.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,f);
const { tutorials } = require('../content/tutorials.ts');
const lesson=tutorials.find(t=>t.slug==='beginner-lbl');
const placement=lesson.steps.find(s=>s.id==='yellow-face').alg;
const twisting=lesson.steps.find(s=>s.id==='corner-permutation').alg;
const edgeCycle=lesson.steps.find(s=>s.id==='edge-permutation').alg;
const axes={R:[0,1],L:[0,-1],U:[1,1],D:[1,-1],F:[2,1],B:[2,-1]};
function fresh(){return Object.entries(axes).flatMap(([color,[axis,side]])=>{
  const out=[];for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){
    const p=[0,0,0],n=[0,0,0];p[axis]=side;n[axis]=side;p[(axis+1)%3]=a;p[(axis+2)%3]=b;out.push({p,n,color});
  }return out;
});}
function rotate(v,axis){const a=(axis+1)%3,b=(axis+2)%3;[v[a],v[b]]=[-v[b],v[a]];}
function move(state,alg){for(const token of alg.split(/\s+/).filter(Boolean)){
  assert.match(token,/^[UDLRFB](?:'|2)?$/);
  const [axis,side]=axes[token[0]],turns=token.endsWith('2')?2:token.endsWith("'")?-1:1;
  for(const s of state.filter(s=>s.p[axis]===side))for(let q=0;q<(4-turns*side)%4;q++){rotate(s.p,axis);rotate(s.n,axis);}
}return state;}
const clone=s=>JSON.parse(JSON.stringify(s));
const at=(s,p)=>s.filter(t=>t.p.every((v,i)=>v===p[i]));
const corners=[[1,1,1],[-1,1,1],[-1,1,-1],[1,1,-1]];
const center=(s,n)=>at(s,n)[0].color;
function rightLocation(s,p){
  const wanted=p.map((v,i)=>{const n=[0,0,0];n[i]=v;return center(s,n);}).sort().join('');
  return at(s,p).map(t=>t.color).sort().join('')===wanted;
}
const correct=s=>corners.filter(p=>rightLocation(s,p));
const solvedSticker=(s,t)=>t.color===center(s,t.n);
function grip(s){for(const t of s){rotate(t.p,1);rotate(t.n,1);}}
function followText(s){
  // Inspect all U alignments, as the text instructs, before cycling corners.
  for(let attempt=0;attempt<8;attempt++){
    let good=correct(s);
    if(good.length===4)break;
    for(let q=0;q<3&&good.length!==1&&good.length!==4;q++){move(s,'U');good=correct(s);}
    if(good.length===4)break;
    if(good.length===1){for(let q=0;q<4&&!rightLocation(s,[1,1,1]);q++)grip(s);assert.ok(rightLocation(s,[1,1,1]));}
    move(s,placement);
  }
  assert.equal(correct(s).length,4,'written placement process must terminate');
  const top=center(s,[0,1,0]);
  // Four fixed-grip work positions; completed corners need no trigger.
  for(let corner=0;corner<4;corner++){
    let groups=0;
    const upright=()=>at(s,[1,1,1]).find(t=>t.n[1]===1).color===top;
    while(!upright()&&groups<6){move(s,"R' D' R D");groups++;}
    assert.ok(upright(),'corner can be oriented with complete groups');
    assert.ok([0,2,4].includes(groups),'legal corner takes zero, two or four groups');
    move(s,'U');
  }
  assert.ok(s.filter(t=>t.p[1]<1||t.p.filter(Boolean).length===3).every(t=>solvedSticker(s,t)), 'all corners and lower layers restored');
  const edgePlaces=[[0,1,1],[1,1,0],[0,1,-1],[-1,1,0]];
  const edgeCorrect=p=>at(s,p).every(t=>solvedSticker(s,t));
  for(let attempt=0;attempt<4;attempt++){
    const good=edgePlaces.filter(edgeCorrect);
    if(good.length===4)break;
    if(good.length===1){for(let q=0;q<4&&!edgeCorrect([0,1,-1]);q++)grip(s);assert.ok(edgeCorrect([0,1,-1]));}
    move(s,edgeCycle);
  }
  assert.ok(s.every(t=>solvedSticker(s,t)), 'last edge procedure finishes all six faces');
}
const key=s=>corners.map(p=>at(s,p).sort((a,b)=>a.n.join().localeCompare(b.n.join())).map(t=>`${t.n}:${t.color}`).join('|')).join('/');
const states=new Map([[key(fresh()),fresh()]]),queue=[fresh()];
for(let i=0;i<queue.length;i++)for(const alg of ['U',placement,twisting]){
  const next=move(clone(queue[i]),alg),k=key(next);
  if(!states.has(k)){states.set(k,next);queue.push(next);}
  assert.ok(states.size<=648,'24 permutations times 27 legal corner orientations');
}
assert.equal(states.size,648,'cover all top corner permutations and twists, not just one inverse example');
// Generate all 12 even edge permutations without changing corners, using
// conjugates of the actual lesson algorithm. Combine with each corner state.
const edgeKey=s=>[[0,1,1],[1,1,0],[0,1,-1],[-1,1,0]].map(p=>at(s,p).map(t=>t.color).sort().join('')).join('/');
const edgeSequences=new Map([[edgeKey(fresh()),'']]),edgeQueue=[''];
for(let i=0;i<edgeQueue.length;i++)for(const alg of [edgeCycle,`U ${edgeCycle} U'`]){
  const sequence=`${edgeQueue[i]} ${alg}`,next=move(fresh(),sequence),k=edgeKey(next);
  assert.equal(key(next),key(fresh()),'edge generator leaves corners solved');
  if(!edgeSequences.has(k)){edgeSequences.set(k,sequence);edgeQueue.push(sequence);}
}
assert.equal(edgeSequences.size,12);
let checked=0;
const uniqueStates=new Set();
for(const s of states.values()){
  assert.ok(s.filter(t=>t.p[1]<1).every(t=>solvedSticker(s,t)),'generated states preserve the two lower layers');
  for(const sequence of edgeSequences.values()){
    const candidate=move(clone(s),sequence);
    assert.ok(candidate.filter(t=>t.p[1]===1&&t.p.filter(Boolean).length===2&&t.n[1]===1).every(t=>t.color==='U'),'every starting edge has yellow upwards');
    uniqueStates.add(JSON.stringify(candidate));
    followText(candidate);checked++;
  }
}
assert.equal(checked,7776);
assert.equal(uniqueStates.size,7776,'all test inputs distinct; no inflated coverage from repeated states');
console.log('PASS: written beginner placement, fixed-grip corner orientation and final edge procedure solve all 7776 legal last-layer states with yellow edge cross already oriented; all six faces solved. Does not prove white-cross, middle-layer or yellow-cross instruction coverage.');
