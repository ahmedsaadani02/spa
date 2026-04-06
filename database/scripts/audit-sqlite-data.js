#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..', '..');
const schemaDir = path.join(projectRoot, 'database', 'schema');
const jsonOutputPath = path.join(schemaDir, 'sqlite-data-audit.latest.json');
const markdownOutputPath = path.join(schemaDir, 'sqlite-data-audit.latest.md');

try {
  require('dotenv').config({ path: path.join(projectRoot, '.env') });
} catch (_error) {
  // Ignore if dotenv is unavailable in the current shell context.
}

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

  throw new Error('Unable to load better-sqlite3 for SQLite data audit.');
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

const dbPath = resolveSqlitePath();
const db = new Database(dbPath, { readonly: true });

const tableNames = new Set(
  db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
  `).all().map((row) => row.name)
);

const hasTable = (tableName) => tableNames.has(tableName);

const getTableColumns = (tableName) => {
  if (!hasTable(tableName)) {
    return [];
  }

  return db.prepare(`PRAGMA table_info("${tableName.replace(/"/g, '""')}")`).all().map((row) => ({
    name: row.name,
    declaredType: row.type || '',
    notNull: Number(row.notnull) === 1
  }));
};

const collectSample = (sql, params = []) => db.prepare(sql).all(...params).slice(0, 20);

const getCount = (sql, params = []) => {
  const row = db.prepare(sql).get(...params);
  return Number(row?.count ?? 0);
};

const duplicateReferenceRows = hasTable('products')
  ? collectSample(`
      SELECT
        lower(trim(reference)) AS normalized_reference,
        COUNT(*) AS duplicates,
        GROUP_CONCAT(id, ', ') AS sample_ids
      FROM products
      WHERE COALESCE(is_deleted, 0) = 0
        AND reference IS NOT NULL
        AND trim(reference) <> ''
      GROUP BY lower(trim(reference))
      HAVING COUNT(*) > 1
      ORDER BY duplicates DESC, normalized_reference ASC
    `)
  : [];

