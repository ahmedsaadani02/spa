import { Injectable } from '@angular/core';
import { getSpaApi } from '../bridge/spa-bridge';
import * as i0 from "@angular/core";
export class ElectronService {
    get spa() {
        return getSpaApi();
    }
    get isElectron() {
        return !!this.spa;
    }
    hasInvoicesApi() {
        return !!this.spa?.invoices;
    }
    hasQuotesApi() {
        return !!this.spa?.quotes;
    }
    async exportPdf() {
        if (!this.isElectron) {
            return null;
        }
        return this.spa?.exportPdf() ?? null;
    }
    async invoicesGetAll() {
        if (!this.isElectron || !this.spa?.invoices?.getAll) {
            return [];
        }
        return this.spa.invoices.getAll();
    }
    async invoicesGetById(id) {
        if (!this.isElectron || !this.spa?.invoices?.getById) {
            return null;
        }
        return this.spa.invoices.getById(id);
    }
    async invoicesPut(invoice) {
        if (!this.isElectron || !this.spa?.invoices?.put) {
            return;
        }
        await this.spa.invoices.put(invoice);
    }
    async invoicesDelete(id) {
        if (!this.isElectron || !this.spa?.invoices?.delete) {
            return;
        }
        await this.spa.invoices.delete(id);
    }
    async quotesGetAll() {
        if (!this.isElectron || !this.spa?.quotes?.getAll) {
            return [];
        }
        return this.spa.quotes.getAll();
    }
    async quotesGetById(id) {
        if (!this.isElectron || !this.spa?.quotes?.getById) {
            return null;
        }
        return this.spa.quotes.getById(id);
    }
    async quotesPut(quote) {
        if (!this.isElectron || !this.spa?.quotes?.put) {
            return;
        }
        await this.spa.quotes.put(quote);
    }
    async quotesDelete(id) {
        if (!this.isElectron || !this.spa?.quotes?.delete) {
            return;
        }
        await this.spa.quotes.delete(id);
    }
    static { this.ɵfac = function ElectronService_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || ElectronService)(); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: ElectronService, factory: ElectronService.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(ElectronService, [{
        type: Injectable,
        args: [{
                providedIn: 'root'
            }]
    }], null, null); })();
