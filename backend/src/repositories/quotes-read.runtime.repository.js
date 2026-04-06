const sqliteRepository = require('./sqlite/quotes-read.repository');
const postgresRepository = require('./postgres/quotes-read.repository');
const { getRepositoryDriver, assertPostgresRepositoryReady } = require('../config/database');

const usePostgres = () => {
  const driver = getRepositoryDriver('quotes-read');
  if (driver === 'postgres') {
    assertPostgresRepositoryReady('quotes-read');
    return true;
  }
  return false;
};

module.exports = {
  listQuotes(db) {
    return usePostgres()
      ? postgresRepository.listQuotes(db)
      : sqliteRepository.listQuotes(db);
  },
  getQuoteById(db, id) {
    return usePostgres()
      ? postgresRepository.getQuoteById(db, id)
      : sqliteRepository.getQuoteById(db, id);
  }
};
