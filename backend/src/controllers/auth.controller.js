const getBearerToken = (req) => {
  const header = req.headers.authorization ?? '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
};

const toAuthStatus = (error, fallback) => {
  const message = error instanceof Error ? error.message : fallback;
  if (message === 'NOT_AUTHENTICATED' || message === 'UNAUTHORIZED') {
    return { status: 401, message: 'Unauthorized' };
  }
  if (message === 'FORBIDDEN') {
    return { status: 403, message: 'Forbidden' };
  }
  return { status: 500, message };
};

const createAuthController = ({ authService }) => ({
  async login(req, res) {
    const identity = typeof req.body?.identity === 'string' ? req.body.identity : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!identity.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: 'identity and password are required'
      });
    }

    try {
      const result = await authService.login(identity, password, {
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null
      });
      return res.json({ success: true, result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AUTH_LOGIN_FAILED';
      return res.status(500).json({ success: false, message });
    }
  },

  async setupPassword(req, res) {
    const email = typeof req.body?.email === 'string' ? req.body.email : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

    if (!email.trim() || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'email and newPassword are required'
      });
    }

    try {
      const result = await authService.setupPassword(email, newPassword, {
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null
      });
      return res.json({ success: true, result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AUTH_SETUP_PASSWORD_FAILED';
      return res.status(500).json({ success: false, message });
    }
  },

  async me(req, res) {
    try {
      const result = await authService.getCurrentUser(getBearerToken(req));
      return res.json({ success: true, result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AUTH_ME_FAILED';
      return res.status(500).json({ success: false, message });
    }
  },

  async logout(req, res) {
    try {
      const result = await authService.logout(getBearerToken(req));
      return res.json({ success: true, result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AUTH_LOGOUT_FAILED';
      return res.status(500).json({ success: false, message });
    }
  },

  async hasPermission(req, res) {
    const permissionKey = typeof req.params?.permissionKey === 'string' ? req.params.permissionKey : '';

    if (!permissionKey.trim()) {
      return res.status(400).json({
        success: false,
        message: 'permissionKey is required'
      });
    }

    try {
      const result = await authService.hasPermission(getBearerToken(req), permissionKey);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toAuthStatus(error, 'AUTH_HAS_PERMISSION_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  },

  async resetPassword(req, res) {
    const employeeId = typeof req.body?.employeeId === 'string' ? req.body.employeeId : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

    if (!employeeId.trim() || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'employeeId and newPassword are required'
      });
    }

    try {
      const result = await authService.resetPassword(getBearerToken(req), employeeId, newPassword);
      return res.json({ success: true, result });
    } catch (error) {
      const failure = toAuthStatus(error, 'AUTH_RESET_PASSWORD_FAILED');
      return res.status(failure.status).json({ success: false, message: failure.message });
    }
  }
});

module.exports = { createAuthController };
