import { Injectable } from '@angular/core';
import { getSpaApi } from '../bridge/spa-bridge';
import * as i0 from "@angular/core";
export class IpcService {
    constructor() {
        this.apiReadyTimeoutMs = 5000;
        this.callTimeoutMs = 8000;
    }
    get spa() {
        return getSpaApi();
    }
    get isAvailable() {
        return !!this.spa;
    }
    async waitForApi(timeout = this.apiReadyTimeoutMs) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const api = getSpaApi();
            if (api)
                return api;
            await new Promise((resolve) => setTimeout(resolve, 50));
        }
        return null;
    }
    async withTimeout(promise, label, timeoutMs = this.callTimeoutMs) {
        let timer;
        try {
            const timeoutPromise = new Promise((_, reject) => {
                timer = setTimeout(() => reject(new Error(`[IpcService] Timeout on ${label}`)), timeoutMs);
            });
            return await Promise.race([promise, timeoutPromise]);
        }
        finally {
            if (timer) {
                clearTimeout(timer);
            }
        }
    }
    async invoke(label, fallback, operation) {
        const api = await this.waitForApi();
        if (!api)
            return fallback;
        try {
            return await this.withTimeout(operation(api), label);
        }
        catch {
            return fallback;
        }
    }
    async invoicesGetAll() {
        return this.invoke('invoices.getAll', [], (api) => api.invoices.getAll());
    }
    async clientsList() {
        return this.invoke('clients.list', [], (api) => api.clients.list());
    }
    async clientsGetById(id) {
        return this.invoke('clients.getById', null, (api) => api.clients.getById(id));
    }
    async clientsSearch(query) {
        return this.invoke('clients.search', [], (api) => api.clients.search(query));
    }
    async clientsUpsert(client) {
        return this.invoke('clients.upsert', null, (api) => api.clients.upsert(client));
    }
    async clientsDelete(id) {
        return this.invoke('clients.delete', false, (api) => api.clients.delete(id));
    }
    async clientsFindOrCreate(client, preferredId) {
        return this.invoke('clients.findOrCreate', null, (api) => api.clients.findOrCreate(client, preferredId ?? null));
    }
    async invoicesGetById(id) {
        return this.invoke('invoices.getById', null, (api) => api.invoices.getById(id));
    }
    async invoicesPut(invoice) {
        return this.invoke('invoices.put', false, (api) => api.invoices.put(invoice));
    }
    async invoicesDelete(id) {
        return this.invoke('invoices.delete', false, (api) => api.invoices.delete(id));
    }
    async quotesGetAll() {
        return this.invoke('quotes.getAll', [], (api) => api.quotes.getAll());
    }
    async quotesGetById(id) {
        return this.invoke('quotes.getById', null, (api) => api.quotes.getById(id));
    }
    async quotesPut(quote) {
        return this.invoke('quotes.put', false, (api) => api.quotes.put(quote));
    }
    async quotesDelete(id) {
        return this.invoke('quotes.delete', false, (api) => api.quotes.delete(id));
    }
    async productsList() {
        return this.invoke('products.list', [], (api) => api.products.list());
    }
    async productsCreate(payload) {
        return this.invoke('products.create', { ok: false, message: 'PRODUCT_CREATE_FAILED' }, (api) => api.products.create(payload));
    }
    async productsSelectImage() {
        return this.invoke('products.selectImage', { canceled: true }, (api) => api.products.selectImage());
    }
    async productsUpsert(product) {
        return this.invoke('products.upsert', false, (api) => api.products.upsert(product));
    }
    async productsDelete(id) {
        return this.invoke('products.delete', false, (api) => api.products.delete(id));
    }
    async productsUpdatePrice(productId, color, newPrice, changedBy = 'erp-user') {
        return this.invoke('products.updatePrice', false, (api) => api.products.updatePrice(productId, color, newPrice, changedBy));
    }
    async productsPriceHistory(productId, color) {
        return this.invoke('products.priceHistory', [], (api) => api.products.priceHistory(productId, color));
    }
    async productsRestorePrice(productId, color, targetPrice, changedBy = 'erp-user') {
        return this.invoke('products.restorePrice', false, (api) => api.products.restorePrice(productId, color, targetPrice, changedBy));
    }
    async stockGetAll() {
        return this.invoke('stock.getAll', [], (api) => api.stock.getAll());
    }
    async stockGetItems() {
        return this.invoke('stock.getItems', [], (api) => api.stock.getItems());
    }
    async stockApplyMovement(movement) {
        return this.invoke('stock.applyMovement', false, (api) => api.stock.applyMovement(movement));
    }
    async stockSetQty(productId, color, qty) {
        return this.invoke('stock.setQty', false, (api) => api.stock.setQty(productId, color, qty));
    }
    async stockIncrement(productId, color, delta) {
        return this.invoke('stock.increment', false, (api) => api.stock.increment(productId, color, delta));
    }
    async stockDecrement(productId, color, delta) {
        return this.invoke('stock.decrement', false, (api) => api.stock.decrement(productId, color, delta));
    }
    async movementsList() {
        return this.invoke('movements.list', [], (api) => api.movements.list());
    }
    async movementsAdd(movement) {
        return this.invoke('movements.add', false, (api) => api.movements.add(movement));
    }
    async inventoryGet() {
        return this.invoke('inventory.get', null, (api) => api.inventory.get());
    }
    async dbBackup() {
        return this.invoke('db.backup', null, (api) => api.db.backup());
    }
    async dbListBackups() {
        return this.invoke('db.listBackups', [], (api) => api.db.listBackups());
    }
    async dbRestore(backupFileName) {
        return this.invoke('db.restore', false, (api) => api.db.restore(backupFileName));
    }
    async updatesCheck() {
        return this.invoke('updates.check', false, (api) => api.updates.check());
    }
    async updatesInstall() {
        return this.invoke('updates.install', false, (api) => api.updates.install());
    }
    async updatesGetStatus() {
        return this.invoke('updates.getStatus', null, (api) => api.updates.getStatus());
    }
    updatesOnStatus(listener) {
        const api = this.spa;
        if (!api) {
            return () => { };
        }
        try {
            return api.updates.onStatus(listener);
        }
        catch {
            return () => { };
        }
    }
    async authLogin(username, password) {
        return this.invoke('auth.login', null, (api) => api.auth.login(username, password));
    }
    async authBeginLogin(identity, password, context) {
        return this.invoke('auth.beginLogin', { status: 'operation_failed' }, (api) => api.auth.beginLogin(identity, password, context ?? null));
    }
    async authVerifyLogin2fa(challengeId, code, context) {
        return this.invoke('auth.verifyLogin2fa', { ok: false, status: 'operation_failed' }, (api) => api.auth.verifyLogin2fa(challengeId, code, context ?? null));
    }
    async authRequestPasswordReset(email, context) {
        return this.invoke('auth.requestPasswordReset', { status: 'request_registered' }, (api) => api.auth.requestPasswordReset(email, context ?? null));
    }
    async authConfirmPasswordReset(challengeId, code, newPassword, context) {
        return this.invoke('auth.confirmPasswordReset', { ok: false, status: 'operation_failed' }, (api) => api.auth.confirmPasswordReset(challengeId, code, newPassword, context ?? null));
    }
    async authRequestPasswordSetup(email, context) {
        return this.invoke('auth.requestPasswordSetup', { status: 'request_registered' }, (api) => api.auth.requestPasswordSetup(email, context ?? null));
    }
    async authCompletePasswordSetup(challengeId, code, newPassword, context) {
        return this.invoke('auth.completePasswordSetup', { ok: false, status: 'operation_failed' }, (api) => api.auth.completePasswordSetup(challengeId, code, newPassword, context ?? null));
    }
    async authLogout() {
        return this.invoke('auth.logout', false, (api) => api.auth.logout());
    }
    async authGetCurrentUser() {
        return this.invoke('auth.getCurrentUser', null, (api) => api.auth.getCurrentUser());
    }
    async authHasPermission(permissionKey) {
        return this.invoke('auth.hasPermission', false, (api) => api.auth.hasPermission(permissionKey));
    }
    async authResetPassword(employeeId, newPassword) {
        return this.invoke('auth.resetPassword', false, (api) => api.auth.resetPassword(employeeId, newPassword));
    }
    async employeesList() {
        return this.invoke('employees.list', [], (api) => api.employees.list());
    }
    async employeesSearch(query) {
        return this.invoke('employees.search', [], (api) => api.employees.search(query));
    }
    async employeesGetById(id) {
        return this.invoke('employees.getById', null, (api) => api.employees.getById(id));
    }
    async employeesCreate(payload) {
        return this.invoke('employees.create', null, (api) => api.employees.create(payload));
    }
    async employeesUpdate(id, payload) {
        return this.invoke('employees.update', null, (api) => api.employees.update(id, payload));
    }
    async employeesDelete(id) {
        return this.invoke('employees.delete', false, (api) => api.employees.delete(id));
    }
    async employeesSetActive(id, actif) {
        return this.invoke('employees.setActive', false, (api) => api.employees.setActive(id, actif));
    }
    async salaryAdvancesList(employeeId, month, year) {
        return this.invoke('salary.advances.list', [], (api) => api.salary.advances.list(employeeId, month, year));
    }
    async salaryAdvancesCreate(payload) {
        return this.invoke('salary.advances.create', null, (api) => api.salary.advances.create(payload));
    }
    async salaryAdvancesDelete(id) {
        return this.invoke('salary.advances.delete', false, (api) => api.salary.advances.delete(id));
    }
    async salaryAdvancesTotal(employeeId, month, year) {
        return this.invoke('salary.advances.total', 0, (api) => api.salary.advances.total(employeeId, month, year));
    }
    async salaryBonusesList(employeeId, month, year) {
        return this.invoke('salary.bonuses.list', [], (api) => api.salary.bonuses.list(employeeId, month, year));
    }
    async salaryBonusesCreate(payload) {
        return this.invoke('salary.bonuses.create', null, (api) => api.salary.bonuses.create(payload));
    }
    async salaryBonusesDelete(id) {
        return this.invoke('salary.bonuses.delete', false, (api) => api.salary.bonuses.delete(id));
    }
    async salaryBonusesTotal(employeeId, month, year) {
        return this.invoke('salary.bonuses.total', 0, (api) => api.salary.bonuses.total(employeeId, month, year));
    }
    async salarySummary(employeeId, month, year) {
        return this.invoke('salary.summary', null, (api) => api.salary.summary(employeeId, month, year));
    }
    static { this.ɵfac = function IpcService_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || IpcService)(); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: IpcService, factory: IpcService.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(IpcService, [{
        type: Injectable,
        args: [{
                providedIn: 'root'
            }]
    }], null, null); })();
