#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..', '..');
const defaultReportDir = path.join(projectRoot, 'database', 'reports');

try {
  require('dotenv').config({ path: path.join(projectRoot, '.env') });
} catch (_error) {
  // Ignore if dotenv is unavailable in the current shell context.
}

const { getPostgresConfig, isPostgresConfigured } = require('../../backend/src/config/postgres');
const { withClient, closePostgresPool } = require('../../backend/src/db/postgres');

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

  throw new Error('Unable to load better-sqlite3 for SQLite migration.');
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

const quoteIdent = (value) => `"${String(value).replace(/"/g, '""')}"`;

const TABLE_CONFIGS = [
  {
    name: 'employees',
    columns: [
      'id',
      'nom',
      'telephone',
      'adresse',
      'poste',
      'salaire_base',
      'date_embauche',
      'actif',
      'is_active',
      'username',
      'email',
      'email_normalized',
      'password_hash',
      'role',
      'is_protected_account',
      'requires_email_2fa',
      'must_setup_password',
      'can_view_stock',
      'can_add_stock',
      'can_remove_stock',
      'can_adjust_stock',
      'can_manage_stock',
      'can_edit_stock_product',
      'can_archive_stock_product',
      'can_manage_employees',
      'can_manage_invoices',
      'can_manage_quotes',
      'can_manage_clients',
      'can_manage_estimations',
      'can_manage_archives',
      'can_manage_inventory',
      'can_view_history',
      'can_manage_salary',
      'can_manage_all',
      'last_login_at',
      'created_at',
      'updated_at'
    ],
    booleanColumns: [
      'actif',
      'is_active',
      'is_protected_account',
      'requires_email_2fa',
      'must_setup_password',
      'can_view_stock',
      'can_add_stock',
      'can_remove_stock',
      'can_adjust_stock',
      'can_manage_stock',
      'can_edit_stock_product',
      'can_archive_stock_product',
      'can_manage_employees',
      'can_manage_invoices',
      'can_manage_quotes',
      'can_manage_clients',
      'can_manage_estimations',
      'can_manage_archives',
      'can_manage_inventory',
      'can_view_history',
      'can_manage_salary',
      'can_manage_all'
    ],
    numericColumns: ['salaire_base'],
    requiredColumns: [
      'id',
      'nom',
      'salaire_base',
      'actif',
      'is_active',
      'role',
      'is_protected_account',
      'requires_email_2fa',
      'must_setup_password',
      'can_view_stock',
      'can_add_stock',
      'can_remove_stock',
      'can_adjust_stock',
      'can_manage_stock',
      'can_edit_stock_product',
      'can_archive_stock_product',
      'can_manage_employees',
      'can_manage_invoices',
      'can_manage_quotes',
      'can_manage_clients',
      'can_manage_estimations',
      'can_manage_archives',
      'can_manage_inventory',
      'can_view_history',
      'can_manage_salary',
      'can_manage_all',
      'created_at',
      'updated_at'
    ],
    timestamptzColumns: ['last_login_at', 'created_at', 'updated_at']
  },
  {
    name: 'clients',
    columns: ['id', 'nom', 'telephone', 'adresse', 'mf', 'email', 'created_at', 'updated_at'],
    requiredColumns: ['id', 'nom', 'created_at', 'updated_at'],
    timestamptzColumns: ['created_at', 'updated_at']
  },
  {
    name: 'products',
    columns: [
      'id',
      'reference',
      'label',
      'description',
      'category',
      'serie',
      'unit',
      'image_url',
      'low_stock_threshold',
      'last_updated',
      'price_ttc',
      'is_archived',
      'archived_at',
      'is_deleted',
      'deleted_at'
    ],
    booleanColumns: ['is_archived', 'is_deleted'],
    numericColumns: ['low_stock_threshold', 'price_ttc'],
    requiredColumns: [
      'id',
      'reference',
      'label',
      'category',
      'serie',
      'unit',
      'low_stock_threshold',
      'is_archived',
      'is_deleted'
    ],
    timestamptzColumns: ['last_updated', 'archived_at', 'deleted_at']
  },
  {
    name: 'product_catalog_metadata',
    columns: ['kind', 'value', 'created_at', 'updated_at'],
    requiredColumns: ['kind', 'value', 'created_at', 'updated_at'],
    timestamptzColumns: ['created_at', 'updated_at']
  },
  {
    name: 'stock',
    columns: ['product_id', 'color', 'qty'],
    numericColumns: ['qty'],
    requiredColumns: ['product_id', 'color', 'qty']
  },
  {
    name: 'product_variants',
    columns: ['id', 'product_id', 'color', 'price', 'stock', 'updated_at'],
    numericColumns: ['price', 'stock'],
    requiredColumns: ['id', 'product_id', 'color', 'price', 'stock', 'updated_at'],
    timestamptzColumns: ['updated_at']
  },
  {
    name: 'price_history',
    columns: ['id', 'product_id', 'color', 'old_price', 'new_price', 'changed_at', 'changed_by'],
    numericColumns: ['old_price', 'new_price'],
    requiredColumns: ['id', 'product_id', 'color', 'old_price', 'new_price', 'changed_at', 'changed_by'],
    timestamptzColumns: ['changed_at']
  },
  {
    name: 'movements',
    columns: [
      'id',
      'product_id',
      'reference',
      'label',
      'category',
      'serie',
      'color',
      'type',
      'delta',
      'before',
      'after',
      'reason',
      'actor',
      'employee_id',
      'employee_name',
      'username',
      'at'
    ],
    numericColumns: ['delta', 'before', 'after'],
    requiredColumns: ['id', 'product_id', 'color', 'type', 'delta', 'before', 'after', 'at'],
    timestamptzColumns: ['at']
  },
  {
    name: 'quotes',
    columns: ['id', 'payload', 'updated_at', 'client_id'],
    jsonColumns: ['payload'],
    requiredColumns: ['id', 'payload'],
    timestamptzColumns: ['updated_at']
  },
  {
    name: 'invoices',
    columns: ['id', 'payload', 'updated_at', 'client_id', 'quote_id'],
    jsonColumns: ['payload'],
    requiredColumns: ['id', 'payload'],
    timestamptzColumns: ['updated_at']
  },
  {
    name: 'salary_advances',
    columns: ['id', 'employee_id', 'montant', 'note', 'date_avance', 'mois_reference', 'annee_reference', 'created_at'],
    numericColumns: ['montant', 'mois_reference', 'annee_reference'],
    requiredColumns: ['id', 'employee_id', 'montant', 'date_avance', 'mois_reference', 'annee_reference', 'created_at'],
    timestamptzColumns: ['date_avance', 'created_at']
  },
  {
    name: 'salary_bonuses',
    columns: ['id', 'employee_id', 'montant', 'motif', 'date_prime', 'mois_reference', 'annee_reference', 'created_at'],
    numericColumns: ['montant', 'mois_reference', 'annee_reference'],
    requiredColumns: ['id', 'employee_id', 'montant', 'date_prime', 'mois_reference', 'annee_reference', 'created_at'],
    timestamptzColumns: ['date_prime', 'created_at']
  },
  {
    name: 'salary_overtimes',
    columns: ['id', 'employee_id', 'hours', 'hourly_rate', 'amount', 'note', 'overtime_date', 'mois_reference', 'annee_reference', 'created_at'],
    numericColumns: ['hours', 'hourly_rate', 'amount', 'mois_reference', 'annee_reference'],
    requiredColumns: ['id', 'employee_id', 'hours', 'hourly_rate', 'amount', 'overtime_date', 'mois_reference', 'annee_reference', 'created_at'],
    timestamptzColumns: ['overtime_date', 'created_at']
  },
  {
    name: 'auth_challenges',
    columns: [
      'id',
      'user_id',
      'purpose',
      'code_hash',
      'expires_at',
      'used_at',
      'attempts_count',
      'max_attempts',
      'created_at',
      'requested_ip',
      'requested_user_agent'
    ],
    numericColumns: ['attempts_count', 'max_attempts'],
    requiredColumns: ['id', 'user_id', 'purpose', 'code_hash', 'expires_at', 'attempts_count', 'max_attempts', 'created_at'],
    timestamptzColumns: ['expires_at', 'used_at', 'created_at']
  },
  {
    name: 'security_audit_log',
    columns: ['id', 'user_id', 'event_type', 'email_attempted', 'success', 'ip', 'user_agent', 'details', 'created_at'],
    booleanColumns: ['success'],
    jsonColumns: ['details'],
    requiredColumns: ['id', 'event_type', 'success', 'created_at'],
    timestamptzColumns: ['created_at']
  }
];

