const { assertPermission } = require('./auth-session.service');
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
} = require('../repositories/salary.repository');

const toMonthYear = (month, year) => {
  const current = new Date();
  const parsedMonth = Number(month);
  const parsedYear = Number(year);
  return {
    month: Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12 ? parsedMonth : current.getMonth() + 1,
    year: Number.isInteger(parsedYear) && parsedYear >= 2000 ? parsedYear : current.getFullYear()
  };
};

const createSalaryService = ({ getDb, resolveSessionUser, setCurrentUser, clearCurrentUser }) => {
  const withAuthorizedUser = (token, operation) => {
    const user = resolveSessionUser(token || '');
    if (!user) {
      throw new Error('UNAUTHORIZED');
    }

    setCurrentUser(user);
    try {
      assertPermission('manageSalary');
      return operation();
    } finally {
      clearCurrentUser();
    }
  };

  return {
    async listAdvances(token, employeeId, month, year) {
      return withAuthorizedUser(token, () => {
        const scope = toMonthYear(month, year);
        return listAdvancesByEmployee(getDb(), employeeId, scope.month, scope.year);
      });
    },

    async createAdvance(token, payload) {
      return withAuthorizedUser(token, () => createAdvance(getDb(), payload));
    },

    async deleteAdvance(token, id) {
      return withAuthorizedUser(token, () => deleteAdvance(getDb(), id));
    },

    async totalAdvances(token, employeeId, month, year) {
      return withAuthorizedUser(token, () => {
        const scope = toMonthYear(month, year);
        return getMonthlyAdvanceTotal(getDb(), employeeId, scope.month, scope.year);
      });
    },

    async listBonuses(token, employeeId, month, year) {
      return withAuthorizedUser(token, () => {
        const scope = toMonthYear(month, year);
        return listBonusesByEmployee(getDb(), employeeId, scope.month, scope.year);
      });
    },

    async createBonus(token, payload) {
      return withAuthorizedUser(token, () => createBonus(getDb(), payload));
    },

    async deleteBonus(token, id) {
      return withAuthorizedUser(token, () => deleteBonus(getDb(), id));
    },

    async totalBonuses(token, employeeId, month, year) {
      return withAuthorizedUser(token, () => {
        const scope = toMonthYear(month, year);
        return getMonthlyBonusTotal(getDb(), employeeId, scope.month, scope.year);
      });
    },

    async listOvertimes(token, employeeId, month, year) {
      return withAuthorizedUser(token, () => {
        const scope = toMonthYear(month, year);
        return listOvertimesByEmployee(getDb(), employeeId, scope.month, scope.year);
      });
    },

    async createOvertime(token, payload) {
      return withAuthorizedUser(token, () => createOvertime(getDb(), payload));
    },

    async deleteOvertime(token, id) {
      return withAuthorizedUser(token, () => deleteOvertime(getDb(), id));
    },

    async totalOvertimeHours(token, employeeId, month, year) {
      return withAuthorizedUser(token, () => {
        const scope = toMonthYear(month, year);
        return getMonthlyOvertimeTotals(getDb(), employeeId, scope.month, scope.year).totalHours;
      });
    },

    async summary(token, employeeId, month, year) {
      return withAuthorizedUser(token, () => {
        const scope = toMonthYear(month, year);
        return getSalarySummary(getDb(), employeeId, scope.month, scope.year);
      });
    }
  };
};

module.exports = { createSalaryService };
