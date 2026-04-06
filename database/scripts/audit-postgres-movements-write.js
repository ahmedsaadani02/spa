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
process.env.DB_ENABLE_POSTGRES_PRODUCT_WRITES = '1';
process.env.DB_ENABLE_POSTGRES_STOCK_WRITES = '1';

const { randomUUID } = require('crypto');
const { getDatabaseRoutingSummary } = require('../../backend/src/config/database');
const { startServer, stopServer } = require('../../backend/server');
const { query, closePostgresPool } = require('../../backend/src/db/postgres');
const { hashPassword } = require('../../backend/src/services/auth-core.service');
const { createProduct: createProductSqlite } = require('../../backend/src/repositories/sqlite/product-write.repository');
const { listMovements: listMovementsSqlite } = require('../../backend/src/repositories/sqlite/movements-read.repository');
const { addMovement: addMovementSqlite } = require('../../backend/src/repositories/sqlite/movements-write.repository');

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

  throw new Error('Unable to load better-sqlite3 for movements:add audit.');
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

const roundNumber = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Number(parsed.toFixed(6));
};

const normalizeTimestamp = (value) => {
  if (!value) return null;
  return new Date(value).toISOString();
};

const normalizeStockRows = (rows) => rows
  .map((row) => ({
    color: row.color,
    qty: roundNumber(row.qty)
  }))
  .sort((a, b) => a.color.localeCompare(b.color));

const normalizeVariantRows = (rows) => rows
  .map((row) => ({
    color: row.color,
    price: roundNumber(row.price),
    stock: roundNumber(row.stock)
  }))
  .sort((a, b) => a.color.localeCompare(b.color));

const normalizeMovement = (row) => ({
  id: row.id,
  itemId: row.itemId,
  reference: row.reference ?? null,
  label: row.label ?? null,
  category: row.category ?? null,
  serie: row.serie ?? null,
  color: row.color,
  type: row.type,
  delta: roundNumber(row.delta),
  before: roundNumber(row.before),
  after: roundNumber(row.after),
  reason: row.reason ?? '',
  actor: row.actor ?? null,
  employeeId: row.employeeId ?? null,
  username: row.username ?? null,
  at: row.at ? new Date(row.at).toISOString() : null
});

const getSqliteState = (db, productId, movementId) => {
  const product = db.prepare(`
    SELECT reference, label, price_ttc, last_updated
    FROM products
    WHERE id = ?
    LIMIT 1
  `).get(productId);
  const stockRows = db.prepare(`
    SELECT color, qty
    FROM stock
    WHERE product_id = ?
    ORDER BY color
  `).all(productId);
  const variantRows = db.prepare(`
    SELECT color, price, stock
    FROM product_variants
    WHERE product_id = ?
    ORDER BY color
  `).all(productId);
  const movement = listMovementsSqlite(db).find((row) => row.id === movementId) ?? null;

  return {
    product: {
      reference: product?.reference ?? null,
      label: product?.label ?? null,
      priceTtc: product ? roundNumber(product.price_ttc) : null,
      lastUpdated: normalizeTimestamp(product?.last_updated)
    },
    stockRows: normalizeStockRows(stockRows),
    variantRows: normalizeVariantRows(variantRows),
    movement: movement ? normalizeMovement(movement) : null
  };
};

const getPostgresState = async (productId, movementId) => {
  const productResult = await query(
    `
      SELECT reference, label, price_ttc, last_updated
      FROM products
      WHERE id = $1
      LIMIT 1
    `,
    [productId]
  );
  const stockRowsResult = await query(
    `
      SELECT color, qty
      FROM stock
      WHERE product_id = $1
      ORDER BY color
    `,
    [productId]
  );
  const variantRowsResult = await query(
    `
      SELECT color, price, stock
      FROM product_variants
      WHERE product_id = $1
      ORDER BY color
    `,
    [productId]
  );
  const movementResult = await query(
    `
      SELECT
        id,
        product_id AS "itemId",
        reference,
        label,
        category,
        serie,
        color,
        type,
        delta,
        before,
        after,
        reason,
        COALESCE(employee_name, actor) AS actor,
        employee_id AS "employeeId",
        username,
        at
      FROM movements
      WHERE id = $1
      LIMIT 1
    `,
    [movementId]
  );

  const product = productResult.rows[0] ?? null;
  const movement = movementResult.rows[0] ?? null;

  return {
    product: {
      reference: product?.reference ?? null,
      label: product?.label ?? null,
      priceTtc: product ? roundNumber(product.price_ttc) : null,
      lastUpdated: normalizeTimestamp(product?.last_updated)
    },
    stockRows: normalizeStockRows(stockRowsResult.rows),
    variantRows: normalizeVariantRows(variantRowsResult.rows),
    movement: movement ? normalizeMovement(movement) : null
  };
};

