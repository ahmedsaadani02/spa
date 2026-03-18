const express = require('express');
const { createInventoryController } = require('../controllers/inventory.controller');
const { createInventoryService } = require('../services/inventory.service');

const createInventoryRouter = (deps) => {
  const router = express.Router();
  const inventoryService = createInventoryService(deps);
  const inventoryController = createInventoryController({ inventoryService });

  router.get('/', (req, res) => inventoryController.get(req, res));

  return router;
};

module.exports = { createInventoryRouter };
