// AdSense: every exported page loads the publisher's script in <head> (production builds), and ads.txt authorizes the same publisher.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), output = path.join(root, '.next-static');
const client = fs.readFileSync(path.join(root, 'content', 'ads.ts'), 'utf8').match(/'(ca-pub-\d{16})'/)?.[1];
assert.ok(client, 'ADSENSE_CLIENT missing from content/ads.ts');
const publisher = client.replace(/^ca-/, '');

// ads.txt: one Google DIRECT record with Google's certification id, served from the site root.
for (const file of [path.join(root, 'public', 'ads.txt'), path.join(output, 'ads.txt')]) {
  const text = fs.readFileSync(file, 'utf8');
  assert.ok(!text.startsWith('﻿'), `BOM in ${file}`);
  const records = text.split(/\r?\n/).map(line => line.replace(/#.*/, '').trim()).filter(Boolean);
  assert.deepEqual(records, [`google.com, ${publisher}, DIRECT, f08c47fec0942fa0`], `ads.txt record: ${file}`);
}
const robots = fs.readFileSync(path.join(output, 'robots.txt'), 'utf8');
assert.ok(!/Disallow:\s*\/(ads\.txt)?\s*$/m.test(robots), 'robots.txt blocks ads.txt');

const entry = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
const production = !entry.includes('noindex');
const pages = [];
(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name);
    // Error pages are excluded on purpose: AdSense does not allow ads on screens without publisher content.
    if (fs.statSync(file).isDirectory()) { if (!name.startsWith('_next') && !['rtc-acceptance', '404', '_not-found'].includes(name)) walk(file); }
    else if (name.endsWith('.html') && !/^(404|_not-found)\.html$/.test(name)) pages.push(file);
  }
})(output);
const src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? '';
  const tags = html.match(/<script[^>]*adsbygoogle\.js[^>]*>/g) ?? [];
  if (!production) { assert.equal(tags.length, 0, `Preview build loads ads: ${file}`); continue; }
  assert.equal(tags.length, 1, `AdSense script count (${tags.length}): ${file}`);
  assert.ok(head.includes(tags[0]), `AdSense script outside <head>: ${file}`);
  assert.ok(tags[0].includes(`src="${src}"`) && /\basync\b/.test(tags[0]) && tags[0].includes('crossorigin="anonymous"'), `AdSense script attributes: ${file}`);
}
assert.ok(pages.length > 100);

// Ad frames are blocked under COEP require-corp, so only the three engine pages may be cross-origin isolated.
const config = fs.readFileSync(path.join(root, 'next.config.ts'), 'utf8');
assert.ok(config.includes('source: "/:locale(zh|en)/:game(chess|xiangqi|shogi)/play/:rest*"') && !config.includes('source: "/:path*"'), 'COEP must stay limited to engine pages');
const { ISOLATED_PAGE } = { ISOLATED_PAGE: new RegExp(fs.readFileSync(path.join(root, 'lib', 'cross-origin.ts'), 'utf8').match(/ISOLATED_PAGE = \/(.+)\/;/)[1]) };
for (const route of ['/zh/chess/play/', '/en/xiangqi/play', '/zh/shogi/play/']) assert.ok(ISOLATED_PAGE.test(route), route);
for (const route of ['/zh/', '/zh/chess/', '/zh/go/play/', '/zh/chess/play/x/', '/zh/chess/remote/']) assert.ok(!ISOLATED_PAGE.test(route), route);
console.log(`PASS: ${production ? `AdSense ${client} in <head> of ${pages.length} pages` : `preview build: no ads on ${pages.length} pages`}, ads.txt authorizes ${publisher}, COEP limited to engine pages.`);
