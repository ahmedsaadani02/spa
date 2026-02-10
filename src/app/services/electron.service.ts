import { Injectable } from '@angular/core';
import { Invoice } from '../models/invoice';
import { Quote } from '../models/quote';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  get isElectron(): boolean {
    return typeof window !== 'undefined' && (!!window.electronAPI || !!window.apiInvoices || !!window.apiQuotes);
  }

  hasInvoicesApi(): boolean {
    return !!window.apiInvoices;
  }

  hasQuotesApi(): boolean {
    return !!window.apiQuotes;
  }

  async exportPdf(): Promise<{ canceled: boolean; filePath?: string } | null> {
    if (!this.isElectron) {
      return null;
    }

    return window.electronAPI?.exportPdf() ?? null;
  }

  async invoicesGetAll(): Promise<Invoice[]> {
    if (!this.isElectron || !window.apiInvoices?.getAll) {
      return [];
    }

    return window.apiInvoices.getAll();
  }

  async invoicesGetById(id: string): Promise<Invoice | null> {
    if (!this.isElectron || !window.apiInvoices?.getById) {
      return null;
    }

    return window.apiInvoices.getById(id);
  }

  async invoicesPut(invoice: Invoice): Promise<void> {
    if (!this.isElectron || !window.apiInvoices?.put) {
      return;
    }

    await window.apiInvoices.put(invoice);
  }

  async invoicesDelete(id: string): Promise<void> {
    if (!this.isElectron || !window.apiInvoices?.delete) {
      return;
    }

    await window.apiInvoices.delete(id);
  }

  async quotesGetAll(): Promise<Quote[]> {
    if (!this.isElectron || !window.apiQuotes?.getAll) {
      return [];
    }

    return window.apiQuotes.getAll();
  }

  async quotesGetById(id: string): Promise<Quote | null> {
    if (!this.isElectron || !window.apiQuotes?.getById) {
      return null;
    }

    return window.apiQuotes.getById(id);
  }

  async quotesPut(quote: Quote): Promise<void> {
    if (!this.isElectron || !window.apiQuotes?.put) {
      return;
    }

    await window.apiQuotes.put(quote);
  }

  async quotesDelete(id: string): Promise<void> {
    if (!this.isElectron || !window.apiQuotes?.delete) {
      return;
    }

    await window.apiQuotes.delete(id);
  }
}