const DELETE_ORDER = [...TABLE_CONFIGS].reverse().map((config) => config.name);

const RELATION_CHECKS = [
  {
    key: 'quotes.client_id',
    description: 'quotes.client_id -> clients.id',
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
    sql: `
      SELECT ac.id AS row_id, ac.user_id AS dangling_value
      FROM auth_challenges ac
      LEFT JOIN employees e ON e.id = ac.user_id
      WHERE ac.user_id IS NOT NULL AND e.id IS NULL
      ORDER BY ac.id
      LIMIT 20
    `
  },
  {
    key: 'security_audit_log.user_id',
    description: 'security_audit_log.user_id -> employees.id',
    sql: `
      SELECT sal.id AS row_id, sal.user_id AS dangling_value
      FROM security_audit_log sal
      LEFT JOIN employees e ON e.id = sal.user_id
      WHERE sal.user_id IS NOT NULL AND e.id IS NULL
      ORDER BY sal.id
      LIMIT 20
    `
  }
];

const JSON_VALIDATION_TARGETS = [
  { table: 'quotes', column: 'payload', required: true },
  { table: 'invoices', column: 'payload', required: true },
  { table: 'security_audit_log', column: 'details', required: false }
];

const parseArgs = (argv) => {
  const args = {
    execute: ['1', 'true', 'yes', 'on'].includes(String(process.env.MIGRATION_EXECUTE || '').toLowerCase())
      || ['0', 'false', 'no', 'off'].includes(String(process.env.DRY_RUN || '').toLowerCase()) && process.env.DRY_RUN !== '',
    batchSize: 100,
    reportDir: defaultReportDir
  };

  for (const arg of argv) {
    if (arg === '--execute') {
      args.execute = true;
      continue;
    }

    if (arg === '--dry-run') {
      args.execute = false;
      continue;
    }

    if (arg.startsWith('--batch-size=')) {
      const value = Number.parseInt(arg.slice('--batch-size='.length), 10);
      if (Number.isFinite(value) && value > 0) {
        args.batchSize = value;
      }
      continue;
    }

    if (arg.startsWith('--report-dir=')) {
      const value = arg.slice('--report-dir='.length).trim();
      if (value) {
        args.reportDir = path.isAbsolute(value) ? value : path.join(projectRoot, value);
      }
    }
  }

  return args;
};

