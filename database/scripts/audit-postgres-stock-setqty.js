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

const { getDatabaseRoutingSummary } = require('../../backend/src/config/database');
const { startServer, stopServer } = require('../../backend/server');
const { query, closePostgresPool } = require('../../backend/src/db/postgres');
const { hashPassword } = require('../../backend/src/services/auth-core.service');
const { createProduct: createProductSqlite } = require('../../backend/src/repositories/sqlite/product-write.repository');
const { setStockQty: setStockQtySqlite } = require('../../backend/src/repositories/sqlite/stock-write.repository');

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

  throw new Error('Unable to load better-sqlite3 for stock:setQty audit.');
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

const getSqliteState = (db, productId) => {
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
  const movementsCount = db.prepare('SELECT COUNT(*) AS total FROM movements WHERE product_id = ?').get(productId);

  return {
    product: {
      reference: product?.reference ?? null,
      label: product?.label ?? null,
      priceTtc: product ? roundNumber(product.price_ttc) : null,
      lastUpdated: product?.last_updated ?? null
    },
    stockRows: normalizeStockRows(stockRows),
    variantRows: normalizeVariantRows(variantRows),
    movementsCount: Number(movementsCount?.total ?? 0)
  };
};

const getPostgresState = async (productId) => {
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
  const movementsCountResult = await query('SELECT COUNT(*)::int AS total FROM movements WHERE product_id = $1', [productId]);

  const product = productResult.rows[0] ?? null;
  return {
    product: {
      reference: product?.reference ?? null,
      label: product?.label ?? null,
      priceTtc: product ? roundNumber(product.price_ttc) : null,
      lastUpdated: product?.last_updated ?? null
    },
    stockRows: normalizeStockRows(stockRowsResult.rows),
    variantRows: normalizeVariantRows(variantRowsResult.rows),
    movementsCount: Number(movementsCountResult.rows[0]?.total ?? 0)
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
  const jsonLatestPath = path.join(reportDir, 'postgres-stock-setqty.latest.json');
  const markdownLatestPath = path.join(reportDir, 'postgres-stock-setqty.latest.md');
  const jsonPath = path.join(reportDir, `postgres-stock-setqty.${slug}.json`);
  const markdownPath = path.join(reportDir, `postgres-stock-setqty.${slug}.md`);
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
  lines.push('# PostgreSQL Stock SetQty Validation');
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
  const tempSqlitePath = path.join(reportDir, `tmp-stock-setqty-${Date.now()}.db`);
  fs.mkdirSync(reportDir, { recursive: true });
  fs.copyFileSync(sqlitePath, tempSqlitePath);
  const tempSqliteDb = new Database(tempSqlitePath);

  const suffix = Date.now().toString(36);
  const ownerId = `stock-setqty-owner-${suffix}`;
  const ownerUsername = `stock_setqty_owner_${suffix}`;
  const ownerEmail = `stock-setqty-owner-${suffix}@example.test`;
  const ownerPassword = 'OwnerAudit#2026!';
  const reference = `PG-STOCK-${suffix.slice(-8).toUpperCase()}`;
  const category = `pg-audit-stock-category-${suffix}`;
  const serie = `pg-audit-stock-serie-${suffix}`;
  const colorA = `pg-audit-stock-color-a-${suffix}`;
  const colorB = `pg-audit-stock-color-b-${suffix}`;
  const metadataValues = [category, serie, colorA, colorB];
  const targetQty = 7.25;

  const report = {
    startedAt: nowIso(),
    finishedAt: null,
    status: 'running',
    sqlitePath,
    baseUrl: null,
    routing: getDatabaseRoutingSummary(),
    writeCartography: [
      '`stock:setQty` upsert `stock.qty` pour le produit/couleur cible.',
      '`stock:setQty` synchronise `product_variants.stock` sans toucher au prix existant; si la variante n existe pas encore, elle prend comme fallback le prix courant du produit.',
      '`stock:setQty` met a jour `products.last_updated` et ne cree pas d entree `movements`.'
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
    label: 'PG Audit Stock SetQty Product',
    description: 'stock setQty audit',
    category,
    serie,
    unit: 'piece',
    colors: [colorA, colorB],
    lowStockThreshold: 2,
    priceTtc: 12.5
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
    assert(report.routing.configuredDriver === 'postgres', 'The stock:setQty audit must run with DB_DRIVER=postgres.');
    assert(report.routing.catalogReadOptInEnabled === true, 'The stock:setQty audit requires DB_ENABLE_POSTGRES_CATALOG_READ=1.');
    assert(report.routing.productWriteOptInEnabled === true, 'The stock:setQty audit requires DB_ENABLE_POSTGRES_PRODUCT_WRITES=1.');
    assert(report.routing.stockWriteOptInEnabled === true, 'The stock:setQty audit requires DB_ENABLE_POSTGRES_STOCK_WRITES=1.');
    assert(report.routing.activePostgresScopes.includes('stock-set-qty-write'), 'stock:setQty write scope is not routed to PostgreSQL.');
    assert(report.routing.activePostgresScopes.includes('stock-read'), 'stock-read scope must be enabled during this audit.');

    await cleanup();

    const expectedCreateResult = createProductSqlite(tempSqliteDb, createPayload);
    assert(expectedCreateResult.ok === true && expectedCreateResult.id, 'SQLite create reference execution failed for stock:setQty audit.');
    const expectedBefore = getSqliteState(tempSqliteDb, expectedCreateResult.id);
    assert(setStockQtySqlite(tempSqliteDb, expectedCreateResult.id, colorA, targetQty) === true, 'SQLite setStockQty reference execution failed for stock:setQty audit.');
    const expectedAfter = getSqliteState(tempSqliteDb, expectedCreateResult.id);

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
      [ownerId, 'Stock SetQty Audit', ownerUsername, ownerEmail, hashPassword(ownerPassword), nowIso()]
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
        'user-agent': 'stock-setqty-audit'
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
      'user-agent': 'stock-setqty-audit'
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

    const actualBefore = await getPostgresState(actualProductId);

    const setQtyResponse = await request(
      report.baseUrl,
      `/api/stock/${encodeURIComponent(actualProductId)}/${encodeURIComponent(colorA)}/set-qty`,
      {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ qty: targetQty })
      }
    );
    assert(setQtyResponse.response.ok, `PATCH /api/stock/:productId/:color/set-qty HTTP status was ${setQtyResponse.response.status}.`);
    assert(setQtyResponse.body?.result === true, 'PATCH /api/stock/:productId/:color/set-qty did not return result=true.');
    report.httpChecks.push({ name: 'PATCH /api/stock/:productId/:color/set-qty', ok: true, detail: `qty=${targetQty}` });

    const actualAfter = await getPostgresState(actualProductId);
    assert(JSON.stringify(actualAfter.stockRows) === JSON.stringify(expectedAfter.stockRows), 'PostgreSQL stock rows after setQty do not match SQLite parity.');
    report.parityChecks.push({ name: 'stock rows parity', ok: true, detail: `rows=${expectedAfter.stockRows.length}` });
    assert(JSON.stringify(actualAfter.variantRows) === JSON.stringify(expectedAfter.variantRows), 'PostgreSQL product_variants after setQty do not match SQLite parity.');
    report.parityChecks.push({ name: 'product_variants parity', ok: true, detail: `rows=${expectedAfter.variantRows.length}` });
    assert(actualAfter.product.reference === expectedAfter.product.reference, 'PostgreSQL product reference after setQty does not match SQLite parity.');
    assert(actualAfter.product.label === expectedAfter.product.label, 'PostgreSQL product label after setQty does not match SQLite parity.');
    assert(actualAfter.product.priceTtc === expectedAfter.product.priceTtc, 'PostgreSQL product price_ttc after setQty does not match SQLite parity.');
    report.parityChecks.push({ name: 'product semantic parity', ok: true, detail: `priceTtc=${expectedAfter.product.priceTtc}` });

    const stockRowsResponse = await request(report.baseUrl, '/api/stock', {
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'stock-setqty-audit'
      }
    });
    assert(stockRowsResponse.response.ok, `GET /api/stock HTTP status was ${stockRowsResponse.response.status}.`);
    const stockRows = normalizeStockRows((stockRowsResponse.body?.result ?? []).filter((row) => row.product_id === actualProductId));
    assert(JSON.stringify(stockRows) === JSON.stringify(expectedAfter.stockRows), 'GET /api/stock after setQty does not match SQLite parity.');
    report.httpChecks.push({ name: 'GET /api/stock after setQty', ok: true, detail: `rows=${stockRows.length}` });

    const stockItemsResponse = await request(report.baseUrl, '/api/stock/items', {
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'stock-setqty-audit'
      }
    });
    assert(stockItemsResponse.response.ok, `GET /api/stock/items HTTP status was ${stockItemsResponse.response.status}.`);
    const stockItem = normalizeStockItem((stockItemsResponse.body?.result ?? []).find((item) => item.id === actualProductId));
    assert(JSON.stringify(stockItem.quantities) === JSON.stringify({ [colorA]: roundNumber(targetQty), [colorB]: 0 }), 'GET /api/stock/items quantities after setQty do not match expected state.');
    report.httpChecks.push({ name: 'GET /api/stock/items after setQty', ok: true, detail: `reference=${reference}` });

    const movementsResponse = await request(report.baseUrl, '/api/movements', {
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'stock-setqty-audit'
      }
    });
    assert(movementsResponse.response.ok, `GET /api/movements HTTP status was ${movementsResponse.response.status}.`);
    const productMovements = (movementsResponse.body?.result ?? []).filter((row) => row?.itemId === actualProductId);
    assert(productMovements.length === 0, 'stock:setQty should not create movements rows.');
    report.httpChecks.push({ name: 'GET /api/movements after setQty', ok: true, detail: 'count=0' });

    assert(expectedBefore.product.lastUpdated !== expectedAfter.product.lastUpdated, 'SQLite reference last_updated did not change after setQty.');
    assert(actualBefore.product.lastUpdated !== actualAfter.product.lastUpdated, 'PostgreSQL last_updated did not change after setQty.');
    report.sideEffects.push({ name: 'products.last_updated updated', ok: true, detail: 'changed after setQty' });
    assert(actualAfter.movementsCount === expectedAfter.movementsCount && actualAfter.movementsCount === 0, 'setQty should not create movement rows.');
    report.sideEffects.push({ name: 'movements untouched', ok: true, detail: 'count=0' });
    assert(actualAfter.variantRows.some((row) => row.color === colorA && row.stock === roundNumber(targetQty)), 'Variant stock was not synchronized for target color.');
    report.sideEffects.push({ name: 'product_variants.stock synchronized', ok: true, detail: `color=${colorA} stock=${targetQty}` });

    const realSqliteProductRow = realSqliteDb.prepare('SELECT id FROM products WHERE reference = ? LIMIT 1').get(reference);
    assert(!realSqliteProductRow, 'Real SQLite products table should remain unchanged during PostgreSQL stock:setQty audit.');
    report.sqliteIsolationChecks.push({ name: 'products unchanged in SQLite', ok: true, detail: `reference=${reference}` });

    const realSqliteMetadataCount = realSqliteDb.prepare(`
      SELECT COUNT(*) AS total
      FROM product_catalog_metadata
      WHERE value IN (?, ?, ?, ?)
    `).get(...metadataValues);
    assert(Number(realSqliteMetadataCount?.total ?? 0) === 0, 'Real SQLite metadata should remain unchanged during PostgreSQL stock:setQty audit.');
    report.sqliteIsolationChecks.push({ name: 'metadata unchanged in SQLite', ok: true, detail: `values=${metadataValues.length}` });

    report.validated.push('`stock:setQty` est compatible PostgreSQL pour l upsert de `stock.qty`, la synchronisation de `product_variants.stock` et la mise a jour de `products.last_updated`, avec parite validee contre une execution de reference SQLite.');
    report.validated.push('`stock:setQty` ne cree pas d entree `movements`, conformement au comportement SQLite actuel.');
    report.validated.push('Les routes REST et handlers IPC restent inchanges; le routage PostgreSQL de cette sous-etape reste audit-only et exige `DB_DRIVER=postgres`, `DB_ENABLE_POSTGRES_CATALOG_READ=1`, `DB_ENABLE_POSTGRES_PRODUCT_WRITES=1` et `DB_ENABLE_POSTGRES_STOCK_WRITES=1`.');
    report.remainingRisks.push('`stock:increment` et `stock:decrement` restent sur SQLite; ils partagent une grande partie de la logique de `setQty` mais ajoutent le calcul du nouveau stock a partir de la valeur courante.');
    report.remainingRisks.push('`movements:add` et `stock:applyMovement` restent sur SQLite; le domaine catalogue/stock ne doit donc toujours pas etre active en PostgreSQL en usage normal.');
    report.remainingRisks.push('Le cas de rejet sur produit archive/supprime et le clamp des quantites negatives restent a auditer dans une sous-etape dediee si on veut couvrir tout le spectre comportemental.');

    report.status = 'completed';
  } catch (error) {
    report.status = 'failed';
    report.remainingRisks.push(error instanceof Error ? error.message : String(error));
    console.error('[audit-postgres-stock-setqty] failed', error);
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
