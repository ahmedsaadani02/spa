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

const { getDatabaseRoutingSummary } = require('../../backend/src/config/database');
const { startServer, stopServer } = require('../../backend/server');
const { query, closePostgresPool } = require('../../backend/src/db/postgres');
const { hashPassword } = require('../../backend/src/services/auth-core.service');
const {
  createProduct: createProductSqlite,
  updateVariantPriceWithHistory: updateVariantPriceWithHistorySqlite
} = require('../../backend/src/repositories/sqlite/product-write.repository');
const { getPriceHistory: getPriceHistorySqlite } = require('../../backend/src/repositories/sqlite/price-history-read.repository');

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

  throw new Error('Unable to load better-sqlite3 for products price audit.');
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

const normalizeVariantRows = (rows) => rows
  .map((row) => ({
    color: row.color,
    price: roundNumber(row.price),
    stock: roundNumber(row.stock)
  }))
  .sort((a, b) => a.color.localeCompare(b.color));

const normalizeStockRows = (rows) => rows
  .map((row) => ({
    color: row.color,
    qty: roundNumber(row.qty)
  }))
  .sort((a, b) => a.color.localeCompare(b.color));

const normalizeSemanticHistory = (rows) => rows.map((row) => ({
  color: row.color,
  oldPrice: roundNumber(row.oldPrice ?? row.old_price),
  newPrice: roundNumber(row.newPrice ?? row.new_price),
  changedBy: row.changedBy ?? row.changed_by
}));

const getSqliteState = (db, productId, color) => {
  const product = db.prepare(`
    SELECT reference, label, price_ttc
    FROM products
    WHERE id = ?
    LIMIT 1
  `).get(productId);
  const variantRows = db.prepare(`
    SELECT color, price, stock
    FROM product_variants
    WHERE product_id = ?
    ORDER BY color
  `).all(productId);
  const stockRows = db.prepare(`
    SELECT color, qty
    FROM stock
    WHERE product_id = ?
    ORDER BY color
  `).all(productId);
  const priceHistory = getPriceHistorySqlite(db, productId, color);
  const movementsCount = db.prepare('SELECT COUNT(*) AS total FROM movements WHERE product_id = ?').get(productId);

  return {
    product: {
      reference: product?.reference ?? null,
      label: product?.label ?? null,
      priceTtc: product ? roundNumber(product.price_ttc) : null
    },
    variantRows: normalizeVariantRows(variantRows),
    stockRows: normalizeStockRows(stockRows),
    priceHistory: normalizeSemanticHistory(priceHistory),
    movementsCount: Number(movementsCount?.total ?? 0)
  };
};

