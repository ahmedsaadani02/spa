const { backfillDocumentClientLinks, findOrCreateClient, toDocumentClient } = require('../db/clients');
const { assertPermission } = require('../auth/service');

const normalizeInvoiceForStore = (db, invoice) => {
  if (!invoice || typeof invoice !== 'object' || !invoice.id) return null;

  const preferredId = typeof invoice.clientId === 'string' ? invoice.clientId : null;
  const resolvedClient = findOrCreateClient(db, invoice.client, preferredId);

  if (!resolvedClient) {
    return {
      ...invoice,
      clientId: null
    };
  }

  return {
    ...invoice,
    clientId: resolvedClient.id,
    client: toDocumentClient(resolvedClient)
  };
};

const toInvoiceWithQuoteId = (row) => {
  const parsed = JSON.parse(row.payload);
  const withClient = row.client_id && !parsed.clientId
    ? { ...parsed, clientId: row.client_id }
    : parsed;

  if (row.quote_id && !withClient.quoteId) {
    return { ...withClient, quoteId: row.quote_id };
  }

  return withClient;
};

const registerInvoicesHandlers = (ipcMain, getDb) => {
  ipcMain.handle('invoices:getAll', () => {
    try {
      assertPermission('manageInvoices');
      const db = getDb();
      backfillDocumentClientLinks(db, 'invoices');
      return db.prepare('SELECT payload, client_id, quote_id FROM invoices').all().map(toInvoiceWithQuoteId);
    } catch (error) {
      console.error('[invoices:getAll] error', error);
      return [];
    }
  });

  ipcMain.handle('invoices:getById', (event, id) => {
    try {
      assertPermission('manageInvoices');
      const db = getDb();
      backfillDocumentClientLinks(db, 'invoices');
      const row = db.prepare('SELECT payload, client_id, quote_id FROM invoices WHERE id = ?').get(id);
      if (!row) return null;
      return toInvoiceWithQuoteId(row);
    } catch (error) {
      console.error('[invoices:getById] error', error);
      return null;
    }
  });

  ipcMain.handle('invoices:put', (event, invoice) => {
    try {
      assertPermission('manageInvoices');
      if (!invoice || !invoice.id) return false;
      const db = getDb();
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
    } catch (error) {
      console.error('[invoices:put] error', error);
      return false;
    }
  });

  ipcMain.handle('invoices:delete', (event, id) => {
    try {
      assertPermission('manageInvoices');
      const db = getDb();
      const invoiceRow = db.prepare('SELECT quote_id, payload FROM invoices WHERE id = ?').get(id);
      if (!invoiceRow) {
        return false;
      }

      const explicitQuoteId = typeof invoiceRow.quote_id === 'string' && invoiceRow.quote_id.trim()
        ? invoiceRow.quote_id.trim()
        : null;
      let payloadQuoteId = null;
      try {
        const parsedInvoice = JSON.parse(invoiceRow.payload);
        if (typeof parsedInvoice?.quoteId === 'string' && parsedInvoice.quoteId.trim()) {
          payloadQuoteId = parsedInvoice.quoteId.trim();
        }
      } catch {
        // ignore parse failures for cleanup path
      }
      const linkedQuoteId = explicitQuoteId || payloadQuoteId;

      db.prepare('DELETE FROM invoices WHERE id = ?').run(id);

      if (linkedQuoteId) {
        const replacementInvoice = db.prepare(`
          SELECT id
          FROM invoices
          WHERE quote_id = ?
          LIMIT 1
        `).get(linkedQuoteId);

        const quoteRow = db.prepare('SELECT id, payload, client_id FROM quotes WHERE id = ? LIMIT 1').get(linkedQuoteId);
        if (quoteRow) {
          try {
            const parsedQuote = JSON.parse(quoteRow.payload);
            const now = new Date().toISOString();
            const normalizedClientId = parsedQuote?.clientId ?? quoteRow.client_id ?? null;

            if (replacementInvoice?.id) {
              const updatedInvoicedQuote = {
                ...parsedQuote,
                status: 'invoiced',
                convertedInvoiceId: replacementInvoice.id,
                convertedAt: parsedQuote?.convertedAt ?? now,
                clientId: normalizedClientId
              };
              db.prepare(`
                UPDATE quotes
                SET payload = ?, updated_at = ?, client_id = ?
                WHERE id = ?
              `).run(
                JSON.stringify(updatedInvoicedQuote),
                now,
                normalizedClientId,
                quoteRow.id
              );
            } else {
              const updatedDraftQuote = { ...parsedQuote, status: 'draft', clientId: normalizedClientId };
              delete updatedDraftQuote.convertedInvoiceId;
              delete updatedDraftQuote.convertedAt;
              db.prepare(`
                UPDATE quotes
                SET payload = ?, updated_at = ?, client_id = ?
                WHERE id = ?
              `).run(
                JSON.stringify(updatedDraftQuote),
                now,
                normalizedClientId,
                quoteRow.id
              );
            }
          } catch {
            // ignore quote payload parse failures
          }
        }
      }
      return true;
    } catch (error) {
      console.error('[invoices:delete] error', error);
      return false;
    }
  });
};

module.exports = { registerInvoicesHandlers };
