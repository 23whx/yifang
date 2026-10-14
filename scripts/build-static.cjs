// Next 16 uses distDir as the export destination but still rebuilds .next.
// Stop a production preview before running this command; rebuild before next start.
const { spawnSync } = require('node:child_process');
const path = require('node:path');
spawnSync(process.execPath, [path.join(__dirname, 'update-content-dates.cjs')], { stdio: 'inherit' });
const result = spawnSync(process.execPath, [require.resolve('next/dist/bin/next'), 'build'], {
  cwd: path.resolve(__dirname, '..'),
  env: { ...process.env, YIFANG_STATIC_EXPORT: '1' },
  stdio: 'inherit',
});
if (result.error) console.error(result.error);
process.exit(result.status ?? 1);
