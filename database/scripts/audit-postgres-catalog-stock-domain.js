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
const {
  listProducts,
  listArchivedProducts,
  getProductMetadata,
  getStockRows,
  buildStockItems,
  getInventoryResponse
} = require('../../backend/src/repositories/sqlite/catalog-read.repository');
const { listMovements: listMovementsSqlite } = require('../../backend/src/repositories/sqlite/movements-read.repository');
const { getPriceHistory: getPriceHistorySqlite } = require('../../backend/src/repositories/sqlite/price-history-read.repository');
const {
  createProduct: createProductSqlite,
  updateProduct: updateProductSqlite,
  updateVariantPriceWithHistory: updateVariantPriceWithHistorySqlite,
  archiveProduct: archiveProductSqlite,
  restoreProduct: restoreProductSqlite,
  purgeProduct: purgeProductSqlite
} = require('../../backend/src/repositories/sqlite/product-write.repository');
const {
  setStockQty: setStockQtySqlite,
  incrementStockQty: incrementStockQtySqlite,
  applyStockMovement: applyStockMovementSqlite
} = require('../../backend/src/repositories/sqlite/stock-write.repository');
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

  throw new Error('Unable to load better-sqlite3 for catalog/stock global audit.');
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

const sortObject = (value) => Object.fromEntries(
  Object.entries(value ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => [key, roundNumber(item)])
);

const normalizeArray = (value) => [...(value ?? [])].sort((a, b) => String(a).localeCompare(String(b)));

const normalizeProduct = (row) => {
  if (!row) return null;
  return {
    reference: row.reference,
    label: row.label,
    description: row.description ?? '',
    category: row.category,
    serie: row.serie,
    unit: row.unit,
    lowStockThreshold: Number(row.low_stock_threshold ?? row.lowStockThreshold ?? 0) || 0,
    priceTtc: row.price_ttc == null && row.priceTtc == null ? null : roundNumber(row.price_ttc ?? row.priceTtc),
    archivedAtPresent: !!row.archived_at,
    deletedAtPresent: !!row.deleted_at,
    colors: Array.isArray(row.colors) ? normalizeArray(row.colors) : undefined
  };
};

const normalizeMetadata = (value) => ({
  categories: normalizeArray(value?.categories),
  series: normalizeArray(value?.series),
  colors: normalizeArray(value?.colors)
});

const normalizeStockRows = (rows) => rows
  .map((row) => ({
    productId: row.product_id ?? row.productId,
    color: row.color,
    qty: roundNumber(row.qty)
  }))
  .sort((a, b) => `${a.productId}:${a.color}`.localeCompare(`${b.productId}:${b.color}`));

const normalizeStockItem = (item) => {
  if (!item) return null;
  return {
    reference: item.reference,
    label: item.label,
    category: item.category,
    serie: item.serie,
    unit: item.unit,
    lowStockThreshold: Number(item.lowStockThreshold ?? 0) || 0,
    quantities: sortObject(item.quantities)
  };
};

