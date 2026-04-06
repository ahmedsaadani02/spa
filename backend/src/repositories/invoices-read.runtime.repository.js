const sqliteRepository = require('./sqlite/invoices-read.repository');
const postgresRepository = require('./postgres/invoices-read.repository');
const { getRepositoryDriver, assertPostgresRepositoryReady } = require('../config/database');

const usePostgres = () => {
  const driver = getRepositoryDriver('invoices-read');
  if (driver === 'postgres') {
    assertPostgresRepositoryReady('invoices-read');
    return true;
  }
  return false;
};

module.exports = {
  listInvoices(db) {
    return usePostgres()
      ? postgresRepository.listInvoices(db)
      : sqliteRepository.listInvoices(db);
  },
  getInvoiceById(db, id) {
    return usePostgres()
      ? postgresRepository.getInvoiceById(db, id)
      : sqliteRepository.getInvoiceById(db, id);
  }
};
