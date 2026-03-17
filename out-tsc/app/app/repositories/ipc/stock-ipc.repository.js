import { Injectable } from '@angular/core';
import * as i0 from "@angular/core";
import * as i1 from "../../services/ipc.service";
export class StockIpcRepository {
    constructor(ipc) {
        this.ipc = ipc;
        this.supportsInventory = true;
    }
    async initialize() {
        return;
    }
    async getItems() {
        return this.ipc.stockGetItems();
    }
    async getMovements() {
        return this.ipc.movementsList();
    }
    async applyMovement(item, movement) {
        const ok = await this.ipc.stockApplyMovement(movement);
        if (ok) {
            return;
        }
        // Compatibility fallback when the main process is older and does not expose stock:applyMovement yet.
        const targetQty = Number(item.quantities[movement.color] ?? movement.after ?? 0);
        const qtyUpdated = await this.ipc.stockSetQty(movement.itemId, movement.color, targetQty);
        const movementAdded = qtyUpdated ? await this.ipc.movementsAdd(movement) : false;
        if (!qtyUpdated || !movementAdded) {
            throw new Error('Stock operation failed (stock:applyMovement unavailable or rejected).');
        }
    }
    async createProduct(payload) {
        const result = await this.ipc.productsCreate({
            reference: payload.reference,
            label: payload.label,
            description: payload.description ?? '',
            category: payload.category,
            serie: payload.serie,
            unit: payload.unit,
            colors: payload.colors,
            imageRef: payload.imageRef ?? null,
            lowStockThreshold: payload.lowStockThreshold ?? 0
        });
        if (result?.ok) {
            return true;
        }
        throw new Error(result?.message || 'PRODUCT_CREATE_FAILED');
    }
    async selectProductImage() {
        return this.ipc.productsSelectImage();
    }
    async getInventory() {
        return this.ipc.inventoryGet();
    }
    async updateProductPrice(productId, color, newPrice, changedBy = 'erp-user') {
        return this.ipc.productsUpdatePrice(productId, color, newPrice, changedBy);
    }
    async getProductPriceHistory(productId, color) {
        return this.ipc.productsPriceHistory(productId, color);
    }
    async restoreProductPrice(productId, color, targetPrice, changedBy = 'erp-user') {
        return this.ipc.productsRestorePrice(productId, color, targetPrice, changedBy);
    }
    static { this.ɵfac = function StockIpcRepository_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || StockIpcRepository)(i0.ɵɵinject(i1.IpcService)); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: StockIpcRepository, factory: StockIpcRepository.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(StockIpcRepository, [{
        type: Injectable,
        args: [{
                providedIn: 'root'
            }]
    }], () => [{ type: i1.IpcService }], null); })();
