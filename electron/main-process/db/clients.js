const { randomUUID } = require('crypto');

const PHONE_SQL_EXPR = "REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(LOWER(IFNULL(telephone, '')), ' ', ''), '-', ''), '(', ''), ')', ''), '.', '')";

const clean = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ');
};

const toKey = (value) => clean(value).toLowerCase();

const normalizePhone = (value) => clean(value).replace(/[^\d+]/g, '').toLowerCase();

const normalizeClientInput = (input) => {
  const nom = clean(input?.nom);
  const adresse = clean(input?.adresse);
  const telephoneRaw = clean(input?.telephone || input?.tel);
  const telephone = clean(telephoneRaw);
  const mf = clean(input?.mf);
  const email = toKey(input?.email);

  return {
    nom,
    adresse,
    telephone,
    mf,
    email,
    nomKey: toKey(nom),
    mfKey: toKey(mf),
    emailKey: email,
    telephoneKey: normalizePhone(telephone)
  };
};

const mapClientRow = (row) => {
  if (!row) return null;
  const telephone = clean(row.telephone);
  return {
    id: row.id,
    nom: clean(row.nom),
    adresse: clean(row.adresse),
    tel: telephone,
    telephone,
    mf: clean(row.mf),
    email: toKey(row.email),
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || ''
  };
};

const toDocumentClient = (row) => {
  const client = mapClientRow(row);
  if (!client) return null;
  return {
    id: client.id,
    nom: client.nom,
    adresse: client.adresse,
    tel: client.tel,
    telephone: client.telephone,
    mf: client.mf,
    email: client.email
  };
};

const createClientId = () => randomUUID();

const getClientRowById = (db, id) => {
  if (!id) return null;
  return db.prepare(`
    SELECT id, nom, telephone, adresse, mf, email, created_at, updated_at
    FROM clients
    WHERE id = ?
  `).get(id);
};

const listClients = (db) => db.prepare(`
  SELECT id, nom, telephone, adresse, mf, email, created_at, updated_at
  FROM clients
  ORDER BY LOWER(nom), created_at
`).all().map(mapClientRow);

const searchClients = (db, query) => {
  const term = clean(query);
  if (!term) return listClients(db);

  const termKey = toKey(term);
  const phoneKey = normalizePhone(term);
  const phoneLike = phoneKey ? `%${phoneKey}%` : '%';

  return db.prepare(`
    SELECT id, nom, telephone, adresse, mf, email, created_at, updated_at
    FROM clients
    WHERE LOWER(nom) LIKE @term
      OR LOWER(IFNULL(email, '')) LIKE @term
      OR LOWER(IFNULL(mf, '')) LIKE @term
      OR ${PHONE_SQL_EXPR} LIKE @phone
    ORDER BY LOWER(nom), created_at
  `).all({
    term: `%${termKey}%`,
    phone: phoneLike
  }).map(mapClientRow);
};

const upsertClient = (db, input) => {
  const normalized = normalizeClientInput(input);
  if (!normalized.nom) return null;

  const now = new Date().toISOString();
  const requestedId = clean(input?.id);
  const existing = requestedId ? getClientRowById(db, requestedId) : null;
  const id = existing?.id ?? requestedId ?? createClientId();

  db.prepare(`
    INSERT INTO clients (id, nom, telephone, adresse, mf, email, created_at, updated_at)
    VALUES (@id, @nom, @telephone, @adresse, @mf, @email, @createdAt, @updatedAt)
    ON CONFLICT(id) DO UPDATE SET
      nom = excluded.nom,
      telephone = excluded.telephone,
      adresse = excluded.adresse,
      mf = excluded.mf,
      email = excluded.email,
      updated_at = excluded.updated_at
  `).run({
    id,
    nom: normalized.nom,
    telephone: normalized.telephone,
    adresse: normalized.adresse,
    mf: normalized.mf,
    email: normalized.email,
    createdAt: existing?.created_at ?? now,
    updatedAt: now
  });

  return mapClientRow(getClientRowById(db, id));
};

const deleteClientById = (db, id) => {
  if (!id) return false;
  const info = db.prepare('DELETE FROM clients WHERE id = ?').run(id);
  return info.changes > 0;
};

