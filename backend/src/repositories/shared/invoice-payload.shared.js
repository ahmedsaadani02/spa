const INVOICE_PAYMENT_STATUSES = new Set(['unpaid', 'paid', 'partial']);

const normalizeOptionalText = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
};

const normalizeOptionalPurchaseOrderNumber = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : null;
  }
  return normalizeOptionalText(value);
};

const normalizePaymentStatus = (value) => {
  if (typeof value !== 'string') return 'unpaid';
  const normalized = value.trim().toLowerCase();
  return INVOICE_PAYMENT_STATUSES.has(normalized) ? normalized : 'unpaid';
};

const applyInvoicePayloadDefaults = (invoice) => {
  if (!invoice || typeof invoice !== 'object') {
    return invoice;
  }

  return {
    ...invoice,
    paymentStatus: normalizePaymentStatus(invoice.paymentStatus),
    paidAt: normalizeOptionalText(invoice.paidAt),
    paymentMethod: normalizeOptionalText(invoice.paymentMethod),
    purchaseOrderNumber: normalizeOptionalPurchaseOrderNumber(invoice.purchaseOrderNumber),
    customInvoiceNumber: normalizeOptionalText(invoice.customInvoiceNumber)
  };
};

module.exports = {
  INVOICE_PAYMENT_STATUSES,
  normalizePaymentStatus,
  normalizeOptionalText,
  normalizeOptionalPurchaseOrderNumber,
  applyInvoicePayloadDefaults
};
