const { assertPermission } = require('./auth-session.service');
const { listMovements } = require('../repositories/movements-read.runtime.repository');
const { addMovement } = require('../repositories/movements-write.runtime.repository');
const { getUserDisplayName, notifyPrivilegedUsers } = require('./internal-notifications.service');

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
        const result = await addMovement(getDb(), movement, user);
        if (result === true) {
          const productLabel = String(movement?.label ?? movement?.reference ?? 'produit').trim() || 'produit';
          await notifyPrivilegedUsers(getDb, user, [{
            kind: 'stock_movement_logged',
            title: 'Mouvement de stock enregistre',
            message: `${getUserDisplayName(user)} a enregistre un mouvement de stock pour "${productLabel}".`,
            entityType: 'product',
            entityId: movement?.itemId ?? null,
            route: '/stock',
            metadata: {
              productLabel,
              movementType: movement?.type ?? null,
              delta: Number(movement?.delta ?? 0) || 0,
              reason: String(movement?.reason ?? '').trim() || null
            }
          }]);
        }
        return result;
      });
    }
  };
};

module.exports = { createMovementsService };
