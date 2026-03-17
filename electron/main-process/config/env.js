const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

let envBootstrapped = false;
let envDiagnostics = {
  appIsPackaged: false,
  sourceUsed: 'none',
  loadedFromFiles: [],
  resendApiKeyLoaded: false,
  resendFromEmailLoaded: false,
  resendFromNameLoaded: false
};

const sanitizePath = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const resolveCandidateEnvPaths = (app) => {
  const candidates = [];

  // Dev default: project root.
  candidates.push(path.join(process.cwd(), '.env'));

  // Installed app: next to executable or inside resources.
  candidates.push(path.join(path.dirname(process.execPath), '.env'));
  if (process.resourcesPath) {
    candidates.push(path.join(process.resourcesPath, '.env'));
  }

  // Per-user override for packaged app.
  if (app && typeof app.getPath === 'function') {
    try {
      candidates.push(path.join(app.getPath('userData'), '.env'));
    } catch {
      // ignore - app path may be unavailable in edge startup timings
    }
  }

  const unique = [];
  const seen = new Set();
  candidates
    .map(sanitizePath)
    .filter(Boolean)
    .forEach((candidate) => {
      const normalized = path.normalize(candidate);
      if (!seen.has(normalized)) {
        seen.add(normalized);
        unique.push(normalized);
      }
    });

  return unique;
};

const bootstrapEnv = ({ app } = {}) => {
  if (envBootstrapped) {
    return envDiagnostics;
  }

  const appIsPackaged = !!(app && app.isPackaged);
  const loadedFromFiles = [];
  let sourceUsed = 'process.env';

  const alreadyHasResendConfig = !!(
    process.env.RESEND_API_KEY ||
    process.env.RESEND_FROM_EMAIL ||
    process.env.RESEND_FROM_NAME
  );

  const envPaths = resolveCandidateEnvPaths(app);
  for (const envPath of envPaths) {
    if (!fs.existsSync(envPath)) {
      continue;
    }

    const result = dotenv.config({ path: envPath, override: false, quiet: true });
    if (!result.error) {
      loadedFromFiles.push(envPath);
      if (!alreadyHasResendConfig && sourceUsed === 'process.env') {
        sourceUsed = envPath;
      }
    }
  }

  if (!alreadyHasResendConfig && loadedFromFiles.length === 0) {
    sourceUsed = 'none';
  }

  envDiagnostics = {
    appIsPackaged,
    sourceUsed,
    loadedFromFiles,
    resendApiKeyLoaded: !!(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim()),
    resendFromEmailLoaded: !!(process.env.RESEND_FROM_EMAIL && process.env.RESEND_FROM_EMAIL.trim()),
    resendFromNameLoaded: !!(process.env.RESEND_FROM_NAME && process.env.RESEND_FROM_NAME.trim())
  };

  envBootstrapped = true;

  console.log(`[env] app.isPackaged: ${envDiagnostics.appIsPackaged}`);
  console.log(`[env] env source used: ${envDiagnostics.sourceUsed}`);
  if (envDiagnostics.loadedFromFiles.length) {
    console.log(`[env] env files loaded: ${envDiagnostics.loadedFromFiles.join(' | ')}`);
  }
  console.log(`[env] RESEND_API_KEY loaded: ${envDiagnostics.resendApiKeyLoaded ? 'yes' : 'no'}`);
  console.log(`[env] RESEND_FROM_EMAIL loaded: ${envDiagnostics.resendFromEmailLoaded ? 'yes' : 'no'}`);
  console.log(`[env] RESEND_FROM_NAME loaded: ${envDiagnostics.resendFromNameLoaded ? 'yes' : 'no'}`);

  return envDiagnostics;
};

const getEnvDiagnostics = () => envDiagnostics;

module.exports = {
  bootstrapEnv,
  getEnvDiagnostics
};

