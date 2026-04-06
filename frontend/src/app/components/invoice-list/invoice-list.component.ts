import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, combineLatest, map, startWith, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { Invoice } from '../../models/invoice';
import { InvoiceCalcService } from '../../services/invoice-calc.service';
import { InvoiceStoreService } from '../../services/invoice-store.service';
import { DocumentsService } from '../../services/documents.service';
import {
  getInvoiceDisplayNumber,
  getInvoicePaymentStatusClass,
  getInvoicePaymentStatusLabel
} from '../../utils/invoice-payload';

type MonthGroup<T> = {
  key: string;
  label: string;
  items: T[];
};

type ToastType = 'info' | 'success' | 'error';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.css']
})
export class InvoiceListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private toastTimer?: number;
  private printFallbackTimer?: number;

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly monthControl = new FormControl('all', { nonNullable: true });

  isPrintMode = false;
  printDate: Date | null = null;
  selectedMonthLabel = '';
  private printInvoicesSnapshot: Invoice[] = [];

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

  deleteConfirm = {
    open: false,
    invoice: null as Invoice | null,
    submitting: false
  };

  readonly filteredInvoices$ = combineLatest([
    this.store.invoices$,
    this.searchControl.valueChanges.pipe(startWith(''))
  ]).pipe(
    map(([invoices, term]) => {
      const query = term.trim().toLowerCase();
      if (!query) return invoices;
      return invoices.filter((invoice) =>
        invoice.numero.toLowerCase().includes(query) ||
        (invoice.customInvoiceNumber || '').toLowerCase().includes(query) ||
        invoice.client.nom.toLowerCase().includes(query)
      );
    })
  );

  private readonly baseGroups$ = this.filteredInvoices$.pipe(
    map((invoices) => {
      const groups = this.buildMonthGroups(invoices);
      this.ensureMonthSelection(groups);
      return groups;
    })
  );

  readonly groupedInvoices$ = combineLatest([
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

  readonly printInvoices$ = combineLatest([
    this.filteredInvoices$,
    this.monthControl.valueChanges.pipe(startWith(this.monthControl.value))
  ]).pipe(
    map(([invoices, key]) => {
      if (!key || key === 'all') return this.sortInvoices(invoices);
      const filtered = invoices.filter((invoice) =>
        this.getMonthKey(this.parseDate(invoice.date)) === key
      );
      return this.sortInvoices(filtered);
    })
  );

  constructor(
    private store: InvoiceStoreService,
    private calc: InvoiceCalcService,
    private cdr: ChangeDetectorRef,
    private electron: DocumentsService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    console.log('[invoices-page] load requested');
    window.addEventListener('afterprint', this.afterPrintHandler);

    this.selectedMonthLabel$
      .pipe(takeUntil(this.destroy$))
      .subscribe((label) => {
        this.selectedMonthLabel = label;
      });

    this.printInvoices$
      .pipe(takeUntil(this.destroy$))
      .subscribe((list) => {
        this.printInvoicesSnapshot = list;
      });

    this.filteredInvoices$
      .pipe(takeUntil(this.destroy$))
      .subscribe((list) => {
        console.log(`[invoices-page] rendered items count: ${list.length}`);
        console.log('[invoices-page] empty state condition:', list.length === 0);
      });

    void this.store.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('afterprint', this.afterPrintHandler);
    if (this.toastTimer) window.clearTimeout(this.toastTimer);
    if (this.printFallbackTimer) window.clearTimeout(this.printFallbackTimer);
  }

  totalTTC(invoice: Invoice): number {
    return this.calc.totals(invoice).totalTTC;
  }

  displayNumber(invoice: Invoice): string {
    return getInvoiceDisplayNumber(invoice);
  }

  paymentStatusLabel(invoice: Invoice): string {
    return getInvoicePaymentStatusLabel(invoice);
  }

  paymentStatusClass(invoice: Invoice): string {
    return getInvoicePaymentStatusClass(invoice);
  }

  showInternalNumber(invoice: Invoice): boolean {
    return this.displayNumber(invoice) !== invoice.numero;
  }

  requestDeleteInvoice(invoice: Invoice): void {
    this.deleteConfirm = {
      open: true,
      invoice,
      submitting: false
    };
  }

  cancelDeleteInvoice(): void {
    if (this.deleteConfirm.submitting) return;
    this.deleteConfirm = {
      open: false,
      invoice: null,
      submitting: false
    };
  }

  async confirmDeleteInvoice(): Promise<void> {
    const invoice = this.deleteConfirm.invoice;
    if (!invoice || this.deleteConfirm.submitting) return;

    this.deleteConfirm = {
      ...this.deleteConfirm,
      submitting: true
    };

    await this.store.delete(invoice.id);
    this.deleteConfirm = {
      open: false,
      invoice: null,
      submitting: false
    };
  }

  duplicateInvoice(invoice: Invoice): void {
    void this.router.navigate(['/invoices/new'], { queryParams: { fromInvoiceId: invoice.id } });
  }

  async printSelectedMonth(): Promise<void> {
    if (!this.printInvoicesSnapshot.length) {
      this.showToast('info', 'Aucune facture pour ce mois');
      return;
    }

    this.printDate = new Date();
    this.isPrintMode = true;
    this.cdr.detectChanges();

    if (this.electron.isElectron) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const result = await this.electron.printDocument('invoice', this.selectedMonthLabel || 'factures');
      this.isPrintMode = false;
      this.cdr.detectChanges();
      if (result && !result.ok && !result.canceled) {
        this.showToast('error', result.message || 'Impression impossible.');
      }
      return;
    }

    window.setTimeout(() => window.print(), 50);

    if (this.printFallbackTimer) window.clearTimeout(this.printFallbackTimer);
    this.printFallbackTimer = window.setTimeout(() => this.afterPrintHandler(), 1000);
  }

  showToast(type: ToastType, message: string): void {
    this.toast = { open: true, type, message };
    if (this.toastTimer) window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.closeToast(), 2200);
  }

  closeToast(): void {
    this.toast = { ...this.toast, open: false };
    if (this.toastTimer) {
      window.clearTimeout(this.toastTimer);
      this.toastTimer = undefined;
    }
  }

  private ensureMonthSelection(groups: MonthGroup<Invoice>[]): void {
    if (!groups.length) {
      if (this.monthControl.value !== 'all') {
        this.monthControl.setValue('all', { emitEvent: false });
      }
      return;
    }
    const current = this.monthControl.value;
    if (!current || current === 'all') return;
    if (!groups.some((group) => group.key === current)) {
      this.monthControl.setValue('all', { emitEvent: false });
    }
  }

  private buildMonthGroups(invoices: Invoice[]): MonthGroup<Invoice>[] {
    const sorted = [...invoices].sort((a, b) => this.toTime(b.date) - this.toTime(a.date));
    const groups = new Map<string, MonthGroup<Invoice>>();

    sorted.forEach((invoice) => {
      const date = this.parseDate(invoice.date);
      const key = this.getMonthKey(date);
      if (!groups.has(key)) {
        groups.set(key, { key, label: this.formatMonthLabel(date), items: [] });
      }
      groups.get(key)?.items.push(invoice);
    });

    return Array.from(groups.values());
  }

  private sortInvoices(invoices: Invoice[]): Invoice[] {
    return [...invoices].sort((a, b) => {
      const diff = this.toTime(b.date) - this.toTime(a.date);
      if (diff !== 0) return diff;
      return b.numero.localeCompare(a.numero);
    });
  }

  private parseDate(value: string): Date {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return new Date(0);
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
}
