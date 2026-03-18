import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, combineLatest, map, startWith, takeUntil } from 'rxjs';
import { Quote } from '../../models/quote';
import { QuoteCalcService } from '../../services/quote-calc.service';
import { InvoiceStoreService } from '../../services/invoice-store.service';
import { QuoteStoreService } from '../../services/quote-store.service';
import { AuthService } from '../../services/auth.service';
import { ElectronService } from '../../services/electron.service';

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
  private readonly invoiceIdSet = new Set<string>();
  private readonly invoiceByQuoteId = new Map<string, string>();

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

  convertConfirm = {
    open: false,
    quote: null as Quote | null,
    submitting: false
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
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private invoices: InvoiceStoreService,
    private auth: AuthService,
    private router: Router,
    private electron: ElectronService
  ) {}

  get canConvertToInvoice(): boolean {
    return this.auth.hasPermission('manageQuotes') && this.auth.hasPermission('manageInvoices');
  }

  hasLinkedInvoice(quote: Quote): boolean {
    return !!this.getLinkedInvoiceId(quote);
  }

  private hasQuoteConversionMarker(quote: Quote | null | undefined): boolean {
    return !!quote && (quote.status === 'invoiced' || !!quote.convertedInvoiceId);
  }

  private isConvertedQuoteVisible(quote: Quote | null | undefined): boolean {
    return this.hasQuoteConversionMarker(quote) || !!this.getLinkedInvoiceId(quote);
  }

  async ngOnInit(): Promise<void> {
    console.log('[quotes-page] route entered');
    console.log('[quotes-page] load requested');
    await Promise.all([this.store.load(), this.invoices.load()]);
    await Promise.all([this.store.refresh(), this.invoices.refresh()]);
    this.rebuildInvoiceLookup();
    const snapshot = this.store.getSnapshot();
    console.log('[quotes-page] response received');
    console.log(`[quotes-page] mapped quotes count: ${snapshot.length}`);
    console.log(`[quotes-page] converted quotes count: ${this.countConvertedQuotes(snapshot)}`);
    console.log('[quotes-page] empty state condition:', snapshot.length === 0);
    this.triggerRenderReady('initial-load');

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

    this.filteredQuotes$
      .pipe(takeUntil(this.destroy$))
      .subscribe((list) => {
        console.log(`[quotes-page] mapped quotes count: ${list.length}`);
        console.log(`[quotes-page] converted quotes count: ${this.countConvertedQuotes(list)}`);
        console.log('[quotes-page] empty state condition:', list.length === 0);
      });

    this.invoices.invoices$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.rebuildInvoiceLookup();
        const currentQuotes = this.store.getSnapshot();
        console.log(`[quotes-page] converted quotes count: ${this.countConvertedQuotes(currentQuotes)}`);
        this.triggerRenderReady('invoice-lookup-updated');
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

  convertToInvoice(quote: Quote): void {
    if (!this.canConvertToInvoice) {
      this.showToast('error', 'Acces refuse.');
      return;
    }

    const linkedInvoiceId = this.getLinkedInvoiceId(quote);
    if (linkedInvoiceId) {
      this.showToast('info', 'Ce devis a deja ete converti en facture.');
      void this.router.navigate(['/invoices', linkedInvoiceId, 'preview']);
      return;
    }

    this.convertConfirm = {
      open: true,
      quote,
      submitting: false
    };
    console.log('[quote-convert] confirmation opened', { quoteId: quote.id, numero: quote.numero });
  }

  cancelConvertToInvoice(): void {
    if (this.convertConfirm.submitting) return;
    console.log('[quote-convert] confirmation cancelled');
    this.convertConfirm = {
      open: false,
      quote: null,
      submitting: false
    };
  }

  async confirmConvertToInvoice(): Promise<void> {
    const quote = this.convertConfirm.quote;
    if (!quote || this.convertConfirm.submitting) {
      return;
    }
    console.log('[quote-convert] confirmation accepted', { quoteId: quote.id, numero: quote.numero });
    this.convertConfirm = {
      ...this.convertConfirm,
      submitting: true
    };

    const result = await this.store.convertToInvoice(quote.id);
    if (!result.ok && !result.alreadyConverted) {
      this.showToast('error', result.message || 'Conversion impossible.');
      this.convertConfirm = {
        open: false,
        quote: null,
        submitting: false
      };
      return;
    }

    await this.invoices.load();
    await this.store.refresh();
    this.rebuildInvoiceLookup();
    this.showToast(result.alreadyConverted ? 'info' : 'success', result.alreadyConverted
      ? 'Ce devis a deja ete converti en facture.'
      : 'Facture creee avec succes.');
    this.convertConfirm = {
      open: false,
      quote: null,
      submitting: false
    };

    if (result.invoiceId) {
      void this.router.navigate(['/invoices', result.invoiceId, 'preview']);
    }
  }

  duplicateQuote(quote: Quote): void {
    void this.router.navigate(['/quotes/new'], { queryParams: { fromQuoteId: quote.id } });
  }

  getLinkedInvoiceId(quote: Quote | null | undefined): string | null {
    if (!quote?.id) return null;
    if (quote.convertedInvoiceId) {
      // Keep converted badge/link visible on first render from quote payload itself.
      // Once invoices are loaded, the ID is still validated against invoice lookup.
      if (this.invoiceIdSet.size === 0 || this.invoiceIdSet.has(quote.convertedInvoiceId)) {
        return quote.convertedInvoiceId;
      }
    }
    return this.invoiceByQuoteId.get(quote.id) ?? null;
  }

  async printSelectedMonth(): Promise<void> {
    if (!this.printQuotesSnapshot.length) {
      this.showToast('info', 'Aucun devis pour ce mois');
      return;
    }

    this.printDate = new Date();
    this.isPrintMode = true;
    this.cdr.detectChanges();

    if (this.electron.isElectron) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const result = await this.electron.printDocument('quote', this.selectedMonthLabel || 'devis');
      this.isPrintMode = false;
      this.cdr.detectChanges();
      if (result && !result.ok && !result.canceled) {
        this.showToast('error', result.message || 'Impression impossible.');
      }
      return;
    }

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

  private rebuildInvoiceLookup(): void {
    this.invoiceIdSet.clear();
    this.invoiceByQuoteId.clear();
    this.invoices.getSnapshot().forEach((invoice) => {
      if (invoice?.id) {
        this.invoiceIdSet.add(invoice.id);
      }
      if (invoice?.quoteId && invoice?.id) {
        this.invoiceByQuoteId.set(invoice.quoteId, invoice.id);
      }
    });
  }

  private countConvertedQuotes(list: Quote[]): number {
    return list.filter((quote) => this.isConvertedQuoteVisible(quote)).length;
  }

  private triggerRenderReady(context: string): void {
    this.zone.run(() => {
      this.cdr.detectChanges();
      console.log('[quotes-page] render ready', { context });
    });
  }
}
