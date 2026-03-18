const express = require('express');
const { createStockController } = require('../controllers/stock.controller');
const { createStockService } = require('../services/stock.service');

const createStockRouter = (deps) => {
  const router = express.Router();
  const stockService = createStockService(deps);
  const stockController = createStockController({ stockService });

  router.get('/', (req, res) => stockController.list(req, res));
  router.get('/items', (req, res) => stockController.items(req, res));
  router.post('/movements', (req, res) => stockController.applyMovement(req, res));
  router.patch('/:productId/:color/set-qty', (req, res) => stockController.setQty(req, res));
  router.patch('/:productId/:color/increment', (req, res) => stockController.increment(req, res));
  router.patch('/:productId/:color/decrement', (req, res) => stockController.decrement(req, res));

  return router;
};

module.exports = { createStockRouter };
