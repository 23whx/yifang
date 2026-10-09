const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const packageManifest=require(path.join(root,'node_modules/@react-three/fiber/package.json'));
assert.equal(packageManifest.version,'9.6.1');
assert.equal(packageManifest.license,'MIT');

const notice=fs.readFileSync(path.join(root,'public/licenses/react-three-fiber.txt'),'utf8');
assert.ok(notice.startsWith('@react-three/fiber 9.6.1\n'));
assert.ok(notice.includes('https://github.com/pmndrs/react-three-fiber/blob/v9.6.1/LICENSE'));
const original=notice.slice(notice.indexOf('MIT License')).replace(/\r\n/g,'\n').trimEnd();
assert.equal(crypto.createHash('sha256').update(original).digest('hex'),'2a3c200930fd1e0890a025233c33ab1c5f9ea715e9c7a963dde39374f759ff88','notice must match the v9.6.1 upstream LICENSE text');
assert.ok(fs.readFileSync(path.join(root,'components/ui/SiteFooter.tsx'),'utf8').includes('/licenses/react-three-fiber.txt'));
console.log('PASS: pinned @react-three/fiber 9.6.1 MIT notice matches the upstream tag and is linked from the site footer.');
