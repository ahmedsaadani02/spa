import { Injectable, NgZone, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NewStockProductInput, ProductImageSelection, StockColor, StockItem } from '../models/stock-item';
import { StockMovement, StockMovementType } from '../models/stock-movement';
import { STOCK_REPOSITORY, StockRepository } from '../repositories/stock.repository';
import type {
  SpaInventoryResponse,
  SpaProductMetadataAddResult,
  SpaPriceHistoryEntry,
  SpaProductMetadata,
  SpaProductPurgeResult,
  SpaProductRestoreResult,
  SpaProductRow,
  SpaProductUpdateResult
} from '../types/electron';

interface MoveStockInput {
  itemId: string;
  color: StockColor;
  type: StockMovementType;
  delta: number;
  reason: string;
}

@Injectable({
  providedIn: 'root'
})
export class StockStoreService {
  private readonly itemsSubject = new BehaviorSubject<StockItem[]>([]);
  readonly items$ = this.itemsSubject.asObservable();

  private readonly movementsSubject = new BehaviorSubject<StockMovement[]>([]);
  readonly movements$ = this.movementsSubject.asObservable();

  private readonly archivedProductsSubject = new BehaviorSubject<SpaProductRow[]>([]);
  readonly archivedProducts$ = this.archivedProductsSubject.asObservable();

  private readonly productMetadataSubject = new BehaviorSubject<SpaProductMetadata>({
    categories: ['profil', 'accessoire', 'joint'],
    series: ['40', '67', 'porte-securite'],
    colors: ['blanc', 'gris', 'noir']
  });
  readonly productMetadata$ = this.productMetadataSubject.asObservable();

  private readonly inventorySubject = new BehaviorSubject<SpaInventoryResponse | null>(null);
  readonly inventory$ = this.inventorySubject.asObservable();

  private initialized = false;
  private stockHydrated = false;
  private movementsHydrated = false;
  private archivesHydrated = false;
  private metadataHydrated = false;
  private stockWarmPromise: Promise<void> | null = null;
  private movementsWarmPromise: Promise<void> | null = null;
  private archivesWarmPromise: Promise<void> | null = null;
  private inventoryWarmPromise: Promise<SpaInventoryResponse | null> | null = null;

  private readonly repository = inject<StockRepository>(STOCK_REPOSITORY);
  private readonly zone = inject(NgZone);

  async ensureReady(): Promise<void> {
    if (this.initialized) {
      return;
    }
    await this.repository.initialize();
    this.initialized = true;
  }

  async load(): Promise<void> {
    console.log('[stock-page] load requested');
    console.log('[stock-archives-page] load requested');
    console.log('[stock-history-page] load requested');
    console.log('[inventaire-page] load requested');
    await this.ensureReady();
    await this.refreshItems();
    await this.refreshMovements();
    await this.refreshArchivedProducts();
    await this.refreshProductMetadata();
    if (this.itemsSubject.value.length === 0 && this.archivedProductsSubject.value.length === 0) {
      await this.wait(180);
      await this.refreshItems();
      await this.refreshArchivedProducts();
    }
    this.logRenderState();
  }

  async refreshItems(): Promise<void> {
    const all = await this.repository.getItems();
    const sorted = [...all].sort((a, b) => {
      const cat = a.category.localeCompare(b.category);
      if (cat !== 0) return cat;
      return a.reference.localeCompare(b.reference);
    });
    this.emitInZone(this.itemsSubject, sorted);
    this.stockHydrated = true;
    console.log('[stock-page] api response received');
    console.log(`[stock-page] rendered items count: ${sorted.length}`);
    console.log('[stock-page] empty state condition:', sorted.length === 0);
  }

  async refreshMovements(): Promise<void> {
    const all = await this.repository.getMovements();
    this.emitInZone(this.movementsSubject, all);
    this.movementsHydrated = true;
    console.log('[stock-history-page] api response received');
    console.log(`[stock-history-page] rendered items count: ${all.length}`);
    console.log('[stock-history-page] empty state condition:', all.length === 0);
  }

  async refreshArchivedProducts(): Promise<void> {
    const archived = await this.repository.listArchivedProducts();
    this.emitInZone(this.archivedProductsSubject, archived);
    this.archivesHydrated = true;
    console.log('[stock-archives-page] api response received');
    console.log(`[stock-archives-page] rendered items count: ${archived.length}`);
    console.log('[stock-archives-page] empty state condition:', archived.length === 0);
  }

