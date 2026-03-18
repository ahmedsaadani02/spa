const {
  beginLogin,
  setupProtectedPassword,
  login,
  logout,
  getCurrentUser,
  resetPassword,
  hasPermission
} = require('../services/auth-core.service');

const buildContext = (event, payload = {}) => ({
  ip: payload?.ip ?? null,
  userAgent: payload?.userAgent ?? event?.sender?.getUserAgent?.() ?? null
});

const registerAuthHandlers = (ipcMain, getDb) => {
  ipcMain.handle('auth:login', async (event, username, password, context) => {
    try {
      return login(getDb(), username, password, buildContext(event, context));
    } catch (error) {
      console.error('[auth:login] error', error);
      return null;
    }
  });

  ipcMain.handle('auth:beginLogin', async (event, identity, password, context) => {
    try {
      return beginLogin(getDb(), identity, password, buildContext(event, context));
    } catch (error) {
      console.error('[auth:beginLogin] error', error);
      return { status: 'operation_failed' };
    }
  });

  ipcMain.handle('auth:setupProtectedPassword', async (event, email, newPassword, context) => {
    try {
      return setupProtectedPassword(getDb(), email, newPassword, buildContext(event, context));
    } catch (error) {
      console.error('[auth:setupProtectedPassword] error', error);
      return {
        ok: false,
        status: 'operation_failed',
        message: error instanceof Error ? error.message : 'Erreur interne pendant la creation du mot de passe.'
      };
    }
  });

  // Legacy channels disabled intentionally (email flow removed).
  ipcMain.handle('auth:verifyLogin2fa', () => ({ ok: false, status: 'operation_failed' }));
  ipcMain.handle('auth:requestPasswordReset', () => ({ status: 'operation_failed' }));
  ipcMain.handle('auth:confirmPasswordReset', () => ({ ok: false, status: 'operation_failed' }));
  ipcMain.handle('auth:requestPasswordSetup', () => ({ status: 'operation_failed' }));
  ipcMain.handle('auth:completePasswordSetup', () => ({ ok: false, status: 'operation_failed' }));

  ipcMain.handle('auth:logout', () => logout());
  ipcMain.handle('auth:getCurrentUser', () => getCurrentUser());
  ipcMain.handle('auth:hasPermission', (event, permissionKey) => hasPermission(permissionKey));

  ipcMain.handle('auth:resetPassword', (event, employeeId, newPassword) => {
    try {
      return resetPassword(getDb(), employeeId, newPassword);
    } catch (error) {
      console.error('[auth:resetPassword] error', error);
      return false;
    }
  });
};

module.exports = { registerAuthHandlers };
