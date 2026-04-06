const { findOrCreateClient, toDocumentClient } = require('../clients.repository');
const { applyInvoicePayloadDefaults } = require('../shared/invoice-payload.shared');

const normalizeInvoiceForStore = (db, invoice) => {
  if (!invoice || typeof invoice !== 'object' || !invoice.id) return null;
  const invoiceWithDefaults = applyInvoicePayloadDefaults(invoice);

  const preferredId = typeof invoiceWithDefaults.clientId === 'string' ? invoiceWithDefaults.clientId : null;
  const resolvedClient = findOrCreateClient(db, invoiceWithDefaults.client, preferredId);

  if (!resolvedClient) {
    return {
      ...invoiceWithDefaults,
      clientId: null
    };
  }

  return {
    ...invoiceWithDefaults,
    clientId: resolvedClient.id,
    client: toDocumentClient(resolvedClient)
  };
};

const putInvoice = (db, invoice) => {
  if (!invoice || !invoice.id) return false;
  const normalized = normalizeInvoiceForStore(db, invoice);
  if (!normalized) return false;

  db.prepare(`
    INSERT INTO invoices (id, payload, updated_at, client_id, quote_id)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      payload = excluded.payload,
      updated_at = excluded.updated_at,
      client_id = excluded.client_id,
      quote_id = excluded.quote_id
  `).run(
    normalized.id,
    JSON.stringify(normalized),
    new Date().toISOString(),
    normalized.clientId ?? null,
    normalized.quoteId ?? null
  );

  return true;
};

module.exports = {
  normalizeInvoiceForStore,
  putInvoice
};
