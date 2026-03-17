import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, Subject, combineLatest, debounceTime, distinctUntilChanged, skip, startWith, takeUntil } from 'rxjs';
import { StockColor, StockItem } from '../../models/stock-item';
import { StockStoreService } from '../../services/stock-store.service';
import { AuthService } from '../../services/auth.service';
import type { SpaInventoryResponse, SpaPriceHistoryEntry } from '../../types/electron';

interface CataloguePriceEntry {
  code: string;
  designation: string;
  prix_ttc: number;
}

interface CataloguePriceFile {
  count: number;
  items: Record<string, CataloguePriceEntry>;
}

type PriceStatus = 'ok' | 'missing';

interface InventoryRow {
  item: StockItem;
  qtyBlanc: number;
  qtyGris: number;
  qtyNoir: number;
  qtyTotal: number;
  colors: StockColor[];
  quantityByColor: Record<StockColor, number>;
  unitPrice: number;
  prices: Record<StockColor, number>;
  valuesByColor: Record<StockColor, number>;
  totalValue: number;
  priceStatus: PriceStatus;
}

interface PriceHistoryModalState {
  open: boolean;
  productId: string | null;
  productLabel: string;
  color: StockColor | null;
  colorLabel: string;
  entries: SpaPriceHistoryEntry[];
  loading: boolean;
  restoringId: string | null;
  error: string;
}

interface ColorVisual {
  dot: string;
  ring: string;
  chipBg: string;
  chipBorder: string;
  chipText: string;
}

