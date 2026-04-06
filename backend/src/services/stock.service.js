const { assertPermission } = require('./auth-session.service');
const {
  setStockQty,
  incrementStockQty,
  applyStockMovement
} = require('../repositories/stock-write.runtime.repository');
const {
  assertAnyPermission,
  inferMovementPermission
} = require('../legacy-ipc/stock.handlers');
const {
  getStockRows,
  buildStockItems
} = require('../repositories/catalog-read.runtime.repository');

const createStockService = ({ getDb, resolveSessionUser, setCurrentUser, clearCurrentUser }) => {
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
      return withAuthorizedUser(token, async (user) => {
        assertAnyPermission([inferMovementPermission(movement), 'manageStock']);
        return await applyStockMovement(getDb(), movement, user);
      });
    },

    async setQty(token, productId, color, qty) {
      return withAuthorizedUser(token, async () => {
        assertAnyPermission(['adjustStock', 'manageStock']);
        return await setStockQty(getDb(), productId, color, qty);
      });
    },

    async increment(token, productId, color, delta) {
      return withAuthorizedUser(token, async () => {
        assertAnyPermission(['addStock', 'manageStock']);
        return await incrementStockQty(getDb(), productId, color, delta);
      });
    },

    async decrement(token, productId, color, delta) {
      return withAuthorizedUser(token, async () => {
        assertAnyPermission(['removeStock', 'manageStock']);
        return await incrementStockQty(getDb(), productId, color, -Math.abs(Number(delta) || 0));
      });
    }
  };
};

module.exports = { createStockService };