const resolveTargetInfo = (connectionString, sslEnabled) => {
  try {
    const url = new URL(connectionString);
    return {
      host: url.hostname || null,
      port: url.port || null,
      database: url.pathname ? url.pathname.replace(/^\//, '') || null : null,
      ssl: sslEnabled ? 'enabled' : 'disabled'
    };
  } catch (_error) {
    return {
      host: null,
      port: null,
      database: null,
      ssl: sslEnabled ? 'enabled' : 'disabled'
    };
  }
};

const getSqliteTableNames = (sqliteDb) => new Set(
  sqliteDb.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
  `).all().map((row) => row.name)
);

const getTargetTableNames = async (client) => {
  const result = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
  `);
  return new Set(result.rows.map((row) => row.table_name));
};

const countPostgresTable = async (client, tableName) => {
  const result = await client.query(`SELECT COUNT(*)::bigint AS count FROM ${quoteIdent(tableName)}`);
  return Number(result.rows[0]?.count ?? 0);
};

const fetchPostgresCounts = async (client) => {
  const counts = {};
  for (const config of TABLE_CONFIGS) {
    counts[config.name] = await countPostgresTable(client, config.name);
  }
  return counts;
};

const normalizeBoolean = (value, context) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (value === 0) return false;
    if (value === 1) return true;
  }

  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase();
    if (['0', 'false', 'no', 'off'].includes(lowered)) return false;
    if (['1', 'true', 'yes', 'on'].includes(lowered)) return true;
  }

  throw new Error(`${context} contains a non-boolean value: ${JSON.stringify(value)}`);
};

