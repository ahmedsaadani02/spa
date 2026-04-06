const { backfillDocumentClientLinks } = require('../clients.repository');

const parseInvoicePayload = (row) => {
  if (!row?.payload) return null;
  try {
    return JSON.parse(row.payload);
  } catch {
    return null;
  }
};

const buildQuoteInvoiceLinks = (db) => {
  const rows = db.prepare(`
    SELECT quote_id, id, payload
    FROM invoices
    WHERE quote_id IS NOT NULL AND trim(quote_id) <> ''
  `).all();

  const links = new Map();
  rows.forEach((row) => {
    const payload = parseInvoicePayload(row);
    links.set(row.quote_id, {
      invoiceId: row.id,
      invoiceNumero: payload?.numero ?? null
    });
  });

  return links;
};

const withConversionState = (quote, link) => {
  if (!quote || typeof quote !== 'object') return quote;
  if (!link?.invoiceId) return quote;
  if (quote.status === 'invoiced' && quote.convertedInvoiceId) return quote;
  return {
    ...quote,
    status: 'invoiced',
    convertedInvoiceId: quote.convertedInvoiceId ?? link.invoiceId
  };
};

const listQuotes = (db) => {
  backfillDocumentClientLinks(db, 'quotes');
  const quoteInvoiceLinks = buildQuoteInvoiceLinks(db);

  return db.prepare('SELECT payload, client_id FROM quotes').all().map((row) => {
    const parsed = JSON.parse(row.payload);
    const withClient = row.client_id && !parsed.clientId
      ? { ...parsed, clientId: row.client_id }
      : parsed;
    return withConversionState(withClient, quoteInvoiceLinks.get(withClient.id));
  });
};

const getQuoteById = (db, id) => {
  backfillDocumentClientLinks(db, 'quotes');
  const row = db.prepare('SELECT payload, client_id FROM quotes WHERE id = ?').get(id);
  if (!row) return null;

  const parsed = JSON.parse(row.payload);
  const withClient = row.client_id && !parsed.clientId
    ? { ...parsed, clientId: row.client_id }
    : parsed;

  const link = db.prepare(`
    SELECT id, payload
    FROM invoices
    WHERE quote_id = ?
    LIMIT 1
  `).get(withClient.id);

  return withConversionState(withClient, link ? { invoiceId: link.id } : null);
};

module.exports = {
  listQuotes,
  getQuoteById
};
