const sqliteRepository = require('./sqlite/price-history-read.repository');
const postgresRepository = require('./postgres/price-history-read.repository');
const { getRepositoryDriver, assertPostgresRepositoryReady } = require('../config/database');

const usePostgres = () => {
  const driver = getRepositoryDriver('price-history-read');
  if (driver === 'postgres') {
    assertPostgresRepositoryReady('price-history-read');
    return true;
  }
  return false;
};

module.exports = {
  getPriceHistory(db, productId, color) {
    return usePostgres()
      ? postgresRepository.getPriceHistory(db, productId, color)
      : sqliteRepository.getPriceHistory(db, productId, color);
  }
};
