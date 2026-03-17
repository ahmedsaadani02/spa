import { Injectable } from '@angular/core';
import * as i0 from "@angular/core";
export class QuoteStorageService {
    constructor() {
        this.dbPromise = null;
        this.dbName = 'spa-quote-db';
        this.storeName = 'quotes';
        this.version = 1;
    }
    async openDb() {
        if (this.dbPromise)
            return this.dbPromise;
        this.dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            request.onupgradeneeded = () => {
                const db = request.result;
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
    async getById(id) {
        const db = await this.openDb();
        const tx = db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const request = store.get(id);
        const result = await this.requestToPromise(request);
        await this.transactionDone(tx);
        return result ?? null;
    }
    async put(quote) {
        const db = await this.openDb();
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        await this.requestToPromise(store.put(quote));
        await this.transactionDone(tx);
    }
    async delete(id) {
        const db = await this.openDb();
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        await this.requestToPromise(store.delete(id));
        await this.transactionDone(tx);
    }
    async ensureSeed() {
        // pas de seed pour les devis
        return;
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
    static { this.ɵfac = function QuoteStorageService_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || QuoteStorageService)(); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: QuoteStorageService, factory: QuoteStorageService.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(QuoteStorageService, [{
        type: Injectable,
        args: [{
                providedIn: 'root'
            }]
    }], null, null); })();
