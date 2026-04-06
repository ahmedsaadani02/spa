const parsePayload = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const deleteInvoice = (db, id) => {
  const invoiceRow = db.prepare('SELECT quote_id, payload FROM invoices WHERE id = ?').get(id);
  if (!invoiceRow) {
    return false;
  }

  const explicitQuoteId = typeof invoiceRow.quote_id === 'string' && invoiceRow.quote_id.trim()
    ? invoiceRow.quote_id.trim()
    : null;
  const parsedInvoice = parsePayload(invoiceRow.payload);
  const payloadQuoteId = typeof parsedInvoice?.quoteId === 'string' && parsedInvoice.quoteId.trim()
    ? parsedInvoice.quoteId.trim()
    : null;
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
    const parsedQuote = parsePayload(quoteRow?.payload);

    if (quoteRow && parsedQuote) {
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
    }
  }

  return true;
};

module.exports = {
  deleteInvoice
};
