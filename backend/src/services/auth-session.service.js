const PERMISSION_KEYS = Object.freeze({
  viewStock: 'can_view_stock',
  addStock: 'can_add_stock',
  removeStock: 'can_remove_stock',
  adjustStock: 'can_adjust_stock',
  manageStock: 'can_manage_stock',
  editStockProduct: 'can_edit_stock_product',
  archiveStockProduct: 'can_archive_stock_product',
  manageEmployees: 'can_manage_employees',
  manageInvoices: 'can_manage_invoices',
  manageQuotes: 'can_manage_quotes',
  manageClients: 'can_manage_clients',
  manageEstimations: 'can_manage_estimations',
  manageArchives: 'can_manage_archives',
  manageInventory: 'can_manage_inventory',
  viewHistory: 'can_view_history',
  manageSalary: 'can_manage_salary',
  manageTasks: 'can_manage_tasks',
  receiveTasks: 'can_receive_tasks',
  viewKpis: 'can_view_kpis',
  manageAll: 'can_manage_all'
});

let currentUser = null;

const toBool = (value) => Number(value) === 1;
const isPrivilegedRole = (role) => role === 'admin' || role === 'developer' || role === 'owner';

const buildPermissionSet = (row) => ({
  viewStock: toBool(row.can_view_stock),
  addStock: toBool(row.can_add_stock) || toBool(row.can_manage_stock),
  removeStock: toBool(row.can_remove_stock) || toBool(row.can_manage_stock),
  adjustStock: toBool(row.can_adjust_stock) || toBool(row.can_manage_stock),
  manageStock: toBool(row.can_manage_stock),
  editStockProduct: toBool(row.can_edit_stock_product) || toBool(row.can_manage_stock),
  archiveStockProduct: toBool(row.can_archive_stock_product) || toBool(row.can_manage_stock),
  manageEmployees: toBool(row.can_manage_employees),
  manageInvoices: toBool(row.can_manage_invoices),
  manageQuotes: toBool(row.can_manage_quotes),
  manageClients: toBool(row.can_manage_clients),
  manageEstimations: toBool(row.can_manage_estimations) || toBool(row.can_manage_quotes),
  manageArchives: toBool(row.can_manage_archives) || toBool(row.can_manage_stock),
  manageInventory: toBool(row.can_manage_inventory),
  viewHistory: toBool(row.can_view_history),
  manageSalary: toBool(row.can_manage_salary),
  manageTasks: toBool(row.can_manage_tasks),
  receiveTasks: toBool(row.can_receive_tasks),
  viewKpis: toBool(row.can_view_kpis),
  manageAll: toBool(row.can_manage_all)
});

const toAppUser = (row) => {
  if (!row) return null;

  const role = row.role === 'developer'
    ? 'developer'
    : row.role === 'owner'
      ? 'owner'
      : row.role === 'admin'
        ? 'admin'
        : 'employee';
  const permissions = buildPermissionSet(row);

  if (isPrivilegedRole(role)) {
    return {
      id: row.id,
      nom: row.nom,
      username: row.username,
      email: row.email ?? null,
      role,
      isActive: true,
      isProtectedAccount: toBool(row.is_protected_account),
      requiresEmail2fa: toBool(row.requires_email_2fa),
      mustSetupPassword: toBool(row.must_setup_password),
      permissions: {
        viewStock: true,
        addStock: true,
        removeStock: true,
        adjustStock: true,
        manageStock: true,
        editStockProduct: true,
        archiveStockProduct: true,
        manageEmployees: true,
        manageInvoices: true,
        manageQuotes: true,
        manageClients: true,
        manageEstimations: true,
        manageArchives: true,
        manageInventory: true,
        viewHistory: true,
        manageSalary: true,
        manageTasks: true,
        receiveTasks: true,
        viewKpis: true,
        manageAll: true
      }
    };
  }

  return {
    id: row.id,
    nom: row.nom,
    username: row.username,
    email: row.email ?? null,
    role,
    isActive: toBool(row.is_active ?? row.actif),
    isProtectedAccount: toBool(row.is_protected_account),
    requiresEmail2fa: toBool(row.requires_email_2fa),
    mustSetupPassword: toBool(row.must_setup_password),
    permissions
  };
};

const setCurrentUser = (user) => {
  currentUser = user ? { ...user, permissions: { ...user.permissions } } : null;
};

const clearCurrentUser = () => {
  currentUser = null;
};

const getCurrentUser = () => (currentUser ? { ...currentUser, permissions: { ...currentUser.permissions } } : null);

const hasPermission = (permissionKey) => {
  if (!currentUser) return false;
  if (isPrivilegedRole(currentUser.role)) return true;
  if (currentUser.permissions?.manageAll) return true;
  return !!currentUser.permissions?.[permissionKey];
};

const assertPermission = (permissionKey) => {
  if (!currentUser) {
    throw new Error('NOT_AUTHENTICATED');
  }
  if (!hasPermission(permissionKey)) {
    throw new Error('FORBIDDEN');
  }
};

module.exports = {
  PERMISSION_KEYS,
  toAppUser,
  setCurrentUser,
  clearCurrentUser,
  getCurrentUser,
  hasPermission,
  assertPermission
};
