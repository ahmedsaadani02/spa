const express = require('express');
const { createTasksController } = require('../controllers/tasks.controller');
const { createTasksService } = require('../services/tasks.service');

const createMyTasksRouter = (deps) => {
  const router = express.Router();
  const tasksService = createTasksService(deps);
  const tasksController = createTasksController({ tasksService });

  router.get('/', (req, res) => tasksController.listMine(req, res));
  router.get('/:id', (req, res) => tasksController.getMineById(req, res));
  router.patch('/:id', (req, res) => tasksController.updateMine(req, res));

  return router;
};

module.exports = { createMyTasksRouter };
