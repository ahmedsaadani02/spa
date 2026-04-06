const { withClient } = require('../../db/postgres');

const parsePayload = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const deleteInvoice = async (_db, id) => {
  return withClient(async (client) => {
    await client.query('BEGIN');

    try {
      const invoiceResult = await client.query(
        `
          SELECT quote_id, payload
          FROM invoices
          WHERE id = $1
          LIMIT 1
        `,
        [id]
      );
      const invoiceRow = invoiceResult.rows[0] ?? null;

      if (!invoiceRow) {
        await client.query('COMMIT');
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

      await client.query('DELETE FROM invoices WHERE id = $1', [id]);

      if (linkedQuoteId) {
        const replacementInvoiceResult = await client.query(
          `
            SELECT id
            FROM invoices
            WHERE quote_id = $1
            LIMIT 1
          `,
          [linkedQuoteId]
        );
        const replacementInvoice = replacementInvoiceResult.rows[0] ?? null;

        const quoteResult = await client.query(
          `
            SELECT id, payload, client_id
            FROM quotes
            WHERE id = $1
            LIMIT 1
          `,
          [linkedQuoteId]
        );
        const quoteRow = quoteResult.rows[0] ?? null;
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
            await client.query(
              `
                UPDATE quotes
                SET payload = $1::jsonb,
                    updated_at = $2,
                    client_id = $3
                WHERE id = $4
              `,
              [
                JSON.stringify(updatedInvoicedQuote),
                now,
                normalizedClientId,
                quoteRow.id
              ]
            );
          } else {
            const updatedDraftQuote = { ...parsedQuote, status: 'draft', clientId: normalizedClientId };
            delete updatedDraftQuote.convertedInvoiceId;
            delete updatedDraftQuote.convertedAt;
            await client.query(
              `
                UPDATE quotes
                SET payload = $1::jsonb,
                    updated_at = $2,
                    client_id = $3
                WHERE id = $4
              `,
              [
                JSON.stringify(updatedDraftQuote),
                now,
                normalizedClientId,
                quoteRow.id
              ]
            );
          }
        }
      }

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
};

module.exports = {
  deleteInvoice
};
