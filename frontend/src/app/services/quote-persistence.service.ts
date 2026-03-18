import { Injectable, inject, isDevMode } from '@angular/core';
import { Client } from '../models/client';
import { Quote } from '../models/quote';
import { QUOTES_REPOSITORY, QuotesRepository } from '../repositories/quotes.repository';
import { ClientPersistenceService } from './client-persistence.service';
import type { SpaQuoteConvertResult } from '../types/electron';

@Injectable({
  providedIn: 'root'
})
export class QuotePersistenceService {
  private readonly repository = inject<QuotesRepository>(QUOTES_REPOSITORY);
  private readonly clients = inject(ClientPersistenceService);

  async getAll(): Promise<Quote[]> {
    const all = await this.repository.getAll();
    if (!Array.isArray(all) && isDevMode()) {
      console.warn('[QuotePersistence] Repository returned invalid list');
      return [];
    }
    return Array.isArray(all) ? all : [];
  }

  async getById(id: string): Promise<Quote | null> {
    return (await this.repository.getById(id)) ?? null;
  }

  async put(quote: Quote): Promise<void> {
    const normalized = await this.attachClient(quote);
    await this.repository.put(normalized);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async ensureSeed(): Promise<void> {
    await this.repository.ensureSeed?.();
  }

  async convertToInvoice(quoteId: string): Promise<SpaQuoteConvertResult> {
    if (!this.repository.convertToInvoice) {
      return { ok: false, message: 'QUOTE_CONVERT_UNAVAILABLE' };
    }
    return this.repository.convertToInvoice(quoteId);
  }

  private async attachClient(quote: Quote): Promise<Quote> {
    const linked = await this.clients.findOrCreate(quote.client, quote.clientId ?? null);
    if (!linked) {
      return {
        ...quote,
        clientId: null
      };
    }

    return {
      ...quote,
      clientId: linked.id ?? null,
      client: this.toQuoteClient(linked)
    };
  }

  private toQuoteClient(client: Client): Client {
    const tel = (client.tel || client.telephone || '').trim();
    return {
      id: client.id ?? null,
      nom: (client.nom || '').trim(),
      adresse: (client.adresse || '').trim(),
      tel,
      telephone: tel,
      mf: (client.mf || '').trim(),
      email: (client.email || '').trim().toLowerCase(),
      createdAt: client.createdAt,
      updatedAt: client.updatedAt
    };
  }
}
