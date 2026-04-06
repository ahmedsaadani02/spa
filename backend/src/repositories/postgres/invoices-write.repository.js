const { exec } = require('./shared');
const { findOrCreateClient } = require('./clients.repository');
const { toDocumentClient } = require('../clients.repository');
const { applyInvoicePayloadDefaults } = require('../shared/invoice-payload.shared');

const normalizeInvoiceForStore = async (db, invoice) => {
  if (!invoice || typeof invoice !== 'object' || !invoice.id) return null;
  const invoiceWithDefaults = applyInvoicePayloadDefaults(invoice);

  const preferredId = typeof invoiceWithDefaults.clientId === 'string' ? invoiceWithDefaults.clientId : null;
  const resolvedClient = await findOrCreateClient(db, invoiceWithDefaults.client, preferredId);

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

const putInvoice = async (db, invoice) => {
  if (!invoice || !invoice.id) return false;
  const normalized = await normalizeInvoiceForStore(db, invoice);
  if (!normalized) return false;

  await exec(
    `
      INSERT INTO invoices (id, payload, updated_at, client_id, quote_id)
      VALUES ($1, $2::jsonb, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET
        payload = EXCLUDED.payload,
        updated_at = EXCLUDED.updated_at,
        client_id = EXCLUDED.client_id,
        quote_id = EXCLUDED.quote_id
    `,
    [
      normalized.id,
      JSON.stringify(normalized),
      new Date().toISOString(),
      normalized.clientId ?? null,
      normalized.quoteId ?? null
    ]
  );

  return true;
};

module.exports = {
  normalizeInvoiceForStore,
  putInvoice
};
