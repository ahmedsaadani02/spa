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
const sqliteCopyPath = path.join(tempDir, `invoices-write-audit.${timestampSlug()}.sqlite`);
fs.mkdirSync(tempDir, { recursive: true });
fs.copyFileSync(sourceSqlitePath, sqliteCopyPath);

process.env.DATABASE_PATH = sqliteCopyPath;
process.env.DB_DRIVER = 'postgres';
process.env.DB_ENABLE_POSTGRES_INVOICES_READ = '1';
process.env.DB_ENABLE_POSTGRES_INVOICES_WRITES = '1';

const { getDatabaseRoutingSummary } = require('../../backend/src/config/database');
const { startServer } = require('../../backend/server');
const { query, closePostgresPool } = require('../../backend/src/db/postgres');
const { hashPassword } = require('../../backend/src/services/auth-core.service');
const sqliteInvoicesReadRepository = require('../../backend/src/repositories/sqlite/invoices-read.repository');
const sqliteInvoicesWriteRepository = require('../../backend/src/repositories/sqlite/invoices-write.repository');

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

  throw new Error('Unable to load better-sqlite3 for invoices write audit.');
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

const normalizeInvoiceForParity = (invoice) => {
  if (!invoice || typeof invoice !== 'object') return null;
  return canonicalize({
    id: invoice.id ?? null,
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

const normalizeInvoiceRowForParity = (row) => {
  if (!row) return null;

  let parsedPayload = null;
  try {
    parsedPayload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
  } catch {
    parsedPayload = null;
  }

  return canonicalize({
    id: row.id ?? null,
    client_id: row.client_id ? '<client-id>' : null,
    quote_id: row.quote_id ?? null,
    payload: normalizeInvoiceForParity(parsedPayload)
  });
};

const normalizeInvoiceList = (invoices) => [...invoices]
  .map(normalizeInvoiceForParity)
  .sort((a, b) => String(a.id).localeCompare(String(b.id)));

const normalizeResponseBody = async (response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch (_error) {
    return text;
  }
};

const snapshotPostgresQuotes = async () => {
  const result = await query(`
    SELECT
      COUNT(*)::int AS count,
      COALESCE(string_agg(
        md5(concat_ws('|', id, COALESCE(client_id, ''), COALESCE(updated_at::text, ''), payload::text)),
        ',' ORDER BY id
      ), '') AS fingerprint
    FROM quotes
  `);

  return {
    count: Number(result.rows[0]?.count ?? 0),
    fingerprint: result.rows[0]?.fingerprint ?? ''
  };
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

const getSqliteInvoiceRow = (db, invoiceId) => db.prepare(`
  SELECT id, payload, client_id, quote_id
  FROM invoices
  WHERE id = ?
  LIMIT 1
`).get(invoiceId) ?? null;

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
  const jsonLatestPath = path.join(reportDir, 'postgres-invoices-write.latest.json');
  const markdownLatestPath = path.join(reportDir, 'postgres-invoices-write.latest.md');
  const jsonPath = path.join(reportDir, `postgres-invoices-write.${slug}.json`);
  const markdownPath = path.join(reportDir, `postgres-invoices-write.${slug}.md`);
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
  lines.push('# PostgreSQL Invoices Write Validation');
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
  const ownerId = `invoices-write-owner-${suffix}`;
  const ownerUsername = `invoices_write_owner_${suffix}`;
  const ownerEmail = `invoices-write-owner-${suffix}@example.test`;
  const ownerPassword = 'OwnerAudit#2026!';
  const invoiceId = `invoices-write-audit-${suffix}`;
  const quoteRow = sqliteDb.prepare(`
    SELECT id, payload
    FROM quotes
    ORDER BY id
    LIMIT 1
  `).get();

  assert(quoteRow?.id, 'No quote is available in SQLite to validate quote_id parity.');

  let quotePayload = null;
  try {
    quotePayload = JSON.parse(quoteRow.payload);
  } catch {
    quotePayload = null;
  }

  const createPayload = {
    id: invoiceId,
    numero: `FAC-${new Date().getFullYear()}-${suffix.slice(-4).padStart(4, '0')}`,
    date: new Date().toISOString().slice(0, 10),
    clientId: null,
    client: {
      nom: `Invoices Write Audit ${suffix}`,
      adresse: '',
      tel: '+216 71 555 666',
      telephone: '+216 71 555 666',
      mf: `MF-${suffix}`,
      email: ''
    },
    lignes: [
      {
        id: `line-${suffix}-1`,
        designation: 'Ligne audit facture',
        unite: 'piece',
        quantite: 3,
        prixUnitaire: 210,
        tvaRate: 19
      }
    ],
    remiseType: 'montant',
    remiseValue: 10,
    remiseAvantTVA: false,
    notes: 'Initial invoice write audit',
    conditions: 'Paiement comptant',
    quoteId: quoteRow.id,
    sourceQuoteNumber: typeof quotePayload?.numero === 'string' ? quotePayload.numero : undefined,
    paymentStatus: 'partial',
    paidAt: new Date().toISOString().slice(0, 10),
    paymentMethod: 'Virement',
    purchaseOrderNumber: `BC-${suffix}`,
    customInvoiceNumber: `CLI-${suffix.toUpperCase()}`
  };

  const updatePayload = {
    ...createPayload,
    notes: 'Updated invoice write audit',
    conditions: 'Paiement a 30 jours',
    paymentStatus: 'paid',
    client: {
      ...createPayload.client,
      adresse: 'Rue Audit Facture, Tunis',
      email: `invoices-write-${suffix}@example.test`
    },
    lignes: [
      ...createPayload.lignes,
      {
        id: `line-${suffix}-2`,
        designation: 'Ligne audit facture 2',
        unite: 'm',
        quantite: 5,
        prixUnitaire: 45,
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
  let cleanupInvoiceId = null;
  let cleanupClientId = null;

  const request = async (baseUrl, route, options = {}) => {
    const response = await fetch(`${baseUrl}${route}`, options);
    const body = await normalizeResponseBody(response);
    return { response, body };
  };

  try {
    assert(report.routing.configuredDriver === 'postgres', 'The invoices write audit must run with DB_DRIVER=postgres.');
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
          FALSE, TRUE, FALSE, TRUE,
          FALSE, FALSE, FALSE, FALSE,
          FALSE, FALSE,
          $6, $6
        )
      `,
      [ownerId, 'Invoices Write Audit', ownerUsername, ownerEmail, hashPassword(ownerPassword), nowIso()]
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
        'user-agent': 'invoices-write-audit'
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

    const quotesBefore = await snapshotPostgresQuotes();

    const sqliteCreateOk = sqliteInvoicesWriteRepository.putInvoice(sqliteDb, createPayload);
    assert(sqliteCreateOk === true, 'SQLite reference create failed for invoices write audit.');

    const createResult = await request(report.baseUrl, '/api/invoices', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'user-agent': 'invoices-write-audit'
      },
      body: JSON.stringify(createPayload)
    });

    assert(createResult.response.ok, `POST /api/invoices HTTP status was ${createResult.response.status}.`);
    assert(createResult.body?.result === true, 'POST /api/invoices did not return result=true.');
    report.httpChecks.push({ name: 'POST /api/invoices', ok: true, detail: `invoice=${invoiceId}` });

    const sqliteUpdateOk = sqliteInvoicesWriteRepository.putInvoice(sqliteDb, updatePayload);
    assert(sqliteUpdateOk === true, 'SQLite reference update failed for invoices write audit.');

    const updateResult = await request(report.baseUrl, `/api/invoices/${encodeURIComponent(invoiceId)}`, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'user-agent': 'invoices-write-audit'
      },
      body: JSON.stringify(updatePayload)
    });

    assert(updateResult.response.ok, `PUT /api/invoices/${invoiceId} HTTP status was ${updateResult.response.status}.`);
    assert(updateResult.body?.result === true, `PUT /api/invoices/${invoiceId} did not return result=true.`);
    report.httpChecks.push({ name: 'PUT /api/invoices/:id', ok: true, detail: `invoice=${invoiceId}` });

    const getByIdResult = await request(report.baseUrl, `/api/invoices/${encodeURIComponent(invoiceId)}`, {
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'invoices-write-audit'
      }
    });

    assert(getByIdResult.response.ok, `GET /api/invoices/${invoiceId} HTTP status was ${getByIdResult.response.status}.`);
    const postgresInvoice = normalizeInvoiceForParity(getByIdResult.body?.result ?? null);
    const sqliteInvoice = normalizeInvoiceForParity(sqliteInvoicesReadRepository.getInvoiceById(sqliteDb, invoiceId));
    assert(JSON.stringify(postgresInvoice) === JSON.stringify(sqliteInvoice), 'Invoice getById parity mismatch after invoices:put.');
    report.httpChecks.push({ name: 'GET /api/invoices/:id', ok: true, detail: `invoice=${invoiceId}` });
    report.parityChecks.push({ name: 'invoice getById parity after create/update', ok: true, detail: `invoice=${invoiceId}` });

    const listResult = await request(report.baseUrl, '/api/invoices', {
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'invoices-write-audit'
      }
    });

    assert(listResult.response.ok, `/api/invoices HTTP status after write was ${listResult.response.status}.`);
    const postgresList = normalizeInvoiceList(listResult.body?.result ?? []);
    const sqliteList = normalizeInvoiceList(sqliteInvoicesReadRepository.listInvoices(sqliteDb));
    assert(JSON.stringify(postgresList) === JSON.stringify(sqliteList), 'Invoices list parity mismatch after invoices:put.');
    report.httpChecks.push({ name: 'GET /api/invoices', ok: true, detail: `count=${postgresList.length}` });
    report.parityChecks.push({ name: 'invoices list parity after create/update', ok: true, detail: `count=${postgresList.length}` });

    const postgresInvoiceRow = getPostgresInvoiceRow(invoiceId);
    const sqliteInvoiceRow = getSqliteInvoiceRow(sqliteDb, invoiceId);
    const [resolvedPostgresInvoiceRow] = await Promise.all([postgresInvoiceRow]);
    assert(resolvedPostgresInvoiceRow, 'PostgreSQL invoice row was not found after invoices:put.');
    assert(sqliteInvoiceRow, 'SQLite invoice row was not found after reference invoices:put.');
    cleanupInvoiceId = invoiceId;
    cleanupClientId = resolvedPostgresInvoiceRow.client_id ?? null;

    assert(
      JSON.stringify(normalizeInvoiceRowForParity(resolvedPostgresInvoiceRow)) === JSON.stringify(normalizeInvoiceRowForParity(sqliteInvoiceRow)),
      'Stored invoice row parity mismatch after invoices:put.'
    );
    report.parityChecks.push({ name: 'stored invoices row parity', ok: true, detail: `invoice=${invoiceId}` });

    const postgresClientRow = await getPostgresClientRow(resolvedPostgresInvoiceRow.client_id);
    const sqliteClientRow = getSqliteClientRow(sqliteDb, sqliteInvoiceRow.client_id);
    assert(
      JSON.stringify(normalizeClientRowForParity(postgresClientRow)) === JSON.stringify(normalizeClientRowForParity(sqliteClientRow)),
      'Client side effect parity mismatch after invoices:put.'
    );
    report.parityChecks.push({ name: 'clients side effect parity', ok: true, detail: `client=${resolvedPostgresInvoiceRow.client_id ? '<client-id>' : 'null'}` });

    const quotesAfter = await snapshotPostgresQuotes();
    assert(JSON.stringify(quotesAfter) === JSON.stringify(quotesBefore), 'Quotes table changed during invoices:put audit.');
    report.scopeChecks.push({ name: 'quotes table unchanged during invoices:put', ok: true, detail: `count=${quotesAfter.count}` });
    report.scopeChecks.push({ name: 'quote_id stored without cross-domain rewrite', ok: true, detail: `quote=${quoteRow.id}` });

    report.validated.push('`invoices:put` est compatible PostgreSQL sur creation puis mise a jour, avec la meme forme metier que SQLite apres relecture.');
    report.validated.push('Le payload, `client_id` et `quote_id` sont stockes a parite avec SQLite, y compris l effet annexe attendu sur `clients`.');
    report.validated.push('Aucune mutation cross-domain sur `quotes` n est introduite par cette tranche; `quotes:convertToInvoice` et `invoices:delete` restent hors scope.');

    report.remainingRisks.push('`quotes:convertToInvoice` reste sur SQLite et ouvrira la premiere transaction devis -> facture cross-domain.');
    report.remainingRisks.push('`invoices:delete` reste sur SQLite et reecrit encore le devis lie.');
    report.remainingRisks.push('`DB_ENABLE_POSTGRES_INVOICES_READ=0` et `DB_ENABLE_POSTGRES_INVOICES_WRITES=0` doivent rester les valeurs par defaut hors audit.');

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

    console.log('[invoices-write-audit] JSON report:', report.artifacts.jsonLatestPath);
    console.log('[invoices-write-audit] Markdown report:', report.artifacts.markdownLatestPath);
    await closePostgresPool();
  }
}

main().catch((error) => {
  console.error('[invoices-write-audit] Validation failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
