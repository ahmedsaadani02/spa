import { Client } from './client';
import { InvoiceLine } from './invoice-line';

export type QuoteRemiseType = 'montant' | 'pourcentage';

export interface Quote {
  id: string;
  numero: string;
  date: string;
  clientId: string | null;
  client: Client;
  lignes: InvoiceLine[];
  remiseType?: QuoteRemiseType;
  remiseValue?: number;
  notes?: string;
  conditions?: string;
  status?: 'draft' | 'confirmed' | 'invoiced';
  convertedInvoiceId?: string;
  convertedAt?: string;
}
