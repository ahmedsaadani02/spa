import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Quote } from '../models/quote';
import { QuotePersistenceService } from './quote-persistence.service';

@Injectable({
  providedIn: 'root'
})
export class QuoteStoreService {
  private readonly quotesSubject = new BehaviorSubject<Quote[]>([]);
  readonly quotes$ = this.quotesSubject.asObservable();

  private loaded = false;

  constructor(private persistence: QuotePersistenceService) {}

  async load(): Promise<void> {
    if (this.loaded) return;
    await this.persistence.ensureSeed();
    await this.refresh();
    this.loaded = true;
  }

  async refresh(): Promise<void> {
    const all = await this.persistence.getAll();
    const sorted = [...all].sort((a, b) => b.date.localeCompare(a.date));
    this.quotesSubject.next(sorted);
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
}
