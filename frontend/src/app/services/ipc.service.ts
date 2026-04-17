import { Injectable, NgZone, inject } from '@angular/core';
import { Client } from '../models/client';
import { Invoice } from '../models/invoice';
import { Quote } from '../models/quote';
import { StockColor } from '../models/stock-item';
import { StockItem } from '../models/stock-item';
import { StockMovement } from '../models/stock-movement';
import { MyTaskUpdateInput, TaskNotificationRecord, TaskRecord, TaskUpsertInput } from '../models/task.models';
import { getAppApi } from '../bridge/app-api-bridge';
import type {
  AuthBeginLoginResult,
  AuthPasswordActionResult,
  AppUser,
  EmployeeRecord,
  EmployeeUpsertInput,
  PermissionSet,
  SalaryAdvanceInput,
  SalaryAdvanceRecord,
  SalaryBonusInput,
  SalaryBonusRecord,
  SalaryOvertimeInput,
  SalaryOvertimeRecord,
  SalarySummary,
  SpaApi,
  SpaDbBackupEntry,
  SpaDbBackupResult,
  SpaInventoryResponse,
  SpaProductArchiveResult,
  SpaProductMetadataAddResult,
  SpaProductMetadata,
  SpaProductPurgeResult,
  SpaProductRestoreResult,
  SpaProductUpdateResult,
  SpaDocumentRequest,
  SpaDocumentPdfResult,
  SpaPrintResult,
  SpaPriceHistoryEntry,
  SpaProductCreatePayload,
  SpaProductCreateResult,
  SpaProductImageSelectionResult,
  SpaProductInput,
  SpaQuoteConvertResult,
  SpaProductRow,
  SpaStockRow,
  SpaUpdateStatusPayload,
  DashboardKpis,
  CaMensuelEntry
} from '../types/app-api.types';

@Injectable({
  providedIn: 'root'
})
export class IpcService {
  private readonly zone = inject(NgZone);
  private readonly apiReadyTimeoutMs = 5000;
  private readonly callTimeoutMs = 8000;

  private get spa(): SpaApi | null {
    return getAppApi();
  }

  get isAvailable(): boolean {
    return !!this.spa;
  }

  private runInAngularZone<T>(fn: () => T): T {
    if (NgZone.isInAngularZone()) {
      return fn();
    }
    return this.zone.run(fn);
  }

