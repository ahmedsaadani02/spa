const {
  beginLogin,
  setupProtectedPassword,
  resetPassword: resetEmployeePassword
} = require('./auth-core.service');
const { hasPermission: hasCurrentPermission } = require('./auth-session.service');

const normalizeContext = (context = {}) => ({
  ip: context?.ip ?? null,
  userAgent: context?.userAgent ?? null
});

const createAuthService = ({ getDb, sessions, createToken, nowIso, resolveSessionUser, setCurrentUser, clearCurrentUser }) => ({
  async login(identity, password, context = {}) {
    const result = await beginLogin(getDb(), identity, password, normalizeContext(context));

    if (result?.status === 'success' && result?.user?.id) {
      const token = createToken();
      sessions.set(token, { userId: result.user.id, createdAt: nowIso() });
      return {
        ...result,
        token
      };
    }

    return result;
  },

  async setupPassword(email, newPassword, context = {}) {
    return setupProtectedPassword(getDb(), email, newPassword, normalizeContext(context));
  },

  async getCurrentUser(token) {
    return await resolveSessionUser(token || '');
  },

  async logout(token) {
    if (token) {
      sessions.delete(token);
    }
    clearCurrentUser();
    return true;
  },

  async hasPermission(token, permissionKey) {
    const user = await resolveSessionUser(token || '');
    if (!user) {
      throw new Error('UNAUTHORIZED');
    }

    setCurrentUser(user);
    try {
      return hasCurrentPermission(permissionKey);
    } finally {
      clearCurrentUser();
    }
  },

  async resetPassword(token, employeeId, newPassword) {
    const user = await resolveSessionUser(token || '');
    if (!user) {
      throw new Error('UNAUTHORIZED');
    }

    setCurrentUser(user);
    try {
      return await resetEmployeePassword(getDb(), employeeId, newPassword);
    } finally {
      clearCurrentUser();
    }
  }
});

module.exports = { createAuthService };
