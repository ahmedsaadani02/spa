export type StockColor = 'blanc' | 'gris' | 'noir';
export type StockCategory = 'profil' | 'accessoire' | 'joint';
export type StockSerie = '40' | '67' | 'porte-securite';

export interface StockItem {
  id: string;
  reference: string;
  label: string;
  category: StockCategory;
  serie: StockSerie;
  unit: string;
  imageUrl: string;
  quantities: Partial<Record<StockColor, number>>;
  lowStockThreshold: number;
  lastUpdated: string;
}
