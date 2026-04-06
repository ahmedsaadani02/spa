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
const sqliteCopyPath = path.join(tempDir, `invoices-delete-audit.${timestampSlug()}.sqlite`);
fs.mkdirSync(tempDir, { recursive: true });
fs.copyFileSync(sourceSqlitePath, sqliteCopyPath);

process.env.DATABASE_PATH = sqliteCopyPath;
process.env.DB_DRIVER = 'postgres';
process.env.DB_ENABLE_POSTGRES_QUOTES_READ = '1';
process.env.DB_ENABLE_POSTGRES_QUOTES_WRITES = '1';
process.env.DB_ENABLE_POSTGRES_INVOICES_READ = '1';
process.env.DB_ENABLE_POSTGRES_INVOICES_WRITES = '1';

const { getDatabaseRoutingSummary } = require('../../backend/src/config/database');
const { startServer } = require('../../backend/server');
const { query, closePostgresPool } = require('../../backend/src/db/postgres');
const { hashPassword } = require('../../backend/src/services/auth-core.service');
const sqliteQuotesWriteRepository = require('../../backend/src/repositories/sqlite/quotes-write.repository');
const sqliteQuotesReadRepository = require('../../backend/src/repositories/sqlite/quotes-read.repository');
const sqliteQuotesConvertRepository = require('../../backend/src/repositories/sqlite/quotes-convert.repository');
const sqliteInvoicesWriteRepository = require('../../backend/src/repositories/sqlite/invoices-write.repository');
const sqliteInvoicesReadRepository = require('../../backend/src/repositories/sqlite/invoices-read.repository');
const sqliteInvoicesDeleteRepository = require('../../backend/src/repositories/sqlite/invoices-delete.repository');

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

  throw new Error('Unable to load better-sqlite3 for invoices delete audit.');
};

const Database = loadBetterSqlite3();

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const canonicalize = (value) => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;

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
    convertedInvoiceId: quote.convertedInvoiceId ? '<invoice-id>' : null,
    convertedAt: quote.convertedAt ? '<timestamp>' : null
  });
};

const normalizeInvoiceForParity = (invoice) => {
  if (!invoice || typeof invoice !== 'object') return null;
  return canonicalize({
    id: invoice.id ? '<invoice-id>' : null,
    numero: invoice.numero ?? '',
    date: invoice.date ?? '',
    clientId: invoice.clientId ? '<client-id>' : null,
    client: normalizeClientForParity(invoice.client),
    lignes: Array.isArray(invoice.lignes) ? invoice.lignes : [],
    remiseType: invoice.remiseType ?? null,
    remiseValue: invoice.remiseValue ?? null,
    remiseAvantTVA: invoice.remiseAvantTVA ?? null,
    notes: invoice.notes ?? '',
    conditions: invoice.conditions ?? '',
    quoteId: invoice.quoteId ?? null,
    sourceQuoteNumber: invoice.sourceQuoteNumber ?? null
  });
};

const normalizeQuoteRowForParity = (row) => {
  if (!row) return null;
  let payload = null;
  try {
    payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
  } catch {
    payload = null;
  }

  return canonicalize({
    id: row.id ?? null,
    client_id: row.client_id ? '<client-id>' : null,
    payload: normalizeQuoteForParity(payload)
  });
};

const normalizeInvoiceRowForParity = (row) => {
  if (!row) return null;
  let payload = null;
  try {
    payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
  } catch {
    payload = null;
  }

  return canonicalize({
    id: row.id ? '<invoice-id>' : null,
    client_id: row.client_id ? '<client-id>' : null,
    quote_id: row.quote_id ?? null,
    payload: normalizeInvoiceForParity(payload)
  });
};

const normalizeDeleteResult = (value) => value === true;

const normalizeResponseBody = async (response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch (_error) {
    return text;
  }
};

const getSqliteQuoteRow = (db, quoteId) => db.prepare(`
  SELECT id, payload, client_id
  FROM quotes
  WHERE id = ?
  LIMIT 1
`).get(quoteId) ?? null;

const getSqliteInvoiceRow = (db, invoiceId) => db.prepare(`
  SELECT id, payload, client_id, quote_id
  FROM invoices
  WHERE id = ?
  LIMIT 1
`).get(invoiceId) ?? null;