@Component({
  selector: 'app-inventaire',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './inventaire.component.html',
  styleUrls: ['./inventaire.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventaireComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly catalogueSubject = new BehaviorSubject<Record<string, CataloguePriceEntry>>({});
  private readonly colorVisualCache = new Map<string, ColorVisual>();
  private readonly colorMap: Record<string, string> = {
    blanc: '#f8fafc',
    white: '#f8fafc',
    gris: '#d1d5db',
    grey: '#d1d5db',
    gray: '#d1d5db',
    noir: '#111827',
    black: '#111827',
    rouge: '#dc2626',
    red: '#dc2626',
    bleu: '#2563eb',
    blue: '#2563eb',
    vert: '#16a34a',
    green: '#16a34a',
    jaune: '#eab308',
    yellow: '#eab308',
    orange: '#f97316',
    violet: '#7c3aed',
    purple: '#7c3aed',
    marron: '#92400e',
    brown: '#92400e',
    bronze: '#b45309',
    argent: '#94a3b8',
    silver: '#94a3b8',
    or: '#f59e0b',
    gold: '#f59e0b'
  };
  private allRows: InventoryRow[] = [];

  readonly searchControl = new FormControl<string>('', { nonNullable: true });
  readonly priceControl = new FormControl<string>('', { nonNullable: true });

  rows: InventoryRow[] = [];
  totalStockValue = 0;
  totalProducts = 0;
  filteredStockValue = 0;

  editingProductId: string | null = null;
  editingColor: StockColor | null = null;
  savingEditorKey: string | null = null;
  priceEditError = '';
  priceInteractionMessage = '';

  historyModal: PriceHistoryModalState = {
    open: false,
    productId: null,
    productLabel: '',
    color: null,
    colorLabel: '',
    entries: [],
    loading: false,
    restoringId: null,
    error: ''
  };

  constructor(
    private store: StockStoreService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private auth: AuthService
  ) {}

  private get actor(): string {
    return this.auth.username() ?? 'erp-user';
  }

  get supportsPriceEditing(): boolean {
    return this.store.supportsInventory;
  }

  ngOnInit(): void {
    console.log('[inventaire-page] load requested');
    this.bindSearch();
    void this.initializeDataSources();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByRow = (_: number, row: InventoryRow): string => row.item.id;
  trackByColor = (_: number, color: StockColor): StockColor => color;
  trackByHistory = (_: number, entry: SpaPriceHistoryEntry): string => entry.id;

  colorLabel(color: StockColor): string {
    const normalized = this.normalizeColor(color);
    if (normalized === 'blanc' || normalized === 'white') return 'Blanc';
    if (normalized === 'gris' || normalized === 'grey' || normalized === 'gray') return 'Gris';
    if (normalized === 'noir' || normalized === 'black') return 'Noir';
    return this.humanizeColor(color);
  }

  getColorVisual(color: StockColor): ColorVisual {
    const key = String(color ?? '').trim().toLowerCase();
    if (this.colorVisualCache.has(key)) {
      return this.colorVisualCache.get(key)!;
    }

    const normalized = this.normalizeColor(color);
    let visual: ColorVisual;

    if (normalized === 'blanc' || normalized === 'white') {
      visual = {
        dot: '#ffffff',
        ring: '0 0 0 4px rgba(148, 163, 184, 0.18)',
        chipBg: '#ffffff',
        chipBorder: '#cbd5e1',
        chipText: '#111827'
      };
    } else if (normalized === 'gris' || normalized === 'grey' || normalized === 'gray') {
      visual = {
        dot: '#9ca3af',
        ring: '0 0 0 4px rgba(156, 163, 175, 0.2)',
        chipBg: '#f3f4f6',
        chipBorder: '#d1d5db',
        chipText: '#1f2937'
      };
    } else if (normalized === 'noir' || normalized === 'black') {
      visual = {
        dot: '#111827',
        ring: '0 0 0 4px rgba(17, 24, 39, 0.2)',
        chipBg: '#111827',
        chipBorder: '#111827',
        chipText: '#f9fafb'
      };
    } else {
      visual = this.buildDynamicColorVisual(color);
    }

    this.colorVisualCache.set(key, visual);
    return visual;
  }

  getColorPrice(row: InventoryRow, color: StockColor): number {
    return Number(row.prices[color] ?? 0) || 0;
  }

  getColorQty(row: InventoryRow, color: StockColor): number {
    return Number(row.quantityByColor[color] ?? 0) || 0;
  }

  getRowColors(row: InventoryRow): StockColor[] {
    return row.colors ?? [];
  }

  getColorValue(row: InventoryRow, color: StockColor): number {
    return Number(row.valuesByColor[color] ?? 0) || 0;
  }

  isColorEditing(row: InventoryRow, color: StockColor): boolean {
    return this.editingProductId === row.item.id && this.editingColor === color;
  }

  isSavingColor(row: InventoryRow, color: StockColor): boolean {
    return this.savingEditorKey === this.editorKey(row.item.id, color);
  }

  showAddPrice(row: InventoryRow, color: StockColor): boolean {
    return !this.isColorEditing(row, color) && this.getColorPrice(row, color) <= 0;
  }

  startAddPrice(row: InventoryRow, color: StockColor): void {
    this.startPriceEdit(row, color, true);
  }

  startPriceEdit(row: InventoryRow, color: StockColor, fromAdd = false): void {
    if (!this.supportsPriceEditing) {
      this.priceInteractionMessage = 'Edition des prix indisponible hors mode Electron/SQLite.';
      this.cdr.markForCheck();
      return;
    }
    if (this.savingEditorKey) return;

    this.editingProductId = row.item.id;
    this.editingColor = color;
    this.priceEditError = '';
    this.priceInteractionMessage = '';

    const current = this.getColorPrice(row, color);
    this.priceControl.setValue(fromAdd || current <= 0 ? '' : this.formatPriceInput(current));
    this.cdr.markForCheck();
  }

  onPriceInputKeydown(event: KeyboardEvent, row: InventoryRow, color: StockColor): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      void this.commitPriceEdit(row, color);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelPriceEdit();
    }
  }

  onPriceInputBlur(row: InventoryRow, color: StockColor): void {
    void this.commitPriceEdit(row, color);
  }

  cancelPriceEdit(): void {
    this.editingProductId = null;
    this.editingColor = null;
    this.priceEditError = '';
    this.savingEditorKey = null;
    this.cdr.markForCheck();
  }

  async openPriceHistory(row: InventoryRow, color: StockColor): Promise<void> {
    if (!this.supportsPriceEditing) return;

    this.historyModal = {
      open: true,
      productId: row.item.id,
      productLabel: row.item.label,
      color,
      colorLabel: this.colorLabel(color),
      entries: [],
      loading: true,
      restoringId: null,
      error: ''
    };
    this.cdr.markForCheck();
    await this.loadHistoryEntries(row.item.id, color);
  }

  closePriceHistory(): void {
    this.historyModal = {
      open: false,
      productId: null,
      productLabel: '',
      color: null,
      colorLabel: '',
      entries: [],
      loading: false,
      restoringId: null,
      error: ''
    };
    this.cdr.markForCheck();
  }

  async restoreHistoryPrice(entry: SpaPriceHistoryEntry): Promise<void> {
    const productId = this.historyModal.productId;
    const color = this.historyModal.color;
    if (!productId || !color || this.historyModal.restoringId) return;

    if (!Number.isFinite(entry.oldPrice) || entry.oldPrice < 0) {
      this.historyModal = { ...this.historyModal, error: 'Prix a restaurer invalide.' };
      this.cdr.markForCheck();
      return;
    }

    this.historyModal = { ...this.historyModal, restoringId: entry.id, error: '' };
    this.cdr.markForCheck();

    try {
      const restored = await this.store.restoreProductPrice(productId, color, entry.oldPrice, `${this.actor}:restore`);
      if (!restored) {
        this.historyModal = { ...this.historyModal, restoringId: null, error: 'Restauration impossible.' };
        this.cdr.markForCheck();
        return;
      }

      this.patchRowPrice(productId, color, entry.oldPrice);
      await this.loadHistoryEntries(productId, color);
    } finally {
      this.historyModal = { ...this.historyModal, restoringId: null };
      this.cdr.markForCheck();
    }
  }

  private async initializeDataSources(): Promise<void> {
    await this.store.load();

    if (this.store.supportsInventory) {
      this.store.items$
        .pipe(takeUntil(this.destroy$))
        .pipe(skip(1))
        .subscribe(() => {
          void this.refreshFromIpc();
        });

      await this.refreshFromIpc();
      return;
    }

    this.loadCatalogue();

    combineLatest([this.store.items$, this.catalogueSubject])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([items, catalogue]) => {
        const fallbackRows = this.buildRows(items, catalogue);
        this.setRows(fallbackRows, fallbackRows.reduce((sum, row) => sum + row.totalValue, 0));
      });
  }

  private bindSearch(): void {
    this.searchControl.valueChanges
      .pipe(
        startWith(this.searchControl.getRawValue()),
        debounceTime(120),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((search) => {
        this.applyFilter(search);
        this.cdr.markForCheck();
      });
  }

  private loadCatalogue(): void {
    this.http.get<CataloguePriceFile>('assets/catalogue_prix_norm.json').subscribe({
      next: (data) => {
        this.catalogueSubject.next(data?.items ?? {});
      },
      error: () => {
        console.warn('[inventaire] Catalogue prix introuvable ou invalide.');
        this.catalogueSubject.next({});
      }
    });
  }

  private async refreshFromIpc(): Promise<void> {
    const response = await this.store.getInventory();
    if (!response) {
      this.setRows([], 0);
      return;
    }

    const inventoryRows = this.mapInventoryResponse(response);
    const total = response.totalValue ?? inventoryRows.reduce((sum, row) => sum + row.totalValue, 0);
    this.setRows(inventoryRows, total);
  }

  private async commitPriceEdit(row: InventoryRow, color: StockColor): Promise<void> {
    if (!this.isColorEditing(row, color)) return;
    const key = this.editorKey(row.item.id, color);
    if (this.savingEditorKey === key) return;

    const nextPrice = this.validatePriceInput(this.priceControl.value);
    if (nextPrice === null) {
      this.cdr.markForCheck();
      return;
    }

    const previousPrice = this.getColorPrice(row, color);
    if (Math.abs(previousPrice - nextPrice) < 0.000001) {
      this.cancelPriceEdit();
      return;
    }

    this.savingEditorKey = key;
    this.priceEditError = '';
    this.cdr.markForCheck();

    try {
      const saved = await this.store.updatePrice(row.item.id, color, nextPrice, this.actor);
      if (!saved) {
        this.priceEditError = 'Enregistrement impossible.';
        this.cdr.markForCheck();
        return;
      }

      this.patchRowPrice(row.item.id, color, nextPrice);
      this.cancelPriceEdit();

      if (this.historyModal.open && this.historyModal.productId === row.item.id && this.historyModal.color === color) {
        await this.loadHistoryEntries(row.item.id, color);
      }
    } finally {
      this.savingEditorKey = null;
      this.cdr.markForCheck();
    }
  }

  private patchRowPrice(productId: string, color: StockColor, nextPrice: number): void {
    let totalDiff = 0;

    this.allRows = this.allRows.map((row) => {
      if (row.item.id !== productId) return row;

      const qty = this.getQtyByColor(row, color);
      const oldTotalValue = row.totalValue;
      const nextPrices: Record<StockColor, number> = { ...row.prices, [color]: nextPrice };
      const nextValues: Record<StockColor, number> = { ...row.valuesByColor, [color]: qty * nextPrice };
      const colorKeys = row.colors ?? [];
      const nextTotalValue = colorKeys.reduce((sum, current) => sum + (Number(nextValues[current] ?? 0) || 0), 0);
      const nextUnitPrice = row.qtyTotal > 0
        ? nextTotalValue / row.qtyTotal
        : Math.max(...colorKeys.map((c) => Number(nextPrices[c] ?? 0) || 0), 0);
      totalDiff += nextTotalValue - oldTotalValue;

      return {
        ...row,
        prices: nextPrices,
        valuesByColor: nextValues,
        unitPrice: nextUnitPrice,
        totalValue: nextTotalValue,
        priceStatus: this.computePriceStatus(nextPrices, colorKeys)
      };
    });

    this.totalStockValue += totalDiff;
    this.applyFilter(this.searchControl.getRawValue());
  }

  private async loadHistoryEntries(productId: string, color: StockColor): Promise<void> {
    this.historyModal = { ...this.historyModal, loading: true, error: '' };
    this.cdr.markForCheck();

    const entries = await this.store.getProductPriceHistory(productId, color);
    this.historyModal = {
      ...this.historyModal,
      entries,
      loading: false,
      error: entries.length ? '' : this.historyModal.error
    };
    this.cdr.markForCheck();
  }

  private validatePriceInput(rawValue: string): number | null {
    const normalized = this.normalizeNumericInput(rawValue);
    if (!normalized) {
      this.priceEditError = 'Prix obligatoire.';
      return null;
    }

    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) {
      this.priceEditError = 'Prix invalide.';
      return null;
    }

    if (parsed <= 0) {
      this.priceEditError = 'Le prix doit etre superieur a 0.';
      return null;
    }

    this.priceEditError = '';
    return parsed;
  }

  private normalizeNumericInput(value: string): string {
    return value.trim().replace(',', '.').replace(/\s+/g, '');
  }

  private formatPriceInput(value: number): string {
    const fixed = (Number(value) || 0).toFixed(2);
    return fixed.replace(/\.00$/, '');
  }

  private applyFilter(searchRaw: string): void {
    const needle = searchRaw.trim().toLowerCase();
    const filtered = needle
      ? this.allRows.filter((row) => {
          const reference = this.toSafeLower(row.item.reference);
          const label = this.toSafeLower(row.item.label);
          const description = this.toSafeLower(row.item.description);
          const category = this.toSafeLower(String(row.item.category));
          const serie = this.toSafeLower(String(row.item.serie));
          const colors = this.toSafeLower((row.colors ?? []).join(' '));
          return (
            reference.includes(needle) ||
            label.includes(needle) ||
            description.includes(needle) ||
            category.includes(needle) ||
            serie.includes(needle) ||
            colors.includes(needle)
          );
        })
      : this.allRows;

    this.rows = [...filtered].sort((a, b) => b.totalValue - a.totalValue);
    this.filteredStockValue = this.rows.reduce((sum, row) => sum + row.totalValue, 0);
  }

  private setRows(rows: InventoryRow[], totalValue: number): void {
    this.allRows = rows;
    this.totalProducts = rows.length;
    this.totalStockValue = totalValue;
    this.applyFilter(this.searchControl.getRawValue());
    console.log('[inventaire-page] api response received');
    console.log(`[inventaire-page] rendered items count: ${this.rows.length}`);
    console.log('[inventaire-page] empty state condition:', this.rows.length === 0);
    this.rows.forEach((row) => {
      const renderedColors = this.getRowColors(row);
      console.log(`[inventaire-page] product rendered colors count: ${renderedColors.length}`, {
        productId: row.item.id,
        productLabel: row.item.label
      });
      console.log(`[inventaire-page] product rendered colors: ${JSON.stringify(renderedColors)}`, {
        productId: row.item.id,
        productLabel: row.item.label
      });
    });
    this.cdr.markForCheck();
  }

  private mapInventoryResponse(response: SpaInventoryResponse): InventoryRow[] {
    return response.items.map((entry) => {
      const quantitiesByColorRaw: Record<StockColor, number> = {
        ...(entry.quantityByColor ?? {})
      };
      if (!Object.keys(quantitiesByColorRaw).length) {
        const legacyQuantities: Array<{ color: StockColor; qty: number }> = [
          { color: 'blanc', qty: Number(entry.qtyBlanc ?? 0) || 0 },
          { color: 'gris', qty: Number(entry.qtyGris ?? 0) || 0 },
          { color: 'noir', qty: Number(entry.qtyNoir ?? 0) || 0 }
        ];
        legacyQuantities.forEach(({ color, qty }) => {
          if (qty > 0) {
            quantitiesByColorRaw[color] = qty;
          }
        });
      }

      const pricesRaw: Record<StockColor, number> = {
        ...(entry.priceByColor ?? {})
      };
      const valuesRaw: Record<StockColor, number> = {
        ...(entry.valueByColor ?? {})
      };

      const colors = this.sortColors(Array.from(new Set([
        ...Object.keys(quantitiesByColorRaw),
        ...Object.keys(pricesRaw),
        ...Object.keys(valuesRaw)
      ])));

      const quantityByColor = colors.reduce((acc, color) => {
        acc[color] = Number(quantitiesByColorRaw[color] ?? 0) || 0;
        return acc;
      }, {} as Record<StockColor, number>);

      const prices = colors.reduce((acc, color) => {
        acc[color] = Number(pricesRaw[color] ?? entry.unitPrice ?? 0) || 0;
        return acc;
      }, {} as Record<StockColor, number>);

      const valuesByColor = colors.reduce((acc, color) => {
        const fallback = quantityByColor[color] * prices[color];
        acc[color] = Number(valuesRaw[color] ?? fallback) || 0;
        return acc;
      }, {} as Record<StockColor, number>);

      return {
        item: {
          id: entry.product.id,
          reference: entry.product.reference,
          label: entry.product.label,
          category: entry.product.category as StockItem['category'],
          serie: entry.product.serie as StockItem['serie'],
          unit: entry.product.unit,
          imageUrl: entry.product.imageUrl ?? 'assets/placeholder.png',
          quantities: { ...quantityByColor },
          lowStockThreshold: entry.product.lowStockThreshold ?? 0,
          lastUpdated: entry.product.lastUpdated ?? new Date().toISOString()
        },
        qtyBlanc: entry.qtyBlanc,
        qtyGris: entry.qtyGris,
        qtyNoir: entry.qtyNoir,
        qtyTotal: entry.qtyTotal,
        colors,
        quantityByColor,
        unitPrice: Number(entry.unitPrice ?? 0) || 0,
        prices,
        valuesByColor,
        totalValue: Number(entry.totalValue ?? 0) || 0,
        priceStatus: this.computePriceStatus(prices, colors)
      };
    });
  }

  private buildRows(items: StockItem[], catalogue: Record<string, CataloguePriceEntry>): InventoryRow[] {
    return items.map((item) => {
      const quantityByColor = Object.keys(item.quantities ?? {}).reduce((acc, colorKey) => {
        acc[colorKey] = Number(item.quantities?.[colorKey] ?? 0) || 0;
        return acc;
      }, {} as Record<StockColor, number>);

      const colors = this.sortColors(Array.from(new Set([
        ...Object.keys(quantityByColor)
      ])));
      const qtyBlanc = Number(quantityByColor['blanc'] ?? 0) || 0;
      const qtyGris = Number(quantityByColor['gris'] ?? 0) || 0;
      const qtyNoir = Number(quantityByColor['noir'] ?? 0) || 0;
      const qtyTotal = colors.reduce((sum, color) => sum + (Number(quantityByColor[color] ?? 0) || 0), 0);

      const lookupKey = this.normalizeName(item.label);
      const entry = catalogue[lookupKey];
      const unitPrice = Number(entry?.prix_ttc ?? 0) || 0;
      const prices = colors.reduce((acc, color) => {
        acc[color] = unitPrice;
        return acc;
      }, {} as Record<StockColor, number>);
      const valuesByColor = colors.reduce((acc, color) => {
        acc[color] = (Number(quantityByColor[color] ?? 0) || 0) * unitPrice;
        return acc;
      }, {} as Record<StockColor, number>);
      const totalValue = colors.reduce((sum, color) => sum + (Number(valuesByColor[color] ?? 0) || 0), 0);

      return {
        item,
        qtyBlanc,
        qtyGris,
        qtyNoir,
        qtyTotal,
        colors,
        quantityByColor,
        unitPrice,
        prices,
        valuesByColor,
        totalValue,
        priceStatus: this.computePriceStatus(prices, colors)
      };
    });
  }

  private computePriceStatus(prices: Record<StockColor, number>, colors: StockColor[]): PriceStatus {
    const scope = colors ?? [];
    if (!scope.length) {
      return 'missing';
    }
    return scope.every((color) => (Number(prices[color] ?? 0) || 0) > 0) ? 'ok' : 'missing';
  }

  private getQtyByColor(row: InventoryRow, color: StockColor): number {
    return Number(row.quantityByColor[color] ?? 0) || 0;
  }

  private editorKey(productId: string, color: StockColor): string {
    return `${productId}:${color}`;
  }

  private normalizeName(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private sortColors(colors: StockColor[]): StockColor[] {
    const preferred = ['blanc', 'gris', 'noir'];
    return [...colors].sort((a, b) => {
      const aNorm = String(a).toLowerCase();
      const bNorm = String(b).toLowerCase();
      const aIndex = preferred.indexOf(aNorm);
      const bIndex = preferred.indexOf(bNorm);
      const aOrder = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
      const bOrder = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return aNorm.localeCompare(bNorm);
    });
  }

  private buildDynamicColorVisual(color: StockColor): ColorVisual {
    const base = this.resolveColor(color);
    const rgb = this.hexToRgb(base);

    if (!rgb) {
      return {
        dot: '#94a3b8',
        ring: '0 0 0 4px rgba(148, 163, 184, 0.16)',
        chipBg: '#f3f4f6',
        chipBorder: '#cbd5e1',
        chipText: '#1f2937'
      };
    }

    const chipText = this.getContrastColor(rgb.r, rgb.g, rgb.b);

    return {
      dot: base,
      ring: `0 0 0 4px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`,
      chipBg: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.16)`,
      chipBorder: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`,
      chipText
    };
  }

  private resolveColor(color: StockColor): string {
    const raw = String(color ?? '').trim();
    if (!raw) return '#94a3b8';

    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw)) {
      return raw.length === 4 ? this.expandHex(raw) : raw;
    }

    const normalized = this.normalizeColor(raw);
    if (this.colorMap[normalized]) return this.colorMap[normalized];

    for (const [key, hex] of Object.entries(this.colorMap)) {
      if (normalized.includes(key)) return hex;
    }

    return '#94a3b8';
  }

  private normalizeColor(value: string): string {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private humanizeColor(value: string): string {
    return String(value ?? '')
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  private expandHex(hex: string): string {
    const cleaned = hex.replace('#', '');
    return `#${cleaned[0]}${cleaned[0]}${cleaned[1]}${cleaned[1]}${cleaned[2]}${cleaned[2]}`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const cleaned = hex.replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return null;

    const r = Number.parseInt(cleaned.slice(0, 2), 16);
    const g = Number.parseInt(cleaned.slice(2, 4), 16);
    const b = Number.parseInt(cleaned.slice(4, 6), 16);
    return { r, g, b };
  }

  private getContrastColor(r: number, g: number, b: number): string {
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return luminance < 0.55 ? '#f8fafc' : '#111827';
  }

  private toSafeLower(value: unknown): string {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
  }
}
