const { randomUUID } = require('crypto');
const { backfillDocumentClientLinks, findOrCreateClient, toDocumentClient } = require('../repositories/clients.repository');
const { assertPermission } = require('../services/auth-session.service');

const registerHandle = (ipcMain, channel, handler) => {
  try {
    ipcMain.removeHandler(channel);
  } catch {
    // ignore
  }
  ipcMain.handle(channel, handler);
};

const normalizeQuoteForStore = (db, quote) => {
  if (!quote || typeof quote !== 'object' || !quote.id) return null;

  const preferredId = typeof quote.clientId === 'string' ? quote.clientId : null;
  const resolvedClient = findOrCreateClient(db, quote.client, preferredId);

  if (!resolvedClient) {
    return {
      ...quote,
      clientId: null
    };
  }

  return {
    ...quote,
    clientId: resolvedClient.id,
    client: toDocumentClient(resolvedClient)
  };
};

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

const putQuote = (db, quote) => {
  if (!quote || !quote.id) return false;
  const normalized = normalizeQuoteForStore(db, quote);
  if (!normalized) return false;
  db.prepare(`
    INSERT INTO quotes (id, payload, updated_at, client_id)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      payload = excluded.payload,
      updated_at = excluded.updated_at,
      client_id = excluded.client_id
  `).run(
    normalized.id,
    JSON.stringify(normalized),
    new Date().toISOString(),
    normalized.clientId ?? null
  );
  return true;
};

const deleteQuote = (db, id) => {
  db.prepare('DELETE FROM quotes WHERE id = ?').run(id);
  return true;
};

const convertQuoteToInvoice = (db, quoteId) => {
  console.log('[ipc] quotes:convertToInvoice invoked', { quoteId });
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
  const invoice = {
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
    sourceQuoteNumber: quote.numero
  };

  const normalizedInvoice = {
    ...invoice,
    clientId: invoice.clientId ?? null
  };

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

const registerQuotesHandlers = (ipcMain, getDb) => {
  console.log('[ipc] registering quotes handlers');

  registerHandle(ipcMain, 'quotes:getAll', () => {
    try {
      assertPermission('manageQuotes');
      return listQuotes(getDb());
    } catch (error) {
      console.error('[quotes:getAll] error', error);
      return [];
    }
  });

  registerHandle(ipcMain, 'quotes:getById', (event, id) => {
    try {
      assertPermission('manageQuotes');
      return getQuoteById(getDb(), id);
    } catch (error) {
      console.error('[quotes:getById] error', error);
      return null;
    }
  });

  registerHandle(ipcMain, 'quotes:put', (event, quote) => {
    try {
      assertPermission('manageQuotes');
      return putQuote(getDb(), quote);
    } catch (error) {
      console.error('[quotes:put] error', error);
      return false;
    }
  });

  registerHandle(ipcMain, 'quotes:delete', (event, id) => {
    try {
      assertPermission('manageQuotes');
      return deleteQuote(getDb(), id);
    } catch (error) {
      console.error('[quotes:delete] error', error);
      return false;
    }
  });

  registerHandle(ipcMain, 'quotes:convertToInvoice', (event, quoteId) => {
    try {
      assertPermission('manageQuotes');
      assertPermission('manageInvoices');
      return convertQuoteToInvoice(getDb(), quoteId);
    } catch (error) {
      console.error('[quotes:convertToInvoice] error', error);
      return { ok: false, message: error.message || 'QUOTE_CONVERT_FAILED' };
    }
  });

  console.log('[ipc] quotes:convertToInvoice registered');
  console.log('[ipc] quotes handlers ready');
};

module.exports = {
  registerQuotesHandlers,
  listQuotes,
  getQuoteById,
  putQuote,
  deleteQuote,
  convertQuoteToInvoice
};
