import { Injectable } from '@angular/core';
import * as i0 from "@angular/core";
export class InvoiceStorageService {
    constructor() {
        this.dbPromise = null;
        // ✅ Optionnel: si tu veux repartir clean, change en 'spa-invoice-db-v2'
        this.dbName = 'spa-invoice-db';
        this.storeName = 'invoices';
        this.version = 1;
    }
    async openDb() {
        if (this.dbPromise)
            return this.dbPromise;
        this.dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            request.onupgradeneeded = () => {
                const db = request.result;
                // ✅ Création store si absent
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'id' });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        return this.dbPromise;
    }
    async getAll() {
        const db = await this.openDb();
        const tx = db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const request = store.getAll();
        const result = await this.requestToPromise(request);
        await this.transactionDone(tx);
        return result ?? [];
    }
    // ✅ Fix preview: get() + fallback getAll().find()
    async getById(id) {
        const db = await this.openDb();
        // 1) essai direct (rapide)
        try {
            const tx = db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const request = store.get(id);
            const result = await this.requestToPromise(request);
            await this.transactionDone(tx);
            if (result)
                return result;
        }
        catch {
            // ignore -> fallback
        }
        // 2) fallback sûr
        const all = await this.getAll();
        return all.find((inv) => inv.id === id) ?? null;
    }
    async put(invoice) {
        const db = await this.openDb();
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        // ✅ attendre que la requête réussisse/échoue
        const request = store.put(invoice);
        await this.requestToPromise(request);
        await this.transactionDone(tx);
    }
    async delete(id) {
        const db = await this.openDb();
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        // ✅ attendre la requête
        const request = store.delete(id);
        await this.requestToPromise(request);
        await this.transactionDone(tx);
    }
    async ensureSeed() {
        const all = await this.getAll();
        if (all.length > 0)
            return;
        const sample = this.createSampleInvoice();
        await this.put(sample);
    }
    requestToPromise(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    transactionDone(tx) {
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error);
        });
    }
    createSampleInvoice() {
        const today = new Date().toISOString().slice(0, 10);
        const year = new Date().getFullYear();
        return {
            id: this.createId(),
            numero: `SPA-${year}-0001`,
            date: today,
            clientId: null,
            client: {
                nom: 'AluDesign SARL',
                adresse: 'Zone Industrielle, Sfax',
                tel: '+216 74 000 000',
                mf: '1234567/A/M/000',
                email: 'contact@aludesign.tn'
            },
            lignes: [
                {
                    id: this.createId(),
                    designation: 'Profilé aluminium 6063',
                    unite: 'm',
                    quantite: 120,
                    prixUnitaire: 18.5,
                    tvaRate: 19
                },
                {
                    id: this.createId(),
                    designation: 'Fenêtre coulissante',
                    unite: 'pièce',
                    quantite: 8,
                    prixUnitaire: 450,
                    tvaRate: 19
                },
                {
                    id: this.createId(),
                    designation: 'Tôle aluminium',
                    unite: 'm²',
                    quantite: 42,
                    prixUnitaire: 32,
                    tvaRate: 19
                }
            ],
            remiseType: 'pourcentage',
            remiseValue: 5,
            remiseAvantTVA: true,
            notes: 'Délai de fabrication estimé : 10 jours ouvrés.',
            conditions: 'Paiement à 30 jours fin de mois.'
        };
    }
    createId() {
        return globalThis.crypto?.randomUUID?.() ??
            `inv_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    }
    static { this.ɵfac = function InvoiceStorageService_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || InvoiceStorageService)(); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: InvoiceStorageService, factory: InvoiceStorageService.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(InvoiceStorageService, [{
        type: Injectable,
        args: [{
                providedIn: 'root'
            }]
    }], null, null); })();
