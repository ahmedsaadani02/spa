import type { Invoice } from '../models/invoice';
import type { Quote } from '../models/quote';

export {};

declare global {
  interface Window {
    electronAPI?: {
      exportPdf: () => Promise<{ canceled: boolean; filePath?: string }>;
    };
    apiInvoices?: {
      getAll: () => Promise<Invoice[]>;
      getById: (id: string) => Promise<Invoice | null>;
      put: (invoice: Invoice) => Promise<void>;
      delete: (id: string) => Promise<void>;
    };
    apiQuotes?: {
      getAll: () => Promise<Quote[]>;
      getById: (id: string) => Promise<Quote | null>;
      put: (quote: Quote) => Promise<void>;
      delete: (id: string) => Promise<void>;
    };
  }
}
