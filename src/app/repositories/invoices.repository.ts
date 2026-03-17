import { InjectionToken } from '@angular/core';
import { Invoice } from '../models/invoice';

export interface InvoicesRepository {
  getAll(): Promise<Invoice[]>;
  getById(id: string): Promise<Invoice | null>;
  put(invoice: Invoice): Promise<void>;
  delete(id: string): Promise<void>;
  ensureSeed?(): Promise<void>;
}

export const INVOICES_REPOSITORY = new InjectionToken<InvoicesRepository>('INVOICES_REPOSITORY');
