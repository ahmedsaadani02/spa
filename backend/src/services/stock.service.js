const { assertPermission } = require('./auth-session.service');
const {
  getStockRows,
  buildStockItems,
  setStockQty,
  incrementStockQty,
  applyStockMovement,
  assertAnyPermission,
  inferMovementPermission
} = require('../legacy-ipc/stock.handlers');

const createStockService = ({ getDb, resolveSessionUser, setCurrentUser, clearCurrentUser }) => {
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
        assertPermission('viewStock');
        return getStockRows(getDb());
      });
    },

    async items(token) {
      return withAuthorizedUser(token, () => {
        assertPermission('viewStock');
        return buildStockItems(getDb());
      });
    },

    async applyMovement(token, movement) {
      return withAuthorizedUser(token, (user) => {
        assertAnyPermission([inferMovementPermission(movement), 'manageStock']);
        return applyStockMovement(getDb(), movement, user);
      });
    },

    async setQty(token, productId, color, qty) {
      return withAuthorizedUser(token, () => {
        assertAnyPermission(['adjustStock', 'manageStock']);
        return setStockQty(getDb(), productId, color, qty);
      });
    },

    async increment(token, productId, color, delta) {
      return withAuthorizedUser(token, () => {
        assertAnyPermission(['addStock', 'manageStock']);
        return incrementStockQty(getDb(), productId, color, delta);
      });
    },

    async decrement(token, productId, color, delta) {
      return withAuthorizedUser(token, () => {
        assertAnyPermission(['removeStock', 'manageStock']);
        return incrementStockQty(getDb(), productId, color, -Math.abs(Number(delta) || 0));
      });
    }
  };
};

module.exports = { createStockService };
