import type { Client } from '../models/client';
import type { Invoice } from '../models/invoice';
import type { Quote } from '../models/quote';
import type { StockColor, StockItem } from '../models/stock-item';
import type { StockMovement } from '../models/stock-movement';

export interface SpaProductRow {
  id: string;
  reference: string;
  label: string;
  description?: string;
  category: string;
  serie: string;
  unit: string;
  image_url?: string;
  low_stock_threshold?: number;
  last_updated?: string;
  price_ttc?: number | null;
  archived_at?: string | null;
  colors?: string[];
}

export interface SpaProductMetadata {
  categories: string[];
  series: string[];
  colors: string[];
}

export interface SpaProductMetadataAddResult {
  ok: boolean;
  kind?: 'category' | 'serie' | 'color';
  value?: string;
  alreadyExists?: boolean;
  message?: string;
}

export interface SpaProductInput {
  id: string;
  reference?: string;
  label?: string;
  description?: string;
  category?: string;
  serie?: string;
  unit?: string;
  image_url?: string;
  low_stock_threshold?: number;
  last_updated?: string;
  price_ttc?: number | null;
}

export interface SpaStockRow {
  product_id: string;
  color: string;
  qty: number;
}

export interface SpaInventoryProduct {
  id: string;
  reference: string;
  label: string;
  category: string;
  serie: string;
  unit: string;
  imageUrl?: string;
  lowStockThreshold?: number;
  lastUpdated?: string;
  priceTtc?: number | null;
}

export interface SpaInventoryItem {
  product: SpaInventoryProduct;
  qtyBlanc: number;
  qtyGris: number;
  qtyNoir: number;
  qtyTotal: number;
  quantityByColor?: Record<StockColor, number>;
  unitPrice: number;
  priceByColor?: Record<StockColor, number>;
  valueByColor?: Record<StockColor, number>;
  totalValue: number;
  priceStatus: 'ok' | 'missing';
}

export interface SpaInventoryResponse {
  items: SpaInventoryItem[];
  totalValue: number;
}

export interface SpaPriceHistoryEntry {
  id: string;
  productId: string;
  color: StockColor;
  oldPrice: number;
  newPrice: number;
  changedAt: string;
  changedBy: string;
}

export interface SpaProductCreatePayload {
  reference: string;
  label: string;
  description?: string;
  category: string;
  serie: string;
  unit: string;
  colors: StockColor[];
  imageRef?: string | null;
  lowStockThreshold?: number;
  priceTtc?: number | null;
}

export interface SpaProductCreateResult {
  ok: boolean;
  id?: string;
  message?: string;
}

export interface SpaProductArchiveResult {
  ok: boolean;
  id?: string;
  alreadyArchived?: boolean;
  message?: string;
}

export interface SpaProductRestoreResult {
  ok: boolean;
  id?: string;
  alreadyActive?: boolean;
  message?: string;
}

export interface SpaProductPurgeResult {
  ok: boolean;
  id?: string;
  message?: string;
}

export interface SpaProductUpdateResult {
  ok: boolean;
  id?: string;
  addedColors?: string[];
  removedColors?: string[];
  message?: string;
}

export interface SpaQuoteConvertResult {
  ok: boolean;
  alreadyConverted?: boolean;
  invoiceId?: string;
  invoiceNumero?: string | null;
  message?: string;
}

export interface SpaProductImageSelectionResult {
  canceled: boolean;
  imageRef?: string;
  imageUrl?: string;
  fileName?: string;
  error?: string;
  message?: string;
}

export interface SpaPrintResult {
  ok: boolean;
  canceled?: boolean;
  message?: string;
}

export interface SpaDocumentRequest {
  docType: 'invoice' | 'quote';
  documentNumber?: string;
  html?: string;
  title?: string;
}

export interface SpaDocumentPdfResult {
  canceled: boolean;
  filePath?: string;
  message?: string;
}

export interface SpaDbBackupEntry {
  fileName: string;
  filePath: string;
  size: number;
  createdAt: string;
}

export interface SpaDbBackupResult {
  ok: boolean;
  fileName?: string;
  filePath?: string;
  size?: number;
  createdAt?: string;
  message?: string;
}

export type SpaUpdateStatusType =
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'error'
  | 'none';

