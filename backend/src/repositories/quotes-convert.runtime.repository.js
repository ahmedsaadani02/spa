const sqliteRepository = require('./sqlite/quotes-convert.repository');
const postgresRepository = require('./postgres/quotes-convert.repository');
const { getRepositoryDriver, assertPostgresRepositoryReady } = require('../config/database');

const usePostgres = () => {
  const driver = getRepositoryDriver('quotes-convert-write');
  if (driver === 'postgres') {
    assertPostgresRepositoryReady('quotes-convert-write');
    return true;
  }
  return false;
};

module.exports = {
  convertQuoteToInvoice(db, quoteId) {
    return usePostgres()
      ? postgresRepository.convertQuoteToInvoice(db, quoteId)
      : sqliteRepository.convertQuoteToInvoice(db, quoteId);
  }
};
