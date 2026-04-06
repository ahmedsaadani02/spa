#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..', '..');
const reportDir = path.join(projectRoot, 'database', 'reports');

try {
  require('dotenv').config({ path: path.join(projectRoot, '.env') });
} catch (_error) {
  // Ignore if dotenv is unavailable in the current shell context.
}

process.env.DB_DRIVER = 'postgres';
process.env.DB_ENABLE_POSTGRES_CATALOG_READ = '1';

const { getDatabaseRoutingSummary } = require('../../backend/src/config/database');
const { startServer } = require('../../backend/server');
const { query, closePostgresPool } = require('../../backend/src/db/postgres');
const { hashPassword } = require('../../backend/src/services/auth-core.service');
const { listMovements } = require('../../backend/src/repositories/sqlite/movements-read.repository');

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

  throw new Error('Unable to load better-sqlite3 for movements read audit.');
};

const Database = loadBetterSqlite3();

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

const nowIso = () => new Date().toISOString();
const timestampSlug = () => new Date().toISOString().replace(/[:.]/g, '-');

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const normalizeMovement = (row) => ({
  id: row.id,
  itemId: row.itemId,
  reference: row.reference ?? null,
  label: row.label ?? null,
  category: row.category ?? null,
  serie: row.serie ?? null,
  color: row.color,
  type: row.type,
  delta: Number(row.delta ?? 0) || 0,
  before: Number(row.before ?? 0) || 0,
  after: Number(row.after ?? 0) || 0,
  reason: row.reason ?? '',
  actor: row.actor ?? null,
  employeeId: row.employeeId ?? null,
  username: row.username ?? null,
  at: row.at
});

const normalizeMovements = (rows) => rows.map(normalizeMovement);

const writeReport = (report) => {
  fs.mkdirSync(reportDir, { recursive: true });

  const slug = timestampSlug();
  const jsonLatestPath = path.join(reportDir, 'postgres-movements-read.latest.json');
  const markdownLatestPath = path.join(reportDir, 'postgres-movements-read.latest.md');
  const jsonPath = path.join(reportDir, `postgres-movements-read.${slug}.json`);
  const markdownPath = path.join(reportDir, `postgres-movements-read.${slug}.md`);
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
  lines.push('# PostgreSQL Movements Read Validation');
  lines.push('');
  lines.push(`- Status: \`${report.status}\``);
  lines.push(`- Started at: \`${report.startedAt}\``);
  lines.push(`- Finished at: \`${report.finishedAt}\``);
  lines.push(`- SQLite path kept: \`${report.sqlitePath}\``);
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
  lines.push('## Remaining Risks');
  lines.push('');
  report.remainingRisks.forEach((item) => lines.push(`- ${item}`));
  if (!report.remainingRisks.length) lines.push('- None identified.');
  lines.push('');
  return `${lines.join('\n')}\n`;
};

const normalizeResponseBody = async (response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch (_error) {
    return text;
  }
};

async function main() {
  const sqlitePath = resolveSqlitePath();
  const sqliteDb = new Database(sqlitePath, { readonly: true });
  const suffix = Date.now().toString(36);
  const ownerId = `movements-read-owner-${suffix}`;
  const ownerUsername = `movements_read_owner_${suffix}`;
  const ownerEmail = `movements-read-owner-${suffix}@example.test`;
  const ownerPassword = 'OwnerAudit#2026!';

  const report = {
    startedAt: nowIso(),
    finishedAt: null,
    status: 'running',
    sqlitePath,
    baseUrl: null,
    routing: getDatabaseRoutingSummary(),
    validated: [],
    httpChecks: [],
    parityChecks: [],
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
    assert(report.routing.configuredDriver === 'postgres', 'The movements read audit must run with DB_DRIVER=postgres.');
    assert(report.routing.activePostgresScopes.includes('movements-read'), 'Movements read scope is not routed to PostgreSQL.');

    const sqliteExpected = normalizeMovements(listMovements(sqliteDb));

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
          TRUE, TRUE, TRUE, TRUE, TRUE,
          TRUE, TRUE,
          TRUE, TRUE, TRUE, TRUE,
          TRUE, TRUE, TRUE, TRUE,
          TRUE, TRUE,
          $6, $6
        )
      `,
      [ownerId, 'Movements Read Audit', ownerUsername, ownerEmail, hashPassword(ownerPassword), nowIso()]
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
        'user-agent': 'movements-read-audit'
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

    const movementsResponse = await request(report.baseUrl, '/api/movements', {
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'movements-read-audit'
      }
    });
    assert(movementsResponse.response.ok, `/api/movements HTTP status was ${movementsResponse.response.status}.`);
    const movementsActual = normalizeMovements(movementsResponse.body?.result ?? []);
    report.httpChecks.push({ name: 'GET /api/movements', ok: true, detail: `count=${movementsActual.length}` });

    assert(JSON.stringify(movementsActual) === JSON.stringify(sqliteExpected), 'Movements list parity mismatch between PostgreSQL runtime and SQLite.');
    report.parityChecks.push({ name: 'movements list parity', ok: true, detail: `count=${movementsActual.length}` });

    const postgresCount = await query('SELECT COUNT(*)::int AS total FROM movements');
    assert(Number(postgresCount.rows[0]?.total ?? 0) === movementsActual.length, 'PostgreSQL movements count does not match HTTP movements count.');
    report.parityChecks.push({ name: 'movements count parity', ok: true, detail: `count=${movementsActual.length}` });

    report.validated.push('La lecture `movements:list` est compatible PostgreSQL et restitue le meme historique que SQLite.');
    report.validated.push('Le chemin REST `/api/movements` et le handler IPC conservent le meme contrat, avec un routage PostgreSQL lecture seule seulement sous opt-in audit.');

    report.remainingRisks.push('Les ecritures `movements:add` et `stock:applyMovement` restent sur SQLite; `movements:list` PostgreSQL doit donc rester desactive en usage normal tant que ces mutations ne sont pas migrees.');
    report.remainingRisks.push('Le domaine catalogue/stock doit continuer a utiliser `DB_ENABLE_POSTGRES_CATALOG_READ=0` par defaut pour eviter une divergence visible.');

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
    console.log('[movements-read-audit] JSON report:', report.artifacts.jsonLatestPath);
    console.log('[movements-read-audit] Markdown report:', report.artifacts.markdownLatestPath);
    await closePostgresPool();
  }
}

main().catch((error) => {
  console.error('[movements-read-audit] Validation failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
