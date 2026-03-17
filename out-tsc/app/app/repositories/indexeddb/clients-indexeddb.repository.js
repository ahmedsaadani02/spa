import { Injectable } from '@angular/core';
import * as i0 from "@angular/core";
import * as i1 from "../../services/client-storage.service";
export class ClientsIndexedDbRepository {
    constructor(storage) {
        this.storage = storage;
    }
    async list() {
        return this.storage.list();
    }
    async getById(id) {
        return this.storage.getById(id);
    }
    async search(query) {
        return this.storage.search(query);
    }
    async upsert(client) {
        return this.storage.upsert(client);
    }
    async delete(id) {
        return this.storage.delete(id);
    }
    async findOrCreate(client, preferredId) {
        return this.storage.findOrCreate(client, preferredId ?? null);
    }
    static { this.ɵfac = function ClientsIndexedDbRepository_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || ClientsIndexedDbRepository)(i0.ɵɵinject(i1.ClientStorageService)); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: ClientsIndexedDbRepository, factory: ClientsIndexedDbRepository.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(ClientsIndexedDbRepository, [{
        type: Injectable,
        args: [{
                providedIn: 'root'
            }]
    }], () => [{ type: i1.ClientStorageService }], null); })();
