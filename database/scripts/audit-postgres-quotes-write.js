#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..', '..');
const reportDir = path.join(projectRoot, 'database', 'reports');
const tempDir = path.join(projectRoot, 'database', 'tmp');

try {
  require('dotenv').config({ path: path.join(projectRoot, '.env') });
} catch (_error) {
  // Ignore if dotenv is unavailable in the current shell context.
}

const resolveSqlitePath = () => {
  const explicit = typeof process.env.SQLITE_PATH === 'string' ? process.env.SQLITE_PATH.trim() : '';
  if (explicit) return explicit;

  const configured = typeof process.env.DATABASE_PATH === 'string' ? process.env.DATABASE_PATH.trim() : '';
  if (configured) return configured;

  if (process.env.APPDATA) {
    return path.join(process.env.APPDATA, 'spa-invoice-desktop', 'spa.db');
  }

  return path.join(projectRoot, 'backend', 'data', 'spa.db');
};

const timestampSlug = () => new Date().toISOString().replace(/[:.]/g, '-');
const nowIso = () => new Date().toISOString();

const sourceSqlitePath = resolveSqlitePath();
const sqliteCopyPath = path.join(tempDir, `quotes-write-audit.${timestampSlug()}.sqlite`);
fs.mkdirSync(tempDir, { recursive: true });
fs.copyFileSync(sourceSqlitePath, sqliteCopyPath);

process.env.DATABASE_PATH = sqliteCopyPath;
process.env.DB_DRIVER = 'postgres';
process.env.DB_ENABLE_POSTGRES_QUOTES_READ = '1';
process.env.DB_ENABLE_POSTGRES_QUOTES_WRITES = '1';

const { getDatabaseRoutingSummary } = require('../../backend/src/config/database');
const { startServer } = require('../../backend/server');
const { query, closePostgresPool } = require('../../backend/src/db/postgres');
const { hashPassword } = require('../../backend/src/services/auth-core.service');
const sqliteQuotesReadRepository = require('../../backend/src/repositories/sqlite/quotes-read.repository');
const sqliteQuotesWriteRepository = require('../../backend/src/repositories/sqlite/quotes-write.repository');

const loadBetterSqlite3 = () => {
  const candidates = [
    path.join(projectRoot, 'backend', 'node_modules', 'better-sqlite3'),
    path.join(projectRoot, 'node_modules', 'better-sqlite3'),
    'better-sqlite3'
  ];

  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch (_error) {
      // Try next candidate.
    }
  }

  throw new Error('Unable to load better-sqlite3 for quotes write audit.');
};

const Database = loadBetterSqlite3();

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const canonicalize = (value) => {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.keys(value)
    .sort()
    .reduce((accumulator, key) => {
      accumulator[key] = canonicalize(value[key]);
      return accumulator;
    }, {});
};

const normalizePhone = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const normalizeClientForParity = (client) => {
  if (!client || typeof client !== 'object') return null;
  return canonicalize({
    id: client.id ? '<client-id>' : null,
    nom: client.nom ?? '',
    adresse: client.adresse ?? '',
    tel: normalizePhone(client.tel ?? client.telephone ?? ''),
    telephone: normalizePhone(client.telephone ?? client.tel ?? ''),
    mf: client.mf ?? '',
    email: typeof client.email === 'string' ? client.email.toLowerCase() : ''
  });
};

const normalizeQuoteForParity = (quote) => {
  if (!quote || typeof quote !== 'object') return null;
  return canonicalize({
    id: quote.id ?? null,
    numero: quote.numero ?? '',
    date: quote.date ?? '',
    clientId: quote.clientId ? '<client-id>' : null,
    client: normalizeClientForParity(quote.client),
    lignes: Array.isArray(quote.lignes) ? quote.lignes : [],
    remiseType: quote.remiseType ?? null,
    remiseValue: quote.remiseValue ?? null,
    notes: quote.notes ?? '',
    conditions: quote.conditions ?? '',
    status: quote.status ?? null,
    convertedInvoiceId: quote.convertedInvoiceId ?? null,
    convertedAt: quote.convertedAt ?? null
  });
};

const normalizeClientRowForParity = (row) => {
  if (!row) return null;
  return canonicalize({
    id: row.id ? '<client-id>' : null,
    nom: row.nom ?? '',
    adresse: row.adresse ?? '',
    telephone: normalizePhone(row.telephone ?? row.tel ?? ''),
    tel: normalizePhone(row.tel ?? row.telephone ?? ''),
    mf: row.mf ?? '',
    email: typeof row.email === 'string' ? row.email.toLowerCase() : ''
  });
};

