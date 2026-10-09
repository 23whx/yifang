// Archive installed production-package notices for offline review, NOT release
// approval, Corresponding Source, browser reachability or complete legal terms.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),lock=JSON.parse(fs.readFileSync(path.join(root,'package-lock.json'),'utf8'));
const sha256=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const files=[],rows=[];
for(const [entry,metadata] of Object.entries(lock.packages).sort(([a],[b])=>a.localeCompare(b))){
 if(!entry.startsWith('node_modules/')||metadata.dev)continue;
 const directory=path.join(root,entry),installed=fs.existsSync(directory);
 const row={entry,lockedVersion:metadata.version,licenseMetadata:metadata.license||null,installed,notices:[]};
 if(installed){
  const manifest=JSON.parse(fs.readFileSync(path.join(directory,'package.json'),'utf8'));
  assert.equal(manifest.version,metadata.version,`${entry}: install/lock mismatch`);
  row.packageName=manifest.name;
  for(const file of fs.readdirSync(directory).sort()){
   if(!/^(LICENSE|LICENCE|COPYING|NOTICE|AUTHORS|COPYRIGHT)([-_.]|$)/i.test(file))continue;
   const source=path.join(directory,file);
   if(!fs.statSync(source).isFile())continue; // A named directory is not a notice file.
   const bytes=fs.readFileSync(source);let validUtf8=true,text='';
   try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{validUtf8=false;}
   const relative=`${entry}/${file}`,digest=sha256(bytes);
   row.notices.push({file,bytes:bytes.length,sha256:digest,validUtf8,
    // Literal observations only: an AUTHORS file is not itself permission,
    // and keywords cannot establish full terms or rightful ownership.
    hasCopyrightLiteral:/copyright/i.test(text),hasPermissionLiteral:/permission is hereby granted/i.test(text),
    archive:relative});
   files.push({source,relative,sha256:digest});
  }
 }
 rows.push(row);
}
const report={scope:'Installed production lock entries and top-level notice files only; includes packages not necessarily shipped to browsers. No inferred authors or permission.',
 warning:'NOT redistribution clearance, complete nested/transitive notices, source correspondence, media provenance or integration legal review. License metadata and textual keywords are evidence, not authorization.',
 packageLockSha256:sha256(fs.readFileSync(path.join(root,'package-lock.json'))),
 summary:{lockEntries:rows.length,installed:rows.filter(r=>r.installed).length,notInstalled:rows.filter(r=>!r.installed).length,
  installedWithNotices:rows.filter(r=>r.installed&&r.notices.length).length,installedWithoutNotices:rows.filter(r=>r.installed&&!r.notices.length).length,noticeFiles:files.length},
 rows};
const destination=path.join(root,'docs/verification/production-notices-2026-09-30');
if(process.argv.includes('--check-archive')){
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(destination,'report.json'),'utf8')),report,'Archived inventory differs from current lock/install notice evidence');
 for(const file of files)assert.equal(sha256(fs.readFileSync(path.join(destination,file.relative))),file.sha256,`${file.relative}: archived notice bytes changed`);
 const walk=directory=>fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
  const file=path.join(directory,entry.name);assert.ok(!entry.isSymbolicLink(),'Unexpected archive symlink');
  return entry.isDirectory()?walk(file):[path.relative(destination,file).replaceAll('\\','/')];
 });
 assert.deepEqual(walk(destination).sort(),['report.json',...files.map(f=>f.relative)].sort(),'Archive contains missing or unexpected files');
 console.log(`PASS: archived report matches current installed/locked evidence; all ${files.length} notice hashes and exact archive file inventory match. NOT legal clearance.`);
}else if(process.argv.includes('--archive')){
 // Fixed, newly-created evidence destination. Refuse overwrites or partial
 // replacement of a previous audit; no installed/public package is changed.
 assert.ok(!fs.existsSync(destination),'Archive already exists; inspect it rather than overwrite');
 fs.mkdirSync(destination,{recursive:true});
 for(const file of files){
  const target=path.resolve(destination,file.relative);
  assert.ok(target.startsWith(destination+path.sep),'Archive path escapes destination');
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.copyFileSync(file.source,target,fs.constants.COPYFILE_EXCL);
  assert.equal(sha256(fs.readFileSync(target)),file.sha256,`${file.relative}: copied bytes changed`);
 }
 fs.writeFileSync(path.join(destination,'report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 console.log(`PASS: archived ${files.length} byte-identical original notice files; ${JSON.stringify(report.summary)}. ${path.relative(root,destination)}. Review evidence only, NOT license clearance.`);
}else console.log(JSON.stringify(report,null,2));
