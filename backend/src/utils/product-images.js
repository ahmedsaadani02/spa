const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp']);
const PLACEHOLDER_IMAGE = 'assets/placeholder.png';

const toSafeFilePart = (value) => {
  const normalized = String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return normalized || 'product';
};

const getFallbackUserDataDirectory = () => {
  if (process.env.APPDATA) {
    return path.join(process.env.APPDATA, 'spa-invoice-desktop');
  }
  return path.join(process.cwd(), '.spa-invoice-desktop');
};

const getProductsImagesDirectory = () => path.join(getFallbackUserDataDirectory(), 'products-images');

const ensureProductsImagesDirectory = () => {
  const directory = getProductsImagesDirectory();
  fs.mkdirSync(directory, { recursive: true });
  return directory;
};

const isAssetPath = (value) => /^assets\//i.test(value);
const isStoredProductImagePath = (value) => /^product-images\//i.test(value);
const isHttpUrl = (value) => /^https?:\/\//i.test(value);
const isDataUrl = (value) => /^data:/i.test(value);
const isFileUrl = (value) => /^file:\/\//i.test(value);
const isApiProductImagesPath = (value) => /^\/?api\/product-images\//i.test(value);
const isAbsoluteFsPath = (value) => /^[a-z]:[\\/]/i.test(value) || /^\/[^/]/.test(value) || /^\\\\/.test(value);
const looksLikeLegacyFsPath = (value) => /[\\/]/.test(value);
const looksLikeImageFileName = (value) => /^[^\\/]+\.(png|jpe?g|webp|gif|bmp)$/i.test(value);
const MOJIBAKE_PATTERN = /(Ãƒ.|Ã‚|Ã¢â‚¬â„¢|Ã¢â‚¬Å“|Ã¢â‚¬Â|ï¿½)/;

const repairLikelyMojibake = (value) => {
  if (typeof value !== 'string') return value;
  if (!MOJIBAKE_PATTERN.test(value)) return value;

  try {
    const decoded = Buffer.from(value, 'latin1').toString('utf8');
    if (decoded && decoded !== value) {
      return decoded.normalize('NFC');
    }
  } catch {
    // fallback below
  }

  return value
    .replaceAll('ÃƒÂ©', 'Ã©')
    .replaceAll('ÃƒÂ¨', 'Ã¨')
    .replaceAll('ÃƒÂª', 'Ãª')
    .replaceAll('ÃƒÂ ', 'Ã ')
    .replaceAll('ÃƒÂ¢', 'Ã¢')
    .replaceAll('ÃƒÂ®', 'Ã®')
    .replaceAll('ÃƒÂ´', 'Ã´')
    .replaceAll('ÃƒÂ»', 'Ã»')
    .replaceAll('ÃƒÂ§', 'Ã§')
    .replaceAll('Ãƒâ€°', 'Ã‰')
    .replaceAll('Ãƒâ‚¬', 'Ã€')
    .replaceAll('Ã¢â‚¬â„¢', "'")
    .replaceAll('Ã¢â‚¬Å“', '"')
    .replaceAll('Ã¢â‚¬Â', '"')
    .normalize('NFC');
};

const encodeAssetPath = (value) => {
  const normalized = String(value ?? '').replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized) return PLACEHOLDER_IMAGE;
  return normalized
    .split('/')
    .map((segment, index) => (index === 0 ? segment : encodeURIComponent(segment)))
    .join('/');
};

const normalizeStoredProductImageRef = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (
    isAssetPath(trimmed)
    || isStoredProductImagePath(trimmed)
    || isHttpUrl(trimmed)
    || isDataUrl(trimmed)
    || isApiProductImagesPath(trimmed)
  ) {
    return trimmed;
  }

  const normalized = trimmed.replace(/\\/g, '/');
  const marker = '/products-images/';
  const markerIndex = normalized.toLowerCase().lastIndexOf(marker);
  if (markerIndex >= 0) {
    const fileName = path.basename(normalized.slice(markerIndex + marker.length));
    if (!fileName) return null;
    return `product-images/${fileName}`;
  }

  if (isAbsoluteFsPath(trimmed) || isFileUrl(trimmed) || looksLikeLegacyFsPath(trimmed)) {
    return null;
  }

  return normalized;
};

const toFileUrl = (sourcePath) => {
  const normalized = sourcePath.replace(/\\/g, '/');
  return `file:///${encodeURI(normalized)}`;
};

const BACKEND_IMAGE_HOST = '127.0.0.1';
const BACKEND_IMAGE_PORT = Number(process.env.PORT) || 3001;
const toProductImagesApiUrl = (fileName) => `http://${BACKEND_IMAGE_HOST}:${BACKEND_IMAGE_PORT}/api/product-images/${encodeURIComponent(fileName)}`;

const resolveLegacyImageSourcePath = (value) => {
  const direct = tryResolveLegacySourcePath(value);
  if (direct && fs.existsSync(direct)) {
    return direct;
  }

  if (typeof value !== 'string') return null;
  const repaired = repairLikelyMojibake(value);
  if (repaired && repaired !== value) {
    const repairedPath = tryResolveLegacySourcePath(repaired);
    if (repairedPath && fs.existsSync(repairedPath)) {
      return repairedPath;
    }
  }

  return null;
};

