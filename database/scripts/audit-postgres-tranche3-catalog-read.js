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
const {
  listProducts,
  listArchivedProducts,
  getProductMetadata,
  getStockRows,
  buildStockItems,
  getInventoryResponse
} = require('../../backend/src/repositories/sqlite/catalog-read.repository');
const { normalizeStoredProductImageRef } = require('../../backend/src/utils/product-images');

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

  throw new Error('Unable to load better-sqlite3 for tranche 3 audit.');
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

const sortObject = (value) => {
  const entries = Object.entries(value ?? {}).sort(([a], [b]) => a.localeCompare(b));
  return Object.fromEntries(entries.map(([key, item]) => [key, roundNumber(item)]));
};

const normalizeProductRow = (row) => ({
  id: row.id,
  reference: row.reference,
  label: row.label,
  description: row.description ?? '',
  category: row.category,
  serie: row.serie,
  unit: row.unit,
  image_url: normalizeStoredProductImageRef(row.image_url) || row.image_url || null,
  low_stock_threshold: Number(row.low_stock_threshold ?? 0) || 0,
  last_updated: row.last_updated ?? null,
  price_ttc: row.price_ttc == null ? null : roundNumber(row.price_ttc),
  archived_at: row.archived_at ?? null,
  colors: Array.isArray(row.colors) ? [...row.colors].sort((a, b) => a.localeCompare(b)) : undefined
});

const normalizeProducts = (rows) => rows
  .map(normalizeProductRow)
  .sort((a, b) => a.id.localeCompare(b.id));

const normalizeMetadata = (value) => ({
  categories: [...(value?.categories ?? [])].sort((a, b) => a.localeCompare(b)),
  series: [...(value?.series ?? [])].sort((a, b) => a.localeCompare(b)),
  colors: [...(value?.colors ?? [])].sort((a, b) => a.localeCompare(b))
});

const normalizeStockRows = (rows) => rows
  .map((row) => ({
    product_id: row.product_id,
    color: row.color,
    qty: roundNumber(row.qty)
  }))
  .sort((a, b) => `${a.product_id}:${a.color}`.localeCompare(`${b.product_id}:${b.color}`));

const normalizeStockItems = (items) => items
  .map((item) => ({
    id: item.id,
    reference: item.reference,
    label: item.label,
    description: item.description ?? '',
    category: item.category,
    serie: item.serie,
    unit: item.unit,
    imageUrl: item.imageUrl ?? null,
    quantities: sortObject(item.quantities),
    lowStockThreshold: Number(item.lowStockThreshold ?? 0) || 0,
    lastUpdated: item.lastUpdated ?? null
  }))
  .sort((a, b) => a.id.localeCompare(b.id));

const normalizeInventory = (value) => ({
  items: (value?.items ?? []).map((item) => ({
    product: {
      id: item.product?.id,
      reference: item.product?.reference,
      label: item.product?.label,
      description: item.product?.description ?? '',
      category: item.product?.category,
      serie: item.product?.serie,
      unit: item.product?.unit,
      imageUrl: item.product?.imageUrl ?? null,
      lowStockThreshold: Number(item.product?.lowStockThreshold ?? 0) || 0,
      lastUpdated: item.product?.lastUpdated ?? null,
      priceTtc: item.product?.priceTtc == null ? null : roundNumber(item.product.priceTtc)
    },
    qtyBlanc: roundNumber(item.qtyBlanc),
    qtyGris: roundNumber(item.qtyGris),
    qtyNoir: roundNumber(item.qtyNoir),
    qtyTotal: roundNumber(item.qtyTotal),
    quantityByColor: sortObject(item.quantityByColor),
    unitPrice: roundNumber(item.unitPrice),
    priceByColor: sortObject(item.priceByColor),
    valueByColor: sortObject(item.valueByColor),
    totalValue: roundNumber(item.totalValue),
    priceStatus: item.priceStatus
  })).sort((a, b) => a.product.id.localeCompare(b.product.id)),
  totalValue: roundNumber(value?.totalValue)
});

const writeReport = (report) => {
  fs.mkdirSync(reportDir, { recursive: true });

  const slug = timestampSlug();
  const jsonLatestPath = path.join(reportDir, 'postgres-tranche3-catalog-read.latest.json');
  const markdownLatestPath = path.join(reportDir, 'postgres-tranche3-catalog-read.latest.md');
  const jsonPath = path.join(reportDir, `postgres-tranche3-catalog-read.${slug}.json`);
  const markdownPath = path.join(reportDir, `postgres-tranche3-catalog-read.${slug}.md`);
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

  return artifacts;
};

