import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, combineLatest, startWith, takeUntil } from 'rxjs';
import { StockCategory, StockColor, StockItem, StockSerie } from '../../models/stock-item';
import { StockMovementType } from '../../models/stock-movement';
import { StockStoreService } from '../../services/stock-store.service';

interface StockGroup {
  category: StockCategory;
  serie: StockSerie;
  items: StockItem[];
}

interface MovementModalState {
  open: boolean;
  item: StockItem | null;
  type: StockMovementType;
  availableColors: StockColor[];
}

type ToastType = 'success' | 'error' | 'info';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './stock.component.html',
  styleUrls: ['./stock.component.css']
})
export class StockComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private toastTimer?: number;
  private toastOpenTimer?: number;

  filters = this.fb.group({
    search: [''],
    serie: ['all'],
    category: ['all'],
    color: ['all']
  });

  movementForm = this.fb.group({
    color: ['blanc' as StockColor],
    delta: [1, [Validators.required]],
    adjustSign: ['+' as '+' | '-'],
    reason: ['', Validators.required],
    employeeName: ['Oussema', Validators.required],
    employeeCode: ['', Validators.required]
  });

  groupedItems: StockGroup[] = [];
  totalItems = 0;
  alertItems = 0;

  modal: MovementModalState = {
    open: false,
    item: null,
    type: 'IN',
    availableColors: ['blanc', 'gris', 'noir']
  };

  toast = {
    open: false,
    type: 'info' as ToastType,
    title: '',
    message: ''
  };

  readonly toastIcons: Record<ToastType, string> = {
    success: '\u2705',
    error: '\u274C',
    info: '\u2139\uFE0F'
  };

  readonly employees = [
    { name: 'Oussema', code: '2002' },
    { name: 'Zied', code: '1998' },
    { name: 'Sabri', code: '1705' },
    { name: 'Kamel', code: '1100' }
  ];

  constructor(private fb: FormBuilder, private store: StockStoreService) {}

  async ngOnInit(): Promise<void> {
    await this.store.load();

    combineLatest([
      this.store.items$,
      this.filters.valueChanges.pipe(startWith(this.filters.getRawValue()))
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([items, filters]) => {
        const search = (filters.search ?? '').trim().toLowerCase();
        const serie = filters.serie ?? 'all';
        const category = filters.category ?? 'all';
        const color = filters.color ?? 'all';

        const filtered = items.filter((item) => {
          const matchesSearch = !search ||
            item.reference.toLowerCase().includes(search) ||
            item.label.toLowerCase().includes(search);
          const matchesSerie = serie === 'all' || item.serie === serie;
          const matchesCategory = category === 'all' || item.category === category;
          const matchesColor = color === 'all' || this.hasColor(item, color as StockColor);
          return matchesSearch && matchesSerie && matchesCategory && matchesColor;
        });

        this.totalItems = filtered.length;
        this.alertItems = filtered.filter((item) => this.isLowStock(item)).length;
        this.groupedItems = this.groupByCategory(filtered);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) {
      window.clearTimeout(this.toastTimer);
    }
    if (this.toastOpenTimer) {
      window.clearTimeout(this.toastOpenTimer);
    }
  }

  trackById(index: number, item: StockItem): string {
    return item.id;
  }

  openMove(item: StockItem, type: StockMovementType): void {
    const colors = this.getAvailableColors(item);
    this.modal = {
      open: true,
      item,
      type,
      availableColors: colors
    };

    this.movementForm.reset({
      color: colors[0] ?? 'noir',
      delta: 1,
      adjustSign: '+',
      reason: '',
      employeeName: this.employees[0]?.name ?? '',
      employeeCode: ''
    });
  }

  closeModal(): void {
    this.modal = {
      open: false,
      item: null,
      type: 'IN',
      availableColors: ['blanc', 'gris', 'noir']
    };
  }

  showToast(type: ToastType, message: string): void {
    const title = type === 'success' ? 'Succès' : type === 'error' ? 'Erreur' : 'Info';
    if (this.toastTimer) {
      window.clearTimeout(this.toastTimer);
    }
    if (this.toastOpenTimer) {
      window.clearTimeout(this.toastOpenTimer);
    }

    this.toast = {
      open: false,
      type,
      title,
      message
    };

    this.toastOpenTimer = window.setTimeout(() => {
      this.toast = {
        open: true,
        type,
        title,
        message
      };
      this.toastTimer = window.setTimeout(() => this.closeToast(), 2200);
    }, 10);
  }

  closeToast(): void {
    this.toast = {
      ...this.toast,
      open: false
    };
    if (this.toastTimer) {
      window.clearTimeout(this.toastTimer);
      this.toastTimer = undefined;
    }
    if (this.toastOpenTimer) {
      window.clearTimeout(this.toastOpenTimer);
      this.toastOpenTimer = undefined;
    }
  }

  async submitMovement(): Promise<void> {
    if (!this.modal.item) return;
    if (this.movementForm.invalid) {
      this.movementForm.markAllAsTouched();
      return;
    }

    const raw = this.movementForm.getRawValue();
    const delta = Math.abs(Number(raw.delta) || 0);
    if (delta === 0) return;

    const employeeName = raw.employeeName ?? '';
    const employeeCode = String(raw.employeeCode ?? '').trim();
    const employee = this.employees.find((candidate) => candidate.name === employeeName);
    if (!employee || employee.code !== employeeCode) {
      this.showToast('error', 'Code employé incorrect');
      return;
    }

    const signedDelta = this.modal.type === 'ADJUST'
      ? (raw.adjustSign === '-' ? -delta : delta)
      : delta;

    await this.store.moveStock({
      itemId: this.modal.item.id,
      color: raw.color as StockColor,
      type: this.modal.type,
      delta: signedDelta,
      reason: raw.reason ?? '',
      actor: employeeName
    });

    const toastType: ToastType = this.modal.type === 'IN' ? 'success' : 'info';
    const toastMessage = this.modal.type === 'IN'
      ? 'Produit ajouté'
      : this.modal.type === 'OUT'
        ? 'Produit retiré'
        : 'Stock ajusté';
    this.showToast(toastType, toastMessage);
    this.closeModal();
  }

  getQuantity(item: StockItem, color: StockColor): number {
    return Number(item.quantities[color] ?? 0) || 0;
  }

  getColorStatus(item: StockItem, color: StockColor): 'is-zero' | 'is-low' | 'is-ok' {
    const quantity = this.getQuantity(item, color);
    if (quantity <= 0) return 'is-zero';
    if (quantity <= 3) return 'is-low';
    return 'is-ok';
  }

  getColorStatusLabel(item: StockItem, color: StockColor): string {
    const status = this.getColorStatus(item, color);
    if (status === 'is-zero') return 'Rupture';
    if (status === 'is-low') return 'Stock épuisé';
    return 'OK';
  }

  getAvailableColors(item: StockItem): StockColor[] {
    const colors = Object.keys(item.quantities) as StockColor[];
    const order: StockColor[] = ['blanc', 'gris', 'noir'];
    const sorted = colors.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    return sorted.length > 0 ? sorted : ['noir'];
  }

  isItemFullyOut(item: StockItem): boolean {
    const colors = this.getAvailableColors(item);
    return colors.every((color) => this.getQuantity(item, color) <= 0);
  }

  isLowStock(item: StockItem): boolean {
    const colors = this.getAvailableColors(item);
    return colors.some((color) => this.getQuantity(item, color) <= item.lowStockThreshold);
  }

  private hasColor(item: StockItem, color: StockColor): boolean {
    return Object.prototype.hasOwnProperty.call(item.quantities, color);
  }

  private groupByCategory(items: StockItem[]): StockGroup[] {
    const map = new Map<string, StockItem[]>();
    items.forEach((item) => {
      const key = `${item.serie}|${item.category}`;
      const group = map.get(key) ?? [];
      group.push(item);
      map.set(key, group);
    });

    return Array.from(map.entries()).map(([key, groupItems]) => {
      const [serie, category] = key.split('|') as [StockSerie, StockCategory];
      return {
        serie,
        category,
        items: groupItems
      };
    });
  }
}
