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
const sqliteCopyPath = path.join(tempDir, `quotes-read-audit.${timestampSlug()}.sqlite`);
fs.mkdirSync(tempDir, { recursive: true });
fs.copyFileSync(sourceSqlitePath, sqliteCopyPath);

process.env.DATABASE_PATH = sqliteCopyPath;
process.env.DB_DRIVER = 'postgres';
process.env.DB_ENABLE_POSTGRES_QUOTES_READ = '1';

const { getDatabaseRoutingSummary } = require('../../backend/src/config/database');
const { startServer } = require('../../backend/server');
const { query, closePostgresPool } = require('../../backend/src/db/postgres');
const { hashPassword } = require('../../backend/src/services/auth-core.service');
const sqliteQuotesReadRepository = require('../../backend/src/repositories/sqlite/quotes-read.repository');

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

  throw new Error('Unable to load better-sqlite3 for quotes read audit.');
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

const normalizeQuote = (quote) => canonicalize({
  id: quote?.id ?? null,
  numero: quote?.numero ?? '',
  date: quote?.date ?? '',
  clientId: quote?.clientId ?? null,
  client: quote?.client ?? null,
  lignes: Array.isArray(quote?.lignes) ? quote.lignes : [],
  remiseType: quote?.remiseType ?? null,
  remiseValue: quote?.remiseValue ?? null,
  notes: quote?.notes ?? '',
  conditions: quote?.conditions ?? '',
  status: quote?.status ?? null,
  convertedInvoiceId: quote?.convertedInvoiceId ?? null,
  convertedAt: quote?.convertedAt ?? null
});

const normalizeQuoteList = (quotes) => [...quotes]
  .map(normalizeQuote)
  .sort((a, b) => String(a.id).localeCompare(String(b.id)));

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

const writeReport = (report) => {
  fs.mkdirSync(reportDir, { recursive: true });

  const slug = timestampSlug();
  const jsonLatestPath = path.join(reportDir, 'postgres-quotes-read.latest.json');
  const markdownLatestPath = path.join(reportDir, 'postgres-quotes-read.latest.md');
  const jsonPath = path.join(reportDir, `postgres-quotes-read.${slug}.json`);
  const markdownPath = path.join(reportDir, `postgres-quotes-read.${slug}.md`);
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
  lines.push('# PostgreSQL Quotes Read Validation');
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
  lines.push('## Write-On-Read Checks');
  lines.push('');
  report.writeChecks.forEach((item) => lines.push(`- ${item.name}: ${item.ok ? 'ok' : 'failed'}${item.detail ? ` (${item.detail})` : ''}`));
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
  const ownerId = `quotes-read-owner-${suffix}`;
  const ownerUsername = `quotes_read_owner_${suffix}`;
  const ownerEmail = `quotes-read-owner-${suffix}@example.test`;
  const ownerPassword = 'OwnerAudit#2026!';

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
    writeChecks: [],
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
    assert(report.routing.configuredDriver === 'postgres', 'The quotes read audit must run with DB_DRIVER=postgres.');
    assert(report.routing.activePostgresScopes.includes('quotes-read'), 'Quotes read scope is not routed to PostgreSQL.');

    const sqliteExpectedList = normalizeQuoteList(sqliteQuotesReadRepository.listQuotes(sqliteDb));
    assert(sqliteExpectedList.length > 0, 'No quotes were found in SQLite for audit.');

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
          FALSE, FALSE, TRUE, FALSE,
          FALSE, FALSE, FALSE, FALSE,
          FALSE, FALSE,
          $6, $6
        )
      `,
      [ownerId, 'Quotes Read Audit', ownerUsername, ownerEmail, hashPassword(ownerPassword), nowIso()]
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
        'user-agent': 'quotes-read-audit'
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

    const snapshotBeforeReads = await snapshotPostgresState();

    const listResponse = await request(report.baseUrl, '/api/quotes', {
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'quotes-read-audit'
      }
    });
    assert(listResponse.response.ok, `/api/quotes HTTP status was ${listResponse.response.status}.`);
    const postgresActualList = normalizeQuoteList(listResponse.body?.result ?? []);
    report.httpChecks.push({ name: 'GET /api/quotes', ok: true, detail: `count=${postgresActualList.length}` });

    assert(JSON.stringify(postgresActualList) === JSON.stringify(sqliteExpectedList), 'Quotes list parity mismatch between PostgreSQL runtime and SQLite.');
    report.parityChecks.push({ name: 'quotes list parity', ok: true, detail: `count=${postgresActualList.length}` });

    for (const quote of sqliteExpectedList) {
      const sqliteExpected = normalizeQuote(sqliteQuotesReadRepository.getQuoteById(sqliteDb, quote.id));
      const response = await request(report.baseUrl, `/api/quotes/${encodeURIComponent(quote.id)}`, {
        headers: {
          authorization: `Bearer ${token}`,
          'user-agent': 'quotes-read-audit'
        }
      });

      assert(response.response.ok, `/api/quotes/${quote.id} HTTP status was ${response.response.status}.`);
      const actual = normalizeQuote(response.body?.result ?? null);
      assert(JSON.stringify(actual) === JSON.stringify(sqliteExpected), `Quote getById parity mismatch for ${quote.id}.`);
    }

    report.httpChecks.push({ name: 'GET /api/quotes/:id', ok: true, detail: `count=${sqliteExpectedList.length}` });
    report.parityChecks.push({ name: 'quotes getById parity', ok: true, detail: `count=${sqliteExpectedList.length}` });

    const snapshotAfterReads = await snapshotPostgresState();
    assert(JSON.stringify(snapshotAfterReads) === JSON.stringify(snapshotBeforeReads), 'PostgreSQL quotes/invoices/clients changed during quotes-read audit.');

    report.writeChecks.push({ name: 'quotes table unchanged during reads', ok: true, detail: `count=${snapshotAfterReads.quotes.count}` });
    report.writeChecks.push({ name: 'invoices table unchanged during reads', ok: true, detail: `count=${snapshotAfterReads.invoices.count}` });
    report.writeChecks.push({ name: 'clients table unchanged during reads', ok: true, detail: `count=${snapshotAfterReads.clients.count}` });

    report.validated.push('La lecture `quotes:list` et `quotes:getById` est compatible PostgreSQL et restitue la meme forme metier que SQLite sur les devis actuels.');
    report.validated.push('Le chemin PostgreSQL ne reutilise pas `backfillDocumentClientLinks()` et ne provoque aucune ecriture sur `quotes`, `invoices` ou `clients` pendant la lecture.');
    report.validated.push('Le scope `quotes-read` reste audit-only et desactive par defaut tant que les ecritures `quotes` et le cycle `quotes -> invoices` ne sont pas migres.');

    report.remainingRisks.push('Les ecritures `quotes:put` et `quotes:delete` restent sur SQLite.');
    report.remainingRisks.push('`quotes:convertToInvoice` reste sur SQLite et depend encore du domaine `invoices`.');
    report.remainingRisks.push('Le domaine `invoices` reste entierement sur SQLite a ce stade; `DB_ENABLE_POSTGRES_QUOTES_READ=0` doit rester la valeur par defaut hors audit.');

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

    console.log('[quotes-read-audit] JSON report:', report.artifacts.jsonLatestPath);
    console.log('[quotes-read-audit] Markdown report:', report.artifacts.markdownLatestPath);
    await closePostgresPool();
  }
}

main().catch((error) => {
  console.error('[quotes-read-audit] Validation failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
