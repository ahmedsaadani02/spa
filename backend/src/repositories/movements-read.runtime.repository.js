const sqliteRepository = require('./sqlite/movements-read.repository');
const postgresRepository = require('./postgres/movements-read.repository');
const { getRepositoryDriver, assertPostgresRepositoryReady } = require('../config/database');

const usePostgres = () => {
  const driver = getRepositoryDriver('movements-read');
  if (driver === 'postgres') {
    assertPostgresRepositoryReady('movements-read');
    return true;
  }
  return false;
};

module.exports = {
  listMovements(db) {
    return usePostgres() ? postgresRepository.listMovements(db) : sqliteRepository.listMovements(db);
  }
};
