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
const sqliteCopyPath = path.join(tempDir, `quotes-convert-audit.${timestampSlug()}.sqlite`);
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
const sqliteInvoicesReadRepository = require('../../backend/src/repositories/sqlite/invoices-read.repository');

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

  throw new Error('Unable to load better-sqlite3 for quotes convert audit.');
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
    sourceQuoteNumber: invoice.sourceQuoteNumber ?? null,
    paymentStatus: invoice.paymentStatus ?? 'unpaid',
    paidAt: invoice.paidAt ?? null,
    paymentMethod: invoice.paymentMethod ?? null,
    purchaseOrderNumber: invoice.purchaseOrderNumber ?? null,
    customInvoiceNumber: invoice.customInvoiceNumber ?? null
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

const normalizeConvertResult = (result) => canonicalize({
  ok: !!result?.ok,
  alreadyConverted: !!result?.alreadyConverted,
  invoiceId: result?.invoiceId ? '<invoice-id>' : null,
  invoiceNumero: result?.invoiceNumero ?? null,
  message: result?.message ?? null
});

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

const countSqliteInvoicesByQuote = (db, quoteId) => {
  const row = db.prepare(`
    SELECT COUNT(*) AS count
    FROM invoices
    WHERE quote_id = ?
  `).get(quoteId);
  return Number(row?.count ?? 0);
};

const snapshotUnrelatedQuotes = async (quoteId) => {
  const result = await query(`
    SELECT
      COUNT(*)::int AS count,
      COALESCE(string_agg(
        md5(concat_ws('|', id, COALESCE(client_id, ''), COALESCE(updated_at::text, ''), payload::text)),
        ',' ORDER BY id
      ), '') AS fingerprint
    FROM quotes
    WHERE id <> $1
  `, [quoteId]);

  return {
    count: Number(result.rows[0]?.count ?? 0),
    fingerprint: result.rows[0]?.fingerprint ?? ''
  };
};

const snapshotUnrelatedInvoices = async (quoteId) => {
  const result = await query(`
    SELECT
      COUNT(*)::int AS count,
      COALESCE(string_agg(
        md5(concat_ws('|', id, COALESCE(client_id, ''), COALESCE(quote_id, ''), COALESCE(updated_at::text, ''), payload::text)),
        ',' ORDER BY id
      ), '') AS fingerprint
    FROM invoices
    WHERE quote_id IS DISTINCT FROM $1
  `, [quoteId]);

  return {
    count: Number(result.rows[0]?.count ?? 0),
    fingerprint: result.rows[0]?.fingerprint ?? ''
  };
};

