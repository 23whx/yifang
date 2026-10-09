// Read-only inventory of the exact npm distributions copied into the local MCR fork.
// MIT metadata and file ancestry are not substitutes for a full license notice.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const packages = [
  {
    name: 'miaoda-game-mcr-mahjong-analysis-core',
    local: path.join(root, 'lib/mahjong/vendor/analysis'),
    source: path.join(root, 'node_modules/miaoda-game-mcr-mahjong-analysis-core/dist'),
    files: fs.readdirSync(path.join(root, 'lib/mahjong/vendor/analysis')).filter((file) => file.endsWith('.js')),
  },
  {
    name: 'miaoda-game-mcr-mahjong-rules',
    local: path.join(root, 'lib/mahjong/vendor'),
    source: path.join(root, 'node_modules/miaoda-game-mcr-mahjong-rules/dist'),
    files: ['mcr-rules.js'],
  },
];
const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');
const comparable = (buffer) => buffer.toString('utf8').replaceAll('\r\n', '\n')
  .split('\n')
  .filter((line) => !line.startsWith('// Pinned local copy: miaoda-game-mcr-mahjong-analysis-core 0.3.1')
    && !line.startsWith('// Local runtime copy of miaoda-game-mcr-mahjong-rules 0.3.1')
    && !line.startsWith('// Scoring bridge and optional opening transcript;')
    && !line.startsWith('//# sourceMappingURL='))
  .join('\n').trimEnd();
const rows = [];
for (const pkg of packages) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'node_modules', pkg.name, 'package.json'), 'utf8'));
  assert.equal(manifest.version, '0.3.1', `${pkg.name}: installed version changed`);
  assert.equal(manifest.license, 'MIT', `${pkg.name}: license metadata changed`);
  assert.ok(!manifest.repository, `${pkg.name}: newly available repository should be reviewed`);
  for (const file of pkg.files) {
    const localPath = path.join(pkg.local, file);
    const sourceFile = file === 'mcr-rules.js' ? 'rules.js' : file;
    const sourcePath = path.join(pkg.source, sourceFile);
    assert.ok(fs.existsSync(sourcePath), `${pkg.name}: missing upstream ${sourceFile}`);
    const local = fs.readFileSync(localPath);
    const upstream = fs.readFileSync(sourcePath);
    assert.ok(local.toString('utf8').startsWith(file === 'mcr-rules.js'
      ? '// Local runtime copy of miaoda-game-mcr-mahjong-rules 0.3.1'
      : '// Pinned local copy: miaoda-game-mcr-mahjong-analysis-core 0.3.1'), `${file}: missing provenance header`);
    rows.push({
      package: pkg.name,
      local: path.relative(root, localPath).replaceAll('\\', '/'),
      upstream: path.relative(root, sourcePath).replaceAll('\\', '/'),
      localSha256: sha256(local),
      upstreamSha256: sha256(upstream),
      differsFromPublishedFile: !local.equals(upstream),
      differsBeyondProvenanceAndSourceMap: comparable(local) !== comparable(upstream),
    });
  }
}
assert.equal(rows.filter((row) => row.package === packages[0].name).length, 20, 'analysis fork module count changed; review mapping');
assert.equal(rows.filter((row) => row.package === packages[1].name).length, 1);
console.log(JSON.stringify({
  scope: 'Local copied JavaScript modules only; mcr-rules.d.ts is an authored adapter, not a package copy.',
  warning: 'File ancestry and MIT metadata do not establish copyright ownership, missing license terms, or redistribution clearance.',
  count: rows.length,
  differing: rows.filter((row) => row.differsFromPublishedFile).length,
  differingBeyondProvenanceAndSourceMap: rows.filter((row) => row.differsBeyondProvenanceAndSourceMap).length,
  rows,
}, null, 2));
