import { Injectable } from '@angular/core';
import { InvoicePersistenceService } from './invoice-persistence.service';
import { QuotePersistenceService } from './quote-persistence.service';
import { getNextPurchaseOrderNumber } from '../utils/purchase-order-number';

@Injectable({
  providedIn: 'root'
})
export class PurchaseOrderNumberService {
  constructor(
    private readonly quotes: QuotePersistenceService,
    private readonly invoices: InvoicePersistenceService
  ) {}

  async getNextForQuotes(): Promise<string> {
    const quotes = await this.quotes.getAll();
    return getNextPurchaseOrderNumber(quotes.map((quote) => quote.purchaseOrderNumber));
  }

  async getNextForInvoices(): Promise<string> {
    const invoices = await this.invoices.getAll();
    return getNextPurchaseOrderNumber(invoices.map((invoice) => invoice.purchaseOrderNumber));
  }
}
