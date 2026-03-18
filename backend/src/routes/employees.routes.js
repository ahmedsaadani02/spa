const express = require('express');
const { createEmployeesController } = require('../controllers/employees.controller');
const { createEmployeesService } = require('../services/employees.service');

const createEmployeesRouter = (deps) => {
  const router = express.Router();
  const employeesService = createEmployeesService(deps);
  const employeesController = createEmployeesController({ employeesService });

  router.get('/', (req, res) => employeesController.list(req, res));
  router.get('/search', (req, res) => employeesController.search(req, res));
  router.get('/:id', (req, res) => employeesController.getById(req, res));
  router.post('/', (req, res) => employeesController.create(req, res));
  router.put('/:id', (req, res) => employeesController.update(req, res));
  router.delete('/:id', (req, res) => employeesController.delete(req, res));
  router.patch('/:id/active', (req, res) => employeesController.setActive(req, res));

  return router;
};

module.exports = { createEmployeesRouter };
