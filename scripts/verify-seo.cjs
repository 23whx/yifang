// Verify actual exported HTML, cross-page links, bilingual clusters and deployment gates.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const ts = require('typescript'), Module = require('node:module');
const root = path.resolve(__dirname, '..'), output = path.join(root, '.next-static');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return resolve.call(this, request.startsWith('@/') ? path.join(root, request.slice(2)) : request, ...args);
};
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, file);
const decode = text => text.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#x27;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(match => [match[1], decode(match[2])]));
}
function parse(file) {
  const html = fs.readFileSync(file, 'utf8');
  return { html,
    title: decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? ''),
    links: [...html.matchAll(/<link\b[^>]*>/g)].map(match => attributes(match[0])),
    meta: [...html.matchAll(/<meta\b[^>]*>/g)].map(match => attributes(match[0])),
    schema: [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1])),
  };
}
function at(route) { return path.join(output, route, 'index.html'); }
const entry = parse(at('/'));
const origin = new URL(entry.links.find(link => link.rel === 'canonical')?.href).origin;
const noindex = entry.meta.some(meta => meta.name === 'robots' && meta.content.includes('noindex'));
process.env.NEXT_PUBLIC_SITE_URL = origin;
process.env.YIFANG_NOINDEX = noindex ? '1' : '0';
const { publicContentPaths } = require('../lib/seo-routes.ts');
const { serializeJsonLd } = require('../lib/seo.ts');
const { tutorials } = require('../content/tutorials.ts');
const suffixes = publicContentPaths();
assert.equal(new Set(suffixes).size, suffixes.length, 'Duplicate canonical content routes');
const routes = ['/', ...['zh', 'en'].flatMap(locale => suffixes.map(suffix => `/${locale}${suffix}/`))];
const documents = new Map(routes.map(route => [route, parse(at(route))]));
const titles = new Set(), descriptions = new Set();
let internalLinks = 0, schemaCount = 0;
for (const [route, doc] of documents) {
  assert.ok(doc.title.trim(), `Missing title: ${route}`);
  assert.ok(!titles.has(doc.title), `Duplicate title: ${route} (${doc.title})`); titles.add(doc.title);
  const description = doc.meta.find(meta => meta.name === 'description')?.content;
  assert.ok(description?.trim(), `Missing description: ${route}`);
  assert.ok(!descriptions.has(description), `Duplicate description: ${route}`); descriptions.add(description);
  const canonical = doc.links.filter(link => link.rel === 'canonical');
  assert.equal(canonical.length, 1, `Canonical count: ${route}`);
  assert.equal(canonical[0].href, `${origin}${route}`, `Self-canonical: ${route}`);
  assert.equal((doc.html.match(/<h1\b/g) ?? []).length, 1, `One visible primary heading: ${route}`);
  const robots = doc.meta.find(meta => meta.name === 'robots')?.content ?? '';
  assert.equal(robots.includes('noindex'), noindex, `Indexing gate mismatch: ${route}`);
  const suffix = route === '/' ? '' : route.replace(/^\/(zh|en)/, '').replace(/\/$/, '');
  for (const [language, expected] of [['zh-CN', `/zh${suffix}/`], ['en', `/en${suffix}/`], ['x-default', suffix ? `/zh${suffix}/` : '/']]) {
    const alternate = doc.links.find(link => link.rel === 'alternate' && link.hrefLang === language);
    assert.equal(alternate?.href, `${origin}${expected}`, `Alternate ${language}: ${route}`);
    assert.ok(documents.has(expected), `Alternate points to missing content: ${route} → ${expected}`);
  }
  assert.ok(!doc.html.includes('cube.example.com'), `Placeholder domain: ${route}`);
  for (const data of doc.schema) {
    assert.equal(data['@context'], 'https://schema.org');
    assert.ok(!JSON.stringify(data).includes('{dict.'), `Unresolved schema text: ${route}`);
    assert.ok(!['HowTo', 'FAQPage'].includes(data['@type']), `Unsupported rich-result marketing: ${route}`);
    if (data['@type'] === 'BreadcrumbList') {
      assert.ok(data.itemListElement.length >= 2);
      for (const [index, item] of data.itemListElement.entries()) {
        assert.equal(item.position, index + 1);
        assert.ok(documents.has(new URL(item.item).pathname), `Broken breadcrumb: ${route}`);
      }
    }
    if (data['@type'] === 'DefinedTermSet') {
      for (const term of data.hasDefinedTerm) assert.ok(doc.html.includes(`id="${new URL(term.url).hash.slice(1)}"`), `Missing glossary term anchor: ${route}`);
    }
    schemaCount++;
  }
  for (const match of doc.html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
    const url = new URL(decode(match[1]), `${origin}${route}`);
    if (url.origin !== origin || !/^\/(zh|en)(\/|$)/.test(url.pathname)) continue;
    const dest = url.pathname.replace(/\/?$/, '/');
    assert.ok(documents.has(dest), `Broken internal content link: ${route} → ${dest}`);
    if (url.hash) {
      const target = decodeURIComponent(url.hash.slice(1));
      assert.ok(documents.get(dest).html.includes(`id="${target}"`), `Broken fragment: ${route} → ${dest}#${target}`);
    }
    internalLinks++;
  }
  if (route !== '/') {
    const og = doc.meta.find(meta => meta.property === 'og:url');
    assert.equal(og?.content, canonical[0].href, `OG URL mismatch: ${route}`);
    const image = new URL(doc.meta.find(meta => meta.property === 'og:image')?.content);
    assert.ok(fs.existsSync(path.join(output, image.pathname)), `Missing social image: ${route}`);
    assert.equal(doc.meta.find(meta => meta.name === 'twitter:card')?.content, 'summary_large_image');
  }
}
for (const locale of ['zh', 'en']) {
  const home = documents.get(`/${locale}/`).html;
  for (const game of ['cube', 'chess', 'xiangqi', 'shogi', 'go', 'mahjong', 'holdem', 'baccarat']) {
    assert.ok(home.includes(`href="/${locale}/${game}/learn/"`), `SSR learning entry missing: ${game}`);
    const hub = documents.get(`/${locale}/${game}/`).html;
    assert.ok(hub.includes(locale === 'zh' ? '入门常见问题' : 'Beginner questions'), `Missing visible beginner answers: ${game}`);
  }
  for (const tutorial of tutorials) {
    const route = `/${locale}/${tutorial.game}/learn/${tutorial.slug}/`, doc = documents.get(route);
    const lesson = doc.schema.find(schema => schema['@type'] === 'LearningResource');
    assert.ok(lesson, `Missing lesson schema: ${route}`);
    assert.equal(lesson.url, `${origin}${route}`);
    for (const part of lesson.hasPart) assert.ok(doc.html.includes(`id="${new URL(part.url).hash.slice(1)}"`), `Schema points at missing lesson section: ${route}`);
  }
}
const xml = fs.readFileSync(path.join(output, 'sitemap.xml'), 'utf8');
const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => decode(match[1]));
assert.deepEqual([...locations].sort(), noindex ? [] : routes.map(route => `${origin}${route}`).sort(), 'Sitemap/HTML inventory mismatch');
if (!noindex) assert.ok(xml.includes('hreflang="zh-CN"') && xml.includes('hreflang="en"') && xml.includes('hreflang="x-default"'));
const robotsTxt = fs.readFileSync(path.join(output, 'robots.txt'), 'utf8');
assert.equal(robotsTxt.includes('Sitemap:'), !noindex);
assert.ok(!robotsTxt.includes('Disallow: /\n'), 'Public pages/resources blocked');
const injection = {text:'</script><script>alert(1)</script>'};
assert.ok(!serializeJsonLd(injection).includes('<'));
assert.deepEqual(JSON.parse(serializeJsonLd(injection)), injection);
// Exercise production and preview configuration independently of the built artifact.
function reloadSite() {
  for (const file of Object.keys(require.cache)) if (file.startsWith(root + path.sep) && file.endsWith('.ts')) delete require.cache[file];
  return require('../lib/site.ts');
}
process.env.YIFANG_NOINDEX = '0';
let site = reloadSite();
assert.equal(site.SITE_INDEXABLE, true);
const publicSitemap = require('../app/sitemap.ts').default();
assert.deepEqual(publicSitemap.map(item => item.url).sort(), routes.map(route => `${origin}${route}`).sort());
assert.ok(publicSitemap.every(item => item.alternates.languages['zh-CN'] && item.alternates.languages.en && item.alternates.languages['x-default']));
// Use the installed Next version's serializer to exercise XML output without publishing a preview.
const { resolveSitemap, resolveRobots } = require('next/dist/build/webpack/loaders/metadata/resolve-route-data');
const productionXml = resolveSitemap(publicSitemap);
assert.equal([...productionXml.matchAll(/<loc>/g)].length, routes.length);
assert.ok(productionXml.includes('xmlns:xhtml=') && productionXml.includes('hreflang="zh-CN"') && productionXml.includes('hreflang="en"') && productionXml.includes('hreflang="x-default"'));
assert.ok(resolveRobots(require('../app/robots.ts').default()).includes(`Sitemap: ${origin}/sitemap.xml`));
process.env.YIFANG_NOINDEX = '1'; site = reloadSite();
assert.equal(site.SITE_INDEXABLE, false); assert.deepEqual(require('../app/sitemap.ts').default(), []);
for (const invalid of ['https://cube.example.com', 'https://real-site.test/path', 'https://real-site.test?key=secret', 'https://user:secret@real-site.test']) {
  process.env.NEXT_PUBLIC_SITE_URL = invalid;
  assert.throws(reloadSite, undefined, `Invalid production origin accepted: ${invalid}`);
}
delete process.env.NEXT_PUBLIC_SITE_URL;
assert.equal(reloadSite().SITE_INDEXABLE, false);
console.log(`PASS: ${routes.length} HTML routes, unique titles/descriptions, reciprocal bilingual targets, ${internalLinks} internal links/fragments, ${schemaCount} schemas, social images, sitemap coverage, safe JSON-LD and production/preview indexing gates. Export mode: ${noindex ? 'preview/noindex' : 'public/indexable'}. Google indexing/rankings not measured.`);
