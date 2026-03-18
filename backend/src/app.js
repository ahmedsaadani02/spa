const express = require('express');
const { createAuthRouter } = require('./routes/auth.routes');
const { createClientsRouter } = require('./routes/clients.routes');
const { createInvoicesRouter } = require('./routes/invoices.routes');
const { createQuotesRouter } = require('./routes/quotes.routes');
const { createProductsRouter } = require('./routes/products.routes');
const { createStockRouter } = require('./routes/stock.routes');
const { createMovementsRouter } = require('./routes/movements.routes');
const { createEmployeesRouter } = require('./routes/employees.routes');
const { createSalaryRouter } = require('./routes/salary.routes');
const { createInventoryRouter } = require('./routes/inventory.routes');

const registerBackendRoutes = (app, deps) => {
  const router = express.Router();
  router.use('/auth', createAuthRouter(deps));
  router.use('/clients', createClientsRouter(deps));
  router.use('/invoices', createInvoicesRouter(deps));
  router.use('/quotes', createQuotesRouter(deps));
  router.use('/products', createProductsRouter(deps));
  router.use('/stock', createStockRouter(deps));
  router.use('/movements', createMovementsRouter(deps));
  router.use('/employees', createEmployeesRouter(deps));
  router.use('/salary', createSalaryRouter(deps));
  router.use('/inventory', createInventoryRouter(deps));
  app.use('/api', router);
};

module.exports = { registerBackendRoutes };
