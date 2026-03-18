const {
  listInvoices,
  getInvoiceById,
  putInvoice,
  deleteInvoice
} = require('../legacy-ipc/invoices.handlers');
const { assertPermission } = require('./auth-session.service');

const createInvoicesService = ({ getDb, resolveSessionUser, setCurrentUser, clearCurrentUser }) => {
  const withAuthorizedUser = (token, operation) => {
    const user = resolveSessionUser(token || '');
    if (!user) {
      throw new Error('UNAUTHORIZED');
    }

    setCurrentUser(user);
    try {
      assertPermission('manageInvoices');
      return operation();
    } finally {
      clearCurrentUser();
    }
  };

  return {
    async list(token) {
      return withAuthorizedUser(token, () => listInvoices(getDb()));
    },

    async getById(token, id) {
      return withAuthorizedUser(token, () => getInvoiceById(getDb(), id));
    },

    async put(token, invoice) {
      return withAuthorizedUser(token, () => putInvoice(getDb(), invoice));
    },

    async delete(token, id) {
      return withAuthorizedUser(token, () => deleteInvoice(getDb(), id));
    }
  };
};

module.exports = { createInvoicesService };
