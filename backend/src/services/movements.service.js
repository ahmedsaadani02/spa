const { assertPermission } = require('./auth-session.service');
const {
  listMovements,
  addMovement
} = require('../legacy-ipc/movements.handlers');

const createMovementsService = ({ getDb, resolveSessionUser, setCurrentUser, clearCurrentUser }) => {
  const withAuthorizedUser = (token, operation) => {
    const user = resolveSessionUser(token || '');
    if (!user) {
      throw new Error('UNAUTHORIZED');
    }

    setCurrentUser(user);
    try {
      return operation(user);
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
      return withAuthorizedUser(token, (user) => {
        assertPermission('manageStock');
        return addMovement(getDb(), movement, user);
      });
    }
  };
};

module.exports = { createMovementsService };
