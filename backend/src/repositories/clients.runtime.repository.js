const sqliteRepository = require('./clients.repository');
const postgresRepository = require('./postgres/clients.repository');
const { getRepositoryDriver, assertPostgresRepositoryReady } = require('../config/database');

const usePostgres = () => {
  const driver = getRepositoryDriver('clients');
  if (driver === 'postgres') {
    assertPostgresRepositoryReady('clients');
    return true;
  }
  return false;
};

module.exports = {
  mapClientRow: sqliteRepository.mapClientRow,
  toDocumentClient: sqliteRepository.toDocumentClient,
  listClients(db) {
    return usePostgres() ? postgresRepository.listClients(db) : sqliteRepository.listClients(db);
  },
  searchClients(db, query) {
    return usePostgres() ? postgresRepository.searchClients(db, query) : sqliteRepository.searchClients(db, query);
  },
  upsertClient(db, input) {
    return usePostgres() ? postgresRepository.upsertClient(db, input) : sqliteRepository.upsertClient(db, input);
  },
  deleteClientById(db, id) {
    return usePostgres() ? postgresRepository.deleteClientById(db, id) : sqliteRepository.deleteClientById(db, id);
  },
  getClientRowById(db, id) {
    return usePostgres() ? postgresRepository.getClientRowById(db, id) : sqliteRepository.getClientRowById(db, id);
  },
  findOrCreateClient(db, input, preferredId = null) {
    return usePostgres()
      ? postgresRepository.findOrCreateClient(db, input, preferredId)
      : sqliteRepository.findOrCreateClient(db, input, preferredId);
  }
};
