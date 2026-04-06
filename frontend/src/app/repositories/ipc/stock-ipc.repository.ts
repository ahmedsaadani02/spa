import { Injectable } from '@angular/core';
import { NewStockProductInput, ProductImageSelection, StockColor, StockItem } from '../../models/stock-item';
import { StockMovement } from '../../models/stock-movement';
import { AppApiService } from '../../services/app-api.service';
import type {
  SpaInventoryResponse,
  SpaProductMetadataAddResult,
  SpaPriceHistoryEntry,
  SpaProductMetadata,
  SpaProductPurgeResult,
  SpaProductRestoreResult,
  SpaProductRow,
  SpaProductUpdateResult
} from '../../types/electron';
import { StockRepository } from '../stock.repository';

@Injectable({
  providedIn: 'root'
})
export class StockIpcRepository implements StockRepository {
  readonly supportsInventory = true;

  constructor(private ipc: AppApiService) {}

  async initialize(): Promise<void> {
    return;
  }

  async getItems(): Promise<StockItem[]> {
    return this.ipc.stockGetItems();
  }

  async getMovements(): Promise<StockMovement[]> {
    return this.ipc.movementsList();
  }

  async applyMovement(item: StockItem, movement: StockMovement): Promise<void> {
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

  async createProduct(payload: NewStockProductInput): Promise<boolean> {
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

  async updateProduct(productId: string, payload: NewStockProductInput): Promise<SpaProductUpdateResult> {
    return this.ipc.productsUpdate(productId, {
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
  }

  async archiveProduct(productId: string): Promise<boolean> {
    const result = await this.ipc.productsArchive(productId);
    if (result?.ok) {
      return true;
    }
    throw new Error(result?.message || 'PRODUCT_ARCHIVE_FAILED');
  }

  async restoreProduct(productId: string): Promise<SpaProductRestoreResult> {
    return this.ipc.productsRestore(productId);
  }

  async purgeProduct(productId: string): Promise<SpaProductPurgeResult> {
    return this.ipc.productsPurge(productId);
  }

  async listArchivedProducts(): Promise<SpaProductRow[]> {
    return this.ipc.productsListArchived();
  }

  async getProductMetadata(): Promise<SpaProductMetadata> {
    return this.ipc.productsMetadata();
  }

  async addProductMetadata(kind: 'category' | 'serie' | 'color', value: string): Promise<SpaProductMetadataAddResult> {
    return this.ipc.productsAddMetadata(kind, value);
  }

  async selectProductImage(): Promise<ProductImageSelection> {
    return this.ipc.productsSelectImage();
  }

  async getInventory(): Promise<SpaInventoryResponse | null> {
    return this.ipc.inventoryGet();
  }

  async updateProductPrice(productId: string, color: StockColor, newPrice: number, changedBy = 'erp-user'): Promise<boolean> {
    return this.ipc.productsUpdatePrice(productId, color, newPrice, changedBy);
  }

  async getProductPriceHistory(productId: string, color: StockColor): Promise<SpaPriceHistoryEntry[]> {
    return this.ipc.productsPriceHistory(productId, color);
  }

  async restoreProductPrice(productId: string, color: StockColor, targetPrice: number, changedBy = 'erp-user'): Promise<boolean> {
    return this.ipc.productsRestorePrice(productId, color, targetPrice, changedBy);
  }
}
