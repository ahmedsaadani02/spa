const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const sourcePng = path.join(projectRoot, 'src', 'assets', 'logospa.png');
const buildDir = path.join(projectRoot, 'build');
const electronAssetsDir = path.join(projectRoot, 'electron', 'assets');

const buildPng = path.join(buildDir, 'icon.png');
const buildIco = path.join(buildDir, 'icon.ico');
const runtimePng = path.join(electronAssetsDir, 'icon.png');
const runtimeIco = path.join(electronAssetsDir, 'icon.ico');

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const validateIcoBuffer = (icoBuffer, label) => {
  if (!Buffer.isBuffer(icoBuffer) || icoBuffer.length < 22) {
    throw new Error(`[icons] ${label}: ICO is too small or invalid.`);
  }

  const reserved = icoBuffer.readUInt16LE(0);
  const type = icoBuffer.readUInt16LE(2);
  const count = icoBuffer.readUInt16LE(4);

  if (reserved !== 0 || type !== 1 || count < 1) {
    throw new Error(`[icons] ${label}: invalid ICO header.`);
  }

  const sizes = [];
  for (let i = 0; i < count; i += 1) {
    const entryOffset = 6 + (i * 16);
    const width = icoBuffer.readUInt8(entryOffset) || 256;
    const height = icoBuffer.readUInt8(entryOffset + 1) || 256;
    const bytesInRes = icoBuffer.readUInt32LE(entryOffset + 8);
    const imageOffset = icoBuffer.readUInt32LE(entryOffset + 12);

    if (imageOffset + bytesInRes > icoBuffer.length) {
      throw new Error(`[icons] ${label}: entry ${i} out of bounds.`);
    }

    sizes.push(Math.min(width, height));
  }

  if (!sizes.includes(256)) {
    throw new Error(`[icons] ${label}: missing 256x256 frame.`);
  }

  return sizes;
};

const readValidIco = (candidates) => {
  for (const candidatePath of candidates) {
    if (!fs.existsSync(candidatePath)) continue;

    try {
      const buffer = fs.readFileSync(candidatePath);
      const sizes = validateIcoBuffer(buffer, candidatePath);
      return { buffer, path: candidatePath, sizes };
    } catch (error) {
      console.warn(`[icons] skipping invalid ico: ${candidatePath}`);
      console.warn(`[icons] reason: ${error.message}`);
    }
  }

  return null;
};

const copyIfDifferent = (source, destination) => {
  if (path.resolve(source) === path.resolve(destination)) return;
  fs.copyFileSync(source, destination);
};

const main = () => {
  if (!fs.existsSync(sourcePng)) {
    throw new Error(`[icons] Source logo not found: ${sourcePng}`);
  }

  ensureDir(buildDir);
  ensureDir(electronAssetsDir);

  fs.copyFileSync(sourcePng, buildPng);
  fs.copyFileSync(sourcePng, runtimePng);

  // We keep one canonical, pre-generated Windows ICO tracked in the project.
  // This avoids runtime conversion issues and guarantees NSIS compatibility.
  const icoSource = readValidIco([runtimeIco, buildIco]);
  if (!icoSource) {
    throw new Error(
      '[icons] No valid Windows ICO found. Expected a valid icon at electron/assets/icon.ico or build/icon.ico.'
    );
  }

  fs.writeFileSync(buildIco, icoSource.buffer);
  copyIfDifferent(buildIco, runtimeIco);

  const finalSizes = validateIcoBuffer(fs.readFileSync(buildIco), buildIco);
  validateIcoBuffer(fs.readFileSync(runtimeIco), runtimeIco);

  console.log('[icons] generated:', buildPng);
  console.log('[icons] generated:', buildIco);
  console.log('[icons] generated:', runtimePng);
  console.log('[icons] generated:', runtimeIco);
  console.log('[icons] ico source:', icoSource.path);
  console.log('[icons] ico sizes:', finalSizes.join(', '));
};

main();
