const {
  listAdvancesByEmployee,
  createAdvance,
  deleteAdvance,
  getMonthlyAdvanceTotal,
  listBonusesByEmployee,
  createBonus,
  deleteBonus,
  getMonthlyBonusTotal,
  listOvertimesByEmployee,
  createOvertime,
  deleteOvertime,
  getMonthlyOvertimeTotals,
  getSalarySummary
} = require('../repositories/salary.runtime.repository');
const { assertPermission } = require('../services/auth-session.service');

const toMonthYear = (month, year) => {
  const current = new Date();
  const parsedMonth = Number(month);
  const parsedYear = Number(year);
  return {
    month: Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12 ? parsedMonth : current.getMonth() + 1,
    year: Number.isInteger(parsedYear) && parsedYear >= 2000 ? parsedYear : current.getFullYear()
  };
};

const registerSalaryHandlers = (ipcMain, getDb) => {
  ipcMain.handle('salary:advances:list', async (event, employeeId, month, year) => {
    try {
      assertPermission('manageSalary');
      const scope = toMonthYear(month, year);
      return await listAdvancesByEmployee(getDb(), employeeId, scope.month, scope.year);
    } catch (error) {
      console.error('[salary:advances:list] error', error);
      return [];
    }
  });

  ipcMain.handle('salary:advances:create', async (event, payload) => {
    try {
      assertPermission('manageSalary');
      return await createAdvance(getDb(), payload);
    } catch (error) {
      console.error('[salary:advances:create] error', error);
      return null;
    }
  });

  ipcMain.handle('salary:advances:delete', async (event, advanceId) => {
    try {
      assertPermission('manageSalary');
      return await deleteAdvance(getDb(), advanceId);
    } catch (error) {
      console.error('[salary:advances:delete] error', error);
      return false;
    }
  });

  ipcMain.handle('salary:advances:total', async (event, employeeId, month, year) => {
    try {
      assertPermission('manageSalary');
      const scope = toMonthYear(month, year);
      return await getMonthlyAdvanceTotal(getDb(), employeeId, scope.month, scope.year);
    } catch (error) {
      console.error('[salary:advances:total] error', error);
      return 0;
    }
  });

  ipcMain.handle('salary:bonuses:list', async (event, employeeId, month, year) => {
    try {
      assertPermission('manageSalary');
      const scope = toMonthYear(month, year);
      return await listBonusesByEmployee(getDb(), employeeId, scope.month, scope.year);
    } catch (error) {
      console.error('[salary:bonuses:list] error', error);
      return [];
    }
  });

  ipcMain.handle('salary:bonuses:create', async (event, payload) => {
    try {
      assertPermission('manageSalary');
      return await createBonus(getDb(), payload);
    } catch (error) {
      console.error('[salary:bonuses:create] error', error);
      return null;
    }
  });

  ipcMain.handle('salary:bonuses:delete', async (event, bonusId) => {
    try {
      assertPermission('manageSalary');
      return await deleteBonus(getDb(), bonusId);
    } catch (error) {
      console.error('[salary:bonuses:delete] error', error);
      return false;
    }
  });

  ipcMain.handle('salary:bonuses:total', async (event, employeeId, month, year) => {
    try {
      assertPermission('manageSalary');
      const scope = toMonthYear(month, year);
      return await getMonthlyBonusTotal(getDb(), employeeId, scope.month, scope.year);
    } catch (error) {
      console.error('[salary:bonuses:total] error', error);
      return 0;
    }
  });

  ipcMain.handle('salary:summary', async (event, employeeId, month, year) => {
    try {
      assertPermission('manageSalary');
      const scope = toMonthYear(month, year);
      return await getSalarySummary(getDb(), employeeId, scope.month, scope.year);
    } catch (error) {
      console.error('[salary:summary] error', error);
      return null;
    }
  });

  ipcMain.handle('salary:overtimes:list', async (event, employeeId, month, year) => {
    try {
      assertPermission('manageSalary');
      const scope = toMonthYear(month, year);
      return await listOvertimesByEmployee(getDb(), employeeId, scope.month, scope.year);
    } catch (error) {
      console.error('[salary:overtimes:list] error', error);
      return [];
    }
  });

  ipcMain.handle('salary:overtimes:create', async (event, payload) => {
    try {
      assertPermission('manageSalary');
      return await createOvertime(getDb(), payload);
    } catch (error) {
      console.error('[salary:overtimes:create] error', error);
      return null;
    }
  });

  ipcMain.handle('salary:overtimes:delete', async (event, overtimeId) => {
    try {
      assertPermission('manageSalary');
      return await deleteOvertime(getDb(), overtimeId);
    } catch (error) {
      console.error('[salary:overtimes:delete] error', error);
      return false;
    }
  });

  ipcMain.handle('salary:overtimes:totalHours', async (event, employeeId, month, year) => {
    try {
      assertPermission('manageSalary');
      const scope = toMonthYear(month, year);
      return (await getMonthlyOvertimeTotals(getDb(), employeeId, scope.month, scope.year)).totalHours;
    } catch (error) {
      console.error('[salary:overtimes:totalHours] error', error);
      return 0;
    }
  });
};

module.exports = { registerSalaryHandlers };
