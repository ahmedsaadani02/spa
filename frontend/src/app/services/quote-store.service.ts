import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Quote } from '../models/quote';
import { QuotePersistenceService } from './quote-persistence.service';
import type { SpaQuoteConvertResult } from '../types/electron';

@Injectable({
  providedIn: 'root'
})
export class QuoteStoreService {
  private readonly quotesSubject = new BehaviorSubject<Quote[]>([]);
  readonly quotes$ = this.quotesSubject.asObservable();

  private initialized = false;
  private loadInFlight: Promise<void> | null = null;

  constructor(private persistence: QuotePersistenceService) {}

  async load(): Promise<void> {
    if (this.loadInFlight) {
      return this.loadInFlight;
    }

    this.loadInFlight = this.performLoad().finally(() => {
      this.loadInFlight = null;
    });
    return this.loadInFlight;
  }

  async warm(): Promise<void> {
    if (this.quotesSubject.value.length > 0) {
      return;
    }
    await this.load();
  }

  private async performLoad(): Promise<void> {
    console.log('[quotes-page] load requested');
    if (!this.initialized) {
      await this.persistence.ensureSeed();
      this.initialized = true;
    }
    await this.refresh();
    if (this.quotesSubject.value.length === 0) {
      await this.wait(180);
      await this.refresh();
    }
    this.logRenderState();
  }

  async refresh(): Promise<void> {
    const all = await this.persistence.getAll();
    console.log('[quotes-page] raw response received', {
      items: Array.isArray(all) ? all.length : 0
    });
    const sorted = [...all].sort((a, b) => b.date.localeCompare(a.date));
    this.quotesSubject.next(sorted);
    console.log('[quotes-page] api response received');
    console.log(`[quotes-page] mapped quotes count: ${sorted.length}`);
    console.log(`[quotes-page] converted quotes count: ${this.countConvertedQuotes(sorted)}`);
    console.log('[quotes-page] empty state condition:', sorted.length === 0);
  }

  getSnapshot(): Quote[] {
    return this.quotesSubject.value;
  }

  async getById(id: string): Promise<Quote | null> {
    const snap = this.quotesSubject.value;
    const found = snap.find((quote) => quote.id === id);
    if (found) return found;

    await this.refresh();
    const snap2 = this.quotesSubject.value;
    return snap2.find((quote) => quote.id === id) ?? null;
  }

  async save(quote: Quote): Promise<void> {
    await this.persistence.put(quote);
    await this.refresh();
  }

  async delete(id: string): Promise<void> {
    await this.persistence.delete(id);
    await this.refresh();
  }

  async isNumeroUnique(numero: string, currentId?: string): Promise<boolean> {
    const all = await this.persistence.getAll();
    return !all.some((quote) => quote.numero === numero && quote.id !== currentId);
  }

  async getNextQuoteNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `DEV-${year}-`;
    const all = await this.persistence.getAll();

    const numbers = all
      .map((quote) => quote.numero)
      .filter((numero) => numero.startsWith(prefix))
      .map((numero) => Number(numero.replace(prefix, '')))
      .filter((value) => !Number.isNaN(value));

    const next = (Math.max(0, ...numbers) + 1).toString().padStart(4, '0');
    return `${prefix}${next}`;
  }

  async convertToInvoice(quoteId: string): Promise<SpaQuoteConvertResult> {
    const result = await this.persistence.convertToInvoice(quoteId);
    await this.refresh();
    return result;
  }

  private async wait(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private logRenderState(): void {
    const count = this.quotesSubject.value.length;
    console.log(`[quotes-page] mapped quotes count: ${count}`);
    console.log(`[quotes-page] converted quotes count: ${this.countConvertedQuotes(this.quotesSubject.value)}`);
    console.log('[quotes-page] empty state condition:', count === 0);
  }

  private countConvertedQuotes(list: Quote[]): number {
    return list.filter((quote) => quote?.status === 'invoiced' || !!quote?.convertedInvoiceId).length;
  }
}
