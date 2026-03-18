const express = require('express');
const { createProductsController } = require('../controllers/products.controller');
const { createProductsService } = require('../services/products.service');

const createProductsRouter = (deps) => {
  const router = express.Router();
  const productsService = createProductsService(deps);
  const productsController = createProductsController({ productsService });

  router.get('/', (req, res) => productsController.list(req, res));
  router.get('/archived', (req, res) => productsController.listArchived(req, res));
  router.get('/metadata', (req, res) => productsController.metadata(req, res));
  router.post('/metadata', (req, res) => productsController.addMetadata(req, res));
  router.post('/upsert', (req, res) => productsController.upsert(req, res));
  router.post('/', (req, res) => productsController.create(req, res));
  router.put('/:id', (req, res) => productsController.update(req, res));
  router.delete('/:id', (req, res) => productsController.delete(req, res));
  router.post('/:id/archive', (req, res) => productsController.archive(req, res));
  router.post('/:id/restore', (req, res) => productsController.restore(req, res));
  router.delete('/:id/purge', (req, res) => productsController.purge(req, res));
  router.patch('/:id/price', (req, res) => productsController.updatePrice(req, res));
  router.get('/:id/price-history', (req, res) => productsController.priceHistory(req, res));
  router.post('/:id/restore-price', (req, res) => productsController.restorePrice(req, res));

  return router;
};

module.exports = { createProductsRouter };
