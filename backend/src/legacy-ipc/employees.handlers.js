const {
  listEmployees,
  searchEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  setEmployeeActive,
} = require('../repositories/employees.runtime.repository');
const { assertPermission, getCurrentUser, hashPassword, hasPermission } = require('../services/auth-core.service');
const { isProtectedEmail } = require('../services/auth-protected-accounts.service');
const { validateEmployeeAccountPassword } = require('../services/employee-password-policy.service');

const normalizeEmployeePayload = (payload = {}) => {
  const normalized = {
    id: payload.id,
    nom: payload.nom,
    telephone: payload.telephone,
    adresse: payload.adresse,
    poste: payload.poste,
    salaireBase: payload.salaireBase,
    dateEmbauche: payload.dateEmbauche,
    actif: payload.actif,
    isActive: payload.isActive ?? payload.actif,
    username: payload.username,
    email: payload.email,
    role: payload.role,
    isProtectedAccount: !!payload.isProtectedAccount || isProtectedEmail(payload.email),
    requiresEmail2fa: false,
    mustSetupPassword: !!payload.mustSetupPassword,
    canViewStock: !!payload.canViewStock,
    canAddStock: !!payload.canAddStock,
    canRemoveStock: !!payload.canRemoveStock,
    canAdjustStock: !!payload.canAdjustStock,
    canManageStock: !!payload.canManageStock,
    canEditStockProduct: !!payload.canEditStockProduct,
    canArchiveStockProduct: !!payload.canArchiveStockProduct,
    canManageEmployees: !!payload.canManageEmployees,
    canManageInvoices: !!payload.canManageInvoices,
    canManageQuotes: !!payload.canManageQuotes,
    canManageClients: !!payload.canManageClients,
    canManageEstimations: !!payload.canManageEstimations,
    canManageArchives: !!payload.canManageArchives,
    canManageInventory: !!payload.canManageInventory,
    canViewHistory: !!payload.canViewHistory,
    canManageSalary: !!payload.canManageSalary,
    canManageTasks: !!payload.canManageTasks,
    canReceiveTasks: !!payload.canReceiveTasks,
    canManageAll: !!payload.canManageAll
  };

  const isHighRole = normalized.role === 'admin' || normalized.role === 'developer' || normalized.role === 'owner';
  if (!isHighRole) {
    normalized.canManageAll = false;
  }

  if (normalized.canManageAll) {
    normalized.canViewStock = true;
    normalized.canAddStock = true;
    normalized.canRemoveStock = true;
    normalized.canAdjustStock = true;
    normalized.canManageStock = true;
    normalized.canEditStockProduct = true;
    normalized.canArchiveStockProduct = true;
    normalized.canManageEmployees = true;
    normalized.canManageInvoices = true;
    normalized.canManageQuotes = true;
    normalized.canManageClients = true;
    normalized.canManageEstimations = true;
    normalized.canManageArchives = true;
    normalized.canManageInventory = true;
    normalized.canViewHistory = true;
    normalized.canManageSalary = true;
    normalized.canManageTasks = true;
    normalized.canReceiveTasks = true;
  }

  if (normalized.canManageStock) {
    normalized.canAddStock = true;
    normalized.canRemoveStock = true;
    normalized.canAdjustStock = true;
    normalized.canEditStockProduct = true;
    normalized.canArchiveStockProduct = true;
  }

  if (typeof payload.initialPassword === 'string' && payload.initialPassword.trim().length > 0) {
    const policy = validateEmployeeAccountPassword(payload.initialPassword.trim(), normalized.role);
    if (!policy.ok) {
      throw new Error(policy.message);
    }
    normalized.passwordHash = hashPassword(payload.initialPassword.trim());
    normalized.mustSetupPassword = false;
  }

  return normalized;
};

const isDeveloper = (user) => user?.role === 'developer';
const isPrivilegedManager = (user) => user?.role === 'developer' || user?.role === 'owner';