const orphanChecks = [
  {
    key: 'quotes.client_id',
    description: 'quotes.client_id -> clients.id',
    table: 'quotes',
    sql: `
      SELECT q.id AS row_id, q.client_id AS dangling_value
      FROM quotes q
      LEFT JOIN clients c ON c.id = q.client_id
      WHERE q.client_id IS NOT NULL AND c.id IS NULL
      ORDER BY q.id
      LIMIT 20
    `
  },
  {
    key: 'invoices.client_id',
    description: 'invoices.client_id -> clients.id',
    table: 'invoices',
    sql: `
      SELECT i.id AS row_id, i.client_id AS dangling_value
      FROM invoices i
      LEFT JOIN clients c ON c.id = i.client_id
      WHERE i.client_id IS NOT NULL AND c.id IS NULL
      ORDER BY i.id
      LIMIT 20
    `
  },
  {
    key: 'invoices.quote_id',
    description: 'invoices.quote_id -> quotes.id',
    table: 'invoices',
    sql: `
      SELECT i.id AS row_id, i.quote_id AS dangling_value
      FROM invoices i
      LEFT JOIN quotes q ON q.id = i.quote_id
      WHERE i.quote_id IS NOT NULL AND q.id IS NULL
      ORDER BY i.id
      LIMIT 20
    `
  },
  {
    key: 'stock.product_id',
    description: 'stock.product_id -> products.id',
    table: 'stock',
    sql: `
      SELECT (s.product_id || ':' || s.color) AS row_id, s.product_id AS dangling_value
      FROM stock s
      LEFT JOIN products p ON p.id = s.product_id
      WHERE s.product_id IS NOT NULL AND p.id IS NULL
      ORDER BY s.product_id, s.color
      LIMIT 20
    `
  },
  {
    key: 'product_variants.product_id',
    description: 'product_variants.product_id -> products.id',
    table: 'product_variants',
    sql: `
      SELECT pv.id AS row_id, pv.product_id AS dangling_value
      FROM product_variants pv
      LEFT JOIN products p ON p.id = pv.product_id
      WHERE pv.product_id IS NOT NULL AND p.id IS NULL
      ORDER BY pv.id
      LIMIT 20
    `
  },
  {
    key: 'price_history.product_id',
    description: 'price_history.product_id -> products.id',
    table: 'price_history',
    sql: `
      SELECT ph.id AS row_id, ph.product_id AS dangling_value
      FROM price_history ph
      LEFT JOIN products p ON p.id = ph.product_id
      WHERE ph.product_id IS NOT NULL AND p.id IS NULL
      ORDER BY ph.id
      LIMIT 20
    `
  },
  {
    key: 'salary_advances.employee_id',
    description: 'salary_advances.employee_id -> employees.id',
    table: 'salary_advances',
    sql: `
      SELECT sa.id AS row_id, sa.employee_id AS dangling_value
      FROM salary_advances sa
      LEFT JOIN employees e ON e.id = sa.employee_id
      WHERE sa.employee_id IS NOT NULL AND e.id IS NULL
      ORDER BY sa.id
      LIMIT 20
    `
  },
  {
    key: 'salary_bonuses.employee_id',
    description: 'salary_bonuses.employee_id -> employees.id',
    table: 'salary_bonuses',
    sql: `
      SELECT sb.id AS row_id, sb.employee_id AS dangling_value
      FROM salary_bonuses sb
      LEFT JOIN employees e ON e.id = sb.employee_id
      WHERE sb.employee_id IS NOT NULL AND e.id IS NULL
      ORDER BY sb.id
      LIMIT 20
    `
  },
  {
    key: 'salary_overtimes.employee_id',
    description: 'salary_overtimes.employee_id -> employees.id',
    table: 'salary_overtimes',
    sql: `
      SELECT so.id AS row_id, so.employee_id AS dangling_value
      FROM salary_overtimes so
      LEFT JOIN employees e ON e.id = so.employee_id
      WHERE so.employee_id IS NOT NULL AND e.id IS NULL
      ORDER BY so.id
      LIMIT 20
    `
  },
  {
    key: 'auth_challenges.user_id',
    description: 'auth_challenges.user_id -> employees.id',
    table: 'auth_challenges',
    sql: `
      SELECT ac.id AS row_id, ac.user_id AS dangling_value
      FROM auth_challenges ac
      LEFT JOIN employees e ON e.id = ac.user_id
      WHERE ac.user_id IS NOT NULL AND e.id IS NULL
      ORDER BY ac.id
      LIMIT 20
    `
  }
].map((check) => {
  if (!hasTable(check.table)) {
    return { ...check, skipped: true, count: 0, sample: [] };
  }

  const sample = collectSample(check.sql);
  const count = getCount(`SELECT COUNT(*) AS count FROM (${check.sql.replace(/\s+LIMIT 20\s*$/i, '')}) audit_subquery`);
  return { ...check, skipped: false, count, sample };
});

const futureNotNullColumns = {
  employees: [
    'nom',
    'salaire_base',
    'role',
    'created_at',
    'updated_at',
    'can_view_stock',
    'can_add_stock',
    'can_remove_stock',
    'can_adjust_stock',
    'can_manage_stock',
    'can_edit_stock_product',
    'can_archive_stock_product',
    'can_manage_inventory',
    'can_view_history',
    'can_manage_archives',
    'can_manage_salary',
    'can_manage_all'
  ],
  clients: ['nom', 'created_at', 'updated_at'],
  products: ['reference', 'label', 'category', 'serie', 'unit', 'low_stock_threshold', 'is_archived', 'is_deleted'],
  stock: ['product_id', 'color', 'qty'],
  product_variants: ['product_id', 'color', 'price', 'stock', 'updated_at'],
  product_catalog_metadata: ['kind', 'value', 'created_at', 'updated_at'],
  price_history: ['product_id', 'color', 'old_price', 'new_price', 'changed_at', 'changed_by'],
  movements: ['product_id', 'color', 'type', 'delta', 'before', 'after', 'at'],
  quotes: ['payload'],
  invoices: ['payload'],
  salary_advances: ['employee_id', 'montant', 'date_avance', 'mois_reference', 'annee_reference', 'created_at'],
  salary_bonuses: ['employee_id', 'montant', 'date_prime', 'mois_reference', 'annee_reference', 'created_at'],
  salary_overtimes: ['employee_id', 'hours', 'hourly_rate', 'amount', 'overtime_date', 'mois_reference', 'annee_reference', 'created_at'],
  auth_challenges: ['user_id', 'purpose', 'code_hash', 'expires_at', 'attempts_count', 'max_attempts', 'created_at'],
  security_audit_log: ['event_type', 'success', 'created_at']
};

