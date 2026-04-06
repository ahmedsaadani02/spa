const { many, one } = require('./shared');
const { toDocumentClient } = require('../clients.repository');

const parsePayload = (value) => {
  if (!value) return null;
  if (typeof value === 'object') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
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

const mapClientRow = (row) => {
  if (!row?.client_row_id) return null;
  return {
    id: row.client_row_id,
    nom: row.client_nom,
    telephone: row.client_telephone,
    adresse: row.client_adresse,
    mf: row.client_mf,
    email: row.client_email,
    created_at: row.client_created_at,
    updated_at: row.client_updated_at
  };
};

const hydrateQuote = (row, link) => {
  const parsed = parsePayload(row?.payload);
  if (!parsed || typeof parsed !== 'object') {
    return null;
  }

  const clientRow = mapClientRow(row);
  const payloadClientId = typeof parsed.clientId === 'string' && parsed.clientId.trim()
    ? parsed.clientId.trim()
    : null;
  const resolvedClientId = payloadClientId ?? row.client_id ?? null;

  const next = {
    ...parsed,
    clientId: resolvedClientId
  };

  if (clientRow) {
    next.client = toDocumentClient(clientRow);
  } else if (row.client_id && !next.clientId) {
    next.clientId = row.client_id;
  }

  return withConversionState(next, link);
};

const buildInvoiceLinkMap = async () => {
  const rows = await many(`
    SELECT quote_id, id
    FROM invoices
    WHERE quote_id IS NOT NULL
      AND btrim(quote_id) <> ''
  `);

  const links = new Map();
  rows.forEach((row) => {
    if (!row?.quote_id || links.has(row.quote_id)) return;
    links.set(row.quote_id, { invoiceId: row.id });
  });
  return links;
};

const baseSelect = `
  SELECT
    q.id,
    q.payload,
    q.client_id,
    q.updated_at,
    c.id AS client_row_id,
    c.nom AS client_nom,
    c.telephone AS client_telephone,
    c.adresse AS client_adresse,
    c.mf AS client_mf,
    c.email AS client_email,
    c.created_at AS client_created_at,
    c.updated_at AS client_updated_at
  FROM quotes q
  LEFT JOIN clients c ON c.id = q.client_id
`;

const listQuotes = async () => {
  const [rows, links] = await Promise.all([
    many(baseSelect),
    buildInvoiceLinkMap()
  ]);

  return rows
    .map((row) => hydrateQuote(row, links.get(row.id)))
    .filter(Boolean);
};

const getQuoteById = async (_db, id) => {
  if (!id) return null;

  const [row, link] = await Promise.all([
    one(`${baseSelect} WHERE q.id = $1 LIMIT 1`, [id]),
    one(`
      SELECT id
      FROM invoices
      WHERE quote_id = $1
      LIMIT 1
    `, [id])
  ]);

  if (!row) return null;
  return hydrateQuote(row, link ? { invoiceId: link.id } : null);
};

module.exports = {
  listQuotes,
  getQuoteById
};
