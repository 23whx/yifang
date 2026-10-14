// What a non-rendering AI crawler reads in the exported HTML: definitions up front, real reference content,
// honest dates, no browser-capability errors baked into prerendered pages, and an llms.txt map.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), output = path.join(root, '.next-static');
const read = route => fs.readFileSync(path.join(output, route, 'index.html'), 'utf8');
const mainText = html => (html.match(/<main[^>]*>([\s\S]*)<\/main>/)?.[1] ?? '').replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ');
const schemas = html => [...html.matchAll(/application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
const games = ['cube', 'chess', 'xiangqi', 'shogi', 'go', 'mahjong', 'holdem', 'baccarat'];
const dates = JSON.parse(fs.readFileSync(path.join(root, 'content', 'content-dates.json'), 'utf8'));
let checked = 0;
for (const locale of ['zh', 'en']) {
  for (const game of games) {
    // A self-contained definition sits in the first part of the hub page.
    const text = mainText(read(`${locale}/${game}`));
    const lead = text.slice(0, Math.ceil(text.length * 0.3));
    assert.ok(locale === 'zh' ? /是[^。]{4,}/.test(lead) : /\bis an?\b|\bis the\b|\bis Japan/.test(lead), `No definition near the top: /${locale}/${game}/`);
    checked++;
  }
  for (const game of ['chess', 'xiangqi', 'shogi', 'go']) {
    const glossary = read(`${locale}/${game}/glossary`);
    assert.ok((glossary.match(/<dt\b/g) ?? []).length >= 10, `Thin glossary: /${locale}/${game}/glossary/`);
    assert.ok(glossary.includes(`<time dateTime="${dates[`glossary:${game}`]}"`), `Glossary date missing: /${locale}/${game}/`);
    const history = read(`${locale}/${game}/history`);
    const years = [...history.matchAll(/<li\b/g)].length;
    assert.ok(years >= 4, `Thin history (${years}): /${locale}/${game}/history/`);
    checked += 2;
  }
  for (const game of ['chess', 'xiangqi', 'shogi']) {
    const play = read(`${locale}/${game}/play`);
    assert.ok(!/SharedArrayBuffer/.test(mainText(play)), `Prerendered play page claims the engine is unavailable: /${locale}/${game}/play/`);
    checked++;
  }
}
// Every lesson shows and declares the date its content last changed.
const lessons = fs.readdirSync(output, { recursive: true }).filter(file => /^(zh|en)[\\/][a-z]+[\\/]learn[\\/][^\\/]+[\\/]index\.html$/.test(file));
for (const file of lessons) {
  const html = fs.readFileSync(path.join(output, file), 'utf8');
  const lesson = schemas(html).find(s => s['@type'] === 'LearningResource');
  assert.match(lesson?.dateModified ?? '', /^\d{4}-\d{2}-\d{2}$/, `Lesson without dateModified: ${file}`);
  assert.ok(html.includes(`<time dateTime="${lesson.dateModified}"`), `Lesson date not visible: ${file}`);
  checked++;
}
assert.ok(lessons.length >= 40, `Only ${lessons.length} lessons found`);
// llms.txt: plain text, starts with the site name, every link points at a real exported page.
const llms = fs.readFileSync(path.join(output, 'llms.txt'), 'utf8');
assert.ok(llms.startsWith('# 弈方 · Yifang\n'));
const links = [...llms.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map(m => new URL(m[1]));
for (const link of links) {
  const file = link.pathname.endsWith('/') ? path.join(output, link.pathname, 'index.html') : path.join(output, link.pathname);
  assert.ok(fs.existsSync(file), `llms.txt links to a missing page: ${link.href}`);
}
assert.ok(links.length > 100);
console.log(`PASS: ${checked} page checks (hub definitions, glossary/history depth and dates, play pages, ${lessons.length} dated lessons), llms.txt with ${links.length} valid links.`);
