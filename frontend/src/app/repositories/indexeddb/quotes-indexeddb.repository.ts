import { Injectable } from '@angular/core';
import { Quote } from '../../models/quote';
import { QuoteStorageService } from '../../services/quote-storage.service';
import type { SpaQuoteConvertResult } from '../../types/electron';
import { QuotesRepository } from '../quotes.repository';

@Injectable({
  providedIn: 'root'
})
export class QuotesIndexedDbRepository implements QuotesRepository {
  constructor(private storage: QuoteStorageService) {}

  async getAll(): Promise<Quote[]> {
    return this.storage.getAll();
  }

  async getById(id: string): Promise<Quote | null> {
    return this.storage.getById(id);
  }

  async put(quote: Quote): Promise<void> {
    await this.storage.put(quote);
  }

  async delete(id: string): Promise<void> {
    await this.storage.delete(id);
  }

  async convertToInvoice(_id: string): Promise<SpaQuoteConvertResult> {
    return { ok: false, message: 'QUOTE_CONVERT_UNAVAILABLE' };
  }

  async ensureSeed(): Promise<void> {
    await this.storage.ensureSeed();
  }
}
