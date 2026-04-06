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
process.env.DB_ENABLE_POSTGRES_STOCK_WRITES = '1';

const { getDatabaseRoutingSummary } = require('../../backend/src/config/database');
const { startServer, stopServer } = require('../../backend/server');
const { query, closePostgresPool } = require('../../backend/src/db/postgres');
const { hashPassword } = require('../../backend/src/services/auth-core.service');
const { createProduct: createProductSqlite } = require('../../backend/src/repositories/sqlite/product-write.repository');
const {
  setStockQty: setStockQtySqlite,
  applyStockMovement: applyStockMovementSqlite
} = require('../../backend/src/repositories/sqlite/stock-write.repository');
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

  throw new Error('Unable to load better-sqlite3 for stock:applyMovement audit.');
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
  at: normalizeTimestamp(row.at)
});

const normalizeMovementList = (rows) => rows
  .map((row) => normalizeMovement(row))
  .sort((a, b) => a.id.localeCompare(b.id));

const getSqliteState = (db, productId, movementIds) => {
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
  const movements = listMovementsSqlite(db)
    .filter((row) => movementIds.includes(row.id));

  return {
    product: {
      reference: product?.reference ?? null,
      label: product?.label ?? null,
      priceTtc: product ? roundNumber(product.price_ttc) : null,
      lastUpdated: normalizeTimestamp(product?.last_updated)
    },
    stockRows: normalizeStockRows(stockRows),
    variantRows: normalizeVariantRows(variantRows),
    movements: normalizeMovementList(movements)
  };
};

