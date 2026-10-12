// Render the Open Graph / Twitter share cards (1200×630) into public/social/.
// Usage: node scripts/generate-social-images.cjs   (needs playwright-core and an installed Chromium)
// One site card per locale plus one card per game per locale, all built from the site's own artwork.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const ts = require('typescript'), Module = require('node:module');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..'), out = path.join(root, 'public', 'social');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return resolve.call(this, request.startsWith('@/') ? path.join(root, request.slice(2)) : request, ...args);
};
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, file);
const { games } = require('../content/games.ts');
const { socialCards } = require('../content/social.ts');
let chromium;
try { ({ chromium } = require('playwright-core')); } catch {
  console.error('playwright-core is not installed. Run: npm i -D playwright-core && npx playwright-core install chromium');
  process.exit(1);
}

const file = relative => pathToFileURL(path.join(root, relative)).href;
const escape = text => String(text).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
// buildings.webp is a 4×2 sprite in the same order as content/games.ts.
const sprite = index => `background-position:${(index % 4) * 100 / 3}% ${Math.floor(index / 4) * 100}%`;

const style = `
@import url("${file('node_modules/@fontsource-variable/noto-serif-sc/index.css')}");
@import url("${file('node_modules/@fontsource-variable/literata/standard.css')}");
*{box-sizing:border-box;margin:0}
html,body{width:1200px;height:630px;overflow:hidden}
body{background:#21170f url("${file('public/atlas/desk-scene-v2.webp')}") center/cover;font-family:"Noto Serif SC Variable","Literata Variable",Georgia,serif;color:#392616;position:relative}
body::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 72% 45%,#0000 30%,#0f0a0699 100%);pointer-events:none}
.card{position:absolute;left:56px;top:56px;bottom:56px;width:640px;padding:44px 48px 40px;z-index:2;
  background:linear-gradient(160deg,#f6ecd6,#ead6b1);border:2px solid #ae8550;outline:6px solid #21170fcc;
  box-shadow:0 24px 60px #000a,inset 0 0 60px #ae85503d;display:flex;flex-direction:column}
.brand{font-size:26px;font-weight:700;letter-spacing:.06em;color:#803d2b;display:flex;align-items:center;gap:14px}
.brand i{display:block;width:30px;height:30px;border:2px solid #803d2b;transform:rotate(45deg);position:relative}
.brand i::after{content:"";position:absolute;inset:6px;background:#803d2b}
.rule{height:2px;background:linear-gradient(90deg,#ae8550,#ae855000);margin:24px 0 26px}
html[lang=en] body{font-family:"Literata Variable","Noto Serif SC Variable",Georgia,serif}
h1{font-size:68px;line-height:1.12;font-weight:900;letter-spacing:.02em;color:#21170f}
h1.en{font-size:58px;letter-spacing:0;line-height:1.08}
p{margin-top:20px;font-size:28px;line-height:1.5;color:#4b3522}
p.en{font-size:25px}
.tags{margin-top:auto;display:flex;flex-wrap:wrap;gap:10px}
.tags span{font-size:20px;font-weight:600;padding:5px 13px;border:1.5px solid #ae8550;background:#fbf4e4;color:#5a3d24}
.tags span.free{background:#803d2b;border-color:#803d2b;color:#f6ecd6}
.hero{position:absolute;z-index:1;right:12px;top:72px;width:520px;aspect-ratio:1.2;background:url("${file('public/atlas/buildings.webp')}") no-repeat;background-size:400% 200%;
  filter:drop-shadow(0 0 40px #f8c66b55) drop-shadow(0 18px 12px #000c)}
.row{position:absolute;z-index:1;right:20px;top:46px;width:470px;display:grid;grid-template-columns:repeat(2,1fr);gap:0 6px}
.row div{aspect-ratio:1.2;background:url("${file('public/atlas/buildings.webp')}") no-repeat;background-size:400% 200%;filter:drop-shadow(0 10px 8px #000b)}
.url{position:absolute;z-index:2;right:56px;bottom:40px;font:600 22px/1 "Literata Variable",Georgia,serif;letter-spacing:.08em;color:#f3e7cd;text-shadow:0 2px 6px #000}
`;

function page({ locale, title, line, tags, art }) {
  const en = locale === 'en';
  return `<!doctype html><html lang="${en ? 'en' : 'zh-CN'}"><head><meta charset="utf-8"><style>${style}</style></head><body>
<div class="card">
  <div class="brand"><i></i>弈方 · Yifang</div>
  <div class="rule"></div>
  <h1 class="${en ? 'en' : ''}">${escape(title)}</h1>
  <p class="${en ? 'en' : ''}">${escape(line)}</p>
  <div class="tags">${tags.map((tag, i) => `<span class="${i === tags.length - 1 ? 'free' : ''}">${escape(tag)}</span>`).join('')}</div>
</div>
${art}
<div class="url">yifang.oumashu.top</div>
</body></html>`;
}

(async () => {
  fs.mkdirSync(out, { recursive: true });
  // CHROME_PATH lets you use an installed Chrome instead of a Playwright-downloaded browser.
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const tab = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const jobs = [];
  for (const locale of ['zh', 'en']) {
    const site = socialCards.site[locale];
    // Site card: a 2×2 cluster of the four best-known destinations.
    const art = `<div class="row">${[2, 1, 4, 5].map(i => `<div style="${sprite(i)}"></div>`).join('')}</div>`;
    jobs.push({ name: `${locale}.jpg`, html: page({ locale, title: site.title, line: site.line, tags: site.tags, art }) });
    for (const [index, game] of games.entries()) {
      const card = socialCards.games[game.slug][locale];
      jobs.push({ name: `${game.slug}-${locale}.jpg`, html: page({ locale, title: card.title, line: game.tagline[locale], tags: card.tags,
        art: `<div class="hero" style="${sprite(index)}"></div>` }) });
    }
  }
  for (const job of jobs) {
    // Load from a file:// page so the local fonts and artwork are allowed to load.
    const temp = path.join(os.tmpdir(), `yifang-social-${job.name}.html`);
    fs.writeFileSync(temp, job.html);
    await tab.goto(pathToFileURL(temp).href, { waitUntil: 'load' });
    fs.rmSync(temp);
    await tab.evaluate(() => document.fonts.ready);
    await tab.screenshot({ path: path.join(out, job.name), type: 'jpeg', quality: 86 });
    console.log(`${job.name}  ${(fs.statSync(path.join(out, job.name)).size / 1024).toFixed(0)} KB`);
  }
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
