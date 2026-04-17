export type UserRole = 'developer' | 'owner' | 'admin' | 'employee';

export interface PermissionSet {
  viewStock: boolean;
  addStock: boolean;
  removeStock: boolean;
  adjustStock: boolean;
  manageStock: boolean;
  editStockProduct: boolean;
  archiveStockProduct: boolean;
  manageEmployees: boolean;
  manageInvoices: boolean;
  manageQuotes: boolean;
  manageClients: boolean;
  manageEstimations: boolean;
  manageArchives: boolean;
  manageInventory: boolean;
  viewHistory: boolean;
  manageSalary: boolean;
  manageTasks: boolean;
  receiveTasks: boolean;
  viewKpis: boolean;
  manageAll: boolean;
}

export interface AppUser {
  id: string;
  nom: string;
  username: string;
  email: string | null;
  role: UserRole;
  isActive: boolean;
  isProtectedAccount: boolean;
  requiresEmail2fa: boolean;
  mustSetupPassword: boolean;
  permissions: PermissionSet;
}

export interface AuthBeginLoginResult {
  status: 'success' | 'must_setup_password' | 'invalid_credentials' | 'blocked_temporarily' | 'operation_failed';
  user?: AppUser;
  maskedEmail?: string;
  retryAfterSeconds?: number;
  message?: string;
}

export interface AuthPasswordActionResult {
  ok: boolean;
  status: 'completed' | 'weak_password' | 'operation_failed' | 'invalid_credentials' | 'blocked_temporarily' | 'forbidden' | 'already_configured';
  message?: string;
  retryAfterSeconds?: number;
}
