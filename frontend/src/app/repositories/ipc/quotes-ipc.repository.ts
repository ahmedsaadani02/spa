import { Injectable } from '@angular/core';
import { Quote } from '../../models/quote';
import { IpcService } from '../../services/ipc.service';
import type { SpaQuoteConvertResult } from '../../types/electron';
import { QuotesRepository } from '../quotes.repository';

@Injectable({
  providedIn: 'root'
})
export class QuotesIpcRepository implements QuotesRepository {
  constructor(private ipc: IpcService) {}

  async getAll(): Promise<Quote[]> {
    return this.ipc.quotesGetAll();
  }

  async getById(id: string): Promise<Quote | null> {
    return this.ipc.quotesGetById(id);
  }

  async put(quote: Quote): Promise<void> {
    await this.ipc.quotesPut(quote);
  }

  async delete(id: string): Promise<void> {
    await this.ipc.quotesDelete(id);
  }

  async convertToInvoice(id: string): Promise<SpaQuoteConvertResult> {
    return this.ipc.quotesConvertToInvoice(id);
  }
}
