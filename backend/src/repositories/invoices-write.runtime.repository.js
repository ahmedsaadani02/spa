const sqliteRepository = require('./sqlite/invoices-write.repository');
const postgresRepository = require('./postgres/invoices-write.repository');
const { getRepositoryDriver, assertPostgresRepositoryReady } = require('../config/database');

const usePostgres = () => {
  const driver = getRepositoryDriver('invoices-write');
  if (driver === 'postgres') {
    assertPostgresRepositoryReady('invoices-write');
    return true;
  }
  return false;
};

module.exports = {
  putInvoice(db, invoice) {
    return usePostgres()
      ? postgresRepository.putInvoice(db, invoice)
      : sqliteRepository.putInvoice(db, invoice);
  }
};
