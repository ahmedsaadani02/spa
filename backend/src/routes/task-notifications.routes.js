const express = require('express');
const { createTaskNotificationsController } = require('../controllers/task-notifications.controller');
const { createTaskNotificationsService } = require('../services/task-notifications.service');

const createTaskNotificationsRouter = (deps) => {
  const router = express.Router();
  const taskNotificationsService = createTaskNotificationsService(deps);
  const taskNotificationsController = createTaskNotificationsController({ taskNotificationsService });

  router.get('/', (req, res) => taskNotificationsController.listMine(req, res));
  router.get('/stream', (req, res) => taskNotificationsController.stream(req, res));
  router.patch('/read-all', (req, res) => taskNotificationsController.markAllRead(req, res));
  router.patch('/:id/read', (req, res) => taskNotificationsController.markRead(req, res));

  return router;
};

module.exports = { createTaskNotificationsRouter };
