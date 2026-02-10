import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Subject, combineLatest, startWith, takeUntil } from 'rxjs';
import { StockCategory } from '../../models/stock-item';
import { StockMovement } from '../../models/stock-movement';
import { StockStoreService } from '../../services/stock-store.service';

interface MovementView {
  movement: StockMovement;
  category: StockCategory;
}

@Component({
  selector: 'app-stock-history',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './stock-history.component.html',
  styleUrls: ['./stock-history.component.css']
})
export class StockHistoryComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  filters = this.fb.group({
    month: [this.currentMonth()],
    reference: [''],
    color: ['all'],
    actor: [''],
    category: ['all']
  });

  summary = {
    inTotal: 0,
    outTotal: 0,
    net: 0,
    count: 0
  };

  movements: MovementView[] = [];

  constructor(private fb: FormBuilder, private store: StockStoreService) {}

  ngOnInit(): void {
    void this.store.load();

    combineLatest([
      this.store.movements$,
      this.filters.valueChanges.pipe(startWith(this.filters.getRawValue()))
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([movements, filters]) => {
        const month = filters.month ?? this.currentMonth();
        const reference = (filters.reference ?? '').trim().toLowerCase();
        const color = filters.color ?? 'all';
        const actor = (filters.actor ?? '').trim().toLowerCase();
        const category = filters.category ?? 'all';
        const monthMovements = movements.filter((movement) => movement.at.startsWith(month));

        this.summary = this.store.getMonthlySummary(month);

        const filtered = monthMovements.filter((movement) => {
          const refText = `${movement.reference} ${movement.label}`.toLowerCase();
          const matchesReference = !reference || refText.includes(reference);
          const matchesColor = color === 'all' || movement.color === color;
          const matchesActor = !actor || movement.actor.toLowerCase().includes(actor);
          const matchesCategory = category === 'all' || movement.category === category;
          return matchesReference && matchesColor && matchesActor && matchesCategory;
        });

        this.movements = filtered.map((movement) => ({
          movement,
          category: movement.category
        }));
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatType(type: string): string {
    if (type === 'IN') return 'Entree';
    if (type === 'OUT') return 'Sortie';
    return 'Ajust';
  }

  formatDelta(value: number): string {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value}`;
  }

  private currentMonth(): string {
    return new Date().toISOString().slice(0, 7);
  }
}
