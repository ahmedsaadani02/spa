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
} = require('../db/salary');
const { assertPermission } = require('../auth/service');

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
  ipcMain.handle('salary:advances:list', (event, employeeId, month, year) => {
    try {
      assertPermission('manageSalary');
      const scope = toMonthYear(month, year);
      return listAdvancesByEmployee(getDb(), employeeId, scope.month, scope.year);
    } catch (error) {
      console.error('[salary:advances:list] error', error);
      return [];
    }
  });

  ipcMain.handle('salary:advances:create', (event, payload) => {
    try {
      assertPermission('manageSalary');
      return createAdvance(getDb(), payload);
    } catch (error) {
      console.error('[salary:advances:create] error', error);
      return null;
    }
  });

  ipcMain.handle('salary:advances:delete', (event, advanceId) => {
    try {
      assertPermission('manageSalary');
      return deleteAdvance(getDb(), advanceId);
    } catch (error) {
      console.error('[salary:advances:delete] error', error);
      return false;
    }
  });

  ipcMain.handle('salary:advances:total', (event, employeeId, month, year) => {
    try {
      assertPermission('manageSalary');
      const scope = toMonthYear(month, year);
      return getMonthlyAdvanceTotal(getDb(), employeeId, scope.month, scope.year);
    } catch (error) {
      console.error('[salary:advances:total] error', error);
      return 0;
    }
  });

  ipcMain.handle('salary:bonuses:list', (event, employeeId, month, year) => {
    try {
      assertPermission('manageSalary');
      const scope = toMonthYear(month, year);
      return listBonusesByEmployee(getDb(), employeeId, scope.month, scope.year);
    } catch (error) {
      console.error('[salary:bonuses:list] error', error);
      return [];
    }
  });

  ipcMain.handle('salary:bonuses:create', (event, payload) => {
    try {
      assertPermission('manageSalary');
      return createBonus(getDb(), payload);
    } catch (error) {
      console.error('[salary:bonuses:create] error', error);
      return null;
    }
  });

  ipcMain.handle('salary:bonuses:delete', (event, bonusId) => {
    try {
      assertPermission('manageSalary');
      return deleteBonus(getDb(), bonusId);
    } catch (error) {
      console.error('[salary:bonuses:delete] error', error);
      return false;
    }
  });

  ipcMain.handle('salary:bonuses:total', (event, employeeId, month, year) => {
    try {
      assertPermission('manageSalary');
      const scope = toMonthYear(month, year);
      return getMonthlyBonusTotal(getDb(), employeeId, scope.month, scope.year);
    } catch (error) {
      console.error('[salary:bonuses:total] error', error);
      return 0;
    }
  });

  ipcMain.handle('salary:summary', (event, employeeId, month, year) => {
    try {
      assertPermission('manageSalary');
      const scope = toMonthYear(month, year);
      return getSalarySummary(getDb(), employeeId, scope.month, scope.year);
    } catch (error) {
      console.error('[salary:summary] error', error);
      return null;
    }
  });

  ipcMain.handle('salary:overtimes:list', (event, employeeId, month, year) => {
    try {
      assertPermission('manageSalary');
      const scope = toMonthYear(month, year);
      return listOvertimesByEmployee(getDb(), employeeId, scope.month, scope.year);
    } catch (error) {
      console.error('[salary:overtimes:list] error', error);
      return [];
    }
  });

  ipcMain.handle('salary:overtimes:create', (event, payload) => {
    try {
      assertPermission('manageSalary');
      return createOvertime(getDb(), payload);
    } catch (error) {
      console.error('[salary:overtimes:create] error', error);
      return null;
    }
  });

  ipcMain.handle('salary:overtimes:delete', (event, overtimeId) => {
    try {
      assertPermission('manageSalary');
      return deleteOvertime(getDb(), overtimeId);
    } catch (error) {
      console.error('[salary:overtimes:delete] error', error);
      return false;
    }
  });

  ipcMain.handle('salary:overtimes:totalHours', (event, employeeId, month, year) => {
    try {
      assertPermission('manageSalary');
      const scope = toMonthYear(month, year);
      return getMonthlyOvertimeTotals(getDb(), employeeId, scope.month, scope.year).totalHours;
    } catch (error) {
      console.error('[salary:overtimes:totalHours] error', error);
      return 0;
    }
  });
};

module.exports = { registerSalaryHandlers };