export interface SpaUpdateStatusPayload {
  status: SpaUpdateStatusType;
  message?: string;
  version?: string;
  percent?: number;
  transferred?: number;
  total?: number;
  bytesPerSecond?: number;
}

export type AppRole = 'developer' | 'owner' | 'admin' | 'employee';

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
  manageAll: boolean;
}

export interface AppUser {
  id: string;
  nom: string;
  username: string;
  email: string | null;
  role: AppRole;
  isActive: boolean;
  isProtectedAccount: boolean;
  requiresEmail2fa: boolean;
  mustSetupPassword: boolean;
  permissions: PermissionSet;
}

export interface AuthFlowContext {
  ip?: string | null;
  userAgent?: string | null;
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

export interface EmployeeRecord {
  id: string;
  nom: string;
  telephone: string;
  adresse: string;
  poste: string;
  salaireBase: number;
  dateEmbauche: string | null;
  actif: boolean;
  username: string;
  email: string;
  role: AppRole;
  isActive: boolean;
  isProtectedAccount: boolean;
  requiresEmail2fa: boolean;
  mustSetupPassword: boolean;
  canViewStock: boolean;
  canAddStock: boolean;
  canRemoveStock: boolean;
  canAdjustStock: boolean;
  canManageStock: boolean;
  canEditStockProduct: boolean;
  canArchiveStockProduct: boolean;
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
  id?: string;
  nom: string;
  telephone?: string;
  adresse?: string;
  poste?: string;
  salaireBase?: number;
  dateEmbauche?: string | null;
  actif?: boolean;
  username?: string;
  email?: string;
  initialPassword?: string;
  role?: AppRole;
  isProtectedAccount?: boolean;
  requiresEmail2fa?: boolean;
  mustSetupPassword?: boolean;
  isActive?: boolean;
  canViewStock?: boolean;
  canAddStock?: boolean;
  canRemoveStock?: boolean;
  canAdjustStock?: boolean;
  canManageStock?: boolean;
  canEditStockProduct?: boolean;
  canArchiveStockProduct?: boolean;
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

export interface SalaryAdvanceRecord {
  id: string;
  employeeId: string;
  montant: number;
  note: string;
  dateAvance: string;
  moisReference: number;
  anneeReference: number;
  createdAt: string;
}

export interface SalaryBonusRecord {
  id: string;
  employeeId: string;
  montant: number;
  motif: string;
  datePrime: string;
  moisReference: number;
  anneeReference: number;
  createdAt: string;
}

export interface SalaryOvertimeRecord {
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

export interface SpaApi {
  exportPdf: () => Promise<SpaDocumentPdfResult>;
  documents: {
    print: (options: SpaDocumentRequest) => Promise<SpaPrintResult>;
    exportPdf: (options: SpaDocumentRequest) => Promise<SpaDocumentPdfResult>;
  };
  updates: {
    check: () => Promise<boolean>;
    install: () => Promise<boolean>;
    getStatus: () => Promise<SpaUpdateStatusPayload>;
    onStatus: (listener: (payload: SpaUpdateStatusPayload) => void) => () => void;
  };
  auth: {
    login: (username: string, password: string) => Promise<AppUser | null>;
    beginLogin: (identity: string, password: string, context?: AuthFlowContext | null) => Promise<AuthBeginLoginResult>;
    setupProtectedPassword: (email: string, newPassword: string, context?: AuthFlowContext | null) => Promise<AuthPasswordActionResult>;
    logout: () => Promise<boolean>;
    getCurrentUser: () => Promise<AppUser | null>;
    hasPermission: (permissionKey: keyof PermissionSet) => Promise<boolean>;
    resetPassword: (employeeId: string, newPassword: string) => Promise<boolean>;
  };
  employees: {
    list: () => Promise<EmployeeRecord[]>;
    search: (query: string) => Promise<EmployeeRecord[]>;
    getById: (id: string) => Promise<EmployeeRecord | null>;
    create: (payload: EmployeeUpsertInput) => Promise<EmployeeRecord | null>;
    update: (id: string, payload: EmployeeUpsertInput) => Promise<EmployeeRecord | null>;
    delete: (id: string) => Promise<boolean>;
    setActive: (id: string, actif: boolean) => Promise<boolean>;
  };
  salary: {
    advances: {
      list: (employeeId: string, month: number, year: number) => Promise<SalaryAdvanceRecord[]>;
      create: (payload: SalaryAdvanceInput) => Promise<SalaryAdvanceRecord | null>;
      delete: (id: string) => Promise<boolean>;
      total: (employeeId: string, month: number, year: number) => Promise<number>;
    };
    bonuses: {
      list: (employeeId: string, month: number, year: number) => Promise<SalaryBonusRecord[]>;
      create: (payload: SalaryBonusInput) => Promise<SalaryBonusRecord | null>;
      delete: (id: string) => Promise<boolean>;
      total: (employeeId: string, month: number, year: number) => Promise<number>;
    };
    overtimes: {
      list: (employeeId: string, month: number, year: number) => Promise<SalaryOvertimeRecord[]>;
      create: (payload: SalaryOvertimeInput) => Promise<SalaryOvertimeRecord | null>;
      delete: (id: string) => Promise<boolean>;
      totalHours: (employeeId: string, month: number, year: number) => Promise<number>;
    };
    summary: (employeeId: string, month: number, year: number) => Promise<SalarySummary | null>;
  };
  clients: {
    list: () => Promise<Client[]>;
    getById: (id: string) => Promise<Client | null>;
    search: (query: string) => Promise<Client[]>;
    upsert: (client: Client) => Promise<Client | null>;
    delete: (id: string) => Promise<boolean>;
    findOrCreate: (client: Client, preferredId?: string | null) => Promise<Client | null>;
  };
  invoices: {
    getAll: () => Promise<Invoice[]>;
    getById: (id: string) => Promise<Invoice | null>;
    put: (invoice: Invoice) => Promise<boolean>;
    delete: (id: string) => Promise<boolean>;
  };
  quotes: {
    getAll: () => Promise<Quote[]>;
    getById: (id: string) => Promise<Quote | null>;
    put: (quote: Quote) => Promise<boolean>;
    delete: (id: string) => Promise<boolean>;
    convertToInvoice: (id: string) => Promise<SpaQuoteConvertResult>;
  };
  products: {
    list: () => Promise<SpaProductRow[]>;
    listArchived: () => Promise<SpaProductRow[]>;
    metadata: () => Promise<SpaProductMetadata>;
    addMetadata: (kind: 'category' | 'serie' | 'color', value: string) => Promise<SpaProductMetadataAddResult>;
    create: (payload: SpaProductCreatePayload) => Promise<SpaProductCreateResult>;
    update: (id: string, payload: SpaProductCreatePayload) => Promise<SpaProductUpdateResult>;
    selectImage: () => Promise<SpaProductImageSelectionResult>;
    upsert: (product: SpaProductInput) => Promise<boolean>;
    delete: (id: string) => Promise<boolean>;
    archive: (id: string) => Promise<SpaProductArchiveResult>;
    restore: (id: string) => Promise<SpaProductRestoreResult>;
    purge: (id: string) => Promise<SpaProductPurgeResult>;
    updatePrice: (productId: string, color: StockColor, newPrice: number, changedBy?: string) => Promise<boolean>;
    priceHistory: (productId: string, color: StockColor) => Promise<SpaPriceHistoryEntry[]>;
    restorePrice: (productId: string, color: StockColor, targetPrice: number, changedBy?: string) => Promise<boolean>;
  };
  stock: {
    getAll: () => Promise<SpaStockRow[]>;
    getItems: () => Promise<StockItem[]>;
    applyMovement: (movement: StockMovement) => Promise<boolean>;
    setQty: (productId: string, color: string, qty: number) => Promise<boolean>;
    increment: (productId: string, color: string, delta: number) => Promise<boolean>;
    decrement: (productId: string, color: string, delta: number) => Promise<boolean>;
  };
  movements: {
    list: () => Promise<StockMovement[]>;
    add: (movement: StockMovement) => Promise<boolean>;
  };
  inventory: {
    get: () => Promise<SpaInventoryResponse>;
  };
  db: {
    backup: () => Promise<SpaDbBackupResult>;
    listBackups: () => Promise<SpaDbBackupEntry[]>;
    restore: (backupFileName: string) => Promise<boolean>;
  };
}

export {};

declare global {
  interface Window {
    spa?: SpaApi;
  }
}
