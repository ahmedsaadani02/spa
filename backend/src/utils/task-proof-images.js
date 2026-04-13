const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp']);

const getBackendBaseUrl = () => {
  const backendUrl = process.env.BACKEND_BASE_URL;
  if (backendUrl) {
    return backendUrl;
  }

  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv === 'production') {
    console.error('[BACKEND_BASE_URL_MISSING]', {
      message: 'BACKEND_BASE_URL environment variable is required in production for task proof images',
      nodeEnv
    });
    return null;
  }

  const port = Number(process.env.PORT) || 3001;
  return `http://127.0.0.1:${port}`;
};

const toSafeFilePart = (value) => {
  const normalized = String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return normalized || 'task-proof';
};

const getFallbackUserDataDirectory = () => {
  if (process.env.APPDATA) {
    return path.join(process.env.APPDATA, 'spa-invoice-desktop');
  }
  return path.join(process.cwd(), '.spa-invoice-desktop');
};

const getTaskProofImagesDirectory = () => path.join(getFallbackUserDataDirectory(), 'task-proof-images');

const ensureTaskProofImagesDirectory = () => {
  const directory = getTaskProofImagesDirectory();
  fs.mkdirSync(directory, { recursive: true });
  return directory;
};

const normalizeStoredTaskProofRef = (value) => {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;

  const fullUrlMatch = trimmed.match(/^https?:\/\/[^/]+\/api\/task-proof-images\/(.+)$/i);
  if (fullUrlMatch) {
    const fileName = fullUrlMatch[1].split(/[?#]/)[0];
    try {
      return `task-proof-images/${decodeURIComponent(fileName)}`;
    } catch (error) {
      console.error('[TASK_PROOF_NORMALIZE_URL_ERROR]', {
        value: trimmed,
        error: error?.message
      });
      return null;
    }
  }

  if (/^\/?api\/task-proof-images\//i.test(trimmed)) {
    return `task-proof-images/${path.basename(trimmed)}`;
  }

  if (/^task-proof-images\//i.test(trimmed)) {
    return trimmed;
  }

  return trimmed;
};

const resolveTaskProofUrl = (value) => {
  try {
    const normalized = normalizeStoredTaskProofRef(value);
    if (!normalized) return null;

    if (/^https?:\/\//i.test(normalized) || /^data:/i.test(normalized)) {
      return normalized;
    }

    const baseUrl = getBackendBaseUrl();
    if (!baseUrl) return null;

    if (/^task-proof-images\//i.test(normalized)) {
      const fileName = path.basename(normalized.slice('task-proof-images/'.length));
      return `${baseUrl}/api/task-proof-images/${encodeURIComponent(fileName)}`;
    }

    if (/\.\w{2,4}$/i.test(normalized) && !/[\/\\]/.test(normalized)) {
      return `${baseUrl}/api/task-proof-images/${encodeURIComponent(normalized)}`;
    }

    return normalized;
  } catch (error) {
    console.error('[TASK_PROOF_URL_ERROR]', {
      value,
      error: error?.message
    });
    return null;
  }
};

const storeTaskProofDataUrl = (dataUrl, preferredName = 'task-proof') => {
  const payload = typeof dataUrl === 'string' ? dataUrl.trim() : '';
  const match = payload.match(/^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/);
  if (!match) {
    throw new Error('TASK_PHOTO_INVALID');
  }

  const mime = match[1].toLowerCase();
  const base64Payload = match[2];
  const extension = (() => {
    if (mime.includes('png')) return '.png';
    if (mime.includes('jpeg') || mime.includes('jpg')) return '.jpg';
    if (mime.includes('webp')) return '.webp';
    if (mime.includes('gif')) return '.gif';
    if (mime.includes('bmp')) return '.bmp';
    return '';
  })();

  if (!IMAGE_EXTENSIONS.has(extension)) {
    throw new Error('TASK_PHOTO_EXTENSION_INVALID');
  }

  const safePrefix = toSafeFilePart(preferredName);
  const uniquePart = crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const fileName = `${safePrefix}-${uniquePart}${extension}`;
  const directory = ensureTaskProofImagesDirectory();
  const absolutePath = path.join(directory, fileName);

  fs.writeFileSync(absolutePath, Buffer.from(base64Payload, 'base64'));

  return {
    fileName,
    imageRef: `task-proof-images/${fileName}`,
    imageUrl: resolveTaskProofUrl(`task-proof-images/${fileName}`)
  };
};

module.exports = {
  getTaskProofImagesDirectory,
  ensureTaskProofImagesDirectory,
  normalizeStoredTaskProofRef,
  resolveTaskProofUrl,
  storeTaskProofDataUrl
};