const findEquivalentClientRow = (db, normalized) => {
  if (normalized.emailKey) {
    const byEmail = db.prepare(`
      SELECT id, nom, telephone, adresse, mf, email, created_at, updated_at
      FROM clients
      WHERE LOWER(TRIM(IFNULL(email, ''))) = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `).get(normalized.emailKey);
    if (byEmail) return byEmail;
  }

  if (normalized.telephoneKey) {
    const byPhone = db.prepare(`
      SELECT id, nom, telephone, adresse, mf, email, created_at, updated_at
      FROM clients
      WHERE ${PHONE_SQL_EXPR} = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `).get(normalized.telephoneKey);
    if (byPhone) return byPhone;
  }

  if (normalized.nomKey && normalized.telephoneKey) {
    const byNomPhone = db.prepare(`
      SELECT id, nom, telephone, adresse, mf, email, created_at, updated_at
      FROM clients
      WHERE LOWER(TRIM(nom)) = ?
        AND ${PHONE_SQL_EXPR} = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `).get(normalized.nomKey, normalized.telephoneKey);
    if (byNomPhone) return byNomPhone;
  }

  if (normalized.nomKey && normalized.emailKey) {
    const byNomEmail = db.prepare(`
      SELECT id, nom, telephone, adresse, mf, email, created_at, updated_at
      FROM clients
      WHERE LOWER(TRIM(nom)) = ?
        AND LOWER(TRIM(IFNULL(email, ''))) = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `).get(normalized.nomKey, normalized.emailKey);
    if (byNomEmail) return byNomEmail;
  }

  if (normalized.nomKey && normalized.mfKey) {
    const byNomMf = db.prepare(`
      SELECT id, nom, telephone, adresse, mf, email, created_at, updated_at
      FROM clients
      WHERE LOWER(TRIM(nom)) = ?
        AND LOWER(TRIM(IFNULL(mf, ''))) = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `).get(normalized.nomKey, normalized.mfKey);
    if (byNomMf) return byNomMf;
  }

  return null;
};

const patchMissingClientFields = (db, row, normalized) => {
  const next = {
    adresse: clean(row.adresse) || normalized.adresse,
    telephone: clean(row.telephone) || normalized.telephone,
    mf: clean(row.mf) || normalized.mf,
    email: toKey(row.email) || normalized.email
  };

  const changed = (
    clean(row.adresse) !== next.adresse ||
    clean(row.telephone) !== next.telephone ||
    clean(row.mf) !== next.mf ||
    toKey(row.email) !== next.email
  );

  if (!changed) return row;

  db.prepare(`
    UPDATE clients
    SET adresse = @adresse,
        telephone = @telephone,
        mf = @mf,
        email = @email,
        updated_at = @updatedAt
    WHERE id = @id
  `).run({
    id: row.id,
    adresse: next.adresse,
    telephone: next.telephone,
    mf: next.mf,
    email: next.email,
    updatedAt: new Date().toISOString()
  });

  return getClientRowById(db, row.id);
};

const findOrCreateClient = (db, input, preferredId = null) => {
  const normalized = normalizeClientInput(input);
  const preferred = preferredId ? getClientRowById(db, preferredId) : null;
  if (preferred) {
    const hasInput = normalized.nom || normalized.email || normalized.telephone || normalized.mf || normalized.adresse;
    if (!hasInput) return mapClientRow(preferred);
    return mapClientRow(patchMissingClientFields(db, preferred, normalized));
  }

  const hasData = normalized.nom || normalized.email || normalized.telephone || normalized.mf;
  if (!hasData) return null;
  if (!normalized.nom) return null;

  const matched = findEquivalentClientRow(db, normalized);
  if (matched) {
    return mapClientRow(patchMissingClientFields(db, matched, normalized));
  }

  const id = createClientId();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO clients (id, nom, telephone, adresse, mf, email, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    normalized.nom,
    normalized.telephone,
    normalized.adresse,
    normalized.mf,
    normalized.email,
    now,
    now
  );

  return mapClientRow(getClientRowById(db, id));
};

const normalizeDocument = (doc, rowClientId) => {
  if (!doc || typeof doc !== 'object') return null;
  const next = { ...doc };
  if (rowClientId && !next.clientId) {
    next.clientId = rowClientId;
  }
  return next;
};

const assertDocumentTable = (tableName) => {
  if (tableName !== 'invoices' && tableName !== 'quotes') {
    throw new Error(`Unsupported table "${tableName}"`);
  }
};

const backfillDocumentClientLinks = (db, tableName) => {
  assertDocumentTable(tableName);

  const rows = db.prepare(`SELECT id, payload, client_id FROM ${tableName}`).all();
  if (!rows.length) return;

  const update = db.prepare(`
    UPDATE ${tableName}
    SET payload = @payload,
        client_id = @clientId,
        updated_at = @updatedAt
    WHERE id = @id
  `);

  const tx = db.transaction(() => {
    rows.forEach((row) => {
      let parsed;
      try {
        parsed = JSON.parse(row.payload);
      } catch {
        return;
      }

      const document = normalizeDocument(parsed, row.client_id);
      if (!document) return;

      const preferredId = clean(document.clientId || row.client_id);
      const resolved = findOrCreateClient(db, document.client, preferredId || null);
      if (!resolved) return;

      const nextPayload = {
        ...document,
        clientId: resolved.id,
        client: toDocumentClient(resolved)
      };

      const serialized = JSON.stringify(nextPayload);
      const needsUpdate = serialized !== row.payload || (row.client_id ?? null) !== resolved.id;
      if (!needsUpdate) return;

      update.run({
        id: row.id,
        payload: serialized,
        clientId: resolved.id,
        updatedAt: new Date().toISOString()
      });
    });
  });

  tx();
};

module.exports = {
  mapClientRow,
  toDocumentClient,
  listClients,
  searchClients,
  upsertClient,
  deleteClientById,
  getClientRowById,
  findOrCreateClient,
  backfillDocumentClientLinks
};
