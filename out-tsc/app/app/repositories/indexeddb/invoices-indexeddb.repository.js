import { Injectable } from '@angular/core';
import * as i0 from "@angular/core";
import * as i1 from "../../services/invoice-storage.service";
export class InvoicesIndexedDbRepository {
    constructor(storage) {
        this.storage = storage;
    }
    async getAll() {
        return this.storage.getAll();
    }
    async getById(id) {
        return this.storage.getById(id);
    }
    async put(invoice) {
        await this.storage.put(invoice);
    }
    async delete(id) {
        await this.storage.delete(id);
    }
    async ensureSeed() {
        await this.storage.ensureSeed();
    }
    static { this.ɵfac = function InvoicesIndexedDbRepository_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || InvoicesIndexedDbRepository)(i0.ɵɵinject(i1.InvoiceStorageService)); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: InvoicesIndexedDbRepository, factory: InvoicesIndexedDbRepository.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(InvoicesIndexedDbRepository, [{
        type: Injectable,
        args: [{
                providedIn: 'root'
            }]
    }], () => [{ type: i1.InvoiceStorageService }], null); })();
