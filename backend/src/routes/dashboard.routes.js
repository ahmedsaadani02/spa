const express = require('express');
const { createDashboardController } = require('../controllers/dashboard.controller');
const { createDashboardService } = require('../services/dashboard.service');

const createDashboardRouter = (deps) => {
  const router = express.Router();
  const dashboardService = createDashboardService(deps);
  const dashboardController = createDashboardController({ dashboardService });

  router.get('/kpis', (req, res) => dashboardController.getKpis(req, res));
  router.get('/ca-mensuel', (req, res) => dashboardController.getCaMensuel(req, res));

  return router;
};

module.exports = { createDashboardRouter };
