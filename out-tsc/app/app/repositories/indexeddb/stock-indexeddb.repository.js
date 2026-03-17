import { Injectable } from '@angular/core';
import * as i0 from "@angular/core";
import * as i1 from "../../services/stock-storage.service";
export class StockIndexedDbRepository {
    constructor(storage) {
        this.storage = storage;
        this.supportsInventory = false;
    }
    async initialize() {
        await this.storage.ensureSeed();
        await this.storage.normalizeSeries67();
        await this.storage.normalizeLabelsAndReferences();
    }
    async getItems() {
        return this.storage.getAllItems();
    }
    async getMovements() {
        return this.storage.getAllMovements();
    }
    async applyMovement(item, movement) {
        await this.storage.applyMovement(item, movement);
    }
    async createProduct(payload) {
        void payload;
        return false;
    }
    async selectProductImage() {
        return { canceled: true };
    }
    async getInventory() {
        return null;
    }
    async updateProductPrice(productId, color, newPrice, changedBy) {
        void productId;
        void color;
        void newPrice;
        void changedBy;
        return false;
    }
    async getProductPriceHistory(productId, color) {
        void productId;
        void color;
        return [];
    }
    async restoreProductPrice(productId, color, targetPrice, changedBy) {
        void productId;
        void color;
        void targetPrice;
        void changedBy;
        return false;
    }
    static { this.ɵfac = function StockIndexedDbRepository_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || StockIndexedDbRepository)(i0.ɵɵinject(i1.StockStorageService)); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: StockIndexedDbRepository, factory: StockIndexedDbRepository.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(StockIndexedDbRepository, [{
        type: Injectable,
        args: [{
                providedIn: 'root'
            }]
    }], () => [{ type: i1.StockStorageService }], null); })();
