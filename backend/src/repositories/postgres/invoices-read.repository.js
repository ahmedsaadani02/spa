const { many, one } = require('./shared');
const { toDocumentClient } = require('../clients.repository');
const { applyInvoicePayloadDefaults } = require('../shared/invoice-payload.shared');

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

const hydrateInvoice = (row) => {
  const parsed = parsePayload(row?.payload);
  if (!parsed || typeof parsed !== 'object') {
    return null;
  }

  const clientRow = mapClientRow(row);
  const payloadClientId = typeof parsed.clientId === 'string' && parsed.clientId.trim()
    ? parsed.clientId.trim()
    : null;
  const payloadQuoteId = typeof parsed.quoteId === 'string' && parsed.quoteId.trim()
    ? parsed.quoteId.trim()
    : null;

  const next = {
    ...parsed,
    clientId: payloadClientId ?? row.client_id ?? null
  };

  if (clientRow) {
    next.client = toDocumentClient(clientRow);
  }

  if (!payloadQuoteId && row.quote_id) {
    next.quoteId = row.quote_id;
  }

  return applyInvoicePayloadDefaults(next);
};

const baseSelect = `
  SELECT
    i.id,
    i.payload,
    i.client_id,
    i.quote_id,
    i.updated_at,
    c.id AS client_row_id,
    c.nom AS client_nom,
    c.telephone AS client_telephone,
    c.adresse AS client_adresse,
    c.mf AS client_mf,
    c.email AS client_email,
    c.created_at AS client_created_at,
    c.updated_at AS client_updated_at
  FROM invoices i
  LEFT JOIN clients c ON c.id = i.client_id
`;

const listInvoices = async () => {
  const rows = await many(baseSelect);
  return rows.map(hydrateInvoice).filter(Boolean);
};

const getInvoiceById = async (_db, id) => {
  if (!id) return null;
  const row = await one(`${baseSelect} WHERE i.id = $1 LIMIT 1`, [id]);
  if (!row) return null;
  return hydrateInvoice(row);
};

module.exports = {
  listInvoices,
  getInvoiceById
};
