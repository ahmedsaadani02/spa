/**
 * Database routing — application is fully on PostgreSQL.
 * All scopes resolve to 'postgres'; the SQLite fallback has been removed.
 */
const { isPostgresConfigured } = require('./postgres');

const getConfiguredDbDriver = () => 'postgres';

const getRepositoryDriver = (_scope) => 'postgres';

const assertPostgresRepositoryReady = (_scope) => {
  if (!isPostgresConfigured()) {
    throw new Error('DATABASE_URL is required (DB is postgres-only).');
  }
};

const getDatabaseRoutingSummary = () => ({
  configuredDriver: 'postgres',
  quotesReadOptInEnabled: true,
  quotesWriteOptInEnabled: true,
  invoicesReadOptInEnabled: true,
  invoicesWriteOptInEnabled: true,
  catalogReadOptInEnabled: true,
  productWriteOptInEnabled: true,
  stockWriteOptInEnabled: true
});

module.exports = {
  getConfiguredDbDriver,
  getRepositoryDriver,
  assertPostgresRepositoryReady,
  getDatabaseRoutingSummary
};
