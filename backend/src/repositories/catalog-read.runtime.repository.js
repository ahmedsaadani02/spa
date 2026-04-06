const sqliteRepository = require('./sqlite/catalog-read.repository');
const postgresRepository = require('./postgres/catalog-read.repository');
const { getRepositoryDriver, assertPostgresRepositoryReady } = require('../config/database');

const usePostgres = (scope) => {
  const driver = getRepositoryDriver(scope);
  if (driver === 'postgres') {
    assertPostgresRepositoryReady(scope);
    return true;
  }
  return false;
};

module.exports = {
  listProducts(db) {
    return usePostgres('products-read')
      ? postgresRepository.listProducts(db)
      : sqliteRepository.listProducts(db);
  },
  listArchivedProducts(db) {
    return usePostgres('products-read')
      ? postgresRepository.listArchivedProducts(db)
      : sqliteRepository.listArchivedProducts(db);
  },
  getProductMetadata(db) {
    return usePostgres('products-read')
      ? postgresRepository.getProductMetadata(db)
      : sqliteRepository.getProductMetadata(db);
  },
  getStockRows(db) {
    return usePostgres('stock-read')
      ? postgresRepository.getStockRows(db)
      : sqliteRepository.getStockRows(db);
  },
  buildStockItems(db) {
    return usePostgres('stock-read')
      ? postgresRepository.buildStockItems(db)
      : sqliteRepository.buildStockItems(db);
  },
  getInventoryResponse(db) {
    return usePostgres('stock-read')
      ? postgresRepository.getInventoryResponse(db)
      : sqliteRepository.getInventoryResponse(db);
  }
};
