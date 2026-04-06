const sqliteRepository = require('./sqlite/product-write.repository');
const postgresRepository = require('./postgres/product-write.repository');
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
  upsertProductMetadata(db, kind, value, now) {
    return usePostgres('products-metadata-write')
      ? postgresRepository.upsertProductMetadata(db, kind, value, now)
      : sqliteRepository.upsertProductMetadata(db, kind, value, now);
  },
  createProduct(db, payload) {
    return usePostgres('products-structure-write')
      ? postgresRepository.createProduct(db, payload)
      : sqliteRepository.createProduct(db, payload);
  },
  updateProduct(db, productId, payload) {
    return usePostgres('products-structure-write')
      ? postgresRepository.updateProduct(db, productId, payload)
      : sqliteRepository.updateProduct(db, productId, payload);
  },
  updateVariantPriceWithHistory(db, productId, color, nextPrice, changedBy, options) {
    return usePostgres('products-price-write')
      ? postgresRepository.updateVariantPriceWithHistory(db, productId, color, nextPrice, changedBy, options)
      : sqliteRepository.updateVariantPriceWithHistory(db, productId, color, nextPrice, changedBy, options);
  },
  purgeProduct(db, productId) {
    return usePostgres('products-purge-write')
      ? postgresRepository.purgeProduct(db, productId)
      : sqliteRepository.purgeProduct(db, productId);
  },
  upsertProduct(db, product) {
    return usePostgres('products-core-write')
      ? postgresRepository.upsertProduct(db, product)
      : sqliteRepository.upsertProduct(db, product);
  },
  archiveProduct(db, productId) {
    return usePostgres('products-core-write')
      ? postgresRepository.archiveProduct(db, productId)
      : sqliteRepository.archiveProduct(db, productId);
  },
  restoreProduct(db, productId) {
    return usePostgres('products-core-write')
      ? postgresRepository.restoreProduct(db, productId)
      : sqliteRepository.restoreProduct(db, productId);
  }
};
