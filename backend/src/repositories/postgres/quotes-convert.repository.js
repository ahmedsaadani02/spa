const { randomUUID } = require('crypto');
const { withClient } = require('../../db/postgres');
const { toDocumentClient } = require('../clients.repository');
const { applyInvoicePayloadDefaults } = require('../shared/invoice-payload.shared');
const { getNextPurchaseOrderNumber } = require('../shared/purchase-order-number.shared');

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

const hydrateQuote = (row) => {
  const parsed = parsePayload(row?.payload);
  if (!parsed || typeof parsed !== 'object') {
    return null;
  }

  const clientRow = mapClientRow(row);
  const payloadClientId = typeof parsed.clientId === 'string' && parsed.clientId.trim()
    ? parsed.clientId.trim()
    : null;

  const next = {
    ...parsed,
    clientId: payloadClientId ?? row.client_id ?? null
  };

  if (clientRow) {
    next.client = toDocumentClient(clientRow);
  } else if (row.client_id && !next.clientId) {
    next.clientId = row.client_id;
  }

  return next;
};

const getNextInvoiceNumber = async (client) => {
  const year = new Date().getFullYear();
  const prefix = `SPA-${year}-`;
  const result = await client.query(`SELECT payload->>'numero' AS numero FROM invoices`);
  const maxSeq = result.rows.reduce((max, row) => {
    const numero = typeof row?.numero === 'string' ? row.numero : '';
    if (!numero.startsWith(prefix)) return max;
    const seq = Number(numero.slice(prefix.length));
    if (!Number.isFinite(seq)) return max;
    return Math.max(max, seq);
  }, 0);
  return `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
};

const getNextInvoicePurchaseOrderNumber = async (client) => {
  const result = await client.query(`
    SELECT payload->>'purchaseOrderNumber' AS purchase_order_number FROM invoices
  `);

  return getNextPurchaseOrderNumber(result.rows.map((row) => row?.purchase_order_number ?? null));
};

const markQuoteAsInvoiced = async (client, quoteRow, quote, invoiceId) => {
  const now = new Date().toISOString();
  const updatedQuote = {
    ...quote,
    clientId: quote.clientId ?? quoteRow.client_id ?? null,
    status: 'invoiced',
    convertedInvoiceId: invoiceId,
    convertedAt: now
  };

  await client.query(
    `
      UPDATE quotes
      SET payload = $1::jsonb,
          updated_at = $2,
          client_id = $3
      WHERE id = $4
    `,
    [JSON.stringify(updatedQuote), now, updatedQuote.clientId ?? quoteRow.client_id ?? null, quoteRow.id]
  );
};

const convertQuoteToInvoice = async (_db, quoteId) => {
  if (!quoteId || typeof quoteId !== 'string') {
    return { ok: false, message: 'QUOTE_ID_REQUIRED' };
  }

  return withClient(async (client) => {
    await client.query('BEGIN');

    try {
      const quoteResult = await client.query(
        `
          SELECT
            q.id,
            q.payload,
            q.client_id,
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
          WHERE q.id = $1
          FOR UPDATE OF q
        `,
        [quoteId]
      );

      const quoteRow = quoteResult.rows[0] ?? null;
      if (!quoteRow) {
        await client.query('COMMIT');
        return { ok: false, message: 'QUOTE_NOT_FOUND' };
      }

      const quote = hydrateQuote(quoteRow);
      const quoteAlreadyConverted = quote?.status === 'invoiced' || !!quote?.convertedInvoiceId;

      const linkedInvoiceResult = await client.query(
        `
          SELECT id, payload, quote_id
          FROM invoices
          WHERE quote_id = $1
          LIMIT 1
        `,
        [quoteId]
      );
      const linkedInvoice = linkedInvoiceResult.rows[0] ?? null;

      if (linkedInvoice) {
        const parsed = parsePayload(linkedInvoice.payload);
        if (!quote?.convertedInvoiceId) {
          await markQuoteAsInvoiced(client, quoteRow, quote, linkedInvoice.id);
        }
        await client.query('COMMIT');
        return {
          ok: false,
          alreadyConverted: true,
          invoiceId: linkedInvoice.id,
          invoiceNumero: parsed?.numero ?? null,
          message: 'Ce devis a deja ete converti en facture.'
        };
      }

      if (quoteAlreadyConverted && quote?.convertedInvoiceId) {
        const existingByIdResult = await client.query(
          `
            SELECT id, payload, quote_id
            FROM invoices
            WHERE id = $1
            LIMIT 1
          `,
          [quote.convertedInvoiceId]
        );
        const existingById = existingByIdResult.rows[0] ?? null;

        if (existingById) {
          const parsed = parsePayload(existingById.payload);
          await client.query(
            `
              UPDATE invoices
              SET quote_id = COALESCE(quote_id, $1)
              WHERE id = $2
            `,
            [quoteId, existingById.id]
          );
          await markQuoteAsInvoiced(client, quoteRow, quote, existingById.id);
          await client.query('COMMIT');
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
      const invoiceNumero = await getNextInvoiceNumber(client);
      const purchaseOrderNumber = await getNextInvoicePurchaseOrderNumber(client);
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
        clientId: quote?.clientId ?? quoteRow.client_id ?? null,
        client: safeClient,
        lignes: Array.isArray(quote?.lignes) ? quote.lignes : [],
        remiseType: quote?.remiseType,
        remiseValue: quote?.remiseValue,
        notes: quote?.notes ?? '',
        conditions: quote?.conditions ?? '',
        quoteId: quote?.id ?? quoteId,
        sourceQuoteNumber: quote?.numero,
        purchaseOrderNumber
      });

      await client.query(
        `
          INSERT INTO invoices (id, payload, updated_at, client_id, quote_id)
          VALUES ($1, $2::jsonb, $3, $4, $5)
        `,
        [
          normalizedInvoice.id,
          JSON.stringify(normalizedInvoice),
          now,
          normalizedInvoice.clientId ?? null,
          quoteId
        ]
      );

      await markQuoteAsInvoiced(client, quoteRow, quote, invoiceId);
      await client.query('COMMIT');

      return {
        ok: true,
        alreadyConverted: false,
        invoiceId,
        invoiceNumero
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
};

module.exports = {
  convertQuoteToInvoice
};
