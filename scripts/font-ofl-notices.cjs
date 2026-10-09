// Preserve complete, version-pinned notices for the four self-hosted fonts.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const destination=path.join(root,'public/licenses/font-ofl-notices.txt');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const layout=fs.readFileSync(path.join(root,'app/[locale]/layout.tsx'),'utf8');
const packages=['big-shoulders','literata','noto-sans-sc','noto-serif-sc'];
const entries=packages.map(name=>{
 const id=`@fontsource-variable/${name}`;
 assert.equal(manifest.dependencies[id],'5.3.0',`${id} must remain pinned until the notice is re-audited`);
 assert.ok(layout.includes(`"${id}/${name==='big-shoulders'||name==='literata'?'standard':'wght'}.css"`),`${id} stylesheet is not imported`);
 const installed=path.join(root,'node_modules',id);
 const packageJson=JSON.parse(fs.readFileSync(path.join(installed,'package.json'),'utf8'));
 assert.equal(packageJson.version,'5.3.0');
 assert.equal(packageJson.license,'OFL-1.1');
 const notice=fs.readFileSync(path.join(installed,'LICENSE'),'utf8').replace(/\r\n/g,'\n').trimEnd();
 for(const section of ['SIL OPEN FONT LICENSE Version 1.1','PREAMBLE','PERMISSION & CONDITIONS','TERMINATION'])assert.ok(notice.includes(section),`${id} notice appears incomplete: ${section}`);
 return `${id}@5.3.0\n\n${notice}`;
});
const output=[
 'Self-hosted font notices — Yifang',
 'Complete notices copied from the four pinned Fontsource packages whose font files are bundled by this site. This document does not close the separate MCR, GPL engine, or other dependency/media audits.',
 ...entries,
].join('\n\n-----\n\n')+'\n';
assert.ok(fs.readFileSync(path.join(root,'components/ui/SiteFooter.tsx'),'utf8').includes('/licenses/font-ofl-notices.txt'));
if(process.argv.includes('--write')){
 fs.writeFileSync(destination,output,'utf8');
 console.log(`Wrote ${path.relative(root,destination)} for ${entries.length} OFL packages.`);
}else{
 assert.equal(fs.readFileSync(destination,'utf8'),output,'Font notice bundle is stale; re-audit the packages before --write');
 console.log(`PASS: ${entries.length} pinned OFL font notices match the installed package licenses and footer link.`);
}
