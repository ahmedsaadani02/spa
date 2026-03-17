const { ipcMain } = require('electron');
const { getDb, initDb, closeDb, dbFilePath } = require('../db');
const { backupDatabase, listBackups, restoreDatabase } = require('../db/backup');
const { registerProductsHandlers } = require('./products');
const { registerStockHandlers } = require('./stock');
const { registerMovementsHandlers } = require('./movements');
const { registerInventoryHandlers } = require('./inventory');
const { registerInvoicesHandlers } = require('./invoices');
const { registerQuotesHandlers } = require('./quotes');
const { registerClientsHandlers } = require('./clients');
const { registerExportHandlers } = require('./export');
const { registerDatabaseHandlers } = require('./database');
const { registerAuthHandlers } = require('./auth');
const { registerEmployeesHandlers } = require('./employees');
const { registerSalaryHandlers } = require('./salary');

const registerStep = (name, callback) => {
  try {
    callback();
    console.log(`[ipc] ${name} registered`);
    return true;
  } catch (error) {
    console.error(`[ipc] ${name} registration failed`, error);
    return false;
  }
};

const registerIpcHandlers = () => {
  console.log('[ipc] Registering IPC handlers...');
  registerStep('auth handlers', () => registerAuthHandlers(ipcMain, getDb));
  console.log('[ipc] registering products handlers');
  if (registerStep('products handlers', () => registerProductsHandlers(ipcMain, getDb))) {
    console.log('[ipc] products handlers ready');
  } else {
    console.error('[ipc] products handlers NOT ready');
  }
  registerStep('stock handlers', () => registerStockHandlers(ipcMain, getDb));
  registerStep('movements handlers', () => registerMovementsHandlers(ipcMain, getDb));
  registerStep('inventory handlers', () => registerInventoryHandlers(ipcMain, getDb));
  registerStep('clients handlers', () => registerClientsHandlers(ipcMain, getDb));
  registerStep('invoices handlers', () => registerInvoicesHandlers(ipcMain, getDb));
  console.log('[ipc] registering quotes handlers');
  if (registerStep('quotes handlers', () => registerQuotesHandlers(ipcMain, getDb))) {
    console.log('[ipc] quotes handlers ready');
  } else {
    console.error('[ipc] quotes handlers NOT ready');
  }
  registerStep('employees handlers', () => registerEmployeesHandlers(ipcMain, getDb));
  registerStep('salary handlers', () => registerSalaryHandlers(ipcMain, getDb));
  registerStep('export handlers', () => registerExportHandlers(ipcMain));
  registerStep('database handlers', () => registerDatabaseHandlers(
    ipcMain,
    { backupDatabase, listBackups, restoreDatabase },
    { getDb, initDb, closeDb, dbFilePath }
  ));
  console.log('[ipc] IPC handlers ready.');
};

module.exports = { registerIpcHandlers };