const notNullViolations = Object.entries(futureNotNullColumns).flatMap(([tableName, columns]) => {
  if (!hasTable(tableName)) {
    return [];
  }

  return columns.map((columnName) => {
    const count = getCount(`SELECT COUNT(*) AS count FROM "${tableName}" WHERE "${columnName}" IS NULL`);
    const sample = count > 0
      ? collectSample(`SELECT * FROM "${tableName}" WHERE "${columnName}" IS NULL LIMIT 5`)
      : [];

    return {
      table: tableName,
      column: columnName,
      count,
      sample
    };
  }).filter((violation) => violation.count > 0);
});

const textDateColumns = [
  ['employees', 'date_embauche'],
  ['employees', 'last_login_at'],
  ['employees', 'created_at'],
  ['employees', 'updated_at'],
  ['clients', 'created_at'],
  ['clients', 'updated_at'],
  ['products', 'last_updated'],
  ['products', 'archived_at'],
  ['products', 'deleted_at'],
  ['product_variants', 'updated_at'],
  ['product_catalog_metadata', 'created_at'],
  ['product_catalog_metadata', 'updated_at'],
  ['price_history', 'changed_at'],
  ['movements', 'at'],
  ['quotes', 'updated_at'],
  ['invoices', 'updated_at'],
  ['salary_advances', 'date_avance'],
  ['salary_advances', 'created_at'],
  ['salary_bonuses', 'date_prime'],
  ['salary_bonuses', 'created_at'],
  ['salary_overtimes', 'overtime_date'],
  ['salary_overtimes', 'created_at'],
  ['auth_challenges', 'expires_at'],
  ['auth_challenges', 'used_at'],
  ['auth_challenges', 'created_at'],
  ['security_audit_log', 'created_at']
];

const dateFormatIssues = textDateColumns.flatMap(([tableName, columnName]) => {
  if (!hasTable(tableName)) {
    return [];
  }

  const rows = db.prepare(`SELECT rowid, "${columnName}" AS value FROM "${tableName}" WHERE "${columnName}" IS NOT NULL`).all();
  const invalid = rows.filter((row) => {
    if (typeof row.value !== 'string') {
      return true;
    }

    const trimmed = row.value.trim();
    if (!trimmed) {
      return true;
    }

    return Number.isNaN(Date.parse(trimmed));
  });

  if (!invalid.length) {
    return [];
  }

  return [{
    table: tableName,
    column: columnName,
    count: invalid.length,
    sample: invalid.slice(0, 10).map((row) => ({ rowid: row.rowid, value: row.value }))
  }];
});

const numericFormatIssues = Array.from(tableNames).flatMap((tableName) => {
  const numericColumns = getTableColumns(tableName).filter((column) => {
    const declared = column.declaredType.toUpperCase();
    return declared.includes('INT') || declared.includes('REAL') || declared.includes('NUMERIC');
  });

  return numericColumns.flatMap((column) => {
    const rows = db.prepare(`
      SELECT rowid, "${column.name}" AS value, typeof("${column.name}") AS sqlite_type
      FROM "${tableName}"
      WHERE "${column.name}" IS NOT NULL
        AND typeof("${column.name}") NOT IN ('integer', 'real')
      LIMIT 20
    `).all();

    const count = getCount(`
      SELECT COUNT(*) AS count
      FROM "${tableName}"
      WHERE "${column.name}" IS NOT NULL
        AND typeof("${column.name}") NOT IN ('integer', 'real')
    `);

    if (!count) {
      return [];
    }

    return [{
      table: tableName,
      column: column.name,
      count,
      sample: rows
    }];
  });
});