const getPostgresState = async (productId, color) => {
  const productResult = await query(
    `
      SELECT reference, label, price_ttc
      FROM products
      WHERE id = $1
      LIMIT 1
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
  const stockRowsResult = await query(
    `
      SELECT color, qty
      FROM stock
      WHERE product_id = $1
      ORDER BY color
    `,
    [productId]
  );
  const priceHistoryResult = await query(
    `
      SELECT color, old_price, new_price, changed_by
      FROM price_history
      WHERE product_id = $1 AND color = $2
      ORDER BY changed_at DESC, id DESC
    `,
    [productId, color]
  );
  const movementsCountResult = await query('SELECT COUNT(*)::int AS total FROM movements WHERE product_id = $1', [productId]);

  const product = productResult.rows[0] ?? null;

  return {
    product: {
      reference: product?.reference ?? null,
      label: product?.label ?? null,
      priceTtc: product ? roundNumber(product.price_ttc) : null
    },
    variantRows: normalizeVariantRows(variantRowsResult.rows),
    stockRows: normalizeStockRows(stockRowsResult.rows),
    priceHistory: normalizeSemanticHistory(priceHistoryResult.rows),
    movementsCount: Number(movementsCountResult.rows[0]?.total ?? 0)
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
  const jsonLatestPath = path.join(reportDir, 'postgres-products-price-write.latest.json');
  const markdownLatestPath = path.join(reportDir, 'postgres-products-price-write.latest.md');
  const jsonPath = path.join(reportDir, `postgres-products-price-write.${slug}.json`);
  const markdownPath = path.join(reportDir, `postgres-products-price-write.${slug}.md`);
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
  lines.push('# PostgreSQL Products Price Write Validation');
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
  lines.push('## Minimal Side Effects');
  lines.push('');
  report.minimalSideEffects.forEach((item) => lines.push(`- ${item.name}: ${item.ok ? 'ok' : 'failed'}${item.detail ? ` (${item.detail})` : ''}`));
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
  const tempSqlitePath = path.join(reportDir, `tmp-products-price-write-${Date.now()}.db`);
  fs.mkdirSync(reportDir, { recursive: true });
  fs.copyFileSync(sqlitePath, tempSqlitePath);
  const tempSqliteDb = new Database(tempSqlitePath);

  const suffix = Date.now().toString(36);
  const ownerId = `products-price-owner-${suffix}`;
  const ownerUsername = `products_price_owner_${suffix}`;
  const ownerEmail = `products-price-owner-${suffix}@example.test`;
  const ownerPassword = 'OwnerAudit#2026!';
  const reference = `PG-PRICE-${suffix.slice(-8).toUpperCase()}`;
  const category = `pg-audit-price-category-${suffix}`;
  const serie = `pg-audit-price-serie-${suffix}`;
  const colorA = `pg-audit-price-color-a-${suffix}`;
  const colorB = `pg-audit-price-color-b-${suffix}`;
  const metadataValues = [category, serie, colorA, colorB];

  const report = {
    startedAt: nowIso(),
    finishedAt: null,
    status: 'running',
    sqlitePath,
    baseUrl: null,
    routing: getDatabaseRoutingSummary(),
    writeCartography: [
      '`products:updatePrice` garantit une ligne `product_variants` pour la couleur cible, met a jour son prix, ajoute une entree `price_history`, puis recalcule `products.price_ttc` comme moyenne des prix de variantes non nuls.',
      '`products:restorePrice` repasse par la meme logique, mais accepte un prix cible a zero pour rejouer un prix historise sans bloquer la validation.',
      'Cette tranche ne doit pas modifier `stock.qty`, ne doit pas creer de `movements`, et ne migre toujours pas les ecritures `stock/movements` completes.'
    ],
    validated: [],
    httpChecks: [],
    parityChecks: [],
    minimalSideEffects: [],
    sqliteIsolationChecks: [],
    remainingRisks: [],
    artifacts: null
  };

  let server;
  let actualProductId = null;

  const createPayload = {
    reference,
    label: 'PG Audit Price Product',
    description: 'price audit for postgres variant history',
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
    assert(report.routing.configuredDriver === 'postgres', 'The products price write audit must run with DB_DRIVER=postgres.');
    assert(report.routing.catalogReadOptInEnabled === true, 'The products price write audit requires DB_ENABLE_POSTGRES_CATALOG_READ=1.');
    assert(report.routing.productWriteOptInEnabled === true, 'The products price write audit requires DB_ENABLE_POSTGRES_PRODUCT_WRITES=1.');
    assert(report.routing.activePostgresScopes.includes('products-structure-write'), 'Products create scope is required for this audit setup.');
    assert(report.routing.activePostgresScopes.includes('products-price-write'), 'Products price write scope is not routed to PostgreSQL.');
    assert(report.routing.activePostgresScopes.includes('price-history-read'), 'Price history read scope must be enabled during this audit.');

    await cleanup();

    const tempCreateResult = createProductSqlite(tempSqliteDb, createPayload);
    assert(tempCreateResult.ok === true && tempCreateResult.id, 'SQLite createProduct reference execution failed for price audit.');

    const tempUpdatePriceResult = updateVariantPriceWithHistorySqlite(
      tempSqliteDb,
      tempCreateResult.id,
      colorA,
      18.75,
      ownerUsername
    );
    assert(tempUpdatePriceResult === true, 'SQLite updatePrice reference execution failed for audit.');
    const expectedAfterUpdate = getSqliteState(tempSqliteDb, tempCreateResult.id, colorA);

    const tempRestorePriceResult = updateVariantPriceWithHistorySqlite(
      tempSqliteDb,
      tempCreateResult.id,
      colorA,
      0,
      ownerUsername,
      { allowZero: true }
    );
    assert(tempRestorePriceResult === true, 'SQLite restorePrice reference execution failed for audit.');
    const expectedAfterRestore = getSqliteState(tempSqliteDb, tempCreateResult.id, colorA);

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
      [ownerId, 'Products Price Audit', ownerUsername, ownerEmail, hashPassword(ownerPassword), nowIso()]
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
        'user-agent': 'products-price-audit'
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
      'user-agent': 'products-price-audit'
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
        newPrice: 18.75,
        changedBy: ownerUsername
      })
    });
    assert(updatePriceResponse.response.ok, `PATCH /api/products/:id/price HTTP status was ${updatePriceResponse.response.status}.`);
    assert(updatePriceResponse.body?.result === true, 'PATCH /api/products/:id/price did not return result=true.');
    report.httpChecks.push({ name: 'PATCH /api/products/:id/price', ok: true, detail: `color=${colorA} newPrice=18.75` });

    const actualAfterUpdate = await getPostgresState(actualProductId, colorA);
    assert(JSON.stringify(actualAfterUpdate.product) === JSON.stringify(expectedAfterUpdate.product), 'PostgreSQL product state after updatePrice does not match SQLite parity.');
    report.parityChecks.push({ name: 'updatePrice product parity', ok: true, detail: `priceTtc=${expectedAfterUpdate.product.priceTtc}` });
    assert(JSON.stringify(actualAfterUpdate.variantRows) === JSON.stringify(expectedAfterUpdate.variantRows), 'PostgreSQL product_variants after updatePrice do not match SQLite parity.');
    report.parityChecks.push({ name: 'updatePrice product_variants parity', ok: true, detail: `rows=${expectedAfterUpdate.variantRows.length}` });
    assert(JSON.stringify(actualAfterUpdate.stockRows) === JSON.stringify(expectedAfterUpdate.stockRows), 'PostgreSQL stock rows after updatePrice do not match SQLite parity.');
    report.parityChecks.push({ name: 'updatePrice stock parity', ok: true, detail: `rows=${expectedAfterUpdate.stockRows.length}` });
    assert(JSON.stringify(actualAfterUpdate.priceHistory) === JSON.stringify(expectedAfterUpdate.priceHistory), 'PostgreSQL price_history semantics after updatePrice do not match SQLite parity.');
    report.parityChecks.push({ name: 'updatePrice price_history parity', ok: true, detail: `entries=${expectedAfterUpdate.priceHistory.length}` });

    const historyAfterUpdateResponse = await request(
      report.baseUrl,
      `/api/products/${encodeURIComponent(actualProductId)}/price-history?color=${encodeURIComponent(colorA)}`,
      {
        headers: {
          authorization: `Bearer ${token}`,
          'user-agent': 'products-price-audit'
        }
      }
    );
    assert(historyAfterUpdateResponse.response.ok, `GET /api/products/:id/price-history after updatePrice HTTP status was ${historyAfterUpdateResponse.response.status}.`);
    assert(
      JSON.stringify(normalizeSemanticHistory(historyAfterUpdateResponse.body?.result ?? [])) === JSON.stringify(expectedAfterUpdate.priceHistory),
      'GET /api/products/:id/price-history after updatePrice does not match SQLite parity.'
    );
    report.httpChecks.push({ name: 'GET /api/products/:id/price-history after updatePrice', ok: true, detail: `entries=${expectedAfterUpdate.priceHistory.length}` });

    const restorePriceResponse = await request(report.baseUrl, `/api/products/${actualProductId}/restore-price`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        color: colorA,
        targetPrice: 0,
        changedBy: ownerUsername
      })
    });
    assert(restorePriceResponse.response.ok, `POST /api/products/:id/restore-price HTTP status was ${restorePriceResponse.response.status}.`);
    assert(restorePriceResponse.body?.result === true, 'POST /api/products/:id/restore-price did not return result=true.');
    report.httpChecks.push({ name: 'POST /api/products/:id/restore-price', ok: true, detail: `color=${colorA} targetPrice=0` });

    const actualAfterRestore = await getPostgresState(actualProductId, colorA);
    assert(JSON.stringify(actualAfterRestore.product) === JSON.stringify(expectedAfterRestore.product), 'PostgreSQL product state after restorePrice does not match SQLite parity.');
    report.parityChecks.push({ name: 'restorePrice product parity', ok: true, detail: `priceTtc=${expectedAfterRestore.product.priceTtc}` });
    assert(JSON.stringify(actualAfterRestore.variantRows) === JSON.stringify(expectedAfterRestore.variantRows), 'PostgreSQL product_variants after restorePrice do not match SQLite parity.');
    report.parityChecks.push({ name: 'restorePrice product_variants parity', ok: true, detail: `rows=${expectedAfterRestore.variantRows.length}` });
    assert(JSON.stringify(actualAfterRestore.stockRows) === JSON.stringify(expectedAfterRestore.stockRows), 'PostgreSQL stock rows after restorePrice do not match SQLite parity.');
    report.parityChecks.push({ name: 'restorePrice stock parity', ok: true, detail: `rows=${expectedAfterRestore.stockRows.length}` });
    assert(JSON.stringify(actualAfterRestore.priceHistory) === JSON.stringify(expectedAfterRestore.priceHistory), 'PostgreSQL price_history semantics after restorePrice do not match SQLite parity.');
    report.parityChecks.push({ name: 'restorePrice price_history parity', ok: true, detail: `entries=${expectedAfterRestore.priceHistory.length}` });

    const historyAfterRestoreResponse = await request(
      report.baseUrl,
      `/api/products/${encodeURIComponent(actualProductId)}/price-history?color=${encodeURIComponent(colorA)}`,
      {
        headers: {
          authorization: `Bearer ${token}`,
          'user-agent': 'products-price-audit'
        }
      }
    );
    assert(historyAfterRestoreResponse.response.ok, `GET /api/products/:id/price-history after restorePrice HTTP status was ${historyAfterRestoreResponse.response.status}.`);
    assert(
      JSON.stringify(normalizeSemanticHistory(historyAfterRestoreResponse.body?.result ?? [])) === JSON.stringify(expectedAfterRestore.priceHistory),
      'GET /api/products/:id/price-history after restorePrice does not match SQLite parity.'
    );
    report.httpChecks.push({ name: 'GET /api/products/:id/price-history after restorePrice', ok: true, detail: `entries=${expectedAfterRestore.priceHistory.length}` });

    assert(actualAfterRestore.stockRows.every((row) => row.qty === 0), 'Price writes should not change stock quantities.');
    report.minimalSideEffects.push({ name: 'stock qty untouched', ok: true, detail: `rows=${actualAfterRestore.stockRows.length}` });
    assert(actualAfterRestore.movementsCount === 0, 'Price writes should not create movement rows.');
    report.minimalSideEffects.push({ name: 'movements untouched', ok: true, detail: 'count=0' });

    const realSqliteProductRow = realSqliteDb.prepare('SELECT id FROM products WHERE reference = ? LIMIT 1').get(reference);
    assert(!realSqliteProductRow, 'Real SQLite products table should remain unchanged during PostgreSQL price audit.');
    report.sqliteIsolationChecks.push({ name: 'products unchanged in SQLite', ok: true, detail: `reference=${reference}` });

    const realSqliteMetadataRows = realSqliteDb.prepare(`
      SELECT COUNT(*) AS total
      FROM product_catalog_metadata
      WHERE value IN (?, ?, ?, ?)
    `).get(...metadataValues);
    assert(Number(realSqliteMetadataRows?.total ?? 0) === 0, 'Real SQLite metadata should remain unchanged during PostgreSQL price audit.');
    report.sqliteIsolationChecks.push({ name: 'metadata unchanged in SQLite', ok: true, detail: `values=${metadataValues.length}` });

    report.validated.push('`products:updatePrice` est compatible PostgreSQL pour `product_variants`, `price_history` et le recalcul de `products.price_ttc`, avec parite validee contre une execution de reference SQLite.');
    report.validated.push('`products:restorePrice` est compatible PostgreSQL sur le meme chemin metier, y compris le cas `allowZero`, avec parite validee contre SQLite.');
    report.validated.push('Les routes REST et handlers IPC restent inchanges; le routage PostgreSQL de cette tranche reste audit-only et exige `DB_DRIVER=postgres`, `DB_ENABLE_POSTGRES_CATALOG_READ=1` et `DB_ENABLE_POSTGRES_PRODUCT_WRITES=1`.');
    report.remainingRisks.push('Les ecritures `stock` et `movements` completes restent sur SQLite; le domaine catalogue/stock ne doit donc toujours pas etre active en PostgreSQL en usage normal.');
    report.remainingRisks.push('Le comportement `ensureVariantRow` est maintenant compatible PostgreSQL, mais il n a ete audite ici que sur un produit et des couleurs deja creees dans la meme session de test.');
    report.remainingRisks.push('`products:purge` reste sur SQLite; il faudra encore aligner sa gestion de `price_history`, `stock` et `product_variants` avant une bascule complete du domaine.');

    report.status = 'completed';
  } catch (error) {
    report.status = 'failed';
    report.remainingRisks.push(error instanceof Error ? error.message : String(error));
    console.error('[audit-postgres-products-price-write] failed', error);
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
