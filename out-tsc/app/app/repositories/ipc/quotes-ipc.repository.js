import { Injectable } from '@angular/core';
import * as i0 from "@angular/core";
import * as i1 from "../../services/ipc.service";
export class QuotesIpcRepository {
    constructor(ipc) {
        this.ipc = ipc;
    }
    async getAll() {
        return this.ipc.quotesGetAll();
    }
    async getById(id) {
        return this.ipc.quotesGetById(id);
    }
    async put(quote) {
        await this.ipc.quotesPut(quote);
    }
    async delete(id) {
        await this.ipc.quotesDelete(id);
    }
    static { this.ɵfac = function QuotesIpcRepository_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || QuotesIpcRepository)(i0.ɵɵinject(i1.IpcService)); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: QuotesIpcRepository, factory: QuotesIpcRepository.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(QuotesIpcRepository, [{
        type: Injectable,
        args: [{
                providedIn: 'root'
            }]
    }], () => [{ type: i1.IpcService }], null); })();
