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

  throw new Error('Unable to load better-sqlite3 for products write audit.');
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

const normalizeResponseBody = async (response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch (_error) {
    return text;
  }
};

const toAuditResult = (row) => ({
  id: row?.id ?? null,
  reference: row?.reference ?? null,
  label: row?.label ?? null,
  category: row?.category ?? null,
  serie: row?.serie ?? null,
  lowStockThreshold: Number(row?.low_stock_threshold ?? row?.lowStockThreshold ?? 0) || 0,
  priceTtc: Number(row?.price_ttc ?? row?.priceTtc ?? 0) || 0,
  isArchived: row?.is_archived === true || row?.isArchived === true
});

const writeReport = (report) => {
  fs.mkdirSync(reportDir, { recursive: true });

  const slug = timestampSlug();
  const jsonLatestPath = path.join(reportDir, 'postgres-products-write.latest.json');
  const markdownLatestPath = path.join(reportDir, 'postgres-products-write.latest.md');
  const jsonPath = path.join(reportDir, `postgres-products-write.${slug}.json`);
  const markdownPath = path.join(reportDir, `postgres-products-write.${slug}.md`);
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
  lines.push('# PostgreSQL Products Write Validation');
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
  lines.push('## Mutation Inventory');
  lines.push('');
  lines.push('### Routed To PostgreSQL In This Audit');
  lines.push('');
  report.mutationsRoutedToPostgres.forEach((item) => {
    lines.push(`- ${item.name}: ${item.detail}`);
  });
  lines.push('');
  lines.push('### Still On SQLite');
  lines.push('');
  report.mutationsRemainingOnSqlite.forEach((item) => {
    lines.push(`- ${item.name}: ${item.detail}`);
  });
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
  lines.push('## PostgreSQL Checks');
  lines.push('');
  report.postgresChecks.forEach((item) => lines.push(`- ${item.name}: ${item.ok ? 'ok' : 'failed'}${item.detail ? ` (${item.detail})` : ''}`));
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
  const sqliteDb = new Database(sqlitePath, { readonly: true });
  const suffix = Date.now().toString(36);
  const ownerId = `products-write-owner-${suffix}`;
  const ownerUsername = `products_write_owner_${suffix}`;
  const ownerEmail = `products-write-owner-${suffix}@example.test`;
  const ownerPassword = 'OwnerAudit#2026!';
  const productId = `pg-products-write-audit-${suffix}`;
  const productReference = `PG-AUDIT-${suffix.slice(-8).toUpperCase()}`;
  const metadataValue = `pg-audit-category-${suffix}`;

  const report = {
    startedAt: nowIso(),
    finishedAt: null,
    status: 'running',
    sqlitePath,
    baseUrl: null,
    routing: getDatabaseRoutingSummary(),
    mutationsRoutedToPostgres: [
      { name: 'products:addMetadata', detail: 'Ecriture `product_catalog_metadata` uniquement, audit-only via `DB_ENABLE_POSTGRES_PRODUCT_WRITES=1` et `DB_ENABLE_POSTGRES_CATALOG_READ=1`.' },
      { name: 'products:upsert', detail: 'Ecriture `products` uniquement, sans `stock`, `product_variants` ni `price_history`.' },
      { name: 'products:delete', detail: 'Alias archive, route vers PostgreSQL uniquement en audit.' },
      { name: 'products:archive', detail: 'Bascule `products.is_archived` et `archived_at` sur PostgreSQL uniquement en audit.' },
      { name: 'products:restore', detail: 'Restauration `products.is_archived` sur PostgreSQL uniquement en audit.' }
    ],
    mutationsRemainingOnSqlite: [
      { name: 'products:create', detail: 'Reste sur SQLite car cree aussi `stock` et `product_variants`.' },
      { name: 'products:update', detail: 'Reste sur SQLite car peut ajouter/supprimer des couleurs et toucher `stock`/`product_variants`.' },
      { name: 'products:purge', detail: 'Reste sur SQLite car supprime `stock`, `product_variants` et `price_history`.' },
      { name: 'products:updatePrice', detail: 'Reste sur SQLite car ecrit `product_variants` et `price_history`.' },
      { name: 'products:restorePrice', detail: 'Reste sur SQLite car ecrit `product_variants` et `price_history`.' }
    ],
    validated: [],
    httpChecks: [],
    postgresChecks: [],
    sqliteIsolationChecks: [],
    remainingRisks: [],
    artifacts: null
  };

  let server;

  const request = async (baseUrl, route, options = {}) => {
    const response = await fetch(`${baseUrl}${route}`, options);
    const body = await normalizeResponseBody(response);
    return { response, body };
  };

  const cleanup = async () => {
    await query('DELETE FROM product_catalog_metadata WHERE kind = $1 AND value = $2', ['category', metadataValue]);
    await query('DELETE FROM products WHERE id = $1', [productId]);
    await query('DELETE FROM employees WHERE id = $1', [ownerId]);
  };

  try {
    assert(report.routing.configuredDriver === 'postgres', 'The products write audit must run with DB_DRIVER=postgres.');
    assert(report.routing.catalogReadOptInEnabled === true, 'The products write audit requires DB_ENABLE_POSTGRES_CATALOG_READ=1.');
    assert(report.routing.productWriteOptInEnabled === true, 'The products write audit requires DB_ENABLE_POSTGRES_PRODUCT_WRITES=1.');
    assert(report.routing.activePostgresScopes.includes('products-metadata-write'), 'Products metadata write scope is not routed to PostgreSQL.');
    assert(report.routing.activePostgresScopes.includes('products-core-write'), 'Products core write scope is not routed to PostgreSQL.');
    assert(report.routing.activePostgresScopes.includes('products-read'), 'Products read scope must be enabled during this audit.');

    await cleanup();

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
      [ownerId, 'Products Write Audit', ownerUsername, ownerEmail, hashPassword(ownerPassword), nowIso()]
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
        'user-agent': 'products-write-audit'
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
      'user-agent': 'products-write-audit'
    };

    const addMetadataResponse = await request(report.baseUrl, '/api/products/metadata', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ kind: 'category', value: metadataValue })
    });
    assert(addMetadataResponse.response.ok, `POST /api/products/metadata HTTP status was ${addMetadataResponse.response.status}.`);
    assert(addMetadataResponse.body?.success === true, 'POST /api/products/metadata did not return success=true.');
    assert(addMetadataResponse.body?.result?.ok === true, 'POST /api/products/metadata did not return ok=true.');
    report.httpChecks.push({ name: 'POST /api/products/metadata', ok: true, detail: `value=${metadataValue}` });

    const addMetadataDuplicateResponse = await request(report.baseUrl, '/api/products/metadata', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ kind: 'category', value: metadataValue })
    });
    assert(addMetadataDuplicateResponse.response.ok, `Duplicate POST /api/products/metadata HTTP status was ${addMetadataDuplicateResponse.response.status}.`);
    assert(addMetadataDuplicateResponse.body?.result?.alreadyExists === true, 'Duplicate metadata insert should report alreadyExists=true.');
    report.httpChecks.push({ name: 'POST /api/products/metadata duplicate', ok: true, detail: 'alreadyExists=true' });

    const metadataRowResult = await query(
      `
        SELECT kind, value
        FROM product_catalog_metadata
        WHERE kind = $1 AND value = $2
      `,
      ['category', metadataValue]
    );
    assert(metadataRowResult.rows.length === 1, 'PostgreSQL metadata row was not created.');
    report.postgresChecks.push({ name: 'product_catalog_metadata insert', ok: true, detail: `value=${metadataValue}` });

    const sqliteMetadataRow = sqliteDb.prepare(`
      SELECT kind, value
      FROM product_catalog_metadata
      WHERE kind = ? AND value = ?
      LIMIT 1
    `).get('category', metadataValue);
    assert(!sqliteMetadataRow, 'SQLite metadata should remain unchanged during PostgreSQL write audit.');
    report.sqliteIsolationChecks.push({ name: 'metadata unchanged in SQLite', ok: true, detail: 'row absent' });

    const metadataListResponse = await request(report.baseUrl, '/api/products/metadata', {
      method: 'GET',
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'products-write-audit'
      }
    });
    assert(metadataListResponse.response.ok, `GET /api/products/metadata HTTP status was ${metadataListResponse.response.status}.`);
    const metadataCategories = metadataListResponse.body?.result?.categories ?? [];
    assert(Array.isArray(metadataCategories) && metadataCategories.includes(metadataValue), 'GET /api/products/metadata does not expose the PostgreSQL metadata row during audit.');
    report.httpChecks.push({ name: 'GET /api/products/metadata', ok: true, detail: 'new category visible through PostgreSQL read path' });

    const initialUpsertPayload = {
      id: productId,
      reference: productReference,
      label: 'PG Audit Product',
      description: 'audit-only product write validation',
      category: metadataValue,
      serie: 'pg-audit',
      unit: 'piece',
      image_url: null,
      low_stock_threshold: 2,
      last_updated: nowIso(),
      price_ttc: 42.5
    };

    const initialUpsertResponse = await request(report.baseUrl, '/api/products/upsert', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(initialUpsertPayload)
    });
    assert(initialUpsertResponse.response.ok, `Initial POST /api/products/upsert HTTP status was ${initialUpsertResponse.response.status}.`);
    assert(initialUpsertResponse.body?.success === true && initialUpsertResponse.body?.result === true, 'Initial POST /api/products/upsert did not return result=true.');
    report.httpChecks.push({ name: 'POST /api/products/upsert insert', ok: true, detail: `id=${productId}` });

    const updateUpsertPayload = {
      ...initialUpsertPayload,
      label: 'PG Audit Product Updated',
      low_stock_threshold: 4,
      price_ttc: 55.25,
      last_updated: nowIso()
    };

    const updateUpsertResponse = await request(report.baseUrl, '/api/products/upsert', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(updateUpsertPayload)
    });
    assert(updateUpsertResponse.response.ok, `Update POST /api/products/upsert HTTP status was ${updateUpsertResponse.response.status}.`);
    assert(updateUpsertResponse.body?.success === true && updateUpsertResponse.body?.result === true, 'Update POST /api/products/upsert did not return result=true.');
    report.httpChecks.push({ name: 'POST /api/products/upsert update', ok: true, detail: 'same id updated in PostgreSQL' });

    const postgresProductRowResult = await query(
      `
        SELECT id, reference, label, category, serie, low_stock_threshold, price_ttc, is_archived
        FROM products
        WHERE id = $1
      `,
      [productId]
    );
    assert(postgresProductRowResult.rows.length === 1, 'PostgreSQL product row was not created.');
    const postgresProductRow = toAuditResult(postgresProductRowResult.rows[0]);
    assert(postgresProductRow.reference === productReference, 'PostgreSQL product reference mismatch after upsert.');
    assert(postgresProductRow.label === 'PG Audit Product Updated', 'PostgreSQL product label mismatch after upsert.');
    assert(postgresProductRow.lowStockThreshold === 4, 'PostgreSQL low stock threshold mismatch after upsert.');
    assert(Math.abs(postgresProductRow.priceTtc - 55.25) < 0.000001, 'PostgreSQL price_ttc mismatch after upsert.');
    report.postgresChecks.push({ name: 'products upsert persisted', ok: true, detail: `reference=${productReference}` });

    const sqliteProductRow = sqliteDb.prepare(`
      SELECT id
      FROM products
      WHERE id = ?
      LIMIT 1
    `).get(productId);
    assert(!sqliteProductRow, 'SQLite products table should remain unchanged during PostgreSQL write audit.');
    report.sqliteIsolationChecks.push({ name: 'product absent in SQLite', ok: true, detail: `id=${productId}` });

    const listResponse = await request(report.baseUrl, '/api/products', {
      method: 'GET',
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'products-write-audit'
      }
    });
    assert(listResponse.response.ok, `GET /api/products HTTP status was ${listResponse.response.status}.`);
    const listedProduct = (listResponse.body?.result ?? []).find((row) => row?.id === productId);
    assert(listedProduct, 'GET /api/products did not expose the PostgreSQL product row during audit.');
    assert(toAuditResult(listedProduct).label === 'PG Audit Product Updated', 'GET /api/products did not expose the updated product label.');
    report.httpChecks.push({ name: 'GET /api/products', ok: true, detail: 'upserted PostgreSQL product visible through audit read path' });

    const archiveResponse = await request(report.baseUrl, `/api/products/${productId}/archive`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({})
    });
    assert(archiveResponse.response.ok, `POST /api/products/${productId}/archive HTTP status was ${archiveResponse.response.status}.`);
    assert(archiveResponse.body?.result?.ok === true, 'Archive response did not return ok=true.');
    report.httpChecks.push({ name: 'POST /api/products/:id/archive', ok: true, detail: `id=${productId}` });

    const archivedRowResult = await query('SELECT is_archived FROM products WHERE id = $1', [productId]);
    assert(archivedRowResult.rows.length === 1 && archivedRowResult.rows[0].is_archived === true, 'PostgreSQL product row was not archived.');
    report.postgresChecks.push({ name: 'products archive persisted', ok: true, detail: `id=${productId}` });

    const archivedListResponse = await request(report.baseUrl, '/api/products/archived', {
      method: 'GET',
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'products-write-audit'
      }
    });
    assert(archivedListResponse.response.ok, `GET /api/products/archived HTTP status was ${archivedListResponse.response.status}.`);
    assert((archivedListResponse.body?.result ?? []).some((row) => row?.id === productId), 'Archived products list does not include the PostgreSQL archived row.');
    report.httpChecks.push({ name: 'GET /api/products/archived after archive', ok: true, detail: 'archived PostgreSQL product visible' });

    const restoreResponse = await request(report.baseUrl, `/api/products/${productId}/restore`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({})
    });
    assert(restoreResponse.response.ok, `POST /api/products/${productId}/restore HTTP status was ${restoreResponse.response.status}.`);
    assert(restoreResponse.body?.result?.ok === true, 'Restore response did not return ok=true.');
    report.httpChecks.push({ name: 'POST /api/products/:id/restore', ok: true, detail: `id=${productId}` });

    const restoredRowResult = await query('SELECT is_archived FROM products WHERE id = $1', [productId]);
    assert(restoredRowResult.rows.length === 1 && restoredRowResult.rows[0].is_archived === false, 'PostgreSQL product row was not restored.');
    report.postgresChecks.push({ name: 'products restore persisted', ok: true, detail: `id=${productId}` });

    const deleteResponse = await request(report.baseUrl, `/api/products/${productId}`, {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': 'products-write-audit'
      }
    });
    assert(deleteResponse.response.ok, `DELETE /api/products/${productId} HTTP status was ${deleteResponse.response.status}.`);
    assert(deleteResponse.body?.result === true, 'Delete alias did not return result=true.');
    report.httpChecks.push({ name: 'DELETE /api/products/:id', ok: true, detail: 'archive alias routed to PostgreSQL' });

    const deletedAliasRowResult = await query('SELECT is_archived FROM products WHERE id = $1', [productId]);
    assert(deletedAliasRowResult.rows.length === 1 && deletedAliasRowResult.rows[0].is_archived === true, 'Delete alias did not archive the PostgreSQL row.');
    report.postgresChecks.push({ name: 'products delete alias persisted', ok: true, detail: `id=${productId}` });

    report.validated.push('Les mutations `products:addMetadata`, `products:upsert`, `products:archive`, `products:restore` et `products:delete` sont compatibles PostgreSQL avec routes REST et handlers inchanges.');
    report.validated.push('Le routage PostgreSQL de ces mutations reste audit-only: il exige `DB_DRIVER=postgres`, `DB_ENABLE_POSTGRES_CATALOG_READ=1` et `DB_ENABLE_POSTGRES_PRODUCT_WRITES=1`.');
    report.validated.push('Les lectures catalogue PostgreSQL permettent de verifier visuellement les effets des mutations pendant l audit sans changer le mode normal de l application.');
    report.remainingRisks.push('Les mutations `products:create`, `products:update`, `products:purge`, `products:updatePrice` et `products:restorePrice` restent sur SQLite car elles sont couplees a `stock`, `product_variants` ou `price_history`.');
    report.remainingRisks.push('Le domaine catalogue/stock ne doit pas etre active en mode PostgreSQL normal tant que les ecritures `stock / movements` n ont pas ete migrees et validees.');
    report.remainingRisks.push('Un produit cree via `products:upsert` n alimente pas `stock` ni `product_variants`; ce comportement est conserve et doit rester reserve aux usages deja existants de cette mutation.');

    report.status = 'completed';
  } catch (error) {
    report.status = 'failed';
    report.remainingRisks.push(error instanceof Error ? error.message : String(error));
    console.error('[audit-postgres-products-write] failed', error);
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
      sqliteDb.close();
    } catch (_error) {
      // Ignore SQLite close errors during teardown.
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
