const { assertPermission } = require('./auth-session.service');
const { listMovements } = require('../repositories/movements-read.runtime.repository');
const { addMovement } = require('../repositories/movements-write.runtime.repository');

const createMovementsService = ({ getDb, resolveSessionUser, setCurrentUser, clearCurrentUser }) => {
  const withAuthorizedUser = async (token, operation) => {
    const user = await resolveSessionUser(token || '');
    if (!user) {
      throw new Error('UNAUTHORIZED');
    }

    setCurrentUser(user);
    try {
      return await operation(user);
    } finally {
      clearCurrentUser();
    }
  };

  return {
    async list(token) {
      return withAuthorizedUser(token, () => {
        assertPermission('viewHistory');
        return listMovements(getDb());
      });
    },

    async add(token, movement) {
      return withAuthorizedUser(token, async (user) => {
        assertPermission('manageStock');
        return await addMovement(getDb(), movement, user);
      });
    }
  };
};

module.exports = { createMovementsService };
