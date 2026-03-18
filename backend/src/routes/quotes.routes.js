const express = require('express');
const { createQuotesController } = require('../controllers/quotes.controller');
const { createQuotesService } = require('../services/quotes.service');

const createQuotesRouter = (deps) => {
  const router = express.Router();
  const quotesService = createQuotesService(deps);
  const quotesController = createQuotesController({ quotesService });

  router.get('/', (req, res) => quotesController.list(req, res));
  router.get('/:id', (req, res) => quotesController.getById(req, res));
  router.post('/', (req, res) => quotesController.create(req, res));
  router.put('/:id', (req, res) => quotesController.update(req, res));
  router.delete('/:id', (req, res) => quotesController.delete(req, res));
  router.post('/:id/convert-to-invoice', (req, res) => quotesController.convertToInvoice(req, res));

  return router;
};

module.exports = { createQuotesRouter };
