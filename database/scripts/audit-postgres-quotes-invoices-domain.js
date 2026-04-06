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
const sqliteCopyPath = path.join(tempDir, `quotes-invoices-domain-audit.${timestampSlug()}.sqlite`);
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
const sqliteQuotesReadRepository = require('../../backend/src/repositories/sqlite/quotes-read.repository');
const sqliteQuotesWriteRepository = require('../../backend/src/repositories/sqlite/quotes-write.repository');
const sqliteQuotesConvertRepository = require('../../backend/src/repositories/sqlite/quotes-convert.repository');
const sqliteInvoicesReadRepository = require('../../backend/src/repositories/sqlite/invoices-read.repository');
const sqliteInvoicesWriteRepository = require('../../backend/src/repositories/sqlite/invoices-write.repository');
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

  throw new Error('Unable to load better-sqlite3 for quotes/invoices global audit.');
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

const normalizeClient = (client) => {
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

const normalizeQuote = (quote) => {
  if (!quote || typeof quote !== 'object') return null;
  return canonicalize({
    id: quote.id ?? null,
    numero: quote.numero ?? '',
    date: quote.date ?? '',
    clientId: quote.clientId ? '<client-id>' : null,
    client: normalizeClient(quote.client),
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

const normalizeInvoice = (invoice) => {
  if (!invoice || typeof invoice !== 'object') return null;
  return canonicalize({
    id: invoice.id ? '<invoice-id>' : null,
    numero: invoice.numero ?? '',
    date: invoice.date ?? '',
    clientId: invoice.clientId ? '<client-id>' : null,
    client: normalizeClient(invoice.client),
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

const normalizeQuoteRow = (row) => {
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
    payload: normalizeQuote(payload)
  });
};

const normalizeInvoiceRow = (row) => {
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
    payload: normalizeInvoice(payload)
  });
};

const normalizeQuoteList = (quotes) => [...(quotes ?? [])]
  .map(normalizeQuote)
  .sort((a, b) => String(a?.id ?? '').localeCompare(String(b?.id ?? '')));

const normalizeInvoiceList = (invoices) => [...(invoices ?? [])]
  .map(normalizeInvoice)
  .sort((a, b) => {
    const left = `${a?.numero ?? ''}|${a?.quoteId ?? ''}|${a?.notes ?? ''}`;
    const right = `${b?.numero ?? ''}|${b?.quoteId ?? ''}|${b?.notes ?? ''}`;
    return left.localeCompare(right);
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

const requestJson = async (baseUrl, route, options = {}) => {
  const response = await fetch(`${baseUrl}${route}`, options);
  const body = await normalizeResponseBody(response);
  return { response, body };
};

const getSqliteTrackedQuotes = (db, quoteIds) => normalizeQuoteList(
  sqliteQuotesReadRepository.listQuotes(db).filter((quote) => quoteIds.includes(quote.id))
);

const getSqliteTrackedInvoices = (db, trackedInvoiceIds, trackedQuoteIds) => normalizeInvoiceList(
  sqliteInvoicesReadRepository.listInvoices(db).filter((invoice) => {
    if (trackedInvoiceIds.includes(invoice.id)) return true;
    return trackedQuoteIds.includes(invoice.quoteId ?? '');
  })
);

const getPostgresTrackedQuotes = async (baseUrl, headers, quoteIds) => {
  const result = await requestJson(baseUrl, '/api/quotes', { headers });
  assert(result.response.ok, `GET /api/quotes failed with status ${result.response.status}.`);
  return normalizeQuoteList((result.body?.result ?? []).filter((quote) => quoteIds.includes(quote.id)));
};

const getPostgresTrackedInvoices = async (baseUrl, headers, trackedInvoiceIds, trackedQuoteIds) => {
  const result = await requestJson(baseUrl, '/api/invoices', { headers });
  assert(result.response.ok, `GET /api/invoices failed with status ${result.response.status}.`);
  return normalizeInvoiceList((result.body?.result ?? []).filter((invoice) => {
    if (trackedInvoiceIds.includes(invoice.id)) return true;
    return trackedQuoteIds.includes(invoice.quoteId ?? '');
  }));
};

const snapshotUnrelatedQuotes = async (trackedQuoteIds) => {
  const result = await query(`
    SELECT
      COUNT(*)::int AS count,
      COALESCE(string_agg(
        md5(concat_ws('|', id, COALESCE(client_id, ''), COALESCE(updated_at::text, ''), payload::text)),
        ',' ORDER BY id
      ), '') AS fingerprint
    FROM quotes
    WHERE NOT (id = ANY($1::text[]))
  `, [trackedQuoteIds]);

  return {
    count: Number(result.rows[0]?.count ?? 0),
    fingerprint: result.rows[0]?.fingerprint ?? ''
  };
};

const snapshotUnrelatedInvoices = async (trackedInvoiceIds, trackedQuoteIds) => {
  const result = await query(`
    SELECT
      COUNT(*)::int AS count,
      COALESCE(string_agg(
        md5(concat_ws('|', id, COALESCE(client_id, ''), COALESCE(quote_id, ''), COALESCE(updated_at::text, ''), payload::text)),
        ',' ORDER BY id
      ), '') AS fingerprint
    FROM invoices
    WHERE NOT (id = ANY($1::text[]))
      AND (quote_id IS NULL OR NOT (quote_id = ANY($2::text[])))
  `, [trackedInvoiceIds, trackedQuoteIds]);

  return {
    count: Number(result.rows[0]?.count ?? 0),
    fingerprint: result.rows[0]?.fingerprint ?? ''
  };
};

const writeReport = (report) => {
  fs.mkdirSync(reportDir, { recursive: true });

  const slug = timestampSlug();
  const jsonLatestPath = path.join(reportDir, 'postgres-quotes-invoices-domain.latest.json');
  const markdownLatestPath = path.join(reportDir, 'postgres-quotes-invoices-domain.latest.md');
  const jsonPath = path.join(reportDir, `postgres-quotes-invoices-domain.${slug}.json`);
  const markdownPath = path.join(reportDir, `postgres-quotes-invoices-domain.${slug}.md`);
  const artifacts = { jsonLatestPath, markdownLatestPath, jsonPath, markdownPath };

  report.artifacts = artifacts;
  fs.writeFileSync(jsonLatestPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(markdownLatestPath, toMarkdown(report));
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(markdownPath, toMarkdown(report));
};

const toMarkdown = (report) => {
  const lines = [];
  lines.push('# PostgreSQL Quotes Invoices Domain Validation');
  lines.push('');
  lines.push(`- Status: \`${report.status}\``);
  lines.push(`- Started at: \`${report.startedAt}\``);
  lines.push(`- Finished at: \`${report.finishedAt}\``);
  lines.push(`- SQLite source kept: \`${report.sqlitePath}\``);
  lines.push(`- SQLite audit copy used by local runtime: \`${report.sqliteCopyPath}\``);
  lines.push(`- DB driver forced for audit: \`${report.routing.configuredDriver}\``);
  lines.push(`- Active PostgreSQL scopes: \`${report.routing.activePostgresScopes.join(', ') || 'none'}\``);
  lines.push(`- Activation decision: \`${report.activationDecision}\``);
  lines.push(`- Base URL: \`${report.baseUrl ?? 'n/a'}\``);
  lines.push('');
  lines.push('## Validated');
  lines.push('');
  report.validated.forEach((item) => lines.push(`- ${item}`));
  if (!report.validated.length) lines.push('- None.');
  lines.push('');
  lines.push('## Sequence Checks');
  lines.push('');
  report.sequenceChecks.forEach((item) => lines.push(`- ${item.name}: ${item.ok ? 'ok' : 'failed'}${item.detail ? ` (${item.detail})` : ''}`));
  lines.push('');
  lines.push('## Parity Checks');
  lines.push('');
  report.parityChecks.forEach((item) => lines.push(`- ${item.name}: ${item.ok ? 'ok' : 'failed'}${item.detail ? ` (${item.detail})` : ''}`));
  lines.push('');
  lines.push('## Activation Plan');
  lines.push('');
  report.activationPlan.forEach((item) => lines.push(`- ${item}`));
  if (!report.activationPlan.length) lines.push('- None.');
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
  const ownerId = `quotes-invoices-domain-owner-${suffix}`;
  const ownerUsername = `quotes_invoices_domain_owner_${suffix}`;
  const ownerEmail = `quotes-invoices-domain-owner-${suffix}@example.test`;
  const ownerPassword = 'OwnerAudit#2026!';
  const year = new Date().getFullYear();

  const quoteDeleteId = `qid-delete-${suffix}`;
  const quoteCycleReopenId = `qid-reopen-${suffix}`;
  const quoteCycleRedirectId = `qid-redirect-${suffix}`;
  const standaloneInvoiceId = `iid-standalone-${suffix}`;
  const extraRedirectInvoiceId = `iid-redirect-extra-${suffix}`;

  const quoteDeleteInitial = {
    id: quoteDeleteId,
    numero: `DEV-${year}-${suffix.slice(-4).padStart(4, '0')}D`,
    date: new Date().toISOString().slice(0, 10),
    clientId: null,
    client: {
      nom: `Quote Delete ${suffix}`,
      adresse: 'Rue Quote Delete, Tunis',
      tel: '+216 70 101 101',
      telephone: '+216 70 101 101',
      mf: `MF-QD-${suffix}`,
      email: `quote-delete-${suffix}@example.test`
    },
    lignes: [
      {
        id: `line-delete-${suffix}-1`,
        designation: 'Quote delete line',
        unite: 'piece',
        quantite: 1,
        prixUnitaire: 120,
        tvaRate: 19
      }
    ],
    remiseType: 'montant',
    remiseValue: 4,
    notes: 'initial delete quote',
    conditions: 'Paiement comptant',
    status: 'draft'
  };

  const quoteDeleteUpdated = {
    ...quoteDeleteInitial,
    notes: 'updated delete quote',
    conditions: 'Paiement 30 jours',
    lignes: [
      ...quoteDeleteInitial.lignes,
      {
        id: `line-delete-${suffix}-2`,
        designation: 'Quote delete line 2',
        unite: 'm',
        quantite: 2,
        prixUnitaire: 80,
        tvaRate: 19
      }
    ]
  };

  const quoteCycleReopen = {
    id: quoteCycleReopenId,
    numero: `DEV-${year}-${suffix.slice(-4).padStart(4, '0')}R`,
    date: new Date().toISOString().slice(0, 10),
    clientId: null,
    client: {
      nom: `Quote Reopen ${suffix}`,
      adresse: 'Rue Quote Reopen, Tunis',
      tel: '+216 70 202 202',
      telephone: '+216 70 202 202',
      mf: `MF-QR-${suffix}`,
      email: `quote-reopen-${suffix}@example.test`
    },
    lignes: [
      {
        id: `line-reopen-${suffix}-1`,
        designation: 'Quote reopen line',
        unite: 'piece',
        quantite: 3,
        prixUnitaire: 90,
        tvaRate: 19
      }
    ],
    remiseType: 'montant',
    remiseValue: 3,
    notes: 'cycle reopen',
    conditions: 'Paiement comptant',
    status: 'draft'
  };

  const quoteCycleRedirect = {
    id: quoteCycleRedirectId,
    numero: `DEV-${year}-${suffix.slice(-4).padStart(4, '0')}X`,
    date: new Date().toISOString().slice(0, 10),
    clientId: null,
    client: {
      nom: `Quote Redirect ${suffix}`,
      adresse: 'Rue Quote Redirect, Tunis',
      tel: '+216 70 303 303',
      telephone: '+216 70 303 303',
      mf: `MF-QX-${suffix}`,
      email: `quote-redirect-${suffix}@example.test`
    },
    lignes: [
      {
        id: `line-redirect-${suffix}-1`,
        designation: 'Quote redirect line',
        unite: 'piece',
        quantite: 4,
        prixUnitaire: 70,
        tvaRate: 19
      }
    ],
    remiseType: 'montant',
    remiseValue: 0,
    notes: 'cycle redirect',
    conditions: 'Paiement 60 jours',
    status: 'draft'
  };

  const standaloneInvoiceInitial = {
    id: standaloneInvoiceId,
    numero: `FAC-${year}-${suffix.slice(-4).padStart(4, '0')}S`,
    date: new Date().toISOString().slice(0, 10),
    clientId: null,
    client: {
      nom: `Invoice Standalone ${suffix}`,
      adresse: 'Rue Invoice Standalone, Tunis',
      tel: '+216 70 404 404',
      telephone: '+216 70 404 404',
      mf: `MF-IS-${suffix}`,
      email: `invoice-standalone-${suffix}@example.test`
    },
    lignes: [
      {
        id: `line-invoice-${suffix}-1`,
        designation: 'Standalone invoice line',
        unite: 'piece',
        quantite: 5,
        prixUnitaire: 55,
        tvaRate: 19
      }
    ],
    remiseType: 'montant',
    remiseValue: 6,
    remiseAvantTVA: false,
    notes: 'standalone invoice initial',
    conditions: 'Paiement comptant',
    quoteId: null,
    sourceQuoteNumber: null
  };

  const standaloneInvoiceUpdated = {
    ...standaloneInvoiceInitial,
    notes: 'standalone invoice updated',
    conditions: 'Paiement 45 jours',
    client: {
      ...standaloneInvoiceInitial.client,
      adresse: 'Rue Invoice Standalone Updated, Tunis'
    },
    lignes: [
      ...standaloneInvoiceInitial.lignes,
      {
        id: `line-invoice-${suffix}-2`,
        designation: 'Standalone invoice line 2',
        unite: 'm',
        quantite: 1,
        prixUnitaire: 25,
        tvaRate: 19
      }
    ]
  };

  const report = {
    startedAt: nowIso(),
    finishedAt: null,
    status: 'running',
    sqlitePath: sourceSqlitePath,
    sqliteCopyPath,
    baseUrl: null,
    routing: getDatabaseRoutingSummary(),
    activationDecision: 'not-evaluated',
    validated: [],
    sequenceChecks: [],
    parityChecks: [],
    activationPlan: [],
    remainingRisks: [],
    artifacts: null
  };

  let server;
  const cleanupQuoteIds = new Set([quoteDeleteId, quoteCycleReopenId, quoteCycleRedirectId]);
  const cleanupInvoiceIds = new Set([standaloneInvoiceId, extraRedirectInvoiceId]);
  const cleanupClientIds = new Set();

  try {
    assert(report.routing.configuredDriver === 'postgres', 'The quotes/invoices domain audit must run with DB_DRIVER=postgres.');
    ['quotes-read', 'quotes-write', 'quotes-convert-write', 'invoices-read', 'invoices-write', 'invoices-delete-write'].forEach((scope) => {
      assert(report.routing.activePostgresScopes.includes(scope), `${scope} is not routed to PostgreSQL.`);
    });

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
      [ownerId, 'Quotes Invoices Domain Audit', ownerUsername, ownerEmail, hashPassword(ownerPassword), nowIso()]
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

    const loginResult = await requestJson(report.baseUrl, '/api/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'user-agent': 'quotes-invoices-domain-audit'
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
    report.sequenceChecks.push({ name: 'auth login', ok: true, detail: 'owner audit session created' });

    const authHeaders = {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'user-agent': 'quotes-invoices-domain-audit'
    };

    const trackedQuoteIds = [quoteDeleteId, quoteCycleReopenId, quoteCycleRedirectId];
    let trackedInvoiceIds = [standaloneInvoiceId, extraRedirectInvoiceId];

    const unrelatedQuotesBefore = await snapshotUnrelatedQuotes(trackedQuoteIds);
    const unrelatedInvoicesBefore = await snapshotUnrelatedInvoices(trackedInvoiceIds, trackedQuoteIds);

    assert(sqliteQuotesWriteRepository.putQuote(sqliteDb, quoteDeleteInitial), 'SQLite quote create failed for delete scenario.');
    const quoteDeleteCreateResponse = await requestJson(report.baseUrl, '/api/quotes', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(quoteDeleteInitial)
    });
    assert(quoteDeleteCreateResponse.response.ok && quoteDeleteCreateResponse.body?.result === true, 'POST /api/quotes failed for delete scenario.');
    report.sequenceChecks.push({ name: 'create quote for delete scenario', ok: true, detail: `id=${quoteDeleteId}` });

    assert(sqliteQuotesWriteRepository.putQuote(sqliteDb, quoteDeleteUpdated), 'SQLite quote update failed for delete scenario.');
    const quoteDeleteUpdateResponse = await requestJson(report.baseUrl, `/api/quotes/${encodeURIComponent(quoteDeleteId)}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(quoteDeleteUpdated)
    });
    assert(quoteDeleteUpdateResponse.response.ok && quoteDeleteUpdateResponse.body?.result === true, 'PUT /api/quotes/:id failed for delete scenario.');
    report.sequenceChecks.push({ name: 'update quote', ok: true, detail: `id=${quoteDeleteId}` });

    assert(sqliteQuotesWriteRepository.putQuote(sqliteDb, quoteCycleReopen), 'SQLite quote create failed for reopen cycle.');
    assert(sqliteQuotesWriteRepository.putQuote(sqliteDb, quoteCycleRedirect), 'SQLite quote create failed for redirect cycle.');
    const quoteReopenCreateResponse = await requestJson(report.baseUrl, '/api/quotes', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(quoteCycleReopen)
    });
    const quoteRedirectCreateResponse = await requestJson(report.baseUrl, '/api/quotes', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(quoteCycleRedirect)
    });
    assert(quoteReopenCreateResponse.response.ok && quoteReopenCreateResponse.body?.result === true, 'POST /api/quotes failed for reopen cycle.');
    assert(quoteRedirectCreateResponse.response.ok && quoteRedirectCreateResponse.body?.result === true, 'POST /api/quotes failed for redirect cycle.');
    report.sequenceChecks.push({ name: 'create cycle quotes', ok: true, detail: `ids=${quoteCycleReopenId}, ${quoteCycleRedirectId}` });

    assert(sqliteInvoicesWriteRepository.putInvoice(sqliteDb, standaloneInvoiceInitial), 'SQLite standalone invoice create failed.');
    const standaloneInvoiceCreateResponse = await requestJson(report.baseUrl, '/api/invoices', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(standaloneInvoiceInitial)
    });
    assert(standaloneInvoiceCreateResponse.response.ok && standaloneInvoiceCreateResponse.body?.result === true, 'POST /api/invoices failed for standalone invoice.');
    report.sequenceChecks.push({ name: 'create standalone invoice', ok: true, detail: `id=${standaloneInvoiceId}` });

    assert(sqliteInvoicesWriteRepository.putInvoice(sqliteDb, standaloneInvoiceUpdated), 'SQLite standalone invoice update failed.');
    const standaloneInvoiceUpdateResponse = await requestJson(report.baseUrl, `/api/invoices/${encodeURIComponent(standaloneInvoiceId)}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(standaloneInvoiceUpdated)
    });
    assert(standaloneInvoiceUpdateResponse.response.ok && standaloneInvoiceUpdateResponse.body?.result === true, 'PUT /api/invoices/:id failed for standalone invoice.');
    report.sequenceChecks.push({ name: 'update standalone invoice', ok: true, detail: `id=${standaloneInvoiceId}` });

    const sqliteQuotesAfterSetup = getSqliteTrackedQuotes(sqliteDb, trackedQuoteIds);
    const postgresQuotesAfterSetup = await getPostgresTrackedQuotes(report.baseUrl, authHeaders, trackedQuoteIds);
    assert(JSON.stringify(sqliteQuotesAfterSetup) === JSON.stringify(postgresQuotesAfterSetup), 'quotes-read parity mismatch after setup.');
    report.sequenceChecks.push({ name: 'quotes-read after setup', ok: true, detail: `count=${postgresQuotesAfterSetup.length}` });
    report.parityChecks.push({ name: 'quotes list parity after setup', ok: true, detail: `count=${postgresQuotesAfterSetup.length}` });

    const sqliteInvoicesAfterSetup = getSqliteTrackedInvoices(sqliteDb, trackedInvoiceIds, trackedQuoteIds);
    const postgresInvoicesAfterSetup = await getPostgresTrackedInvoices(report.baseUrl, authHeaders, trackedInvoiceIds, trackedQuoteIds);
    assert(JSON.stringify(sqliteInvoicesAfterSetup) === JSON.stringify(postgresInvoicesAfterSetup), 'invoices-read parity mismatch after setup.');
    report.sequenceChecks.push({ name: 'invoices-read after setup', ok: true, detail: `count=${postgresInvoicesAfterSetup.length}` });
    report.parityChecks.push({ name: 'invoices list parity after setup', ok: true, detail: `count=${postgresInvoicesAfterSetup.length}` });

    const postgresQuoteDeleteGet = await requestJson(report.baseUrl, `/api/quotes/${encodeURIComponent(quoteDeleteId)}`, { headers: authHeaders });
    assert(postgresQuoteDeleteGet.response.ok, 'GET /api/quotes/:id failed after setup.');
    const sqliteQuoteDeleteGet = normalizeQuote(sqliteQuotesReadRepository.getQuoteById(sqliteDb, quoteDeleteId));
    assert(JSON.stringify(sqliteQuoteDeleteGet) === JSON.stringify(normalizeQuote(postgresQuoteDeleteGet.body?.result ?? null)), 'quotes:getById parity mismatch after setup.');
    report.parityChecks.push({ name: 'quote getById parity after setup', ok: true, detail: `id=${quoteDeleteId}` });

    const postgresStandaloneInvoiceGet = await requestJson(report.baseUrl, `/api/invoices/${encodeURIComponent(standaloneInvoiceId)}`, { headers: authHeaders });
    assert(postgresStandaloneInvoiceGet.response.ok, 'GET /api/invoices/:id failed after setup.');
    const sqliteStandaloneInvoiceGet = normalizeInvoice(sqliteInvoicesReadRepository.getInvoiceById(sqliteDb, standaloneInvoiceId));
    assert(JSON.stringify(sqliteStandaloneInvoiceGet) === JSON.stringify(normalizeInvoice(postgresStandaloneInvoiceGet.body?.result ?? null)), 'invoices:getById parity mismatch after setup.');
    report.parityChecks.push({ name: 'invoice getById parity after setup', ok: true, detail: `id=${standaloneInvoiceId}` });

    assert(sqliteQuotesWriteRepository.deleteQuote(sqliteDb, quoteDeleteId), 'SQLite quote delete failed.');
    const quoteDeleteResponse = await requestJson(report.baseUrl, `/api/quotes/${encodeURIComponent(quoteDeleteId)}`, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'quotes-invoices-domain-audit'
      }
    });
    assert(quoteDeleteResponse.response.ok && quoteDeleteResponse.body?.result === true, 'DELETE /api/quotes/:id failed.');
    report.sequenceChecks.push({ name: 'delete quote', ok: true, detail: `id=${quoteDeleteId}` });

    const sqliteQuotesAfterDelete = getSqliteTrackedQuotes(sqliteDb, trackedQuoteIds);
    const postgresQuotesAfterDelete = await getPostgresTrackedQuotes(report.baseUrl, authHeaders, trackedQuoteIds);
    assert(JSON.stringify(sqliteQuotesAfterDelete) === JSON.stringify(postgresQuotesAfterDelete), 'quotes list parity mismatch after quote delete.');
    report.parityChecks.push({ name: 'quotes list parity after quote delete', ok: true, detail: `count=${postgresQuotesAfterDelete.length}` });

    const quoteDeleteGetAfter = await requestJson(report.baseUrl, `/api/quotes/${encodeURIComponent(quoteDeleteId)}`, { headers: authHeaders });
    assert(quoteDeleteGetAfter.response.ok, 'GET /api/quotes/:id failed after quote delete.');
    assert(
      JSON.stringify(normalizeQuote(sqliteQuotesReadRepository.getQuoteById(sqliteDb, quoteDeleteId))) ===
      JSON.stringify(normalizeQuote(quoteDeleteGetAfter.body?.result ?? null)),
      'quotes:getById parity mismatch after quote delete.'
    );
    report.parityChecks.push({ name: 'quote delete state parity', ok: true, detail: `id=${quoteDeleteId}` });

    const sqliteConvertReopen = sqliteQuotesConvertRepository.convertQuoteToInvoice(sqliteDb, quoteCycleReopenId);
    const pgConvertReopen = await requestJson(report.baseUrl, `/api/quotes/${encodeURIComponent(quoteCycleReopenId)}/convert-to-invoice`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'quotes-invoices-domain-audit'
      }
    });
    assert(pgConvertReopen.response.ok, 'convertToInvoice failed for reopen cycle.');
    const pgReopenInvoiceId = pgConvertReopen.body?.result?.invoiceId;
    const sqliteReopenInvoiceId = sqliteConvertReopen.invoiceId;
    assert(pgReopenInvoiceId && sqliteReopenInvoiceId, 'convertToInvoice did not return invoice ids for reopen cycle.');
    cleanupInvoiceIds.add(pgReopenInvoiceId);
    trackedInvoiceIds = [...new Set([...trackedInvoiceIds, pgReopenInvoiceId])];
    report.sequenceChecks.push({ name: 'convert quote to invoice (reopen cycle)', ok: true, detail: `quote=${quoteCycleReopenId}` });

    const sqliteConvertRedirect = sqliteQuotesConvertRepository.convertQuoteToInvoice(sqliteDb, quoteCycleRedirectId);
    const pgConvertRedirect = await requestJson(report.baseUrl, `/api/quotes/${encodeURIComponent(quoteCycleRedirectId)}/convert-to-invoice`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'quotes-invoices-domain-audit'
      }
    });
    assert(pgConvertRedirect.response.ok, 'convertToInvoice failed for redirect cycle.');
    const pgRedirectPrimaryInvoiceId = pgConvertRedirect.body?.result?.invoiceId;
    const sqliteRedirectPrimaryInvoiceId = sqliteConvertRedirect.invoiceId;
    assert(pgRedirectPrimaryInvoiceId && sqliteRedirectPrimaryInvoiceId, 'convertToInvoice did not return invoice ids for redirect cycle.');
    cleanupInvoiceIds.add(pgRedirectPrimaryInvoiceId);
    trackedInvoiceIds = [...new Set([...trackedInvoiceIds, pgRedirectPrimaryInvoiceId])];
    report.sequenceChecks.push({ name: 'convert quote to invoice (redirect cycle)', ok: true, detail: `quote=${quoteCycleRedirectId}` });

    const extraRedirectInvoice = {
      id: extraRedirectInvoiceId,
      numero: `FAC-${year}-${suffix.slice(-4).padStart(4, '0')}R`,
      date: new Date().toISOString().slice(0, 10),
      clientId: null,
      client: quoteCycleRedirect.client,
      lignes: quoteCycleRedirect.lignes,
      remiseType: quoteCycleRedirect.remiseType,
      remiseValue: quoteCycleRedirect.remiseValue,
      remiseAvantTVA: false,
      notes: 'extra redirect invoice',
      conditions: quoteCycleRedirect.conditions,
      quoteId: quoteCycleRedirectId,
      sourceQuoteNumber: quoteCycleRedirect.numero
    };

    assert(sqliteInvoicesWriteRepository.putInvoice(sqliteDb, extraRedirectInvoice), 'SQLite extra redirect invoice create failed.');
    const extraRedirectInvoiceResponse = await requestJson(report.baseUrl, '/api/invoices', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(extraRedirectInvoice)
    });
    assert(extraRedirectInvoiceResponse.response.ok && extraRedirectInvoiceResponse.body?.result === true, 'POST /api/invoices failed for extra redirect invoice.');
    report.sequenceChecks.push({ name: 'create replacement invoice for redirect cycle', ok: true, detail: `id=${extraRedirectInvoiceId}` });

    const sqliteQuotesAfterConvert = getSqliteTrackedQuotes(sqliteDb, trackedQuoteIds);
    const postgresQuotesAfterConvert = await getPostgresTrackedQuotes(report.baseUrl, authHeaders, trackedQuoteIds);
    assert(JSON.stringify(sqliteQuotesAfterConvert) === JSON.stringify(postgresQuotesAfterConvert), 'quotes list parity mismatch after convertToInvoice.');
    report.parityChecks.push({ name: 'quotes list parity after convert flow', ok: true, detail: `count=${postgresQuotesAfterConvert.length}` });

    const sqliteInvoicesAfterConvert = getSqliteTrackedInvoices(sqliteDb, trackedInvoiceIds, trackedQuoteIds);
    const postgresInvoicesAfterConvert = await getPostgresTrackedInvoices(report.baseUrl, authHeaders, trackedInvoiceIds, trackedQuoteIds);
    assert(JSON.stringify(sqliteInvoicesAfterConvert) === JSON.stringify(postgresInvoicesAfterConvert), 'invoices list parity mismatch after convert flow.');
    report.parityChecks.push({ name: 'invoices list parity after convert flow', ok: true, detail: `count=${postgresInvoicesAfterConvert.length}` });

    const reopenInvoiceGet = await requestJson(report.baseUrl, `/api/invoices/${encodeURIComponent(pgReopenInvoiceId)}`, { headers: authHeaders });
    assert(reopenInvoiceGet.response.ok, 'GET /api/invoices/:id failed for reopen converted invoice.');
    assert(
      JSON.stringify(normalizeInvoice(sqliteInvoicesReadRepository.getInvoiceById(sqliteDb, sqliteReopenInvoiceId))) ===
      JSON.stringify(normalizeInvoice(reopenInvoiceGet.body?.result ?? null)),
      'converted invoice parity mismatch for reopen cycle.'
    );
    report.parityChecks.push({ name: 'converted invoice parity (reopen cycle)', ok: true, detail: `quote=${quoteCycleReopenId}` });

    assert(sqliteInvoicesDeleteRepository.deleteInvoice(sqliteDb, sqliteReopenInvoiceId), 'SQLite invoice delete failed for reopen cycle.');
    const deleteReopenInvoiceResponse = await requestJson(report.baseUrl, `/api/invoices/${encodeURIComponent(pgReopenInvoiceId)}`, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'quotes-invoices-domain-audit'
      }
    });
    assert(deleteReopenInvoiceResponse.response.ok && deleteReopenInvoiceResponse.body?.result === true, 'DELETE /api/invoices failed for reopen cycle.');
    report.sequenceChecks.push({ name: 'delete invoice to reopen quote', ok: true, detail: `quote=${quoteCycleReopenId}` });

    assert(sqliteInvoicesDeleteRepository.deleteInvoice(sqliteDb, sqliteRedirectPrimaryInvoiceId), 'SQLite invoice delete failed for redirect cycle.');
    const deleteRedirectInvoiceResponse = await requestJson(report.baseUrl, `/api/invoices/${encodeURIComponent(pgRedirectPrimaryInvoiceId)}`, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'quotes-invoices-domain-audit'
      }
    });
    assert(deleteRedirectInvoiceResponse.response.ok && deleteRedirectInvoiceResponse.body?.result === true, 'DELETE /api/invoices failed for redirect cycle.');
    report.sequenceChecks.push({ name: 'delete invoice and redirect quote to remaining invoice', ok: true, detail: `quote=${quoteCycleRedirectId}` });

    const sqliteFinalQuotes = getSqliteTrackedQuotes(sqliteDb, trackedQuoteIds);
    const postgresFinalQuotes = await getPostgresTrackedQuotes(report.baseUrl, authHeaders, trackedQuoteIds);
    assert(JSON.stringify(sqliteFinalQuotes) === JSON.stringify(postgresFinalQuotes), 'final quotes list parity mismatch.');
    report.sequenceChecks.push({ name: 'final quotes reread', ok: true, detail: `count=${postgresFinalQuotes.length}` });
    report.parityChecks.push({ name: 'final quotes list parity', ok: true, detail: `count=${postgresFinalQuotes.length}` });

    const sqliteFinalInvoices = getSqliteTrackedInvoices(sqliteDb, trackedInvoiceIds, trackedQuoteIds);
    const postgresFinalInvoices = await getPostgresTrackedInvoices(report.baseUrl, authHeaders, trackedInvoiceIds, trackedQuoteIds);
    assert(JSON.stringify(sqliteFinalInvoices) === JSON.stringify(postgresFinalInvoices), 'final invoices list parity mismatch.');
    report.sequenceChecks.push({ name: 'final invoices reread', ok: true, detail: `count=${postgresFinalInvoices.length}` });
    report.parityChecks.push({ name: 'final invoices list parity', ok: true, detail: `count=${postgresFinalInvoices.length}` });

    const finalQuoteReopenGet = await requestJson(report.baseUrl, `/api/quotes/${encodeURIComponent(quoteCycleReopenId)}`, { headers: authHeaders });
    const finalQuoteRedirectGet = await requestJson(report.baseUrl, `/api/quotes/${encodeURIComponent(quoteCycleRedirectId)}`, { headers: authHeaders });
    assert(finalQuoteReopenGet.response.ok && finalQuoteRedirectGet.response.ok, 'final quote getById failed.');
    assert(
      JSON.stringify(normalizeQuote(sqliteQuotesReadRepository.getQuoteById(sqliteDb, quoteCycleReopenId))) ===
      JSON.stringify(normalizeQuote(finalQuoteReopenGet.body?.result ?? null)),
      'final reopen quote parity mismatch.'
    );
    assert(
      JSON.stringify(normalizeQuote(sqliteQuotesReadRepository.getQuoteById(sqliteDb, quoteCycleRedirectId))) ===
      JSON.stringify(normalizeQuote(finalQuoteRedirectGet.body?.result ?? null)),
      'final redirect quote parity mismatch.'
    );
    report.parityChecks.push({ name: 'final quote getById parity after invoice deletes', ok: true, detail: `quotes=${quoteCycleReopenId}, ${quoteCycleRedirectId}` });

    const finalStandaloneInvoiceGet = await requestJson(report.baseUrl, `/api/invoices/${encodeURIComponent(standaloneInvoiceId)}`, { headers: authHeaders });
    const finalExtraRedirectInvoiceGet = await requestJson(report.baseUrl, `/api/invoices/${encodeURIComponent(extraRedirectInvoiceId)}`, { headers: authHeaders });
    assert(finalStandaloneInvoiceGet.response.ok && finalExtraRedirectInvoiceGet.response.ok, 'final invoice getById failed.');
    assert(
      JSON.stringify(normalizeInvoice(sqliteInvoicesReadRepository.getInvoiceById(sqliteDb, standaloneInvoiceId))) ===
      JSON.stringify(normalizeInvoice(finalStandaloneInvoiceGet.body?.result ?? null)),
      'final standalone invoice parity mismatch.'
    );
    assert(
      JSON.stringify(normalizeInvoice(sqliteInvoicesReadRepository.getInvoiceById(sqliteDb, extraRedirectInvoiceId))) ===
      JSON.stringify(normalizeInvoice(finalExtraRedirectInvoiceGet.body?.result ?? null)),
      'final redirect replacement invoice parity mismatch.'
    );
    report.parityChecks.push({ name: 'final invoice getById parity after all mutations', ok: true, detail: `ids=${standaloneInvoiceId}, ${extraRedirectInvoiceId}` });

    const sqliteQuoteDeleteRow = normalizeQuoteRow(getSqliteQuoteRow(sqliteDb, quoteDeleteId));
    const postgresQuoteDeleteRow = normalizeQuoteRow(await getPostgresQuoteRow(quoteDeleteId));
    const sqliteQuoteReopenRow = normalizeQuoteRow(getSqliteQuoteRow(sqliteDb, quoteCycleReopenId));
    const postgresQuoteReopenRow = normalizeQuoteRow(await getPostgresQuoteRow(quoteCycleReopenId));
    const sqliteQuoteRedirectRow = normalizeQuoteRow(getSqliteQuoteRow(sqliteDb, quoteCycleRedirectId));
    const postgresQuoteRedirectRow = normalizeQuoteRow(await getPostgresQuoteRow(quoteCycleRedirectId));
    assert(JSON.stringify(sqliteQuoteDeleteRow) === JSON.stringify(postgresQuoteDeleteRow), 'stored deleted-quote row parity mismatch.');
    assert(JSON.stringify(sqliteQuoteReopenRow) === JSON.stringify(postgresQuoteReopenRow), 'stored reopen quote row parity mismatch.');
    assert(JSON.stringify(sqliteQuoteRedirectRow) === JSON.stringify(postgresQuoteRedirectRow), 'stored redirect quote row parity mismatch.');
    report.parityChecks.push({ name: 'stored quotes row parity', ok: true, detail: 'delete + reopen + redirect scenarios' });

    const sqliteStandaloneInvoiceRow = normalizeInvoiceRow(getSqliteInvoiceRow(sqliteDb, standaloneInvoiceId));
    const postgresStandaloneInvoiceRow = normalizeInvoiceRow(await getPostgresInvoiceRow(standaloneInvoiceId));
    const sqliteRedirectExtraInvoiceRow = normalizeInvoiceRow(getSqliteInvoiceRow(sqliteDb, extraRedirectInvoiceId));
    const postgresRedirectExtraInvoiceRow = normalizeInvoiceRow(await getPostgresInvoiceRow(extraRedirectInvoiceId));
    assert(JSON.stringify(sqliteStandaloneInvoiceRow) === JSON.stringify(postgresStandaloneInvoiceRow), 'stored standalone invoice row parity mismatch.');
    assert(JSON.stringify(sqliteRedirectExtraInvoiceRow) === JSON.stringify(postgresRedirectExtraInvoiceRow), 'stored redirect extra invoice row parity mismatch.');
    report.parityChecks.push({ name: 'stored invoices row parity', ok: true, detail: 'standalone + redirect replacement invoices' });

    const unrelatedQuotesAfter = await snapshotUnrelatedQuotes(trackedQuoteIds);
    const unrelatedInvoicesAfter = await snapshotUnrelatedInvoices(trackedInvoiceIds, trackedQuoteIds);
    assert(JSON.stringify(unrelatedQuotesBefore) === JSON.stringify(unrelatedQuotesAfter), 'unrelated quotes changed during domain audit.');
    assert(JSON.stringify(unrelatedInvoicesBefore) === JSON.stringify(unrelatedInvoicesAfter), 'unrelated invoices changed during domain audit.');
    report.parityChecks.push({ name: 'unrelated documents unchanged', ok: true, detail: `quotes=${unrelatedQuotesAfter.count}, invoices=${unrelatedInvoicesAfter.count}` });

    [
      await getPostgresQuoteRow(quoteCycleReopenId),
      await getPostgresQuoteRow(quoteCycleRedirectId),
      await getPostgresInvoiceRow(standaloneInvoiceId),
      await getPostgresInvoiceRow(extraRedirectInvoiceId)
    ].forEach((row) => {
      if (row?.client_id) cleanupClientIds.add(row.client_id);
    });

    report.validated.push('Le domaine quotes/invoices complet est coherent sur PostgreSQL en audit: lectures `quotes`/`invoices`, mutations `quotes:put`, `quotes:delete`, `invoices:put`, `quotes:convertToInvoice` et `invoices:delete` sont valides sur une meme sequence metier.');
    report.validated.push('Les relectures finales apres mutations correspondent a la reference SQLite, y compris la suppression d un devis, la creation/mise a jour d une facture standalone, la conversion devis -> facture, la reouverture du devis en `draft` et la redirection vers une autre facture restante.');
    report.validated.push('Le domaine peut maintenant etre active sur PostgreSQL en environnement controle sans divergence metier visible, sous reserve de garder les flags a `0` par defaut dans le depot et de conserver SQLite en secours pendant l activation initiale.');

    report.activationDecision = 'activable-in-controlled-environment';
    report.activationPlan.push('Sur un environnement controle, definir `DB_DRIVER=postgres`, `DB_ENABLE_POSTGRES_QUOTES_READ=1`, `DB_ENABLE_POSTGRES_QUOTES_WRITES=1`, `DB_ENABLE_POSTGRES_INVOICES_READ=1` et `DB_ENABLE_POSTGRES_INVOICES_WRITES=1`.');
    report.activationPlan.push('Conserver SQLite et `DATABASE_PATH` en place pendant la premiere activation controlee pour garder un rollback simple.');
    report.activationPlan.push('Activer d abord sur une instance backend dediee ou un environnement de validation, puis rejouer cet audit global avant d ouvrir le trafic utilisateur normal.');
    report.activationPlan.push('Une fois ce domaine active en environnement controle, la prochaine etape logique vers la bascule finale est un audit global transversal backend complet, puis une activation progressive de tous les domaines PostgreSQL valides.');

    report.remainingRisks.push('Les flags `DB_ENABLE_POSTGRES_QUOTES_READ=0`, `DB_ENABLE_POSTGRES_QUOTES_WRITES=0`, `DB_ENABLE_POSTGRES_INVOICES_READ=0` et `DB_ENABLE_POSTGRES_INVOICES_WRITES=0` doivent rester les valeurs par defaut dans le depot.');
    report.remainingRisks.push('SQLite reste la reference de secours tant que l activation controlee n a pas ete revalidee sur votre environnement cible.');
    report.remainingRisks.push('La prochaine etape ne doit plus etre une migration metier `quotes/invoices`, mais une validation finale transversale avant bascule applicative plus large.');

    report.status = 'completed';
  } catch (error) {
    report.status = 'failed';
    report.activationDecision = 'not-activable';
    report.remainingRisks.push(`Global audit failed before full validation: ${error instanceof Error ? error.message : String(error)}`);
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

    console.log('[quotes-invoices-domain-audit] JSON report:', report.artifacts.jsonLatestPath);
    console.log('[quotes-invoices-domain-audit] Markdown report:', report.artifacts.markdownLatestPath);
    await closePostgresPool();
  }
}

main().catch((error) => {
  console.error('[quotes-invoices-domain-audit] Validation failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
