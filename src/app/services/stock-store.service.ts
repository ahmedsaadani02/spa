import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StockColor, StockItem } from '../models/stock-item';
import { StockMovement, StockMovementType } from '../models/stock-movement';
import { StockStorageService } from './stock-storage.service';

interface MoveStockInput {
  itemId: string;
  color: StockColor;
  type: StockMovementType;
  delta: number;
  reason: string;
  actor: string;
}

@Injectable({
  providedIn: 'root'
})
export class StockStoreService {
  private readonly itemsSubject = new BehaviorSubject<StockItem[]>([]);
  readonly items$ = this.itemsSubject.asObservable();

  private readonly movementsSubject = new BehaviorSubject<StockMovement[]>([]);
  readonly movements$ = this.movementsSubject.asObservable();

  private loaded = false;

  constructor(private storage: StockStorageService) {}

  async load(): Promise<void> {
    if (this.loaded) return;
    await this.storage.ensureSeed();
    await this.storage.normalizeSeries67();
    await this.refreshItems();
    await this.refreshMovements();
    this.loaded = true;
  }

  async refreshItems(): Promise<void> {
    const all = await this.storage.getAllItems();
    const sorted = [...all].sort((a, b) => {
      const cat = a.category.localeCompare(b.category);
      if (cat !== 0) return cat;
      return a.reference.localeCompare(b.reference);
    });
    this.itemsSubject.next(sorted);
  }

  async refreshMovements(): Promise<void> {
    const all = await this.storage.getAllMovements();
    this.movementsSubject.next(all);
  }

  getSnapshotItems(): StockItem[] {
    return this.itemsSubject.value;
  }

  getSnapshotMovements(): StockMovement[] {
    return this.movementsSubject.value;
  }

  async moveStock(input: MoveStockInput): Promise<void> {
    const items = this.itemsSubject.value;
    const item = items.find((entry) => entry.id === input.itemId);
    if (!item) return;

    const actor = input.actor.trim();
    const reason = input.reason.trim();
    if (!actor || !reason) return;

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
      actor: actor,
      at: new Date().toISOString()
    };

    await this.storage.applyMovement(nextItem, movement);

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
}
