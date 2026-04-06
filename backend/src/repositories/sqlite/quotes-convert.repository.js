const { randomUUID } = require('crypto');
const { backfillDocumentClientLinks } = require('../clients.repository');
const { applyInvoicePayloadDefaults } = require('../shared/invoice-payload.shared');
const { getNextPurchaseOrderNumber } = require('../shared/purchase-order-number.shared');

const getNextInvoiceNumber = (db) => {
  const year = new Date().getFullYear();
  const prefix = `SPA-${year}-`;
  const rows = db.prepare(`SELECT json_extract(payload, '$.numero') AS numero FROM invoices`).all();
  const maxSeq = rows.reduce((max, row) => {
    const numero = typeof row?.numero === 'string' ? row.numero : '';
    if (!numero.startsWith(prefix)) return max;
    const seq = Number(numero.slice(prefix.length));
    if (!Number.isFinite(seq)) return max;
    return Math.max(max, seq);
  }, 0);
  return `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
};

const getNextInvoicePurchaseOrderNumber = (db) => {
  const rows = db.prepare(`
    SELECT json_extract(payload, '$.purchaseOrderNumber') AS purchase_order_number
    FROM invoices
  `).all();

  return getNextPurchaseOrderNumber(rows.map((row) => row?.purchase_order_number ?? null));
};

const parseInvoicePayload = (row) => {
  if (!row?.payload) return null;
  try {
    return JSON.parse(row.payload);
  } catch {
    return null;
  }
};

const markQuoteAsInvoiced = (db, quoteRow, quote, invoiceId) => {
  const now = new Date().toISOString();
  const updatedQuote = {
    ...quote,
    clientId: quote.clientId ?? quoteRow.client_id ?? null,
    status: 'invoiced',
    convertedInvoiceId: invoiceId,
    convertedAt: now
  };
  db.prepare(`
    UPDATE quotes
    SET payload = ?, updated_at = ?, client_id = ?
    WHERE id = ?
  `).run(JSON.stringify(updatedQuote), now, updatedQuote.clientId ?? quoteRow.client_id ?? null, quoteRow.id);
};

const convertQuoteToInvoice = (db, quoteId) => {
  if (!quoteId || typeof quoteId !== 'string') {
    return { ok: false, message: 'QUOTE_ID_REQUIRED' };
  }

  backfillDocumentClientLinks(db, 'quotes');
  backfillDocumentClientLinks(db, 'invoices');

  const quoteRow = db.prepare(`
    SELECT id, payload, client_id
    FROM quotes
    WHERE id = ?
    LIMIT 1
  `).get(quoteId);

  if (!quoteRow) {
    return { ok: false, message: 'QUOTE_NOT_FOUND' };
  }

  const quote = JSON.parse(quoteRow.payload);
  const quoteAlreadyConverted = quote?.status === 'invoiced' || !!quote?.convertedInvoiceId;
  const linkedInvoice = db.prepare(`
    SELECT id, payload, quote_id
    FROM invoices
    WHERE quote_id = ?
    LIMIT 1
  `).get(quoteId);

  if (linkedInvoice) {
    const parsed = parseInvoicePayload(linkedInvoice);
    if (!quote.convertedInvoiceId) {
      markQuoteAsInvoiced(db, quoteRow, quote, linkedInvoice.id);
    }
    return {
      ok: false,
      alreadyConverted: true,
      invoiceId: linkedInvoice.id,
      invoiceNumero: parsed?.numero ?? null,
      message: 'Ce devis a deja ete converti en facture.'
    };
  }

  if (quoteAlreadyConverted && quote?.convertedInvoiceId) {
    const existingById = db.prepare(`
      SELECT id, payload, quote_id
      FROM invoices
      WHERE id = ?
      LIMIT 1
    `).get(quote.convertedInvoiceId);
    if (existingById) {
      const parsed = parseInvoicePayload(existingById);
      db.prepare('UPDATE invoices SET quote_id = COALESCE(quote_id, ?) WHERE id = ?').run(quoteId, existingById.id);
      markQuoteAsInvoiced(db, quoteRow, quote, existingById.id);
      return {
        ok: false,
        alreadyConverted: true,
        invoiceId: existingById.id,
        invoiceNumero: parsed?.numero ?? null,
        message: 'Ce devis a deja ete converti en facture.'
      };
    }
  }

  const now = new Date().toISOString();
  const invoiceId = randomUUID();
  const invoiceNumero = getNextInvoiceNumber(db);
  const purchaseOrderNumber = getNextInvoicePurchaseOrderNumber(db);
  const safeClient = quote?.client && typeof quote.client === 'object'
    ? quote.client
    : {
        nom: '',
        adresse: '',
        tel: '',
        telephone: '',
        mf: '',
        email: ''
      };

  const normalizedInvoice = applyInvoicePayloadDefaults({
    id: invoiceId,
    numero: invoiceNumero,
    date: new Date().toISOString().slice(0, 10),
    clientId: quote.clientId ?? quoteRow.client_id ?? null,
    client: safeClient,
    lignes: Array.isArray(quote.lignes) ? quote.lignes : [],
    remiseType: quote.remiseType,
    remiseValue: quote.remiseValue,
    notes: quote.notes ?? '',
    conditions: quote.conditions ?? '',
    quoteId: quote.id,
    sourceQuoteNumber: quote.numero,
    purchaseOrderNumber
  });

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO invoices (id, payload, updated_at, client_id, quote_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      normalizedInvoice.id,
      JSON.stringify(normalizedInvoice),
      now,
      normalizedInvoice.clientId ?? null,
      quoteId
    );

    markQuoteAsInvoiced(db, quoteRow, quote, invoiceId);
  });
  tx();

  return {
    ok: true,
    alreadyConverted: false,
    invoiceId,
    invoiceNumero
  };
};

module.exports = {
  convertQuoteToInvoice
};