const normalizeResponseBody = async (response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch (_error) {
    return text;
  }
};

const snapshotPostgresState = async () => {
  const [quotesState, invoicesState, clientsState] = await Promise.all([
    query(`
      SELECT
        COUNT(*)::int AS count,
        COALESCE(string_agg(
          md5(concat_ws('|', id, COALESCE(client_id, ''), COALESCE(updated_at::text, ''), payload::text)),
          ',' ORDER BY id
        ), '') AS fingerprint
      FROM quotes
    `),
    query(`
      SELECT
        COUNT(*)::int AS count,
        COALESCE(string_agg(
          md5(concat_ws('|', id, COALESCE(client_id, ''), COALESCE(quote_id, ''), COALESCE(updated_at::text, ''), payload::text)),
          ',' ORDER BY id
        ), '') AS fingerprint
      FROM invoices
    `),
    query(`
      SELECT
        COUNT(*)::int AS count,
        COALESCE(string_agg(
          md5(concat_ws('|', id, COALESCE(nom, ''), COALESCE(telephone, ''), COALESCE(adresse, ''), COALESCE(mf, ''), COALESCE(email, ''), COALESCE(updated_at::text, ''))),
          ',' ORDER BY id
        ), '') AS fingerprint
      FROM clients
    `)
  ]);

  return {
    quotes: {
      count: Number(quotesState.rows[0]?.count ?? 0),
      fingerprint: quotesState.rows[0]?.fingerprint ?? ''
    },
    invoices: {
      count: Number(invoicesState.rows[0]?.count ?? 0),
      fingerprint: invoicesState.rows[0]?.fingerprint ?? ''
    },
    clients: {
      count: Number(clientsState.rows[0]?.count ?? 0),
      fingerprint: clientsState.rows[0]?.fingerprint ?? ''
    }
  };
};

const getPostgresQuoteRow = async (quoteId) => {
  const result = await query(`
    SELECT id, payload, client_id
    FROM quotes
    WHERE id = $1
    LIMIT 1
  `, [quoteId]);
  return result.rows[0] ?? null;
};

const getPostgresClientRow = async (clientId) => {
  if (!clientId) return null;
  const result = await query(`
    SELECT id, nom, telephone, adresse, mf, email
    FROM clients
    WHERE id = $1
    LIMIT 1
  `, [clientId]);
  return result.rows[0] ?? null;
};

const getSqliteQuoteRow = (db, quoteId) => db.prepare(`
  SELECT id, payload, client_id
  FROM quotes
  WHERE id = ?
  LIMIT 1
`).get(quoteId) ?? null;

const getSqliteClientRow = (db, clientId) => {
  if (!clientId) return null;
  return db.prepare(`
    SELECT id, nom, telephone, adresse, mf, email
    FROM clients
    WHERE id = ?
    LIMIT 1
  `).get(clientId) ?? null;
};

