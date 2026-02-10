import { Injectable, isDevMode } from '@angular/core';
import { Quote } from '../models/quote';
import { ElectronService } from './electron.service';
import { QuoteStorageService } from './quote-storage.service';

@Injectable({
  providedIn: 'root'
})
export class QuotePersistenceService {
  constructor(
    private electron: ElectronService,
    private indexedDb: QuoteStorageService
  ) {}

  private get useElectron(): boolean {
    return this.electron.isElectron;
  }

  async getAll(): Promise<Quote[]> {
    if (this.useElectron) {
      if (!this.electron.hasQuotesApi()) {
        if (isDevMode()) {
          console.warn('[QuotePersistence] Electron API missing: quotes.getAll');
        }
        return [];
      }

      const all = await this.electron.quotesGetAll();
      return Array.isArray(all) ? all : [];
    }

    return this.indexedDb.getAll();
  }

  async getById(id: string): Promise<Quote | null> {
    if (this.useElectron) {
      if (!this.electron.hasQuotesApi()) {
        if (isDevMode()) {
          console.warn('[QuotePersistence] Electron API missing: quotes.getById');
        }
        return null;
      }

      return (await this.electron.quotesGetById(id)) ?? null;
    }

    return this.indexedDb.getById(id);
  }

  async put(quote: Quote): Promise<void> {
    if (this.useElectron) {
      if (!this.electron.hasQuotesApi()) {
        if (isDevMode()) {
          console.warn('[QuotePersistence] Electron API missing: quotes.put');
        }
        return;
      }

      await this.electron.quotesPut(quote);
      return;
    }

    await this.indexedDb.put(quote);
  }

  async delete(id: string): Promise<void> {
    if (this.useElectron) {
      if (!this.electron.hasQuotesApi()) {
        if (isDevMode()) {
          console.warn('[QuotePersistence] Electron API missing: quotes.delete');
        }
        return;
      }

      await this.electron.quotesDelete(id);
      return;
    }

    await this.indexedDb.delete(id);
  }

  async ensureSeed(): Promise<void> {
    if (!this.useElectron) {
      await this.indexedDb.ensureSeed();
    }
  }
}
