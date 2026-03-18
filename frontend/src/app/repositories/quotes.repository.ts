import { InjectionToken } from '@angular/core';
import { Quote } from '../models/quote';
import type { SpaQuoteConvertResult } from '../types/electron';

export interface QuotesRepository {
  getAll(): Promise<Quote[]>;
  getById(id: string): Promise<Quote | null>;
  put(quote: Quote): Promise<void>;
  delete(id: string): Promise<void>;
  convertToInvoice?(id: string): Promise<SpaQuoteConvertResult>;
  ensureSeed?(): Promise<void>;
}

export const QUOTES_REPOSITORY = new InjectionToken<QuotesRepository>('QUOTES_REPOSITORY');
