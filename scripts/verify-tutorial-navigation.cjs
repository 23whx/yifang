// Verify the published bilingual lessons and their real fragment targets.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {tutorials}=require('../content/tutorials.ts');
const root=path.resolve(__dirname,'../.next-static');
const cache=new Map();
function htmlAt(url){
 const file=path.join(root,decodeURIComponent(url.pathname),'index.html');
 assert.ok(fs.existsSync(file),`Missing tutorial route ${url.pathname}`);
 if(!cache.has(file))cache.set(file,fs.readFileSync(file,'utf8'));
 return cache.get(file);
}
let links=0,sections=0;
for(const locale of ['zh','en'])for(const t of tutorials){
 const url=new URL(`https://lesson.local/${locale}/${t.game}/learn/${t.slug}`),html=htmlAt(url);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length,`Duplicate IDs: ${url.pathname}`);
 for(const step of t.steps){assert.ok(ids.includes(`step-${step.id}`),`Missing section ${t.slug}/${step.id}`);sections++;}
 assert.ok(ids.includes('written-lesson'));
 if(t.slug!=='mahjong-terms'){
   assert.ok(ids.includes('guided-practice'));
   assert.ok(!html.includes('id="guided-practice"></div>'),`Empty practice anchor: ${t.slug}`);
 }
 for(const m of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)){
   const target=new URL(m[1].replaceAll('&amp;','&'),url);
   if(target.origin!==url.origin||!/^\/(zh|en)\/[^/]+\/learn(?:\/|$)/.test(target.pathname))continue;
   const dest=htmlAt(target);
   if(target.hash)assert.ok(dest.includes(`id="${decodeURIComponent(target.hash.slice(1))}"`),`Broken fragment ${url.pathname} → ${target.pathname}${target.hash}`);
   links++;
 }
 if(t.game==='cube')assert.equal(html.includes(locale==='zh'?'跟做：转动与逆转':'Try it: turns and inverses'),t.slug==='cube-first-lesson','Do not repeat first practice across all cube courses');
 if(t.slug==='mahjong-mcr'){
   const supplement=html.indexOf('id="mcr-extra-reference"');
   assert.ok(supplement>html.indexOf('id="step-mcr-check"'),'Read foundation before scoring supplements');
   assert.ok(html.indexOf('id="mahjong-mcr-core-complete"')<supplement,'Core practice stays separate');
   assert.ok(html.indexOf('id="mahjong-mcr-supplement-complete"')>supplement,'Optional exercises follow the supplementary diagrams');
 }
 if(t.slug==='mahjong-terms')assert.ok(!html.includes(locale==='zh'?'前六节先讲':'The first six sections introduce'),'Stale reference ordering');
}
console.log(`PASS: ${tutorials.length*2} published lesson pages, ${sections} section targets and ${links} lesson links/fragments; nonempty practice anchors, single cube foundation practice, MCR supplements after core. Does not verify runtime scrolling or mobile layout.`);