const writeReport = (report) => {
  fs.mkdirSync(reportDir, { recursive: true });

  const slug = timestampSlug();
  const jsonLatestPath = path.join(reportDir, 'postgres-quotes-convert.latest.json');
  const markdownLatestPath = path.join(reportDir, 'postgres-quotes-convert.latest.md');
  const jsonPath = path.join(reportDir, `postgres-quotes-convert.${slug}.json`);
  const markdownPath = path.join(reportDir, `postgres-quotes-convert.${slug}.md`);
  const artifacts = { jsonLatestPath, markdownLatestPath, jsonPath, markdownPath };

  report.artifacts = artifacts;

  fs.writeFileSync(jsonLatestPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(markdownLatestPath, toMarkdown(report));
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(markdownPath, toMarkdown(report));
};

const toMarkdown = (report) => {
  const lines = [];
  lines.push('# PostgreSQL Quotes Convert Validation');
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
  const ownerId = `quotes-convert-owner-${suffix}`;
  const ownerUsername = `quotes_convert_owner_${suffix}`;
  const ownerEmail = `quotes-convert-owner-${suffix}@example.test`;
  const ownerPassword = 'OwnerAudit#2026!';
  const quoteId = `quotes-convert-audit-${suffix}`;
  const quotePayload = {
    id: quoteId,
    numero: `DEV-${new Date().getFullYear()}-${suffix.slice(-4).padStart(4, '0')}`,
    date: new Date().toISOString().slice(0, 10),
    clientId: null,
    client: {
      nom: `Quotes Convert Audit ${suffix}`,
      adresse: 'Rue Audit Devis, Tunis',
      tel: '+216 70 888 999',
      telephone: '+216 70 888 999',
      mf: `MF-${suffix}`,
      email: `quotes-convert-${suffix}@example.test`
    },
    lignes: [
      {
        id: `line-${suffix}-1`,
        designation: 'Ligne audit conversion',
        unite: 'piece',
        quantite: 4,
        prixUnitaire: 95,
        tvaRate: 19
      }
    ],
    remiseType: 'montant',
    remiseValue: 12,
    notes: 'Quote convert audit',
    conditions: 'Paiement comptant',
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
  let cleanupQuoteId = null;
  let cleanupInvoiceId = null;
  let cleanupClientId = null;

  const request = async (baseUrl, route, options = {}) => {
    const response = await fetch(`${baseUrl}${route}`, options);
    const body = await normalizeResponseBody(response);
    return { response, body };
  };

  try {
    assert(report.routing.configuredDriver === 'postgres', 'The quotes convert audit must run with DB_DRIVER=postgres.');
    assert(report.routing.activePostgresScopes.includes('quotes-read'), 'Quotes read scope is not routed to PostgreSQL.');
    assert(report.routing.activePostgresScopes.includes('quotes-write'), 'Quotes write scope is not routed to PostgreSQL.');
    assert(report.routing.activePostgresScopes.includes('quotes-convert-write'), 'Quotes convert scope is not routed to PostgreSQL.');
    assert(report.routing.activePostgresScopes.includes('invoices-read'), 'Invoices read scope is not routed to PostgreSQL.');
    assert(report.routing.activePostgresScopes.includes('invoices-write'), 'Invoices write scope is not routed to PostgreSQL.');

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
      [ownerId, 'Quotes Convert Audit', ownerUsername, ownerEmail, hashPassword(ownerPassword), nowIso()]
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
        'user-agent': 'quotes-convert-audit'
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

    const sqlitePutOk = sqliteQuotesWriteRepository.putQuote(sqliteDb, quotePayload);
    assert(sqlitePutOk === true, 'SQLite reference quote creation failed for convert audit.');

    const quoteCreateResult = await request(report.baseUrl, '/api/quotes', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'user-agent': 'quotes-convert-audit'
      },
      body: JSON.stringify(quotePayload)
    });

    assert(quoteCreateResult.response.ok, `POST /api/quotes HTTP status was ${quoteCreateResult.response.status}.`);
    assert(quoteCreateResult.body?.result === true, 'POST /api/quotes did not return result=true.');
    report.httpChecks.push({ name: 'POST /api/quotes', ok: true, detail: `quote=${quoteId}` });
    cleanupQuoteId = quoteId;

    const unrelatedQuotesBefore = await snapshotUnrelatedQuotes(quoteId);
    const unrelatedInvoicesBefore = await snapshotUnrelatedInvoices(quoteId);

    const sqliteFirstConvert = sqliteQuotesConvertRepository.convertQuoteToInvoice(sqliteDb, quoteId);
    const firstConvertResult = await request(report.baseUrl, `/api/quotes/${encodeURIComponent(quoteId)}/convert-to-invoice`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'quotes-convert-audit'
      }
    });

    assert(firstConvertResult.response.ok, `POST /api/quotes/${quoteId}/convert-to-invoice HTTP status was ${firstConvertResult.response.status}.`);
    assert(
      JSON.stringify(normalizeConvertResult(firstConvertResult.body?.result ?? null)) === JSON.stringify(normalizeConvertResult(sqliteFirstConvert)),
      'First convertToInvoice result mismatch between PostgreSQL runtime and SQLite.'
    );
    report.httpChecks.push({ name: 'POST /api/quotes/:id/convert-to-invoice', ok: true, detail: `quote=${quoteId}` });
    report.parityChecks.push({ name: 'first convert result parity', ok: true, detail: `quote=${quoteId}` });

    const postgresFirstInvoiceId = firstConvertResult.body?.result?.invoiceId;
    const sqliteFirstInvoiceId = sqliteFirstConvert?.invoiceId;
    assert(postgresFirstInvoiceId, 'PostgreSQL convertToInvoice did not return an invoiceId.');
    assert(sqliteFirstInvoiceId, 'SQLite convertToInvoice did not return an invoiceId.');
    cleanupInvoiceId = postgresFirstInvoiceId;

    const sqliteSecondConvert = sqliteQuotesConvertRepository.convertQuoteToInvoice(sqliteDb, quoteId);
    const secondConvertResult = await request(report.baseUrl, `/api/quotes/${encodeURIComponent(quoteId)}/convert-to-invoice`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'quotes-convert-audit'
      }
    });

    assert(secondConvertResult.response.ok, `Second POST /api/quotes/${quoteId}/convert-to-invoice HTTP status was ${secondConvertResult.response.status}.`);
    assert(
      JSON.stringify(normalizeConvertResult(secondConvertResult.body?.result ?? null)) === JSON.stringify(normalizeConvertResult(sqliteSecondConvert)),
      'Second convertToInvoice result mismatch between PostgreSQL runtime and SQLite.'
    );
    report.httpChecks.push({ name: 'POST /api/quotes/:id/convert-to-invoice (already converted)', ok: true, detail: `quote=${quoteId}` });
    report.parityChecks.push({ name: 'alreadyConverted result parity', ok: true, detail: `quote=${quoteId}` });

    const quoteResponse = await request(report.baseUrl, `/api/quotes/${encodeURIComponent(quoteId)}`, {
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'quotes-convert-audit'
      }
    });
    assert(quoteResponse.response.ok, `GET /api/quotes/${quoteId} HTTP status was ${quoteResponse.response.status}.`);
    const postgresQuote = normalizeQuoteForParity(quoteResponse.body?.result ?? null);
    const sqliteQuote = normalizeQuoteForParity(sqliteQuotesReadRepository.getQuoteById(sqliteDb, quoteId));
    assert(JSON.stringify(postgresQuote) === JSON.stringify(sqliteQuote), 'Quote parity mismatch after convertToInvoice.');
    report.httpChecks.push({ name: 'GET /api/quotes/:id', ok: true, detail: `quote=${quoteId}` });
    report.parityChecks.push({ name: 'quote state parity after conversion', ok: true, detail: `quote=${quoteId}` });

    const invoiceResponse = await request(report.baseUrl, `/api/invoices/${encodeURIComponent(postgresFirstInvoiceId)}`, {
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'quotes-convert-audit'
      }
    });
    assert(invoiceResponse.response.ok, `GET /api/invoices/${postgresFirstInvoiceId} HTTP status was ${invoiceResponse.response.status}.`);
    const postgresInvoice = normalizeInvoiceForParity(invoiceResponse.body?.result ?? null);
    const sqliteInvoice = normalizeInvoiceForParity(sqliteInvoicesReadRepository.getInvoiceById(sqliteDb, sqliteFirstInvoiceId));
    assert(JSON.stringify(postgresInvoice) === JSON.stringify(sqliteInvoice), 'Invoice parity mismatch after convertToInvoice.');
    report.httpChecks.push({ name: 'GET /api/invoices/:id', ok: true, detail: `invoice=${postgresFirstInvoiceId}` });
    report.parityChecks.push({ name: 'invoice state parity after conversion', ok: true, detail: `invoice=<invoice-id>` });

    const postgresQuoteRow = await getPostgresQuoteRow(quoteId);
    const sqliteQuoteRow = getSqliteQuoteRow(sqliteDb, quoteId);
    assert(
      JSON.stringify(normalizeQuoteRowForParity(postgresQuoteRow)) === JSON.stringify(normalizeQuoteRowForParity(sqliteQuoteRow)),
      'Stored quote row parity mismatch after convertToInvoice.'
    );
    report.parityChecks.push({ name: 'stored quote row parity', ok: true, detail: `quote=${quoteId}` });

    const postgresInvoiceRow = await getPostgresInvoiceRow(postgresFirstInvoiceId);
    const sqliteInvoiceRow = getSqliteInvoiceRow(sqliteDb, sqliteFirstInvoiceId);
    assert(postgresInvoiceRow?.client_id, 'PostgreSQL invoice row has no client_id after convertToInvoice.');
    cleanupClientId = postgresInvoiceRow.client_id;
    assert(
      JSON.stringify(normalizeInvoiceRowForParity(postgresInvoiceRow)) === JSON.stringify(normalizeInvoiceRowForParity(sqliteInvoiceRow)),
      'Stored invoice row parity mismatch after convertToInvoice.'
    );
    report.parityChecks.push({ name: 'stored invoice row parity', ok: true, detail: 'quote_id and payload parity preserved' });

    const postgresInvoiceCount = await countPostgresInvoicesByQuote(quoteId);
    const sqliteInvoiceCount = countSqliteInvoicesByQuote(sqliteDb, quoteId);
    assert(postgresInvoiceCount === sqliteInvoiceCount, 'Invoice count by quote mismatch after convertToInvoice.');
    assert(postgresInvoiceCount === 1, 'convertToInvoice created more than one invoice for the same quote.');
    report.scopeChecks.push({ name: 'single invoice linked to quote after repeated convert', ok: true, detail: `count=${postgresInvoiceCount}` });

    const unrelatedQuotesAfter = await snapshotUnrelatedQuotes(quoteId);
    const unrelatedInvoicesAfter = await snapshotUnrelatedInvoices(quoteId);
    assert(JSON.stringify(unrelatedQuotesAfter) === JSON.stringify(unrelatedQuotesBefore), 'Unrelated quotes changed during convertToInvoice audit.');
    assert(JSON.stringify(unrelatedInvoicesAfter) === JSON.stringify(unrelatedInvoicesBefore), 'Unrelated invoices changed during convertToInvoice audit.');
    report.scopeChecks.push({ name: 'unrelated quotes unchanged', ok: true, detail: `count=${unrelatedQuotesAfter.count}` });
    report.scopeChecks.push({ name: 'unrelated invoices unchanged', ok: true, detail: `count=${unrelatedInvoicesAfter.count}` });

    report.validated.push('`quotes:convertToInvoice` est compatible PostgreSQL sur le flux devis -> facture, avec la meme reponse metier que SQLite au premier appel puis au second appel `alreadyConverted`.');
    report.validated.push('La facture creee conserve a parite `payload`, `quote_id`, `sourceQuoteNumber`, la numerotation calculee et l etat converti du devis (`status`, `convertedInvoiceId`, `convertedAt`).');
    report.validated.push('Aucun effet inverse de type suppression/reouverture n est introduit ici; `invoices:delete` reste hors scope et aucun devis ou facture non cible n est modifie pendant l audit.');

    report.remainingRisks.push('`invoices:delete` reste sur SQLite et porte toujours le couplage inverse facture -> devis.');
    report.remainingRisks.push('La validation finale du cycle devis/facture reste a faire une fois `invoices:delete` migre puis audite.');
    report.remainingRisks.push('Les flags `DB_ENABLE_POSTGRES_QUOTES_READ=0`, `DB_ENABLE_POSTGRES_QUOTES_WRITES=0`, `DB_ENABLE_POSTGRES_INVOICES_READ=0` et `DB_ENABLE_POSTGRES_INVOICES_WRITES=0` doivent rester les valeurs par defaut hors audit.');

    report.status = 'completed';
  } catch (error) {
    report.status = 'failed';
    report.remainingRisks.push(`Audit failed before full validation: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  } finally {
    try {
      if (cleanupInvoiceId) {
        await query('DELETE FROM invoices WHERE id = $1', [cleanupInvoiceId]);
      }
    } catch (cleanupError) {
      report.remainingRisks.push(`Invoice cleanup warning: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
    }

    try {
      if (cleanupQuoteId) {
        await query('DELETE FROM quotes WHERE id = $1', [cleanupQuoteId]);
      }
    } catch (cleanupError) {
      report.remainingRisks.push(`Quote cleanup warning: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
    }

    try {
      if (cleanupClientId) {
        await query('DELETE FROM clients WHERE id = $1', [cleanupClientId]);
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

    console.log('[quotes-convert-audit] JSON report:', report.artifacts.jsonLatestPath);
    console.log('[quotes-convert-audit] Markdown report:', report.artifacts.markdownLatestPath);
    await closePostgresPool();
  }
}

main().catch((error) => {
  console.error('[quotes-convert-audit] Validation failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
