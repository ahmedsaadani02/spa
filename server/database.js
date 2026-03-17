const path = require('path');

let Database;
const localServerBetterSqlitePath = path.join(__dirname, 'node_modules', 'better-sqlite3');
const installHint = '\n[server] Missing Node-compatible better-sqlite3. Run: npm.cmd install --prefix server';

try {
  // Web-first mode: require server-local dependency to avoid Electron ABI conflicts.
  Database = require(localServerBetterSqlitePath);
} catch (error) {
  const baseMessage = error instanceof Error ? error.message : 'Unable to load better-sqlite3';
  throw new Error(`${baseMessage}${installHint}`);
}

const appData = process.env.APPDATA;
if (!appData) {
  throw new Error('APPDATA is not defined. Unable to locate spa.db.');
}

const dbPath = path.join(appData, 'spa-invoice-desktop', 'spa.db');
const db = new Database(dbPath);

const hasTable = (tableName) => !!db.prepare(`
  SELECT 1
  FROM sqlite_master
  WHERE type = 'table' AND name = ?
  LIMIT 1
`).get(tableName);

const hasColumn = (tableName, columnName) => {
  if (!hasTable(tableName)) return false;
  const columns = db.prepare(`PRAGMA table_info("${tableName.replace(/"/g, '""')}")`).all();
  return columns.some((column) => column.name === columnName);
};

const addColumnIfMissing = (tableName, columnSql, columnName) => {
  if (!hasTable(tableName)) return;
  if (hasColumn(tableName, columnName)) return;
  try {
    db.prepare(`ALTER TABLE "${tableName.replace(/"/g, '""')}" ADD COLUMN ${columnSql}`).run();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error ?? 'UNKNOWN');
    console.warn(`[server-db] migration skipped (${tableName}.${columnName}): ${reason}`);
  }
};

// Web-first safety migration: keep product purge/list queries compatible even when
// Electron migrations were not executed before running `npm run start`.
addColumnIfMissing('products', 'is_deleted INTEGER NOT NULL DEFAULT 0', 'is_deleted');
addColumnIfMissing('products', 'deleted_at TEXT', 'deleted_at');
addColumnIfMissing('employees', 'can_add_stock INTEGER NOT NULL DEFAULT 0', 'can_add_stock');
addColumnIfMissing('employees', 'can_remove_stock INTEGER NOT NULL DEFAULT 0', 'can_remove_stock');
addColumnIfMissing('employees', 'can_adjust_stock INTEGER NOT NULL DEFAULT 0', 'can_adjust_stock');
addColumnIfMissing('employees', 'can_manage_estimations INTEGER NOT NULL DEFAULT 0', 'can_manage_estimations');
addColumnIfMissing('employees', 'can_manage_archives INTEGER NOT NULL DEFAULT 0', 'can_manage_archives');
addColumnIfMissing('employees', 'can_manage_inventory INTEGER NOT NULL DEFAULT 0', 'can_manage_inventory');
addColumnIfMissing('employees', 'can_view_history INTEGER NOT NULL DEFAULT 0', 'can_view_history');
addColumnIfMissing('employees', 'can_manage_all INTEGER NOT NULL DEFAULT 0', 'can_manage_all');

if (hasTable('employees')) {
  db.prepare(`
    UPDATE employees
    SET
      can_add_stock = CASE WHEN COALESCE(can_manage_stock, 0) = 1 THEN 1 ELSE COALESCE(can_add_stock, 0) END,
      can_remove_stock = CASE WHEN COALESCE(can_manage_stock, 0) = 1 THEN 1 ELSE COALESCE(can_remove_stock, 0) END,
      can_adjust_stock = CASE WHEN COALESCE(can_manage_stock, 0) = 1 THEN 1 ELSE COALESCE(can_adjust_stock, 0) END,
      can_manage_estimations = CASE WHEN COALESCE(can_manage_quotes, 0) = 1 THEN 1 ELSE COALESCE(can_manage_estimations, 0) END,
      can_manage_archives = CASE WHEN COALESCE(can_manage_stock, 0) = 1 THEN 1 ELSE COALESCE(can_manage_archives, 0) END,
      can_manage_inventory = CASE WHEN COALESCE(can_view_stock, 0) = 1 THEN 1 ELSE COALESCE(can_manage_inventory, 0) END,
      can_view_history = CASE WHEN COALESCE(can_view_stock, 0) = 1 THEN 1 ELSE COALESCE(can_view_history, 0) END,
      can_manage_all = CASE WHEN role IN ('admin', 'developer', 'owner') THEN 1 ELSE COALESCE(can_manage_all, 0) END
  `).run();
}

// Web-first safety migration: salary overtime table used by RH module.
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
  CREATE INDEX IF NOT EXISTS idx_salary_overtimes_employee_id ON salary_overtimes(employee_id);
  CREATE INDEX IF NOT EXISTS idx_salary_overtimes_month_year ON salary_overtimes(mois_reference, annee_reference);
`);

module.exports = db;
