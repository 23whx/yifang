// Reproduce the exact, version-pinned MIT notices for direct production packages.
// MCR packages are intentionally omitted: their published tarballs lack complete notices.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const destination=path.join(root,'public/licenses/direct-mit-notices.txt');
const directDependencies=Object.keys(JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).dependencies);
const unresolvedMcr=new Set(['miaoda-game-mcr-mahjong-analysis-core','miaoda-game-mcr-mahjong-rules']);
const packages=[
 ['@kobalab/majiang-core','1.4.1','LICENSE'],
 ['@react-three/drei','10.7.7','LICENSE'],
 ['@react-three/fiber','9.6.1',null],
 ['next','16.2.12','license.md'],
 ['peerjs','1.5.5','LICENSE'],
 ['react','19.2.4','LICENSE'],
 ['react-dom','19.2.4','LICENSE'],
 ['three','0.185.1','LICENSE'],
];
const listed=new Set(packages.map(([name])=>name));
for(const name of listed)assert.ok(directDependencies.includes(name),`${name} is no longer a direct dependency; re-audit`);
for(const name of unresolvedMcr)assert.ok(directDependencies.includes(name),`${name} unresolved-license note is stale`);
for(const name of directDependencies){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'node_modules',name,'package.json'),'utf8'));
 if(unresolvedMcr.has(name)){
  assert.equal(manifest.license,'MIT');
  assert.equal(manifest.version,'0.3.1');
  continue;
 }
 if(manifest.license==='MIT')assert.ok(listed.has(name),`new direct MIT package ${name} needs notice review`);
}
assert.equal(listed.size,8);
const normalize=text=>text.replace(/\r\n/g,'\n').trimEnd();
const entries=packages.map(([name,version,file])=>{
 const packageRoot=path.join(root,'node_modules',name);
 const manifest=JSON.parse(fs.readFileSync(path.join(packageRoot,'package.json'),'utf8'));
 assert.equal(manifest.version,version,`${name} version changed; re-audit its notice`);
 assert.equal(manifest.license,'MIT',`${name} license metadata changed; re-audit`);
 let notice;
 if(file)notice=fs.readFileSync(path.join(packageRoot,file),'utf8');
 else{
  const fallback=fs.readFileSync(path.join(root,'public/licenses/react-three-fiber.txt'),'utf8');
  assert.ok(fallback.startsWith(`${name} ${version}\n`));
  notice=fallback.slice(fallback.indexOf('MIT License'));
 }
 notice=normalize(notice);
 assert.ok(notice.includes('MIT License'),`${name} notice must identify its MIT terms`);
 assert.ok(notice.includes('Copyright')&&notice.includes('Permission is hereby granted')&&notice.includes('THE SOFTWARE IS PROVIDED'),`${name} notice appears incomplete`);
 return `${name}@${version}\n\n${notice}`;
});
const output=[
 'Direct MIT dependency notices — Yifang',
 'These are the complete notices currently available for the eight listed direct production dependencies. They do not resolve the two MCR packages whose published archives lack complete notice/copyright information, the GPL engine source obligations, or transitive packages and media assets. See docs/third-party-license-audit.md in the project source for the open audit.',
 ...entries,
].join('\n\n-----\n\n')+'\n';
assert.ok(fs.readFileSync(path.join(root,'components/ui/SiteFooter.tsx'),'utf8').includes('/licenses/direct-mit-notices.txt'));
if(process.argv.includes('--write')){
 fs.writeFileSync(destination,output,'utf8');
 console.log(`Wrote ${path.relative(root,destination)} for ${entries.length} exact package versions.`);
}else{
 assert.equal(fs.readFileSync(destination,'utf8'),output,'MIT notice bundle is stale; run node scripts/direct-mit-notices.cjs --write after re-auditing package changes');
 console.log(`PASS: ${entries.length} direct MIT notices are complete and current for the installed package versions.`);
}
