const sqliteRepository = require('./sqlite/stock-write.repository');
const postgresRepository = require('./postgres/stock-write.repository');
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
  setStockQty(db, productId, color, qty) {
    return usePostgres('stock-set-qty-write')
      ? postgresRepository.setStockQty(db, productId, color, qty)
      : sqliteRepository.setStockQty(db, productId, color, qty);
  },
  incrementStockQty(db, productId, color, delta) {
    return usePostgres('stock-delta-write')
      ? postgresRepository.incrementStockQty(db, productId, color, delta)
      : sqliteRepository.incrementStockQty(db, productId, color, delta);
  },
  applyStockMovement(db, movement, currentUser) {
    return usePostgres('stock-apply-movement-write')
      ? postgresRepository.applyStockMovement(db, movement, currentUser)
      : sqliteRepository.applyStockMovement(db, movement, currentUser);
  }
};
