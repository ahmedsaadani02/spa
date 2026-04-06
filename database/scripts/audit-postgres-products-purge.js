#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

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

const { getDatabaseRoutingSummary } = require('../../backend/src/config/database');
const { startServer, stopServer } = require('../../backend/server');
const { query, closePostgresPool } = require('../../backend/src/db/postgres');
const { hashPassword } = require('../../backend/src/services/auth-core.service');
const {
  createProduct: createProductSqlite,
  archiveProduct: archiveProductSqlite,
  purgeProduct: purgeProductSqlite,
  updateVariantPriceWithHistory: updateVariantPriceWithHistorySqlite
} = require('../../backend/src/repositories/sqlite/product-write.repository');
const { listMovements: listMovementsSqlite } = require('../../backend/src/repositories/sqlite/movements-read.repository');

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

  throw new Error('Unable to load better-sqlite3 for products purge audit.');
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

const normalizeMovement = (row) => ({
  color: row.color,
  type: row.type,
  delta: roundNumber(row.delta),
  before: roundNumber(row.before),
  after: roundNumber(row.after),
  reason: row.reason ?? '',
  actor: row.actor ?? null,
  username: row.username ?? null
});

const getSqliteMovementColumns = (db) => {
  const hasTable = db.prepare(`
    SELECT 1
    FROM sqlite_master
    WHERE type = 'table' AND name = ?
    LIMIT 1
  `).get('movements');
  if (!hasTable) return new Set();
  return new Set(db.prepare('PRAGMA table_info(movements)').all().map((column) => column.name));
};

const insertSqliteMovement = (db, movement) => {
  const columnSet = getSqliteMovementColumns(db);
  const payload = {
    id: movement.id,
    product_id: movement.productId,
    reference: movement.reference,
    label: movement.label,
    category: movement.category,
    serie: movement.serie,
    color: movement.color,
    type: movement.type,
    delta: movement.delta,
    before: movement.before,
    after: movement.after,
    reason: movement.reason,
    actor: movement.actor,
    at: movement.at
  };

  const columns = ['id', 'product_id', 'reference', 'label', 'category', 'serie', 'color', 'type', 'delta', 'before', 'after', 'reason', 'actor', 'at'];

  if (columnSet.has('employee_id')) {
    payload.employee_id = movement.employeeId;
    columns.push('employee_id');
  }
  if (columnSet.has('employee_name')) {
    payload.employee_name = movement.employeeName;
    columns.push('employee_name');
  }
  if (columnSet.has('username')) {
    payload.username = movement.username;
    columns.push('username');
  }

  const sql = `
    INSERT INTO movements (${columns.join(', ')})
    VALUES (${columns.map((column) => `@${column}`).join(', ')})
  `;
  db.prepare(sql).run(payload);
};

const getSqliteState = (db, productId, metadataValues) => {
  const product = db.prepare(`
    SELECT reference, label, is_archived, is_deleted, archived_at, deleted_at
    FROM products
    WHERE id = ?
    LIMIT 1
  `).get(productId);
  const stockCount = db.prepare('SELECT COUNT(*) AS total FROM stock WHERE product_id = ?').get(productId);
  const variantCount = db.prepare('SELECT COUNT(*) AS total FROM product_variants WHERE product_id = ?').get(productId);
  const priceHistoryCount = db.prepare('SELECT COUNT(*) AS total FROM price_history WHERE product_id = ?').get(productId);
  const metadataRows = db.prepare(`
    SELECT kind, value
    FROM product_catalog_metadata
    WHERE value IN (${metadataValues.map(() => '?').join(', ')})
    ORDER BY kind, value
  `).all(...metadataValues);
  const movements = listMovementsSqlite(db)
    .filter((row) => row.itemId === productId)
    .map(normalizeMovement);

  return {
    product: {
      reference: product?.reference ?? null,
      label: product?.label ?? null,
      isArchived: Number(product?.is_archived ?? 0) === 1,
      isDeleted: Number(product?.is_deleted ?? 0) === 1,
      archivedAtPresent: !!product?.archived_at,
      deletedAtPresent: !!product?.deleted_at
    },
    stockCount: Number(stockCount?.total ?? 0),
    variantCount: Number(variantCount?.total ?? 0),
    priceHistoryCount: Number(priceHistoryCount?.total ?? 0),
    metadataRows: metadataRows.map((row) => `${row.kind}:${row.value}`),
    movements
  };
};