const countSqliteInvoicesByQuote = (db, quoteId) => {
  const row = db.prepare(`
    SELECT COUNT(*) AS count
    FROM invoices
    WHERE quote_id = ?
  `).get(quoteId);
  return Number(row?.count ?? 0);
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

const getPostgresInvoiceRow = async (invoiceId) => {
  const result = await query(`
    SELECT id, payload, client_id, quote_id
    FROM invoices
    WHERE id = $1
    LIMIT 1
  `, [invoiceId]);
  return result.rows[0] ?? null;
};

const countPostgresInvoicesByQuote = async (quoteId) => {
  const result = await query(`
    SELECT COUNT(*)::int AS count
    FROM invoices
    WHERE quote_id = $1
  `, [quoteId]);
  return Number(result.rows[0]?.count ?? 0);
};

const snapshotUnrelatedQuotes = async (quoteIds) => {
  const result = await query(`
    SELECT
      COUNT(*)::int AS count,
      COALESCE(string_agg(
        md5(concat_ws('|', id, COALESCE(client_id, ''), COALESCE(updated_at::text, ''), payload::text)),
        ',' ORDER BY id
      ), '') AS fingerprint
    FROM quotes
    WHERE NOT (id = ANY($1::text[]))
  `, [quoteIds]);

  return {
    count: Number(result.rows[0]?.count ?? 0),
    fingerprint: result.rows[0]?.fingerprint ?? ''
  };
};

const snapshotUnrelatedInvoices = async (quoteIds) => {
  const result = await query(`
    SELECT
      COUNT(*)::int AS count,
      COALESCE(string_agg(
        md5(concat_ws('|', id, COALESCE(client_id, ''), COALESCE(quote_id, ''), COALESCE(updated_at::text, ''), payload::text)),
        ',' ORDER BY id
      ), '') AS fingerprint
    FROM invoices
    WHERE quote_id IS NULL OR NOT (quote_id = ANY($1::text[]))
  `, [quoteIds]);

  return {
    count: Number(result.rows[0]?.count ?? 0),
    fingerprint: result.rows[0]?.fingerprint ?? ''
  };
};

const writeReport = (report) => {
  fs.mkdirSync(reportDir, { recursive: true });

  const slug = timestampSlug();
  const jsonLatestPath = path.join(reportDir, 'postgres-invoices-delete.latest.json');
  const markdownLatestPath = path.join(reportDir, 'postgres-invoices-delete.latest.md');
  const jsonPath = path.join(reportDir, `postgres-invoices-delete.${slug}.json`);
  const markdownPath = path.join(reportDir, `postgres-invoices-delete.${slug}.md`);
  const artifacts = { jsonLatestPath, markdownLatestPath, jsonPath, markdownPath };

  report.artifacts = artifacts;
  fs.writeFileSync(jsonLatestPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(markdownLatestPath, toMarkdown(report));
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(markdownPath, toMarkdown(report));
};

const toMarkdown = (report) => {
  const lines = [];
  lines.push('# PostgreSQL Invoices Delete Validation');
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
  const suffix = Date.now().toString(36);
  const ownerId = `invoices-delete-owner-${suffix}`;
  const ownerUsername = `invoices_delete_owner_${suffix}`;
  const ownerEmail = `invoices-delete-owner-${suffix}@example.test`;
  const ownerPassword = 'OwnerAudit#2026!';
  const quoteAId = `invoices-delete-quote-a-${suffix}`;
  const quoteBId = `invoices-delete-quote-b-${suffix}`;
  const extraInvoiceBId = `invoices-delete-extra-${suffix}`;

  const quoteA = {
    id: quoteAId,
    numero: `DEV-${new Date().getFullYear()}-${suffix.slice(-4).padStart(4, '0')}A`,
    date: new Date().toISOString().slice(0, 10),
    clientId: null,
    client: {
      nom: `Invoices Delete Audit A ${suffix}`,
      adresse: 'Rue Audit Delete A, Tunis',
      tel: '+216 71 100 200',
      telephone: '+216 71 100 200',
      mf: `MF-A-${suffix}`,
      email: `invoices-delete-a-${suffix}@example.test`
    },
    lignes: [
      {
        id: `line-a-${suffix}-1`,
        designation: 'Ligne devis A',
        unite: 'piece',
        quantite: 1,
        prixUnitaire: 110,
        tvaRate: 19
      }
    ],
    remiseType: 'montant',
    remiseValue: 5,
    notes: 'Scenario reopen draft',
    conditions: 'Paiement comptant',
    status: 'draft'
  };

  const quoteB = {
    id: quoteBId,
    numero: `DEV-${new Date().getFullYear()}-${suffix.slice(-4).padStart(4, '0')}B`,
    date: new Date().toISOString().slice(0, 10),
    clientId: null,
    client: {
      nom: `Invoices Delete Audit B ${suffix}`,
      adresse: 'Rue Audit Delete B, Tunis',
      tel: '+216 71 300 400',
      telephone: '+216 71 300 400',
      mf: `MF-B-${suffix}`,
      email: `invoices-delete-b-${suffix}@example.test`
    },
    lignes: [
      {
        id: `line-b-${suffix}-1`,
        designation: 'Ligne devis B',
        unite: 'piece',
        quantite: 2,
        prixUnitaire: 150,
        tvaRate: 19
      }
    ],
    remiseType: 'montant',
    remiseValue: 0,
    notes: 'Scenario redirect to other invoice',
    conditions: 'Paiement 30 jours',
    status: 'draft'
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
  const cleanupQuoteIds = new Set();
  const cleanupInvoiceIds = new Set();
  const cleanupClientIds = new Set();

  const request = async (baseUrl, route, options = {}) => {
    const response = await fetch(`${baseUrl}${route}`, options);
    const body = await normalizeResponseBody(response);
    return { response, body };
  };

  try {
    assert(report.routing.configuredDriver === 'postgres', 'The invoices delete audit must run with DB_DRIVER=postgres.');
    assert(report.routing.activePostgresScopes.includes('quotes-read'), 'Quotes read scope is not routed to PostgreSQL.');
    assert(report.routing.activePostgresScopes.includes('quotes-write'), 'Quotes write scope is not routed to PostgreSQL.');
    assert(report.routing.activePostgresScopes.includes('quotes-convert-write'), 'Quotes convert scope is not routed to PostgreSQL.');
    assert(report.routing.activePostgresScopes.includes('invoices-read'), 'Invoices read scope is not routed to PostgreSQL.');
    assert(report.routing.activePostgresScopes.includes('invoices-write'), 'Invoices write scope is not routed to PostgreSQL.');
    assert(report.routing.activePostgresScopes.includes('invoices-delete-write'), 'Invoices delete scope is not routed to PostgreSQL.');

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
          FALSE, TRUE, TRUE, TRUE,
          FALSE, FALSE, FALSE, FALSE,
          FALSE, FALSE,
          $6, $6
        )
      `,
      [ownerId, 'Invoices Delete Audit', ownerUsername, ownerEmail, hashPassword(ownerPassword), nowIso()]
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
        'user-agent': 'invoices-delete-audit'
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

    const trackedQuoteIds = [quoteAId, quoteBId];
    const unrelatedQuotesBefore = await snapshotUnrelatedQuotes(trackedQuoteIds);
    const unrelatedInvoicesBefore = await snapshotUnrelatedInvoices(trackedQuoteIds);

    const sqliteQuoteAOk = sqliteQuotesWriteRepository.putQuote(sqliteDb, quoteA);
    const sqliteQuoteBOk = sqliteQuotesWriteRepository.putQuote(sqliteDb, quoteB);
    assert(sqliteQuoteAOk === true && sqliteQuoteBOk === true, 'SQLite reference quote creation failed for invoices delete audit.');

    const quoteAResponse = await request(report.baseUrl, '/api/quotes', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'user-agent': 'invoices-delete-audit'
      },
      body: JSON.stringify(quoteA)
    });
    const quoteBResponse = await request(report.baseUrl, '/api/quotes', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'user-agent': 'invoices-delete-audit'
      },
      body: JSON.stringify(quoteB)
    });
    assert(quoteAResponse.response.ok && quoteAResponse.body?.result === true, 'POST /api/quotes failed for scenario A.');
    assert(quoteBResponse.response.ok && quoteBResponse.body?.result === true, 'POST /api/quotes failed for scenario B.');
    report.httpChecks.push({ name: 'POST /api/quotes', ok: true, detail: 'scenario A + B created' });
    cleanupQuoteIds.add(quoteAId);
    cleanupQuoteIds.add(quoteBId);

    const sqliteConvertA = sqliteQuotesConvertRepository.convertQuoteToInvoice(sqliteDb, quoteAId);
    const postgresConvertA = await request(report.baseUrl, `/api/quotes/${encodeURIComponent(quoteAId)}/convert-to-invoice`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'invoices-delete-audit'
      }
    });
    assert(postgresConvertA.response.ok, 'convertToInvoice failed for scenario A.');
    assert(normalizeDeleteResult(sqliteConvertA.ok) === normalizeDeleteResult(postgresConvertA.body?.result?.ok), 'Scenario A conversion ok mismatch.');
    const sqliteInvoiceAId = sqliteConvertA.invoiceId;
    const postgresInvoiceAId = postgresConvertA.body?.result?.invoiceId;
    assert(sqliteInvoiceAId && postgresInvoiceAId, 'Scenario A conversion did not return invoice ids.');

    const sqliteConvertB = sqliteQuotesConvertRepository.convertQuoteToInvoice(sqliteDb, quoteBId);
    const postgresConvertB = await request(report.baseUrl, `/api/quotes/${encodeURIComponent(quoteBId)}/convert-to-invoice`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'invoices-delete-audit'
      }
    });
    assert(postgresConvertB.response.ok, 'convertToInvoice failed for scenario B.');
    assert(normalizeDeleteResult(sqliteConvertB.ok) === normalizeDeleteResult(postgresConvertB.body?.result?.ok), 'Scenario B conversion ok mismatch.');
    const sqliteInvoiceB1Id = sqliteConvertB.invoiceId;
    const postgresInvoiceB1Id = postgresConvertB.body?.result?.invoiceId;
    assert(sqliteInvoiceB1Id && postgresInvoiceB1Id, 'Scenario B conversion did not return invoice ids.');

    const extraInvoiceB = {
      id: extraInvoiceBId,
      numero: `FAC-${new Date().getFullYear()}-${suffix.slice(-4).padStart(4, '0')}X`,
      date: new Date().toISOString().slice(0, 10),
      clientId: null,
      client: quoteB.client,
      lignes: quoteB.lignes,
      remiseType: quoteB.remiseType,
      remiseValue: quoteB.remiseValue,
      notes: 'Extra invoice linked to same quote',
      conditions: quoteB.conditions,
      quoteId: quoteBId,
      sourceQuoteNumber: quoteB.numero
    };

    const sqlitePutExtraOk = sqliteInvoicesWriteRepository.putInvoice(sqliteDb, extraInvoiceB);
    assert(sqlitePutExtraOk === true, 'SQLite reference invoices:put failed for extra scenario B invoice.');
    const postgresPutExtra = await request(report.baseUrl, '/api/invoices', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'user-agent': 'invoices-delete-audit'
      },
      body: JSON.stringify(extraInvoiceB)
    });
    assert(postgresPutExtra.response.ok && postgresPutExtra.body?.result === true, 'POST /api/invoices failed for extra scenario B invoice.');
    report.httpChecks.push({ name: 'POST /api/invoices', ok: true, detail: 'extra invoice linked to scenario B quote' });
    cleanupInvoiceIds.add(extraInvoiceBId);

    const sqliteDeleteA = sqliteInvoicesDeleteRepository.deleteInvoice(sqliteDb, sqliteInvoiceAId);
    const postgresDeleteA = await request(report.baseUrl, `/api/invoices/${encodeURIComponent(postgresInvoiceAId)}`, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'invoices-delete-audit'
      }
    });
    assert(postgresDeleteA.response.ok, 'DELETE /api/invoices/:id failed for scenario A.');
    assert(normalizeDeleteResult(sqliteDeleteA) === normalizeDeleteResult(postgresDeleteA.body?.result), 'Scenario A delete result mismatch.');
    report.httpChecks.push({ name: 'DELETE /api/invoices/:id', ok: true, detail: 'scenario A single linked invoice deleted' });
    report.parityChecks.push({ name: 'scenario A delete result parity', ok: true, detail: `quote=${quoteAId}` });

    const postgresQuoteAResponse = await request(report.baseUrl, `/api/quotes/${encodeURIComponent(quoteAId)}`, {
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'invoices-delete-audit'
      }
    });
    assert(postgresQuoteAResponse.response.ok, 'GET /api/quotes/:id failed for scenario A.');
    const sqliteQuoteA = normalizeQuoteForParity(sqliteQuotesReadRepository.getQuoteById(sqliteDb, quoteAId));
    const postgresQuoteA = normalizeQuoteForParity(postgresQuoteAResponse.body?.result ?? null);
    assert(JSON.stringify(sqliteQuoteA) === JSON.stringify(postgresQuoteA), 'Scenario A quote state mismatch after delete.');
    const sqliteQuoteARow = normalizeQuoteRowForParity(getSqliteQuoteRow(sqliteDb, quoteAId));
    const postgresQuoteARow = normalizeQuoteRowForParity(await getPostgresQuoteRow(quoteAId));
    assert(JSON.stringify(sqliteQuoteARow) === JSON.stringify(postgresQuoteARow), 'Scenario A stored quote row mismatch after delete.');
    assert(sqliteInvoicesReadRepository.getInvoiceById(sqliteDb, sqliteInvoiceAId) === null, 'Scenario A SQLite invoice still readable after delete.');
    const postgresInvoiceAAfter = await getPostgresInvoiceRow(postgresInvoiceAId);
    assert(postgresInvoiceAAfter === null, 'Scenario A PostgreSQL invoice still exists after delete.');
    assert(countSqliteInvoicesByQuote(sqliteDb, quoteAId) === 0, 'Scenario A SQLite quote still has linked invoices.');
    assert(await countPostgresInvoicesByQuote(quoteAId) === 0, 'Scenario A PostgreSQL quote still has linked invoices.');
    report.parityChecks.push({ name: 'scenario A quote reopened to draft parity', ok: true, detail: `quote=${quoteAId}` });
    report.scopeChecks.push({ name: 'scenario A linked invoice removed', ok: true, detail: 'count=0 after delete' });

    const sqliteDeleteB = sqliteInvoicesDeleteRepository.deleteInvoice(sqliteDb, sqliteInvoiceB1Id);
    const postgresDeleteB = await request(report.baseUrl, `/api/invoices/${encodeURIComponent(postgresInvoiceB1Id)}`, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'invoices-delete-audit'
      }
    });
    assert(postgresDeleteB.response.ok, 'DELETE /api/invoices/:id failed for scenario B.');
    assert(normalizeDeleteResult(sqliteDeleteB) === normalizeDeleteResult(postgresDeleteB.body?.result), 'Scenario B delete result mismatch.');
    report.httpChecks.push({ name: 'DELETE /api/invoices/:id (replacement remains)', ok: true, detail: 'scenario B converted invoice deleted, replacement kept' });
    report.parityChecks.push({ name: 'scenario B delete result parity', ok: true, detail: `quote=${quoteBId}` });

    const postgresQuoteBResponse = await request(report.baseUrl, `/api/quotes/${encodeURIComponent(quoteBId)}`, {
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'invoices-delete-audit'
      }
    });
    assert(postgresQuoteBResponse.response.ok, 'GET /api/quotes/:id failed for scenario B.');
    const sqliteQuoteB = normalizeQuoteForParity(sqliteQuotesReadRepository.getQuoteById(sqliteDb, quoteBId));
    const postgresQuoteB = normalizeQuoteForParity(postgresQuoteBResponse.body?.result ?? null);
    assert(JSON.stringify(sqliteQuoteB) === JSON.stringify(postgresQuoteB), 'Scenario B quote state mismatch after delete.');
    const sqliteQuoteBRow = normalizeQuoteRowForParity(getSqliteQuoteRow(sqliteDb, quoteBId));
    const postgresQuoteBRow = normalizeQuoteRowForParity(await getPostgresQuoteRow(quoteBId));
    assert(JSON.stringify(sqliteQuoteBRow) === JSON.stringify(postgresQuoteBRow), 'Scenario B stored quote row mismatch after delete.');

    const sqliteRemainingInvoiceB = normalizeInvoiceForParity(sqliteInvoicesReadRepository.getInvoiceById(sqliteDb, extraInvoiceBId));
    const postgresRemainingInvoiceBResponse = await request(report.baseUrl, `/api/invoices/${encodeURIComponent(extraInvoiceBId)}`, {
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'invoices-delete-audit'
      }
    });
    assert(postgresRemainingInvoiceBResponse.response.ok, 'GET /api/invoices/:id failed for remaining scenario B invoice.');
    const postgresRemainingInvoiceB = normalizeInvoiceForParity(postgresRemainingInvoiceBResponse.body?.result ?? null);
    assert(JSON.stringify(sqliteRemainingInvoiceB) === JSON.stringify(postgresRemainingInvoiceB), 'Scenario B remaining invoice mismatch after delete.');
    const sqliteRemainingInvoiceBRow = normalizeInvoiceRowForParity(getSqliteInvoiceRow(sqliteDb, extraInvoiceBId));
    const postgresRemainingInvoiceBRow = normalizeInvoiceRowForParity(await getPostgresInvoiceRow(extraInvoiceBId));
    assert(JSON.stringify(sqliteRemainingInvoiceBRow) === JSON.stringify(postgresRemainingInvoiceBRow), 'Scenario B remaining stored invoice row mismatch after delete.');
    assert(countSqliteInvoicesByQuote(sqliteDb, quoteBId) === 1, 'Scenario B SQLite did not retain exactly one linked invoice.');
    assert(await countPostgresInvoicesByQuote(quoteBId) === 1, 'Scenario B PostgreSQL did not retain exactly one linked invoice.');
    report.parityChecks.push({ name: 'scenario B quote redirected to replacement invoice parity', ok: true, detail: `quote=${quoteBId}` });
    report.scopeChecks.push({ name: 'scenario B remaining invoice preserved', ok: true, detail: `invoice=${extraInvoiceBId}` });

    const unrelatedQuotesAfter = await snapshotUnrelatedQuotes(trackedQuoteIds);
    const unrelatedInvoicesAfter = await snapshotUnrelatedInvoices(trackedQuoteIds);
    assert(JSON.stringify(unrelatedQuotesBefore) === JSON.stringify(unrelatedQuotesAfter), 'Unrelated quotes changed during invoices delete audit.');
    assert(JSON.stringify(unrelatedInvoicesBefore) === JSON.stringify(unrelatedInvoicesAfter), 'Unrelated invoices changed during invoices delete audit.');
    report.scopeChecks.push({ name: 'unrelated quotes unchanged', ok: true, detail: `count=${unrelatedQuotesAfter.count}` });
    report.scopeChecks.push({ name: 'unrelated invoices unchanged', ok: true, detail: `count=${unrelatedInvoicesAfter.count}` });

    const quoteARow = await getPostgresQuoteRow(quoteAId);
    const quoteBRow = await getPostgresQuoteRow(quoteBId);
    if (quoteARow?.client_id) cleanupClientIds.add(quoteARow.client_id);
    if (quoteBRow?.client_id) cleanupClientIds.add(quoteBRow.client_id);

    report.validated.push('`invoices:delete` est compatible PostgreSQL sur la suppression simple facture -> reouverture du devis en `draft`, avec suppression de `convertedInvoiceId` et `convertedAt` comme en SQLite.');
    report.validated.push('Quand plusieurs factures sont liees au meme devis, la suppression redirige correctement le devis vers la facture restante en conservant l etat `invoiced` et en mettant a jour `convertedInvoiceId` a parite avec SQLite.');
    report.validated.push('Aucun ecart metier n a ete observe sur `invoices`, le devis lie ou les documents non cibles; la suppression inverse reste localisee au seul couple facture/devis concerne.');

    report.remainingRisks.push('Le dernier point restant est un audit global final du cycle complet `quote -> convertToInvoice -> delete invoice -> state quote` une fois cette tranche confirmee.');
    report.remainingRisks.push('Les flags `DB_ENABLE_POSTGRES_QUOTES_READ=0`, `DB_ENABLE_POSTGRES_QUOTES_WRITES=0`, `DB_ENABLE_POSTGRES_INVOICES_READ=0` et `DB_ENABLE_POSTGRES_INVOICES_WRITES=0` doivent rester les valeurs par defaut hors audit.');
    report.remainingRisks.push('SQLite reste la reference de secours tant que le cycle devis/facture complet n a pas ete revalide bout en bout en environnement controle.');

    report.status = 'completed';
  } catch (error) {
    report.status = 'failed';
    report.remainingRisks.push(`Audit failed before full validation: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  } finally {
    try {
      for (const invoiceId of cleanupInvoiceIds) {
        await query('DELETE FROM invoices WHERE id = $1', [invoiceId]);
      }
    } catch (cleanupError) {
      report.remainingRisks.push(`Invoice cleanup warning: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
    }

    try {
      for (const quoteId of cleanupQuoteIds) {
        await query('DELETE FROM quotes WHERE id = $1', [quoteId]);
      }
    } catch (cleanupError) {
      report.remainingRisks.push(`Quote cleanup warning: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
    }

    try {
      for (const clientId of cleanupClientIds) {
        await query('DELETE FROM clients WHERE id = $1', [clientId]);
      }
    } catch (cleanupError) {
      report.remainingRisks.push(`Client cleanup warning: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
    }

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

    console.log('[invoices-delete-audit] JSON report:', report.artifacts.jsonLatestPath);
    console.log('[invoices-delete-audit] Markdown report:', report.artifacts.markdownLatestPath);
    await closePostgresPool();
  }
}

main().catch((error) => {
  console.error('[invoices-delete-audit] Validation failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
