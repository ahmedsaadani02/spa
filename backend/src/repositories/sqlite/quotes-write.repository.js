const { findOrCreateClient, toDocumentClient } = require('../clients.repository');

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

module.exports = {
  normalizeQuoteForStore,
  putQuote,
  deleteQuote
};
