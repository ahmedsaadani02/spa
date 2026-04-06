const sqliteRepository = require('./sqlite/quotes-write.repository');
const postgresRepository = require('./postgres/quotes-write.repository');
const { getRepositoryDriver, assertPostgresRepositoryReady } = require('../config/database');

const usePostgres = () => {
  const driver = getRepositoryDriver('quotes-write');
  if (driver === 'postgres') {
    assertPostgresRepositoryReady('quotes-write');
    return true;
  }
  return false;
};

module.exports = {
  putQuote(db, quote) {
    return usePostgres()
      ? postgresRepository.putQuote(db, quote)
      : sqliteRepository.putQuote(db, quote);
  },
  deleteQuote(db, id) {
    return usePostgres()
      ? postgresRepository.deleteQuote(db, id)
      : sqliteRepository.deleteQuote(db, id);
  }
};