const booleanColumns = [
  ['employees', 'actif'],
  ['employees', 'is_active'],
  ['employees', 'is_protected_account'],
  ['employees', 'requires_email_2fa'],
  ['employees', 'must_setup_password'],
  ['employees', 'can_view_stock'],
  ['employees', 'can_add_stock'],
  ['employees', 'can_remove_stock'],
  ['employees', 'can_adjust_stock'],
  ['employees', 'can_manage_stock'],
  ['employees', 'can_edit_stock_product'],
  ['employees', 'can_archive_stock_product'],
  ['employees', 'can_manage_employees'],
  ['employees', 'can_manage_invoices'],
  ['employees', 'can_manage_quotes'],
  ['employees', 'can_manage_clients'],
  ['employees', 'can_manage_estimations'],
  ['employees', 'can_manage_archives'],
  ['employees', 'can_manage_inventory'],
  ['employees', 'can_view_history'],
  ['employees', 'can_manage_salary'],
  ['employees', 'can_manage_all'],
  ['products', 'is_archived'],
  ['products', 'is_deleted'],
  ['security_audit_log', 'success']
];

const booleanIssues = booleanColumns.flatMap(([tableName, columnName]) => {
  if (!hasTable(tableName)) {
    return [];
  }

  const invalidRows = db.prepare(`
    SELECT rowid, "${columnName}" AS value
    FROM "${tableName}"
    WHERE "${columnName}" IS NOT NULL
      AND "${columnName}" NOT IN (0, 1)
    LIMIT 20
  `).all();

  const count = getCount(`
    SELECT COUNT(*) AS count
    FROM "${tableName}"
    WHERE "${columnName}" IS NOT NULL
      AND "${columnName}" NOT IN (0, 1)
  `);

  if (!count) {
    return [];
  }

  return [{
    table: tableName,
    column: columnName,
    count,
    sample: invalidRows
  }];
});

const jsonChecks = [
  ['quotes', 'payload', 'id'],
  ['invoices', 'payload', 'id']
].flatMap(([tableName, columnName, idColumn]) => {
  if (!hasTable(tableName)) {
    return [];
  }

  const rows = db.prepare(`
    SELECT "${idColumn}" AS row_id, "${columnName}" AS value
    FROM "${tableName}"
    WHERE "${columnName}" IS NOT NULL
  `).all();

  const invalid = [];

  for (const row of rows) {
    try {
      JSON.parse(row.value);
    } catch (error) {
      invalid.push({
        rowId: row.row_id,
        message: error.message,
        sample: typeof row.value === 'string' ? row.value.slice(0, 200) : row.value
      });
    }
  }

  return [{
    table: tableName,
    column: columnName,
    totalRows: rows.length,
    invalidCount: invalid.length,
    invalidSample: invalid.slice(0, 10)
  }];
});

const recommendedSafeConstraints = [];
const recommendedDeferredConstraints = [];
const cleanupItems = [];

if (duplicateReferenceRows.length === 0) {
  recommendedSafeConstraints.push({
    name: 'Unique active products.reference (case-insensitive)',
    reason: 'No duplicate active references were found with lower(trim(reference)).'
  });
} else {
  recommendedDeferredConstraints.push({
    name: 'Unique active products.reference (case-insensitive)',
    reason: `${duplicateReferenceRows.length} duplicate normalized references were found.`
  });
  cleanupItems.push({
    name: 'Duplicate active product references',
    details: duplicateReferenceRows.map((row) => ({
      normalizedReference: row.normalized_reference,
      duplicates: row.duplicates,
      sampleIds: row.sample_ids
    }))
  });
}

for (const check of orphanChecks) {
  if (check.skipped) {
    recommendedDeferredConstraints.push({
      name: check.description,
      reason: 'Table missing during audit, constraint not evaluated.'
    });
    continue;
  }

  if (check.count === 0) {
    const caution = check.key === 'invoices.quote_id'
      ? ' Data is clean, but the foreign key is still a business-rule decision because SQLite does not currently enforce it physically.'
      : '';
    recommendedSafeConstraints.push({
      name: check.description,
      reason: `No orphan rows were found.${caution}`
    });
  } else {
    recommendedDeferredConstraints.push({
      name: check.description,
      reason: `${check.count} orphan rows were found.`
    });
    cleanupItems.push({
      name: `Orphans for ${check.description}`,
      details: check.sample
    });
  }
}

