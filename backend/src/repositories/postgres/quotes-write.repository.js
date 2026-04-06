const { exec } = require('./shared');
const { findOrCreateClient } = require('./clients.repository');
const { toDocumentClient } = require('../clients.repository');

const normalizeQuoteForStore = async (db, quote) => {
  if (!quote || typeof quote !== 'object' || !quote.id) return null;

  const preferredId = typeof quote.clientId === 'string' ? quote.clientId : null;
  const resolvedClient = await findOrCreateClient(db, quote.client, preferredId);

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

const putQuote = async (db, quote) => {
  if (!quote || !quote.id) return false;
  const normalized = await normalizeQuoteForStore(db, quote);
  if (!normalized) return false;

  await exec(
    `
      INSERT INTO quotes (id, payload, updated_at, client_id)
      VALUES ($1, $2::jsonb, $3, $4)
      ON CONFLICT (id) DO UPDATE SET
        payload = EXCLUDED.payload,
        updated_at = EXCLUDED.updated_at,
        client_id = EXCLUDED.client_id
    `,
    [
      normalized.id,
      JSON.stringify(normalized),
      new Date().toISOString(),
      normalized.clientId ?? null
    ]
  );

  return true;
};

const deleteQuote = async (_db, id) => {
  await exec('DELETE FROM quotes WHERE id = $1', [id]);
  return true;
};

module.exports = {
  normalizeQuoteForStore,
  putQuote,
  deleteQuote
};
