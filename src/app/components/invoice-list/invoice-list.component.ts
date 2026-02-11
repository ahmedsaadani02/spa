import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable, combineLatest, map, startWith } from 'rxjs';
import { Invoice } from '../../models/invoice';
import { InvoiceCalcService } from '../../services/invoice-calc.service';
import { InvoiceStoreService } from '../../services/invoice-store.service';

type MonthGroup<T> = {
  key: string;
  label: string;
  items: T[];
};

type MonthOption = {
  key: string;
  label: string;
};

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.css']
})
export class InvoiceListComponent implements OnInit {
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly monthControl = new FormControl('all', { nonNullable: true });

  readonly filteredInvoices$ = combineLatest([
    this.store.invoices$,
    this.searchControl.valueChanges.pipe(startWith('')),
    this.monthControl.valueChanges.pipe(startWith(this.monthControl.value))
  ]).pipe(
    map(([invoices, term, monthKey]) => {
      const query = term.trim().toLowerCase();
      let list = invoices;

      if (query) {
        list = list.filter((invoice) => {
          return (
            invoice.numero.toLowerCase().includes(query) ||
            invoice.client.nom.toLowerCase().includes(query)
          );
        });
      }

      if (monthKey && monthKey !== 'all') {
        list = list.filter((invoice) => {
          return this.getMonthKey(this.parseDate(invoice.date)) === monthKey;
        });
      }

      return this.sortInvoices(list);
    })
  );

  readonly groupedInvoices$: Observable<MonthGroup<Invoice>[]> = this.filteredInvoices$.pipe(
    map((invoices) => {
      const sorted = this.sortInvoices(invoices);
      const groups = new Map<string, MonthGroup<Invoice>>();

      sorted.forEach((invoice) => {
        const date = this.parseDate(invoice.date);
        const key = this.getMonthKey(date);
        if (!groups.has(key)) {
          groups.set(key, {
            key,
            label: this.formatMonthLabel(date),
            items: []
          });
        }
        groups.get(key)?.items.push(invoice);
      });

      return Array.from(groups.values()).sort((a, b) => b.key.localeCompare(a.key));
    })
  );

  readonly monthOptions$ = this.store.invoices$.pipe(
    map((invoices) => this.buildMonthOptions(invoices))
  );

  readonly selectedMonthLabel$ = combineLatest([
    this.monthOptions$,
    this.monthControl.valueChanges.pipe(startWith(this.monthControl.value))
  ]).pipe(
    map(([options, key]) => {
      if (!key || key === 'all') return 'Toutes';
      return options.find((option) => option.key === key)?.label ?? 'Toutes';
    })
  );

  constructor(private store: InvoiceStoreService, private calc: InvoiceCalcService) {}

  async ngOnInit(): Promise<void> {
    await this.store.load();
  }

  totalTTC(invoice: Invoice): number {
    return this.calc.totals(invoice).totalTTC;
  }

  async deleteInvoice(invoice: Invoice): Promise<void> {
    const confirmed = confirm(`Supprimer la facture ${invoice.numero} ?`);
    if (!confirmed) {
      return;
    }

    await this.store.delete(invoice.id);
  }

  printSelectedMonth(): void {
    window.print();
  }

  private buildMonthOptions(invoices: Invoice[]): MonthOption[] {
    const sorted = this.sortInvoices(invoices);
    const options: MonthOption[] = [];
    const seen = new Set<string>();

    sorted.forEach((invoice) => {
      const date = this.parseDate(invoice.date);
      const key = this.getMonthKey(date);
      if (seen.has(key)) return;
      seen.add(key);
      options.push({ key, label: this.formatMonthLabel(date) });
    });

    return options;
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
}