const normalizeNumber = (value, context) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    if (Number.isFinite(value)) return value;
    throw new Error(`${context} contains a non-finite number.`);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${context} contains a non-numeric value: ${JSON.stringify(value)}`);
  }
  return parsed;
};

const normalizeJson = (value, context) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'object') {
    return value;
  }

  if (typeof value !== 'string') {
    throw new Error(`${context} contains a non-string JSON payload.`);
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error ?? 'invalid JSON');
    throw new Error(`${context} contains invalid JSON: ${message}`);
  }
};

const normalizeTimestamp = (value, context) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const stringValue = String(value).trim();
  if (!stringValue) {
    return null;
  }

  if (Number.isNaN(Date.parse(stringValue))) {
    throw new Error(`${context} contains an invalid timestamp: ${JSON.stringify(value)}`);
  }

  return stringValue;
};

const normalizeValue = (tableConfig, columnName, row, rowIndex) => {
  const context = `${tableConfig.name}[${rowIndex + 1}].${columnName}`;
  const rawValue = row[columnName];

  let normalized = rawValue;
  if (tableConfig.jsonColumns?.includes(columnName)) {
    normalized = normalizeJson(rawValue, context);
  } else if (tableConfig.booleanColumns?.includes(columnName)) {
    normalized = normalizeBoolean(rawValue, context);
  } else if (tableConfig.numericColumns?.includes(columnName)) {
    normalized = normalizeNumber(rawValue, context);
  } else if (tableConfig.timestamptzColumns?.includes(columnName)) {
    normalized = normalizeTimestamp(rawValue, context);
  }

  if (typeof normalized === 'string' && !tableConfig.jsonColumns?.includes(columnName)) {
    normalized = normalized.trim();
  }

  if (tableConfig.requiredColumns.includes(columnName) && (normalized === null || normalized === undefined || normalized === '')) {
    throw new Error(`${context} is required but empty.`);
  }

  return normalized === undefined ? null : normalized;
};

const loadSourceRows = (sqliteDb) => {
  const tablesPresent = getSqliteTableNames(sqliteDb);
  const missingTables = TABLE_CONFIGS.map((config) => config.name).filter((name) => !tablesPresent.has(name));
  if (missingTables.length) {
    throw new Error(`SQLite source is missing required tables: ${missingTables.join(', ')}`);
  }

  const tableResults = [];
  for (const tableConfig of TABLE_CONFIGS) {
    const selectColumns = tableConfig.columns.map((column) => quoteIdent(column)).join(', ');
    const rows = sqliteDb.prepare(`SELECT ${selectColumns} FROM ${quoteIdent(tableConfig.name)}`).all();
    const normalizedRows = rows.map((row, rowIndex) => {
      const normalizedRow = {};
      for (const columnName of tableConfig.columns) {
        normalizedRow[columnName] = normalizeValue(tableConfig, columnName, row, rowIndex);
      }
      return normalizedRow;
    });

    tableResults.push({
      name: tableConfig.name,
      columns: tableConfig.columns,
      rows: normalizedRows,
      sourceCount: normalizedRows.length
    });
  }

  return tableResults;
};

const insertBatch = async (client, tableName, columns, rows) => {
  if (!rows.length) {
    return;
  }

  const columnList = columns.map((column) => quoteIdent(column)).join(', ');
  const values = [];
  const placeholderGroups = rows.map((row, rowIndex) => {
    const placeholders = columns.map((_column, columnIndex) => {
      values.push(row[columns[columnIndex]]);
      return `$${rowIndex * columns.length + columnIndex + 1}`;
    });
    return `(${placeholders.join(', ')})`;
  });

  const sql = `INSERT INTO ${quoteIdent(tableName)} (${columnList}) VALUES ${placeholderGroups.join(', ')}`;
  await client.query(sql, values);
};

const deleteTargetData = async (client) => {
  const deletedCounts = {};
  for (const tableName of DELETE_ORDER) {
    const result = await client.query(`DELETE FROM ${quoteIdent(tableName)}`);
    deletedCounts[tableName] = Number(result.rowCount ?? 0);
  }
  return deletedCounts;
};

const runRelationChecks = async (client) => {
  const results = [];
  for (const check of RELATION_CHECKS) {
    const countSql = `SELECT COUNT(*)::bigint AS count FROM (${check.sql.replace(/\s+LIMIT 20\s*$/i, '')}) relation_subquery`;
    const countResult = await client.query(countSql);
    const sampleResult = await client.query(check.sql);
    results.push({
      key: check.key,
      description: check.description,
      count: Number(countResult.rows[0]?.count ?? 0),
      sample: sampleResult.rows
    });
  }
  return results;
};

const runJsonChecks = async (client, sourceTables) => {
  const sourceTableMap = new Map(sourceTables.map((table) => [table.name, table]));
  const results = [];

  for (const target of JSON_VALIDATION_TARGETS) {
    const sourceTable = sourceTableMap.get(target.table);
    const rows = sourceTable?.rows ?? [];
    const sourceInvalidRows = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const value = row[target.column];
      if (value === null || value === undefined) {
        if (target.required) {
          sourceInvalidRows.push({ rowId: row.id ?? index + 1, reason: 'required JSON value is null' });
        }
        continue;
      }

      try {
        JSON.stringify(value);
      } catch (error) {
        sourceInvalidRows.push({
          rowId: row.id ?? index + 1,
          reason: error instanceof Error ? error.message : String(error ?? 'JSON stringify failed')
        });
      }
    }

    const nullResult = await client.query(`
      SELECT COUNT(*)::bigint AS count
      FROM ${quoteIdent(target.table)}
      WHERE ${quoteIdent(target.column)} IS NULL
    `);

    const rowCountResult = await client.query(`SELECT COUNT(*)::bigint AS count FROM ${quoteIdent(target.table)}`);
    results.push({
      table: target.table,
      column: target.column,
      required: target.required,
      sourceRowCount: rows.length,
      sourceInvalidCount: sourceInvalidRows.length,
      sourceInvalidSample: sourceInvalidRows.slice(0, 10),
      targetRowCount: Number(rowCountResult.rows[0]?.count ?? 0),
      targetNullCount: Number(nullResult.rows[0]?.count ?? 0)
    });
  }

  return results;
};

const buildTimestampSlug = () => new Date().toISOString().replace(/[:.]/g, '-');

const describeError = (error) => {
  if (error instanceof Error) {
    if (error.message) return error.message;
    if (error.stack) return error.stack.split('\n')[0];
    return error.name || 'Unknown error';
  }

  if (typeof error === 'string' && error.trim()) {
    return error.trim();
  }

  try {
    const serialized = JSON.stringify(error);
    if (serialized && serialized !== '{}') {
      return serialized;
    }
  } catch (_serializationError) {
    // Ignore serialization failure and fall back below.
  }

  return 'Unknown error';
};

const formatMarkdownReport = (report) => {
  const lines = [];
  lines.push('# SQLite to PostgreSQL Migration Report');
  lines.push('');
  lines.push(`- Status: \`${report.status}\``);
  lines.push(`- Started at: \`${report.startedAt}\``);
  lines.push(`- Finished at: \`${report.finishedAt}\``);
  lines.push(`- Mode: \`${report.execute ? 'execute' : 'dry-run'}\``);
  lines.push(`- SQLite source: \`${report.sqlitePath}\``);
  lines.push(`- PostgreSQL target: \`${report.target.host ?? 'unknown-host'} / ${report.target.database ?? 'unknown-db'}\``);
  lines.push(`- SSL: \`${report.target.ssl}\``);
  lines.push('');

  if (report.error) {
    lines.push('## Error');
    lines.push('');
    lines.push(`- ${report.error.message}`);
    lines.push('');
  }

  lines.push('## Table Counts');
  lines.push('');
  lines.push('| Table | SQLite source | Target before | Deleted | Inserted | Target after | Match |');
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: | --- |');
  report.tables.forEach((table) => {
    lines.push(
      `| ${table.name} | ${table.sourceCount} | ${table.targetBeforeCount ?? '-'} | ${table.deletedCount ?? '-'} | ${table.insertedCount ?? '-'} | ${table.targetAfterCount ?? '-'} | ${table.countsMatch === null ? '-' : table.countsMatch ? 'yes' : 'no'} |`
    );
  });
  lines.push('');

  lines.push('## Relation Checks');
  lines.push('');
  report.validations.relations.forEach((check) => {
    lines.push(`- ${check.description}: ${check.count} orphan rows`);
  });
  lines.push('');

  lines.push('## JSON Checks');
  lines.push('');
  report.validations.json.forEach((check) => {
    lines.push(
      `- ${check.table}.${check.column}: source rows=${check.sourceRowCount}, source invalid=${check.sourceInvalidCount}, target rows=${check.targetRowCount}, target null=${check.targetNullCount}`
    );
  });
  lines.push('');

  return `${lines.join('\n')}\n`;
};