const toMarkdown = (report) => {
  const lines = [];
  lines.push('# PostgreSQL Tranche 3 Catalog Read Validation');
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
  lines.push('## PostgreSQL Counts');
  lines.push('');
  report.postgresChecks.forEach((item) => lines.push(`- ${item.name}: ${item.ok ? 'ok' : 'failed'}${item.detail ? ` (${item.detail})` : ''}`));
  lines.push('');
  lines.push('## Runtime Paths');
  lines.push('');
  report.runtimePaths.forEach((item) => lines.push(`- ${item.scope}: ${item.path}`));
  lines.push('');
  lines.push('## Remaining Risks');
  lines.push('');
  report.remainingRisks.forEach((item) => lines.push(`- ${item}`));
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
  const sqlitePath = resolveSqlitePath();
  const sqliteDb = new Database(sqlitePath, { readonly: true });
  const suffix = Date.now().toString(36);
  const ownerId = `tranche3-owner-${suffix}`;
  const ownerUsername = `tranche3_owner_${suffix}`;
  const ownerEmail = `tranche3-owner-${suffix}@example.test`;
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
    postgresChecks: [],
    runtimePaths: [
      {
        scope: 'products read',
        path: 'products.service/products.handlers -> catalog-read.runtime.repository -> postgres/catalog-read.repository when scope products-read is active'
      },
      {
        scope: 'stock read',
        path: 'stock.service/stock.handlers -> catalog-read.runtime.repository -> postgres/catalog-read.repository when scope stock-read is active'
      },
      {
        scope: 'inventory read',
        path: 'inventory.service/inventory.handlers -> catalog-read.runtime.repository -> postgres/catalog-read.repository when scope stock-read is active'
      }
    ],
    remainingRisks: [],
    outOfScope: [
      'products create/update/archive/restore/purge',
      'stock setQty/increment/decrement/applyMovement',
      'movements writes',
      'quotes',
      'invoices'
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
    assert(report.routing.configuredDriver === 'postgres', 'The tranche 3 audit must run with DB_DRIVER=postgres.');
    assert(report.routing.activePostgresScopes.includes('products-read'), 'Products read scope is not routed to PostgreSQL.');
    assert(report.routing.activePostgresScopes.includes('stock-read'), 'Stock read scope is not routed to PostgreSQL.');

    const sqliteExpected = {
      products: normalizeProducts(listProducts(sqliteDb)),
      archivedProducts: normalizeProducts(listArchivedProducts(sqliteDb)),
      metadata: normalizeMetadata(getProductMetadata(sqliteDb)),
      stockRows: normalizeStockRows(getStockRows(sqliteDb)),
      stockItems: normalizeStockItems(buildStockItems(sqliteDb)),
      inventory: normalizeInventory(getInventoryResponse(sqliteDb))
    };

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
      [ownerId, 'Tranche 3 Owner Audit', ownerUsername, ownerEmail, hashPassword(ownerPassword), nowIso()]
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
        'user-agent': 'tranche3-catalog-read-audit'
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

    const authHeaders = {
      authorization: `Bearer ${token}`,
      'user-agent': 'tranche3-catalog-read-audit'
    };

    const productsResponse = await request(report.baseUrl, '/api/products', { headers: authHeaders });
    assert(productsResponse.response.ok, `/api/products HTTP status was ${productsResponse.response.status}.`);
    const productsActual = normalizeProducts(productsResponse.body?.result ?? []);
    report.httpChecks.push({ name: 'GET /api/products', ok: true, detail: `count=${productsActual.length}` });

    const archivedProductsResponse = await request(report.baseUrl, '/api/products/archived', { headers: authHeaders });
    assert(archivedProductsResponse.response.ok, `/api/products/archived HTTP status was ${archivedProductsResponse.response.status}.`);
    const archivedProductsActual = normalizeProducts(archivedProductsResponse.body?.result ?? []);
    report.httpChecks.push({ name: 'GET /api/products/archived', ok: true, detail: `count=${archivedProductsActual.length}` });

    const metadataResponse = await request(report.baseUrl, '/api/products/metadata', { headers: authHeaders });
    assert(metadataResponse.response.ok, `/api/products/metadata HTTP status was ${metadataResponse.response.status}.`);
    const metadataActual = normalizeMetadata(metadataResponse.body?.result ?? {});
    report.httpChecks.push({ name: 'GET /api/products/metadata', ok: true, detail: `categories=${metadataActual.categories.length}, series=${metadataActual.series.length}, colors=${metadataActual.colors.length}` });

    const stockRowsResponse = await request(report.baseUrl, '/api/stock', { headers: authHeaders });
    assert(stockRowsResponse.response.ok, `/api/stock HTTP status was ${stockRowsResponse.response.status}.`);
    const stockRowsActual = normalizeStockRows(stockRowsResponse.body?.result ?? []);
    report.httpChecks.push({ name: 'GET /api/stock', ok: true, detail: `count=${stockRowsActual.length}` });

    const stockItemsResponse = await request(report.baseUrl, '/api/stock/items', { headers: authHeaders });
    assert(stockItemsResponse.response.ok, `/api/stock/items HTTP status was ${stockItemsResponse.response.status}.`);
    const stockItemsActual = normalizeStockItems(stockItemsResponse.body?.result ?? []);
    report.httpChecks.push({ name: 'GET /api/stock/items', ok: true, detail: `count=${stockItemsActual.length}` });

    const inventoryResponse = await request(report.baseUrl, '/api/inventory', { headers: authHeaders });
    assert(inventoryResponse.response.ok, `/api/inventory HTTP status was ${inventoryResponse.response.status}.`);
    const inventoryActual = normalizeInventory(inventoryResponse.body?.result ?? {});
    report.httpChecks.push({ name: 'GET /api/inventory', ok: true, detail: `items=${inventoryActual.items.length}` });

    assert(JSON.stringify(productsActual) === JSON.stringify(sqliteExpected.products), 'Products read parity mismatch between PostgreSQL runtime and SQLite.');
    report.parityChecks.push({ name: 'products list parity', ok: true, detail: `count=${productsActual.length}` });

    assert(JSON.stringify(archivedProductsActual) === JSON.stringify(sqliteExpected.archivedProducts), 'Archived products parity mismatch between PostgreSQL runtime and SQLite.');
    report.parityChecks.push({ name: 'products archived parity', ok: true, detail: `count=${archivedProductsActual.length}` });

    assert(JSON.stringify(metadataActual) === JSON.stringify(sqliteExpected.metadata), 'Product metadata parity mismatch between PostgreSQL runtime and SQLite.');
    report.parityChecks.push({ name: 'products metadata parity', ok: true });

    assert(JSON.stringify(stockRowsActual) === JSON.stringify(sqliteExpected.stockRows), 'Stock rows parity mismatch between PostgreSQL runtime and SQLite.');
    report.parityChecks.push({ name: 'stock rows parity', ok: true, detail: `count=${stockRowsActual.length}` });

    assert(JSON.stringify(stockItemsActual) === JSON.stringify(sqliteExpected.stockItems), 'Stock items parity mismatch between PostgreSQL runtime and SQLite.');
    report.parityChecks.push({ name: 'stock items parity', ok: true, detail: `count=${stockItemsActual.length}` });

    assert(JSON.stringify(inventoryActual) === JSON.stringify(sqliteExpected.inventory), 'Inventory parity mismatch between PostgreSQL runtime and SQLite.');
    report.parityChecks.push({ name: 'inventory parity', ok: true, detail: `totalValue=${inventoryActual.totalValue}` });

    const activeProductsCount = await query('SELECT COUNT(*)::int AS total FROM products WHERE is_archived = FALSE AND is_deleted = FALSE');
    const archivedProductsCount = await query('SELECT COUNT(*)::int AS total FROM products WHERE is_archived = TRUE AND is_deleted = FALSE');
    const stockRowsCount = await query('SELECT COUNT(*)::int AS total FROM stock');

    assert(Number(activeProductsCount.rows[0]?.total ?? 0) === productsActual.length, 'PostgreSQL active products count does not match HTTP products count.');
    assert(Number(archivedProductsCount.rows[0]?.total ?? 0) === archivedProductsActual.length, 'PostgreSQL archived products count does not match HTTP archived products count.');
    assert(Number(stockRowsCount.rows[0]?.total ?? 0) === stockRowsActual.length, 'PostgreSQL stock rows count does not match HTTP stock count.');

    report.postgresChecks.push({ name: 'active products count', ok: true, detail: `count=${productsActual.length}` });
    report.postgresChecks.push({ name: 'archived products count', ok: true, detail: `count=${archivedProductsActual.length}` });
    report.postgresChecks.push({ name: 'stock rows count', ok: true, detail: `count=${stockRowsActual.length}` });

    report.validated.push('La lecture catalogue `products` est compatible PostgreSQL et restitue le meme resultat que SQLite pour la liste active, les archives et les metadonnees.');
    report.validated.push('La lecture `stock` est compatible PostgreSQL en mode read-only pour les lignes brutes et la vue enrichie `/api/stock/items`.');
    report.validated.push('La lecture `inventory` est compatible PostgreSQL en mode read-only avec la meme valorisation et les memes quantites que SQLite.');
    report.validated.push('Les routes REST et les handlers IPC restent inchanges cote contrat, avec un routage PostgreSQL uniquement sur les lectures tranche 3.');

    report.remainingRisks.push('Les ecritures `products`, `stock` et `movements` restent volontairement sur SQLite; la tranche 3 ne couvre pas ces mutations.');
    report.remainingRisks.push('Le backend reste hybride: `products-read` et `stock-read` peuvent lire PostgreSQL, tandis que les mutations catalogue/stock et les documents metier restent sur SQLite.');
    report.remainingRisks.push('Les domaines `quotes` et `invoices` ne sont pas touches par cette tranche et restent entierement sur SQLite.');
    report.remainingRisks.push('Cette validation prouve la parite de lecture, mais pas encore les scenarios de concurrence ou de double-ecriture entre SQLite et PostgreSQL.');

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
    console.log('[tranche3-catalog-read-audit] JSON report:', report.artifacts.jsonLatestPath);
    console.log('[tranche3-catalog-read-audit] Markdown report:', report.artifacts.markdownLatestPath);
    await closePostgresPool();
  }
}

main().catch((error) => {
  console.error('[tranche3-catalog-read-audit] Validation failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