const assertCanManageEmployees = (targetRole, isProtectedTarget = false) => {
  assertPermission('manageEmployees');
  const current = getCurrentUser();
  if (!current) {
    throw new Error('NOT_AUTHENTICATED');
  }

  if (isProtectedTarget && !isPrivilegedManager(current)) {
    throw new Error('FORBIDDEN');
  }

  if ((targetRole === 'developer' || targetRole === 'owner') && !isDeveloper(current)) {
    throw new Error('FORBIDDEN');
  }

  if (targetRole === 'admin' && !isPrivilegedManager(current) && current.role !== 'admin') {
    throw new Error('FORBIDDEN');
  }
};

const assertCanReadEmployees = () => {
  const current = getCurrentUser();
  if (!current) {
    throw new Error('NOT_AUTHENTICATED');
  }
  if (!hasPermission('manageEmployees') && !hasPermission('manageSalary')) {
    throw new Error('FORBIDDEN');
  }
};

const assertCanManageExistingEmployee = (target) => {
  const current = getCurrentUser();
  if (!current || !target) {
    throw new Error('NOT_AUTHENTICATED');
  }

  if (target.isProtectedAccount && !isPrivilegedManager(current)) {
    throw new Error('FORBIDDEN');
  }

  if ((target.role === 'developer' || target.role === 'owner') && !isDeveloper(current)) {
    throw new Error('FORBIDDEN');
  }
};

const registerEmployeesHandlers = (ipcMain, getDb) => {
  ipcMain.handle('employees:list', async () => {
    try {
      assertCanReadEmployees();
      return await listEmployees(getDb());
    } catch (error) {
      console.error('[employees:list] error', error);
      return [];
    }
  });

  ipcMain.handle('employees:search', async (event, query) => {
    try {
      assertCanReadEmployees();
      return await searchEmployees(getDb(), query ?? '');
    } catch (error) {
      console.error('[employees:search] error', error);
      return [];
    }
  });

  ipcMain.handle('employees:getById', async (event, id) => {
    try {
      assertCanReadEmployees();
      return await getEmployeeById(getDb(), id);
    } catch (error) {
      console.error('[employees:getById] error', error);
      return null;
    }
  });

  ipcMain.handle('employees:create', async (event, payload) => {
    try {
      const normalized = normalizeEmployeePayload(payload);
      assertCanManageEmployees(normalized.role, normalized.isProtectedAccount);
      if (normalized.email && isProtectedEmail(normalized.email)) {
        return null;
      }
      return await createEmployee(getDb(), normalized);
    } catch (error) {
      console.error('[employees:create] error', error);
      return null;
    }
  });

  ipcMain.handle('employees:update', async (event, id, payload) => {
    try {
      const existing = await getEmployeeById(getDb(), id);
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
      return await updateEmployee(getDb(), id, normalized);
    } catch (error) {
      console.error('[employees:update] error', error);
      return null;
    }
  });

  ipcMain.handle('employees:delete', async (event, id) => {
    try {
      assertPermission('manageEmployees');
      const existing = await getEmployeeById(getDb(), id);
      if (!existing) return false;
      if (existing.isProtectedAccount) return false;
      assertCanManageExistingEmployee(existing);
      return await deleteEmployee(getDb(), id);
    } catch (error) {
      console.error('[employees:delete] error', error);
      return false;
    }
  });

  ipcMain.handle('employees:setActive', async (event, id, actif) => {
    try {
      assertPermission('manageEmployees');
      const existing = await getEmployeeById(getDb(), id);
      if (!existing) return false;
      if (existing.isProtectedAccount && !actif) return false;
      assertCanManageExistingEmployee(existing);
      return await setEmployeeActive(getDb(), id, !!actif);
    } catch (error) {
      console.error('[employees:setActive] error', error);
      return false;
    }
  });
};

module.exports = {
  registerEmployeesHandlers,
  normalizeEmployeePayload,
  assertCanManageEmployees,
  assertCanReadEmployees,
  assertCanManageExistingEmployee
};