const getPostgresState = async (productId, metadataValues) => {
  const productResult = await query(
    `
      SELECT reference, label, is_archived, is_deleted, archived_at, deleted_at
      FROM products
      WHERE id = $1
      LIMIT 1
    `,
    [productId]
  );
  const stockCount = await query('SELECT COUNT(*)::int AS total FROM stock WHERE product_id = $1', [productId]);
  const variantCount = await query('SELECT COUNT(*)::int AS total FROM product_variants WHERE product_id = $1', [productId]);
  const priceHistoryCount = await query('SELECT COUNT(*)::int AS total FROM price_history WHERE product_id = $1', [productId]);
  const metadataRows = await query(
    `
      SELECT kind, value
      FROM product_catalog_metadata
      WHERE value = ANY($1::text[])
      ORDER BY kind, value
    `,
    [metadataValues]
  );
  const movements = await query(
    `
      SELECT color, type, delta, before, after, reason, COALESCE(employee_name, actor) AS actor, username
      FROM movements
      WHERE product_id = $1
      ORDER BY at DESC, id DESC
    `,
    [productId]
  );

  const product = productResult.rows[0] ?? null;

  return {
    product: {
      reference: product?.reference ?? null,
      label: product?.label ?? null,
      isArchived: product?.is_archived === true,
      isDeleted: product?.is_deleted === true,
      archivedAtPresent: !!product?.archived_at,
      deletedAtPresent: !!product?.deleted_at
    },
    stockCount: Number(stockCount.rows[0]?.total ?? 0),
    variantCount: Number(variantCount.rows[0]?.total ?? 0),
    priceHistoryCount: Number(priceHistoryCount.rows[0]?.total ?? 0),
    metadataRows: metadataRows.rows.map((row) => `${row.kind}:${row.value}`),
    movements: movements.rows.map(normalizeMovement)
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
  const jsonLatestPath = path.join(reportDir, 'postgres-products-purge.latest.json');
  const markdownLatestPath = path.join(reportDir, 'postgres-products-purge.latest.md');
  const jsonPath = path.join(reportDir, `postgres-products-purge.${slug}.json`);
  const markdownPath = path.join(reportDir, `postgres-products-purge.${slug}.md`);
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
  lines.push('# PostgreSQL Products Purge Validation');
  lines.push('');
  lines.push(`- Status: \`${report.status}\``);
  lines.push(`- Started at: \`${report.startedAt}\``);
  lines.push(`- Finished at: \`${report.finishedAt}\``);
  lines.push(`- SQLite path kept: \`${report.sqlitePath}\``);
  lines.push(`- DB driver forced for audit: \`${report.routing.configuredDriver}\``);
  lines.push(`- Catalog read opt-in: \`${report.routing.catalogReadOptInEnabled}\``);
  lines.push(`- Product write opt-in: \`${report.routing.productWriteOptInEnabled}\``);
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
  lines.push('## Preservation Checks');
  lines.push('');
  report.preservationChecks.forEach((item) => lines.push(`- ${item.name}: ${item.ok ? 'ok' : 'failed'}${item.detail ? ` (${item.detail})` : ''}`));
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
  const tempSqlitePath = path.join(reportDir, `tmp-products-purge-${Date.now()}.db`);
  fs.mkdirSync(reportDir, { recursive: true });
  fs.copyFileSync(sqlitePath, tempSqlitePath);
  const tempSqliteDb = new Database(tempSqlitePath);

  const suffix = Date.now().toString(36);
  const ownerId = `products-purge-owner-${suffix}`;
  const ownerUsername = `products_purge_owner_${suffix}`;
  const ownerEmail = `products-purge-owner-${suffix}@example.test`;
  const ownerPassword = 'OwnerAudit#2026!';
  const reference = `PG-PURGE-${suffix.slice(-8).toUpperCase()}`;
  const category = `pg-audit-purge-category-${suffix}`;
  const serie = `pg-audit-purge-serie-${suffix}`;
  const colorA = `pg-audit-purge-color-a-${suffix}`;
  const colorB = `pg-audit-purge-color-b-${suffix}`;
  const metadataValues = [category, serie, colorA, colorB];
  const movementPayload = {
    id: `purge-movement-${suffix}`,
    color: colorA,
    type: 'IN',
    delta: 2,
    before: 0,
    after: 2,
    reason: 'purge-audit-seed',
    actor: 'Purge Audit',
    employeeId: ownerId,
    employeeName: 'Purge Audit',
    username: ownerUsername,
    at: nowIso()
  };

  const report = {
    startedAt: nowIso(),
    finishedAt: null,
    status: 'running',
    sqlitePath,
    baseUrl: null,
    routing: getDatabaseRoutingSummary(),
    writeCartography: [
      '`products:purge` ne supprime pas la ligne `products`; il la marque `is_deleted=1`, conserve `is_archived=1`, renseigne `deleted_at` et conserve `archived_at`.',
      '`products:purge` supprime `stock`, `product_variants` et `price_history` pour le produit cible.',
      '`products:purge` ne supprime pas `product_catalog_metadata` et doit conserver l historique `movements` tant que la ligne `products` physique reste presente.'
    ],
    validated: [],
    httpChecks: [],
    parityChecks: [],
    preservationChecks: [],
    sqliteIsolationChecks: [],
    remainingRisks: [],
    artifacts: null
  };

  let server;
  let actualProductId = null;

  const createPayload = {
    reference,
    label: 'PG Audit Purge Product',
    description: 'purge audit for postgres',
    category,
    serie,
    unit: 'piece',
    colors: [colorA, colorB],
    lowStockThreshold: 1,
    priceTtc: 10
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
    assert(report.routing.configuredDriver === 'postgres', 'The products purge audit must run with DB_DRIVER=postgres.');
    assert(report.routing.catalogReadOptInEnabled === true, 'The products purge audit requires DB_ENABLE_POSTGRES_CATALOG_READ=1.');
    assert(report.routing.productWriteOptInEnabled === true, 'The products purge audit requires DB_ENABLE_POSTGRES_PRODUCT_WRITES=1.');
    assert(report.routing.activePostgresScopes.includes('products-purge-write'), 'Products purge write scope is not routed to PostgreSQL.');
    assert(report.routing.activePostgresScopes.includes('movements-read'), 'Movements read scope must be enabled during this audit.');

    await cleanup();

    const expectedCreateResult = createProductSqlite(tempSqliteDb, createPayload);
    assert(expectedCreateResult.ok === true && expectedCreateResult.id, 'SQLite create reference execution failed for purge audit.');
    assert(updateVariantPriceWithHistorySqlite(tempSqliteDb, expectedCreateResult.id, colorA, 17.5, ownerUsername) === true, 'SQLite updatePrice reference execution failed for purge audit.');
    assert(archiveProductSqlite(tempSqliteDb, expectedCreateResult.id).ok === true, 'SQLite archive reference execution failed for purge audit.');
    insertSqliteMovement(tempSqliteDb, {
      ...movementPayload,
      productId: expectedCreateResult.id,
      reference,
      label: createPayload.label,
      category,
      serie
    });
    assert(purgeProductSqlite(tempSqliteDb, expectedCreateResult.id).ok === true, 'SQLite purge reference execution failed for purge audit.');
    const expectedState = getSqliteState(tempSqliteDb, expectedCreateResult.id, metadataValues);

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
      [ownerId, 'Products Purge Audit', ownerUsername, ownerEmail, hashPassword(ownerPassword), nowIso()]
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
        'user-agent': 'products-purge-audit'
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
      'user-agent': 'products-purge-audit'
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

    const updatePriceResponse = await request(report.baseUrl, `/api/products/${actualProductId}/price`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        color: colorA,
        newPrice: 17.5,
        changedBy: ownerUsername
      })
    });
    assert(updatePriceResponse.response.ok, `PATCH /api/products/:id/price HTTP status was ${updatePriceResponse.response.status}.`);
    assert(updatePriceResponse.body?.result === true, 'PATCH /api/products/:id/price did not return result=true.');
    report.httpChecks.push({ name: 'PATCH /api/products/:id/price', ok: true, detail: `color=${colorA}` });

    const archiveResponse = await request(report.baseUrl, `/api/products/${actualProductId}/archive`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({})
    });
    assert(archiveResponse.response.ok, `POST /api/products/:id/archive HTTP status was ${archiveResponse.response.status}.`);
    assert(archiveResponse.body?.result?.ok === true, 'POST /api/products/:id/archive did not return ok=true.');
    report.httpChecks.push({ name: 'POST /api/products/:id/archive', ok: true, detail: `id=${actualProductId}` });

    await query(
      `
        INSERT INTO movements (
          id, product_id, reference, label, category, serie, color, type,
          delta, before, after, reason, actor, employee_id, employee_name, username, at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14, $15, $16, $17
        )
      `,
      [
        movementPayload.id,
        actualProductId,
        reference,
        createPayload.label,
        category,
        serie,
        movementPayload.color,
        movementPayload.type,
        movementPayload.delta,
        movementPayload.before,
        movementPayload.after,
        movementPayload.reason,
        movementPayload.actor,
        movementPayload.employeeId,
        movementPayload.employeeName,
        movementPayload.username,
        movementPayload.at
      ]
    );

    const purgeResponse = await request(report.baseUrl, `/api/products/${actualProductId}/purge`, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'products-purge-audit'
      }
    });
    assert(purgeResponse.response.ok, `DELETE /api/products/:id/purge HTTP status was ${purgeResponse.response.status}.`);
    assert(purgeResponse.body?.result?.ok === true, 'DELETE /api/products/:id/purge did not return ok=true.');
    report.httpChecks.push({ name: 'DELETE /api/products/:id/purge', ok: true, detail: `id=${actualProductId}` });

    const actualState = await getPostgresState(actualProductId, metadataValues);
    assert(JSON.stringify(actualState.product) === JSON.stringify(expectedState.product), 'PostgreSQL product purge state does not match SQLite parity.');
    report.parityChecks.push({ name: 'products purge parity', ok: true, detail: `deleted=${actualState.product.isDeleted}` });
    assert(actualState.stockCount === expectedState.stockCount, 'PostgreSQL stock purge state does not match SQLite parity.');
    report.parityChecks.push({ name: 'stock purge parity', ok: true, detail: `count=${actualState.stockCount}` });
    assert(actualState.variantCount === expectedState.variantCount, 'PostgreSQL product_variants purge state does not match SQLite parity.');
    report.parityChecks.push({ name: 'product_variants purge parity', ok: true, detail: `count=${actualState.variantCount}` });
    assert(actualState.priceHistoryCount === expectedState.priceHistoryCount, 'PostgreSQL price_history purge state does not match SQLite parity.');
    report.parityChecks.push({ name: 'price_history purge parity', ok: true, detail: `count=${actualState.priceHistoryCount}` });
    assert(JSON.stringify(actualState.metadataRows) === JSON.stringify(expectedState.metadataRows), 'PostgreSQL metadata preservation does not match SQLite parity.');
    report.parityChecks.push({ name: 'metadata preservation parity', ok: true, detail: `count=${actualState.metadataRows.length}` });
    assert(JSON.stringify(actualState.movements) === JSON.stringify(expectedState.movements), 'PostgreSQL movements preservation does not match SQLite parity.');
    report.parityChecks.push({ name: 'movements preservation parity', ok: true, detail: `count=${actualState.movements.length}` });

    const activeProductsResponse = await request(report.baseUrl, '/api/products', {
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'products-purge-audit'
      }
    });
    assert(activeProductsResponse.response.ok, `GET /api/products HTTP status was ${activeProductsResponse.response.status}.`);
    assert(!(activeProductsResponse.body?.result ?? []).some((row) => row?.id === actualProductId), 'Purged product should not remain in active products list.');
    report.httpChecks.push({ name: 'GET /api/products after purge', ok: true, detail: 'purged product hidden' });

    const archivedProductsResponse = await request(report.baseUrl, '/api/products/archived', {
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'products-purge-audit'
      }
    });
    assert(archivedProductsResponse.response.ok, `GET /api/products/archived HTTP status was ${archivedProductsResponse.response.status}.`);
    assert(!(archivedProductsResponse.body?.result ?? []).some((row) => row?.id === actualProductId), 'Purged product should not remain in archived products list.');
    report.httpChecks.push({ name: 'GET /api/products/archived after purge', ok: true, detail: 'purged product hidden' });

    const stockResponse = await request(report.baseUrl, '/api/stock', {
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'products-purge-audit'
      }
    });
    assert(stockResponse.response.ok, `GET /api/stock HTTP status was ${stockResponse.response.status}.`);
    assert(!(stockResponse.body?.result ?? []).some((row) => row?.product_id === actualProductId), 'Purged product stock rows should be removed.');
    report.httpChecks.push({ name: 'GET /api/stock after purge', ok: true, detail: 'stock rows removed' });

    const movementsResponse = await request(report.baseUrl, '/api/movements', {
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'products-purge-audit'
      }
    });
    assert(movementsResponse.response.ok, `GET /api/movements HTTP status was ${movementsResponse.response.status}.`);
    const movementRows = (movementsResponse.body?.result ?? []).filter((row) => row?.itemId === actualProductId).map(normalizeMovement);
    assert(JSON.stringify(movementRows) === JSON.stringify(expectedState.movements), 'Purged product movements list should remain intact.');
    report.httpChecks.push({ name: 'GET /api/movements after purge', ok: true, detail: `count=${movementRows.length}` });

    report.preservationChecks.push({ name: 'products row kept', ok: actualState.product.isDeleted === true && actualState.product.isArchived === true, detail: 'row marked deleted, not physically removed' });
    report.preservationChecks.push({ name: 'product_catalog_metadata kept', ok: actualState.metadataRows.length === expectedState.metadataRows.length, detail: `count=${actualState.metadataRows.length}` });
    report.preservationChecks.push({ name: 'movements kept', ok: actualState.movements.length === expectedState.movements.length, detail: `count=${actualState.movements.length}` });

    const realSqliteProductRow = realSqliteDb.prepare('SELECT id FROM products WHERE reference = ? LIMIT 1').get(reference);
    assert(!realSqliteProductRow, 'Real SQLite products table should remain unchanged during PostgreSQL purge audit.');
    report.sqliteIsolationChecks.push({ name: 'products unchanged in SQLite', ok: true, detail: `reference=${reference}` });

    const realSqliteMetadataCount = realSqliteDb.prepare(`
      SELECT COUNT(*) AS total
      FROM product_catalog_metadata
      WHERE value IN (?, ?, ?, ?)
    `).get(...metadataValues);
    assert(Number(realSqliteMetadataCount?.total ?? 0) === 0, 'Real SQLite metadata should remain unchanged during PostgreSQL purge audit.');
    report.sqliteIsolationChecks.push({ name: 'metadata unchanged in SQLite', ok: true, detail: `values=${metadataValues.length}` });

    report.validated.push('`products:purge` est compatible PostgreSQL avec la meme semantique que SQLite: suppression de `stock`, `product_variants` et `price_history`, mais conservation de la ligne `products` marquee `is_deleted=1`.');
    report.validated.push('`products:purge` conserve `product_catalog_metadata` et l historique `movements`; la ligne produit reste donc presente en base pour referencer cet historique.');
    report.validated.push('Les routes REST et handlers IPC restent inchanges; le routage PostgreSQL de cette tranche reste audit-only et exige `DB_DRIVER=postgres`, `DB_ENABLE_POSTGRES_CATALOG_READ=1` et `DB_ENABLE_POSTGRES_PRODUCT_WRITES=1`.');
    report.remainingRisks.push('Les ecritures `stock` et `movements` completes restent sur SQLite; le domaine catalogue/stock ne doit donc toujours pas etre active en PostgreSQL en usage normal.');
    report.remainingRisks.push('La prochaine tranche devra aligner `stock:setQty`, `stock:increment`, `stock:decrement`, `stock:applyMovement` et `movements:add`, car ce sont elles qui pilotent vraiment les quantites et l historique metier.');
    report.remainingRisks.push('Le produit purgé reste physiquement present dans `products` avec `is_deleted=1`; cette semantique est preservee, mais elle suppose que les lectures continuent a filtrer correctement `is_deleted`.');

    report.status = 'completed';
  } catch (error) {
    report.status = 'failed';
    report.remainingRisks.push(error instanceof Error ? error.message : String(error));
    console.error('[audit-postgres-products-purge] failed', error);
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
