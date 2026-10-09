// Integrity of the engine objects and notices copied from pinned npm packages.
// This is not a GPL corresponding-source or legal-compliance certification.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),publicEngine=path.join(root,'public/engine');
const sources=[
 {name:'ffish-es6',version:'0.7.10',files:['ffish.js','ffish.wasm']},
 {name:'fairy-stockfish-nnue.wasm',version:'1.1.12',files:['stockfish.js','stockfish.wasm','stockfish.worker.js','Copying.txt','AUTHORS']},
];
for(const source of sources){
 const packageRoot=path.join(root,'node_modules',source.name);
 const metadata=JSON.parse(fs.readFileSync(path.join(packageRoot,'package.json'),'utf8'));
 assert.equal(metadata.name,source.name);
 assert.equal(metadata.version,source.version);
 assert.equal(metadata.license,'GPL-3.0');
 for(const filename of source.files){
  const from=path.join(packageRoot,filename),to=path.join(publicEngine,filename);
  assert.ok(fs.existsSync(from),source.name+' missing package file '+filename);
  assert.ok(fs.existsSync(to),'public/engine missing '+filename);
  const digest=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  assert.equal(digest(to),digest(from),'public/engine/'+filename+' differs from '+source.name);
 }
}
// The installed 1.1.12 binary embeds the short commit of the upstream
// 1.1.12 tag and the Emscripten version in that tag's Docker build recipe.
// This is a provenance clue, not proof that the binary is reproducible from
// that source tree or that all GPL distribution duties are satisfied.
const wasm=fs.readFileSync(path.join(publicEngine,'stockfish.wasm'));
const buildMarker=Buffer.from('[commit: b2e693ef, upstream: , emscripten: 2.0.26]');
assert.ok(wasm.indexOf(buildMarker)>=0,'stockfish.wasm lacks audited upstream build marker');
assert.equal(wasm.indexOf(buildMarker),wasm.lastIndexOf(buildMarker),'stockfish.wasm contains repeated build marker');
assert.deepEqual(fs.readFileSync(path.join(publicEngine,'AUTHORS.txt')),fs.readFileSync(path.join(publicEngine,'AUTHORS')),'readable .txt alias must be byte-identical to the copied upstream AUTHORS');
const footer=fs.readFileSync(path.join(root,'components/ui/SiteFooter.tsx'),'utf8');
assert.ok(footer.includes('/engine/Copying.txt')&&footer.includes('/engine/AUTHORS.txt'),'footer must expose copied GPL notice and readable authors');
assert.ok(footer.includes('https://github.com/fairy-stockfish/Fairy-Stockfish/commit/43b66c8abfebfcab893a3a4c349aa790d18df148'));
assert.ok(footer.includes('https://github.com/fairy-stockfish/fairy-stockfish.wasm/tree/1.1.12'));
assert.ok(footer.includes('correspondence unverified')&&footer.includes('仍待对应核验'),'footer must not present candidate sources as proven');
console.log('PASS: seven copied engine/notice files match pinned GPL npm packages; readable AUTHORS.txt matches the copied original and footer links fixed source candidates with an explicit caveat. Exact corresponding source and integration obligations remain unverified.');