  private async waitForApi(timeout = this.apiReadyTimeoutMs): Promise<SpaApi | null> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const api = getAppApi();
      if (api) return api;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return null;
  }

  private async withTimeout<T>(promise: Promise<T>, label: string, timeoutMs = this.callTimeoutMs): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`[IpcService] Timeout on ${label}`)), timeoutMs);
      });
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  private async invoke<T>(
    label: string,
    fallback: T,
    operation: (api: SpaApi) => Promise<T>
  ): Promise<T> {
    const api = await this.waitForApi();
    if (!api) {
      return this.runInAngularZone(() => fallback);
    }

    try {
      const result = await this.withTimeout(operation(api), label);
      return this.runInAngularZone(() => result);
    } catch {
      return this.runInAngularZone(() => fallback);
    }
  }

  private async invokeOrThrow<T>(
    label: string,
    operation: (api: SpaApi) => Promise<T>
  ): Promise<T> {
    const api = await this.waitForApi();
    if (!api) {
      throw new Error(`${label.toUpperCase().replace(/[^\w]+/g, '_')}_API_UNAVAILABLE`);
    }

    const result = await this.withTimeout(operation(api), label);
    return this.runInAngularZone(() => result);
  }

  async invoicesGetAll(): Promise<Invoice[]> {
    return this.invoke('invoices.getAll', [], (api) => api.invoices.getAll());
  }

  async clientsList(): Promise<Client[]> {
    return this.invoke('clients.list', [], (api) => api.clients.list());
  }

  async clientsGetById(id: string): Promise<Client | null> {
    return this.invoke('clients.getById', null, (api) => api.clients.getById(id));
  }

  async clientsSearch(query: string): Promise<Client[]> {
    return this.invoke('clients.search', [], (api) => api.clients.search(query));
  }

  async clientsUpsert(client: Client): Promise<Client | null> {
    return this.invoke('clients.upsert', null, (api) => api.clients.upsert(client));
  }

  async clientsDelete(id: string): Promise<boolean> {
    return this.invoke('clients.delete', false, (api) => api.clients.delete(id));
  }

  async clientsFindOrCreate(client: Client, preferredId?: string | null): Promise<Client | null> {
    return this.invoke('clients.findOrCreate', null, (api) => api.clients.findOrCreate(client, preferredId ?? null));
  }

  async invoicesGetById(id: string): Promise<Invoice | null> {
    return this.invoke('invoices.getById', null, (api) => api.invoices.getById(id));
  }

  async invoicesPut(invoice: Invoice): Promise<boolean> {
    return this.invoke('invoices.put', false, (api) => api.invoices.put(invoice));
  }

  async invoicesDelete(id: string): Promise<boolean> {
    return this.invoke('invoices.delete', false, (api) => api.invoices.delete(id));
  }

  async quotesGetAll(): Promise<Quote[]> {
    return this.invoke('quotes.getAll', [], (api) => api.quotes.getAll());
  }

  async quotesGetById(id: string): Promise<Quote | null> {
    return this.invoke('quotes.getById', null, (api) => api.quotes.getById(id));
  }

  async quotesPut(quote: Quote): Promise<boolean> {
    return this.invoke('quotes.put', false, (api) => api.quotes.put(quote));
  }

  async quotesDelete(id: string): Promise<boolean> {
    return this.invoke('quotes.delete', false, (api) => api.quotes.delete(id));
  }

  async quotesConvertToInvoice(id: string): Promise<SpaQuoteConvertResult> {
    return this.invoke('quotes.convertToInvoice', { ok: false, message: 'QUOTE_CONVERT_FAILED' }, (api) => api.quotes.convertToInvoice(id));
  }

  async productsList(): Promise<SpaProductRow[]> {
    return this.invoke('products.list', [], (api) => api.products.list());
  }

  async productsListArchived(): Promise<SpaProductRow[]> {
    return this.invoke('products.listArchived', [], (api) => api.products.listArchived());
  }

  async productsMetadata(): Promise<SpaProductMetadata> {
    return this.invoke('products.metadata', { categories: [], series: [], colors: ['blanc', 'gris', 'noir'] }, (api) => api.products.metadata());
  }

  async productsAddMetadata(kind: 'category' | 'serie' | 'color', value: string): Promise<SpaProductMetadataAddResult> {
    return this.invoke(
      'products.addMetadata',
      { ok: false, message: 'PRODUCT_METADATA_ADD_FAILED' },
      (api) => api.products.addMetadata(kind, value)
    );
  }

  async productsCreate(payload: SpaProductCreatePayload): Promise<SpaProductCreateResult> {
    return this.invoke('products.create', { ok: false, message: 'PRODUCT_CREATE_FAILED' }, (api) => api.products.create(payload));
  }

  async productsUpdate(id: string, payload: SpaProductCreatePayload): Promise<SpaProductUpdateResult> {
    return this.invoke('products.update', { ok: false, message: 'PRODUCT_UPDATE_FAILED' }, (api) => api.products.update(id, payload));
  }

  async productsSelectImage(): Promise<SpaProductImageSelectionResult> {
    return this.invoke('products.selectImage', { canceled: true }, (api) => api.products.selectImage());
  }

  async productsUpsert(product: SpaProductInput): Promise<boolean> {
    return this.invoke('products.upsert', false, (api) => api.products.upsert(product));
  }

  async productsDelete(id: string): Promise<boolean> {
    return this.invoke('products.delete', false, (api) => api.products.delete(id));
  }

  async productsArchive(id: string): Promise<SpaProductArchiveResult> {
    return this.invoke('products.archive', { ok: false, message: 'PRODUCT_ARCHIVE_FAILED' }, (api) => api.products.archive(id));
  }

  async productsRestore(id: string): Promise<SpaProductRestoreResult> {
    return this.invoke('products.restore', { ok: false, message: 'PRODUCT_RESTORE_FAILED' }, (api) => api.products.restore(id));
  }

  async productsPurge(id: string): Promise<SpaProductPurgeResult> {
    return this.invoke('products.purge', { ok: false, message: 'PRODUCT_PURGE_FAILED' }, (api) => api.products.purge(id));
  }

  async productsUpdatePrice(
    productId: string,
    color: StockColor,
    newPrice: number,
    changedBy = 'erp-user'
  ): Promise<boolean> {
    return this.invoke('products.updatePrice', false, (api) => api.products.updatePrice(productId, color, newPrice, changedBy));
  }

  async productsPriceHistory(productId: string, color: StockColor): Promise<SpaPriceHistoryEntry[]> {
    return this.invoke('products.priceHistory', [] as SpaPriceHistoryEntry[], (api) => api.products.priceHistory(productId, color));
  }

  async productsRestorePrice(
    productId: string,
    color: StockColor,
    targetPrice: number,
    changedBy = 'erp-user'
  ): Promise<boolean> {
    return this.invoke('products.restorePrice', false, (api) => api.products.restorePrice(productId, color, targetPrice, changedBy));
  }

  async stockGetAll(): Promise<SpaStockRow[]> {
    return this.invoke('stock.getAll', [], (api) => api.stock.getAll());
  }

  async stockGetItems(): Promise<StockItem[]> {
    return this.invoke('stock.getItems', [], (api) => api.stock.getItems());
  }

  async stockApplyMovement(movement: StockMovement): Promise<boolean> {
    return this.invokeOrThrow('stock.applyMovement', (api) => api.stock.applyMovement(movement));
  }

  async stockSetQty(productId: string, color: string, qty: number): Promise<boolean> {
    return this.invokeOrThrow('stock.setQty', (api) => api.stock.setQty(productId, color, qty));
  }

  async stockIncrement(productId: string, color: string, delta: number): Promise<boolean> {
    return this.invokeOrThrow('stock.increment', (api) => api.stock.increment(productId, color, delta));
  }

  async stockDecrement(productId: string, color: string, delta: number): Promise<boolean> {
    return this.invokeOrThrow('stock.decrement', (api) => api.stock.decrement(productId, color, delta));
  }

  async movementsList(): Promise<StockMovement[]> {
    return this.invoke('movements.list', [], (api) => api.movements.list());
  }

  async movementsAdd(movement: StockMovement): Promise<boolean> {
    return this.invoke('movements.add', false, (api) => api.movements.add(movement));
  }

  async inventoryGet(): Promise<SpaInventoryResponse | null> {
    return this.invoke('inventory.get', null, (api) => api.inventory.get());
  }

  async dbBackup(): Promise<SpaDbBackupResult | null> {
    return this.invoke('db.backup', null, (api) => api.db.backup());
  }

  async dbListBackups(): Promise<SpaDbBackupEntry[]> {
    return this.invoke('db.listBackups', [] as SpaDbBackupEntry[], (api) => api.db.listBackups());
  }

  async dbRestore(backupFileName: string): Promise<boolean> {
    return this.invoke('db.restore', false, (api) => api.db.restore(backupFileName));
  }

  async updatesCheck(): Promise<boolean> {
    return this.invoke('updates.check', false, (api) => api.updates.check());
  }

  async updatesInstall(): Promise<boolean> {
    return this.invoke('updates.install', false, (api) => api.updates.install());
  }

  async documentsPrint(options: SpaDocumentRequest): Promise<SpaPrintResult> {
    return this.invoke('documents.print', { ok: false, message: 'PRINT_FAILED' }, (api) => api.documents.print(options));
  }

  async documentsExportPdf(options: SpaDocumentRequest): Promise<SpaDocumentPdfResult> {
    return this.invoke('documents.exportPdf', { canceled: true, message: 'PDF_EXPORT_FAILED' }, (api) => api.documents.exportPdf(options));
  }

  async updatesGetStatus(): Promise<SpaUpdateStatusPayload | null> {
    return this.invoke('updates.getStatus', null, (api) => api.updates.getStatus());
  }

  updatesOnStatus(listener: (payload: SpaUpdateStatusPayload) => void): () => void {
    const api = this.spa;
    if (!api) {
      return () => {};
    }

    try {
      return api.updates.onStatus((payload) => {
        this.runInAngularZone(() => listener(payload));
      });
    } catch {
      return () => {};
    }
  }

  async authLogin(username: string, password: string): Promise<AppUser | null> {
    return this.invoke('auth.login', null, (api) => api.auth.login(username, password));
  }

  async authBeginLogin(identity: string, password: string, context?: { ip?: string | null; userAgent?: string | null }): Promise<AuthBeginLoginResult> {
    const api = await this.waitForApi();
    if (!api) {
      return this.runInAngularZone(() => ({ status: 'operation_failed', message: 'AUTH_API_UNAVAILABLE' }));
    }

    try {
      const result = await this.withTimeout(
        api.auth.beginLogin(identity, password, context ?? null),
        'auth.beginLogin'
      );
      return this.runInAngularZone(() => result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AUTH_BEGIN_LOGIN_FAILED';
      return this.runInAngularZone(() => ({ status: 'operation_failed', message }));
    }
  }

  async authSetupProtectedPassword(
    email: string,
    newPassword: string,
    context?: { ip?: string | null; userAgent?: string | null }
  ): Promise<AuthPasswordActionResult> {
    return this.invoke('auth.setupProtectedPassword', { ok: false, status: 'operation_failed' }, (api) => api.auth.setupProtectedPassword(email, newPassword, context ?? null));
  }

  async authLogout(): Promise<boolean> {
    return this.invoke('auth.logout', false, (api) => api.auth.logout());
  }

  async authGetCurrentUser(): Promise<AppUser | null> {
    return this.invoke('auth.getCurrentUser', null, (api) => api.auth.getCurrentUser());
  }

  async authHasPermission(permissionKey: keyof PermissionSet): Promise<boolean> {
    return this.invoke('auth.hasPermission', false, (api) => api.auth.hasPermission(permissionKey));
  }

  async authResetPassword(employeeId: string, newPassword: string): Promise<boolean> {
    return this.invoke('auth.resetPassword', false, (api) => api.auth.resetPassword(employeeId, newPassword));
  }

  async employeesList(): Promise<EmployeeRecord[]> {
    return this.invoke('employees.list', [], (api) => api.employees.list());
  }

  async employeesSearch(query: string): Promise<EmployeeRecord[]> {
    return this.invoke('employees.search', [], (api) => api.employees.search(query));
  }

  async employeesGetById(id: string): Promise<EmployeeRecord | null> {
    return this.invoke('employees.getById', null, (api) => api.employees.getById(id));
  }

  async employeesCreate(payload: EmployeeUpsertInput): Promise<EmployeeRecord | null> {
    return this.invoke('employees.create', null, (api) => api.employees.create(payload));
  }

  async employeesUpdate(id: string, payload: EmployeeUpsertInput): Promise<EmployeeRecord | null> {
    return this.invoke('employees.update', null, (api) => api.employees.update(id, payload));
  }

  async employeesDelete(id: string): Promise<boolean> {
    return this.invoke('employees.delete', false, (api) => api.employees.delete(id));
  }

  async employeesSetActive(id: string, actif: boolean): Promise<boolean> {
    return this.invoke('employees.setActive', false, (api) => api.employees.setActive(id, actif));
  }

  async tasksList(filters: { employeeId?: string; status?: string; priority?: string } = {}): Promise<TaskRecord[]> {
    return this.invoke('tasks.list', [], (api) => api.tasks.list(filters));
  }

  async tasksGetById(id: string): Promise<TaskRecord | null> {
    return this.invoke('tasks.getById', null, (api) => api.tasks.getById(id));
  }

  async tasksCreate(payload: TaskUpsertInput): Promise<TaskRecord | null> {
    return this.invokeOrThrow('tasks.create', (api) => api.tasks.create(payload));
  }

  async tasksUpdate(id: string, payload: TaskUpsertInput): Promise<TaskRecord | null> {
    return this.invokeOrThrow('tasks.update', (api) => api.tasks.update(id, payload));
  }

  async tasksDelete(id: string): Promise<boolean> {
    return this.invoke('tasks.delete', false, (api) => api.tasks.delete(id));
  }

  async myTasksList(filters: { status?: string; priority?: string } = {}): Promise<TaskRecord[]> {
    return this.invoke('myTasks.list', [], (api) => api.myTasks.list(filters));
  }

  async myTasksGetById(id: string): Promise<TaskRecord | null> {
    return this.invoke('myTasks.getById', null, (api) => api.myTasks.getById(id));
  }

  async myTasksUpdate(id: string, payload: MyTaskUpdateInput): Promise<TaskRecord | null> {
    return this.invokeOrThrow('myTasks.update', (api) => api.myTasks.update(id, payload));
  }

  async taskNotificationsList(limit = 20): Promise<TaskNotificationRecord[]> {
    return this.invoke('taskNotifications.list', [], (api) => api.taskNotifications.list(limit));
  }

  async taskNotificationsMarkRead(id: string): Promise<TaskNotificationRecord | null> {
    return this.invoke('taskNotifications.markRead', null, (api) => api.taskNotifications.markRead(id));
  }

  async taskNotificationsMarkAllRead(): Promise<number> {
    return this.invoke('taskNotifications.markAllRead', 0, (api) => api.taskNotifications.markAllRead());
  }

  taskNotificationsOnMessage(listener: (notification: TaskNotificationRecord) => void): () => void {
    const api = this.spa;
    if (!api?.taskNotifications?.onMessage) {
      return () => {};
    }

    try {
      return api.taskNotifications.onMessage((notification) => {
        this.runInAngularZone(() => listener(notification));
      });
    } catch {
      return () => {};
    }
  }

  async salaryAdvancesList(employeeId: string, month: number, year: number): Promise<SalaryAdvanceRecord[]> {
    return this.invoke('salary.advances.list', [], (api) => api.salary.advances.list(employeeId, month, year));
  }

  async salaryAdvancesCreate(payload: SalaryAdvanceInput): Promise<SalaryAdvanceRecord | null> {
    return this.invoke('salary.advances.create', null, (api) => api.salary.advances.create(payload));
  }

  async salaryAdvancesDelete(id: string): Promise<boolean> {
    return this.invoke('salary.advances.delete', false, (api) => api.salary.advances.delete(id));
  }

  async salaryAdvancesTotal(employeeId: string, month: number, year: number): Promise<number> {
    return this.invoke('salary.advances.total', 0, (api) => api.salary.advances.total(employeeId, month, year));
  }

  async salaryBonusesList(employeeId: string, month: number, year: number): Promise<SalaryBonusRecord[]> {
    return this.invoke('salary.bonuses.list', [], (api) => api.salary.bonuses.list(employeeId, month, year));
  }

  async salaryBonusesCreate(payload: SalaryBonusInput): Promise<SalaryBonusRecord | null> {
    return this.invoke('salary.bonuses.create', null, (api) => api.salary.bonuses.create(payload));
  }

  async salaryBonusesDelete(id: string): Promise<boolean> {
    return this.invoke('salary.bonuses.delete', false, (api) => api.salary.bonuses.delete(id));
  }

  async salaryBonusesTotal(employeeId: string, month: number, year: number): Promise<number> {
    return this.invoke('salary.bonuses.total', 0, (api) => api.salary.bonuses.total(employeeId, month, year));
  }

  async salaryOvertimesList(employeeId: string, month: number, year: number): Promise<SalaryOvertimeRecord[]> {
    return this.invoke('salary.overtimes.list', [], (api) => api.salary.overtimes.list(employeeId, month, year));
  }

  async salaryOvertimesCreate(payload: SalaryOvertimeInput): Promise<SalaryOvertimeRecord | null> {
    return this.invoke('salary.overtimes.create', null, (api) => api.salary.overtimes.create(payload));
  }

  async salaryOvertimesDelete(id: string): Promise<boolean> {
    return this.invoke('salary.overtimes.delete', false, (api) => api.salary.overtimes.delete(id));
  }

  async salaryOvertimesTotalHours(employeeId: string, month: number, year: number): Promise<number> {
    return this.invoke('salary.overtimes.totalHours', 0, (api) => api.salary.overtimes.totalHours(employeeId, month, year));
  }

  async salarySummary(employeeId: string, month: number, year: number): Promise<SalarySummary | null> {
    return this.invoke('salary.summary', null, (api) => api.salary.summary(employeeId, month, year));
  }

  async getDashboardKpis(): Promise<DashboardKpis> {
    return this.invoke('dashboard.getKpis', {}, (api) => api.dashboard.getKpis());
  }

  async getCaMensuel(): Promise<CaMensuelEntry[]> {
    return this.invoke('dashboard.getCaMensuel', [], (api) => api.dashboard.getCaMensuel());
  }
}
