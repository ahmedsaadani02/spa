export type StockColor = string;
export type StockCategory = string;
export type StockSerie = string;

export interface StockItem {
  id: string;
  reference: string;
  label: string;
  description?: string;
  category: StockCategory;
  serie: StockSerie;
  unit: string;
  imageUrl: string;
  quantities: Partial<Record<StockColor, number>>;
  lowStockThreshold: number;
  lastUpdated: string;
}

export interface ProductImageSelection {
  canceled: boolean;
  imageRef?: string;
  imageUrl?: string;
  fileName?: string;
  error?: string;
  message?: string;
}

export interface NewStockProductInput {
  reference: string;
  label: string;
  description?: string;
  category: StockCategory;
  serie: StockSerie;
  unit: string;
  colors: StockColor[];
  imageRef?: string | null;
  lowStockThreshold?: number;
}
