import { Client } from './client';
import { InvoiceLine } from './invoice-line';

export type RemiseType = 'montant' | 'pourcentage';
export type InvoicePaymentStatus = 'unpaid' | 'paid' | 'partial';

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
  paymentStatus?: InvoicePaymentStatus;
  paidAt?: string | null;
  paymentMethod?: string | null;
  purchaseOrderNumber?: string | null;
  customInvoiceNumber?: string | null;
}
