const sqliteRepository = require('./sqlite/invoices-delete.repository');
const postgresRepository = require('./postgres/invoices-delete.repository');
const { getRepositoryDriver, assertPostgresRepositoryReady } = require('../config/database');

const usePostgres = () => {
  const driver = getRepositoryDriver('invoices-delete-write');
  if (driver === 'postgres') {
    assertPostgresRepositoryReady('invoices-delete-write');
    return true;
  }
  return false;
};

module.exports = {
  deleteInvoice(db, id) {
    return usePostgres()
      ? postgresRepository.deleteInvoice(db, id)
      : sqliteRepository.deleteInvoice(db, id);
  }
};
