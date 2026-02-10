import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { combineLatest, map, startWith } from 'rxjs';
import { Invoice } from '../../models/invoice';
import { InvoiceCalcService } from '../../services/invoice-calc.service';
import { InvoiceStoreService } from '../../services/invoice-store.service';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.css']
})
export class InvoiceListComponent implements OnInit {
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly filteredInvoices$ = combineLatest([
    this.store.invoices$,
    this.searchControl.valueChanges.pipe(startWith(''))
  ]).pipe(
    map(([invoices, term]) => {
      const query = term.trim().toLowerCase();
      if (!query) {
        return invoices;
      }

      return invoices.filter((invoice) => {
        return (
          invoice.numero.toLowerCase().includes(query) ||
          invoice.client.nom.toLowerCase().includes(query)
        );
      });
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
}
