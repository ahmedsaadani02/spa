import { Injectable } from '@angular/core';
import * as i0 from "@angular/core";
import * as i1 from "../../services/ipc.service";
export class ClientsIpcRepository {
    constructor(ipc) {
        this.ipc = ipc;
    }
    async list() {
        return this.ipc.clientsList();
    }
    async getById(id) {
        return this.ipc.clientsGetById(id);
    }
    async search(query) {
        return this.ipc.clientsSearch(query);
    }
    async upsert(client) {
        return this.ipc.clientsUpsert(client);
    }
    async delete(id) {
        return this.ipc.clientsDelete(id);
    }
    async findOrCreate(client, preferredId) {
        return this.ipc.clientsFindOrCreate(client, preferredId ?? null);
    }
    static { this.ɵfac = function ClientsIpcRepository_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || ClientsIpcRepository)(i0.ɵɵinject(i1.IpcService)); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: ClientsIpcRepository, factory: ClientsIpcRepository.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(ClientsIpcRepository, [{
        type: Injectable,
        args: [{
                providedIn: 'root'
            }]
    }], () => [{ type: i1.IpcService }], null); })();
