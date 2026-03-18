import { Client } from './client';
import { InvoiceLine } from './invoice-line';

export type RemiseType = 'montant' | 'pourcentage';

export interface Invoice {
  id: string;
  numero: string;
  date: string;
  clientId: string | null;
  client: Client;
  lignes: InvoiceLine[];
  remiseType?: RemiseType;
  remiseValue?: number;
  remiseAvantTVA?: boolean;
  notes?: string;
  conditions?: string;
  quoteId?: string | null;
  sourceQuoteNumber?: string;
}