const normalizeResponseBody = async (response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch (_error) {
    return text;
  }
};

const writeReport = (report) => {
  fs.mkdirSync(reportDir, { recursive: true });

  const slug = timestampSlug();
  const jsonLatestPath = path.join(reportDir, 'postgres-movements-write.latest.json');
  const markdownLatestPath = path.join(reportDir, 'postgres-movements-write.latest.md');
  const jsonPath = path.join(reportDir, `postgres-movements-write.${slug}.json`);
  const markdownPath = path.join(reportDir, `postgres-movements-write.${slug}.md`);
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
  lines.push('# PostgreSQL Movements Add Validation');
  lines.push('');
  lines.push(`- Status: \`${report.status}\``);
  lines.push(`- Started at: \`${report.startedAt}\``);
  lines.push(`- Finished at: \`${report.finishedAt}\``);
  lines.push(`- SQLite path kept: \`${report.sqlitePath}\``);
  lines.push(`- DB driver forced for audit: \`${report.routing.configuredDriver}\``);
  lines.push(`- Catalog read opt-in: \`${report.routing.catalogReadOptInEnabled}\``);
  lines.push(`- Product write opt-in: \`${report.routing.productWriteOptInEnabled}\``);
  lines.push(`- Stock write opt-in: \`${report.routing.stockWriteOptInEnabled}\``);
  lines.push(`- Active PostgreSQL scopes: \`${report.routing.activePostgresScopes.join(', ') || 'none'}\``);
  lines.push(`- Base URL: \`${report.baseUrl ?? 'n/a'}\``);
  lines.push('');
  lines.push('## Write Cartography');
  lines.push('');
  report.writeCartography.forEach((item) => lines.push(`- ${item}`));
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
  lines.push('## Side Effects');
  lines.push('');
  report.sideEffects.forEach((item) => lines.push(`- ${item.name}: ${item.ok ? 'ok' : 'failed'}${item.detail ? ` (${item.detail})` : ''}`));
  lines.push('');
  lines.push('## SQLite Isolation Checks');
  lines.push('');
  report.sqliteIsolationChecks.forEach((item) => lines.push(`- ${item.name}: ${item.ok ? 'ok' : 'failed'}${item.detail ? ` (${item.detail})` : ''}`));
  lines.push('');
  lines.push('## Remaining Risks');
  lines.push('');
  report.remainingRisks.forEach((item) => lines.push(`- ${item}`));
  if (!report.remainingRisks.length) lines.push('- None identified.');
  lines.push('');
  return `${lines.join('\n')}\n`;
};

