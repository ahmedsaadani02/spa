import { UserRole } from './auth.models';

export interface Employee {
  id: string;
  nom: string;
  telephone: string;
  adresse: string;
  poste: string;
  salaireBase: number;
  dateEmbauche: string | null;
  actif: boolean;
  isActive: boolean;
  username: string;
  email: string;
  role: UserRole;
  isProtectedAccount: boolean;
  requiresEmail2fa: boolean;
  mustSetupPassword: boolean;
  canViewStock: boolean;
  canAddStock: boolean;
  canRemoveStock: boolean;
  canAdjustStock: boolean;
  canManageStock: boolean;
  canManageEmployees: boolean;
  canManageInvoices: boolean;
  canManageQuotes: boolean;
  canManageClients: boolean;
  canManageEstimations: boolean;
  canManageArchives: boolean;
  canManageInventory: boolean;
  canViewHistory: boolean;
  canManageSalary: boolean;
  canManageAll: boolean;
  lastLoginAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface EmployeeUpsertInput {
  nom: string;
  telephone?: string;
  adresse?: string;
  poste?: string;
  salaireBase?: number;
  dateEmbauche?: string | null;
  actif?: boolean;
  isActive?: boolean;
  username?: string;
  email?: string;
  initialPassword?: string;
  role?: UserRole;
  isProtectedAccount?: boolean;
  requiresEmail2fa?: boolean;
  mustSetupPassword?: boolean;
  canViewStock?: boolean;
  canAddStock?: boolean;
  canRemoveStock?: boolean;
  canAdjustStock?: boolean;
  canManageStock?: boolean;
  canManageEmployees?: boolean;
  canManageInvoices?: boolean;
  canManageQuotes?: boolean;
  canManageClients?: boolean;
  canManageEstimations?: boolean;
  canManageArchives?: boolean;
  canManageInventory?: boolean;
  canViewHistory?: boolean;
  canManageSalary?: boolean;
  canManageAll?: boolean;
}

export interface SalaryAdvance {
  id: string;
  employeeId: string;
  montant: number;
  note: string;
  dateAvance: string;
  moisReference: number;
  anneeReference: number;
  createdAt: string;
}

export interface SalaryBonus {
  id: string;
  employeeId: string;
  montant: number;
  motif: string;
  datePrime: string;
  moisReference: number;
  anneeReference: number;
  createdAt: string;
}

export interface SalaryOvertime {
  id: string;
  employeeId: string;
  heuresSupplementaires: number;
  tauxHoraire: number;
  montant: number;
  motif: string;
  dateHeuresSup: string;
  moisReference: number;
  anneeReference: number;
  createdAt: string;
}

export interface SalaryAdvanceInput {
  employeeId: string;
  montant: number;
  note?: string;
  dateAvance?: string;
  moisReference?: number;
  anneeReference?: number;
}

export interface SalaryBonusInput {
  employeeId: string;
  montant: number;
  motif?: string;
  datePrime?: string;
  moisReference?: number;
  anneeReference?: number;
}

export interface SalaryOvertimeInput {
  employeeId: string;
  heuresSupplementaires: number;
  motif?: string;
  dateHeuresSup?: string;
  moisReference?: number;
  anneeReference?: number;
}

export interface SalarySummary {
  employeeId: string;
  nom: string;
  moisReference: number;
  anneeReference: number;
  salaireBase: number;
  totalAdvances: number;
  totalBonuses: number;
  heuresNormalesMois: number;
  joursSemaine: number;
  samedis: number;
  dimanches: number;
  tauxHoraire: number;
  totalOvertimeHours: number;
  totalOvertimeAmount: number;
  resteAPayer: number;
}
