const {
  getFinanceKpis,
  getStockKpis,
  getTasksKpis,
  getEmployeesKpis,
  getCaMensuel
} = require('../repositories/postgres/dashboard.repository');

const createDashboardService = ({ resolveSessionUser }) => {
  const resolveUser = async (token) => {
    const user = await resolveSessionUser(token || '');
    if (!user) throw new Error('UNAUTHORIZED');
    return user;
  };

  const isPrivileged = (role) =>
    role === 'admin' || role === 'developer' || role === 'owner';

  const can = (user, permission) => {
    if (isPrivileged(user.role)) return true;
    if (user.permissions?.manageAll) return true;
    return !!user.permissions?.[permission];
  };

  return {
    async getKpis(token) {
      const user = await resolveUser(token);

      if (!can(user, 'viewKpis')) {
        // Employee without viewKpis — return only their task KPIs if allowed
        const result = {};
        if (can(user, 'manageTasks') || can(user, 'receiveTasks')) {
          result.tasks = await getTasksKpis(can(user, 'receiveTasks') ? user.id : null).catch(
            () => ({ totalTasks: 0, myTasksInProgress: 0, myTasksLate: 0 })
          );
        }
        return result;
      }

      // Privileged or viewKpis=true — fetch all permitted sections in parallel
      const [finance, stock, tasks, employees] = await Promise.allSettled([
        can(user, 'manageInvoices') || can(user, 'manageQuotes')
          ? getFinanceKpis()
          : Promise.resolve(null),
        can(user, 'viewStock') ? getStockKpis() : Promise.resolve(null),
        can(user, 'manageTasks') || can(user, 'receiveTasks')
          ? getTasksKpis(can(user, 'receiveTasks') ? user.id : null)
          : Promise.resolve(null),
        can(user, 'manageSalary') ? getEmployeesKpis() : Promise.resolve(null)
      ]);

      const result = {};
      if (finance.status === 'fulfilled' && finance.value) result.finance = finance.value;
      if (stock.status === 'fulfilled' && stock.value) result.stock = stock.value;
      if (tasks.status === 'fulfilled' && tasks.value) result.tasks = tasks.value;
      if (employees.status === 'fulfilled' && employees.value) result.employees = employees.value;

      return result;
    },

    async getCaMensuel(token) {
      const user = await resolveUser(token);
      if (!can(user, 'viewKpis') && !can(user, 'manageInvoices')) {
        throw new Error('FORBIDDEN');
      }
      return getCaMensuel();
    }
  };
};

module.exports = { createDashboardService };
