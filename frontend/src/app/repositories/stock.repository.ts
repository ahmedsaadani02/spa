import { InjectionToken } from '@angular/core';
import { NewStockProductInput, ProductImageSelection, StockColor, StockItem } from '../models/stock-item';
import { StockMovement } from '../models/stock-movement';
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

export interface StockRepository {
  readonly supportsInventory: boolean;
  initialize(): Promise<void>;
  getItems(): Promise<StockItem[]>;
  getMovements(): Promise<StockMovement[]>;
  applyMovement(item: StockItem, movement: StockMovement): Promise<void>;
  createProduct(payload: NewStockProductInput): Promise<boolean>;
  updateProduct(productId: string, payload: NewStockProductInput): Promise<SpaProductUpdateResult>;
  archiveProduct(productId: string): Promise<boolean>;
  restoreProduct(productId: string): Promise<SpaProductRestoreResult>;
  purgeProduct(productId: string): Promise<SpaProductPurgeResult>;
  listArchivedProducts(): Promise<SpaProductRow[]>;
  getProductMetadata(): Promise<SpaProductMetadata>;
  addProductMetadata(kind: 'category' | 'serie' | 'color', value: string): Promise<SpaProductMetadataAddResult>;
  selectProductImage(): Promise<ProductImageSelection>;
  getInventory(): Promise<SpaInventoryResponse | null>;
  updateProductPrice(productId: string, color: StockColor, newPrice: number, changedBy?: string): Promise<boolean>;
  getProductPriceHistory(productId: string, color: StockColor): Promise<SpaPriceHistoryEntry[]>;
  restoreProductPrice(productId: string, color: StockColor, targetPrice: number, changedBy?: string): Promise<boolean>;
}

export const STOCK_REPOSITORY = new InjectionToken<StockRepository>('STOCK_REPOSITORY');
