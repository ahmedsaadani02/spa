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

const { getDatabaseRoutingSummary } = require('../../backend/src/config/database');
const { startServer } = require('../../backend/server');
const { query, closePostgresPool } = require('../../backend/src/db/postgres');
const { hashPassword } = require('../../backend/src/services/auth-core.service');
const authSecurityRepository = require('../../backend/src/repositories/auth-security.runtime.repository');

const nowIso = () => new Date().toISOString();
const timestampSlug = () => new Date().toISOString().replace(/[:.]/g, '-');

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const writeReport = (report) => {
  fs.mkdirSync(reportDir, { recursive: true });

  const slug = timestampSlug();
  const jsonLatestPath = path.join(reportDir, 'postgres-tranche2-auth-session.latest.json');
  const markdownLatestPath = path.join(reportDir, 'postgres-tranche2-auth-session.latest.md');
  const jsonPath = path.join(reportDir, `postgres-tranche2-auth-session.${slug}.json`);
  const markdownPath = path.join(reportDir, `postgres-tranche2-auth-session.${slug}.md`);
  const artifacts = {
    jsonLatestPath,
    markdownLatestPath,
    jsonPath,
    markdownPath
  };

  report.artifacts = artifacts;

  const json = JSON.stringify(report, null, 2);
  const markdown = toMarkdown(report);

  fs.writeFileSync(jsonLatestPath, json);
  fs.writeFileSync(markdownLatestPath, markdown);
  fs.writeFileSync(jsonPath, json);
  fs.writeFileSync(markdownPath, markdown);

  return artifacts;
};

