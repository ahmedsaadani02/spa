import { Injectable, inject, isDevMode } from '@angular/core';
import { QUOTES_REPOSITORY } from '../repositories/quotes.repository';
import { ClientPersistenceService } from './client-persistence.service';
import * as i0 from "@angular/core";
export class QuotePersistenceService {
    constructor() {
        this.repository = inject(QUOTES_REPOSITORY);
        this.clients = inject(ClientPersistenceService);
    }
    async getAll() {
        const all = await this.repository.getAll();
        if (!Array.isArray(all) && isDevMode()) {
            console.warn('[QuotePersistence] Repository returned invalid list');
            return [];
        }
        return Array.isArray(all) ? all : [];
    }
    async getById(id) {
        return (await this.repository.getById(id)) ?? null;
    }
    async put(quote) {
        const normalized = await this.attachClient(quote);
        await this.repository.put(normalized);
    }
    async delete(id) {
        await this.repository.delete(id);
    }
    async ensureSeed() {
        await this.repository.ensureSeed?.();
    }
    async attachClient(quote) {
        const linked = await this.clients.findOrCreate(quote.client, quote.clientId ?? null);
        if (!linked) {
            return {
                ...quote,
                clientId: null
            };
        }
        return {
            ...quote,
            clientId: linked.id ?? null,
            client: this.toQuoteClient(linked)
        };
    }
    toQuoteClient(client) {
        const tel = (client.tel || client.telephone || '').trim();
        return {
            id: client.id ?? null,
            nom: (client.nom || '').trim(),
            adresse: (client.adresse || '').trim(),
            tel,
            telephone: tel,
            mf: (client.mf || '').trim(),
            email: (client.email || '').trim().toLowerCase(),
            createdAt: client.createdAt,
            updatedAt: client.updatedAt
        };
    }
    static { this.ɵfac = function QuotePersistenceService_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || QuotePersistenceService)(); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: QuotePersistenceService, factory: QuotePersistenceService.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(QuotePersistenceService, [{
        type: Injectable,
        args: [{
                providedIn: 'root'
            }]
    }], null, null); })();