const writeReportFiles = (reportDir, report) => {
  fs.mkdirSync(reportDir, { recursive: true });

  const slug = buildTimestampSlug();
  const jsonLatestPath = path.join(reportDir, 'sqlite-to-postgres-migration.latest.json');
  const markdownLatestPath = path.join(reportDir, 'sqlite-to-postgres-migration.latest.md');
  const jsonTimestampedPath = path.join(reportDir, `sqlite-to-postgres-migration.${slug}.json`);
  const markdownTimestampedPath = path.join(reportDir, `sqlite-to-postgres-migration.${slug}.md`);

  const markdown = formatMarkdownReport(report);
  const json = JSON.stringify(report, null, 2);

  fs.writeFileSync(jsonLatestPath, json);
  fs.writeFileSync(markdownLatestPath, markdown);
  fs.writeFileSync(jsonTimestampedPath, json);
  fs.writeFileSync(markdownTimestampedPath, markdown);

  return {
    jsonLatestPath,
    markdownLatestPath,
    jsonTimestampedPath,
    markdownTimestampedPath
  };
};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const sqlitePath = resolveSqlitePath();
  const sqliteDb = new Database(sqlitePath, { readonly: true });
  const report = {
    startedAt: new Date().toISOString(),
    finishedAt: null,
    status: 'running',
    execute: options.execute,
    sqlitePath,
    target: {
      host: null,
      port: null,
      database: null,
      ssl: null
    },
    tables: TABLE_CONFIGS.map((config) => ({
      name: config.name,
      sourceCount: 0,
      targetBeforeCount: null,
      deletedCount: null,
      insertedCount: options.execute ? 0 : null,
      targetAfterCount: null,
      countsMatch: null
    })),
    validations: {
      relations: [],
      json: []
    },
    error: null
  };

  try {
    if (!fs.existsSync(sqlitePath)) {
      throw new Error(`SQLite source file not found: ${sqlitePath}`);
    }

    if (!isPostgresConfigured()) {
      throw new Error('DATABASE_URL is not configured.');
    }

    const postgresConfig = getPostgresConfig();
    report.target = resolveTargetInfo(postgresConfig.connectionString, !!postgresConfig.ssl);

    const sourceTables = loadSourceRows(sqliteDb);
    const sourceTableMap = new Map(sourceTables.map((table) => [table.name, table]));
    report.tables = report.tables.map((table) => ({
      ...table,
      sourceCount: sourceTableMap.get(table.name)?.sourceCount ?? 0
    }));

    await withClient(async (client) => {
      const targetTables = await getTargetTableNames(client);
      const missingTargetTables = TABLE_CONFIGS.map((config) => config.name).filter((name) => !targetTables.has(name));
      if (missingTargetTables.length) {
        throw new Error(`PostgreSQL target is missing required tables: ${missingTargetTables.join(', ')}`);
      }

      const countsBefore = await fetchPostgresCounts(client);
      report.tables = report.tables.map((table) => ({
        ...table,
        targetBeforeCount: countsBefore[table.name] ?? 0
      }));

      if (!options.execute) {
        report.validations.relations = await runRelationChecks(client);
        report.validations.json = await runJsonChecks(client, sourceTables);
        report.status = 'dry-run';
        return;
      }

      await client.query('BEGIN');
      try {
        const deletedCounts = await deleteTargetData(client);
        report.tables = report.tables.map((table) => ({
          ...table,
          deletedCount: deletedCounts[table.name] ?? 0
        }));

        for (const sourceTable of sourceTables) {
          if (!sourceTable.rows.length) {
            const targetAfterCount = await countPostgresTable(client, sourceTable.name);
            report.tables = report.tables.map((table) => (
              table.name === sourceTable.name
                ? { ...table, insertedCount: 0, targetAfterCount, countsMatch: targetAfterCount === 0 }
                : table
            ));
            console.log(`[db-migration] ${sourceTable.name}: 0 rows to import`);
            continue;
          }

          let insertedCount = 0;
          for (let index = 0; index < sourceTable.rows.length; index += options.batchSize) {
            const batch = sourceTable.rows.slice(index, index + options.batchSize);
            await insertBatch(client, sourceTable.name, sourceTable.columns, batch);
            insertedCount += batch.length;
          }

          const targetAfterCount = await countPostgresTable(client, sourceTable.name);
          report.tables = report.tables.map((table) => (
            table.name === sourceTable.name
              ? {
                  ...table,
                  insertedCount,
                  targetAfterCount,
                  countsMatch: insertedCount === sourceTable.sourceCount && targetAfterCount === sourceTable.sourceCount
                }
              : table
          ));
          console.log(`[db-migration] ${sourceTable.name}: imported ${insertedCount} rows`);
        }

        report.validations.relations = await runRelationChecks(client);
        report.validations.json = await runJsonChecks(client, sourceTables);

        const countMismatchTables = report.tables.filter((table) => table.countsMatch === false).map((table) => table.name);
        if (countMismatchTables.length) {
          throw new Error(`Row count mismatch detected after import for: ${countMismatchTables.join(', ')}`);
        }

        const relationIssues = report.validations.relations.filter((check) => check.count > 0);
        if (relationIssues.length) {
          throw new Error(`Relation consistency checks failed for: ${relationIssues.map((check) => check.key).join(', ')}`);
        }

        const jsonIssues = report.validations.json.filter((check) => {
          if (check.sourceInvalidCount > 0) return true;
          if (check.required && check.targetNullCount > 0) return true;
          return false;
        });
        if (jsonIssues.length) {
          throw new Error(`JSON validation failed for: ${jsonIssues.map((check) => `${check.table}.${check.column}`).join(', ')}`);
        }

        await client.query('COMMIT');
        report.status = 'completed';
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    });
  } catch (error) {
    report.status = 'failed';
    report.error = {
      message: describeError(error)
    };
    throw error;
  } finally {
    report.finishedAt = new Date().toISOString();
    sqliteDb.close();
    const paths = writeReportFiles(options.reportDir, report);
    console.log('[db-migration] JSON report:', paths.jsonLatestPath);
    console.log('[db-migration] Markdown report:', paths.markdownLatestPath);
    await closePostgresPool();
  }
}

main().catch((error) => {
  console.error('[db-migration] Migration failed:', describeError(error));
  process.exitCode = 1;
});
