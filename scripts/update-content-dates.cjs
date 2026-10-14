// Record when each page's content source last changed (git commit date) in content/content-dates.json.
// Runs before builds. Hosts that clone without full history (shallow) keep the committed file instead of guessing.
const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');
const ts = require('typescript'), Module = require('node:module');
const root = path.resolve(__dirname, '..'), target = path.join(root, 'content', 'content-dates.json');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
try {
  if (git('rev-parse', '--is-shallow-repository') !== 'false') throw new Error('shallow clone');
} catch (error) {
  console.log(`content dates: kept committed file (${error.message.split('\n')[0]})`);
  process.exit(0);
}
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return resolve.call(this, request.startsWith('@/') ? path.join(root, request.slice(2)) : request, ...args);
};
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, file);
const { tutorials } = require('../content/tutorials.ts');
const { games } = require('../content/games.ts');

const contentFiles = [];
(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name);
    if (fs.statSync(file).isDirectory()) walk(file); else if (name.endsWith('.ts')) contentFiles.push(path.relative(root, file).replace(/\\/g, '/'));
  }
})(path.join(root, 'content'));
// Uncommitted edits count as today, so a local build right after editing is not stale.
const dirty = new Set(git('status', '--porcelain', '--', 'content').split('\n').filter(Boolean).map(line => line.slice(3).trim()));
const today = new Date().toISOString().slice(0, 10);
function changed(files) {
  if (files.some(file => dirty.has(file))) return today;
  return git('log', '-1', '--format=%cs', '--', ...files) || undefined;
}
const board = ['content/board/library.ts', 'content/board/reference-more.ts'];
const sources = {
  glossary: { cube: ['content/cube/glossary.ts'], mahjong: ['content/mahjong-lessons.ts'], chess: board, xiangqi: board, shogi: board, go: board },
  history: { cube: ['content/cube/history.ts'], chess: board, xiangqi: board, shogi: board, go: board },
};
const dates = {};
for (const game of games) dates[`hub:${game.slug}`] = changed(['content/games.ts', 'content/seo.ts']);
for (const [kind, map] of Object.entries(sources)) for (const [game, files] of Object.entries(map)) dates[`${kind}:${game}`] = changed(files);
for (const tutorial of tutorials) {
  const files = contentFiles.filter(file => {
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    return text.includes(`"${tutorial.slug}"`) || text.includes(`'${tutorial.slug}'`);
  });
  dates[`lesson:${tutorial.slug}`] = changed(files.length ? files : ['content/tutorials.ts']);
}
const next = JSON.stringify(Object.fromEntries(Object.entries(dates).filter(([, date]) => date).sort()), null, 2) + '\n';
if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== next) fs.writeFileSync(target, next);
console.log(`content dates: ${Object.keys(dates).length} pages`);
