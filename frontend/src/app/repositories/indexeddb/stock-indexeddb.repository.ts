import { Injectable } from '@angular/core';
import { NewStockProductInput, ProductImageSelection, StockColor, StockItem } from '../../models/stock-item';
import { StockMovement } from '../../models/stock-movement';
import { StockStorageService } from '../../services/stock-storage.service';
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
export class StockIndexedDbRepository implements StockRepository {
  readonly supportsInventory = false;

  constructor(private storage: StockStorageService) {}

  async initialize(): Promise<void> {
    await this.storage.ensureSeed();
    await this.storage.normalizeSeries67();
    await this.storage.normalizeLabelsAndReferences();
  }

  async getItems(): Promise<StockItem[]> {
    return this.storage.getAllItems();
  }

  async getMovements(): Promise<StockMovement[]> {
    return this.storage.getAllMovements();
  }

  async applyMovement(item: StockItem, movement: StockMovement): Promise<void> {
    await this.storage.applyMovement(item, movement);
  }

  async createProduct(payload: NewStockProductInput): Promise<boolean> {
    void payload;
    return false;
  }

  async updateProduct(productId: string, payload: NewStockProductInput): Promise<SpaProductUpdateResult> {
    void productId;
    void payload;
    return { ok: false, message: 'UNSUPPORTED_OFFLINE' };
  }

  async archiveProduct(productId: string): Promise<boolean> {
    void productId;
    return false;
  }

  async restoreProduct(productId: string): Promise<SpaProductRestoreResult> {
    void productId;
    return { ok: false, message: 'UNSUPPORTED_OFFLINE' };
  }

  async purgeProduct(productId: string): Promise<SpaProductPurgeResult> {
    void productId;
    return { ok: false, message: 'UNSUPPORTED_OFFLINE' };
  }

  async listArchivedProducts(): Promise<SpaProductRow[]> {
    return [];
  }

  async getProductMetadata(): Promise<SpaProductMetadata> {
    return {
      categories: ['profil', 'accessoire', 'joint'],
      series: ['40', '67', 'porte-securite'],
      colors: ['blanc', 'gris', 'noir']
    };
  }

  async addProductMetadata(kind: 'category' | 'serie' | 'color', value: string): Promise<SpaProductMetadataAddResult> {
    void kind;
    void value;
    return { ok: false, message: 'UNSUPPORTED_OFFLINE' };
  }

  async selectProductImage(): Promise<ProductImageSelection> {
    return { canceled: true };
  }

  async getInventory(): Promise<SpaInventoryResponse | null> {
    return null;
  }

  async updateProductPrice(productId: string, color: StockColor, newPrice: number, changedBy?: string): Promise<boolean> {
    void productId;
    void color;
    void newPrice;
    void changedBy;
    return false;
  }

  async getProductPriceHistory(productId: string, color: StockColor): Promise<SpaPriceHistoryEntry[]> {
    void productId;
    void color;
    return [];
  }

  async restoreProductPrice(productId: string, color: StockColor, targetPrice: number, changedBy?: string): Promise<boolean> {
    void productId;
    void color;
    void targetPrice;
    void changedBy;
    return false;
  }
}
