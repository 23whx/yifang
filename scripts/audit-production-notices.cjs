// Read-only inventory of package-lock production entries. This is not a
// browser-bundle reachability graph or a legal compliance verdict.
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const lock=JSON.parse(fs.readFileSync(path.join(root,'package-lock.json'),'utf8'));
const rows=Object.entries(lock.packages)
 .filter(([name,entry])=>name.startsWith('node_modules/')&&!entry.dev)
 .map(([name,entry])=>{
  const directory=path.join(root,name),installed=fs.existsSync(directory);
  const topLevelNotices=installed?fs.readdirSync(directory).filter(file=>/^(LICENSE|LICENCE|COPYING|NOTICE|AUTHORS)(\.|$)/i.test(file)):[];
  return {name,version:entry.version,license:entry.license||null,installed,topLevelNotices};
 });
const missing=rows.filter(row=>row.installed&&!row.topLevelNotices.length);
const noMetadata=rows.filter(row=>row.installed&&!row.license);
const summary={lockEntries:rows.length,notInstalled:rows.filter(row=>!row.installed).length,installedWithTopLevelNotice:rows.filter(row=>row.installed&&row.topLevelNotices.length).length,installedWithoutTopLevelNotice:missing.length,installedWithoutLicenseMetadata:noMetadata.length};
console.log(JSON.stringify({summary,installedWithoutTopLevelNotice:missing.map(({name,version,license})=>({name,version,license})),installedWithoutLicenseMetadata:noMetadata.map(({name,version,topLevelNotices})=>({name,version,topLevelNotices}))},null,2));
