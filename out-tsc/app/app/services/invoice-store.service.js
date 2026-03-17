import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as i0 from "@angular/core";
import * as i1 from "./invoice-persistence.service";
export class InvoiceStoreService {
    constructor(persistence) {
        this.persistence = persistence;
        this.invoicesSubject = new BehaviorSubject([]);
        this.invoices$ = this.invoicesSubject.asObservable();
        // ✅ initialized = connexion/seed une seule fois
        // load() rafraîchit toujours les données à chaque navigation
        this.initialized = false;
    }
    async load() {
        if (!this.initialized) {
            await this.persistence.ensureSeed();
            this.initialized = true;
        }
        // ✅ toujours recharger les données
        await this.refresh();
    }
    async refresh() {
        const all = await this.persistence.getAll();
        const sorted = [...all].sort((a, b) => b.date.localeCompare(a.date));
        this.invoicesSubject.next(sorted);
    }
    getSnapshot() {
        return this.invoicesSubject.value;
    }
    async getById(id) {
        const snap = this.invoicesSubject.value;
        const found = snap.find(inv => inv.id === id);
        if (found)
            return found;
        await this.refresh();
        const snap2 = this.invoicesSubject.value;
        return snap2.find(inv => inv.id === id) ?? null;
    }
    async save(invoice) {
        await this.persistence.put(invoice);
        await this.refresh();
    }
    async delete(id) {
        await this.persistence.delete(id);
        await this.refresh();
    }
    async isNumeroUnique(numero, currentId) {
        const all = await this.persistence.getAll();
        return !all.some((invoice) => invoice.numero === numero && invoice.id !== currentId);
    }
    async getNextInvoiceNumber() {
        const year = new Date().getFullYear();
        const prefix = `SPA-${year}-`;
        const all = await this.persistence.getAll();
        const numbers = all
            .map((invoice) => invoice.numero)
            .filter((numero) => numero.startsWith(prefix))
            .map((numero) => Number(numero.replace(prefix, '')))
            .filter((value) => !Number.isNaN(value));
        const next = (Math.max(0, ...numbers) + 1).toString().padStart(4, '0');
        return `${prefix}${next}`;
    }
    static { this.ɵfac = function InvoiceStoreService_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || InvoiceStoreService)(i0.ɵɵinject(i1.InvoicePersistenceService)); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: InvoiceStoreService, factory: InvoiceStoreService.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(InvoiceStoreService, [{
        type: Injectable,
        args: [{
                providedIn: 'root'
            }]
    }], () => [{ type: i1.InvoicePersistenceService }], null); })();
