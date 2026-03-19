const fs = require('fs');
const path = require('path');

try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch (_error) {
  // dotenv is optional here; process env can still be provided externally.
}

let Database;
const localBackendBetterSqlitePath = path.join(__dirname, 'node_modules', 'better-sqlite3');
const rootBetterSqlitePath = path.join(__dirname, '..', 'node_modules', 'better-sqlite3');
const installHint =
  '\n[backend] Missing Node-compatible better-sqlite3. Run: npm.cmd install --prefix backend';

try {
  Database = require(localBackendBetterSqlitePath);
} catch (_error) {
  try {
    Database = require(rootBetterSqlitePath);
  } catch (_rootError) {
    try {
      Database = require('better-sqlite3');
    } catch (packageError) {
      const baseMessage =
        packageError instanceof Error
          ? packageError.message
          : 'Unable to load better-sqlite3';
      throw new Error(`${baseMessage}${installHint}`);
    }
  }
}

const configuredDatabasePath =
  typeof process.env.DATABASE_PATH === 'string' ? process.env.DATABASE_PATH.trim() : '';

const dbPath =
  configuredDatabasePath ||
  (process.env.APPDATA
    ? path.join(process.env.APPDATA, 'SPA', 'spa.db')
    : path.join(__dirname, 'data', 'spa.db'));

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

console.log('[backend-db] Using database:', dbPath);
console.log('[backend-db] Database file exists:', fs.existsSync(dbPath));

const db = new Database(dbPath);

const hasTable = (tableName) =>
  !!db
    .prepare(`
      SELECT 1
      FROM sqlite_master
      WHERE type = 'table' AND name = ?
      LIMIT 1
    `)
    .get(tableName);

console.log('[backend-db] employees table exists:', hasTable('employees'));

const hasColumn = (tableName, columnName) => {
  if (!hasTable(tableName)) return false;
  const safeTableName = tableName.replace(/"/g, '""');
  const columns = db.prepare(`PRAGMA table_info("${safeTableName}")`).all();
  return columns.some((column) => column.name === columnName);
};

const addColumnIfMissing = (tableName, columnSql, columnName) => {
  if (!hasTable(tableName)) return;
  if (hasColumn(tableName, columnName)) return;
  try {
    const safeTableName = tableName.replace(/"/g, '""');
    db.prepare(`ALTER TABLE "${safeTableName}" ADD COLUMN ${columnSql}`).run();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error ?? 'UNKNOWN');
    console.warn(`[server-db] migration skipped (${tableName}.${columnName}): ${reason}`);
  }
};

addColumnIfMissing('products', 'is_deleted INTEGER NOT NULL DEFAULT 0', 'is_deleted');
addColumnIfMissing('products', 'deleted_at TEXT', 'deleted_at');

addColumnIfMissing('employees', 'can_add_stock INTEGER NOT NULL DEFAULT 0', 'can_add_stock');
addColumnIfMissing('employees', 'can_remove_stock INTEGER NOT NULL DEFAULT 0', 'can_remove_stock');
addColumnIfMissing('employees', 'can_adjust_stock INTEGER NOT NULL DEFAULT 0', 'can_adjust_stock');
addColumnIfMissing(
  'employees',
  'can_edit_stock_product INTEGER NOT NULL DEFAULT 0',
  'can_edit_stock_product'
);
addColumnIfMissing(
  'employees',
  'can_archive_stock_product INTEGER NOT NULL DEFAULT 0',
  'can_archive_stock_product'
);
addColumnIfMissing(
  'employees',
  'can_manage_estimations INTEGER NOT NULL DEFAULT 0',
  'can_manage_estimations'
);
addColumnIfMissing(
  'employees',
  'can_manage_archives INTEGER NOT NULL DEFAULT 0',
  'can_manage_archives'
);
addColumnIfMissing(
  'employees',
  'can_manage_inventory INTEGER NOT NULL DEFAULT 0',
  'can_manage_inventory'
);
addColumnIfMissing('employees', 'can_view_history INTEGER NOT NULL DEFAULT 0', 'can_view_history');
addColumnIfMissing('employees', 'can_manage_all INTEGER NOT NULL DEFAULT 0', 'can_manage_all');

if (hasTable('employees')) {
  db.prepare(`
    UPDATE employees
    SET
      can_add_stock = CASE
        WHEN COALESCE(can_manage_stock, 0) = 1 THEN 1
        ELSE COALESCE(can_add_stock, 0)
      END,
      can_remove_stock = CASE
        WHEN COALESCE(can_manage_stock, 0) = 1 THEN 1
        ELSE COALESCE(can_remove_stock, 0)
      END,
      can_adjust_stock = CASE
        WHEN COALESCE(can_manage_stock, 0) = 1 THEN 1
        ELSE COALESCE(can_adjust_stock, 0)
      END,
      can_edit_stock_product = CASE
        WHEN COALESCE(can_manage_stock, 0) = 1 THEN 1
        ELSE COALESCE(can_edit_stock_product, 0)
      END,
      can_archive_stock_product = CASE
        WHEN COALESCE(can_manage_stock, 0) = 1 THEN 1
        ELSE COALESCE(can_archive_stock_product, 0)
      END,
      can_manage_estimations = CASE
        WHEN COALESCE(can_manage_quotes, 0) = 1 THEN 1
        ELSE COALESCE(can_manage_estimations, 0)
      END,
      can_manage_archives = CASE
        WHEN COALESCE(can_manage_stock, 0) = 1 THEN 1
        ELSE COALESCE(can_manage_archives, 0)
      END,
      can_manage_all = CASE
        WHEN role IN ('admin', 'developer', 'owner') THEN 1
        ELSE COALESCE(can_manage_all, 0)
      END
  `).run();
}

db.exec(`
  CREATE TABLE IF NOT EXISTS salary_overtimes (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    hours REAL NOT NULL,
    hourly_rate REAL NOT NULL,
    amount REAL NOT NULL,
    note TEXT,
    overtime_date TEXT NOT NULL,
    mois_reference INTEGER NOT NULL,
    annee_reference INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_salary_overtimes_employee_id
  ON salary_overtimes(employee_id);

  CREATE INDEX IF NOT EXISTS idx_salary_overtimes_month_year
  ON salary_overtimes(mois_reference, annee_reference);
`);

module.exports = db;
