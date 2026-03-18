const {
  listEmployees,
  searchEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  setEmployeeActive
} = require('../repositories/employees.repository');
const {
  normalizeEmployeePayload,
  assertCanManageEmployees,
  assertCanReadEmployees,
  assertCanManageExistingEmployee
} = require('../legacy-ipc/employees.handlers');
const { assertPermission } = require('./auth-session.service');
const { isProtectedEmail } = require('./auth-protected-accounts.service');

const createEmployeesService = ({ getDb, resolveSessionUser, setCurrentUser, clearCurrentUser }) => {
  const withAuthorizedUser = (token, operation) => {
    const user = resolveSessionUser(token || '');
    if (!user) {
      throw new Error('UNAUTHORIZED');
    }

    setCurrentUser(user);
    try {
      return operation();
    } finally {
      clearCurrentUser();
    }
  };

  return {
    async list(token) {
      return withAuthorizedUser(token, () => {
        assertCanReadEmployees();
        return listEmployees(getDb());
      });
    },

    async search(token, query) {
      return withAuthorizedUser(token, () => {
        assertCanReadEmployees();
        return searchEmployees(getDb(), query ?? '');
      });
    },

    async getById(token, id) {
      return withAuthorizedUser(token, () => {
        assertCanReadEmployees();
        return getEmployeeById(getDb(), id);
      });
    },

    async create(token, payload) {
      return withAuthorizedUser(token, () => {
        const normalized = normalizeEmployeePayload(payload);
        assertCanManageEmployees(normalized.role, normalized.isProtectedAccount);
        if (normalized.email && isProtectedEmail(normalized.email)) {
          return null;
        }
        return createEmployee(getDb(), normalized);
      });
    },

    async update(token, id, payload) {
      return withAuthorizedUser(token, () => {
        const existing = getEmployeeById(getDb(), id);
        if (!existing) return null;
        assertCanManageExistingEmployee(existing);
        const normalized = normalizeEmployeePayload(payload);
        if (existing.isProtectedAccount) {
          const nextEmail = (normalized.email ?? '').trim().toLowerCase();
          const existingEmail = (existing.email ?? '').trim().toLowerCase();
          if (!nextEmail || nextEmail !== existingEmail) {
            return null;
          }
        }
        if (normalized.email && isProtectedEmail(normalized.email) && !existing.isProtectedAccount) {
          return null;
        }
        assertCanManageEmployees(normalized.role, normalized.isProtectedAccount || existing.isProtectedAccount);
        return updateEmployee(getDb(), id, normalized);
      });
    },

    async delete(token, id) {
      return withAuthorizedUser(token, () => {
        assertPermission('manageEmployees');
        const existing = getEmployeeById(getDb(), id);
        if (!existing) return false;
        if (existing.isProtectedAccount) return false;
        assertCanManageExistingEmployee(existing);
        return deleteEmployee(getDb(), id);
      });
    },

    async setActive(token, id, actif) {
      return withAuthorizedUser(token, () => {
        assertPermission('manageEmployees');
        const existing = getEmployeeById(getDb(), id);
        if (!existing) return false;
        if (existing.isProtectedAccount && !actif) return false;
        assertCanManageExistingEmployee(existing);
        return setEmployeeActive(getDb(), id, !!actif);
      });
    }
  };
};

module.exports = { createEmployeesService };
