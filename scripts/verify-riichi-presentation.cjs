const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {riichiTileCodes,explainRiichiYaku,explainRiichiDraw,explainRiichiAwards}=require('../lib/mahjong/presentation.ts');
assert.deepEqual(riichiTileCodes('m1-23'),['m1','m2','m3']);
assert.deepEqual(riichiTileCodes('p11+1'),['p1','p1','p1']);
assert.deepEqual(riichiTileCodes('s555+5'),['s5','s5','s5','s5']);
assert.deepEqual(riichiTileCodes('_____________'),[]);
assert.equal(riichiTileCodes('m123456p23455s678+').length,14);
const source=fs.readFileSync('node_modules/@kobalab/majiang-core/lib/hule.js','utf8');
const names=[...source.matchAll(/name:\s*'([^']+)'/g)].map(m=>m[1]).filter(n=>!n.endsWith(' '));
for(const locale of ['zh','en'])for(const name of [...names,'場風 東','自風 南','翻牌 白','翻牌 發','翻牌 中']){
  const text=explainRiichiYaku(name,locale);
  assert.ok(!/待补充|not yet available/.test(text),name);
  assert.notEqual(text,name,'must explain, not echo the engine label');
}
for(const name of ['荒牌平局','流し満貫','九種九牌','三家和','四家立直','四風連打','四開槓'])for(const locale of ['zh','en'])assert.ok(!/^(中止原因：|Hand ended:)/.test(explainRiichiDraw(name,locale)),'draw must have its specific explanation');
assert.match(explainRiichiYaku('ドラ','en'),/not a qualifying/);
assert.match(explainRiichiYaku('未定义役','zh'),/待补充/);
// Per-award values come from the actual score, including open/closed reduction.
const Majiang=require('@kobalab/majiang-core');
const base={zhuangfeng:0,menfeng:1,lizhi:1,baopai:['p4'],fubaopai:[],changbang:0,lizhibang:0};
const actual=Majiang.Util.hule(Majiang.Shoupai.fromString('m123456p23455s67'),'s8+',Majiang.Util.hule_param(base));
assert.equal(actual.fanshu,4);
assert.deepEqual(actual.hupai.map(y=>[y.name,y.fanshu]),[['立直',1],['平和',1],['ドラ',2]]);
for(const locale of ['zh','en']){
  const text=explainRiichiAwards(actual.hupai,locale);
  assert.match(text,locale==='zh'?/2 番奖励；不能单独取得和牌资格/:/2 han bonus; cannot qualify/);
  assert.equal((text.match(locale==='zh'?/本次计入/g:/Awarded this hand/g)||[]).length,3);
  for(const value of [1,2])assert.ok(explainRiichiAwards([{name:'三色同順',fanshu:value}],locale).includes(`${value} ${locale==='zh'?'番':'han'}`));
  for(const stars of ['*','**']){
    const special=explainRiichiAwards([{name:'大三元',fanshu:stars}],locale);
    assert.ok(special.includes(`${stars.length} ${locale==='zh'?'倍役满':'yakuman'}`));
    assert.ok(!special.includes('：'+stars));
  }
}
assert.match(fs.readFileSync('components/cards/RiichiPractice.tsx','utf8'),/explainRiichiAwards\(win.hupai,locale\)/,'local and remote result component uses awarded values');
console.log('Riichi presentation PASS: complete marked melds, concealed placeholders, 14-tile win, bilingual explanations for pinned engine yaku/draw labels. Text coverage is not a full pedagogy audit.');
