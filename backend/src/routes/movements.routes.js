const express = require('express');
const { createMovementsController } = require('../controllers/movements.controller');
const { createMovementsService } = require('../services/movements.service');

const createMovementsRouter = (deps) => {
  const router = express.Router();
  const movementsService = createMovementsService(deps);
  const movementsController = createMovementsController({ movementsService });

  router.get('/', (req, res) => movementsController.list(req, res));
  router.post('/', (req, res) => movementsController.add(req, res));

  return router;
};

module.exports = { createMovementsRouter };
