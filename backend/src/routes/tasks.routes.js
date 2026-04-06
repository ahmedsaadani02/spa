const express = require('express');
const { createTasksController } = require('../controllers/tasks.controller');
const { createTasksService } = require('../services/tasks.service');

const createTasksRouter = (deps) => {
  const router = express.Router();
  const tasksService = createTasksService(deps);
  const tasksController = createTasksController({ tasksService });

  router.get('/', (req, res) => tasksController.list(req, res));
  router.get('/:id', (req, res) => tasksController.getById(req, res));
  router.post('/', (req, res) => tasksController.create(req, res));
  router.put('/:id', (req, res) => tasksController.update(req, res));
  router.delete('/:id', (req, res) => tasksController.delete(req, res));

  return router;
};

module.exports = { createTasksRouter };
