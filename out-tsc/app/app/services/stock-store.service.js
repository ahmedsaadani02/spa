import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { STOCK_REPOSITORY } from '../repositories/stock.repository';
import * as i0 from "@angular/core";
export class StockStoreService {
    constructor() {
        this.itemsSubject = new BehaviorSubject([]);
        this.items$ = this.itemsSubject.asObservable();
        this.movementsSubject = new BehaviorSubject([]);
        this.movements$ = this.movementsSubject.asObservable();
        this.loaded = false;
        this.repository = inject(STOCK_REPOSITORY);
    }
    async load() {
        if (this.loaded)
            return;
        await this.repository.initialize();
        await this.refreshItems();
        await this.refreshMovements();
        this.loaded = true;
    }
    async refreshItems() {
        const all = await this.repository.getItems();
        const sorted = [...all].sort((a, b) => {
            const cat = a.category.localeCompare(b.category);
            if (cat !== 0)
                return cat;
            return a.reference.localeCompare(b.reference);
        });
        this.itemsSubject.next(sorted);
    }
    async refreshMovements() {
        const all = await this.repository.getMovements();
        this.movementsSubject.next(all);
    }
    getSnapshotItems() {
        return this.itemsSubject.value;
    }
    getSnapshotMovements() {
        return this.movementsSubject.value;
    }
    async moveStock(input) {
        const items = this.itemsSubject.value;
        const item = items.find((entry) => entry.id === input.itemId);
        if (!item)
            return;
        const reason = input.reason.trim();
        if (!reason)
            return;
        const before = this.getQuantity(item, input.color);
        const rawDelta = Number.isFinite(input.delta) ? input.delta : 0;
        if (rawDelta === 0)
            return;
        let appliedDelta = 0;
        if (input.type === 'IN') {
            appliedDelta = Math.abs(rawDelta);
        }
        else if (input.type === 'OUT') {
            appliedDelta = -Math.abs(rawDelta);
        }
        else {
            appliedDelta = rawDelta;
        }
        let after = before + appliedDelta;
        if (after < 0) {
            after = 0;
        }
        const actualDelta = after - before;
        const nextItem = {
            ...item,
            quantities: {
                ...item.quantities,
                [input.color]: after
            },
            lastUpdated: new Date().toISOString()
        };
        const movement = {
            id: this.createId(),
            itemId: item.id,
            reference: item.reference,
            label: item.label,
            category: item.category,
            serie: item.serie,
            color: input.color,
            type: input.type,
            delta: actualDelta,
            before,
            after,
            reason: reason,
            actor: 'session-user',
            at: new Date().toISOString()
        };
        await this.repository.applyMovement(nextItem, movement);
        await this.refreshItems();
        await this.refreshMovements();
    }
    getMovementsByMonth(monthISO) {
        if (!monthISO)
            return [];
        return this.movementsSubject.value.filter((movement) => movement.at.startsWith(monthISO));
    }
    getMonthlySummary(monthISO) {
        const items = this.getMovementsByMonth(monthISO);
        const inTotal = items
            .filter((movement) => movement.type === 'IN')
            .reduce((sum, movement) => sum + Math.max(0, movement.delta), 0);
        const outTotal = items
            .filter((movement) => movement.type === 'OUT')
            .reduce((sum, movement) => sum + Math.abs(Math.min(0, movement.delta)), 0);
        const net = inTotal - outTotal;
        return { inTotal, outTotal, net, count: items.length };
    }
    getQuantity(item, color) {
        return Number(item.quantities[color] ?? 0) || 0;
    }
    createId() {
        return globalThis.crypto?.randomUUID?.() ??
            `move_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    }
    get supportsInventory() {
        return this.repository.supportsInventory;
    }
    async getInventory() {
        return this.repository.getInventory();
    }
    async updateProductPrice(productId, color, newPrice, changedBy = 'erp-user') {
        return this.repository.updateProductPrice(productId, color, newPrice, changedBy);
    }
    async updatePrice(productId, color, newPrice, changedBy = 'erp-user') {
        return this.updateProductPrice(productId, color, newPrice, changedBy);
    }
    async getProductPriceHistory(productId, color) {
        return this.repository.getProductPriceHistory(productId, color);
    }
    async restoreProductPrice(productId, color, targetPrice, changedBy = 'erp-user') {
        return this.repository.restoreProductPrice(productId, color, targetPrice, changedBy);
    }
    async createProduct(input) {
        const created = await this.repository.createProduct(input);
        if (created) {
            await this.refreshItems();
        }
        return created;
    }
    async selectProductImage() {
        return this.repository.selectProductImage();
    }
    static { this.ɵfac = function StockStoreService_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || StockStoreService)(); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: StockStoreService, factory: StockStoreService.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(StockStoreService, [{
        type: Injectable,
        args: [{
                providedIn: 'root'
            }]
    }], null, null); })();
