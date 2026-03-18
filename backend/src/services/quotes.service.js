const {
  listQuotes,
  getQuoteById,
  putQuote,
  deleteQuote,
  convertQuoteToInvoice
} = require('../legacy-ipc/quotes.handlers');
const { assertPermission } = require('./auth-session.service');

const createQuotesService = ({ getDb, resolveSessionUser, setCurrentUser, clearCurrentUser }) => {
  const withAuthorizedUser = (token, permissions, operation) => {
    const user = resolveSessionUser(token || '');
    if (!user) {
      throw new Error('UNAUTHORIZED');
    }

    setCurrentUser(user);
    try {
      permissions.forEach((permission) => assertPermission(permission));
      return operation();
    } finally {
      clearCurrentUser();
    }
  };

  return {
    async list(token) {
      return withAuthorizedUser(token, ['manageQuotes'], () => listQuotes(getDb()));
    },

    async getById(token, id) {
      return withAuthorizedUser(token, ['manageQuotes'], () => getQuoteById(getDb(), id));
    },

    async put(token, quote) {
      return withAuthorizedUser(token, ['manageQuotes'], () => putQuote(getDb(), quote));
    },

    async delete(token, id) {
      return withAuthorizedUser(token, ['manageQuotes'], () => deleteQuote(getDb(), id));
    },

    async convertToInvoice(token, id) {
      return withAuthorizedUser(token, ['manageQuotes', 'manageInvoices'], () => convertQuoteToInvoice(getDb(), id));
    }
  };
};

module.exports = { createQuotesService };