const normalizeInventoryItem = (item) => {
  if (!item) return null;
  return {
    product: {
      reference: item.product?.reference,
      label: item.product?.label,
      category: item.product?.category,
      serie: item.product?.serie,
      unit: item.product?.unit,
      lowStockThreshold: Number(item.product?.lowStockThreshold ?? 0) || 0,
      priceTtc: item.product?.priceTtc == null ? null : roundNumber(item.product.priceTtc)
    },
    qtyTotal: roundNumber(item.qtyTotal),
    quantityByColor: sortObject(item.quantityByColor),
    unitPrice: roundNumber(item.unitPrice),
    valueByColor: sortObject(item.valueByColor),
    totalValue: roundNumber(item.totalValue),
    priceStatus: item.priceStatus
  };
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

const normalizePriceHistory = (rows) => rows
  .map((row) => ({
    id: row.id,
    productId: row.productId ?? row.product_id,
    color: row.color,
    oldPrice: roundNumber(row.oldPrice ?? row.old_price),
    newPrice: roundNumber(row.newPrice ?? row.new_price),
    changedAt: normalizeTimestamp(row.changedAt ?? row.changed_at),
    changedBy: row.changedBy ?? row.changed_by ?? null
  }))
  .sort((a, b) => a.id.localeCompare(b.id));

const normalizeVariantRows = (rows) => rows
  .map((row) => ({
    color: row.color,
    price: roundNumber(row.price),
    stock: roundNumber(row.stock)
  }))
  .sort((a, b) => a.color.localeCompare(b.color));

const normalizeMetadataRows = (rows) => rows
  .map((row) => ({
    kind: row.kind,
    value: row.value
  }))
  .sort((a, b) => `${a.kind}:${a.value}`.localeCompare(`${b.kind}:${b.value}`));

const getSqliteDirectState = (db, productId, metadataValues) => {
  const product = db.prepare(`
    SELECT reference, label, description, category, serie, unit, low_stock_threshold, price_ttc,
           is_archived, is_deleted, archived_at, deleted_at, last_updated
    FROM products
    WHERE id = ?
    LIMIT 1
  `).get(productId);
  const stockCount = db.prepare('SELECT COUNT(*) AS total FROM stock WHERE product_id = ?').get(productId);
  const variantRows = db.prepare(`
    SELECT color, price, stock
    FROM product_variants
    WHERE product_id = ?
    ORDER BY color
  `).all(productId);
  const priceHistoryCount = db.prepare('SELECT COUNT(*) AS total FROM price_history WHERE product_id = ?').get(productId);
  const movementCount = db.prepare('SELECT COUNT(*) AS total FROM movements WHERE product_id = ?').get(productId);
  const metadataRows = db.prepare(`
    SELECT kind, value
    FROM product_catalog_metadata
    WHERE value IN (${metadataValues.map(() => '?').join(', ')})
    ORDER BY kind, value
  `).all(...metadataValues);

  return {
    product: normalizeProduct(product),
    lifecycle: {
      isArchived: Number(product?.is_archived ?? 0) === 1,
      isDeleted: Number(product?.is_deleted ?? 0) === 1,
      archivedAtPresent: !!product?.archived_at,
      deletedAtPresent: !!product?.deleted_at,
      lastUpdated: normalizeTimestamp(product?.last_updated)
    },
    stockCount: Number(stockCount?.total ?? 0),
    variantRows: normalizeVariantRows(variantRows),
    priceHistoryCount: Number(priceHistoryCount?.total ?? 0),
    movementCount: Number(movementCount?.total ?? 0),
    metadataRows: normalizeMetadataRows(metadataRows)
  };
};

const getSqliteDomainState = (db, productId, reference, colorForHistory, movementIds, metadataValues) => {
  const inventory = getInventoryResponse(db);
  return {
    activeProduct: normalizeProduct(listProducts(db).find((row) => row.reference === reference) ?? null),
    archivedProduct: normalizeProduct(listArchivedProducts(db).find((row) => row.reference === reference) ?? null),
    metadata: normalizeMetadata(getProductMetadata(db)),
    stockRows: normalizeStockRows(getStockRows(db).filter((row) => row.product_id === productId)),
    stockItem: normalizeStockItem(buildStockItems(db).find((item) => item.id === productId) ?? null),
    inventoryItem: normalizeInventoryItem((inventory?.items ?? []).find((item) => item.product?.id === productId) ?? null),
    inventoryTotalValue: roundNumber(inventory?.totalValue),
    movements: normalizeMovementList(listMovementsSqlite(db).filter((row) => movementIds.includes(row.id))),
    priceHistory: normalizePriceHistory(getPriceHistorySqlite(db, productId, colorForHistory)),
    direct: getSqliteDirectState(db, productId, metadataValues)
  };
};

const getPostgresDirectState = async (productId, metadataValues) => {
  const productResult = await query(
    `
      SELECT reference, label, description, category, serie, unit, low_stock_threshold, price_ttc,
             is_archived, is_deleted, archived_at, deleted_at, last_updated
      FROM products
      WHERE id = $1
      LIMIT 1
    `,
    [productId]
  );
  const stockCount = await query('SELECT COUNT(*)::int AS total FROM stock WHERE product_id = $1', [productId]);
  const variantRows = await query(
    `
      SELECT color, price, stock
      FROM product_variants
      WHERE product_id = $1
      ORDER BY color
    `,
    [productId]
  );
  const priceHistoryCount = await query('SELECT COUNT(*)::int AS total FROM price_history WHERE product_id = $1', [productId]);
  const movementCount = await query('SELECT COUNT(*)::int AS total FROM movements WHERE product_id = $1', [productId]);
  const metadataRows = await query(
    `
      SELECT kind, value
      FROM product_catalog_metadata
      WHERE value = ANY($1::text[])
      ORDER BY kind, value
    `,
    [metadataValues]
  );

  const product = productResult.rows[0] ?? null;
  return {
    product: normalizeProduct(product),
    lifecycle: {
      isArchived: Boolean(product?.is_archived),
      isDeleted: Boolean(product?.is_deleted),
      archivedAtPresent: !!product?.archived_at,
      deletedAtPresent: !!product?.deleted_at,
      lastUpdated: normalizeTimestamp(product?.last_updated)
    },
    stockCount: Number(stockCount.rows[0]?.total ?? 0),
    variantRows: normalizeVariantRows(variantRows.rows),
    priceHistoryCount: Number(priceHistoryCount.rows[0]?.total ?? 0),
    movementCount: Number(movementCount.rows[0]?.total ?? 0),
    metadataRows: normalizeMetadataRows(metadataRows.rows)
  };
};

const getPostgresDomainState = async (baseUrl, authHeaders, productId, reference, colorForHistory, movementIds, metadataValues) => {
  const request = async (route, options = {}) => {
    const response = await fetch(`${baseUrl}${route}`, options);
    const text = await response.text();
    let body;
    try {
      body = text ? JSON.parse(text) : null;
    } catch (_error) {
      body = text;
    }
    return { response, body };
  };

  const activeProductsResponse = await request('/api/products', { headers: authHeaders });
  const archivedProductsResponse = await request('/api/products/archived', { headers: authHeaders });
  const metadataResponse = await request('/api/products/metadata', { headers: authHeaders });
  const stockRowsResponse = await request('/api/stock', { headers: authHeaders });
  const stockItemsResponse = await request('/api/stock/items', { headers: authHeaders });
  const inventoryResponse = await request('/api/inventory', { headers: authHeaders });
  const movementsResponse = await request('/api/movements', { headers: authHeaders });
  const priceHistoryResponse = await request(`/api/products/${encodeURIComponent(productId)}/price-history?color=${encodeURIComponent(colorForHistory)}`, { headers: authHeaders });

  [
    ['GET /api/products', activeProductsResponse],
    ['GET /api/products/archived', archivedProductsResponse],
    ['GET /api/products/metadata', metadataResponse],
    ['GET /api/stock', stockRowsResponse],
    ['GET /api/stock/items', stockItemsResponse],
    ['GET /api/inventory', inventoryResponse],
    ['GET /api/movements', movementsResponse],
    ['GET /api/products/:id/price-history', priceHistoryResponse]
  ].forEach(([label, result]) => {
    assert(
      result.response.ok,
      `${label} failed with status ${result.response.status}: ${typeof result.body === 'string' ? result.body : JSON.stringify(result.body)}`
    );
  });

  const inventory = inventoryResponse.body?.result ?? {};

  return {
    activeProduct: normalizeProduct((activeProductsResponse.body?.result ?? []).find((row) => row.reference === reference) ?? null),
    archivedProduct: normalizeProduct((archivedProductsResponse.body?.result ?? []).find((row) => row.reference === reference) ?? null),
    metadata: normalizeMetadata(metadataResponse.body?.result ?? {}),
    stockRows: normalizeStockRows((stockRowsResponse.body?.result ?? []).filter((row) => row.product_id === productId)),
    stockItem: normalizeStockItem((stockItemsResponse.body?.result ?? []).find((item) => item.id === productId) ?? null),
    inventoryItem: normalizeInventoryItem((inventory.items ?? []).find((item) => item.product?.id === productId) ?? null),
    inventoryTotalValue: roundNumber(inventory.totalValue),
    movements: normalizeMovementList((movementsResponse.body?.result ?? []).filter((row) => movementIds.includes(row.id))),
    priceHistory: normalizePriceHistory(priceHistoryResponse.body?.result ?? []),
    direct: await getPostgresDirectState(productId, metadataValues)
  };
};

const writeReport = (report) => {
  fs.mkdirSync(reportDir, { recursive: true });

  const slug = timestampSlug();
  const jsonLatestPath = path.join(reportDir, 'postgres-catalog-stock-domain.latest.json');
  const markdownLatestPath = path.join(reportDir, 'postgres-catalog-stock-domain.latest.md');
  const jsonPath = path.join(reportDir, `postgres-catalog-stock-domain.${slug}.json`);
  const markdownPath = path.join(reportDir, `postgres-catalog-stock-domain.${slug}.md`);
  const artifacts = { jsonLatestPath, markdownLatestPath, jsonPath, markdownPath };

  report.artifacts = artifacts;
  fs.writeFileSync(jsonLatestPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(markdownLatestPath, toMarkdown(report));
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(markdownPath, toMarkdown(report));
};

const toMarkdown = (report) => {
  const lines = [];
  lines.push('# PostgreSQL Catalog Stock Domain Validation');
  lines.push('');
  lines.push(`- Status: \`${report.status}\``);
  lines.push(`- Started at: \`${report.startedAt}\``);
  lines.push(`- Finished at: \`${report.finishedAt}\``);
  lines.push(`- SQLite path kept: \`${report.sqlitePath}\``);
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
  if (!report.activationPlan.length) lines.push('- No activation plan recorded.');
  lines.push('');
  lines.push('## Remaining Risks');
  lines.push('');
  report.remainingRisks.forEach((item) => lines.push(`- ${item}`));
  if (!report.remainingRisks.length) lines.push('- None identified.');
  lines.push('');
  return `${lines.join('\n')}\n`;
};

const assertStateParity = (expected, actual, label, report) => {
  const normalizedExpectedStockRows = expected.stockRows.map((row) => ({
    ...row,
    productId: actual.stockRows.find((item) => item.color === row.color)?.productId ?? row.productId
  }));
  const normalizedExpectedPriceHistory = expected.priceHistory.map((row) => ({
    color: row.color,
    oldPrice: row.oldPrice,
    newPrice: row.newPrice,
    changedBy: row.changedBy
  })).sort((a, b) => `${a.color}:${a.oldPrice}:${a.newPrice}:${a.changedBy}`.localeCompare(`${b.color}:${b.oldPrice}:${b.newPrice}:${b.changedBy}`));
  const normalizedActualPriceHistory = actual.priceHistory.map((row) => ({
    color: row.color,
    oldPrice: row.oldPrice,
    newPrice: row.newPrice,
    changedBy: row.changedBy
  })).sort((a, b) => `${a.color}:${a.oldPrice}:${a.newPrice}:${a.changedBy}`.localeCompare(`${b.color}:${b.oldPrice}:${b.newPrice}:${b.changedBy}`));

  const fields = [
    ['active product', expected.activeProduct, actual.activeProduct],
    ['archived product', expected.archivedProduct, actual.archivedProduct],
    ['metadata', expected.metadata, actual.metadata],
    ['stock rows', normalizedExpectedStockRows, actual.stockRows],
    ['stock item', expected.stockItem, actual.stockItem],
    ['inventory item', expected.inventoryItem, actual.inventoryItem],
    ['inventory total value', expected.inventoryTotalValue, actual.inventoryTotalValue],
    ['price history', normalizedExpectedPriceHistory, normalizedActualPriceHistory],
    ['movements', expected.movements.map((row) => ({ ...row, itemId: actual.direct.product?.reference ? actual.movements.find((item) => item.id === row.id)?.itemId ?? row.itemId : row.itemId })), actual.movements],
    ['direct product', expected.direct.product, actual.direct.product],
    ['direct lifecycle', expected.direct.lifecycle, actual.direct.lifecycle],
    ['direct variants', expected.direct.variantRows, actual.direct.variantRows],
    ['direct metadata rows', expected.direct.metadataRows, actual.direct.metadataRows],
    ['direct stock count', expected.direct.stockCount, actual.direct.stockCount],
    ['direct price history count', expected.direct.priceHistoryCount, actual.direct.priceHistoryCount],
    ['direct movement count', expected.direct.movementCount, actual.direct.movementCount]
  ];

  fields.forEach(([field, expectedValue, actualValue]) => {
    if (field === 'direct lifecycle') {
      const expectedLifecycle = { ...expectedValue };
      const actualLifecycle = { ...actualValue };
      delete expectedLifecycle.lastUpdated;
      delete actualLifecycle.lastUpdated;
      assert(JSON.stringify(actualLifecycle) === JSON.stringify(expectedLifecycle), `${label} parity mismatch for ${field}.`);
      report.parityChecks.push({ name: `${label} ${field}`, ok: true, detail: 'matched SQLite reference' });
      return;
    }
    assert(JSON.stringify(actualValue) === JSON.stringify(expectedValue), `${label} parity mismatch for ${field}.`);
    report.parityChecks.push({ name: `${label} ${field}`, ok: true, detail: 'matched SQLite reference' });
  });
};

async function main() {
  const sqlitePath = resolveSqlitePath();
  const realSqliteDb = new Database(sqlitePath, { readonly: true });
  const tempSqlitePath = path.join(reportDir, `tmp-catalog-stock-domain-${Date.now()}.db`);
  fs.mkdirSync(reportDir, { recursive: true });
  fs.copyFileSync(sqlitePath, tempSqlitePath);
  const tempSqliteDb = new Database(tempSqlitePath);

  const suffix = Date.now().toString(36);
  const ownerId = `catalog-stock-owner-${suffix}`;
  const ownerUsername = `catalog_stock_owner_${suffix}`;
  const ownerEmail = `catalog-stock-owner-${suffix}@example.test`;
  const ownerPassword = 'OwnerAudit#2026!';
  const ownerName = 'Catalog Stock Domain Audit';
  const reference = `PG-CSD-${suffix.slice(-8).toUpperCase()}`;
  const category = `pg-audit-csd-category-${suffix}`;
  const serie = `pg-audit-csd-serie-${suffix}`;
  const colorA = `pg-audit-csd-color-a-${suffix}`;
  const colorB = `pg-audit-csd-color-b-${suffix}`;
  const metadataValues = [category, serie, colorA, colorB];
  const movementManualId = randomUUID();
  const movementPositiveId = randomUUID();
  const movementNegativeId = randomUUID();

  const report = {
    startedAt: nowIso(),
    finishedAt: null,
    status: 'running',
    sqlitePath,
    baseUrl: null,
    routing: getDatabaseRoutingSummary(),
    activationDecision: 'pending',
    validated: [],
    sequenceChecks: [],
    parityChecks: [],
    activationPlan: [],
    remainingRisks: [],
    artifacts: null
  };

  let server;
  let actualProductId = null;

  const createPayload = {
    reference,
    label: 'PG Catalog Stock Domain Product',
    description: 'global catalog stock domain audit',
    category,
    serie,
    unit: 'piece',
    colors: [colorA],
    lowStockThreshold: 2,
    priceTtc: 12.5
  };

  const updatePayload = {
    ...createPayload,
    label: 'PG Catalog Stock Domain Product Updated',
    description: 'global catalog stock domain audit updated',
    colors: [colorA, colorB],
    lowStockThreshold: 5
  };

  const manualMovement = {
    id: movementManualId,
    itemId: null,
    reference,
    label: updatePayload.label,
    category,
    serie,
    color: colorB,
    type: 'ADJUST',
    delta: 0,
    before: 4,
    after: 4,
    reason: 'manual-note',
    at: new Date(Date.now() - 2000).toISOString()
  };

  const positiveMovement = {
    id: movementPositiveId,
    itemId: null,
    color: colorA,
    type: 'IN',
    delta: 4,
    reason: 'incoming-transfer',
    at: new Date(Date.now() - 1000).toISOString()
  };

  const negativeMovement = {
    id: movementNegativeId,
    itemId: null,
    color: colorA,
    type: 'OUT',
    delta: 10,
    reason: 'outgoing-clamp',
    at: nowIso()
  };

  const cleanup = async () => {
    await query('DELETE FROM products WHERE id = $1', [actualProductId || '']);
    await query('DELETE FROM products WHERE reference = $1', [reference]);
    await query('DELETE FROM product_catalog_metadata WHERE value = ANY($1::text[])', [metadataValues]);
    await query('DELETE FROM employees WHERE id = $1', [ownerId]);
  };

  try {
    assert(report.routing.configuredDriver === 'postgres', 'The global catalog/stock audit must run with DB_DRIVER=postgres.');
    assert(report.routing.catalogReadOptInEnabled === true, 'The global catalog/stock audit requires DB_ENABLE_POSTGRES_CATALOG_READ=1.');
    assert(report.routing.productWriteOptInEnabled === true, 'The global catalog/stock audit requires DB_ENABLE_POSTGRES_PRODUCT_WRITES=1.');
    assert(report.routing.stockWriteOptInEnabled === true, 'The global catalog/stock audit requires DB_ENABLE_POSTGRES_STOCK_WRITES=1.');

    await cleanup();

    const sqliteUser = { id: ownerId, nom: ownerName, username: ownerUsername };

    const expectedCreate = createProductSqlite(tempSqliteDb, createPayload);
    assert(expectedCreate.ok === true && expectedCreate.id, 'SQLite create reference execution failed for global audit.');
    const sqliteProductId = expectedCreate.id;
    const expectedAfterCreate = getSqliteDomainState(tempSqliteDb, sqliteProductId, reference, colorA, [], metadataValues);

    assert(updateProductSqlite(tempSqliteDb, sqliteProductId, updatePayload).ok === true, 'SQLite update reference execution failed for global audit.');
    const expectedAfterUpdate = getSqliteDomainState(tempSqliteDb, sqliteProductId, reference, colorA, [], metadataValues);

    assert(updateVariantPriceWithHistorySqlite(tempSqliteDb, sqliteProductId, colorA, 18.5, ownerUsername) === true, 'SQLite updatePrice reference execution failed.');
    assert(updateVariantPriceWithHistorySqlite(tempSqliteDb, sqliteProductId, colorA, 12.5, ownerUsername, { allowZero: true }) === true, 'SQLite restorePrice reference execution failed.');
    const expectedAfterPrice = getSqliteDomainState(tempSqliteDb, sqliteProductId, reference, colorA, [], metadataValues);

    assert(setStockQtySqlite(tempSqliteDb, sqliteProductId, colorB, 3) === true, 'SQLite setQty reference execution failed.');
    assert(incrementStockQtySqlite(tempSqliteDb, sqliteProductId, colorB, 2) === true, 'SQLite increment reference execution failed.');
    assert(incrementStockQtySqlite(tempSqliteDb, sqliteProductId, colorB, -1) === true, 'SQLite decrement reference execution failed.');
    manualMovement.itemId = sqliteProductId;
    assert(addMovementSqlite(tempSqliteDb, manualMovement, sqliteUser) === true, 'SQLite movements:add reference execution failed.');
    positiveMovement.itemId = sqliteProductId;
    negativeMovement.itemId = sqliteProductId;
    assert(applyStockMovementSqlite(tempSqliteDb, positiveMovement, sqliteUser) === true, 'SQLite positive applyMovement reference execution failed.');
    assert(applyStockMovementSqlite(tempSqliteDb, negativeMovement, sqliteUser) === true, 'SQLite negative applyMovement reference execution failed.');
    const expectedAfterMutations = getSqliteDomainState(tempSqliteDb, sqliteProductId, reference, colorA, [movementManualId, movementPositiveId, movementNegativeId], metadataValues);

    assert(archiveProductSqlite(tempSqliteDb, sqliteProductId).ok === true, 'SQLite archive reference execution failed.');
    const expectedAfterArchive = getSqliteDomainState(tempSqliteDb, sqliteProductId, reference, colorA, [movementManualId, movementPositiveId, movementNegativeId], metadataValues);

    assert(restoreProductSqlite(tempSqliteDb, sqliteProductId).ok === true, 'SQLite restore reference execution failed.');
    const expectedAfterRestore = getSqliteDomainState(tempSqliteDb, sqliteProductId, reference, colorA, [movementManualId, movementPositiveId, movementNegativeId], metadataValues);

    assert(archiveProductSqlite(tempSqliteDb, sqliteProductId).ok === true, 'SQLite re-archive reference execution failed before purge.');
    assert(purgeProductSqlite(tempSqliteDb, sqliteProductId).ok === true, 'SQLite purge reference execution failed.');
    const expectedAfterPurge = getSqliteDomainState(tempSqliteDb, sqliteProductId, reference, colorA, [movementManualId, movementPositiveId, movementNegativeId], metadataValues);

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
    assert(port, 'Unable to determine the global audit server port.');
    report.baseUrl = `http://127.0.0.1:${port}`;

    const loginResponse = await fetch(`${report.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'user-agent': 'catalog-stock-domain-audit'
      },
      body: JSON.stringify({ identity: ownerUsername, password: ownerPassword })
    });
    const loginBody = await loginResponse.json();
    assert(loginResponse.ok && loginBody?.result?.status === 'success', 'Global audit login failed.');
    const token = loginBody?.result?.token;
    assert(typeof token === 'string' && token.length > 0, 'Global audit login did not return a token.');
    report.sequenceChecks.push({ name: 'auth login', ok: true, detail: 'owner audit session created' });

    const authHeaders = {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'user-agent': 'catalog-stock-domain-audit'
    };

    const createResponse = await fetch(`${report.baseUrl}/api/products`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(createPayload)
    });
    const createBody = await createResponse.json();
    assert(createResponse.ok && createBody?.result?.ok === true, 'POST /api/products failed during global audit.');
    actualProductId = createBody.result.id;
    report.sequenceChecks.push({ name: 'create product', ok: true, detail: `id=${actualProductId}` });

    let actualState = await getPostgresDomainState(report.baseUrl, authHeaders, actualProductId, reference, colorA, [], metadataValues);
    assertStateParity(expectedAfterCreate, actualState, 'after create', report);

    const updateResponse = await fetch(`${report.baseUrl}/api/products/${encodeURIComponent(actualProductId)}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(updatePayload)
    });
    const updateBody = await updateResponse.json();
    assert(updateResponse.ok && updateBody?.result?.ok === true, 'PUT /api/products/:id failed during global audit.');
    report.sequenceChecks.push({ name: 'update product', ok: true, detail: `id=${actualProductId}` });

    actualState = await getPostgresDomainState(report.baseUrl, authHeaders, actualProductId, reference, colorA, [], metadataValues);
    assertStateParity(expectedAfterUpdate, actualState, 'after update', report);

    const updatePriceResponse = await fetch(`${report.baseUrl}/api/products/${encodeURIComponent(actualProductId)}/price`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ color: colorA, newPrice: 18.5 })
    });
    const updatePriceBody = await updatePriceResponse.json();
    assert(updatePriceResponse.ok && updatePriceBody?.result === true, 'PATCH /api/products/:id/price failed during global audit.');
    report.sequenceChecks.push({ name: 'update price', ok: true, detail: `color=${colorA}` });

    const restorePriceResponse = await fetch(`${report.baseUrl}/api/products/${encodeURIComponent(actualProductId)}/restore-price`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ color: colorA, targetPrice: 12.5 })
    });
    const restorePriceBody = await restorePriceResponse.json();
    assert(restorePriceResponse.ok && restorePriceBody?.result === true, 'POST /api/products/:id/restore-price failed during global audit.');
    report.sequenceChecks.push({ name: 'restore price', ok: true, detail: `color=${colorA}` });

    actualState = await getPostgresDomainState(report.baseUrl, authHeaders, actualProductId, reference, colorA, [], metadataValues);
    assertStateParity(expectedAfterPrice, actualState, 'after price writes', report);

    const setQtyResponse = await fetch(`${report.baseUrl}/api/stock/${encodeURIComponent(actualProductId)}/${encodeURIComponent(colorB)}/set-qty`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ qty: 3 })
    });
    const setQtyBody = await setQtyResponse.json();
    assert(setQtyResponse.ok && setQtyBody?.result === true, 'PATCH /api/stock/:productId/:color/set-qty failed during global audit.');
    report.sequenceChecks.push({ name: 'setQty', ok: true, detail: `color=${colorB} qty=3` });

    const incrementResponse = await fetch(`${report.baseUrl}/api/stock/${encodeURIComponent(actualProductId)}/${encodeURIComponent(colorB)}/increment`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ delta: 2 })
    });
    const incrementBody = await incrementResponse.json();
    assert(incrementResponse.ok && incrementBody?.result === true, 'PATCH /api/stock/:productId/:color/increment failed during global audit.');
    report.sequenceChecks.push({ name: 'increment stock', ok: true, detail: `color=${colorB} delta=2` });

    const decrementResponse = await fetch(`${report.baseUrl}/api/stock/${encodeURIComponent(actualProductId)}/${encodeURIComponent(colorB)}/decrement`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ delta: 1 })
    });
    const decrementBody = await decrementResponse.json();
    assert(decrementResponse.ok && decrementBody?.result === true, 'PATCH /api/stock/:productId/:color/decrement failed during global audit.');
    report.sequenceChecks.push({ name: 'decrement stock', ok: true, detail: `color=${colorB} delta=1` });

    manualMovement.itemId = actualProductId;
    const manualMovementResponse = await fetch(`${report.baseUrl}/api/movements`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(manualMovement)
    });
    const manualMovementBody = await manualMovementResponse.json();
    assert(manualMovementResponse.ok && manualMovementBody?.result === true, 'POST /api/movements failed during global audit.');
    report.sequenceChecks.push({ name: 'add movement history', ok: true, detail: `id=${movementManualId}` });

    positiveMovement.itemId = actualProductId;
    const positiveApplyResponse = await fetch(`${report.baseUrl}/api/stock/movements`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(positiveMovement)
    });
    const positiveApplyBody = await positiveApplyResponse.json();
    assert(positiveApplyResponse.ok && positiveApplyBody?.result === true, 'POST /api/stock/movements positive failed during global audit.');
    report.sequenceChecks.push({ name: 'applyMovement positive', ok: true, detail: `id=${movementPositiveId}` });

    negativeMovement.itemId = actualProductId;
    const negativeApplyResponse = await fetch(`${report.baseUrl}/api/stock/movements`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(negativeMovement)
    });
    const negativeApplyBody = await negativeApplyResponse.json();
    assert(negativeApplyResponse.ok && negativeApplyBody?.result === true, 'POST /api/stock/movements negative failed during global audit.');
    report.sequenceChecks.push({ name: 'applyMovement negative clamp', ok: true, detail: `id=${movementNegativeId}` });

    actualState = await getPostgresDomainState(report.baseUrl, authHeaders, actualProductId, reference, colorA, [movementManualId, movementPositiveId, movementNegativeId], metadataValues);
    assertStateParity(expectedAfterMutations, actualState, 'after stock and movement mutations', report);

    const archiveResponse = await fetch(`${report.baseUrl}/api/products/${encodeURIComponent(actualProductId)}/archive`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({})
    });
    const archiveBody = await archiveResponse.json();
    assert(archiveResponse.ok && archiveBody?.result?.ok === true, 'POST /api/products/:id/archive failed during global audit.');
    report.sequenceChecks.push({ name: 'archive product', ok: true, detail: `id=${actualProductId}` });

    actualState = await getPostgresDomainState(report.baseUrl, authHeaders, actualProductId, reference, colorA, [movementManualId, movementPositiveId, movementNegativeId], metadataValues);
    assertStateParity(expectedAfterArchive, actualState, 'after archive', report);

    const restoreResponse = await fetch(`${report.baseUrl}/api/products/${encodeURIComponent(actualProductId)}/restore`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({})
    });
    const restoreBody = await restoreResponse.json();
    assert(restoreResponse.ok && restoreBody?.result?.ok === true, 'POST /api/products/:id/restore failed during global audit.');
    report.sequenceChecks.push({ name: 'restore product', ok: true, detail: `id=${actualProductId}` });

    actualState = await getPostgresDomainState(report.baseUrl, authHeaders, actualProductId, reference, colorA, [movementManualId, movementPositiveId, movementNegativeId], metadataValues);
    assertStateParity(expectedAfterRestore, actualState, 'after restore', report);

    const rearchiveResponse = await fetch(`${report.baseUrl}/api/products/${encodeURIComponent(actualProductId)}/archive`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({})
    });
    const rearchiveBody = await rearchiveResponse.json();
    assert(rearchiveResponse.ok && rearchiveBody?.result?.ok === true, 'POST /api/products/:id/archive re-run failed during global audit.');
    report.sequenceChecks.push({ name: 're-archive product for purge precondition', ok: true, detail: `id=${actualProductId}` });

    const purgeResponse = await fetch(`${report.baseUrl}/api/products/${encodeURIComponent(actualProductId)}/purge`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const purgeBody = await purgeResponse.json();
    assert(purgeResponse.ok && purgeBody?.result?.ok === true, 'DELETE /api/products/:id/purge failed during global audit.');
    report.sequenceChecks.push({ name: 'purge product', ok: true, detail: `id=${actualProductId}` });

    actualState = await getPostgresDomainState(report.baseUrl, authHeaders, actualProductId, reference, colorA, [movementManualId, movementPositiveId, movementNegativeId], metadataValues);
    assertStateParity(expectedAfterPurge, actualState, 'after purge', report);

    const realSqliteProductRow = realSqliteDb.prepare('SELECT id FROM products WHERE reference = ? LIMIT 1').get(reference);
    assert(!realSqliteProductRow, 'Real SQLite products table should remain unchanged during global catalog/stock audit.');
    report.sequenceChecks.push({ name: 'sqlite isolation', ok: true, detail: `reference=${reference}` });

    const realSqliteMetadataCount = realSqliteDb.prepare(`
      SELECT COUNT(*) AS total
      FROM product_catalog_metadata
      WHERE value IN (?, ?, ?, ?)
    `).get(...metadataValues);
    assert(Number(realSqliteMetadataCount?.total ?? 0) === 0, 'Real SQLite metadata should remain unchanged during global catalog/stock audit.');

    report.validated.push('Le domaine catalogue/stock complet est coherent sur PostgreSQL en audit: lectures catalogue/stock/inventory/movements, mutations produit, historique prix, mutations stock et `stock:applyMovement` sont valides sur une meme sequence metier.');
    report.validated.push('Les relectures apres mutation, archive, restore et purge correspondent a la reference SQLite, y compris la preservation de l historique `movements` apres purge et la suppression de `stock`, `product_variants` et `price_history`.');
    report.validated.push('Le domaine peut etre active sur PostgreSQL en environnement controle sans divergence metier visible, sous reserve de garder `quotes` et `invoices` hors scope.');

    report.activationDecision = 'activable-in-controlled-environment';
    report.activationPlan.push('Sur un environnement controle, definir `DB_DRIVER=postgres`, `DB_ENABLE_POSTGRES_CATALOG_READ=1`, `DB_ENABLE_POSTGRES_PRODUCT_WRITES=1` et `DB_ENABLE_POSTGRES_STOCK_WRITES=1`.');
    report.activationPlan.push('Conserver SQLite et `DATABASE_PATH` en place pendant la premiere activation controlee pour garder le rollback simple.');
    report.activationPlan.push('Activer d abord sur staging ou sur une instance backend isolee, puis rejouer ce script global avant d ouvrir le trafic utilisateur normal.');
    report.activationPlan.push('Ne pas ouvrir encore `quotes` et `invoices`; la tranche suivante la plus sure reste ce domaine documentaire, traite separement.');

    report.status = 'completed';
  } catch (error) {
    report.status = 'failed';
    report.activationDecision = 'not-activable-yet';
    report.remainingRisks.push(error instanceof Error ? error.message : String(error));
    console.error('[audit-postgres-catalog-stock-domain] failed', error);
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
