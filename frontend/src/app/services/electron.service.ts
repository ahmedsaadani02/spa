import { Injectable } from '@angular/core';
import { Invoice } from '../models/invoice';
import { Quote } from '../models/quote';
import { getSpaApi } from '../bridge/spa-bridge';
import type { SpaApi, SpaDocumentPdfResult, SpaDocumentRequest, SpaPrintResult } from '../types/electron';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  private get spa(): SpaApi | null {
    return getSpaApi();
  }

  get isElectron(): boolean {
    return false;
  }

  hasInvoicesApi(): boolean {
    return !!this.spa?.invoices;
  }

  hasQuotesApi(): boolean {
    return !!this.spa?.quotes;
  }

  async exportPdf(): Promise<SpaDocumentPdfResult | null> {
    if (this.spa?.documents?.exportPdf) {
      return this.spa.documents.exportPdf({ docType: 'invoice', documentNumber: 'facture' });
    }
    return this.spa?.exportPdf() ?? null;
  }

  async printDocument(
    docType: 'invoice' | 'quote',
    documentNumber?: string,
    html?: string,
    title?: string
  ): Promise<SpaPrintResult | null> {
    if (!this.spa?.documents?.print) {
      return null;
    }
    const request: SpaDocumentRequest = { docType, documentNumber, html, title };
    return this.spa.documents.print(request);
  }

  async exportDocumentPdf(
    docType: 'invoice' | 'quote',
    documentNumber?: string,
    html?: string,
    title?: string
  ): Promise<SpaDocumentPdfResult | null> {
    if (!this.spa?.documents?.exportPdf) {
      return null;
    }
    const request: SpaDocumentRequest = { docType, documentNumber, html, title };
    return this.spa.documents.exportPdf(request);
  }

  async invoicesGetAll(): Promise<Invoice[]> {
    if (!this.spa?.invoices?.getAll) {
      return [];
    }

    return this.spa.invoices.getAll();
  }

  async invoicesGetById(id: string): Promise<Invoice | null> {
    if (!this.spa?.invoices?.getById) {
      return null;
    }

    return this.spa.invoices.getById(id);
  }

  async invoicesPut(invoice: Invoice): Promise<void> {
    if (!this.spa?.invoices?.put) {
      return;
    }

    await this.spa.invoices.put(invoice);
  }

  async invoicesDelete(id: string): Promise<void> {
    if (!this.spa?.invoices?.delete) {
      return;
    }

    await this.spa.invoices.delete(id);
  }

  async quotesGetAll(): Promise<Quote[]> {
    if (!this.spa?.quotes?.getAll) {
      return [];
    }

    return this.spa.quotes.getAll();
  }

  async quotesGetById(id: string): Promise<Quote | null> {
    if (!this.spa?.quotes?.getById) {
      return null;
    }

    return this.spa.quotes.getById(id);
  }

  async quotesPut(quote: Quote): Promise<void> {
    if (!this.spa?.quotes?.put) {
      return;
    }

    await this.spa.quotes.put(quote);
  }

  async quotesDelete(id: string): Promise<void> {
    if (!this.spa?.quotes?.delete) {
      return;
    }

    await this.spa.quotes.delete(id);
  }
}
