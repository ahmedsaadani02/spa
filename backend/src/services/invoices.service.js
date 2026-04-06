const {
  listInvoices,
  getInvoiceById
} = require('../repositories/invoices-read.runtime.repository');
const {
  putInvoice
} = require('../repositories/invoices-write.runtime.repository');
const {
  deleteInvoice
} = require('../repositories/invoices-delete.runtime.repository');
const { assertPermission } = require('./auth-session.service');

const createInvoicesService = ({ getDb, resolveSessionUser, setCurrentUser, clearCurrentUser }) => {
  const withAuthorizedUser = async (token, operation) => {
    const user = await resolveSessionUser(token || '');
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
