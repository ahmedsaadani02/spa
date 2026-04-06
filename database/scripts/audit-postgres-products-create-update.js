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
  listProducts,
  getProductMetadata,
  getStockRows,
  buildStockItems
} = require('../../backend/src/repositories/sqlite/catalog-read.repository');
const {
  createProduct: createProductSqlite,
  updateProduct: updateProductSqlite
} = require('../../backend/src/repositories/sqlite/product-write.repository');

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

  throw new Error('Unable to load better-sqlite3 for products create/update audit.');
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

const normalizeArray = (values) => [...values].sort((a, b) => a.localeCompare(b));

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
    colors: Array.isArray(row.colors) ? normalizeArray(row.colors) : undefined
  };
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

const normalizeMetadataRows = (rows) => rows
  .map((row) => ({
    kind: row.kind,
    value: row.value
  }))
  .sort((a, b) => `${a.kind}:${a.value}`.localeCompare(`${b.kind}:${b.value}`));

const normalizeStockItem = (item) => {
  if (!item) return null;
  return {
    reference: item.reference,
    label: item.label,
    category: item.category,
    serie: item.serie,
    unit: item.unit,
    lowStockThreshold: Number(item.lowStockThreshold ?? 0) || 0,
    quantities: Object.fromEntries(
      Object.entries(item.quantities ?? {})
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => [key, roundNumber(value)])
    )
  };
};

const findProductByReference = (rows, reference) => rows.find((row) => row.reference === reference) ?? null;

const getSqliteVariantRows = (db, productId) => db.prepare(`
  SELECT color, price, stock
  FROM product_variants
  WHERE product_id = ?
  ORDER BY color
`).all(productId);

const getSqliteMetadataRows = (db, values) => {
  if (!values.length) return [];
  const placeholders = values.map(() => '?').join(', ');
  return db.prepare(`
    SELECT kind, value
    FROM product_catalog_metadata
    WHERE value IN (${placeholders})
    ORDER BY kind, value
  `).all(...values);
};

const getPostgresVariantRows = async (productId) => {
  const result = await query(
    `
      SELECT color, price, stock
      FROM product_variants
      WHERE product_id = $1
      ORDER BY color
    `,
    [productId]
  );
  return result.rows;
};

const getPostgresMetadataRows = async (values) => {
  if (!values.length) return [];
  const result = await query(
    `
      SELECT kind, value
      FROM product_catalog_metadata
      WHERE value = ANY($1::text[])
      ORDER BY kind, value
    `,
    [values]
  );
  return result.rows;
};

const getExpectedViewState = (db, productId, reference, metadataValues) => ({
  product: normalizeProduct(findProductByReference(listProducts(db), reference)),
  metadata: getProductMetadata(db),
  stockRows: normalizeStockRows(getStockRows(db).filter((row) => row.product_id === productId)),
  stockItem: normalizeStockItem(buildStockItems(db).find((item) => item.id === productId) ?? null),
  variantRows: normalizeVariantRows(getSqliteVariantRows(db, productId)),
  metadataRows: normalizeMetadataRows(getSqliteMetadataRows(db, metadataValues))
});

