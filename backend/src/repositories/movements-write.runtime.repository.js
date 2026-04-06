const sqliteRepository = require('./sqlite/movements-write.repository');
const postgresRepository = require('./postgres/movements-write.repository');
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
  addMovement(db, movement, currentUser) {
    return usePostgres('movements-write')
      ? postgresRepository.addMovement(db, movement, currentUser)
      : sqliteRepository.addMovement(db, movement, currentUser);
  }
};