const getPostgresState = async (productId, movementIds) => {
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
  const movementRowsResult = await query(
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
      WHERE id = ANY($1::text[])
    `,
    [movementIds]
  );

  const product = productResult.rows[0] ?? null;
  return {
    product: {
      reference: product?.reference ?? null,
      label: product?.label ?? null,
      priceTtc: product ? roundNumber(product.price_ttc) : null,
      lastUpdated: normalizeTimestamp(product?.last_updated)
    },
    stockRows: normalizeStockRows(stockRowsResult.rows),
    variantRows: normalizeVariantRows(variantRowsResult.rows),
    movements: normalizeMovementList(movementRowsResult.rows)
  };
};

const normalizeStockItem = (item) => ({
  reference: item.reference,
  label: item.label,
  quantities: Object.fromEntries(
    Object.entries(item.quantities ?? {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => [key, roundNumber(value)])
  ),
  lowStockThreshold: Number(item.lowStockThreshold ?? 0) || 0
});

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
  const jsonLatestPath = path.join(reportDir, 'postgres-stock-apply-movement.latest.json');
  const markdownLatestPath = path.join(reportDir, 'postgres-stock-apply-movement.latest.md');
  const jsonPath = path.join(reportDir, `postgres-stock-apply-movement.${slug}.json`);
  const markdownPath = path.join(reportDir, `postgres-stock-apply-movement.${slug}.md`);
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
  lines.push('# PostgreSQL Stock ApplyMovement Validation');
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
  const tempSqlitePath = path.join(reportDir, `tmp-stock-apply-movement-${Date.now()}.db`);
  fs.mkdirSync(reportDir, { recursive: true });
  fs.copyFileSync(sqlitePath, tempSqlitePath);
  const tempSqliteDb = new Database(tempSqlitePath);

  const suffix = Date.now().toString(36);
  const ownerId = `stock-apply-owner-${suffix}`;
  const ownerUsername = `stock_apply_owner_${suffix}`;
  const ownerEmail = `stock-apply-owner-${suffix}@example.test`;
  const ownerPassword = 'OwnerAudit#2026!';
  const ownerName = 'Stock ApplyMovement Audit';
  const reference = `PG-APPLY-${suffix.slice(-8).toUpperCase()}`;
  const category = `pg-audit-apply-category-${suffix}`;
  const serie = `pg-audit-apply-serie-${suffix}`;
  const colorA = `pg-audit-apply-color-a-${suffix}`;
  const colorB = `pg-audit-apply-color-b-${suffix}`;
  const metadataValues = [category, serie, colorA, colorB];
  const initialQty = 2;
  const positiveMovementId = randomUUID();
  const negativeMovementId = randomUUID();
  const positiveAt = new Date(Date.now() - 1000).toISOString();
  const negativeAt = nowIso();

  const report = {
    startedAt: nowIso(),
    finishedAt: null,
    status: 'running',
    sqlitePath,
    baseUrl: null,
    routing: getDatabaseRoutingSummary(),
    writeCartography: [
      '`stock:applyMovement` calcule `before` depuis le stock courant, derive `after` apres application du delta signe et clamp a `0` si necessaire.',
      '`stock:applyMovement` met a jour `stock.qty`, synchronise `product_variants.stock`, met a jour `products.last_updated`, puis ecrit une ligne `movements` dans le meme flux logique.',
      'La ligne `movements` conserve `reason`, `actor`, `employee_id`, `username` et les metadonnees produit (`reference`, `label`, `category`, `serie`) avec fallback sur le produit si elles ne sont pas fournies.'
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
    label: 'PG Audit Stock ApplyMovement Product',
    description: 'stock applyMovement audit',
    category,
    serie,
    unit: 'piece',
    colors: [colorA, colorB],
    lowStockThreshold: 2,
    priceTtc: 12.5
  };

  const positiveMovement = {
    id: positiveMovementId,
    itemId: null,
    color: colorA,
    type: 'IN',
    delta: 4,
    reason: 'manual-incoming',
    at: positiveAt
  };

  const negativeMovement = {
    id: negativeMovementId,
    itemId: null,
    color: colorA,
    type: 'OUT',
    delta: 10,
    reason: 'manual-outgoing',
    at: negativeAt
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
    assert(report.routing.configuredDriver === 'postgres', 'The stock:applyMovement audit must run with DB_DRIVER=postgres.');
    assert(report.routing.catalogReadOptInEnabled === true, 'The stock:applyMovement audit requires DB_ENABLE_POSTGRES_CATALOG_READ=1.');
    assert(report.routing.productWriteOptInEnabled === true, 'The stock:applyMovement audit requires DB_ENABLE_POSTGRES_PRODUCT_WRITES=1.');
    assert(report.routing.stockWriteOptInEnabled === true, 'The stock:applyMovement audit requires DB_ENABLE_POSTGRES_STOCK_WRITES=1.');
    assert(report.routing.activePostgresScopes.includes('stock-read'), 'stock-read scope must be enabled during this audit.');
    assert(report.routing.activePostgresScopes.includes('movements-read'), 'movements-read scope must be enabled during this audit.');
    assert(report.routing.activePostgresScopes.includes('stock-apply-movement-write'), 'stock:applyMovement write scope is not routed to PostgreSQL.');

    await cleanup();

    const sqliteUser = {
      id: ownerId,
      nom: ownerName,
      username: ownerUsername
    };

    const expectedCreateResult = createProductSqlite(tempSqliteDb, createPayload);
    assert(expectedCreateResult.ok === true && expectedCreateResult.id, 'SQLite create reference execution failed for stock:applyMovement audit.');
    assert(setStockQtySqlite(tempSqliteDb, expectedCreateResult.id, colorA, initialQty) === true, 'SQLite stock:setQty setup failed for stock:applyMovement audit.');
    positiveMovement.itemId = expectedCreateResult.id;
    negativeMovement.itemId = expectedCreateResult.id;
    const expectedBefore = getSqliteState(tempSqliteDb, expectedCreateResult.id, [positiveMovementId, negativeMovementId]);
    assert(applyStockMovementSqlite(tempSqliteDb, positiveMovement, sqliteUser) === true, 'SQLite positive applyMovement reference execution failed.');
    const expectedAfterPositive = getSqliteState(tempSqliteDb, expectedCreateResult.id, [positiveMovementId, negativeMovementId]);
    assert(applyStockMovementSqlite(tempSqliteDb, negativeMovement, sqliteUser) === true, 'SQLite negative applyMovement reference execution failed.');
    const expectedAfterNegative = getSqliteState(tempSqliteDb, expectedCreateResult.id, [positiveMovementId, negativeMovementId]);

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
      [ownerId, ownerName, ownerUsername, ownerEmail, hashPassword(ownerPassword), nowIso()]
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
        'user-agent': 'stock-apply-movement-audit'
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
      'user-agent': 'stock-apply-movement-audit'
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

    const setQtyResponse = await request(
      report.baseUrl,
      `/api/stock/${encodeURIComponent(actualProductId)}/${encodeURIComponent(colorA)}/set-qty`,
      {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ qty: initialQty })
      }
    );
    assert(setQtyResponse.response.ok, `PATCH /api/stock/:productId/:color/set-qty HTTP status was ${setQtyResponse.response.status}.`);
    assert(setQtyResponse.body?.result === true, 'PATCH /api/stock/:productId/:color/set-qty did not return result=true during audit setup.');
    report.httpChecks.push({ name: 'PATCH /api/stock/:productId/:color/set-qty', ok: true, detail: `setup qty=${initialQty}` });

    positiveMovement.itemId = actualProductId;
    negativeMovement.itemId = actualProductId;
    const actualBefore = await getPostgresState(actualProductId, [positiveMovementId, negativeMovementId]);

    const positiveResponse = await request(report.baseUrl, '/api/stock/movements', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(positiveMovement)
    });
    assert(positiveResponse.response.ok, `POST /api/stock/movements positive HTTP status was ${positiveResponse.response.status}.`);
    assert(positiveResponse.body?.result === true, 'Positive stock:applyMovement did not return result=true.');
    report.httpChecks.push({ name: 'POST /api/stock/movements positive', ok: true, detail: `id=${positiveMovementId}` });

    const actualAfterPositive = await getPostgresState(actualProductId, [positiveMovementId, negativeMovementId]);
    assert(JSON.stringify(actualAfterPositive.stockRows) === JSON.stringify(expectedAfterPositive.stockRows), 'PostgreSQL stock rows after positive applyMovement do not match SQLite parity.');
    report.parityChecks.push({ name: 'stock parity after positive movement', ok: true, detail: `qty=${expectedAfterPositive.stockRows.find((row) => row.color === colorA)?.qty ?? 0}` });
    assert(JSON.stringify(actualAfterPositive.variantRows) === JSON.stringify(expectedAfterPositive.variantRows), 'PostgreSQL product_variants after positive applyMovement do not match SQLite parity.');
    report.parityChecks.push({ name: 'product_variants parity after positive movement', ok: true, detail: `rows=${expectedAfterPositive.variantRows.length}` });
    assert(JSON.stringify(actualAfterPositive.movements) === JSON.stringify(expectedAfterPositive.movements.map((row) => ({ ...row, itemId: actualProductId }))), 'PostgreSQL movement row after positive applyMovement does not match SQLite parity.');
    report.parityChecks.push({ name: 'movements parity after positive movement', ok: true, detail: `id=${positiveMovementId}` });

    const negativeResponse = await request(report.baseUrl, '/api/stock/movements', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(negativeMovement)
    });
    assert(negativeResponse.response.ok, `POST /api/stock/movements negative HTTP status was ${negativeResponse.response.status}.`);
    assert(negativeResponse.body?.result === true, 'Negative stock:applyMovement did not return result=true.');
    report.httpChecks.push({ name: 'POST /api/stock/movements negative', ok: true, detail: `id=${negativeMovementId}` });

    const actualAfterNegative = await getPostgresState(actualProductId, [positiveMovementId, negativeMovementId]);
    const expectedNegativeMovements = expectedAfterNegative.movements.map((row) => ({ ...row, itemId: actualProductId }));
    assert(JSON.stringify(actualAfterNegative.stockRows) === JSON.stringify(expectedAfterNegative.stockRows), 'PostgreSQL stock rows after negative applyMovement do not match SQLite parity.');
    report.parityChecks.push({ name: 'stock parity after negative movement', ok: true, detail: `qty=${expectedAfterNegative.stockRows.find((row) => row.color === colorA)?.qty ?? 0}` });
    assert(JSON.stringify(actualAfterNegative.variantRows) === JSON.stringify(expectedAfterNegative.variantRows), 'PostgreSQL product_variants after negative applyMovement do not match SQLite parity.');
    report.parityChecks.push({ name: 'product_variants parity after negative movement', ok: true, detail: `rows=${expectedAfterNegative.variantRows.length}` });
    assert(JSON.stringify(actualAfterNegative.movements) === JSON.stringify(expectedNegativeMovements), 'PostgreSQL movement rows after negative applyMovement do not match SQLite parity.');
    report.parityChecks.push({ name: 'movements parity after negative movement', ok: true, detail: `count=${expectedNegativeMovements.length}` });
    assert(actualAfterNegative.product.reference === expectedAfterNegative.product.reference, 'PostgreSQL product reference after applyMovement does not match SQLite parity.');
    assert(actualAfterNegative.product.label === expectedAfterNegative.product.label, 'PostgreSQL product label after applyMovement does not match SQLite parity.');
    assert(actualAfterNegative.product.priceTtc === expectedAfterNegative.product.priceTtc, 'PostgreSQL product price_ttc after applyMovement does not match SQLite parity.');
    report.parityChecks.push({ name: 'product semantic parity after movement sequence', ok: true, detail: `priceTtc=${expectedAfterNegative.product.priceTtc}` });

    const stockRowsResponse = await request(report.baseUrl, '/api/stock', {
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'stock-apply-movement-audit'
      }
    });
    assert(stockRowsResponse.response.ok, `GET /api/stock HTTP status was ${stockRowsResponse.response.status}.`);
    const stockRows = normalizeStockRows((stockRowsResponse.body?.result ?? []).filter((row) => row.product_id === actualProductId));
    assert(JSON.stringify(stockRows) === JSON.stringify(expectedAfterNegative.stockRows), 'GET /api/stock after movement sequence does not match SQLite parity.');
    report.httpChecks.push({ name: 'GET /api/stock after movement sequence', ok: true, detail: `rows=${stockRows.length}` });

    const stockItemsResponse = await request(report.baseUrl, '/api/stock/items', {
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'stock-apply-movement-audit'
      }
    });
    assert(stockItemsResponse.response.ok, `GET /api/stock/items HTTP status was ${stockItemsResponse.response.status}.`);
    const stockItem = normalizeStockItem((stockItemsResponse.body?.result ?? []).find((item) => item.id === actualProductId));
    assert(JSON.stringify(stockItem.quantities) === JSON.stringify({ [colorA]: 0, [colorB]: 0 }), 'GET /api/stock/items quantities after movement sequence do not match expected clamped state.');
    report.httpChecks.push({ name: 'GET /api/stock/items after movement sequence', ok: true, detail: `reference=${reference}` });

    const movementsResponse = await request(report.baseUrl, '/api/movements', {
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'stock-apply-movement-audit'
      }
    });
    assert(movementsResponse.response.ok, `GET /api/movements HTTP status was ${movementsResponse.response.status}.`);
    const httpMovements = normalizeMovementList(
      (movementsResponse.body?.result ?? []).filter((row) => row?.id === positiveMovementId || row?.id === negativeMovementId)
    );
    assert(JSON.stringify(httpMovements) === JSON.stringify(expectedNegativeMovements), 'GET /api/movements after movement sequence does not match SQLite parity.');
    report.httpChecks.push({ name: 'GET /api/movements after movement sequence', ok: true, detail: `count=${httpMovements.length}` });

    assert(expectedBefore.product.lastUpdated !== expectedAfterPositive.product.lastUpdated, 'SQLite last_updated did not change after positive movement.');
    assert(expectedAfterPositive.product.lastUpdated !== expectedAfterNegative.product.lastUpdated, 'SQLite last_updated did not change after negative movement.');
    assert(actualBefore.product.lastUpdated !== actualAfterPositive.product.lastUpdated, 'PostgreSQL last_updated did not change after positive movement.');
    assert(actualAfterPositive.product.lastUpdated !== actualAfterNegative.product.lastUpdated, 'PostgreSQL last_updated did not change after negative movement.');
    report.sideEffects.push({ name: 'products.last_updated updated', ok: true, detail: 'changed after positive and negative movements' });
    assert(actualAfterPositive.variantRows.some((row) => row.color === colorA && row.stock === 6), 'Variant stock was not synchronized after positive movement.');
    assert(actualAfterNegative.variantRows.some((row) => row.color === colorA && row.stock === 0), 'Variant stock was not synchronized after negative clamp.');
    report.sideEffects.push({ name: 'product_variants.stock synchronized', ok: true, detail: `color=${colorA} positive=6 negative=0` });
    assert(actualAfterNegative.stockRows.some((row) => row.color === colorA && row.qty === 0), 'Stock clamp to zero after negative movement did not match expected state.');
    report.sideEffects.push({ name: 'stock clamp preserved', ok: true, detail: `color=${colorA} qty=0 after negative movement` });
    assert(expectedNegativeMovements.some((row) => row.id === positiveMovementId && row.before === 2 && row.after === 6 && row.delta === 4 && row.type === 'IN'), 'Positive movement before/after parity is incorrect.');
    assert(expectedNegativeMovements.some((row) => row.id === negativeMovementId && row.before === 6 && row.after === 0 && row.delta === -6 && row.type === 'OUT'), 'Negative movement clamp parity is incorrect.');
    report.sideEffects.push({ name: 'before/after and applied delta preserved', ok: true, detail: 'positive=2->6 delta=4; negative=6->0 delta=-6' });
    assert(expectedNegativeMovements.every((row) => row.reason === (row.id === positiveMovementId ? positiveMovement.reason : negativeMovement.reason)), 'Movement reasons were not preserved.');
    assert(expectedNegativeMovements.every((row) => row.actor === ownerName && row.username === ownerUsername && row.employeeId === ownerId), 'Movement actor metadata were not preserved.');
    assert(expectedNegativeMovements.every((row) => row.reference === reference && row.label === createPayload.label && row.category === category && row.serie === serie), 'Movement product metadata were not preserved.');
    report.sideEffects.push({ name: 'reason, actor and metadata preserved', ok: true, detail: `actor=${ownerName}` });

    const realSqliteProductRow = realSqliteDb.prepare('SELECT id FROM products WHERE reference = ? LIMIT 1').get(reference);
    assert(!realSqliteProductRow, 'Real SQLite products table should remain unchanged during PostgreSQL stock:applyMovement audit.');
    report.sqliteIsolationChecks.push({ name: 'products unchanged in SQLite', ok: true, detail: `reference=${reference}` });

    const realSqliteMetadataCount = realSqliteDb.prepare(`
      SELECT COUNT(*) AS total
      FROM product_catalog_metadata
      WHERE value IN (?, ?, ?, ?)
    `).get(...metadataValues);
    assert(Number(realSqliteMetadataCount?.total ?? 0) === 0, 'Real SQLite metadata should remain unchanged during PostgreSQL stock:applyMovement audit.');
    report.sqliteIsolationChecks.push({ name: 'metadata unchanged in SQLite', ok: true, detail: `values=${metadataValues.length}` });

    report.validated.push('`stock:applyMovement` est compatible PostgreSQL pour la mutation combinee stock + historique, avec parite validee contre une execution de reference SQLite.');
    report.validated.push('Les effets sur `stock`, `product_variants`, `products.last_updated`, `movements`, `before`, `after` et `delta applique` sont conformes a SQLite pour un mouvement positif puis un mouvement negatif avec clamp a `0`.');
    report.validated.push('La `reason`, l `actor`, `employee_id`, `username` et les metadonnees produit (`reference`, `label`, `category`, `serie`) sont preserves comme en SQLite.');
    report.validated.push('Cette sous-etape reste audit-only et exige `DB_DRIVER=postgres`, `DB_ENABLE_POSTGRES_CATALOG_READ=1`, `DB_ENABLE_POSTGRES_PRODUCT_WRITES=1` et `DB_ENABLE_POSTGRES_STOCK_WRITES=1`.');

    report.status = 'completed';
  } catch (error) {
    report.status = 'failed';
    report.remainingRisks.push(error instanceof Error ? error.message : String(error));
    console.error('[audit-postgres-stock-apply-movement] failed', error);
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