async function main() {
  const sqlitePath = resolveSqlitePath();
  const realSqliteDb = new Database(sqlitePath, { readonly: true });
  const tempSqlitePath = path.join(reportDir, `tmp-movements-write-${Date.now()}.db`);
  fs.mkdirSync(reportDir, { recursive: true });
  fs.copyFileSync(sqlitePath, tempSqlitePath);
  const tempSqliteDb = new Database(tempSqlitePath);

  const suffix = Date.now().toString(36);
  const ownerId = `movements-write-owner-${suffix}`;
  const ownerUsername = `movements_write_owner_${suffix}`;
  const ownerEmail = `movements-write-owner-${suffix}@example.test`;
  const ownerPassword = 'OwnerAudit#2026!';
  const reference = `PG-MOVE-${suffix.slice(-8).toUpperCase()}`;
  const category = `pg-audit-movements-category-${suffix}`;
  const serie = `pg-audit-movements-serie-${suffix}`;
  const colorA = `pg-audit-movements-color-a-${suffix}`;
  const colorB = `pg-audit-movements-color-b-${suffix}`;
  const metadataValues = [category, serie, colorA, colorB];
  const movementId = randomUUID();
  const movementAt = nowIso();

  const report = {
    startedAt: nowIso(),
    finishedAt: null,
    status: 'running',
    sqlitePath,
    baseUrl: null,
    routing: getDatabaseRoutingSummary(),
    writeCartography: [
      '`movements:add` ajoute uniquement une ligne dans `movements`.',
      '`movements:add` ne modifie pas `stock`, ne modifie pas `product_variants` et ne met pas a jour `products.last_updated`.',
      'Cette sous-etape ecrit l historique seul; la mutation combinee `stock:applyMovement` reste hors scope.'
    ],
    validated: [],
    httpChecks: [],
    parityChecks: [],
    sideEffects: [],
    sqliteIsolationChecks: [],
    remainingRisks: [],
    artifacts: null
  };

  let server;
  let actualProductId = null;

  const createPayload = {
    reference,
    label: 'PG Audit Movements Add Product',
    description: 'movements add audit',
    category,
    serie,
    unit: 'piece',
    colors: [colorA, colorB],
    lowStockThreshold: 2,
    priceTtc: 12.5
  };

  const movementPayload = {
    id: movementId,
    itemId: null,
    reference,
    label: createPayload.label,
    category,
    serie,
    color: colorA,
    type: 'IN',
    delta: 4,
    before: 1,
    after: 5,
    reason: 'manual-audit',
    at: movementAt
  };

  const request = async (baseUrl, route, options = {}) => {
    const response = await fetch(`${baseUrl}${route}`, options);
    const body = await normalizeResponseBody(response);
    return { response, body };
  };

  const cleanup = async () => {
    await query('DELETE FROM products WHERE id = $1', [actualProductId || '']);
    await query('DELETE FROM products WHERE reference = $1', [reference]);
    await query('DELETE FROM product_catalog_metadata WHERE value = ANY($1::text[])', [metadataValues]);
    await query('DELETE FROM employees WHERE id = $1', [ownerId]);
  };

  try {
    assert(report.routing.configuredDriver === 'postgres', 'The movements:add audit must run with DB_DRIVER=postgres.');
    assert(report.routing.catalogReadOptInEnabled === true, 'The movements:add audit requires DB_ENABLE_POSTGRES_CATALOG_READ=1.');
    assert(report.routing.productWriteOptInEnabled === true, 'The movements:add audit requires DB_ENABLE_POSTGRES_PRODUCT_WRITES=1.');
    assert(report.routing.stockWriteOptInEnabled === true, 'The movements:add audit requires DB_ENABLE_POSTGRES_STOCK_WRITES=1.');
    assert(report.routing.activePostgresScopes.includes('movements-read'), 'movements-read scope must be enabled during this audit.');
    assert(report.routing.activePostgresScopes.includes('movements-write'), 'movements-write scope is not routed to PostgreSQL.');

    await cleanup();

    const sqliteUser = {
      id: ownerId,
      nom: 'Movements Write Audit',
      username: ownerUsername
    };

    const expectedCreateResult = createProductSqlite(tempSqliteDb, createPayload);
    assert(expectedCreateResult.ok === true && expectedCreateResult.id, 'SQLite create reference execution failed for movements:add audit.');
    movementPayload.itemId = expectedCreateResult.id;
    const expectedBefore = getSqliteState(tempSqliteDb, expectedCreateResult.id, movementId);
    assert(addMovementSqlite(tempSqliteDb, movementPayload, sqliteUser) === true, 'SQLite movements:add reference execution failed.');
    const expectedAfter = getSqliteState(tempSqliteDb, expectedCreateResult.id, movementId);

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
      [ownerId, sqliteUser.nom, ownerUsername, ownerEmail, hashPassword(ownerPassword), nowIso()]
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
        'user-agent': 'movements-write-audit'
      },
      body: JSON.stringify({
        identity: ownerUsername,
        password: ownerPassword
      })
    });
    assert(loginResult.response.ok, `Audit login HTTP status was ${loginResult.response.status}.`);
    assert(loginResult.body?.result?.status === 'success', 'Audit login did not return status=success.');
    const token = loginResult.body?.result?.token;
    assert(typeof token === 'string' && token.length > 0, 'Audit login did not return a session token.');
    report.httpChecks.push({ name: 'POST /api/auth/login', ok: true, detail: 'owner audit session created' });

    const authHeaders = {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'user-agent': 'movements-write-audit'
    };

    const createResponse = await request(report.baseUrl, '/api/products', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(createPayload)
    });
    assert(createResponse.response.ok, `POST /api/products HTTP status was ${createResponse.response.status}.`);
    assert(createResponse.body?.result?.ok === true, 'POST /api/products did not return ok=true.');
    actualProductId = createResponse.body?.result?.id;
    assert(typeof actualProductId === 'string' && actualProductId.length > 0, 'POST /api/products did not return a product id.');
    report.httpChecks.push({ name: 'POST /api/products', ok: true, detail: `id=${actualProductId}` });

    movementPayload.itemId = actualProductId;
    const actualBefore = await getPostgresState(actualProductId, movementId);

    const addMovementResponse = await request(report.baseUrl, '/api/movements', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(movementPayload)
    });
    assert(addMovementResponse.response.ok, `POST /api/movements HTTP status was ${addMovementResponse.response.status}.`);
    assert(addMovementResponse.body?.result === true, 'POST /api/movements did not return result=true.');
    report.httpChecks.push({ name: 'POST /api/movements', ok: true, detail: `id=${movementId}` });

    const actualAfter = await getPostgresState(actualProductId, movementId);
    assert(JSON.stringify(actualAfter.movement) === JSON.stringify({
      ...expectedAfter.movement,
      itemId: actualProductId
    }), 'PostgreSQL movements:add row does not match SQLite parity.');
    report.parityChecks.push({ name: 'movements parity', ok: true, detail: `id=${movementId}` });
    assert(JSON.stringify(actualAfter.stockRows) === JSON.stringify(expectedAfter.stockRows), 'PostgreSQL stock rows changed after movements:add but should stay identical to SQLite parity.');
    report.parityChecks.push({ name: 'stock unchanged parity', ok: true, detail: `rows=${actualAfter.stockRows.length}` });
    assert(JSON.stringify(actualAfter.variantRows) === JSON.stringify(expectedAfter.variantRows), 'PostgreSQL product_variants changed after movements:add but should stay identical to SQLite parity.');
    report.parityChecks.push({ name: 'product_variants unchanged parity', ok: true, detail: `rows=${actualAfter.variantRows.length}` });
    assert(actualAfter.product.reference === expectedAfter.product.reference, 'PostgreSQL product reference after movements:add does not match SQLite parity.');
    assert(actualAfter.product.label === expectedAfter.product.label, 'PostgreSQL product label after movements:add does not match SQLite parity.');
    assert(actualAfter.product.priceTtc === expectedAfter.product.priceTtc, 'PostgreSQL product price_ttc after movements:add does not match SQLite parity.');
    report.parityChecks.push({ name: 'product semantic parity', ok: true, detail: `priceTtc=${expectedAfter.product.priceTtc}` });

    const movementsResponse = await request(report.baseUrl, '/api/movements', {
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'movements-write-audit'
      }
    });
    assert(movementsResponse.response.ok, `GET /api/movements HTTP status was ${movementsResponse.response.status}.`);
    const movementRow = (movementsResponse.body?.result ?? []).find((row) => row?.id === movementId);
    assert(!!movementRow, 'GET /api/movements did not return the inserted movement.');
    const normalizedHttpMovement = normalizeMovement(movementRow);
    assert(JSON.stringify(normalizedHttpMovement) === JSON.stringify({
      ...expectedAfter.movement,
      itemId: actualProductId
    }), 'GET /api/movements returned a row that does not match SQLite parity.');
    report.httpChecks.push({ name: 'GET /api/movements after add', ok: true, detail: `id=${movementId}` });

    assert(JSON.stringify(actualBefore.stockRows) === JSON.stringify(actualAfter.stockRows), 'movements:add should not change stock rows.');
    report.sideEffects.push({ name: 'stock untouched', ok: true, detail: `rows=${actualAfter.stockRows.length}` });
    assert(JSON.stringify(actualBefore.variantRows) === JSON.stringify(actualAfter.variantRows), 'movements:add should not change product_variants.');
    report.sideEffects.push({ name: 'product_variants untouched', ok: true, detail: `rows=${actualAfter.variantRows.length}` });
    assert(actualBefore.product.lastUpdated === actualAfter.product.lastUpdated, 'movements:add should not update products.last_updated.');
    report.sideEffects.push({ name: 'products.last_updated untouched', ok: true, detail: 'unchanged' });
    assert(actualBefore.movement === null && actualAfter.movement !== null, 'movements:add should only create the historical row.');
    report.sideEffects.push({ name: 'movements inserted', ok: true, detail: `id=${movementId}` });

    const realSqliteProductRow = realSqliteDb.prepare('SELECT id FROM products WHERE reference = ? LIMIT 1').get(reference);
    assert(!realSqliteProductRow, 'Real SQLite products table should remain unchanged during PostgreSQL movements:add audit.');
    report.sqliteIsolationChecks.push({ name: 'products unchanged in SQLite', ok: true, detail: `reference=${reference}` });

    const realSqliteMetadataCount = realSqliteDb.prepare(`
      SELECT COUNT(*) AS total
      FROM product_catalog_metadata
      WHERE value IN (?, ?, ?, ?)
    `).get(...metadataValues);
    assert(Number(realSqliteMetadataCount?.total ?? 0) === 0, 'Real SQLite metadata should remain unchanged during PostgreSQL movements:add audit.');
    report.sqliteIsolationChecks.push({ name: 'metadata unchanged in SQLite', ok: true, detail: `values=${metadataValues.length}` });

    report.validated.push('`movements:add` est compatible PostgreSQL pour l insertion d une ligne d historique `movements`, avec parite validee contre une execution de reference SQLite.');
    report.validated.push('`movements:add` ne modifie ni `stock`, ni `product_variants`, ni `products.last_updated`, conformement au comportement SQLite actuel.');
    report.validated.push('Cette sous-etape reste audit-only et exige `DB_DRIVER=postgres`, `DB_ENABLE_POSTGRES_CATALOG_READ=1`, `DB_ENABLE_POSTGRES_PRODUCT_WRITES=1` et `DB_ENABLE_POSTGRES_STOCK_WRITES=1`.');
    report.remainingRisks.push('`stock:applyMovement` reste sur SQLite; la mutation combinee stock + historique n est donc pas encore coherente sur PostgreSQL.');
    report.remainingRisks.push('Le domaine catalogue/stock ne doit toujours pas etre active en PostgreSQL en usage normal tant que `stock:applyMovement` n est pas valide.');

    report.status = 'completed';
  } catch (error) {
    report.status = 'failed';
    report.remainingRisks.push(error instanceof Error ? error.message : String(error));
    console.error('[audit-postgres-movements-write] failed', error);
    process.exitCode = 1;
  } finally {
    report.finishedAt = nowIso();

    try {
      if (server) {
        stopServer();
      }
    } catch (_error) {
      // Ignore stop errors during audit teardown.
    }

    try {
      await cleanup();
    } catch (cleanupError) {
      report.remainingRisks.push(`Cleanup warning: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
    }

    try {
      realSqliteDb.close();
    } catch (_error) {
      // Ignore close errors during teardown.
    }

    try {
      tempSqliteDb.close();
    } catch (_error) {
      // Ignore close errors during teardown.
    }

    try {
      if (fs.existsSync(tempSqlitePath)) {
        fs.unlinkSync(tempSqlitePath);
      }
    } catch (_error) {
      // Ignore temp cleanup errors during teardown.
    }

    try {
      await closePostgresPool();
    } catch (_error) {
      // Ignore pool close errors during teardown.
    }

    writeReport(report);
  }
}

main();