const writeReport = (report) => {
  fs.mkdirSync(reportDir, { recursive: true });

  const slug = timestampSlug();
  const jsonLatestPath = path.join(reportDir, 'postgres-quotes-write.latest.json');
  const markdownLatestPath = path.join(reportDir, 'postgres-quotes-write.latest.md');
  const jsonPath = path.join(reportDir, `postgres-quotes-write.${slug}.json`);
  const markdownPath = path.join(reportDir, `postgres-quotes-write.${slug}.md`);
  const artifacts = {
    jsonLatestPath,
    markdownLatestPath,
    jsonPath,
    markdownPath
  };

  report.artifacts = artifacts;

  fs.writeFileSync(jsonLatestPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(markdownLatestPath, toMarkdown(report));
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(markdownPath, toMarkdown(report));
};

const toMarkdown = (report) => {
  const lines = [];
  lines.push('# PostgreSQL Quotes Write Validation');
  lines.push('');
  lines.push(`- Status: \`${report.status}\``);
  lines.push(`- Started at: \`${report.startedAt}\``);
  lines.push(`- Finished at: \`${report.finishedAt}\``);
  lines.push(`- SQLite source kept: \`${report.sourceSqlitePath}\``);
  lines.push(`- SQLite audit copy used by local runtime: \`${report.sqliteCopyPath}\``);
  lines.push(`- DB driver forced for audit: \`${report.routing.configuredDriver}\``);
  lines.push(`- Active PostgreSQL scopes: \`${report.routing.activePostgresScopes.join(', ') || 'none'}\``);
  lines.push(`- Base URL: \`${report.baseUrl ?? 'n/a'}\``);
  lines.push('');
  lines.push('## Validated');
  lines.push('');
  report.validated.forEach((item) => lines.push(`- ${item}`));
  if (!report.validated.length) lines.push('- None.');
  lines.push('');
  lines.push('## HTTP Checks');
  lines.push('');
  report.httpChecks.forEach((item) => lines.push(`- ${item.name}: ${item.ok ? 'ok' : 'failed'}${item.detail ? ` (${item.detail})` : ''}`));
  lines.push('');
  lines.push('## Parity Checks');
  lines.push('');
  report.parityChecks.forEach((item) => lines.push(`- ${item.name}: ${item.ok ? 'ok' : 'failed'}${item.detail ? ` (${item.detail})` : ''}`));
  lines.push('');
  lines.push('## Scope Checks');
  lines.push('');
  report.scopeChecks.forEach((item) => lines.push(`- ${item.name}: ${item.ok ? 'ok' : 'failed'}${item.detail ? ` (${item.detail})` : ''}`));
  lines.push('');
  lines.push('## Remaining Risks');
  lines.push('');
  report.remainingRisks.forEach((item) => lines.push(`- ${item}`));
  if (!report.remainingRisks.length) lines.push('- None identified.');
  lines.push('');
  return `${lines.join('\n')}\n`;
};

async function main() {
  const sqliteDb = new Database(sqliteCopyPath);
  const sqliteClientCountBefore = Number(sqliteDb.prepare('SELECT COUNT(*) AS total FROM clients').get().total ?? 0);
  const suffix = Date.now().toString(36);
  const ownerId = `quotes-write-owner-${suffix}`;
  const ownerUsername = `quotes_write_owner_${suffix}`;
  const ownerEmail = `quotes-write-owner-${suffix}@example.test`;
  const ownerPassword = 'OwnerAudit#2026!';
  const year = new Date().getFullYear();
  const quoteId = `quotes-write-audit-${suffix}`;

  const createPayload = {
    id: quoteId,
    numero: `DEV-${year}-${suffix.slice(-4).padStart(4, '0')}`,
    date: new Date().toISOString().slice(0, 10),
    clientId: null,
    client: {
      nom: `Quotes Write Audit ${suffix}`,
      adresse: 'Rue Audit PostgreSQL, Tunis',
      tel: '+216 70 111 222',
      telephone: '+216 70 111 222',
      mf: `MF-${suffix}`,
      email: `quotes-write-${suffix}@example.test`
    },
    lignes: [
      {
        id: `line-${suffix}-1`,
        designation: 'Ligne audit devis',
        unite: 'piece',
        quantite: 2,
        prixUnitaire: 150,
        tvaRate: 19
      }
    ],
    remiseType: 'montant',
    remiseValue: 5,
    notes: 'Initial quote write audit',
    conditions: 'Paiement comptant'
  };

  const updatePayload = {
    ...createPayload,
    notes: 'Updated quote write audit',
    conditions: 'Paiement 30 jours',
    lignes: [
      ...createPayload.lignes,
      {
        id: `line-${suffix}-2`,
        designation: 'Ligne audit devis 2',
        unite: 'm',
        quantite: 4,
        prixUnitaire: 80,
        tvaRate: 19
      }
    ]
  };

  const report = {
    startedAt: nowIso(),
    finishedAt: null,
    status: 'running',
    sourceSqlitePath,
    sqliteCopyPath,
    baseUrl: null,
    routing: getDatabaseRoutingSummary(),
    validated: [],
    httpChecks: [],
    parityChecks: [],
    scopeChecks: [],
    remainingRisks: [],
    artifacts: null
  };

  let server;

  const request = async (baseUrl, route, options = {}) => {
    const response = await fetch(`${baseUrl}${route}`, options);
    const body = await normalizeResponseBody(response);
    return { response, body };
  };

  try {
    assert(report.routing.configuredDriver === 'postgres', 'The quotes write audit must run with DB_DRIVER=postgres.');
    assert(report.routing.activePostgresScopes.includes('quotes-read'), 'Quotes read scope is not routed to PostgreSQL.');
    assert(report.routing.activePostgresScopes.includes('quotes-write'), 'Quotes write scope is not routed to PostgreSQL.');

    const postgresBefore = await snapshotPostgresState();

    await query(
      `
        INSERT INTO employees (
          id, nom, telephone, adresse, poste, salaire_base, date_embauche, actif, is_active,
          username, email, email_normalized, password_hash, role,
          is_protected_account, requires_email_2fa, must_setup_password,
          can_view_stock, can_add_stock, can_remove_stock, can_adjust_stock, can_manage_stock,
          can_edit_stock_product, can_archive_stock_product,
          can_manage_employees, can_manage_invoices, can_manage_quotes, can_manage_clients,
          can_manage_estimations, can_manage_archives, can_manage_inventory, can_view_history,
          can_manage_salary, can_manage_all,
          created_at, updated_at
        ) VALUES (
          $1, $2, '', '', 'Direction', 0, NULL, TRUE, TRUE,
          $3, $4, $4, $5, 'owner',
          FALSE, FALSE, FALSE,
          FALSE, FALSE, FALSE, FALSE, FALSE,
          FALSE, FALSE,
          FALSE, FALSE, TRUE, TRUE,
          FALSE, FALSE, FALSE, FALSE,
          FALSE, FALSE,
          $6, $6
        )
      `,
      [ownerId, 'Quotes Write Audit', ownerUsername, ownerEmail, hashPassword(ownerPassword), nowIso()]
    );

    server = startServer(0, '127.0.0.1');
    if (server.listening !== true) {
      await new Promise((resolve, reject) => {
        server.once('listening', resolve);
        server.once('error', reject);
      });
    }

    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : null;
    assert(port, 'Unable to determine the audit server port.');
    report.baseUrl = `http://127.0.0.1:${port}`;

    const loginResult = await request(report.baseUrl, '/api/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'user-agent': 'quotes-write-audit'
      },
      body: JSON.stringify({
        identity: ownerUsername,
        password: ownerPassword
      })
    });

    assert(loginResult.response.ok, `Audit login HTTP status was ${loginResult.response.status}.`);
    assert(loginResult.body?.result?.status === 'success', 'Audit login did not return status=success.');
    const token = loginResult.body?.result?.token;
    assert(token, 'Audit login did not return a session token.');
    report.httpChecks.push({ name: 'POST /api/auth/login', ok: true, detail: `token=${token.slice(0, 8)}...` });

    const sqlitePutCreate = sqliteQuotesWriteRepository.putQuote(sqliteDb, createPayload);
    assert(sqlitePutCreate === true, 'SQLite reference put(create) failed.');

    const putCreateResponse = await request(report.baseUrl, `/api/quotes/${encodeURIComponent(quoteId)}`, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'user-agent': 'quotes-write-audit'
      },
      body: JSON.stringify(createPayload)
    });

    assert(putCreateResponse.response.ok, `Quote create PUT HTTP status was ${putCreateResponse.response.status}.`);
    assert(putCreateResponse.body?.result === true, 'Quote create PUT did not return true.');
    report.httpChecks.push({ name: 'PUT /api/quotes/:id (create)', ok: true, detail: `id=${quoteId}` });

    const sqliteExpectedAfterCreate = sqliteQuotesReadRepository.getQuoteById(sqliteDb, quoteId);
    const getAfterCreateResponse = await request(report.baseUrl, `/api/quotes/${encodeURIComponent(quoteId)}`, {
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'quotes-write-audit'
      }
    });

    assert(getAfterCreateResponse.response.ok, `Quote get after create HTTP status was ${getAfterCreateResponse.response.status}.`);
    const postgresActualAfterCreate = getAfterCreateResponse.body?.result ?? null;
    assert(
      JSON.stringify(normalizeQuoteForParity(postgresActualAfterCreate)) === JSON.stringify(normalizeQuoteForParity(sqliteExpectedAfterCreate)),
      'Quote parity mismatch after create.'
    );
    report.parityChecks.push({ name: 'quotes put(create) parity', ok: true, detail: `id=${quoteId}` });

    const sqliteQuoteRowAfterCreate = getSqliteQuoteRow(sqliteDb, quoteId);
    const postgresQuoteRowAfterCreate = await getPostgresQuoteRow(quoteId);
    assert(sqliteQuoteRowAfterCreate?.client_id, 'SQLite reference quote client_id is missing after create.');
    assert(postgresQuoteRowAfterCreate?.client_id, 'PostgreSQL quote client_id is missing after create.');
    report.scopeChecks.push({ name: 'quote client_id set on create', ok: true, detail: 'non-null in SQLite and PostgreSQL' });

    const sqliteClientAfterCreate = getSqliteClientRow(sqliteDb, sqliteQuoteRowAfterCreate.client_id);
    const postgresClientAfterCreate = await getPostgresClientRow(postgresQuoteRowAfterCreate.client_id);
    assert(
      JSON.stringify(normalizeClientRowForParity(postgresClientAfterCreate)) === JSON.stringify(normalizeClientRowForParity(sqliteClientAfterCreate)),
      'Client normalization parity mismatch after quote create.'
    );
    report.parityChecks.push({ name: 'client backfill parity on create', ok: true, detail: `email=${sqliteClientAfterCreate?.email ?? ''}` });

    const sqlitePutUpdate = sqliteQuotesWriteRepository.putQuote(sqliteDb, updatePayload);
    assert(sqlitePutUpdate === true, 'SQLite reference put(update) failed.');

    const putUpdateResponse = await request(report.baseUrl, `/api/quotes/${encodeURIComponent(quoteId)}`, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'user-agent': 'quotes-write-audit'
      },
      body: JSON.stringify(updatePayload)
    });

    assert(putUpdateResponse.response.ok, `Quote update PUT HTTP status was ${putUpdateResponse.response.status}.`);
    assert(putUpdateResponse.body?.result === true, 'Quote update PUT did not return true.');
    report.httpChecks.push({ name: 'PUT /api/quotes/:id (update)', ok: true, detail: `id=${quoteId}` });

    const sqliteExpectedAfterUpdate = sqliteQuotesReadRepository.getQuoteById(sqliteDb, quoteId);
    const getAfterUpdateResponse = await request(report.baseUrl, `/api/quotes/${encodeURIComponent(quoteId)}`, {
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'quotes-write-audit'
      }
    });

    assert(getAfterUpdateResponse.response.ok, `Quote get after update HTTP status was ${getAfterUpdateResponse.response.status}.`);
    const postgresActualAfterUpdate = getAfterUpdateResponse.body?.result ?? null;
    assert(
      JSON.stringify(normalizeQuoteForParity(postgresActualAfterUpdate)) === JSON.stringify(normalizeQuoteForParity(sqliteExpectedAfterUpdate)),
      'Quote parity mismatch after update.'
    );
    report.parityChecks.push({ name: 'quotes put(update) parity', ok: true, detail: `id=${quoteId}` });

    const listAfterUpdateResponse = await request(report.baseUrl, '/api/quotes', {
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'quotes-write-audit'
      }
    });
    assert(listAfterUpdateResponse.response.ok, `Quotes list after update HTTP status was ${listAfterUpdateResponse.response.status}.`);
    const sqliteListAfterUpdate = sqliteQuotesReadRepository.listQuotes(sqliteDb).map(normalizeQuoteForParity).sort((a, b) => String(a.id).localeCompare(String(b.id)));
    const postgresListAfterUpdate = (listAfterUpdateResponse.body?.result ?? []).map(normalizeQuoteForParity).sort((a, b) => String(a.id).localeCompare(String(b.id)));
    assert(JSON.stringify(postgresListAfterUpdate) === JSON.stringify(sqliteListAfterUpdate), 'Quotes list parity mismatch after update.');
    report.httpChecks.push({ name: 'GET /api/quotes (after update)', ok: true, detail: `count=${postgresListAfterUpdate.length}` });
    report.parityChecks.push({ name: 'quotes list parity after update', ok: true, detail: `count=${postgresListAfterUpdate.length}` });

    const deleteResponse = await request(report.baseUrl, `/api/quotes/${encodeURIComponent(quoteId)}`, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'quotes-write-audit'
      }
    });
    const sqliteDelete = sqliteQuotesWriteRepository.deleteQuote(sqliteDb, quoteId);
    assert(sqliteDelete === true, 'SQLite reference delete failed.');

    assert(deleteResponse.response.ok, `Quote delete HTTP status was ${deleteResponse.response.status}.`);
    assert(deleteResponse.body?.result === true, 'Quote delete did not return true.');
    report.httpChecks.push({ name: 'DELETE /api/quotes/:id', ok: true, detail: `id=${quoteId}` });

    const getAfterDeleteResponse = await request(report.baseUrl, `/api/quotes/${encodeURIComponent(quoteId)}`, {
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'quotes-write-audit'
      }
    });
    assert(getAfterDeleteResponse.response.ok, `Quote get after delete HTTP status was ${getAfterDeleteResponse.response.status}.`);
    assert(getAfterDeleteResponse.body?.result === null, 'Deleted quote is still readable on PostgreSQL.');
    assert(sqliteQuotesReadRepository.getQuoteById(sqliteDb, quoteId) === null, 'Deleted quote is still readable on SQLite reference.');
    report.parityChecks.push({ name: 'quotes delete parity', ok: true, detail: `id=${quoteId}` });

    const postgresAfter = await snapshotPostgresState();
    assert(postgresAfter.invoices.fingerprint === postgresBefore.invoices.fingerprint, 'Invoices changed during quotes put/delete audit.');
    report.scopeChecks.push({ name: 'invoices unchanged during quotes put/delete', ok: true, detail: `count=${postgresAfter.invoices.count}` });

    assert(postgresAfter.quotes.count === postgresBefore.quotes.count, 'Quotes count did not return to its initial value after delete.');
    report.scopeChecks.push({ name: 'quotes count restored after delete', ok: true, detail: `count=${postgresAfter.quotes.count}` });

    const sqliteClientCountAfter = Number(sqliteDb.prepare('SELECT COUNT(*) AS total FROM clients').get().total ?? 0);
    assert(sqliteClientCountAfter === sqliteClientCountBefore + 1, 'SQLite client side effect count is not the expected +1 after quotes put/delete.');
    assert(postgresAfter.clients.count === postgresBefore.clients.count + 1, 'Quotes put/delete did not leave the expected client side effect.');
    report.scopeChecks.push({ name: 'client side effect parity', ok: true, detail: `final clients=${postgresAfter.clients.count}` });

    report.validated.push('`quotes:put` est compatible PostgreSQL pour la creation puis la mise a jour d un devis, avec payload normalise en memoire et `client_id` correctement persiste.');
    report.validated.push('`quotes:delete` est compatible PostgreSQL et supprime uniquement la ligne `quotes`, comme en SQLite.');
    report.validated.push('Le flux `quotes-write` n introduit aucune mutation cachee sur `invoices`; le seul effet annexe conserve est le `findOrCreateClient` attendu sur `clients` lors de `put`.');
    report.validated.push('Le scope `quotes-write` reste audit-only et desactive par defaut, et il exige aussi `quotes-read` pour eviter toute divergence lecture SQLite / ecriture PostgreSQL.');

    report.remainingRisks.push('`quotes:convertToInvoice` reste sur SQLite et depend encore du domaine `invoices`.');
    report.remainingRisks.push('Le domaine `invoices` reste entierement sur SQLite; sa lecture/ecriture n a pas encore sa propre couche PostgreSQL.');
    report.remainingRisks.push('Le `put` de devis peut creer ou completer un client via `findOrCreateClient`; ce couplage a `clients` reste volontaire et compatible avec SQLite, mais il devra etre pris en compte avant la validation finale du cycle `quotes/invoices`.');

    report.status = 'completed';
  } catch (error) {
    report.status = 'failed';
    report.remainingRisks.push(`Audit failed before full validation: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  } finally {
    try {
      if (server) {
        await new Promise((resolve, reject) => {
          server.close((error) => {
            if (error) reject(error);
            else resolve();
          });
        });
      }
    } catch (closeError) {
      report.remainingRisks.push(`Server shutdown warning: ${closeError instanceof Error ? closeError.message : String(closeError)}`);
    }

    try {
      await query('DELETE FROM employees WHERE id = $1', [ownerId]);
      await query('DELETE FROM quotes WHERE id = $1', [quoteId]);
      await query('DELETE FROM clients WHERE email = $1', [createPayload.client.email.toLowerCase()]);
    } catch (cleanupError) {
      report.remainingRisks.push(`Cleanup warning: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
    }

    report.finishedAt = nowIso();
    writeReport(report);
    sqliteDb.close();

    try {
      fs.unlinkSync(sqliteCopyPath);
    } catch (_error) {
      // Keep the temp file if cleanup fails; the report still points to the path used.
    }

    console.log('[quotes-write-audit] JSON report:', report.artifacts.jsonLatestPath);
    console.log('[quotes-write-audit] Markdown report:', report.artifacts.markdownLatestPath);
    await closePostgresPool();
  }
}

main().catch((error) => {
  console.error('[quotes-write-audit] Validation failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
