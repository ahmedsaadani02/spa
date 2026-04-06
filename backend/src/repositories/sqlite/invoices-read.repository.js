const { backfillDocumentClientLinks } = require('../clients.repository');
const { applyInvoicePayloadDefaults } = require('../shared/invoice-payload.shared');

const toInvoiceWithQuoteId = (row) => {
  const parsed = JSON.parse(row.payload);
  const withClient = row.client_id && !parsed.clientId
    ? { ...parsed, clientId: row.client_id }
    : parsed;

  if (row.quote_id && !withClient.quoteId) {
    return applyInvoicePayloadDefaults({ ...withClient, quoteId: row.quote_id });
  }

  return applyInvoicePayloadDefaults(withClient);
};

const listInvoices = (db) => {
  backfillDocumentClientLinks(db, 'invoices');
  return db.prepare('SELECT payload, client_id, quote_id FROM invoices').all().map(toInvoiceWithQuoteId);
};

const getInvoiceById = (db, id) => {
  if (!id) return null;
  backfillDocumentClientLinks(db, 'invoices');
  const row = db.prepare('SELECT payload, client_id, quote_id FROM invoices WHERE id = ?').get(id);
  if (!row) return null;
  return toInvoiceWithQuoteId(row);
};

module.exports = {
  listInvoices,
  getInvoiceById
};
