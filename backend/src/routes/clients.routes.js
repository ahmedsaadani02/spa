const express = require('express');
const { createClientsController } = require('../controllers/clients.controller');
const { createClientsService } = require('../services/clients.service');

const createClientsRouter = (deps) => {
  const router = express.Router();
  const clientsService = createClientsService(deps);
  const clientsController = createClientsController({ clientsService });

  router.get('/', (req, res) => clientsController.list(req, res));
  router.get('/search', (req, res) => clientsController.search(req, res));
  router.get('/:id', (req, res) => clientsController.getById(req, res));
  router.post('/', (req, res) => clientsController.create(req, res));
  router.put('/:id', (req, res) => clientsController.update(req, res));
  router.delete('/:id', (req, res) => clientsController.delete(req, res));
  router.post('/find-or-create', (req, res) => clientsController.findOrCreate(req, res));

  return router;
};

module.exports = { createClientsRouter };
