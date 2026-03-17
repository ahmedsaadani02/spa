import { Injectable, inject, isDevMode } from '@angular/core';
import { CLIENTS_REPOSITORY } from '../repositories/clients.repository';
import * as i0 from "@angular/core";
export class ClientPersistenceService {
    constructor() {
        this.repository = inject(CLIENTS_REPOSITORY);
        this.operationTimeoutMs = 8000;
    }
    async withTimeout(promise, label, fallback) {
        let timer;
        try {
            const timeoutPromise = new Promise((_, reject) => {
                timer = setTimeout(() => reject(new Error(`[ClientPersistence] Timeout on ${label}`)), this.operationTimeoutMs);
            });
            return await Promise.race([promise, timeoutPromise]);
        }
        catch (error) {
            if (isDevMode()) {
                console.warn(`[ClientPersistence] ${label} failed`, error);
            }
            return fallback;
        }
        finally {
            if (timer)
                clearTimeout(timer);
        }
    }
    async list() {
        const clients = await this.withTimeout(this.repository.list(), 'list', []);
        if (!Array.isArray(clients) && isDevMode()) {
            console.warn('[ClientPersistence] Repository returned invalid list');
            return [];
        }
        return Array.isArray(clients) ? clients : [];
    }
    async getById(id) {
        return this.withTimeout(this.repository.getById(id), 'getById', null);
    }
    async search(query) {
        const clients = await this.withTimeout(this.repository.search(query), 'search', []);
        if (!Array.isArray(clients))
            return [];
        return clients;
    }
    async upsert(client) {
        return this.withTimeout(this.repository.upsert(client), 'upsert', null);
    }
    async delete(id) {
        return this.withTimeout(this.repository.delete(id), 'delete', false);
    }
    async findOrCreate(client, preferredId) {
        return this.withTimeout(this.repository.findOrCreate(client, preferredId ?? null), 'findOrCreate', null);
    }
    static { this.ɵfac = function ClientPersistenceService_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || ClientPersistenceService)(); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: ClientPersistenceService, factory: ClientPersistenceService.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(ClientPersistenceService, [{
        type: Injectable,
        args: [{
                providedIn: 'root'
            }]
    }], null, null); })();