const getActualViewState = async (productId, reference, metadataValues) => {
  const productResult = await query(
    `
      SELECT reference, label, description, category, serie, unit, low_stock_threshold, price_ttc
      FROM products
      WHERE id = $1
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
  const priceHistoryCount = await query('SELECT COUNT(*)::int AS total FROM price_history WHERE product_id = $1', [productId]);
  const movementsCount = await query('SELECT COUNT(*)::int AS total FROM movements WHERE product_id = $1', [productId]);

  return {
    product: normalizeProduct(productResult.rows[0] ?? null),
    reference,
    stockRows: normalizeStockRows(stockRowsResult.rows),
    variantRows: normalizeVariantRows(await getPostgresVariantRows(productId)),
    metadataRows: normalizeMetadataRows(await getPostgresMetadataRows(metadataValues)),
    priceHistoryCount: Number(priceHistoryCount.rows[0]?.total ?? 0),
    movementsCount: Number(movementsCount.rows[0]?.total ?? 0)
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
  const jsonLatestPath = path.join(reportDir, 'postgres-products-create-update.latest.json');
  const markdownLatestPath = path.join(reportDir, 'postgres-products-create-update.latest.md');
  const jsonPath = path.join(reportDir, `postgres-products-create-update.${slug}.json`);
  const markdownPath = path.join(reportDir, `postgres-products-create-update.${slug}.md`);
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
  lines.push('# PostgreSQL Products Create Update Validation');
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
  const tempSqlitePath = path.join(reportDir, `tmp-products-create-update-${Date.now()}.db`);
  fs.mkdirSync(reportDir, { recursive: true });
  fs.copyFileSync(sqlitePath, tempSqlitePath);
  const tempSqliteDb = new Database(tempSqlitePath);

  const suffix = Date.now().toString(36);
  const ownerId = `products-create-update-owner-${suffix}`;
  const ownerUsername = `products_create_update_owner_${suffix}`;
  const ownerEmail = `products-create-update-owner-${suffix}@example.test`;
  const ownerPassword = 'OwnerAudit#2026!';
  const createReference = `PG-CREATE-${suffix.slice(-8).toUpperCase()}`;
  const updateReference = `PG-UPDATE-${suffix.slice(-8).toUpperCase()}`;
  const createCategory = `pg-audit-category-create-${suffix}`;
  const updateCategory = `pg-audit-category-update-${suffix}`;
  const createSerie = `pg-audit-serie-create-${suffix}`;
  const updateSerie = `pg-audit-serie-update-${suffix}`;
  const colorA = `pg-audit-color-a-${suffix}`;
  const colorB = `pg-audit-color-b-${suffix}`;
  const colorC = `pg-audit-color-c-${suffix}`;
  const metadataValues = [createCategory, updateCategory, createSerie, updateSerie, colorA, colorB, colorC];

  const report = {
    startedAt: nowIso(),
    finishedAt: null,
    status: 'running',
    sqlitePath,
    baseUrl: null,
    routing: getDatabaseRoutingSummary(),
    writeCartography: [
      '`products:create` ecrit `products`, ajoute les metadata `category/serie/color`, puis cree les lignes `stock` a `qty=0` et `product_variants` a `stock=0` avec le `price_ttc` initial.',
      '`products:update` met a jour `products`, upsert les metadata `category/serie/color`, ajoute les couleurs nouvelles dans `stock` et `product_variants`, et supprime seulement les couleurs retirees quand `stock.qty` vaut encore `0`.',
      'Cette tranche ne doit pas creer de `movements` ni de `price_history`, et ne couvre toujours pas `updatePrice`, `restorePrice` ni les ecritures stock/movements completes.'
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
    reference: createReference,
    label: 'PG Audit Create Product',
    description: 'create audit for postgres minimal stock coupling',
    category: createCategory,
    serie: createSerie,
    unit: 'piece',
    colors: [colorA, colorB],
    lowStockThreshold: 3,
    priceTtc: 12.5
  };

  const updatePayload = {
    reference: updateReference,
    label: 'PG Audit Update Product',
    description: 'update audit for postgres minimal stock coupling',
    category: updateCategory,
    serie: updateSerie,
    unit: 'piece',
    colors: [colorB, colorC],
    lowStockThreshold: 7,
    priceTtc: 19.75
  };

  const request = async (baseUrl, route, options = {}) => {
    const response = await fetch(`${baseUrl}${route}`, options);
    const body = await normalizeResponseBody(response);
    return { response, body };
  };

  const cleanup = async () => {
    await query('DELETE FROM products WHERE id = $1', [actualProductId || '']);
    await query('DELETE FROM products WHERE reference IN ($1, $2)', [createReference, updateReference]);
    await query('DELETE FROM product_catalog_metadata WHERE value = ANY($1::text[])', [metadataValues]);
    await query('DELETE FROM employees WHERE id = $1', [ownerId]);
  };

  try {
    assert(report.routing.configuredDriver === 'postgres', 'The products create/update audit must run with DB_DRIVER=postgres.');
    assert(report.routing.catalogReadOptInEnabled === true, 'The products create/update audit requires DB_ENABLE_POSTGRES_CATALOG_READ=1.');
    assert(report.routing.productWriteOptInEnabled === true, 'The products create/update audit requires DB_ENABLE_POSTGRES_PRODUCT_WRITES=1.');
    assert(report.routing.activePostgresScopes.includes('products-structure-write'), 'Products create/update write scope is not routed to PostgreSQL.');
    assert(report.routing.activePostgresScopes.includes('products-read'), 'Products read scope must be enabled during this audit.');
    assert(report.routing.activePostgresScopes.includes('stock-read'), 'Stock read scope must be enabled during this audit.');

    await cleanup();

    const expectedCreateResult = createProductSqlite(tempSqliteDb, createPayload);
    assert(expectedCreateResult.ok === true && expectedCreateResult.id, 'SQLite createProduct reference execution failed for audit.');
    const expectedCreateState = getExpectedViewState(tempSqliteDb, expectedCreateResult.id, createReference, metadataValues);

    const expectedUpdateResult = updateProductSqlite(tempSqliteDb, expectedCreateResult.id, updatePayload);
    assert(expectedUpdateResult.ok === true, 'SQLite updateProduct reference execution failed for audit.');
    const expectedUpdateState = getExpectedViewState(tempSqliteDb, expectedCreateResult.id, updateReference, metadataValues);

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
      [ownerId, 'Products Create Update Audit', ownerUsername, ownerEmail, hashPassword(ownerPassword), nowIso()]
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
        'user-agent': 'products-create-update-audit'
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
      'user-agent': 'products-create-update-audit'
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

    const actualCreateState = await getActualViewState(actualProductId, createReference, metadataValues);
    assert(JSON.stringify(actualCreateState.product) === JSON.stringify(expectedCreateState.product), 'PostgreSQL create product state does not match SQLite parity.');
    report.parityChecks.push({ name: 'create product parity', ok: true, detail: `reference=${createReference}` });
    assert(JSON.stringify(actualCreateState.stockRows) === JSON.stringify(expectedCreateState.stockRows), 'PostgreSQL create stock rows do not match SQLite parity.');
    report.parityChecks.push({ name: 'create stock rows parity', ok: true, detail: `colors=${expectedCreateState.stockRows.length}` });
    assert(JSON.stringify(actualCreateState.variantRows) === JSON.stringify(expectedCreateState.variantRows), 'PostgreSQL create product_variants do not match SQLite parity.');
    report.parityChecks.push({ name: 'create product_variants parity', ok: true, detail: `colors=${expectedCreateState.variantRows.length}` });
    assert(JSON.stringify(actualCreateState.metadataRows) === JSON.stringify(expectedCreateState.metadataRows), 'PostgreSQL create metadata rows do not match SQLite parity.');
    report.parityChecks.push({ name: 'create metadata parity', ok: true, detail: `values=${expectedCreateState.metadataRows.length}` });

    const productsListAfterCreate = await request(report.baseUrl, '/api/products', {
      method: 'GET',
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'products-create-update-audit'
      }
    });
    assert(productsListAfterCreate.response.ok, `GET /api/products after create HTTP status was ${productsListAfterCreate.response.status}.`);
    const createdProductView = normalizeProduct(findProductByReference(productsListAfterCreate.body?.result ?? [], createReference));
    assert(JSON.stringify(createdProductView) === JSON.stringify(expectedCreateState.product), 'GET /api/products after create does not match SQLite parity.');
    report.httpChecks.push({ name: 'GET /api/products after create', ok: true, detail: `reference=${createReference}` });

    const stockRowsAfterCreate = await request(report.baseUrl, '/api/stock', {
      method: 'GET',
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'products-create-update-audit'
      }
    });
    assert(stockRowsAfterCreate.response.ok, `GET /api/stock after create HTTP status was ${stockRowsAfterCreate.response.status}.`);
    const createdStockRows = normalizeStockRows((stockRowsAfterCreate.body?.result ?? []).filter((row) => row.product_id === actualProductId));
    assert(JSON.stringify(createdStockRows) === JSON.stringify(expectedCreateState.stockRows), 'GET /api/stock after create does not match SQLite parity.');
    report.httpChecks.push({ name: 'GET /api/stock after create', ok: true, detail: `rows=${createdStockRows.length}` });

    const stockItemsAfterCreate = await request(report.baseUrl, '/api/stock/items', {
      method: 'GET',
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'products-create-update-audit'
      }
    });
    assert(stockItemsAfterCreate.response.ok, `GET /api/stock/items after create HTTP status was ${stockItemsAfterCreate.response.status}.`);
    const createdStockItem = normalizeStockItem((stockItemsAfterCreate.body?.result ?? []).find((item) => item.id === actualProductId));
    assert(JSON.stringify(createdStockItem) === JSON.stringify(expectedCreateState.stockItem), 'GET /api/stock/items after create does not match SQLite parity.');
    report.httpChecks.push({ name: 'GET /api/stock/items after create', ok: true, detail: `reference=${createReference}` });

    const updateResponse = await request(report.baseUrl, `/api/products/${actualProductId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(updatePayload)
    });
    assert(updateResponse.response.ok, `PUT /api/products/:id HTTP status was ${updateResponse.response.status}.`);
    assert(updateResponse.body?.result?.ok === true, 'PUT /api/products/:id did not return ok=true.');
    assert(JSON.stringify(normalizeArray(updateResponse.body?.result?.addedColors ?? [])) === JSON.stringify(normalizeArray(expectedUpdateResult.addedColors ?? [])), 'Added colors returned by PostgreSQL update do not match SQLite parity.');
    assert(JSON.stringify(normalizeArray(updateResponse.body?.result?.removedColors ?? [])) === JSON.stringify(normalizeArray(expectedUpdateResult.removedColors ?? [])), 'Removed colors returned by PostgreSQL update do not match SQLite parity.');
    report.httpChecks.push({
      name: 'PUT /api/products/:id',
      ok: true,
      detail: `added=${(expectedUpdateResult.addedColors ?? []).join(',') || 'none'} removed=${(expectedUpdateResult.removedColors ?? []).join(',') || 'none'}`
    });

    const actualUpdateState = await getActualViewState(actualProductId, updateReference, metadataValues);
    assert(JSON.stringify(actualUpdateState.product) === JSON.stringify(expectedUpdateState.product), 'PostgreSQL updated product state does not match SQLite parity.');
    report.parityChecks.push({ name: 'update product parity', ok: true, detail: `reference=${updateReference}` });
    assert(JSON.stringify(actualUpdateState.stockRows) === JSON.stringify(expectedUpdateState.stockRows), 'PostgreSQL updated stock rows do not match SQLite parity.');
    report.parityChecks.push({ name: 'update stock rows parity', ok: true, detail: `rows=${expectedUpdateState.stockRows.length}` });
    assert(JSON.stringify(actualUpdateState.variantRows) === JSON.stringify(expectedUpdateState.variantRows), 'PostgreSQL updated product_variants do not match SQLite parity.');
    report.parityChecks.push({ name: 'update product_variants parity', ok: true, detail: `rows=${expectedUpdateState.variantRows.length}` });
    assert(JSON.stringify(actualUpdateState.metadataRows) === JSON.stringify(expectedUpdateState.metadataRows), 'PostgreSQL updated metadata rows do not match SQLite parity.');
    report.parityChecks.push({ name: 'update metadata parity', ok: true, detail: `values=${expectedUpdateState.metadataRows.length}` });

    const productsListAfterUpdate = await request(report.baseUrl, '/api/products', {
      method: 'GET',
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'products-create-update-audit'
      }
    });
    assert(productsListAfterUpdate.response.ok, `GET /api/products after update HTTP status was ${productsListAfterUpdate.response.status}.`);
    const updatedProductView = normalizeProduct(findProductByReference(productsListAfterUpdate.body?.result ?? [], updateReference));
    assert(JSON.stringify(updatedProductView) === JSON.stringify(expectedUpdateState.product), 'GET /api/products after update does not match SQLite parity.');
    report.httpChecks.push({ name: 'GET /api/products after update', ok: true, detail: `reference=${updateReference}` });

    const metadataAfterUpdate = await request(report.baseUrl, '/api/products/metadata', {
      method: 'GET',
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'products-create-update-audit'
      }
    });
    assert(metadataAfterUpdate.response.ok, `GET /api/products/metadata after update HTTP status was ${metadataAfterUpdate.response.status}.`);
    const metadataResult = metadataAfterUpdate.body?.result ?? {};
    [createCategory, updateCategory].forEach((value) => assert((metadataResult.categories ?? []).includes(value), `Metadata categories missing ${value}.`));
    [createSerie, updateSerie].forEach((value) => assert((metadataResult.series ?? []).includes(value), `Metadata series missing ${value}.`));
    [colorA, colorB, colorC].forEach((value) => assert((metadataResult.colors ?? []).includes(value), `Metadata colors missing ${value}.`));
    report.httpChecks.push({ name: 'GET /api/products/metadata after update', ok: true, detail: 'generated metadata values visible' });

    const stockRowsAfterUpdate = await request(report.baseUrl, '/api/stock', {
      method: 'GET',
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'products-create-update-audit'
      }
    });
    assert(stockRowsAfterUpdate.response.ok, `GET /api/stock after update HTTP status was ${stockRowsAfterUpdate.response.status}.`);
    const updatedStockRows = normalizeStockRows((stockRowsAfterUpdate.body?.result ?? []).filter((row) => row.product_id === actualProductId));
    assert(JSON.stringify(updatedStockRows) === JSON.stringify(expectedUpdateState.stockRows), 'GET /api/stock after update does not match SQLite parity.');
    report.httpChecks.push({ name: 'GET /api/stock after update', ok: true, detail: `rows=${updatedStockRows.length}` });

    const stockItemsAfterUpdate = await request(report.baseUrl, '/api/stock/items', {
      method: 'GET',
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'products-create-update-audit'
      }
    });
    assert(stockItemsAfterUpdate.response.ok, `GET /api/stock/items after update HTTP status was ${stockItemsAfterUpdate.response.status}.`);
    const updatedStockItem = normalizeStockItem((stockItemsAfterUpdate.body?.result ?? []).find((item) => item.id === actualProductId));
    assert(JSON.stringify(updatedStockItem) === JSON.stringify(expectedUpdateState.stockItem), 'GET /api/stock/items after update does not match SQLite parity.');
    report.httpChecks.push({ name: 'GET /api/stock/items after update', ok: true, detail: `reference=${updateReference}` });

    assert(actualUpdateState.priceHistoryCount === 0, 'products:update should not create price_history rows.');
    report.minimalSideEffects.push({ name: 'price_history untouched', ok: true, detail: 'count=0' });
    assert(actualUpdateState.movementsCount === 0, 'products:create/update should not create movement rows.');
    report.minimalSideEffects.push({ name: 'movements untouched', ok: true, detail: 'count=0' });
    assert(actualUpdateState.stockRows.every((row) => row.qty === 0), 'products:create/update should only create zero-qty stock rows in this tranche.');
    report.minimalSideEffects.push({ name: 'stock qty remains zero', ok: true, detail: `rows=${actualUpdateState.stockRows.length}` });

    const realSqliteCreateRow = realSqliteDb.prepare('SELECT id FROM products WHERE reference = ? LIMIT 1').get(createReference);
    const realSqliteUpdateRow = realSqliteDb.prepare('SELECT id FROM products WHERE reference = ? LIMIT 1').get(updateReference);
    assert(!realSqliteCreateRow && !realSqliteUpdateRow, 'Real SQLite products table should remain unchanged during PostgreSQL create/update audit.');
    report.sqliteIsolationChecks.push({ name: 'products unchanged in SQLite', ok: true, detail: 'references absent' });

    const realSqliteMetadataRows = getSqliteMetadataRows(realSqliteDb, metadataValues);
    assert(realSqliteMetadataRows.length === 0, 'Real SQLite metadata should remain unchanged during PostgreSQL create/update audit.');
    report.sqliteIsolationChecks.push({ name: 'metadata unchanged in SQLite', ok: true, detail: `values=${metadataValues.length}` });

    report.validated.push('`products:create` est compatible PostgreSQL pour les ecritures minimales necessaires sur `products`, `stock` et `product_variants`, avec parite validee contre une execution de reference SQLite.');
    report.validated.push('`products:update` est compatible PostgreSQL pour la mise a jour du produit, l ajout et le retrait de couleurs sans stock, et l upsert des metadata associees, avec parite validee contre SQLite.');
    report.validated.push('Les routes REST et handlers IPC restent inchanges; le routage PostgreSQL de cette tranche reste audit-only et exige `DB_DRIVER=postgres`, `DB_ENABLE_POSTGRES_CATALOG_READ=1` et `DB_ENABLE_POSTGRES_PRODUCT_WRITES=1`.');
    report.remainingRisks.push('`products:updatePrice` et `products:restorePrice` restent sur SQLite car ils ouvrent `price_history` et la gestion fine des prix par couleur.');
    report.remainingRisks.push('Les ecritures `stock` et `movements` completes restent sur SQLite; le domaine catalogue/stock ne doit donc toujours pas etre active en PostgreSQL en usage normal.');
    report.remainingRisks.push('Le comportement actuel conserve les prix existants des variantes deja presentes lors de `products:update`; seule une couleur nouvellement ajoutee prend le nouveau `priceTtc`. Cette parite SQLite est preservee mais devra etre revue avant la tranche prix.');

    report.status = 'completed';
  } catch (error) {
    report.status = 'failed';
    report.remainingRisks.push(error instanceof Error ? error.message : String(error));
    console.error('[audit-postgres-products-create-update] failed', error);
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
