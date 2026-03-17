const path = require('path');
const { spawnSync } = require('child_process');

if (process.env.SPA_SKIP_NATIVE_REBUILD === '1') {
  console.log('[postinstall] SPA_SKIP_NATIVE_REBUILD=1 -> native rebuild skipped.');
  process.exit(0);
}

const scriptPath = path.join(__dirname, 'rebuild-native.js');
const result = spawnSync(process.execPath, [scriptPath], {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit'
});

if (result.status === 0) {
  process.exit(0);
}

console.warn('');
console.warn('[postinstall] Native rebuild failed during npm install.');
console.warn('[postinstall] Install continues, but Electron dev run may fail until rebuild succeeds.');
console.warn('[postinstall] Run this manually after fixing prerequisites: npm run rebuild:native');
process.exit(0);
