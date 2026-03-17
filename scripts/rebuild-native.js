const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const packageJson = require(path.join(projectRoot, 'package.json'));

const normalizeVersion = (value) => {
  const raw = typeof value === 'string' ? value : '';
  const cleaned = raw.trim().replace(/^[^\d]*/, '');
  return cleaned;
};

const electronVersion =
  normalizeVersion(process.env.ELECTRON_VERSION) ||
  normalizeVersion(packageJson.devDependencies?.electron);

if (!electronVersion) {
  console.error('[native-rebuild] Electron version is missing.');
  process.exit(1);
}

const nodeMajor = Number(process.versions.node.split('.')[0] || 0);
if (nodeMajor < 22 || nodeMajor >= 23) {
  console.warn(
    `[native-rebuild] Node ${process.versions.node} detected. Recommended runtime is Node 22.x for this project.`
  );
}

const run = async () => {
  const { rebuild } = require('@electron/rebuild');

  console.log(`[native-rebuild] Rebuilding native modules for Electron ${electronVersion}...`);
  await rebuild({
    buildPath: projectRoot,
    electronVersion,
    force: true,
    onlyModules: ['better-sqlite3'],
    projectRootPath: projectRoot
  });
  console.log('[native-rebuild] better-sqlite3 rebuild completed.');
};

run().catch((error) => {
  const message = error && error.stack ? error.stack : String(error);
  console.error('[native-rebuild] Rebuild failed.\n' + message);
  process.exit(1);
});