  async refreshProductMetadata(): Promise<void> {
    const metadata = await this.repository.getProductMetadata();
    this.emitInZone(this.productMetadataSubject, metadata);
    this.metadataHydrated = true;
  }

  async addProductMetadata(kind: 'category' | 'serie' | 'color', value: string): Promise<SpaProductMetadataAddResult> {
    const result = await this.repository.addProductMetadata(kind, value);
    if (result?.ok) {
      await this.refreshProductMetadata();
    }
    return result;
  }

  getSnapshotItems(): StockItem[] {
    return this.itemsSubject.value;
  }

  getSnapshotMovements(): StockMovement[] {
    return this.movementsSubject.value;
  }

  getSnapshotArchivedProducts(): SpaProductRow[] {
    return this.archivedProductsSubject.value;
  }

  async warmStockCatalog(): Promise<void> {
    if (this.stockHydrated && this.metadataHydrated) {
      return;
    }
    if (this.stockWarmPromise) {
      return this.stockWarmPromise;
    }

    this.stockWarmPromise = (async () => {
      await this.ensureReady();
      await Promise.all([
        this.stockHydrated ? Promise.resolve() : this.refreshItems(),
        this.metadataHydrated ? Promise.resolve() : this.refreshProductMetadata()
      ]);
    })().finally(() => {
      this.stockWarmPromise = null;
    });

    return this.stockWarmPromise;
  }

  async warmMovements(): Promise<void> {
    if (this.movementsHydrated) {
      return;
    }
    if (this.movementsWarmPromise) {
      return this.movementsWarmPromise;
    }

    this.movementsWarmPromise = (async () => {
      await this.ensureReady();
      await this.refreshMovements();
    })().finally(() => {
      this.movementsWarmPromise = null;
    });

    return this.movementsWarmPromise;
  }

  async warmArchives(): Promise<void> {
    if (this.archivesHydrated) {
      return;
    }
    if (this.archivesWarmPromise) {
      return this.archivesWarmPromise;
    }

    this.archivesWarmPromise = (async () => {
      await this.ensureReady();
      await this.refreshArchivedProducts();
    })().finally(() => {
      this.archivesWarmPromise = null;
    });

    return this.archivesWarmPromise;
  }

