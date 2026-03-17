const { app, BrowserWindow, ipcMain } = require('electron');
const { bootstrapEnv } = require('./main-process/config/env');
bootstrapEnv({ app });

const { createMainWindow } = require('./main-process/window');
const { initDb, getDb, closeDb, dbFilePath } = require('./main-process/db');
const { startAutomaticBackups, stopAutomaticBackups } = require('./main-process/db/backup');
const { registerIpcHandlers } = require('./main-process/ipc');
const { registerProductsHandlers } = require('./main-process/ipc/products');
const { registerQuotesHandlers } = require('./main-process/ipc/quotes');
const { startServer, stopServer } = require('../server/server');
const { initAutoUpdater } = require('./main-process/updater');

let mainWindow;

const logRequiredIpcChannels = () => {
  const required = [
    'products:archive',
    'quotes:convertToInvoice'
  ];
  const invokeHandlers = ipcMain?._invokeHandlers;
  if (!invokeHandlers || typeof invokeHandlers.has !== 'function') {
    console.warn('[ipc] unable to inspect invoke handlers map');
    return;
  }

  required.forEach((channel) => {
    if (invokeHandlers.has(channel)) {
      console.log(`[ipc] ${channel} registered`);
    } else {
      console.error(`[ipc] ${channel} NOT registered`);
    }
  });
};

app.whenReady().then(() => {
  initDb();

  // Safety net: register products handlers first so product creation/upload is never skipped.
  registerProductsHandlers(ipcMain, getDb);
  // Safety net: register quotes handlers first so convertToInvoice is never skipped.
  registerQuotesHandlers(ipcMain, getDb);
  registerIpcHandlers();
  logRequiredIpcChannels();

  startServer(3000, '0.0.0.0');

  startAutomaticBackups({ getDb, dbFilePath });

  mainWindow = createMainWindow();
  initAutoUpdater({ app, ipcMain });

  app.on('activate', () => {
    startServer(3000, '0.0.0.0');

    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopServer();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopServer();
  stopAutomaticBackups();
  closeDb();
});
