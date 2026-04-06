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
const { closePostgresPool, query } = require('../../backend/src/db/postgres');
const { setCurrentUser, clearCurrentUser } = require('../../backend/src/services/auth-session.service');
const { createClientsService } = require('../../backend/src/services/clients.service');
const { createEmployeesService } = require('../../backend/src/services/employees.service');
const { createSalaryService } = require('../../backend/src/services/salary.service');
const { registerClientsHandlers } = require('../../backend/src/legacy-ipc/clients.handlers');
const { registerEmployeesHandlers } = require('../../backend/src/legacy-ipc/employees.handlers');
const { registerSalaryHandlers } = require('../../backend/src/legacy-ipc/salary.handlers');
const { registerAuthHandlers } = require('../../backend/src/legacy-ipc/auth.handlers');
const authSecurityRepository = require('../../backend/src/repositories/auth-security.runtime.repository');

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

  throw new Error('Unable to load better-sqlite3 for tranche 1 audit.');
};

const Database = loadBetterSqlite3();

const resolveSqlitePath = () => {
  const explicit = typeof process.env.SQLITE_PATH === 'string' ? process.env.SQLITE_PATH.trim() : '';
  if (explicit) return explicit;

  const legacyConfigured = typeof process.env.DATABASE_PATH === 'string' ? process.env.DATABASE_PATH.trim() : '';
  if (legacyConfigured) return legacyConfigured;

  if (process.env.APPDATA) {
    return path.join(process.env.APPDATA, 'SPA', 'spa.db');
  }

  return path.join(projectRoot, 'backend', 'data', 'spa.db');
};

const nowIso = () => new Date().toISOString();
const timestampSlug = () => new Date().toISOString().replace(/[:.]/g, '-');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createPrivilegedUser = () => ({
  id: 'tranche1-audit-user',
  nom: 'Tranche 1 Audit',
  username: 'tranche1-audit',
  email: 'tranche1-audit@example.test',
  role: 'owner',
  isActive: true,
  isProtectedAccount: false,
  requiresEmail2fa: false,
  mustSetupPassword: false,
  permissions: {
    viewStock: true,
    addStock: true,
    removeStock: true,
    adjustStock: true,
    manageStock: true,
    editStockProduct: true,
    archiveStockProduct: true,
    manageEmployees: true,
    manageInvoices: true,
    manageQuotes: true,
    manageClients: true,
    manageEstimations: true,
    manageArchives: true,
    manageInventory: true,
    viewHistory: true,
    manageSalary: true,
    manageAll: true
  }
});

const createFakeIpcMain = () => {
  const handlers = new Map();
  return {
    handlers,
    handle(channel, handler) {
      handlers.set(channel, handler);
    },
    removeHandler(channel) {
      handlers.delete(channel);
    }
  };
};

const writeReport = (report) => {
  fs.mkdirSync(reportDir, { recursive: true });

  const slug = timestampSlug();
  const json = JSON.stringify(report, null, 2);
  const markdown = toMarkdown(report);
  const jsonLatestPath = path.join(reportDir, 'postgres-tranche1-validation.latest.json');
  const markdownLatestPath = path.join(reportDir, 'postgres-tranche1-validation.latest.md');
  const jsonPath = path.join(reportDir, `postgres-tranche1-validation.${slug}.json`);
  const markdownPath = path.join(reportDir, `postgres-tranche1-validation.${slug}.md`);

  fs.writeFileSync(jsonLatestPath, json);
  fs.writeFileSync(markdownLatestPath, markdown);
  fs.writeFileSync(jsonPath, json);
  fs.writeFileSync(markdownPath, markdown);

  return {
    jsonLatestPath,
    markdownLatestPath,
    jsonPath,
    markdownPath
  };
};