const resolveProductImageUrl = (value) => {
  const normalized = normalizeStoredProductImageRef(value);
  if (!normalized) {
    const legacyPath = resolveLegacyImageSourcePath(value);
    if (legacyPath && fs.existsSync(legacyPath) && isAllowedImageFile(legacyPath)) {
      const fileName = path.basename(legacyPath);
      const productsImagesDirectory = ensureProductsImagesDirectory();
      const normalizedLegacyPath = path.normalize(legacyPath);
      const normalizedStorePath = path.normalize(path.join(productsImagesDirectory, fileName));
      if (normalizedLegacyPath.toLowerCase() === normalizedStorePath.toLowerCase()) {
        return toProductImagesApiUrl(fileName);
      }

      return toFileUrl(normalizedLegacyPath);
    }
    if (typeof value === 'string' && looksLikeImageFileName(value.trim())) {
      return `assets/${encodeURIComponent(value.trim())}`;
    }
    return PLACEHOLDER_IMAGE;
  }

  if (isAssetPath(normalized)) {
    const sourcePath = resolveLegacyImageSourcePath(normalized);
    if (sourcePath && fs.existsSync(sourcePath) && isAllowedImageFile(sourcePath)) {
      const fileName = path.basename(sourcePath);
      const storedPath = path.join(ensureProductsImagesDirectory(), fileName);
      if (fs.existsSync(storedPath)) {
        return toProductImagesApiUrl(fileName);
      }
    }
    return encodeAssetPath(repairLikelyMojibake(normalized));
  }

  if (isHttpUrl(normalized) || isDataUrl(normalized)) {
    return normalized;
  }

  if (isApiProductImagesPath(normalized)) {
    const fileName = path.basename(normalized);
    return toProductImagesApiUrl(fileName);
  }

  if (isStoredProductImagePath(normalized)) {
    const fileName = path.basename(normalized.slice('product-images/'.length));
    if (!fileName) return PLACEHOLDER_IMAGE;
    return toProductImagesApiUrl(fileName);
  }

  return normalized;
};

const isAllowedImageFile = (filePath) => {
  const extension = path.extname(filePath).toLowerCase();
  return IMAGE_EXTENSIONS.has(extension);
};

const fileUrlToPath = (value) => {
  const withoutPrefix = value.replace(/^file:\/\//i, '');
  if (/^\/[a-z]:\//i.test(withoutPrefix)) {
    return decodeURIComponent(withoutPrefix.slice(1));
  }
  return decodeURIComponent(withoutPrefix);
};

const tryResolveLegacySourcePath = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const directCandidate = isFileUrl(trimmed)
    ? fileUrlToPath(trimmed)
    : (isAbsoluteFsPath(trimmed) ? trimmed : path.normalize(trimmed));
  if (directCandidate && fs.existsSync(directCandidate)) {
    return directCandidate;
  }

  const fileName = path.basename(trimmed);
  const candidates = [
    path.resolve(process.cwd(), trimmed),
    path.resolve(process.cwd(), 'src', 'assets', fileName),
    path.resolve(process.cwd(), 'dist', 'assets', fileName),
    path.resolve(process.cwd(), 'dist', 'spa-invoice', 'assets', fileName),
    path.join(ensureProductsImagesDirectory(), fileName)
  ];

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  if (looksLikeLegacyFsPath(trimmed) || looksLikeImageFileName(trimmed)) {
    return path.normalize(trimmed);
  }
  return null;
};

const copyProductImageToStore = (sourcePath, preferredName = 'product') => {
  if (typeof sourcePath !== 'string' || !sourcePath.trim()) {
    throw new Error('INVALID_IMAGE_SOURCE');
  }

  const normalizedSourcePath = sourcePath.trim();
  if (!fs.existsSync(normalizedSourcePath)) {
    throw new Error('IMAGE_NOT_FOUND');
  }
  if (!isAllowedImageFile(normalizedSourcePath)) {
    throw new Error('INVALID_IMAGE_EXTENSION');
  }

  const directory = ensureProductsImagesDirectory();
  const extension = path.extname(normalizedSourcePath).toLowerCase();
  const safePrefix = toSafeFilePart(preferredName);
  const uniquePart = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const fileName = `${safePrefix}-${uniquePart}${extension}`;
  const destinationPath = path.join(directory, fileName);
  fs.copyFileSync(normalizedSourcePath, destinationPath);
  return `product-images/${fileName}`;
};

const migrateLegacyProductImageRef = (value, preferredName = 'product') => {
  const normalized = normalizeStoredProductImageRef(value);
  if (normalized === PLACEHOLDER_IMAGE) {
    return PLACEHOLDER_IMAGE;
  }
  if (
    normalized
    && (isStoredProductImagePath(normalized) || isHttpUrl(normalized) || isDataUrl(normalized) || isApiProductImagesPath(normalized))
  ) {
    return normalized;
  }

  const sourcePath = resolveLegacyImageSourcePath(value) || resolveLegacyImageSourcePath(normalized);
  if (!sourcePath || !fs.existsSync(sourcePath) || !isAllowedImageFile(sourcePath)) {
    return normalized || null;
  }

  try {
    return copyProductImageToStore(sourcePath, preferredName);
  } catch {
    return normalized || null;
  }
};

module.exports = {
  PLACEHOLDER_IMAGE,
  normalizeStoredProductImageRef,
  resolveProductImageUrl,
  copyProductImageToStore,
  migrateLegacyProductImageRef,
  getProductsImagesDirectory,
  ensureProductsImagesDirectory
};
