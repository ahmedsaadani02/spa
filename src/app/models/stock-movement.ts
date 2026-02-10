import { StockCategory, StockColor, StockSerie } from './stock-item';

export type StockMovementType = 'IN' | 'OUT' | 'ADJUST';

export interface StockMovement {
  id: string;
  itemId: string;
  reference: string;
  label: string;
  category: StockCategory;
  serie: StockSerie;
  color: StockColor;
  type: StockMovementType;
  delta: number;
  before: number;
  after: number;
  reason: string;
  actor: string;
  at: string;
}
