const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, file);
const { cubeTutorials } = require('../content/cube/tutorials.ts');
const { parseAlg, invertAlg } = require('../lib/cube/alg.ts');
const {stickerGrids,faceColors}=require('../lib/cube/stickers.ts');
// Independent integer sticker model: no Three.js or rendering implementation.
const faces = { R:[0,1], L:[0,-1], U:[1,1], D:[1,-1], F:[2,1], B:[2,-1] };
function fresh() {
  return Object.entries(faces).flatMap(([color,[axis,side]]) => {
    const result=[];
    for(let a=-1;a<=1;a++) for(let b=-1;b<=1;b++) {
      const p=[0,0,0], n=[0,0,0]; p[axis]=side;n[axis]=side;
      p[(axis+1)%3]=a;p[(axis+2)%3]=b; result.push({p,n,color});
    }
    return result;
  });
}
function apply(stickers, alg) {
  for(const {face,turns} of parseAlg(alg)) {
    const [axis,side]=faces[face], count=((-turns*side)%4+4)%4;
    for(const s of stickers.filter(s=>s.p[axis]===side)) for(let q=0;q<count;q++) {
      for(const v of [s.p,s.n]) { const a=(axis+1)%3,b=(axis+2)%3; [v[a],v[b]]=[-v[b],v[a]]; }
    }
  }
  return stickers;
}
const key = s => JSON.stringify(s);
const solved = fresh();
if(process.argv.includes('--derive-eo')) {
  const line="F R U R' U' F'", elbow="F U R U' R' F'";
  const yellowEdges=s=>s.filter(p=>p.color==='U' && p.p.filter(Boolean).length===2 && p.n[1]===1).map(p=>p.p);
  for(const alg of [elbow,...[line,elbow].flatMap(a=>[line,elbow].flatMap(b=>['','U',"U'",'U2'].map(u=>`${a} ${u} ${b}`)))]) {
    const setup=apply(fresh(),invertAlg(alg));
    console.log(alg, 'start yellow edges',yellowEdges(setup));
    console.log('after six',yellowEdges(apply(setup,parseAlg(alg).slice(0,6).map(m=>m.face+(m.turns===-1?"'":m.turns===2?'2':'')).join(' '))));
  }
  process.exit(0);
}
if(process.argv.includes('--derive-z')){
  const lesson=cubeTutorials.find(t=>t.slug==='cfop-2look-ll');
  const ua=lesson.steps.find(s=>s.id==='ep').alg,ub=lesson.steps.find(s=>s.id==='ep-ub').alg;
  const desired=solved.map(s=>{
    const copy=JSON.parse(JSON.stringify(s)),p=s.p;
    if(p[1]===1&&p.filter(Boolean).length===2){
      // Two adjacent swaps: front/right, back/left; top stickers stay up.
      copy.p=[p[2],1,p[0]];
      if(s.n[1]===0)copy.n=[s.n[2],0,s.n[0]];
    }
    return copy;
  });
  for(const a of [ua,ub])for(const b of [ua,ub])for(const u of ['U',"U'",'U2']){
    const alg=[a,u,b,invertAlg(u)].join(' ');
    if(key(apply(fresh(),alg))===key(desired))console.log('Z candidate:',alg);
  }
  for(const prefix of [ua,ua+" U'"]){
    const stage=apply(JSON.parse(JSON.stringify(desired)),prefix);
    console.log('checkpoint',parseAlg(prefix).length,['F','R','B','L'].map(face=>{const [axis,side]=faces[face];return [face,stage.find(s=>s.p[1]===1&&s.p.filter(Boolean).length===2&&s.n[axis]===side).color];}));
  }
  process.exit(0);
}
const f2lLesson=cubeTutorials.find(t=>t.slug==='cfop-f2l');
assert.equal(f2lLesson.steps.filter(s=>s.alg&&s.id!=='cross').length,3);
const crossLesson=f2lLesson.steps.find(s=>s.id==='cross');
assert.equal(crossLesson.alg,'F2');
assert.match(crossLesson.body.zh.join(' '),/侧面也要检查/);
assert.match(crossLesson.body.en.join(' '),/not an F2 solution for every scramble/);
assert.ok(!/步数直接减半|half the moves/.test(JSON.stringify(f2lLesson.description)));
const alignedPair=f2lLesson.steps.find(s=>s.id==='four-inserts');
assert.match(alignedPair.body.zh[0],/只转顶层/);
assert.match(alignedPair.body.en[0],/one specific starting position/);
assert.ok(!/四种基本插入|four basic inserts/i.test(JSON.stringify(alignedPair.title)));
const lookahead=f2lLesson.steps.find(s=>s.id==='lookahead');
assert.match(lookahead.body.zh.join(' '),/看不清就停下来/);
assert.match(lookahead.body.en.join(' '),/Pause whenever you lose track/);
const notation=cubeTutorials.find(t=>t.slug==='notation');
assert.ok(!/任何.*公式|any 3x3 algorithm|every tutorial/.test(JSON.stringify(notation)));
const trigger=notation.steps.find(s=>s.id==='trigger');
assert.match(trigger.body.zh.join(' '),/只演示一组四步/);
assert.match(trigger.body.en.join(' '),/scrambled start returns to that scramble/);
for(const setup of ['', "F R2 U B' L"]){
  const start=apply(fresh(),setup);
  const repeated=apply(JSON.parse(JSON.stringify(start)),Array(6).fill(trigger.alg).join(' '));
  assert.equal(key(repeated),key(start),'six complete triggers return to the actual starting state, not necessarily solved (normalize signed zero)');
}
// Corner recognition must include the skip case, including top-layer alignment.
const pll=cubeTutorials.find(t=>t.slug==='cfop-oll-pll') || cubeTutorials.find(t=>t.steps.some(s=>s.id==='cp'));
const cornerLesson=pll.steps.find(s=>s.id==='cp');
assert.match(cornerLesson.body.zh.join(' '),/四个侧面都有车灯/);
assert.match(cornerLesson.body.en.join(' '),/Skip corner swapping/);
for(const alignment of ['', 'U', "U'", 'U2']){
  const state=apply(fresh(),alignment);
  for(const face of ['F','B','L','R']){
    const [axis,side]=faces[face];
    const corners=state.filter(s=>s.n[axis]===side&&s.p[1]===1&&s.p.filter(Boolean).length===3);
    assert.equal(corners.length,2);
    assert.equal(corners[0].color,corners[1].color,'solved corner order has four headlight pairs even before final alignment');
  }
  assert.deepEqual(apply(state,invertAlg(alignment)),fresh(),'only a top adjustment is needed, not T/Y');
}
assert.notDeepEqual(apply(fresh(),cornerLesson.alg),fresh(),'T is not a no-op on already solved corners');
function grid(stickers, face) {
  const [axis,side]=faces[face];
  return stickers.filter(s=>s.n[axis]===side).sort((a,b)=>a.p[(axis+1)%3]-b.p[(axis+1)%3] || a.p[(axis+2)%3]-b.p[(axis+2)%3]).map(s=>s.color);
}
let count=0;
for(const tutorial of cubeTutorials) for(const step of tutorial.steps.filter(s=>s.alg)) {
  const setup=apply(fresh(),invertAlg(step.alg));
  if(tutorial.slug.startsWith('cfop')) {
    const start=fresh();
    for(let i=0;i<start.length;i++) {
      const target=start[i].p[0]===1 && start[i].p[2]===1 && start[i].p[1]<=0;
      if(step.id!=='cross' && start[i].p[1]<=0 && !(tutorial.slug==='cfop-f2l'&&target)) assert.equal(key(setup[i]),key(start[i]),`${step.id}: preserve other lower-layer pieces`);
    }
    if(step.id==='cross'){
      // This cross case may move front corners; it promises only three other
      // cross edges stay solved and the white-green edge starts at top-front.
      for(let i=0;i<start.length;i++){
        const p=start[i].p;
        if(p[1]!==-1||p.filter(Boolean).length!==2)continue;
        if(p[2]===1){
          assert.equal(key(setup[i].p),key([0,1,1]));
          if(start[i].color==='D')assert.equal(key(setup[i].n),key([0,1,0]));
          if(start[i].color==='F')assert.equal(key(setup[i].n),key([0,0,1]));
        }else assert.equal(key(setup[i]),key(start[i]),'other three cross edges remain solved');
      }
      assert.equal(parseAlg(step.alg).length,1,'half-turn is one manual step');
    }
    const top=stickerGrids(invertAlg(step.alg)).U;
    if(step.id==='eo') { assert.ok([3,4,5].every(i=>top[i]==='U'));assert.ok([1,7].every(i=>top[i]!=='U')); }
    if(['eo-l','eo-dot'].includes(step.id)) {
      const edgePositions=s=>s.filter(p=>p.color==='U'&&p.p.filter(Boolean).length===2&&p.n[1]===1).map(p=>key(p.p)).sort();
      const leftBack=[[-1,1,0],[0,1,-1]].map(key).sort();
      assert.deepEqual(edgePositions(setup),step.id==='eo-l'?leftBack:[],`${step.id}: actual recognition pattern`);
      assert.equal(parseAlg(step.alg).length,step.id==='eo-l'?6:13);
      if(step.id==='eo-dot') {
        const stage=apply(JSON.parse(JSON.stringify(setup)),"F R U R' U' F'");
        assert.deepEqual(edgePositions(stage),[[1,1,0],[0,1,1]].map(key).sort(),'step six is front-right L, not complete');
        for(let i=0;i<start.length;i++)if(start[i].p[1]<=0)assert.equal(key(stage[i]),key(start[i]),'first stage restores lower layers');
        apply(stage,'U2');
        assert.deepEqual(edgePositions(stage),leftBack,'step seven aligns L at back-left');
        assert.equal(key(apply(stage,"F U R U' R' F'")),key(start),'second stage finishes after thirteen explicit moves');
      }
    }
    if(step.id==='co-sune') {assert.equal([0,2,6,8].filter(i=>top[i]==='U').length,1);assert.equal(top[6],'U');}
    if(step.id==='co-rest') assert.ok([0,2,6,8].every(i=>top[i]!=='U'));
    if(['co-antisune','co-pi','co-headlights'].includes(step.id)) {
      // Recognition uses independent spatial coordinates, not inverse solvability alone.
      const upCorners=setup.filter(s=>s.color==='U' && s.n[1]===1 && s.p[0]!==0 && s.p[2]!==0).map(s=>s.p.join(',')).sort();
      const expected = step.id==='co-antisune' ? ['1,1,-1'] : step.id==='co-pi' ? [] : ['-1,1,-1','1,1,-1'];
      assert.deepEqual(upCorners,expected,`${step.id}: advertised yellow-facing corners`);
      const yellowAt=(p,n)=>setup.some(s=>s.color==='U'&&key(s.p)===key(p)&&key(s.n)===key(n));
      if(step.id==='co-antisune') {
        assert.ok(yellowAt([-1,1,1],[0,0,1]));
        assert.ok(yellowAt([1,1,1],[1,0,0]));
      }
      if(step.id==='co-pi') {
        assert.ok(yellowAt([-1,1,-1],[-1,0,0])&&yellowAt([-1,1,1],[-1,0,0]));
        assert.ok(yellowAt([1,1,1],[0,0,1])&&yellowAt([1,1,-1],[0,0,-1]));
      }
      if(step.id==='co-headlights') assert.ok(yellowAt([-1,1,1],[0,0,1])&&yellowAt([1,1,1],[0,0,1]));
      for(const s of setup.filter(s=>s.color==='U' && s.p.filter(Boolean).length===2)) assert.equal(key(s.n),key([0,1,0]),'yellow cross remains oriented');
    }
    if(['cp','ep','cp-y','ep-ub','ep-h','ep-z'].includes(step.id)) assert.ok(top.every(c=>c==='U'));
    if(['cp-y','ep-ub','ep-h','ep-z'].includes(step.id)) {
      const destination = p => {
        if(step.id==='cp-y') {
          if(key(p)===key([1,1,1])) return [-1,1,-1];
          if(key(p)===key([-1,1,-1])) return [1,1,1];
        }
        if(step.id==='ep-h' && p[1]===1 && p.filter(Boolean).length===2) return [-p[0],1,-p[2]];
        if(step.id==='ep-z' && p[1]===1 && p.filter(Boolean).length===2) return [p[2],1,p[0]];
        if(step.id==='ep-ub' && p[1]===1 && p.filter(Boolean).length===2) {
          if(p[2]===1) return [1,1,0];
          if(p[0]===1) return [-1,1,0];
          if(p[0]===-1) return [0,1,1];
        }
        return p;
      };
      for(let i=0;i<start.length;i++) {
        const isCorner=start[i].p.filter(Boolean).length===3;
        if(step.id==='cp-y' && !isCorner) continue;
        assert.equal(key(setup[i].p),key(destination(start[i].p)),`${step.id}: actual target piece position`);
      }
    }
    if(step.id==='ep-z'){
      assert.equal(parseAlg(step.alg).length,24);
      const stage=apply(JSON.parse(JSON.stringify(setup)),step.alg.split(' ').slice(0,11).join(' '));
      for(const [face,color] of Object.entries({F:'B',R:'R',B:'L',L:'F'})){
        const [axis,side]=faces[face];
        assert.equal(stage.find(s=>s.p[1]===1&&s.p.filter(Boolean).length===2&&s.n[axis]===side).color,color,'Z step11 exact edge checkpoint');
      }
      for(let i=0;i<solved.length;i++)if(solved[i].p.filter(Boolean).length===3)assert.equal(key(stage[i]),key(solved[i]),'Z step11 corners still correct');
      const beforeLast=apply(JSON.parse(JSON.stringify(setup)),step.alg.split(' ').slice(0,23).join(' '));
      assert.notEqual(key(beforeLast),key(solved),'Z must not be called solved before final U');
      assert.equal(key(apply(beforeLast,'U')),key(solved));
    }
    if(step.id==='pair-insert' || step.id==='four-inserts' || step.id==='split-pair') {
      const prefix=step.id==='pair-insert'?0:step.id==='four-inserts'?1:5;
      const staged=apply(fresh(),invertAlg(step.alg)+' '+step.alg.split(' ').slice(0,prefix).join(' '));
      for(let i=0;i<start.length;i++) {
        if(key(start[i].p)===key([1,-1,1])) {assert.deepEqual(staged[i].p,[-1,1,1]);if(start[i].color==='F')assert.deepEqual(staged[i].n,[0,1,0]);}
        if(key(start[i].p)===key([1,0,1])) {assert.deepEqual(staged[i].p,[0,1,1]);if(start[i].color==='F')assert.deepEqual(staged[i].n,[0,1,0]);}
      }
    }
  }
  const drawn=stickerGrids(invertAlg(step.alg));
  for(const face of Object.keys(faces)) assert.deepEqual([...drawn[face]].sort(),grid(setup,face).sort(),`${step.id}: diagram stickers agree with independent model`);
  if(process.argv.includes('--inspect-cases') && tutorial.slug.startsWith('cfop')) {
    console.log(step.id, Object.keys(faces).map(f=>f+':'+grid(setup,f).join('')).join(' '));
    console.log('D-F-R corner / F-R edge:', setup.filter(s=>(s.color==='D'&&s.p.filter(Boolean).length===3)|| (['F','R'].includes(s.color)&&s.p.filter(Boolean).length===2)).map(s=>s.color+'@'+s.p+' normal '+s.n).join(' | '));
  }
  assert.equal(key(apply(setup,step.alg)),key(solved), `${tutorial.slug}/${step.id}: inverse round trip`);
  if(tutorial.slug==='patterns') {
    const pattern=apply(fresh(),step.alg);
    assert.notEqual(key(pattern),key(solved),`${step.id}: must finish on a pattern`);
    if(process.argv.includes('--inspect')) console.log(step.id, Object.keys(faces).map(f=>f+':'+grid(pattern,f).join('')).join(' '));
    if(step.id==='checkerboard') for(const f of Object.keys(faces)) {
      const g=grid(pattern,f); assert.ok([0,2,4,6,8].every(i=>g[i]===g[4]));assert.ok([1,3,5,7].every(i=>g[i]===g[1]&&g[i]!==g[4]));
    }
    if(step.id==='dots') for(const f of Object.keys(faces)) { const g=grid(pattern,f); assert.ok(g.every((c,i)=>i===4||c===g[0]));assert.notEqual(g[4],g[0]); }
    if(step.id==='cross') for(const f of Object.keys(faces)) {const g=grid(pattern,f);assert.ok([1,3,4,5,7].every(i=>g[i]===f));assert.ok([0,2,6,8].every(i=>g[i]===g[0]&&g[i]!==f));}
    if(step.id==='cube-in-cube') for(const f of Object.keys(faces)) {
      const g=grid(pattern,f),square=[[0,1,3,4],[1,2,4,5],[3,4,6,7],[4,5,7,8]].find(indices=>indices.every(i=>g[i]===f));
      assert.ok(square,'cube-in-cube has a solid 2×2 block around each center');
      const outside=g.filter((_,i)=>!square.includes(i));assert.ok(outside.every(c=>c===outside[0]&&c!==f));
    }
    if(['checkerboard','dots','superflip'].includes(step.id)) {
      const repetitions=step.id==='dots'?3:2;
      assert.equal(key(apply(fresh(),Array(repetitions).fill(step.alg).join(' '))),key(solved),`${step.id}: advertised repetition order`);
    }
    if(step.id==='superflip') for(const s of pattern) {
      const layers=s.p.filter(v=>v!==0).length;
      const face=Object.keys(faces).find(f=>{const [axis,side]=faces[f];return s.n[axis]===side;});
      if(layers!==2) assert.equal(s.color,face,'superflip preserves corners and centers');
      else assert.notEqual(s.color,face,'superflip flips every edge sticker');
    }
  }
  count++;
}
console.log(`PASS: ${count} advanced cube algorithms round-trip; five patterns remain unsolved; checkerboard, six spots and superflip sticker properties verified.`);
assert.equal(faceColors('yellow-up').U,'yellow');assert.equal(faceColors('yellow-up').D,'white');
assert.equal(faceColors('yellow-up').F,'green');assert.equal(faceColors('yellow-up').R,'orange');
console.log('PASS: CFOP case recognition, F2L pair locations at insertion checkpoints, lower-layer preservation, diagram inventories and yellow-up palette.');
// Load the actual puzzle data with its one project alias resolved explicitly.
const puzzleExports = { exports: {} };
require('node:vm').runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../content/cube/puzzles.ts'),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText, {
  exports:puzzleExports.exports, module:puzzleExports,
  require: id => { assert.equal(id,'@/lib/cube/alg'); return {invertAlg}; },
});
const puzzleData=puzzleExports.exports.cubePuzzles;
for(const puzzle of puzzleData) assert.equal(key(apply(apply(fresh(),puzzle.setup),puzzle.solution)),key(solved),`${puzzle.id}: actual puzzle solves`);
const fish=puzzleData.find(p=>p.id==='sune');
const fishTop=stickerGrids(fish.setup).U;
assert.equal(faceColors('white-up').U,'white');
assert.equal([0,2,6,8].filter(i=>fishTop[i]==='U').length,1);
assert.match(fish.hint.zh,/白中心朝上/); assert.doesNotMatch(fish.hint.zh,/黄角/);
assert.match(fish.hint.en,/white center up/); assert.doesNotMatch(fish.hint.en,/yellow corner/i);
const tperm=puzzleData.find(p=>p.id==='tperm');
const tStart=fresh(),tSetup=apply(fresh(),tperm.setup);
const movedPositions=new Map();
tStart.forEach((s,i)=>{if(key(s.p)!==key(tSetup[i].p))movedPositions.set(key(s.p),s.p);});
const movedCorners=[...movedPositions.values()].filter(p=>p.filter(Boolean).length===3);
const movedEdges=[...movedPositions.values()].filter(p=>p.filter(Boolean).length===2);
assert.equal(movedCorners.length,2); assert.equal(movedEdges.length,2);
assert.ok([...movedPositions.values()].every(p=>p[1]===1),'T-perm only swaps top-layer pieces');
const distance=(a,b)=>a.reduce((sum,v,i)=>sum+Math.abs(v-b[i]),0);
assert.equal(distance(...movedCorners),2,'T-perm corners are adjacent');
assert.equal(distance(...movedEdges),2);
assert.ok(movedEdges[0][0]===-movedEdges[1][0]&&movedEdges[0][2]===-movedEdges[1][2],'T-perm edges are opposite');
console.log('PASS: six actual puzzle setups solve; fish recognition matches white-up palette and bilingual hint.');
if(process.argv.includes('--inspect-cases')) for(const alg of ["R U R'", "R U' R'", "U R U' R'", "U R U2 R' U R U' R'"]) {
  const start=fresh(), out=apply(fresh(),invertAlg(alg));
  console.log('TRACK',alg, start.map((s,i)=>({s,i})).filter(({s})=>key(s.p)===key([1,-1,1])||key(s.p)===key([1,0,1])).map(({s,i})=>s.color+' -> '+out[i].p+' / '+out[i].n));
}