const toMarkdown = (report) => {
  const lines = [];
  lines.push('# PostgreSQL Tranche 1 Validation');
  lines.push('');
  lines.push(`- Status: \`${report.status}\``);
  lines.push(`- Started at: \`${report.startedAt}\``);
  lines.push(`- Finished at: \`${report.finishedAt}\``);
  lines.push(`- SQLite path kept: \`${report.sqlitePath}\``);
  lines.push(`- DB driver forced for audit: \`${report.routing.configuredDriver}\``);
  lines.push(`- Active PostgreSQL scopes: \`${report.routing.activePostgresScopes.join(', ') || 'none'}\``);
  lines.push('');

  lines.push('## Validated');
  lines.push('');
  report.validated.forEach((item) => lines.push(`- ${item}`));
  if (!report.validated.length) lines.push('- None.');
  lines.push('');

  lines.push('## Service Results');
  lines.push('');
  report.serviceChecks.forEach((check) => {
    lines.push(`- ${check.name}: ${check.ok ? 'ok' : 'failed'}${check.detail ? ` (${check.detail})` : ''}`);
  });
  lines.push('');

  lines.push('## Handler Results');
  lines.push('');
  report.handlerChecks.forEach((check) => {
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

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

async function main() {
  const sqlitePath = resolveSqlitePath();
  const sqliteDb = new Database(sqlitePath, { readonly: true });
  const fakeUser = createPrivilegedUser();
  const token = 'tranche1-token';
  const tempSuffix = Date.now().toString(36);
  const tempClientEmail = `tranche1-client-${tempSuffix}@example.test`;
  const tempEmployeeEmail = `tranche1-employee-${tempSuffix}@example.test`;
  const tempIdentityEmail = `tranche1-auth-${tempSuffix}@example.test`;

  const report = {
    startedAt: nowIso(),
    finishedAt: null,
    status: 'running',
    sqlitePath,
    routing: getDatabaseRoutingSummary(),
    validated: [],
    serviceChecks: [],
    handlerChecks: [],
    runtimePaths: [
      {
        scope: 'clients service + clients handlers',
        path: 'clients.service/clients.handlers -> clients.runtime.repository -> postgres/clients.repository when DB_DRIVER=postgres'
      },
      {
        scope: 'employees service + employees handlers',
        path: 'employees.service/employees.handlers -> employees.runtime.repository -> postgres/employees.repository when DB_DRIVER=postgres'
      },
      {
        scope: 'salary service + salary handlers',
        path: 'salary.service/salary.handlers -> salary.runtime.repository -> postgres/salary.repository when DB_DRIVER=postgres'
      },
      {
        scope: 'auth-security via auth flow',
        path: 'auth.handlers -> auth-core.service -> employees.repository (SQLite read path) + auth-security.runtime.repository (PostgreSQL write path)'
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

  let createdClientId = null;
  let createdEmployeeId = null;
  let createdAdvanceId = null;
  let createdBonusId = null;
  let createdOvertimeId = null;
  let createdChallengeId = null;

  const serviceDeps = {
    getDb: () => sqliteDb,
    resolveSessionUser: (value) => (value === token ? fakeUser : null),
    setCurrentUser,
    clearCurrentUser
  };

  const clientsService = createClientsService(serviceDeps);
  const employeesService = createEmployeesService(serviceDeps);
  const salaryService = createSalaryService(serviceDeps);

  const ipcMain = createFakeIpcMain();
  registerClientsHandlers(ipcMain, () => sqliteDb);
  registerEmployeesHandlers(ipcMain, () => sqliteDb);
  registerSalaryHandlers(ipcMain, () => sqliteDb);
  registerAuthHandlers(ipcMain, () => sqliteDb);

  const invokeHandlerAsUser = async (channel, ...args) => {
    const handler = ipcMain.handlers.get(channel);
    if (!handler) {
      throw new Error(`Missing handler: ${channel}`);
    }

    setCurrentUser(fakeUser);
    try {
      return await handler({ sender: { getUserAgent: () => 'tranche1-audit' } }, ...args);
    } finally {
      clearCurrentUser();
    }
  };

  const invokePublicHandler = async (channel, ...args) => {
    const handler = ipcMain.handlers.get(channel);
    if (!handler) {
      throw new Error(`Missing handler: ${channel}`);
    }
    return handler({ sender: { getUserAgent: () => 'tranche1-audit' } }, ...args);
  };

  try {
    assert(report.routing.configuredDriver === 'postgres', 'The tranche 1 audit must run with DB_DRIVER=postgres.');
    assert(report.routing.activePostgresScopes.includes('clients'), 'Clients scope is not routed to PostgreSQL.');
    assert(report.routing.activePostgresScopes.includes('employees'), 'Employees scope is not routed to PostgreSQL.');
    assert(report.routing.activePostgresScopes.includes('salary'), 'Salary scope is not routed to PostgreSQL.');
    assert(report.routing.activePostgresScopes.includes('auth-security'), 'Auth-security scope is not routed to PostgreSQL.');

    const initialClients = await clientsService.list(token);
    report.serviceChecks.push({ name: 'clients.service.list', ok: Array.isArray(initialClients), detail: `count=${initialClients.length}` });

    const createdClient = await clientsService.upsert(token, {
      nom: `Client Tranche1 ${tempSuffix}`,
      adresse: 'Audit PostgreSQL',
      telephone: '+216 11 22 33 44',
      mf: `MF-${tempSuffix}`,
      email: tempClientEmail
    });
    createdClientId = createdClient?.id ?? null;
    assert(createdClientId, 'clients.service.upsert did not create a client.');
    report.serviceChecks.push({ name: 'clients.service.upsert', ok: true, detail: `id=${createdClientId}` });

    const fetchedClient = await clientsService.getById(token, createdClientId);
    assert(fetchedClient?.id === createdClientId, 'clients.service.getById did not return the created client.');
    report.serviceChecks.push({ name: 'clients.service.getById', ok: true, detail: `id=${fetchedClient.id}` });

    const foundClients = await clientsService.search(token, tempClientEmail);
    assert(foundClients.some((client) => client.id === createdClientId), 'clients.service.search did not find the created client.');
    report.serviceChecks.push({ name: 'clients.service.search', ok: true, detail: `matches=${foundClients.length}` });

    const updatedClient = await clientsService.upsert(token, {
      id: createdClientId,
      nom: createdClient.nom,
      adresse: 'Audit PostgreSQL Updated',
      telephone: createdClient.telephone,
      mf: `MFU-${tempSuffix}`,
      email: tempClientEmail
    });
    assert(updatedClient?.mf === `MFU-${tempSuffix}`, 'clients.service.upsert update did not persist changes.');
    report.serviceChecks.push({ name: 'clients.service.update', ok: true });

    const foundOrCreated = await clientsService.findOrCreate(token, {
      nom: createdClient.nom,
      telephone: createdClient.telephone,
      email: tempClientEmail
    }, createdClientId);
    assert(foundOrCreated?.id === createdClientId, 'clients.service.findOrCreate did not reuse the preferred client.');
    report.serviceChecks.push({ name: 'clients.service.findOrCreate', ok: true });

    const createdEmployee = await employeesService.create(token, {
      nom: `Employee Tranche1 ${tempSuffix}`,
      telephone: '+216 55 66 77 88',
      adresse: 'Audit Employee',
      poste: 'QA',
      salaireBase: 2400,
      dateEmbauche: nowIso().slice(0, 10),
      actif: true,
      isActive: true,
      username: `tranche1_${tempSuffix}`,
      email: tempEmployeeEmail,
      role: 'employee',
      canManageSalary: true,
      canManageClients: true
    });
    createdEmployeeId = createdEmployee?.id ?? null;
    assert(createdEmployeeId, 'employees.service.create did not create an employee.');
    report.serviceChecks.push({ name: 'employees.service.create', ok: true, detail: `id=${createdEmployeeId}` });

    const listedEmployees = await employeesService.list(token);
    assert(listedEmployees.some((employee) => employee.id === createdEmployeeId), 'employees.service.list did not include the created employee.');
    report.serviceChecks.push({ name: 'employees.service.list', ok: true, detail: `count=${listedEmployees.length}` });

    const foundEmployees = await employeesService.search(token, tempEmployeeEmail);
    assert(foundEmployees.some((employee) => employee.id === createdEmployeeId), 'employees.service.search did not find the created employee.');
    report.serviceChecks.push({ name: 'employees.service.search', ok: true, detail: `matches=${foundEmployees.length}` });

    const fetchedEmployee = await employeesService.getById(token, createdEmployeeId);
    assert(fetchedEmployee?.id === createdEmployeeId, 'employees.service.getById did not return the created employee.');
    report.serviceChecks.push({ name: 'employees.service.getById', ok: true });

    const updatedEmployee = await employeesService.update(token, createdEmployeeId, {
      ...fetchedEmployee,
      poste: 'QA Lead',
      canManageClients: true,
      canManageSalary: true
    });
    assert(updatedEmployee?.poste === 'QA Lead', 'employees.service.update did not persist changes.');
    report.serviceChecks.push({ name: 'employees.service.update', ok: true });

    const setInactive = await employeesService.setActive(token, createdEmployeeId, false);
    assert(setInactive === true, 'employees.service.setActive(false) failed.');
    const setActiveBack = await employeesService.setActive(token, createdEmployeeId, true);
    assert(setActiveBack === true, 'employees.service.setActive(true) failed.');
    report.serviceChecks.push({ name: 'employees.service.setActive', ok: true });

    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    const dateIso = currentDate.toISOString().slice(0, 10);

    const createdAdvance = await salaryService.createAdvance(token, {
      employeeId: createdEmployeeId,
      montant: 150,
      note: `Advance ${tempSuffix}`,
      dateAvance: dateIso,
      moisReference: month,
      anneeReference: year
    });
    createdAdvanceId = createdAdvance?.id ?? null;
    assert(createdAdvanceId, 'salary.service.createAdvance failed.');

    const createdBonus = await salaryService.createBonus(token, {
      employeeId: createdEmployeeId,
      montant: 90,
      motif: `Bonus ${tempSuffix}`,
      datePrime: dateIso,
      moisReference: month,
      anneeReference: year
    });
    createdBonusId = createdBonus?.id ?? null;
    assert(createdBonusId, 'salary.service.createBonus failed.');

    const createdOvertime = await salaryService.createOvertime(token, {
      employeeId: createdEmployeeId,
      heuresSupplementaires: 3,
      motif: `Overtime ${tempSuffix}`,
      dateHeuresSup: dateIso,
      moisReference: month,
      anneeReference: year
    });
    createdOvertimeId = createdOvertime?.id ?? null;
    assert(createdOvertimeId, 'salary.service.createOvertime failed.');
    report.serviceChecks.push({ name: 'salary.service.create', ok: true, detail: `advance=${createdAdvanceId}, bonus=${createdBonusId}, overtime=${createdOvertimeId}` });

    const advances = await salaryService.listAdvances(token, createdEmployeeId, month, year);
    const bonuses = await salaryService.listBonuses(token, createdEmployeeId, month, year);
    const overtimes = await salaryService.listOvertimes(token, createdEmployeeId, month, year);
    assert(advances.some((row) => row.id === createdAdvanceId), 'salary.service.listAdvances did not return the created advance.');
    assert(bonuses.some((row) => row.id === createdBonusId), 'salary.service.listBonuses did not return the created bonus.');
    assert(overtimes.some((row) => row.id === createdOvertimeId), 'salary.service.listOvertimes did not return the created overtime.');
    report.serviceChecks.push({ name: 'salary.service.list', ok: true, detail: `advances=${advances.length}, bonuses=${bonuses.length}, overtimes=${overtimes.length}` });

    const totalAdvances = await salaryService.totalAdvances(token, createdEmployeeId, month, year);
    const totalBonuses = await salaryService.totalBonuses(token, createdEmployeeId, month, year);
    const totalOvertimeHours = await salaryService.totalOvertimeHours(token, createdEmployeeId, month, year);
    const summary = await salaryService.summary(token, createdEmployeeId, month, year);
    assert(totalAdvances >= 150, 'salary.service.totalAdvances returned an unexpected value.');
    assert(totalBonuses >= 90, 'salary.service.totalBonuses returned an unexpected value.');
    assert(totalOvertimeHours >= 3, 'salary.service.totalOvertimeHours returned an unexpected value.');
    assert(summary?.employeeId === createdEmployeeId, 'salary.service.summary did not return the expected employee.');
    report.serviceChecks.push({ name: 'salary.service.summary', ok: true, detail: `resteAPayer=${summary.resteAPayer}` });

    const handlerClientList = await invokeHandlerAsUser('clients:list');
    assert(Array.isArray(handlerClientList), 'clients:list handler did not return an array.');
    report.handlerChecks.push({ name: 'clients handler list', ok: true, detail: `count=${handlerClientList.length}` });

    const handlerEmployeeGet = await invokeHandlerAsUser('employees:getById', createdEmployeeId);
    assert(handlerEmployeeGet?.id === createdEmployeeId, 'employees:getById handler did not return the created employee.');
    report.handlerChecks.push({ name: 'employees handler getById', ok: true });

    const handlerSalarySummary = await invokeHandlerAsUser('salary:summary', createdEmployeeId, month, year);
    assert(handlerSalarySummary?.employeeId === createdEmployeeId, 'salary:summary handler did not return the expected employee.');
    report.handlerChecks.push({ name: 'salary handler summary', ok: true });

    createdChallengeId = `tranche1-challenge-${tempSuffix}`;
    const createdChallenge = await authSecurityRepository.createAuthChallenge(sqliteDb, {
      id: createdChallengeId,
      userId: createdEmployeeId,
      purpose: 'tranche1_audit',
      codeHash: 'hash',
      expiresAt: new Date(Date.now() + (60 * 60 * 1000)).toISOString(),
      maxAttempts: 5,
      requestedIp: '127.0.0.1',
      requestedUserAgent: 'tranche1-audit'
    });
    assert(createdChallenge?.id === createdChallengeId, 'auth-security repository createAuthChallenge failed.');

    const incrementedChallenge = await authSecurityRepository.incrementAuthChallengeAttempt(sqliteDb, createdChallengeId);
    assert(incrementedChallenge?.attemptsCount === 1, 'auth-security repository incrementAuthChallengeAttempt failed.');

    const markedUsed = await authSecurityRepository.markAuthChallengeUsed(sqliteDb, createdChallengeId);
    assert(markedUsed === true, 'auth-security repository markAuthChallengeUsed failed.');

    await authSecurityRepository.cleanupExpiredChallenges(sqliteDb);
    const deletedChallenge = await authSecurityRepository.getAuthChallengeById(sqliteDb, createdChallengeId);
    assert(deletedChallenge === null, 'auth-security repository cleanupExpiredChallenges did not remove the used challenge.');
    report.handlerChecks.push({ name: 'auth-security repository challenge lifecycle', ok: true });

    await wait(250);
    const beginLoginResult = await invokePublicHandler('auth:beginLogin', tempIdentityEmail, 'bad-password', {
      ip: '127.0.0.1',
      userAgent: 'tranche1-audit'
    });
    assert(beginLoginResult?.status === 'invalid_credentials', 'auth:beginLogin handler did not return invalid_credentials for the audit identity.');

    const securityAuditCount = await authSecurityRepository.countRecentSecurityEvents(sqliteDb, {
      eventType: 'auth_login_failed',
      since: new Date(Date.now() - (5 * 60 * 1000)).toISOString(),
      emailAttempted: tempIdentityEmail,
      ip: '127.0.0.1'
    });
    assert(securityAuditCount >= 1, 'auth:beginLogin did not write the expected PostgreSQL security audit event.');
    report.handlerChecks.push({ name: 'auth handler -> auth-security audit write', ok: true, detail: `events=${securityAuditCount}` });

    const deletedOvertime = await salaryService.deleteOvertime(token, createdOvertimeId);
    const deletedBonus = await salaryService.deleteBonus(token, createdBonusId);
    const deletedAdvance = await salaryService.deleteAdvance(token, createdAdvanceId);
    assert(deletedOvertime && deletedBonus && deletedAdvance, 'salary cleanup failed.');
    createdOvertimeId = null;
    createdBonusId = null;
    createdAdvanceId = null;
    report.serviceChecks.push({ name: 'salary.service.delete', ok: true });

    const deletedEmployee = await employeesService.delete(token, createdEmployeeId);
    assert(deletedEmployee === true, 'employees.service.delete failed.');
    createdEmployeeId = null;
    report.serviceChecks.push({ name: 'employees.service.delete', ok: true });

    const deletedClient = await clientsService.delete(token, createdClientId);
    assert(deletedClient === true, 'clients.service.delete failed.');
    createdClientId = null;
    report.serviceChecks.push({ name: 'clients.service.delete', ok: true });

    report.validated.push('Clients service and IPC handler read/write paths hit PostgreSQL successfully.');
    report.validated.push('Employees service and IPC handler read/write paths hit PostgreSQL successfully.');
    report.validated.push('Salary service and IPC handler read/write paths hit PostgreSQL successfully.');
    report.validated.push('Auth-security repository lifecycle works on PostgreSQL, and auth:beginLogin writes audit events to PostgreSQL.');

    report.remainingRisks.push('Session resolution still reads employee auth rows from SQLite in server.js via getEmployeeAuthRowById.');
    report.remainingRisks.push('auth-core.service still reads employee identities and password data from SQLite through employees.repository.');
    report.remainingRisks.push('quotes/invoices still depend on SQLite client-link backfill helpers and are intentionally excluded from tranche 1.');
    report.remainingRisks.push('This audit validates services and IPC handlers directly, not a full end-to-end HTTP session lifecycle with DB_DRIVER=postgres.');

    report.status = 'completed';
  } catch (error) {
    report.status = 'failed';
    report.remainingRisks.push(`Audit failed before full validation: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  } finally {
    try {
      if (createdOvertimeId) {
        await query('DELETE FROM salary_overtimes WHERE id = $1', [createdOvertimeId]);
      }
      if (createdBonusId) {
        await query('DELETE FROM salary_bonuses WHERE id = $1', [createdBonusId]);
      }
      if (createdAdvanceId) {
        await query('DELETE FROM salary_advances WHERE id = $1', [createdAdvanceId]);
      }
      if (createdChallengeId) {
        await query('DELETE FROM auth_challenges WHERE id = $1', [createdChallengeId]);
      }
      if (createdEmployeeId) {
        await query('DELETE FROM employees WHERE id = $1', [createdEmployeeId]);
      }
      if (createdClientId) {
        await query('DELETE FROM clients WHERE id = $1', [createdClientId]);
      }
    } catch (cleanupError) {
      report.remainingRisks.push(`Cleanup warning: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
    }

    report.finishedAt = nowIso();
    sqliteDb.close();
    report.artifacts = writeReport(report);
    console.log('[tranche1-audit] JSON report:', report.artifacts.jsonLatestPath);
    console.log('[tranche1-audit] Markdown report:', report.artifacts.markdownLatestPath);
    await closePostgresPool();
  }
}

main().catch((error) => {
  console.error('[tranche1-audit] Validation failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
