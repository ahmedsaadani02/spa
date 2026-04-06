const {
  listClients,
  searchClients,
  upsertClient,
  deleteClientById,
  getClientRowById,
  mapClientRow,
  findOrCreateClient
} = require('../repositories/clients.runtime.repository');
const { assertPermission } = require('./auth-session.service');

const createClientsService = ({ getDb, resolveSessionUser, setCurrentUser, clearCurrentUser }) => {
  const withAuthorizedUser = async (token, operation) => {
    const user = await resolveSessionUser(token || '');
    if (!user) {
      throw new Error('UNAUTHORIZED');
    }

    setCurrentUser(user);
    try {
      assertPermission('manageClients');
      return await operation();
    } finally {
      clearCurrentUser();
    }
  };

  return {
    async list(token) {
      return withAuthorizedUser(token, () => listClients(getDb()));
    },

    async getById(token, id) {
      return withAuthorizedUser(token, async () => mapClientRow(await getClientRowById(getDb(), id)));
    },

    async search(token, query) {
      return withAuthorizedUser(token, () => searchClients(getDb(), query ?? ''));
    },

    async upsert(token, client) {
      return withAuthorizedUser(token, () => upsertClient(getDb(), client));
    },

    async delete(token, id) {
      return withAuthorizedUser(token, () => deleteClientById(getDb(), id));
    },

    async findOrCreate(token, client, preferredId) {
      return withAuthorizedUser(token, () => findOrCreateClient(getDb(), client, preferredId ?? null));
    }
  };
};

module.exports = { createClientsService };