const toMarkdown = (report) => {
  const lines = [];
  lines.push('# PostgreSQL Tranche 2 Auth Session Validation');
  lines.push('');
  lines.push(`- Status: \`${report.status}\``);
  lines.push(`- Started at: \`${report.startedAt}\``);
  lines.push(`- Finished at: \`${report.finishedAt}\``);
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
  report.httpChecks.forEach((check) => {
    lines.push(`- ${check.name}: ${check.ok ? 'ok' : 'failed'}${check.detail ? ` (${check.detail})` : ''}`);
  });
  lines.push('');

  lines.push('## Data Checks');
  lines.push('');
  report.dataChecks.forEach((check) => {
    lines.push(`- ${check.name}: ${check.ok ? 'ok' : 'failed'}${check.detail ? ` (${check.detail})` : ''}`);
  });
  lines.push('');

  lines.push('## Runtime Paths');
  lines.push('');
  report.runtimePaths.forEach((item) => {
    lines.push(`- ${item.scope}: ${item.path}`);
  });
  lines.push('');

  lines.push('## Remaining Risks');
  lines.push('');
  report.remainingRisks.forEach((risk) => lines.push(`- ${risk}`));
  if (!report.remainingRisks.length) lines.push('- None identified.');
  lines.push('');

  lines.push('## Not In Scope');
  lines.push('');
  report.outOfScope.forEach((item) => lines.push(`- ${item}`));
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
  const suffix = Date.now().toString(36);
  const ownerId = `tranche2-owner-${suffix}`;
  const employeeId = `tranche2-employee-${suffix}`;
  const ownerUsername = `tranche2_owner_${suffix}`;
  const employeeUsername = `tranche2_employee_${suffix}`;
  const ownerEmail = `tranche2-owner-${suffix}@example.test`;
  const employeeEmail = `tranche2-employee-${suffix}@example.test`;
  const ownerPassword = 'OwnerAudit#2026!';
  const employeePassword = 'EmployeeAudit#2026!';
  const resetPasswordValue = 'EmployeeReset#2026!';
  const auditIp = '127.0.0.1';
  const auditUserAgent = 'tranche2-auth-session-audit';
  const since = new Date(Date.now() - (5 * 60 * 1000)).toISOString();

  const report = {
    startedAt: nowIso(),
    finishedAt: null,
    status: 'running',
    baseUrl: null,
    routing: getDatabaseRoutingSummary(),
    validated: [],
    httpChecks: [],
    dataChecks: [],
    runtimePaths: [
      {
        scope: 'employee auth repository runtime',
        path: 'auth-core.service -> employees.runtime.repository -> postgres/employees.repository when DB_DRIVER=postgres'
      },
      {
        scope: 'session resolution',
        path: 'server.js/auth.service -> session-resolver -> employees.runtime.repository -> postgres/employees.repository when DB_DRIVER=postgres'
      },
      {
        scope: 'security audit trail',
        path: 'auth-core.service -> auth-security.runtime.repository -> postgres/auth-security.repository when DB_DRIVER=postgres'
      }
    ],
    remainingRisks: [],
    outOfScope: [
      'quotes',
      'invoices',
      'products',
      'stock',
      'movements',
      'inventory'
    ],
    artifacts: null
  };

  let server;

  const request = async (baseUrl, route, options = {}) => {
    const response = await fetch(`${baseUrl}${route}`, options);
    const body = await normalizeResponseBody(response);
    return { response, body };
  };

  try {
    assert(report.routing.configuredDriver === 'postgres', 'The tranche 2 audit must run with DB_DRIVER=postgres.');
    assert(report.routing.activePostgresScopes.includes('employees'), 'Employees scope is not routed to PostgreSQL.');
    assert(report.routing.activePostgresScopes.includes('auth-security'), 'Auth-security scope is not routed to PostgreSQL.');

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
      [ownerId, 'Tranche 2 Owner Audit', ownerUsername, ownerEmail, hashPassword(ownerPassword), nowIso()]
    );

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
          $1, $2, '', '', 'Employe', 0, NULL, TRUE, TRUE,
          $3, $4, $4, $5, 'employee',
          FALSE, FALSE, FALSE,
          FALSE, FALSE, FALSE, FALSE, FALSE,
          FALSE, FALSE,
          FALSE, FALSE, FALSE, FALSE,
          FALSE, FALSE, FALSE, FALSE,
          FALSE, FALSE,
          $6, $6
        )
      `,
      [employeeId, 'Tranche 2 Employee Audit', employeeUsername, employeeEmail, hashPassword(employeePassword), nowIso()]
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

    const ownerLogin = await request(report.baseUrl, '/api/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'user-agent': auditUserAgent
      },
      body: JSON.stringify({
        identity: ownerUsername,
        password: ownerPassword
      })
    });
    assert(ownerLogin.response.ok, `Owner login HTTP status was ${ownerLogin.response.status}.`);
    assert(ownerLogin.body?.success === true, 'Owner login did not return success=true.');
    assert(ownerLogin.body?.result?.status === 'success', 'Owner login did not return status=success.');
    assert(ownerLogin.body?.result?.token, 'Owner login did not return a session token.');
    const ownerToken = ownerLogin.body.result.token;
    report.httpChecks.push({ name: 'POST /api/auth/login owner', ok: true, detail: `token=${ownerToken.slice(0, 8)}...` });

    const meResponse = await request(report.baseUrl, '/api/auth/me', {
      headers: {
        authorization: `Bearer ${ownerToken}`,
        'user-agent': auditUserAgent
      }
    });
    assert(meResponse.response.ok, `/api/auth/me HTTP status was ${meResponse.response.status}.`);
    assert(meResponse.body?.result?.id === ownerId, '/api/auth/me did not resolve the PostgreSQL owner session.');
    report.httpChecks.push({ name: 'GET /api/auth/me', ok: true, detail: `userId=${meResponse.body.result.id}` });

    const permissionResponse = await request(report.baseUrl, '/api/auth/permissions/manageEmployees', {
      headers: {
        authorization: `Bearer ${ownerToken}`,
        'user-agent': auditUserAgent
      }
    });
    assert(permissionResponse.response.ok, `/api/auth/permissions/manageEmployees HTTP status was ${permissionResponse.response.status}.`);
    assert(permissionResponse.body?.result === true, '/api/auth/permissions/manageEmployees did not confirm the owner permission.');
    report.httpChecks.push({ name: 'GET /api/auth/permissions/manageEmployees', ok: true });

    const clientsResponse = await request(report.baseUrl, '/api/clients', {
      headers: {
        authorization: `Bearer ${ownerToken}`,
        'user-agent': auditUserAgent
      }
    });
    assert(clientsResponse.response.ok, `/api/clients HTTP status was ${clientsResponse.response.status}.`);
    assert(Array.isArray(clientsResponse.body?.result), '/api/clients did not return an array.');
    report.httpChecks.push({ name: 'GET /api/clients with PostgreSQL-backed session', ok: true, detail: `count=${clientsResponse.body.result.length}` });

    const resetResponse = await request(report.baseUrl, '/api/auth/reset-password', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${ownerToken}`,
        'content-type': 'application/json',
        'user-agent': auditUserAgent
      },
      body: JSON.stringify({
        employeeId,
        newPassword: resetPasswordValue
      })
    });
    assert(resetResponse.response.ok, `/api/auth/reset-password HTTP status was ${resetResponse.response.status}.`);
    assert(resetResponse.body?.result === true, '/api/auth/reset-password did not update the employee password.');
    report.httpChecks.push({ name: 'POST /api/auth/reset-password', ok: true, detail: `employeeId=${employeeId}` });

    const employeeLogin = await request(report.baseUrl, '/api/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'user-agent': auditUserAgent
      },
      body: JSON.stringify({
        identity: employeeUsername,
        password: resetPasswordValue
      })
    });
    assert(employeeLogin.response.ok, `Employee login HTTP status was ${employeeLogin.response.status}.`);
    assert(employeeLogin.body?.result?.status === 'success', 'Employee login with the reset password did not succeed.');
    assert(employeeLogin.body?.result?.token, 'Employee login did not return a session token.');
    const employeeToken = employeeLogin.body.result.token;
    report.httpChecks.push({ name: 'POST /api/auth/login employee after reset', ok: true, detail: `token=${employeeToken.slice(0, 8)}...` });

    const employeeMeResponse = await request(report.baseUrl, '/api/auth/me', {
      headers: {
        authorization: `Bearer ${employeeToken}`,
        'user-agent': auditUserAgent
      }
    });
    assert(employeeMeResponse.response.ok, `Employee /api/auth/me HTTP status was ${employeeMeResponse.response.status}.`);
    assert(employeeMeResponse.body?.result?.id === employeeId, 'Employee /api/auth/me did not resolve the PostgreSQL employee session.');
    report.httpChecks.push({ name: 'GET /api/auth/me employee', ok: true, detail: `userId=${employeeMeResponse.body.result.id}` });

    const ownerRow = await query(
      'SELECT id, last_login_at, updated_at FROM employees WHERE id = $1 LIMIT 1',
      [ownerId]
    );
    const employeeRow = await query(
      'SELECT id, last_login_at, updated_at, must_setup_password FROM employees WHERE id = $1 LIMIT 1',
      [employeeId]
    );

    assert(ownerRow.rows[0]?.last_login_at, 'Owner last_login_at was not updated in PostgreSQL.');
    assert(employeeRow.rows[0]?.last_login_at, 'Employee last_login_at was not updated in PostgreSQL after password reset login.');
    assert(employeeRow.rows[0]?.must_setup_password === false, 'Employee must_setup_password should remain false after reset.');
    report.dataChecks.push({ name: 'employees.last_login_at owner', ok: true, detail: ownerRow.rows[0].last_login_at });
    report.dataChecks.push({ name: 'employees.last_login_at employee', ok: true, detail: employeeRow.rows[0].last_login_at });
    report.dataChecks.push({ name: 'employees.must_setup_password employee', ok: true, detail: String(employeeRow.rows[0].must_setup_password) });

    const ownerSuccessEvents = await authSecurityRepository.countRecentSecurityEvents(null, {
      eventType: 'auth_login_success',
      since,
      emailAttempted: ownerEmail,
      ip: auditIp
    });
    const employeeSuccessEvents = await authSecurityRepository.countRecentSecurityEvents(null, {
      eventType: 'auth_login_success',
      since,
      emailAttempted: employeeEmail,
      ip: auditIp
    });
    assert(ownerSuccessEvents >= 1, 'Owner login did not write a PostgreSQL auth_login_success audit event.');
    assert(employeeSuccessEvents >= 1, 'Employee login did not write a PostgreSQL auth_login_success audit event.');
    report.dataChecks.push({ name: 'security_audit_log owner login success', ok: true, detail: `events=${ownerSuccessEvents}` });
    report.dataChecks.push({ name: 'security_audit_log employee login success', ok: true, detail: `events=${employeeSuccessEvents}` });

    report.validated.push('Le login HTTP `/api/auth/login` lit bien les identites employe et mots de passe depuis PostgreSQL quand `DB_DRIVER=postgres`.');
    report.validated.push('La resolution de session `/api/auth/me` et les verifications de permission ne repassent plus par un chemin SQLite pour les employes/auth.');
    report.validated.push('Le reset mot de passe `/api/auth/reset-password` met bien a jour PostgreSQL, puis le relogin fonctionne avec le nouveau mot de passe.');
    report.validated.push('Un endpoint protege hors auth (`/api/clients`) accepte une session employee/auth resolue depuis PostgreSQL.');
    report.validated.push('Les evenements `auth_login_success` continuent d etre traces dans PostgreSQL via `auth-security`.');

    report.remainingRisks.push('La session applicative reste stockee en memoire du process Node; elle n est pas encore externalisee ou partagee entre plusieurs instances.');
    report.remainingRisks.push('Les domaines `quotes`, `invoices`, `products`, `stock`, `movements` et `inventory` restent volontairement sur SQLite pour leurs donnees metier.');
    report.remainingRisks.push('Cette validation couvre le flux HTTP auth/session principal, pas encore des scenarios multi-instance, expiration persistante ou rotation de secret.');
    report.remainingRisks.push('Le backend reste hybride: `DB_DRIVER=postgres` route employees/auth, clients, salary et auth-security vers PostgreSQL, mais conserve SQLite pour le reste.');

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
      await query('DELETE FROM employees WHERE id IN ($1, $2)', [ownerId, employeeId]);
    } catch (cleanupError) {
      report.remainingRisks.push(`Cleanup warning: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
    }

    report.finishedAt = nowIso();
    report.artifacts = writeReport(report);
    console.log('[tranche2-auth-session-audit] JSON report:', report.artifacts.jsonLatestPath);
    console.log('[tranche2-auth-session-audit] Markdown report:', report.artifacts.markdownLatestPath);
    await closePostgresPool();
  }
}

main().catch((error) => {
  console.error('[tranche2-auth-session-audit] Validation failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
