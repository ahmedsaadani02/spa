#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.join(__dirname, '..', '..');
const reportDir = path.join(projectRoot, 'database', 'reports');

try {
  require('dotenv').config({ path: path.join(projectRoot, '.env') });
} catch (_error) {
  // Ignore if dotenv is unavailable in the current shell context.
}

const nowIso = () => new Date().toISOString();
const timestampSlug = () => new Date().toISOString().replace(/[:.]/g, '-');

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const runNodeScript = (scriptRelativePath) => {
  const scriptPath = path.join(projectRoot, scriptRelativePath);
  return spawnSync(process.execPath, [scriptPath], {
    cwd: projectRoot,
    env: { ...process.env },
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024
  });
};

const readJsonFile = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const writeReport = (report) => {
  fs.mkdirSync(reportDir, { recursive: true });

  const slug = timestampSlug();
  const jsonLatestPath = path.join(reportDir, 'postgres-backend-global.latest.json');
  const markdownLatestPath = path.join(reportDir, 'postgres-backend-global.latest.md');
  const jsonPath = path.join(reportDir, `postgres-backend-global.${slug}.json`);
  const markdownPath = path.join(reportDir, `postgres-backend-global.${slug}.md`);
  const artifacts = { jsonLatestPath, markdownLatestPath, jsonPath, markdownPath };

  report.artifacts = artifacts;
  fs.writeFileSync(jsonLatestPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(markdownLatestPath, toMarkdown(report));
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(markdownPath, toMarkdown(report));
};

const toMarkdown = (report) => {
  const lines = [];
  lines.push('# PostgreSQL Backend Global Validation');
  lines.push('');
  lines.push(`- Status: \`${report.status}\``);
  lines.push(`- Started at: \`${report.startedAt}\``);
  lines.push(`- Finished at: \`${report.finishedAt}\``);
  lines.push(`- Activation decision: \`${report.activationDecision}\``);
  lines.push(`- Base URL: \`${report.baseUrl ?? 'n/a'}\``);
  if (report.routing) {
    lines.push(`- DB driver forced for integration sweep: \`${report.routing.configuredDriver}\``);
    lines.push(`- Active PostgreSQL scopes during integration sweep: \`${report.routing.activePostgresScopes.join(', ') || 'none'}\``);
  }
  lines.push('');

  lines.push('## Child Audits');
  lines.push('');
  report.childAudits.forEach((audit) => {
    lines.push(`- ${audit.name}: ${audit.ok ? 'ok' : 'failed'}${audit.detail ? ` (${audit.detail})` : ''}`);
    if (audit.reportPath) {
      lines.push(`  report: ${audit.reportPath}`);
    }
  });
  if (!report.childAudits.length) lines.push('- None.');
  lines.push('');

  lines.push('## Integration Checks');
  lines.push('');
  report.integrationChecks.forEach((check) => {
    lines.push(`- ${check.name}: ${check.ok ? 'ok' : 'failed'}${check.detail ? ` (${check.detail})` : ''}`);
  });
  if (!report.integrationChecks.length) lines.push('- None.');
  lines.push('');

  lines.push('## Validated');
  lines.push('');
  report.validated.forEach((item) => lines.push(`- ${item}`));
  if (!report.validated.length) lines.push('- None.');
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

  lines.push('## Cleanup Recommendations');
  lines.push('');
  report.cleanupRecommendations.forEach((item) => lines.push(`- ${item}`));
  if (!report.cleanupRecommendations.length) lines.push('- None.');
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

const requestJson = async (baseUrl, route, options = {}) => {
  const response = await fetch(`${baseUrl}${route}`, options);
  const body = await normalizeResponseBody(response);
  return { response, body };
};

async function main() {
  const report = {
    startedAt: nowIso(),
    finishedAt: null,
    status: 'running',
    activationDecision: 'not-evaluated',
    baseUrl: null,
    routing: null,
    childAudits: [],
    integrationChecks: [],
    validated: [],
    activationPlan: [],
    remainingRisks: [],
    cleanupRecommendations: [],
    artifacts: null
  };

  const childAuditDefinitions = [
    {
      name: 'Tranche 1 clients/employees/salary',
      script: 'database/scripts/audit-postgres-tranche1.js',
      reportPath: path.join(reportDir, 'postgres-tranche1-validation.latest.json')
    },
    {
      name: 'Tranche 2 auth/session',
      script: 'database/scripts/audit-postgres-tranche2-auth-session.js',
      reportPath: path.join(reportDir, 'postgres-tranche2-auth-session.latest.json')
    },
    {
      name: 'Domaine catalogue/stock',
      script: 'database/scripts/audit-postgres-catalog-stock-domain.js',
      reportPath: path.join(reportDir, 'postgres-catalog-stock-domain.latest.json')
    },
    {
      name: 'Quotes read',
      script: 'database/scripts/audit-postgres-quotes-read.js',
      reportPath: path.join(reportDir, 'postgres-quotes-read.latest.json')
    },
    {
      name: 'Quotes write',
      script: 'database/scripts/audit-postgres-quotes-write.js',
      reportPath: path.join(reportDir, 'postgres-quotes-write.latest.json')
    },
    {
      name: 'Invoices read',
      script: 'database/scripts/audit-postgres-invoices-read.js',
      reportPath: path.join(reportDir, 'postgres-invoices-read.latest.json')
    },
    {
      name: 'Invoices write',
      script: 'database/scripts/audit-postgres-invoices-write.js',
      reportPath: path.join(reportDir, 'postgres-invoices-write.latest.json')
    },
    {
      name: 'Quotes convertToInvoice',
      script: 'database/scripts/audit-postgres-quotes-convert.js',
      reportPath: path.join(reportDir, 'postgres-quotes-convert.latest.json')
    },
    {
      name: 'Invoices delete',
      script: 'database/scripts/audit-postgres-invoices-delete.js',
      reportPath: path.join(reportDir, 'postgres-invoices-delete.latest.json')
    }
  ];

  let server = null;
  let closePostgresPool = async () => {};
  let query = async () => {};
  let ownerId = '';

  try {
    for (const childAudit of childAuditDefinitions) {
      const result = runNodeScript(childAudit.script);
      const detail = result.status === 0
        ? `exit=${result.status}`
        : `exit=${result.status}; ${String(result.stderr || result.stdout || '').trim().slice(-500)}`;

      const childRecord = {
        name: childAudit.name,
        ok: result.status === 0,
        detail,
        reportPath: childAudit.reportPath
      };

      if (result.status !== 0) {
        report.childAudits.push(childRecord);
        throw new Error(`${childAudit.name} failed: ${detail}`);
      }

      const childReport = readJsonFile(childAudit.reportPath);
      assert(childReport.status === 'completed', `${childAudit.name} report status is ${childReport.status}.`);
      report.childAudits.push({
        ...childRecord,
        detail: `${detail}; report=${childReport.status}`
      });
    }

    process.env.DB_DRIVER = 'postgres';
    process.env.DB_ENABLE_POSTGRES_CATALOG_READ = '1';
    process.env.DB_ENABLE_POSTGRES_PRODUCT_WRITES = '1';
    process.env.DB_ENABLE_POSTGRES_STOCK_WRITES = '1';
    process.env.DB_ENABLE_POSTGRES_QUOTES_READ = '1';
    process.env.DB_ENABLE_POSTGRES_QUOTES_WRITES = '1';
    process.env.DB_ENABLE_POSTGRES_INVOICES_READ = '1';
    process.env.DB_ENABLE_POSTGRES_INVOICES_WRITES = '1';

    const { getDatabaseRoutingSummary } = require('../../backend/src/config/database');
    const { startServer } = require('../../backend/server');
    ({ query, closePostgresPool } = require('../../backend/src/db/postgres'));
    const { hashPassword } = require('../../backend/src/services/auth-core.service');

    report.routing = getDatabaseRoutingSummary();

    assert(report.routing.configuredDriver === 'postgres', 'The backend global audit requires DB_DRIVER=postgres.');
    [
      'clients',
      'employees',
      'salary',
      'auth-security',
      'quotes-read',
      'quotes-write',
      'quotes-convert-write',
      'invoices-read',
      'invoices-write',
      'invoices-delete-write',
      'products-read',
      'stock-read',
      'movements-read',
      'price-history-read',
      'products-metadata-write',
      'products-core-write',
      'products-structure-write',
      'products-price-write',
      'products-purge-write',
      'stock-set-qty-write',
      'stock-delta-write',
      'movements-write',
      'stock-apply-movement-write'
    ].forEach((scope) => {
      assert(report.routing.activePostgresScopes.includes(scope), `${scope} is not active on PostgreSQL during the global backend audit.`);
    });

    const suffix = Date.now().toString(36);
    ownerId = `backend-global-owner-${suffix}`;
    const ownerUsername = `backend_global_owner_${suffix}`;
    const ownerEmail = `backend-global-owner-${suffix}@example.test`;
    const ownerPassword = 'BackendGlobal#2026!';
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

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
          $1, $2, '', '', 'Direction', 2500, NULL, TRUE, TRUE,
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
      [ownerId, 'Backend Global Audit Owner', ownerUsername, ownerEmail, hashPassword(ownerPassword), nowIso()]
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
    assert(port, 'Unable to determine the backend global audit server port.');
    report.baseUrl = `http://127.0.0.1:${port}`;

    const loginResponse = await requestJson(report.baseUrl, '/api/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'user-agent': 'backend-global-audit'
      },
      body: JSON.stringify({
        identity: ownerUsername,
        password: ownerPassword
      })
    });
    assert(loginResponse.response.ok, `POST /api/auth/login failed with status ${loginResponse.response.status}.`);
    assert(loginResponse.body?.result?.status === 'success', 'POST /api/auth/login did not return status=success.');
    assert(typeof loginResponse.body?.result?.token === 'string' && loginResponse.body.result.token.length > 0, 'POST /api/auth/login did not return a token.');
    const token = loginResponse.body.result.token;
    report.integrationChecks.push({ name: 'auth login', ok: true, detail: `token=${token.slice(0, 8)}...` });

    const authHeaders = {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'user-agent': 'backend-global-audit'
    };

    const checks = [
      ['GET /api/auth/me', '/api/auth/me'],
      ['GET /api/auth/permissions/manageInvoices', '/api/auth/permissions/manageInvoices'],
      ['GET /api/clients', '/api/clients'],
      ['GET /api/employees', '/api/employees'],
      ['GET /api/salary/summary', `/api/salary/summary?employeeId=${encodeURIComponent(ownerId)}&month=${month}&year=${year}`],
      ['GET /api/products', '/api/products'],
      ['GET /api/products/archived', '/api/products/archived'],
      ['GET /api/products/metadata', '/api/products/metadata'],
      ['GET /api/stock', '/api/stock'],
      ['GET /api/stock/items', '/api/stock/items'],
      ['GET /api/inventory', '/api/inventory'],
      ['GET /api/movements', '/api/movements'],
      ['GET /api/quotes', '/api/quotes'],
      ['GET /api/invoices', '/api/invoices']
    ];

    for (const [label, route] of checks) {
      const result = await requestJson(report.baseUrl, route, { headers: authHeaders });
      assert(result.response.ok, `${label} failed with status ${result.response.status}.`);

      let detail = 'ok';
      if (Array.isArray(result.body?.result)) {
        detail = `count=${result.body.result.length}`;
      } else if (result.body?.result && typeof result.body.result === 'object') {
        if (typeof result.body.result.id === 'string') {
          detail = `id=${result.body.result.id}`;
        } else if (Array.isArray(result.body.result.items)) {
          detail = `items=${result.body.result.items.length}`;
        } else {
          detail = 'object';
        }
      } else if (typeof result.body?.result === 'boolean') {
        detail = `result=${result.body.result}`;
      }

      report.integrationChecks.push({ name: label, ok: true, detail });
    }

    report.validated.push('Les audits profonds PostgreSQL deja disponibles ont tous repasse avec succes avant la synthese globale: auth/session, clients/employees/salary, catalogue/stock, puis quotes/invoices via les sous-flux prepares.');
    report.validated.push('Sous un meme runtime `DB_DRIVER=postgres` avec tous les opt-ins domaines actives, une session autentifiee peut traverser sans erreur `auth/session`, `clients`, `employees`, `salary`, `products`, `stock`, `inventory`, `movements`, `quotes` et `invoices`.');
    report.validated.push('Les sequences metier realistes restent couvertes par les audits de domaine specialises, et la passe d integration globale confirme qu elles coexistent correctement sous le meme backend PostgreSQL de validation.');

    report.activationDecision = 'activable-in-controlled-environment';
    report.activationPlan.push('En environnement de validation, definir `DB_DRIVER=postgres`, `DB_ENABLE_POSTGRES_CATALOG_READ=1`, `DB_ENABLE_POSTGRES_PRODUCT_WRITES=1`, `DB_ENABLE_POSTGRES_STOCK_WRITES=1`, `DB_ENABLE_POSTGRES_QUOTES_READ=1`, `DB_ENABLE_POSTGRES_QUOTES_WRITES=1`, `DB_ENABLE_POSTGRES_INVOICES_READ=1` et `DB_ENABLE_POSTGRES_INVOICES_WRITES=1`.');
    report.activationPlan.push('Conserver SQLite et `DATABASE_PATH` pendant la premiere activation controlee pour garder un rollback simple vers le runtime historique.');
    report.activationPlan.push('Activer d abord sur une instance backend dediee de validation, rejouer `npm run db:pg:backend-global:audit`, puis seulement ouvrir les tests applicatifs ou utilisateurs cibles.');
    report.activationPlan.push('Surveiller en parallele les lectures/ecritures PostgreSQL, les journaux d auth/session et les flux documentaires pendant la premiere fenetre de validation avant toute bascule plus large.');

    report.remainingRisks.push('Les valeurs par defaut du depot restent volontairement sur SQLite ou opt-in a `0`; l activation PostgreSQL doit rester une decision d environnement, pas une bascule code par defaut.');
    report.remainingRisks.push('SQLite reste le plan de retour arriere le plus simple tant que la validation controlee n a pas ete observee dans votre environnement cible.');
    report.remainingRisks.push('La session applicative reste stockee en memoire du process Node; cela reste a traiter a part si vous prevoyez plusieurs instances backend actives en meme temps.');

    report.cleanupRecommendations.push('Ne supprimer aucun chemin SQLite ni `DATABASE_PATH` avant au moins une periode de burn-in en environnement controle avec PostgreSQL actif.');
    report.cleanupRecommendations.push('Quand la validation controlee sera stable, le nettoyage le plus sur sera d abord documentaire: retirer les mentions de mode audit-only devenues obsoletes, puis seulement ensuite envisager la simplification des branches SQLite devenues inutiles.');
    report.cleanupRecommendations.push('Conserver les scripts d audit globaux et de domaine meme apres activation; ils servent de filet de securite avant toute bascule finale ou refactor de nettoyage.');

    report.status = 'completed';
  } catch (error) {
    report.status = 'failed';
    report.activationDecision = 'not-activable';
    report.remainingRisks.push(error instanceof Error ? error.message : String(error));
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
      if (ownerId) {
        await query('DELETE FROM employees WHERE id = $1', [ownerId]);
      }
    } catch (cleanupError) {
      report.remainingRisks.push(`Cleanup warning: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
    }

    report.finishedAt = nowIso();
    writeReport(report);

    try {
      await closePostgresPool();
    } catch (_error) {
      // Ignore pool close errors during teardown.
    }
  }
}

main().catch((error) => {
  console.error('[postgres-backend-global-audit] Validation failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
