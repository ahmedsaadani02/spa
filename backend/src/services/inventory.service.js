const { assertPermission } = require('./auth-session.service');
const { getInventoryResponse } = require('../legacy-ipc/inventory.handlers');

const createInventoryService = ({ getDb, resolveSessionUser, setCurrentUser, clearCurrentUser }) => {
  const withAuthorizedUser = (token, operation) => {
    const user = resolveSessionUser(token || '');
    if (!user) {
      throw new Error('UNAUTHORIZED');
    }

    setCurrentUser(user);
    try {
      assertPermission('manageInventory');
      return operation();
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
