import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as i0 from "@angular/core";
import * as i1 from "./quote-persistence.service";
export class QuoteStoreService {
    constructor(persistence) {
        this.persistence = persistence;
        this.quotesSubject = new BehaviorSubject([]);
        this.quotes$ = this.quotesSubject.asObservable();
        this.loaded = false;
    }
    async load() {
        if (this.loaded)
            return;
        await this.persistence.ensureSeed();
        await this.refresh();
        this.loaded = true;
    }
    async refresh() {
        const all = await this.persistence.getAll();
        const sorted = [...all].sort((a, b) => b.date.localeCompare(a.date));
        this.quotesSubject.next(sorted);
    }
    getSnapshot() {
        return this.quotesSubject.value;
    }
    async getById(id) {
        const snap = this.quotesSubject.value;
        const found = snap.find((quote) => quote.id === id);
        if (found)
            return found;
        await this.refresh();
        const snap2 = this.quotesSubject.value;
        return snap2.find((quote) => quote.id === id) ?? null;
    }
    async save(quote) {
        await this.persistence.put(quote);
        await this.refresh();
    }
    async delete(id) {
        await this.persistence.delete(id);
        await this.refresh();
    }
    async isNumeroUnique(numero, currentId) {
        const all = await this.persistence.getAll();
        return !all.some((quote) => quote.numero === numero && quote.id !== currentId);
    }
    async getNextQuoteNumber() {
        const year = new Date().getFullYear();
        const prefix = `DEV-${year}-`;
        const all = await this.persistence.getAll();
        const numbers = all
            .map((quote) => quote.numero)
            .filter((numero) => numero.startsWith(prefix))
            .map((numero) => Number(numero.replace(prefix, '')))
            .filter((value) => !Number.isNaN(value));
        const next = (Math.max(0, ...numbers) + 1).toString().padStart(4, '0');
        return `${prefix}${next}`;
    }
    static { this.ɵfac = function QuoteStoreService_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || QuoteStoreService)(i0.ɵɵinject(i1.QuotePersistenceService)); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: QuoteStoreService, factory: QuoteStoreService.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(QuoteStoreService, [{
        type: Injectable,
        args: [{
                providedIn: 'root'
            }]
    }], () => [{ type: i1.QuotePersistenceService }], null); })();
