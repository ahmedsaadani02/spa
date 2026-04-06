const { randomUUID } = require('crypto');
const { one, many, exec } = require('./shared');

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

const createClientId = () => randomUUID();

const getClientRowById = async (_db, id) => {
  if (!id) return null;
  return one(
    `
      SELECT id, nom, telephone, adresse, mf, email, created_at, updated_at
      FROM clients
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );
};

const listClients = async () => {
  const rows = await many(`
    SELECT id, nom, telephone, adresse, mf, email, created_at, updated_at
    FROM clients
    ORDER BY LOWER(nom), created_at
  `);
  return rows.map(mapClientRow);
};

const searchClients = async (_db, queryText) => {
  const term = clean(queryText);
  if (!term) return listClients();

  const termKey = toKey(term);
  const phoneKey = normalizePhone(term);
  const phoneLike = phoneKey ? `%${phoneKey}%` : '%';

  const rows = await many(
    `
      SELECT id, nom, telephone, adresse, mf, email, created_at, updated_at
      FROM clients
      WHERE LOWER(nom) LIKE $1
         OR LOWER(COALESCE(email, '')) LIKE $1
         OR LOWER(COALESCE(mf, '')) LIKE $1
         OR regexp_replace(LOWER(COALESCE(telephone, '')), '[^0-9+]', '', 'g') LIKE $2
      ORDER BY LOWER(nom), created_at
    `,
    [`%${termKey}%`, phoneLike]
  );

  return rows.map(mapClientRow);
};

const upsertClient = async (db, input) => {
  const normalized = normalizeClientInput(input);
  if (!normalized.nom) return null;

  const now = new Date().toISOString();
  const requestedId = clean(input?.id) || null;
  const existing = requestedId ? await getClientRowById(db, requestedId) : null;
  const id = existing?.id ?? requestedId ?? createClientId();

  await exec(
    `
      INSERT INTO clients (id, nom, telephone, adresse, mf, email, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        nom = EXCLUDED.nom,
        telephone = EXCLUDED.telephone,
        adresse = EXCLUDED.adresse,
        mf = EXCLUDED.mf,
        email = EXCLUDED.email,
        updated_at = EXCLUDED.updated_at
    `,
    [
      id,
      normalized.nom,
      normalized.telephone,
      normalized.adresse,
      normalized.mf,
      normalized.email,
      existing?.created_at ?? now,
      now
    ]
  );

  return mapClientRow(await getClientRowById(db, id));
};

const deleteClientById = async (_db, id) => {
  if (!id) return false;
  const result = await exec('DELETE FROM clients WHERE id = $1', [id]);
  return Number(result.rowCount ?? 0) > 0;
};

const findEquivalentClientRow = async (normalized) => {
  if (normalized.emailKey) {
    const byEmail = await one(
      `
        SELECT id, nom, telephone, adresse, mf, email, created_at, updated_at
        FROM clients
        WHERE LOWER(TRIM(COALESCE(email, ''))) = $1
        ORDER BY updated_at DESC
        LIMIT 1
      `,
      [normalized.emailKey]
    );
    if (byEmail) return byEmail;
  }

  if (normalized.telephoneKey) {
    const byPhone = await one(
      `
        SELECT id, nom, telephone, adresse, mf, email, created_at, updated_at
        FROM clients
        WHERE regexp_replace(LOWER(COALESCE(telephone, '')), '[^0-9+]', '', 'g') = $1
        ORDER BY updated_at DESC
        LIMIT 1
      `,
      [normalized.telephoneKey]
    );
    if (byPhone) return byPhone;
  }

  if (normalized.nomKey && normalized.telephoneKey) {
    const byNomPhone = await one(
      `
        SELECT id, nom, telephone, adresse, mf, email, created_at, updated_at
        FROM clients
        WHERE LOWER(TRIM(nom)) = $1
          AND regexp_replace(LOWER(COALESCE(telephone, '')), '[^0-9+]', '', 'g') = $2
        ORDER BY updated_at DESC
        LIMIT 1
      `,
      [normalized.nomKey, normalized.telephoneKey]
    );
    if (byNomPhone) return byNomPhone;
  }

  if (normalized.nomKey && normalized.emailKey) {
    const byNomEmail = await one(
      `
        SELECT id, nom, telephone, adresse, mf, email, created_at, updated_at
        FROM clients
        WHERE LOWER(TRIM(nom)) = $1
          AND LOWER(TRIM(COALESCE(email, ''))) = $2
        ORDER BY updated_at DESC
        LIMIT 1
      `,
      [normalized.nomKey, normalized.emailKey]
    );
    if (byNomEmail) return byNomEmail;
  }

  if (normalized.nomKey && normalized.mfKey) {
    const byNomMf = await one(
      `
        SELECT id, nom, telephone, adresse, mf, email, created_at, updated_at
        FROM clients
        WHERE LOWER(TRIM(nom)) = $1
          AND LOWER(TRIM(COALESCE(mf, ''))) = $2
        ORDER BY updated_at DESC
        LIMIT 1
      `,
      [normalized.nomKey, normalized.mfKey]
    );
    if (byNomMf) return byNomMf;
  }

  return null;
};

const patchMissingClientFields = async (db, row, normalized) => {
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

  await exec(
    `
      UPDATE clients
      SET adresse = $1,
          telephone = $2,
          mf = $3,
          email = $4,
          updated_at = $5
      WHERE id = $6
    `,
    [next.adresse, next.telephone, next.mf, next.email, new Date().toISOString(), row.id]
  );

  return getClientRowById(db, row.id);
};

const findOrCreateClient = async (db, input, preferredId = null) => {
  const normalized = normalizeClientInput(input);
  const preferred = preferredId ? await getClientRowById(db, preferredId) : null;
  if (preferred) {
    const hasInput = normalized.nom || normalized.email || normalized.telephone || normalized.mf || normalized.adresse;
    if (!hasInput) return mapClientRow(preferred);
    return mapClientRow(await patchMissingClientFields(db, preferred, normalized));
  }

  const hasData = normalized.nom || normalized.email || normalized.telephone || normalized.mf;
  if (!hasData || !normalized.nom) return null;

  const matched = await findEquivalentClientRow(normalized);
  if (matched) {
    return mapClientRow(await patchMissingClientFields(db, matched, normalized));
  }

  const id = createClientId();
  const now = new Date().toISOString();
  await exec(
    `
      INSERT INTO clients (id, nom, telephone, adresse, mf, email, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [id, normalized.nom, normalized.telephone, normalized.adresse, normalized.mf, normalized.email, now, now]
  );

  return mapClientRow(await getClientRowById(db, id));
};

module.exports = {
  mapClientRow,
  listClients,
  searchClients,
  upsertClient,
  deleteClientById,
  getClientRowById,
  findOrCreateClient
};
