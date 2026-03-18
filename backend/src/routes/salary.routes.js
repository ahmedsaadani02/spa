const express = require('express');
const { createSalaryController } = require('../controllers/salary.controller');
const { createSalaryService } = require('../services/salary.service');

const createSalaryRouter = (deps) => {
  const router = express.Router();
  const salaryService = createSalaryService(deps);
  const salaryController = createSalaryController({ salaryService });

  router.get('/advances/total', (req, res) => salaryController.totalAdvances(req, res));
  router.get('/advances', (req, res) => salaryController.listAdvances(req, res));
  router.post('/advances', (req, res) => salaryController.createAdvance(req, res));
  router.delete('/advances/:id', (req, res) => salaryController.deleteAdvance(req, res));

  router.get('/bonuses/total', (req, res) => salaryController.totalBonuses(req, res));
  router.get('/bonuses', (req, res) => salaryController.listBonuses(req, res));
  router.post('/bonuses', (req, res) => salaryController.createBonus(req, res));
  router.delete('/bonuses/:id', (req, res) => salaryController.deleteBonus(req, res));

  router.get('/overtimes/total-hours', (req, res) => salaryController.totalOvertimeHours(req, res));
  router.get('/overtimes', (req, res) => salaryController.listOvertimes(req, res));
  router.post('/overtimes', (req, res) => salaryController.createOvertime(req, res));
  router.delete('/overtimes/:id', (req, res) => salaryController.deleteOvertime(req, res));

  router.get('/summary', (req, res) => salaryController.summary(req, res));

  return router;
};

module.exports = { createSalaryRouter };
