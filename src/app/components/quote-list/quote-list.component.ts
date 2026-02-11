import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, combineLatest, map, startWith, takeUntil } from 'rxjs';
import { Quote } from '../../models/quote';
import { QuoteCalcService } from '../../services/quote-calc.service';
import { QuoteStoreService } from '../../services/quote-store.service';

type MonthGroup<T> = {
  key: string;
  label: string;
  items: T[];
};

type ToastType = 'info' | 'success' | 'error';

@Component({
  selector: 'app-quote-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './quote-list.component.html',
  styleUrls: ['./quote-list.component.css']
})
export class QuoteListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private toastTimer?: number;
  private printFallbackTimer?: number;

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly monthControl = new FormControl('all', { nonNullable: true });

  isPrintMode = false;
  printDate: Date | null = null;
  selectedMonthLabel = '';
  private printQuotesSnapshot: Quote[] = [];

  private afterPrintHandler = () => {
    if (!this.isPrintMode) return;
    this.isPrintMode = false;
    this.cdr.detectChanges();
    if (this.printFallbackTimer) {
      window.clearTimeout(this.printFallbackTimer);
      this.printFallbackTimer = undefined;
    }
  };

  toast = {
    open: false,
    type: 'info' as ToastType,
    message: ''
  };

  readonly filteredQuotes$ = combineLatest([
    this.store.quotes$,
    this.searchControl.valueChanges.pipe(startWith(''))
  ]).pipe(
    map(([quotes, term]) => {
      const query = term.trim().toLowerCase();
      if (!query) {
        return quotes;
      }

      return quotes.filter((quote) => {
        return (
          quote.numero.toLowerCase().includes(query) ||
          quote.client.nom.toLowerCase().includes(query)
        );
      });
    })
  );

  private readonly baseGroups$ = this.filteredQuotes$.pipe(
    map((quotes) => {
      const groups = this.buildMonthGroups(quotes);
      this.ensureMonthSelection(groups);
      return groups;
    })
  );

  readonly groupedQuotes$ = combineLatest([
    this.baseGroups$,
    this.monthControl.valueChanges.pipe(startWith(this.monthControl.value))
  ]).pipe(
    map(([groups, key]) => {
      if (!key || key === 'all') return groups;
      return groups.filter((group) => group.key === key);
    })
  );

  readonly monthOptions$ = this.baseGroups$.pipe(
    map((groups) => groups.map((group) => ({ key: group.key, label: group.label })))
  );

  readonly selectedMonthLabel$ = combineLatest([
    this.monthOptions$,
    this.monthControl.valueChanges.pipe(startWith(this.monthControl.value))
  ]).pipe(
    map(([options, key]) => {
      if (!key || key === 'all') return 'Tous les mois';
      return options.find((option) => option.key === key)?.label ?? 'Tous les mois';
    })
  );

  readonly printQuotes$ = combineLatest([
    this.filteredQuotes$,
    this.monthControl.valueChanges.pipe(startWith(this.monthControl.value))
  ]).pipe(
    map(([quotes, key]) => {
      if (!key || key === 'all') {
        return this.sortQuotes(quotes);
      }
      const filtered = quotes.filter((quote) => {
        return this.getMonthKey(this.parseDate(quote.date)) === key;
      });
      return this.sortQuotes(filtered);
    })
  );

  constructor(
    private store: QuoteStoreService,
    private calc: QuoteCalcService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    await this.store.load();

    window.addEventListener('afterprint', this.afterPrintHandler);

    this.selectedMonthLabel$
      .pipe(takeUntil(this.destroy$))
      .subscribe((label) => {
        this.selectedMonthLabel = label;
      });

    this.printQuotes$
      .pipe(takeUntil(this.destroy$))
      .subscribe((list) => {
        this.printQuotesSnapshot = list;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('afterprint', this.afterPrintHandler);
    if (this.toastTimer) {
      window.clearTimeout(this.toastTimer);
    }
    if (this.printFallbackTimer) {
      window.clearTimeout(this.printFallbackTimer);
    }
  }

  totalHorsTVA(quote: Quote): number {
    return this.calc.totals(quote).totalHorsTVA;
  }

  async deleteQuote(quote: Quote): Promise<void> {
    const confirmed = confirm(`Supprimer le devis ${quote.numero} ?`);
    if (!confirmed) {
      return;
    }

    await this.store.delete(quote.id);
  }

  printSelectedMonth(): void {
    if (!this.printQuotesSnapshot.length) {
      this.showToast('info', 'Aucun devis pour ce mois');
      return;
    }

    this.printDate = new Date();
    this.isPrintMode = true;
    this.cdr.detectChanges();

    window.setTimeout(() => window.print(), 50);

    if (this.printFallbackTimer) {
      window.clearTimeout(this.printFallbackTimer);
    }
    this.printFallbackTimer = window.setTimeout(() => this.afterPrintHandler(), 1000);
  }

  showToast(type: ToastType, message: string): void {
    this.toast = {
      open: true,
      type,
      message
    };

    if (this.toastTimer) {
      window.clearTimeout(this.toastTimer);
    }
    this.toastTimer = window.setTimeout(() => this.closeToast(), 2200);
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
  }

  private ensureMonthSelection(groups: MonthGroup<Quote>[]): void {
    if (!groups.length) {
      if (this.monthControl.value !== 'all') {
        this.monthControl.setValue('all', { emitEvent: false });
      }
      return;
    }
    const current = this.monthControl.value;
    if (!current || current === 'all') {
      return;
    }
    if (!groups.some((group) => group.key === current)) {
      this.monthControl.setValue('all', { emitEvent: false });
    }
  }

  private buildMonthGroups(quotes: Quote[]): MonthGroup<Quote>[] {
    const sorted = [...quotes].sort((a, b) => this.toTime(b.date) - this.toTime(a.date));
    const groups = new Map<string, MonthGroup<Quote>>();

    sorted.forEach((quote) => {
      const date = this.parseDate(quote.date);
      const key = this.getMonthKey(date);
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          label: this.formatMonthLabel(date),
          items: []
        });
      }
      groups.get(key)?.items.push(quote);
    });

    return Array.from(groups.values());
  }

  private parseDate(value: string): Date {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return new Date(0);
    }
    return parsed;
  }

  private toTime(value: string): number {
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  private getMonthKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private formatMonthLabel(date: Date): string {
    const label = new Date(date.getFullYear(), date.getMonth(), 1)
      .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  private sortQuotes(quotes: Quote[]): Quote[] {
    return [...quotes].sort((a, b) => {
      const diff = this.toTime(b.date) - this.toTime(a.date);
      if (diff !== 0) return diff;
      return b.numero.localeCompare(a.numero);
    });
  }
}