for (const check of jsonChecks) {
  if (check.invalidCount === 0) {
    recommendedSafeConstraints.push({
      name: `${check.table}.${check.column} as JSONB`,
      reason: `All ${check.totalRows} rows parsed successfully as JSON.`
    });
  } else {
    recommendedDeferredConstraints.push({
      name: `${check.table}.${check.column} as JSONB`,
      reason: `${check.invalidCount} rows contain invalid JSON payloads.`
    });
    cleanupItems.push({
      name: `Invalid JSON in ${check.table}.${check.column}`,
      details: check.invalidSample
    });
  }
}

if (notNullViolations.length === 0) {
  recommendedSafeConstraints.push({
    name: 'Current draft NOT NULL constraints',
    reason: 'No NULL values were found in the audited columns that the current PostgreSQL draft marks as NOT NULL.'
  });
} else {
  recommendedDeferredConstraints.push({
    name: 'Current draft NOT NULL constraints',
    reason: `${notNullViolations.length} audited columns contain NULL values.`
  });
  cleanupItems.push({
    name: 'NULL values blocking future NOT NULL constraints',
    details: notNullViolations.map((issue) => ({
      table: issue.table,
      column: issue.column,
      count: issue.count
    }))
  });
}

if (dateFormatIssues.length) {
  cleanupItems.push({
    name: 'Suspicious date/timestamp values',
    details: dateFormatIssues.map((issue) => ({
      table: issue.table,
      column: issue.column,
      count: issue.count,
      sample: issue.sample
    }))
  });
  recommendedDeferredConstraints.push({
    name: 'Strict timestamp casting during migration',
    reason: `${dateFormatIssues.length} date/timestamp columns contain values that Date.parse does not accept cleanly.`
  });
} else {
  recommendedSafeConstraints.push({
    name: 'Timestamp casting to PostgreSQL TIMESTAMPTZ',
    reason: 'No suspicious non-null date values were found in the audited date/timestamp columns.'
  });
}

if (numericFormatIssues.length) {
  cleanupItems.push({
    name: 'Suspicious numeric storage types',
    details: numericFormatIssues.map((issue) => ({
      table: issue.table,
      column: issue.column,
      count: issue.count,
      sample: issue.sample
    }))
  });
  recommendedDeferredConstraints.push({
    name: 'Strict numeric casting for all numeric columns',
    reason: `${numericFormatIssues.length} numeric columns contain non-numeric SQLite storage classes.`
  });
} else {
  recommendedSafeConstraints.push({
    name: 'Numeric casting to PostgreSQL NUMERIC/INTEGER',
    reason: 'No non-numeric SQLite storage classes were found in the audited numeric columns.'
  });
}

