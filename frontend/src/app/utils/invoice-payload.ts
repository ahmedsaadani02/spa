import { Invoice, InvoicePaymentStatus } from '../models/invoice';

const PAYMENT_STATUSES = new Set<InvoicePaymentStatus>(['unpaid', 'paid', 'partial']);

const normalizeOptionalText = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
};

const normalizeOptionalPurchaseOrderNumber = (value: unknown): string | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : null;
  }
  return normalizeOptionalText(value);
};

export const normalizeInvoicePaymentStatus = (value: unknown): InvoicePaymentStatus => {
  if (typeof value !== 'string') return 'unpaid';
  const normalized = value.trim().toLowerCase() as InvoicePaymentStatus;
  return PAYMENT_STATUSES.has(normalized) ? normalized : 'unpaid';
};

export const normalizeInvoice = (invoice: Invoice): Invoice => ({
  ...invoice,
  paymentStatus: normalizeInvoicePaymentStatus(invoice.paymentStatus),
  paidAt: normalizeOptionalText(invoice.paidAt),
  paymentMethod: normalizeOptionalText(invoice.paymentMethod),
  purchaseOrderNumber: normalizeOptionalPurchaseOrderNumber(invoice.purchaseOrderNumber),
  customInvoiceNumber: normalizeOptionalText(invoice.customInvoiceNumber)
});

export const getInvoiceDisplayNumber = (invoice: Invoice | null | undefined): string => {
  if (!invoice) return '';
  return normalizeOptionalText(invoice.customInvoiceNumber) ?? invoice.numero;
};

export const getInvoicePurchaseOrderDisplay = (invoice: Invoice | null | undefined): string => {
  if (!invoice) return '—';
  return normalizeOptionalText(invoice.purchaseOrderNumber) ?? '—';
};

export const getInvoicePaymentStatusLabel = (invoice: Invoice | null | undefined): string => {
  switch (normalizeInvoicePaymentStatus(invoice?.paymentStatus)) {
    case 'paid':
      return 'Payee';
    case 'partial':
      return 'Partiellement payee';
    default:
      return 'Non payee';
  }
};

export const getInvoicePaymentStatusClass = (invoice: Invoice | null | undefined): string => {
  switch (normalizeInvoicePaymentStatus(invoice?.paymentStatus)) {
    case 'paid':
      return 'status-badge--paid';
    case 'partial':
      return 'status-badge--partial';
    default:
      return 'status-badge--unpaid';
  }
};
