// Sequential full MCR regression, with generated logs and source stability proof.
// Deliberately named run-* so it cannot include itself in verify-mcr-*.cjs.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
function snapshot(){
 const files=['app','components','lib','scripts'].flatMap(dir=>walk(path.join(root,dir))).filter(f=>/\.(?:ts|tsx|js|cjs|json)$/.test(f));
 files.push(path.join(root,'package.json'),path.join(root,'package-lock.json'),path.join(root,'next.config.ts'));
 return Object.fromEntries(files.sort().map(f=>[path.relative(root,f).replaceAll('\\','/'),crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]));
}
const tests=fs.readdirSync(__dirname).filter(f=>/^verify-mcr-.*\.cjs$/.test(f)).sort();
if(!tests.length)throw new Error('No MCR verifier inventory');
const before=snapshot(),logDirectory=fs.mkdtempSync(path.join(os.tmpdir(),'yifang-mcr-suite-')),results=[],started=new Date().toISOString();
fs.writeFileSync(path.join(logDirectory,'source-before.json'),JSON.stringify(before,null,2));
console.log(`MCR_SUITE_START tests=${tests.length} logs=${logDirectory}`);
for(const [index,name] of tests.entries()){
 console.log(`START ${index+1}/${tests.length} ${name}`);
 const start=Date.now(),r=spawnSync(process.execPath,[path.join(__dirname,name)],{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024});
 fs.writeFileSync(path.join(logDirectory,`${name}.log`),(r.stdout??'')+(r.stderr??'')+(r.error?String(r.error):''));
 const passed=r.status===0&&!r.error,result={name,passed,exitCode:r.status,signal:r.signal,error:r.error?String(r.error):null,elapsedMs:Date.now()-start};results.push(result);
 console.log(`${passed?'PASS':'FAIL'} ${index+1}/${tests.length} ${name} ${result.elapsedMs}ms`);
 if(!passed)console.log((r.stderr||r.stdout||String(r.error)).slice(-6000));
}
const after=snapshot(),changed=[...new Set([...Object.keys(before),...Object.keys(after)])].filter(f=>before[f]!==after[f]);
const failures=results.filter(r=>!r.passed).length,summary={started,finished:new Date().toISOString(),total:tests.length,completed:results.length,failures,sourceUnchanged:changed.length===0,changed,results};
fs.writeFileSync(path.join(logDirectory,'source-after.json'),JSON.stringify(after,null,2));
fs.writeFileSync(path.join(logDirectory,'summary.json'),JSON.stringify(summary,null,2));
console.log(`SUMMARY completed=${results.length} failures=${failures} sourceUnchanged=${summary.sourceUnchanged} logs=${logDirectory}`);
if(failures||changed.length){console.log(`Changed sources: ${changed.join(', ')}`);process.exitCode=1;}
