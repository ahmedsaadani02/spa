const express = require('express');
const { createInvoicesController } = require('../controllers/invoices.controller');
const { createInvoicesService } = require('../services/invoices.service');

const createInvoicesRouter = (deps) => {
  const router = express.Router();
  const invoicesService = createInvoicesService(deps);
  const invoicesController = createInvoicesController({ invoicesService });

  router.get('/', (req, res) => invoicesController.list(req, res));
  router.get('/:id', (req, res) => invoicesController.getById(req, res));
  router.post('/', (req, res) => invoicesController.create(req, res));
  router.put('/:id', (req, res) => invoicesController.update(req, res));
  router.delete('/:id', (req, res) => invoicesController.delete(req, res));

  return router;
};

module.exports = { createInvoicesRouter };
