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
const { getUserDisplayName, notifyPrivilegedUsers } = require('./internal-notifications.service');

const normalizeText = (value) => String(value ?? '').trim();

const buildStockMovementEvents = (movement, actorUser) => {
  if (!movement) {
    return [];
  }

  const actorName = getUserDisplayName(actorUser);
  const productLabel = normalizeText(movement.label) || normalizeText(movement.reference) || 'produit';
  const color = normalizeText(movement.color);
  const beforeQty = Number(movement.before ?? 0) || 0;
  const afterQty = Number(movement.after ?? 0) || 0;
  const delta = Number(movement.delta ?? 0) || 0;
  const absoluteDelta = Math.abs(delta);
  const route = '/stock';

  if (movement.type === 'IN') {
    return [{
      kind: 'stock_quantity_added',
      title: 'Stock ajoute',
      message: `${actorName} a ajoute ${absoluteDelta} unites au stock du produit "${productLabel}".`,
      entityType: 'product',
      entityId: movement.itemId,
      route,
      metadata: {
        productLabel,
        reference: movement.reference ?? null,
        color,
        beforeQty,
        afterQty,
        delta
      }
    }];
  }

  if (movement.type === 'OUT') {
    return [{
      kind: 'stock_quantity_removed',
      title: 'Stock retire',
      message: `${actorName} a retire ${absoluteDelta} unites du produit "${productLabel}".`,
      entityType: 'product',
      entityId: movement.itemId,
      route,
      metadata: {
        productLabel,
        reference: movement.reference ?? null,
        color,
        beforeQty,
        afterQty,
        delta
      }
    }];
  }

  return [{
    kind: 'stock_quantity_adjusted',
    title: 'Stock ajuste',
    message: `${actorName} a ajuste la quantite du produit "${productLabel}" de ${beforeQty} a ${afterQty}.`,
    entityType: 'product',
    entityId: movement.itemId,
    route,
    metadata: {
      productLabel,
      reference: movement.reference ?? null,
      color,
      beforeQty,
      afterQty,
      delta
    }
  }];
};

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
        const applied = await applyStockMovement(getDb(), movement, user);
        if (applied) {
          await notifyPrivilegedUsers(getDb, user, buildStockMovementEvents(movement, user));
        }
        return applied;
      });
    },

    async setQty(token, productId, color, qty) {
      return withAuthorizedUser(token, async (user) => {
        assertAnyPermission(['adjustStock', 'manageStock']);
        const updated = await setStockQty(getDb(), productId, color, qty);
        if (updated) {
          await notifyPrivilegedUsers(getDb, user, [{
            kind: 'stock_quantity_adjusted',
            title: 'Stock ajuste',
            message: `${getUserDisplayName(user)} a ajuste manuellement une quantite de stock.`,
            entityType: 'product',
            entityId: productId,
            route: '/stock',
            metadata: {
              productId,
              color,
              qty
            }
          }]);
        }
        return updated;
      });
    },

    async increment(token, productId, color, delta) {
      return withAuthorizedUser(token, async (user) => {
        assertAnyPermission(['addStock', 'manageStock']);
        const updated = await incrementStockQty(getDb(), productId, color, delta);
        if (updated) {
          await notifyPrivilegedUsers(getDb, user, [{
            kind: 'stock_quantity_added',
            title: 'Stock ajoute',
            message: `${getUserDisplayName(user)} a ajoute ${Math.abs(Number(delta) || 0)} unites au stock.`,
            entityType: 'product',
            entityId: productId,
            route: '/stock',
            metadata: {
              productId,
              color,
              delta: Math.abs(Number(delta) || 0)
            }
          }]);
        }
        return updated;
      });
    },

    async decrement(token, productId, color, delta) {
      return withAuthorizedUser(token, async (user) => {
        assertAnyPermission(['removeStock', 'manageStock']);
        const safeDelta = -Math.abs(Number(delta) || 0);
        const updated = await incrementStockQty(getDb(), productId, color, safeDelta);
        if (updated) {
          await notifyPrivilegedUsers(getDb, user, [{
            kind: 'stock_quantity_removed',
            title: 'Stock retire',
            message: `${getUserDisplayName(user)} a retire ${Math.abs(safeDelta)} unites du stock.`,
            entityType: 'product',
            entityId: productId,
            route: '/stock',
            metadata: {
              productId,
              color,
              delta: safeDelta
            }
          }]);
        }
        return updated;
      });
    }
  };
};

module.exports = { createStockService };
