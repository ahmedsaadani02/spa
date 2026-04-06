const path = require('path');
const { isPostgresConfigured } = require('./postgres');

let envLoaded = false;

const loadEnv = () => {
  if (envLoaded) return;
  envLoaded = true;

  try {
    require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });
  } catch (_error) {
    // Ignore: env can be injected externally.
  }
};

const readEnv = (key) => {
  loadEnv();
  const value = process.env[key];
  return typeof value === 'string' ? value.trim() : '';
};

const isEnabled = (key) => {
  const normalized = readEnv(key).toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
};

const POSTGRES_READY_SCOPES = Object.freeze([
  'clients',
  'employees',
  'salary',
  'auth-security',
  'quotes-read',
  'quotes-write',
  'quotes-convert-write',
  'invoices-read',
  'invoices-write',
  'invoices-delete-write',
  'products-read',
  'stock-read',
  'movements-read',
  'price-history-read',
  'products-metadata-write',
  'products-core-write',
  'products-structure-write',
  'products-price-write',
  'products-purge-write',
  'stock-set-qty-write',
  'stock-delta-write',
  'movements-write',
  'stock-apply-movement-write'
]);

const QUOTES_READ_SCOPES = new Set(['quotes-read']);
const QUOTES_WRITE_SCOPES = new Set(['quotes-write']);
const QUOTES_CONVERT_SCOPES = new Set(['quotes-convert-write']);
const INVOICES_READ_SCOPES = new Set(['invoices-read']);
const INVOICES_WRITE_SCOPES = new Set(['invoices-write']);
const INVOICES_DELETE_SCOPES = new Set(['invoices-delete-write']);
const CATALOG_READ_SCOPES = new Set(['products-read', 'stock-read', 'movements-read', 'price-history-read']);
const PRODUCT_WRITE_SCOPES = new Set(['products-metadata-write', 'products-core-write', 'products-structure-write', 'products-price-write', 'products-purge-write']);
const STOCK_WRITE_SCOPES = new Set(['stock-set-qty-write', 'stock-delta-write', 'movements-write', 'stock-apply-movement-write']);
const isQuotesReadOptInEnabled = () => isEnabled('DB_ENABLE_POSTGRES_QUOTES_READ');
const isQuotesWriteOptInEnabled = () => isEnabled('DB_ENABLE_POSTGRES_QUOTES_WRITES');
const isInvoicesReadOptInEnabled = () => isEnabled('DB_ENABLE_POSTGRES_INVOICES_READ');
const isInvoicesWriteOptInEnabled = () => isEnabled('DB_ENABLE_POSTGRES_INVOICES_WRITES');
const isCatalogReadOptInEnabled = () => isEnabled('DB_ENABLE_POSTGRES_CATALOG_READ');
const isProductWriteOptInEnabled = () => isEnabled('DB_ENABLE_POSTGRES_PRODUCT_WRITES');
const isStockWriteOptInEnabled = () => isEnabled('DB_ENABLE_POSTGRES_STOCK_WRITES');

const normalizeDriver = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'postgres' ? 'postgres' : 'sqlite';
};

const getConfiguredDbDriver = () => normalizeDriver(readEnv('DB_DRIVER') || 'sqlite');

const getRepositoryDriver = (scope) => {
  if (getConfiguredDbDriver() !== 'postgres') {
    return 'sqlite';
  }

  if (QUOTES_READ_SCOPES.has(scope) && !isQuotesReadOptInEnabled()) {
    return 'sqlite';
  }

  if (QUOTES_WRITE_SCOPES.has(scope) && (!isQuotesWriteOptInEnabled() || !isQuotesReadOptInEnabled())) {
    return 'sqlite';
  }

  if (
    QUOTES_CONVERT_SCOPES.has(scope) &&
    (!isQuotesReadOptInEnabled() || !isQuotesWriteOptInEnabled() || !isInvoicesReadOptInEnabled() || !isInvoicesWriteOptInEnabled())
  ) {
    return 'sqlite';
  }

  if (INVOICES_READ_SCOPES.has(scope) && !isInvoicesReadOptInEnabled()) {
    return 'sqlite';
  }

  if (INVOICES_WRITE_SCOPES.has(scope) && (!isInvoicesWriteOptInEnabled() || !isInvoicesReadOptInEnabled())) {
    return 'sqlite';
  }

  if (
    INVOICES_DELETE_SCOPES.has(scope) &&
    (!isQuotesReadOptInEnabled() || !isQuotesWriteOptInEnabled() || !isInvoicesReadOptInEnabled() || !isInvoicesWriteOptInEnabled())
  ) {
    return 'sqlite';
  }

  if (CATALOG_READ_SCOPES.has(scope) && !isCatalogReadOptInEnabled()) {
    return 'sqlite';
  }

  if (PRODUCT_WRITE_SCOPES.has(scope) && (!isProductWriteOptInEnabled() || !isCatalogReadOptInEnabled())) {
    return 'sqlite';
  }

  if (STOCK_WRITE_SCOPES.has(scope) && (!isStockWriteOptInEnabled() || !isCatalogReadOptInEnabled())) {
    return 'sqlite';
  }

  return POSTGRES_READY_SCOPES.includes(scope) ? 'postgres' : 'sqlite';
};

const assertPostgresRepositoryReady = (scope) => {
  if (getRepositoryDriver(scope) !== 'postgres') {
    return;
  }

  if (!isPostgresConfigured()) {
    throw new Error(`DB_DRIVER=postgres requires DATABASE_URL for repository scope "${scope}".`);
  }
};

const getDatabaseRoutingSummary = () => ({
  configuredDriver: getConfiguredDbDriver(),
  quotesReadOptInEnabled: isQuotesReadOptInEnabled(),
  quotesWriteOptInEnabled: isQuotesWriteOptInEnabled(),
  invoicesReadOptInEnabled: isInvoicesReadOptInEnabled(),
  invoicesWriteOptInEnabled: isInvoicesWriteOptInEnabled(),
  catalogReadOptInEnabled: isCatalogReadOptInEnabled(),
  productWriteOptInEnabled: isProductWriteOptInEnabled(),
  stockWriteOptInEnabled: isStockWriteOptInEnabled(),
  postgresReadyScopes: [...POSTGRES_READY_SCOPES],
  activePostgresScopes: POSTGRES_READY_SCOPES.filter((scope) => getRepositoryDriver(scope) === 'postgres')
});

module.exports = {
  getConfiguredDbDriver,
  getRepositoryDriver,
  assertPostgresRepositoryReady,
  getDatabaseRoutingSummary
};
