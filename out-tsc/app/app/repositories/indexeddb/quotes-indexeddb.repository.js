import { Injectable } from '@angular/core';
import * as i0 from "@angular/core";
import * as i1 from "../../services/quote-storage.service";
export class QuotesIndexedDbRepository {
    constructor(storage) {
        this.storage = storage;
    }
    async getAll() {
        return this.storage.getAll();
    }
    async getById(id) {
        return this.storage.getById(id);
    }
    async put(quote) {
        await this.storage.put(quote);
    }
    async delete(id) {
        await this.storage.delete(id);
    }
    async ensureSeed() {
        await this.storage.ensureSeed();
    }
    static { this.ɵfac = function QuotesIndexedDbRepository_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || QuotesIndexedDbRepository)(i0.ɵɵinject(i1.QuoteStorageService)); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: QuotesIndexedDbRepository, factory: QuotesIndexedDbRepository.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(QuotesIndexedDbRepository, [{
        type: Injectable,
        args: [{
                providedIn: 'root'
            }]
    }], () => [{ type: i1.QuoteStorageService }], null); })();
