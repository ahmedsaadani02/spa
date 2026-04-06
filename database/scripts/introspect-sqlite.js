#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..', '..');
const schemaDir = path.join(projectRoot, 'database', 'schema');
const jsonOutputPath = path.join(schemaDir, 'sqlite-introspection.latest.json');
const markdownOutputPath = path.join(schemaDir, 'sqlite-introspection.latest.md');

try {
  require('dotenv').config({ path: path.join(projectRoot, '.env') });
} catch (_error) {
  // Ignore: env may already be provided by the shell.
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

  throw new Error('Unable to load better-sqlite3 for SQLite introspection.');
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

const readDraftSchema = () => {
  const draftPath = path.join(schemaDir, '001_postgres_initial_draft.sql');
  if (!fs.existsSync(draftPath)) {
    return { path: draftPath, tables: [] };
  }

  const sql = fs.readFileSync(draftPath, 'utf8');
  const matches = Array.from(sql.matchAll(/CREATE TABLE IF NOT EXISTS\s+([a-zA-Z_][a-zA-Z0-9_]*)/g));
  return {
    path: draftPath,
    tables: Array.from(new Set(matches.map((match) => match[1]))).sort()
  };
};

const dbPath = resolveSqlitePath();
const db = new Database(dbPath, { readonly: true });

const getTableNames = () => db.prepare(`
  SELECT name, sql
  FROM sqlite_master
  WHERE type = 'table'
    AND name NOT LIKE 'sqlite_%'
  ORDER BY name
`).all();

const getColumns = (tableName) => db.prepare(`PRAGMA table_info(${quoteIdent(tableName)})`).all().map((column) => ({
  cid: column.cid,
  name: column.name,
  declaredType: column.type || '',
  notNull: Number(column.notnull) === 1,
  defaultValue: column.dflt_value,
  primaryKeyOrder: Number(column.pk) || 0
}));

const getForeignKeys = (tableName) => db.prepare(`PRAGMA foreign_key_list(${quoteIdent(tableName)})`).all().map((fk) => ({
  id: fk.id,
  seq: fk.seq,
  table: fk.table,
  from: fk.from,
  to: fk.to,
  onUpdate: fk.on_update,
  onDelete: fk.on_delete,
  match: fk.match
}));

const getIndexes = (tableName) => db.prepare(`PRAGMA index_list(${quoteIdent(tableName)})`).all().map((indexRow) => {
  const columns = db.prepare(`PRAGMA index_info(${quoteIdent(indexRow.name)})`).all().map((column) => ({
    seqno: column.seqno,
    cid: column.cid,
    name: column.name
  }));

  const definitionRow = db.prepare(`
    SELECT sql
    FROM sqlite_master
    WHERE type = 'index' AND name = ?
    LIMIT 1
  `).get(indexRow.name);

  return {
    name: indexRow.name,
    unique: Number(indexRow.unique) === 1,
    origin: indexRow.origin,
    partial: Number(indexRow.partial) === 1,
    columns,
    sql: definitionRow?.sql ?? null
  };
});

const actualTables = getTableNames().map((tableRow) => ({
  name: tableRow.name,
  sql: tableRow.sql ?? null,
  columns: getColumns(tableRow.name),
  foreignKeys: getForeignKeys(tableRow.name),
  indexes: getIndexes(tableRow.name)
}));

const draft = readDraftSchema();
const actualTableNames = actualTables.map((table) => table.name).sort();
const draftTableNames = draft.tables;

const comparison = {
  actualOnlyTables: actualTableNames.filter((name) => !draftTableNames.includes(name)),
  draftOnlyTables: draftTableNames.filter((name) => !actualTableNames.includes(name)),
  sharedTables: actualTableNames.filter((name) => draftTableNames.includes(name))
};

const report = {
  generatedAt: new Date().toISOString(),
  sqlitePath: dbPath,
  draftSchemaPath: draft.path,
  tablesCount: actualTables.length,
  tables: actualTables,
  comparison
};

const toMarkdown = (data) => {
  const lines = [];
  lines.push('# SQLite Introspection');
  lines.push('');
  lines.push(`- Generated at: \`${data.generatedAt}\``);
  lines.push(`- SQLite path: \`${data.sqlitePath}\``);
  lines.push(`- Tables found: \`${data.tablesCount}\``);
  lines.push('');
  lines.push('## Draft Comparison');
  lines.push('');
  lines.push(`- Shared tables: ${data.comparison.sharedTables.length}`);
  lines.push(`- Actual only: ${data.comparison.actualOnlyTables.length}`);
  lines.push(`- Draft only: ${data.comparison.draftOnlyTables.length}`);
  lines.push('');

  if (data.comparison.actualOnlyTables.length) {
    lines.push('### Actual Only Tables');
    lines.push('');
    data.comparison.actualOnlyTables.forEach((table) => lines.push(`- \`${table}\``));
    lines.push('');
  }

  if (data.comparison.draftOnlyTables.length) {
    lines.push('### Draft Only Tables');
    lines.push('');
    data.comparison.draftOnlyTables.forEach((table) => lines.push(`- \`${table}\``));
    lines.push('');
  }

  lines.push('## Tables');
  lines.push('');

  data.tables.forEach((table) => {
    lines.push(`### ${table.name}`);
    lines.push('');
    if (table.sql) {
      lines.push('```sql');
      lines.push(table.sql.trim());
      lines.push('```');
      lines.push('');
    }

    lines.push('| Column | Type | Not Null | Default | PK |');
    lines.push('| --- | --- | --- | --- | --- |');
    table.columns.forEach((column) => {
      lines.push(`| \`${column.name}\` | \`${column.declaredType || ''}\` | ${column.notNull ? 'yes' : 'no'} | \`${column.defaultValue ?? ''}\` | \`${column.primaryKeyOrder}\` |`);
    });
    lines.push('');

    if (table.foreignKeys.length) {
      lines.push('Foreign keys:');
      table.foreignKeys.forEach((fk) => {
        lines.push(`- \`${fk.from}\` -> \`${fk.table}.${fk.to}\` (on update: ${fk.onUpdate}, on delete: ${fk.onDelete})`);
      });
      lines.push('');
    }

    if (table.indexes.length) {
      lines.push('Indexes:');
      table.indexes.forEach((index) => {
        const columns = index.columns.map((column) => column.name).filter(Boolean).join(', ');
        lines.push(`- \`${index.name}\` | unique=${index.unique} | partial=${index.partial} | origin=${index.origin} | columns=[${columns}]`);
      });
      lines.push('');
    }
  });

  return `${lines.join('\n')}\n`;
};

fs.mkdirSync(schemaDir, { recursive: true });
fs.writeFileSync(jsonOutputPath, JSON.stringify(report, null, 2));
fs.writeFileSync(markdownOutputPath, toMarkdown(report));

console.log('[sqlite-introspect] SQLite path:', dbPath);
console.log('[sqlite-introspect] Tables found:', actualTables.length);
console.log('[sqlite-introspect] JSON report:', jsonOutputPath);
console.log('[sqlite-introspect] Markdown report:', markdownOutputPath);
console.log('[sqlite-introspect] Actual only tables:', comparison.actualOnlyTables.length ? comparison.actualOnlyTables.join(', ') : 'none');
console.log('[sqlite-introspect] Draft only tables:', comparison.draftOnlyTables.length ? comparison.draftOnlyTables.join(', ') : 'none');
