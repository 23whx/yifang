// Render the site icons from app/icon.svg: favicon.ico (16/32/48), apple-icon.png (180) and the manifest PNGs (192/512, maskable).
// Usage: CHROME_PATH=<chrome.exe> node scripts/generate-icons.cjs   (needs playwright-core)
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
let chromium;
try { ({ chromium } = require('playwright-core')); } catch {
  console.error('playwright-core is not installed. Run: npm i -D playwright-core'); process.exit(1);
}
const mark = fs.readFileSync(path.join(root, 'app', 'icon.svg'), 'utf8');
// 16px: drop the hairlines and the frame, which blur into mud at that size.
const tiny = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#21170f"/>
<path d="M32 6 58 32 32 58 6 32Z" fill="#f3e7cd"/><circle cx="32" cy="32" r="10" fill="#803d2b"/></svg>`;
// Full-bleed square without the frame: iOS and Android apply their own corner mask; the board stays inside the 80% safe zone.
const bleed = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#21170f"/>
<g transform="translate(32 32) scale(.92) translate(-32 -32)">${mark.replace(/<svg[^>]*>|<\/svg>|<!--[\s\S]*?-->|<rect[^>]*\/>/g, '')}</g></svg>`;

async function png(page, svg, size) {
  const file = path.join(os.tmpdir(), `yifang-icon-${size}-${Math.random().toString(36).slice(2)}.html`);
  fs.writeFileSync(file, `<!doctype html><style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  await page.setViewportSize({ width: size, height: size });
  await page.goto(pathToFileURL(file).href);
  const buffer = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  fs.rmSync(file);
  return buffer;
}
// ICO with embedded PNG images (supported by every current browser).
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const at = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, at); header.writeUInt8(size >= 256 ? 0 : size, at + 1);
    header.writeUInt16LE(1, at + 4); header.writeUInt16LE(32, at + 6);
    header.writeUInt32LE(data.length, at + 8); header.writeUInt32LE(offset, at + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map(image => image.data)]);
}

(async () => {
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const out = {
    'app/favicon.ico': ico([{ size: 16, data: await png(page, tiny, 16) }, { size: 32, data: await png(page, mark, 32) }, { size: 48, data: await png(page, mark, 48) }]),
    'app/apple-icon.png': await png(page, bleed, 180),
    'public/icons/icon-192.png': await png(page, mark, 192),
    'public/icons/icon-512.png': await png(page, mark, 512),
    'public/icons/maskable-512.png': await png(page, bleed, 512),
  };
  await browser.close();
  for (const [name, data] of Object.entries(out)) {
    fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    fs.writeFileSync(path.join(root, name), data);
    console.log(`${name}  ${(data.length / 1024).toFixed(1)} KB`);
  }
})().catch(error => { console.error(error); process.exit(1); });