if (booleanIssues.length) {
  cleanupItems.push({
    name: 'Suspicious boolean values outside 0/1',
    details: booleanIssues.map((issue) => ({
      table: issue.table,
      column: issue.column,
      count: issue.count,
      sample: issue.sample
    }))
  });
  recommendedDeferredConstraints.push({
    name: 'Strict PostgreSQL BOOLEAN mapping',
    reason: `${booleanIssues.length} boolean-like columns contain values outside 0/1.`
  });
} else {
  recommendedSafeConstraints.push({
    name: 'BOOLEAN mapping for audited flag columns',
    reason: 'All audited boolean-like values are compatible with PostgreSQL BOOLEAN conversion.'
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  sqlitePath: dbPath,
  tablesDetected: Array.from(tableNames).sort(),
  checks: {
    duplicateProductsReference: {
      count: duplicateReferenceRows.length,
      rows: duplicateReferenceRows
    },
    orphanReferences: orphanChecks,
    futureNotNullViolations: notNullViolations,
    dateFormatIssues,
    numericFormatIssues,
    booleanIssues,
    jsonChecks
  },
  recommendations: {
    safeToApplyImmediately: recommendedSafeConstraints,
    deferUntilCleanupOrDecision: recommendedDeferredConstraints,
    cleanupRequiredBeforeMigration: cleanupItems
  }
};

const formatMarkdown = (data) => {
  const lines = [];
  lines.push('# SQLite Data Compatibility Audit');
  lines.push('');
  lines.push(`- Generated at: \`${data.generatedAt}\``);
  lines.push(`- SQLite path: \`${data.sqlitePath}\``);
  lines.push(`- Tables detected: \`${data.tablesDetected.length}\``);
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  lines.push(`- Duplicate active product references: ${data.checks.duplicateProductsReference.count}`);
  lines.push(`- Orphan reference checks with issues: ${data.checks.orphanReferences.filter((check) => check.count > 0).length}`);
  lines.push(`- Future NOT NULL violations: ${data.checks.futureNotNullViolations.length}`);
  lines.push(`- Suspicious date/timestamp checks: ${data.checks.dateFormatIssues.length}`);
  lines.push(`- Suspicious numeric checks: ${data.checks.numericFormatIssues.length}`);
  lines.push(`- Suspicious boolean checks: ${data.checks.booleanIssues.length}`);
  lines.push(`- Invalid JSON payload sets: ${data.checks.jsonChecks.filter((check) => check.invalidCount > 0).length}`);
  lines.push('');

  lines.push('## Constraints Safe To Apply Immediately');
  lines.push('');
  data.recommendations.safeToApplyImmediately.forEach((item) => {
    lines.push(`- ${item.name}: ${item.reason}`);
  });
  if (!data.recommendations.safeToApplyImmediately.length) {
    lines.push('- None confirmed yet.');
  }
  lines.push('');

  lines.push('## Constraints To Defer');
  lines.push('');
  data.recommendations.deferUntilCleanupOrDecision.forEach((item) => {
    lines.push(`- ${item.name}: ${item.reason}`);
  });
  if (!data.recommendations.deferUntilCleanupOrDecision.length) {
    lines.push('- None.');
  }
  lines.push('');

  lines.push('## Cleanup Needed Before Migration');
  lines.push('');
  if (!data.recommendations.cleanupRequiredBeforeMigration.length) {
    lines.push('- No blocking data cleanup was detected in the audited checks.');
    lines.push('');
  } else {
    data.recommendations.cleanupRequiredBeforeMigration.forEach((item) => {
      lines.push(`### ${item.name}`);
      lines.push('');
      lines.push('```json');
      lines.push(JSON.stringify(item.details, null, 2));
      lines.push('```');
      lines.push('');
    });
  }

  lines.push('## Detailed Checks');
  lines.push('');

  lines.push('### Orphan References');
  lines.push('');
  data.checks.orphanReferences.forEach((check) => {
    lines.push(`- ${check.description}: ${check.count} orphan rows`);
  });
  lines.push('');

  lines.push('### JSON Payload Validation');
  lines.push('');
  data.checks.jsonChecks.forEach((check) => {
    lines.push(`- ${check.table}.${check.column}: ${check.invalidCount} invalid rows out of ${check.totalRows}`);
  });
  lines.push('');

  return `${lines.join('\n')}\n`;
};

fs.mkdirSync(schemaDir, { recursive: true });
fs.writeFileSync(jsonOutputPath, JSON.stringify(report, null, 2));
fs.writeFileSync(markdownOutputPath, formatMarkdown(report));

console.log('[sqlite-data-audit] SQLite path:', dbPath);
console.log('[sqlite-data-audit] JSON report:', jsonOutputPath);
console.log('[sqlite-data-audit] Markdown report:', markdownOutputPath);
console.log('[sqlite-data-audit] Duplicate active product references:', report.checks.duplicateProductsReference.count);
console.log('[sqlite-data-audit] Orphan checks with issues:', report.checks.orphanReferences.filter((check) => check.count > 0).length);
console.log('[sqlite-data-audit] Future NOT NULL violations:', report.checks.futureNotNullViolations.length);
console.log('[sqlite-data-audit] Invalid JSON payload sets:', report.checks.jsonChecks.filter((check) => check.invalidCount > 0).length);
