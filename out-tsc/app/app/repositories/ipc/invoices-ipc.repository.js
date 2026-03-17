import { Injectable } from '@angular/core';
import * as i0 from "@angular/core";
import * as i1 from "../../services/ipc.service";
export class InvoicesIpcRepository {
    constructor(ipc) {
        this.ipc = ipc;
    }
    async getAll() {
        return this.ipc.invoicesGetAll();
    }
    async getById(id) {
        return this.ipc.invoicesGetById(id);
    }
    async put(invoice) {
        await this.ipc.invoicesPut(invoice);
    }
    async delete(id) {
        await this.ipc.invoicesDelete(id);
    }
    static { this.ɵfac = function InvoicesIpcRepository_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || InvoicesIpcRepository)(i0.ɵɵinject(i1.IpcService)); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: InvoicesIpcRepository, factory: InvoicesIpcRepository.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(InvoicesIpcRepository, [{
        type: Injectable,
        args: [{
                providedIn: 'root'
            }]
    }], () => [{ type: i1.IpcService }], null); })();
