import { Injectable, inject, isDevMode } from '@angular/core';
import { INVOICES_REPOSITORY } from '../repositories/invoices.repository';
import { ClientPersistenceService } from './client-persistence.service';
import * as i0 from "@angular/core";
export class InvoicePersistenceService {
    constructor() {
        this.repository = inject(INVOICES_REPOSITORY);
        this.clients = inject(ClientPersistenceService);
    }
    async getAll() {
        const all = await this.repository.getAll();
        if (!Array.isArray(all) && isDevMode()) {
            console.warn('[InvoicePersistence] Repository returned invalid list');
            return [];
        }
        return Array.isArray(all) ? all : [];
    }
    async getById(id) {
        return (await this.repository.getById(id)) ?? null;
    }
    async put(invoice) {
        const normalized = await this.attachClient(invoice);
        await this.repository.put(normalized);
    }
    async delete(id) {
        await this.repository.delete(id);
    }
    async ensureSeed() {
        await this.repository.ensureSeed?.();
    }
    async attachClient(invoice) {
        const linked = await this.clients.findOrCreate(invoice.client, invoice.clientId ?? null);
        if (!linked) {
            return {
                ...invoice,
                clientId: null
            };
        }
        return {
            ...invoice,
            clientId: linked.id ?? null,
            client: this.toInvoiceClient(linked)
        };
    }
    toInvoiceClient(client) {
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
    static { this.ɵfac = function InvoicePersistenceService_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || InvoicePersistenceService)(); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: InvoicePersistenceService, factory: InvoicePersistenceService.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(InvoicePersistenceService, [{
        type: Injectable,
        args: [{
                providedIn: 'root'
            }]
    }], null, null); })();