  async moveStock(input: MoveStockInput): Promise<void> {
    const items = this.itemsSubject.value;
    const item = items.find((entry) => entry.id === input.itemId);
    if (!item) return;

    const reason = input.reason.trim();
    if (!reason) return;

    const before = this.getQuantity(item, input.color);
    const rawDelta = Number.isFinite(input.delta) ? input.delta : 0;
    if (rawDelta === 0) return;

    let appliedDelta = 0;
    if (input.type === 'IN') {
      appliedDelta = Math.abs(rawDelta);
    } else if (input.type === 'OUT') {
      appliedDelta = -Math.abs(rawDelta);
    } else {
      appliedDelta = rawDelta;
    }

    let after = before + appliedDelta;
    if (after < 0) {
      after = 0;
    }
    const actualDelta = after - before;

    const nextItem: StockItem = {
      ...item,
      quantities: {
        ...item.quantities,
        [input.color]: after
      },
      lastUpdated: new Date().toISOString()
    };

    const movement: StockMovement = {
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

  getMovementsByMonth(monthISO: string): StockMovement[] {
    if (!monthISO) return [];
    return this.movementsSubject.value.filter((movement) => movement.at.startsWith(monthISO));
  }

  getMonthlySummary(monthISO: string): { inTotal: number; outTotal: number; net: number; count: number } {
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

  private getQuantity(item: StockItem, color: StockColor): number {
    return Number(item.quantities[color] ?? 0) || 0;
  }

  private createId(): string {
    return globalThis.crypto?.randomUUID?.() ??
      `move_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  get supportsInventory(): boolean {
    return this.repository.supportsInventory;
  }

  async warmInventory(): Promise<SpaInventoryResponse | null> {
    if (!this.supportsInventory) {
      return null;
    }

    if (this.inventorySubject.value) {
      return this.inventorySubject.value;
    }

    if (this.inventoryWarmPromise) {
      return this.inventoryWarmPromise;
    }

    this.inventoryWarmPromise = (async () => {
      await this.ensureReady();
      const response = await this.repository.getInventory();
      this.emitInZone(this.inventorySubject, response);
      return response;
    })().finally(() => {
      this.inventoryWarmPromise = null;
    });

    return this.inventoryWarmPromise;
  }

  getCachedInventory(): SpaInventoryResponse | null {
    return this.inventorySubject.value;
  }

  async getInventory(forceRefresh = false): Promise<SpaInventoryResponse | null> {
    if (this.supportsInventory && !forceRefresh) {
      const cached = this.inventorySubject.value;
      if (cached) {
        const count = Array.isArray(cached.items) ? cached.items.length : 0;
        console.log('[inventaire-page] api response received');
        console.log(`[inventaire-page] rendered items count: ${count}`);
        console.log('[inventaire-page] empty state condition:', count === 0);
        return cached;
      }
    }

    await this.ensureReady();
    const response = await this.repository.getInventory();
    this.emitInZone(this.inventorySubject, response);
    const count = Array.isArray(response?.items) ? response.items.length : 0;
    console.log('[inventaire-page] api response received');
    console.log(`[inventaire-page] rendered items count: ${count}`);
    console.log('[inventaire-page] empty state condition:', count === 0);
    return response;
  }

  async updateProductPrice(productId: string, color: StockColor, newPrice: number, changedBy = 'erp-user'): Promise<boolean> {
    return this.repository.updateProductPrice(productId, color, newPrice, changedBy);
  }

  async updatePrice(productId: string, color: StockColor, newPrice: number, changedBy = 'erp-user'): Promise<boolean> {
    return this.updateProductPrice(productId, color, newPrice, changedBy);
  }

  async getProductPriceHistory(productId: string, color: StockColor): Promise<SpaPriceHistoryEntry[]> {
    return this.repository.getProductPriceHistory(productId, color);
  }

  async restoreProductPrice(productId: string, color: StockColor, targetPrice: number, changedBy = 'erp-user'): Promise<boolean> {
    return this.repository.restoreProductPrice(productId, color, targetPrice, changedBy);
  }

  async createProduct(input: NewStockProductInput): Promise<boolean> {
    const created = await this.repository.createProduct(input);
    if (created) {
      await this.refreshItems();
      await this.refreshProductMetadata();
      await this.refreshArchivedProducts();
    }
    return created;
  }

  async updateProduct(productId: string, input: NewStockProductInput): Promise<SpaProductUpdateResult> {
    const result = await this.repository.updateProduct(productId, input);
    if (result?.ok) {
      await this.refreshItems();
      await this.refreshProductMetadata();
      await this.refreshArchivedProducts();
    }
    return result;
  }

  async archiveProduct(productId: string): Promise<boolean> {
    const archived = await this.repository.archiveProduct(productId);
    if (archived) {
      await this.refreshItems();
      await this.refreshArchivedProducts();
      await this.refreshProductMetadata();
    }
    return archived;
  }

  async restoreProduct(productId: string): Promise<SpaProductRestoreResult> {
    const result = await this.repository.restoreProduct(productId);
    if (result?.ok) {
      await this.refreshItems();
      await this.refreshArchivedProducts();
      await this.refreshProductMetadata();
    }
    return result;
  }

  async purgeProduct(productId: string): Promise<SpaProductPurgeResult> {
    const result = await this.repository.purgeProduct(productId);
    if (result?.ok) {
      await this.refreshItems();
      await this.refreshArchivedProducts();
      await this.refreshProductMetadata();
    }
    return result;
  }

  async selectProductImage(): Promise<ProductImageSelection> {
    return this.repository.selectProductImage();
  }

  private async wait(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private logRenderState(): void {
    console.log(`[stock-page] rendered items count: ${this.itemsSubject.value.length}`);
    console.log('[stock-page] empty state condition:', this.itemsSubject.value.length === 0);
    console.log(`[stock-archives-page] rendered items count: ${this.archivedProductsSubject.value.length}`);
    console.log('[stock-archives-page] empty state condition:', this.archivedProductsSubject.value.length === 0);
    console.log(`[stock-history-page] rendered items count: ${this.movementsSubject.value.length}`);
    console.log('[stock-history-page] empty state condition:', this.movementsSubject.value.length === 0);
  }

  private emitInZone<T>(subject: BehaviorSubject<T>, value: T): void {
    this.zone.run(() => {
      subject.next(value);
    });
  }
}
