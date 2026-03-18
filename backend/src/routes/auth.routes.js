const express = require('express');
const { createAuthController } = require('../controllers/auth.controller');
const { createAuthService } = require('../services/auth.service');

const createAuthRouter = (deps) => {
  const router = express.Router();
  const authService = createAuthService(deps);
  const authController = createAuthController({ authService });

  router.post('/login', (req, res) => authController.login(req, res));
  router.post('/setup-password', (req, res) => authController.setupPassword(req, res));
  router.get('/me', (req, res) => authController.me(req, res));
  router.post('/logout', (req, res) => authController.logout(req, res));
  router.get('/permissions/:permissionKey', (req, res) => authController.hasPermission(req, res));
  router.post('/reset-password', (req, res) => authController.resetPassword(req, res));

  return router;
};

module.exports = { createAuthRouter };
