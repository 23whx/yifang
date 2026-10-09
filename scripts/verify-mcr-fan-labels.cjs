// Keep the scorer's 81 stable codes, the bilingual result UI and the coverage
// table aligned. WMO Chinese rulebook names #1/#9; #79 is printed 单调将 there.
// https://www.mindmahjong.com/adobe/ZC2021.pdf
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const js=require.extensions['.js'];
require.extensions['.js']=(module,file)=>file.replaceAll('\\','/').includes('/mahjong/vendor/')?require.extensions['.ts'](module,file):js(module,file);
const {MCR_FAN_CATALOG,getMcrFanDefinition}=require('../lib/mahjong/vendor/analysis/fan-catalog.js');
const {mcrEnglishFanNames,mcrFanLabel}=require('../content/mcr-fan-labels.ts');
const rows=fs.readFileSync(require('node:path').join(__dirname,'../docs/mcr-fan-coverage.md'),'utf8').split(/\r?\n/).flatMap(line=>{
 const match=/^\| (\d{2}) \| ([^|]+) \| ([^|]+) \|$/.exec(line);return match?[{index:Number(match[1]),name:match[2].trim(),evidence:match[3]}]:[];
});
assert.equal(MCR_FAN_CATALOG.length,81);assert.equal(mcrEnglishFanNames.length,81);assert.equal(rows.length,81);
const tier=index=>index<=7?88:index<=13?64:index<=15?48:index<=18?32:index<=27?24:index<=33?16:index<=38?12:index<=48?8:index<=54?6:index<=58?4:index<=68?2:1;
for(let index=1;index<=81;index++){
 const item=MCR_FAN_CATALOG[index-1],code='mcr-'+String(index).padStart(2,'0'),row=rows[index-1];
 assert.equal(row.index,index,'coverage-table order');assert.equal(item.code,code);assert.equal(item.ruleIndex,index);assert.equal(item.points,tier(index),code+' point tier');
 const verifiers=[...new Set(row.evidence.match(/verify-mcr-[a-z-]+/g)||[])];
 assert.ok(verifiers.length>0,`${code}: coverage row needs a named verifier; its presence alone does not prove the fan`);
 for(const verifier of verifiers)assert.ok(fs.existsSync(require('node:path').join(__dirname,verifier+'.cjs')),`${code}: missing mapped verifier ${verifier}`);
 assert.equal(getMcrFanDefinition(code),item);
 const expectedDisplay=index===57?'双明杠':row.name;
 assert.equal(mcrFanLabel(code,item.name,'zh'),expectedDisplay,code+' Chinese display/coverage title');
 assert.equal(mcrFanLabel(code,item.name,'en'),mcrEnglishFanNames[index-1],code+' English display/order');
 assert.ok(mcrEnglishFanNames[index-1].length>0&&/^[A-Z]/.test(mcrEnglishFanNames[index-1]),code+' English name');
 if(index!==57&&index!==79)assert.equal(item.name,row.name,code+' catalog/coverage title');
}
assert.equal(MCR_FAN_CATALOG[0].name,'大四喜');assert.equal(MCR_FAN_CATALOG[8].name,'小四喜');
assert.equal(MCR_FAN_CATALOG[78].name,'单调将','preserve source-book spelling in scorer provenance');
assert.equal(mcrFanLabel('mcr-79',MCR_FAN_CATALOG[78].name,'zh'),'单钓将','beginner-facing common spelling');
assert.equal(getMcrFanDefinition('mcr-00'),null);assert.equal(getMcrFanDefinition('mcr-82'),null);
console.log('PASS: 81 continuous MCR codes, point tiers, catalog/coverage names, existing named verifiers and bilingual result labels; mapping is not proof of each fan.');
