const path = require('path');
const { assertPermission } = require('../auth/service');

const registerDatabaseHandlers = (
  ipcMain,
  { backupDatabase, listBackups, restoreDatabase },
  dbContext
) => {
  ipcMain.handle('db:backup', async () => {
    try {
      assertPermission('manageEmployees');
      return backupDatabase(dbContext);
    } catch (error) {
      console.error('[db:backup] error', error);
      return false;
    }
  });

  ipcMain.handle('db:list-backups', () => {
    try {
      assertPermission('manageEmployees');
      return listBackups();
    } catch (error) {
      console.error('[db:list-backups] error', error);
      return [];
    }
  });

  ipcMain.handle('db:restore', async (event, backupFileName) => {
    try {
      assertPermission('manageEmployees');
      if (typeof backupFileName !== 'string' || backupFileName.trim().length === 0) {
        return false;
      }

      const selected = path.basename(backupFileName.trim());
      return restoreDatabase(dbContext, selected);
    } catch (error) {
      console.error('[db:restore] error', error);
      return false;
    }
  });
};

module.exports = { registerDatabaseHandlers };
