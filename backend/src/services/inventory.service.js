const { assertPermission } = require('./auth-session.service');
const { getInventoryResponse } = require('../repositories/catalog-read.runtime.repository');

const createInventoryService = ({ getDb, resolveSessionUser, setCurrentUser, clearCurrentUser }) => {
  const withAuthorizedUser = async (token, operation) => {
    const user = await resolveSessionUser(token || '');
    if (!user) {
      throw new Error('UNAUTHORIZED');
    }

    setCurrentUser(user);
    try {
      assertPermission('manageInventory');
      return await operation();
    } finally {
      clearCurrentUser();
    }
  };

  return {
    async get(token) {
      return withAuthorizedUser(token, () => getInventoryResponse(getDb()));
    }
  };
};

module.exports = { createInventoryService };
