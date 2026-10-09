const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const {renderToStaticMarkup} = require('react-dom/server');
const React = require('react');
const original = Module._resolveFilename;
Module._resolveFilename = function(request, ...args) {
  return original.call(this, request.startsWith('@/') ? require('node:path').resolve(__dirname, '..', request.slice(2)) : request, ...args);
};
for (const ext of ['.ts', '.tsx']) require.extensions[ext] = (m, file) => m._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2022, jsx:ts.JsxEmit.ReactJSX}}).outputText, file);
const {default:Tile, mahjongFlowers, mahjongTiles} = require('../components/cards/MahjongTile.tsx');
assert.deepEqual(mahjongFlowers, ['梅','兰','竹','菊','春','夏','秋','冬']);
const png = fs.readFileSync(require('node:path').resolve(__dirname, '../public/mahjong/flowers-generated-v1.png'));
assert.equal(png.subarray(1,4).toString(), 'PNG');
assert.equal(png.readUInt32BE(16) / png.readUInt32BE(20), 4 / 3);
for (const locale of ['zh','en']) for (const compact of [false,true]) {
  mahjongFlowers.forEach((tile,i) => {
    const html = renderToStaticMarkup(React.createElement(Tile,{tile,locale,compact}));
    assert.ok(html.includes('flowers-generated-v1.png'));
    assert.ok(html.includes(`background-position:${i%4*100/3}% ${Math.floor(i/4)*100}%`));
    assert.ok(html.includes('aria-label='));
    if (locale==='en' && compact) assert.ok(html.includes('w-28'), 'full English flower names need enough room on mobile');
    if (compact) assert.ok(renderToStaticMarkup(React.createElement(Tile,{tile,locale,compact,onDark:true})).includes('text-[#f3e7cd]'), 'action-button tile labels need light contrast');
  });
  for (const tile of mahjongTiles) assert.ok(renderToStaticMarkup(React.createElement(Tile,{tile,locale,compact})).includes('tiles-generated-v1.png'));
}
assert.ok(!renderToStaticMarkup(React.createElement(Tile,{tile:'unknown'})).includes('background-position'));
assert.ok(fs.readFileSync(require('node:path').resolve(__dirname, '../components/cards/RiichiPractice.tsx'), 'utf8').includes('<MahjongTile compact onDark'), 'riichi action-button tiles should use high-contrast labels');
console.log('PASS: 8 flower sprites × 2 languages × 2 sizes; base 34 artwork preserved; unknown tile fallback; PNG geometry. Not a browser visual test.');
