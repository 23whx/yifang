// Read-only inventory of modules named in an isolated Webpack browser build's source maps.
// No source maps are enabled in the normal app config or committed as site assets.
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const chunks=path.resolve(root,process.argv[2]??'.next-preview/static/chunks');
const targets=[
  '@mediapipe/tasks-vision','@next/env','@next/swc-win32-x64-msvc',
  '@react-three/fiber','client-only','draco3d','ffish-es6','maath',
  'miaoda-game-mcr-mahjong-analysis-core','miaoda-game-mcr-mahjong-rules','stats-gl',
];
function walk(dir){
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    const file=path.join(dir,entry.name);
    return entry.isDirectory()?walk(file):[file];
  });
}
if(!fs.existsSync(chunks))throw new Error(`Missing isolated browser build: ${chunks}`);
const files=walk(chunks),javascript=files.filter(file=>file.endsWith('.js'));
const maps=files.filter(file=>file.endsWith('.js.map'));
if(!maps.length)throw new Error('No browser source maps. Use an isolated audit build, never the public build.');
const unmapped=javascript.filter(file=>!fs.existsSync(`${file}.map`));
const significant=unmapped.filter(file=>fs.statSync(file).size>1000&&!path.basename(file).startsWith('polyfills-'));
if(significant.length)throw new Error(`Nontrivial JavaScript without source maps: ${significant.map(file=>path.relative(root,file)).join(', ')}`);
const hits=new Map(targets.map(name=>[name,new Set()]));
for(const file of maps){
  const map=JSON.parse(fs.readFileSync(file,'utf8'));
  if(!Array.isArray(map.sources))throw new Error(`Missing sources in ${file}`);
  for(const source of map.sources){
    const normalized=source.replaceAll('\\','/');
    for(const name of targets){
      if(normalized.includes(`/node_modules/${name}/`))hits.get(name).add(path.relative(chunks,file));
    }
  }
}
console.log(`Isolated browser build: ${javascript.length} JS files, ${maps.length} source maps, ${unmapped.length} unmapped bootstrap/polyfill files.`);
for(const name of targets)console.log(`${name}: ${hits.get(name).size} mapped browser chunk(s)`);
console.log('Zero mapped chunks is evidence limited to this build, not proof that a package is never distributed. Public engine files and unbundled assets are outside this scan.');
