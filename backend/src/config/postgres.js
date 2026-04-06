const path = require('path');

let envLoaded = false;

const loadEnv = () => {
  if (envLoaded) return;
  envLoaded = true;

  try {
    require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });
  } catch (_error) {
    // Ignore: env can be injected externally on Render/Neon/local shell.
  }
};

const readEnv = (key) => {
  loadEnv();
  const value = process.env[key];
  return typeof value === 'string' ? value.trim() : '';
};

const normalizeConnectionString = (value) => {
  if (!value) return '';

  const trimmed = String(value).trim();
  const duplicateSchemeMatch = trimmed.match(/^(postgres(?:ql)?):\/\/(postgres(?:ql)?:\/\/.+)$/i);
  const normalized = duplicateSchemeMatch ? duplicateSchemeMatch[2] : trimmed;

  try {
    const url = new URL(normalized);
    const sslMode = (url.searchParams.get('sslmode') || '').trim().toLowerCase();
    if (sslMode === 'require' || sslMode === 'prefer' || sslMode === 'verify-ca') {
      url.searchParams.set('sslmode', 'verify-full');
    }
    return url.toString();
  } catch (_error) {
    return normalized;
  }
};

const isTruthy = (value) => ['1', 'true', 'yes', 'on', 'require'].includes(String(value).toLowerCase());
const isFalsy = (value) => ['0', 'false', 'no', 'off', 'disable', 'disabled'].includes(String(value).toLowerCase());

const readSslModeFromConnectionString = (connectionString) => {
  if (!connectionString) return '';

  try {
    const url = new URL(connectionString);
    return (url.searchParams.get('sslmode') || '').trim().toLowerCase();
  } catch (_error) {
    return '';
  }
};

const resolveSslConfig = (connectionString) => {
  const explicit = readEnv('POSTGRES_SSL') || readEnv('PGSSLMODE');
  if (explicit) {
    if (String(explicit).toLowerCase() === 'auto') {
      // Fall through to the URL-derived or environment-derived behavior below.
    } else {
      if (isFalsy(explicit)) return false;
      if (isTruthy(explicit)) {
        return { rejectUnauthorized: false };
      }
    }
  }

  const sslMode = readSslModeFromConnectionString(connectionString);
  if (sslMode) {
    if (sslMode === 'disable') return false;
    if (sslMode === 'verify-full') {
      return { rejectUnauthorized: true };
    }
    return { rejectUnauthorized: false };
  }

  if (readEnv('NODE_ENV') === 'production') {
    return { rejectUnauthorized: false };
  }

  return false;
};

const isPostgresConfigured = () => !!readEnv('DATABASE_URL');

const getPostgresConfig = () => {
  const connectionString = normalizeConnectionString(readEnv('DATABASE_URL'));
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for PostgreSQL operations.');
  }

  const max = Number.parseInt(readEnv('PGPOOL_MAX') || '10', 10);
  const idleTimeoutMillis = Number.parseInt(readEnv('PG_IDLE_TIMEOUT_MS') || '30000', 10);
  const connectionTimeoutMillis = Number.parseInt(readEnv('PG_CONNECTION_TIMEOUT_MS') || '10000', 10);

  return {
    connectionString,
    ssl: resolveSslConfig(connectionString),
    max: Number.isFinite(max) ? max : 10,
    idleTimeoutMillis: Number.isFinite(idleTimeoutMillis) ? idleTimeoutMillis : 30000,
    connectionTimeoutMillis: Number.isFinite(connectionTimeoutMillis) ? connectionTimeoutMillis : 10000,
    application_name: 'spa-invoice-backend'
  };
};

module.exports = {
  isPostgresConfigured,
  getPostgresConfig,
  normalizeConnectionString
};
