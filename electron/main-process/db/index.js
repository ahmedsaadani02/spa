const { app } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');
const { seedProductsIfEmpty } = require('./seed');
const { migrateJsonDocuments } = require('./json-migration');
const { syncCataloguePrices } = require('./catalogue-sync');
const { backfillDocumentClientLinks } = require('./clients');
const { hashPassword } = require('../auth/service');
const { PROTECTED_ACCOUNTS, normalizeEmail } = require('../auth/protected-accounts');
const {
  normalizeStoredProductImageRef,
  migrateLegacyProductImageRef,
  PLACEHOLDER_IMAGE
} = require('../product-images');

let db;

const dbFilePath = () => path.join(app.getPath('userData'), 'spa.db');

const quoteIdentifier = (identifier) => `"${String(identifier).replace(/"/g, '""')}"`;
const MOJIBAKE_PATTERN = /(Ã.|Â.|â€|â€™|â€œ|â€|ï¿½|�)/;
const MOJIBAKE_TOKEN_REGEX = /(Ã.|Â.|â€|â€™|â€œ|â€|ï¿½|�)/g;
const MOJIBAKE_REPLACEMENTS = [
  ['â€™', '’'],
  ['â€˜', '‘'],
  ['â€œ', '“'],
  ['â€', '”'],
  ['â€“', '–'],
  ['â€”', '—'],
  ['Â°', '°'],
  ['Â', ''],
  ['Ã€', 'À'],
  ['Ã‚', 'Â'],
  ['Ãƒ', 'Ã'],
  ['Ã„', 'Ä'],
  ['Ã‡', 'Ç'],
  ['Ãˆ', 'È'],
  ['Ã‰', 'É'],
  ['ÃŠ', 'Ê'],
  ['Ã‹', 'Ë'],
  ['ÃŽ', 'Î'],
  ['Ã”', 'Ô'],
  ['Ã™', 'Ù'],
  ['Ã›', 'Û'],
  ['Ã ', 'à'],
  ['Ã¢', 'â'],
  ['Ã¤', 'ä'],
  ['Ã§', 'ç'],
  ['Ã¨', 'è'],
  ['Ã©', 'é'],
  ['Ãª', 'ê'],
  ['Ã«', 'ë'],
  ['Ã®', 'î'],
  ['Ã´', 'ô'],
  ['Ã¹', 'ù'],
  ['Ã»', 'û'],
  ['Ã¼', 'ü']
];

const countMojibakeTokens = (value) => {
  if (typeof value !== 'string') return 0;
  const matches = value.match(MOJIBAKE_TOKEN_REGEX);
  return matches ? matches.length : 0;
};

const repairMojibakeText = (value) => {
  if (typeof value !== 'string') return value;
  if (!MOJIBAKE_PATTERN.test(value)) return value;

  let candidate = value;
  for (let i = 0; i < 3; i += 1) {
    if (!MOJIBAKE_PATTERN.test(candidate)) break;
    const decoded = Buffer.from(candidate, 'latin1').toString('utf8');
    if (decoded === candidate) break;
    if (countMojibakeTokens(decoded) <= countMojibakeTokens(candidate)) {
      candidate = decoded;
    } else {
      break;
    }
  }

  if (MOJIBAKE_PATTERN.test(candidate)) {
    let replaced = candidate;
    MOJIBAKE_REPLACEMENTS.forEach(([source, target]) => {
      replaced = replaced.split(source).join(target);
    });
    if (countMojibakeTokens(replaced) <= countMojibakeTokens(candidate)) {
      candidate = replaced;
    }
  }

  return candidate.normalize('NFC');
};

const hasTable = (dbInstance, tableName) => {
  const row = dbInstance.prepare(`
    SELECT 1
    FROM sqlite_master
    WHERE type = 'table' AND name = ?
    LIMIT 1
  `).get(tableName);
  return !!row;
};

const hasColumn = (dbInstance, tableName, columnName) => {
  if (!hasTable(dbInstance, tableName)) {
    return false;
  }
  const columns = dbInstance.prepare(`PRAGMA table_info(${quoteIdentifier(tableName)})`).all();
  return columns.some((column) => column.name === columnName);
};

const hasColumns = (dbInstance, tableName, columnNames) => columnNames.every((column) => hasColumn(dbInstance, tableName, column));

const addColumnIfMissing = (dbInstance, tableName, columnSql, columnName) => {
  if (!hasTable(dbInstance, tableName)) {
    return;
  }
  if (!hasColumn(dbInstance, tableName, columnName)) {
    dbInstance.prepare(`ALTER TABLE ${quoteIdentifier(tableName)} ADD COLUMN ${columnSql}`).run();
  }
};

const ensureIndexIfColumnsExist = (dbInstance, indexName, tableName, columnNames, options = {}) => {
  if (!hasTable(dbInstance, tableName)) {
    return;
  }
  const hasAllColumns = columnNames.every((column) => hasColumn(dbInstance, tableName, column));
  if (!hasAllColumns) {
    return;
  }

  const uniqueKeyword = options.unique ? 'UNIQUE ' : '';
  const columnsSql = columnNames.map((column) => quoteIdentifier(column)).join(', ');
  dbInstance.exec(
    `CREATE ${uniqueKeyword}INDEX IF NOT EXISTS ${quoteIdentifier(indexName)} ON ${quoteIdentifier(tableName)}(${columnsSql});`
  );
};

const ensureDocumentClientColumns = (dbInstance) => {
  addColumnIfMissing(dbInstance, 'invoices', 'client_id TEXT REFERENCES clients(id) ON DELETE SET NULL', 'client_id');
  addColumnIfMissing(dbInstance, 'invoices', 'quote_id TEXT', 'quote_id');
  addColumnIfMissing(dbInstance, 'quotes', 'client_id TEXT REFERENCES clients(id) ON DELETE SET NULL', 'client_id');
};

const ensurePriceHistoryColumns = (dbInstance) => {
  addColumnIfMissing(dbInstance, 'price_history', 'changed_by TEXT NOT NULL DEFAULT "erp-user"', 'changed_by');
  addColumnIfMissing(dbInstance, 'price_history', 'color TEXT NOT NULL DEFAULT "blanc"', 'color');
};

const ensureProductColumns = (dbInstance) => {
  addColumnIfMissing(dbInstance, 'products', 'description TEXT', 'description');
  addColumnIfMissing(dbInstance, 'products', 'image_url TEXT', 'image_url');
  addColumnIfMissing(dbInstance, 'products', 'is_archived INTEGER NOT NULL DEFAULT 0', 'is_archived');
  addColumnIfMissing(dbInstance, 'products', 'archived_at TEXT', 'archived_at');
  addColumnIfMissing(dbInstance, 'products', 'is_deleted INTEGER NOT NULL DEFAULT 0', 'is_deleted');
  addColumnIfMissing(dbInstance, 'products', 'deleted_at TEXT', 'deleted_at');
};

const ensureMovementsActorColumns = (dbInstance) => {
  addColumnIfMissing(dbInstance, 'movements', 'employee_id TEXT', 'employee_id');
  addColumnIfMissing(dbInstance, 'movements', 'employee_name TEXT', 'employee_name');
  addColumnIfMissing(dbInstance, 'movements', 'username TEXT', 'username');
};

const ensureProductCatalogMetadataTable = (dbInstance) => {
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS product_catalog_metadata (
      kind TEXT NOT NULL,
      value TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (kind, value)
    );
  `);
};

const seedProductCatalogMetadataFromExisting = (dbInstance) => {
  if (!hasTable(dbInstance, 'product_catalog_metadata')) {
    return;
  }

  const now = new Date().toISOString();
  const insertStmt = dbInstance.prepare(`
    INSERT INTO product_catalog_metadata (kind, value, created_at, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(kind, value) DO UPDATE SET
      updated_at = excluded.updated_at
  `);

  if (hasTable(dbInstance, 'products')) {
    if (hasColumn(dbInstance, 'products', 'category')) {
      const categories = dbInstance.prepare(`
        SELECT DISTINCT lower(trim(category)) AS value
        FROM products
        WHERE category IS NOT NULL AND trim(category) <> ''
      `).all();
      categories.forEach((row) => {
        if (!row?.value) return;
        insertStmt.run('category', row.value, now, now);
      });
    }

    if (hasColumn(dbInstance, 'products', 'serie')) {
      const series = dbInstance.prepare(`
        SELECT DISTINCT lower(trim(serie)) AS value
        FROM products
        WHERE serie IS NOT NULL AND trim(serie) <> ''
      `).all();
      series.forEach((row) => {
        if (!row?.value) return;
        insertStmt.run('serie', row.value, now, now);
      });
    }
  }

  if (hasTable(dbInstance, 'stock') && hasColumn(dbInstance, 'stock', 'color')) {
    const colors = dbInstance.prepare(`
      SELECT DISTINCT lower(trim(color)) AS value
      FROM stock
      WHERE color IS NOT NULL AND trim(color) <> ''
    `).all();
    colors.forEach((row) => {
      if (!row?.value) return;
      insertStmt.run('color', row.value, now, now);
    });
  }
};

const ensureEmployeeColumns = (dbInstance) => {
  addColumnIfMissing(dbInstance, 'employees', 'telephone TEXT', 'telephone');
  addColumnIfMissing(dbInstance, 'employees', 'adresse TEXT', 'adresse');
  addColumnIfMissing(dbInstance, 'employees', 'poste TEXT', 'poste');
  addColumnIfMissing(dbInstance, 'employees', 'salaire_base REAL NOT NULL DEFAULT 0', 'salaire_base');
  addColumnIfMissing(dbInstance, 'employees', 'date_embauche TEXT', 'date_embauche');
  addColumnIfMissing(dbInstance, 'employees', 'actif INTEGER NOT NULL DEFAULT 1', 'actif');
  addColumnIfMissing(dbInstance, 'employees', 'username TEXT', 'username');
  addColumnIfMissing(dbInstance, 'employees', 'email TEXT', 'email');
  addColumnIfMissing(dbInstance, 'employees', 'email_normalized TEXT', 'email_normalized');
  addColumnIfMissing(dbInstance, 'employees', 'password_hash TEXT', 'password_hash');
  addColumnIfMissing(dbInstance, 'employees', 'role TEXT NOT NULL DEFAULT "employee"', 'role');
  addColumnIfMissing(dbInstance, 'employees', 'is_active INTEGER NOT NULL DEFAULT 1', 'is_active');
  addColumnIfMissing(dbInstance, 'employees', 'is_protected_account INTEGER NOT NULL DEFAULT 0', 'is_protected_account');
  addColumnIfMissing(dbInstance, 'employees', 'requires_email_2fa INTEGER NOT NULL DEFAULT 0', 'requires_email_2fa');
  addColumnIfMissing(dbInstance, 'employees', 'must_setup_password INTEGER NOT NULL DEFAULT 0', 'must_setup_password');
  addColumnIfMissing(dbInstance, 'employees', 'can_view_stock INTEGER NOT NULL DEFAULT 0', 'can_view_stock');
  addColumnIfMissing(dbInstance, 'employees', 'can_add_stock INTEGER NOT NULL DEFAULT 0', 'can_add_stock');
  addColumnIfMissing(dbInstance, 'employees', 'can_remove_stock INTEGER NOT NULL DEFAULT 0', 'can_remove_stock');
  addColumnIfMissing(dbInstance, 'employees', 'can_adjust_stock INTEGER NOT NULL DEFAULT 0', 'can_adjust_stock');
  addColumnIfMissing(dbInstance, 'employees', 'can_manage_stock INTEGER NOT NULL DEFAULT 0', 'can_manage_stock');
  addColumnIfMissing(dbInstance, 'employees', 'can_manage_employees INTEGER NOT NULL DEFAULT 0', 'can_manage_employees');
  addColumnIfMissing(dbInstance, 'employees', 'can_manage_invoices INTEGER NOT NULL DEFAULT 0', 'can_manage_invoices');
  addColumnIfMissing(dbInstance, 'employees', 'can_manage_quotes INTEGER NOT NULL DEFAULT 0', 'can_manage_quotes');
  addColumnIfMissing(dbInstance, 'employees', 'can_manage_clients INTEGER NOT NULL DEFAULT 0', 'can_manage_clients');
  addColumnIfMissing(dbInstance, 'employees', 'can_manage_estimations INTEGER NOT NULL DEFAULT 0', 'can_manage_estimations');
  addColumnIfMissing(dbInstance, 'employees', 'can_manage_archives INTEGER NOT NULL DEFAULT 0', 'can_manage_archives');
  addColumnIfMissing(dbInstance, 'employees', 'can_manage_inventory INTEGER NOT NULL DEFAULT 0', 'can_manage_inventory');
  addColumnIfMissing(dbInstance, 'employees', 'can_view_history INTEGER NOT NULL DEFAULT 0', 'can_view_history');
  addColumnIfMissing(dbInstance, 'employees', 'can_manage_salary INTEGER NOT NULL DEFAULT 0', 'can_manage_salary');
  addColumnIfMissing(dbInstance, 'employees', 'can_manage_all INTEGER NOT NULL DEFAULT 0', 'can_manage_all');
  addColumnIfMissing(dbInstance, 'employees', 'last_login_at TEXT', 'last_login_at');
  addColumnIfMissing(dbInstance, 'employees', 'created_at TEXT', 'created_at');
  addColumnIfMissing(dbInstance, 'employees', 'updated_at TEXT', 'updated_at');

  if (hasColumn(dbInstance, 'employees', 'is_active') && hasColumn(dbInstance, 'employees', 'actif')) {
    dbInstance.prepare(`
      UPDATE employees
      SET is_active = actif
      WHERE is_active IS NULL OR is_active NOT IN (0, 1) OR is_active <> actif
    `).run();
  }

  if (
    hasColumn(dbInstance, 'employees', 'can_manage_stock') &&
    hasColumn(dbInstance, 'employees', 'can_add_stock') &&
    hasColumn(dbInstance, 'employees', 'can_remove_stock') &&
    hasColumn(dbInstance, 'employees', 'can_adjust_stock')
  ) {
    dbInstance.prepare(`
      UPDATE employees
      SET
        can_add_stock = CASE WHEN can_manage_stock = 1 THEN 1 ELSE can_add_stock END,
        can_remove_stock = CASE WHEN can_manage_stock = 1 THEN 1 ELSE can_remove_stock END,
        can_adjust_stock = CASE WHEN can_manage_stock = 1 THEN 1 ELSE can_adjust_stock END
    `).run();
  }

  if (
    hasColumn(dbInstance, 'employees', 'can_manage_quotes') &&
    hasColumn(dbInstance, 'employees', 'can_manage_estimations')
  ) {
    dbInstance.prepare(`
      UPDATE employees
      SET can_manage_estimations = CASE WHEN can_manage_quotes = 1 THEN 1 ELSE can_manage_estimations END
    `).run();
  }

  if (
    hasColumn(dbInstance, 'employees', 'can_view_stock') &&
    hasColumn(dbInstance, 'employees', 'can_manage_inventory')
  ) {
    dbInstance.prepare(`
      UPDATE employees
      SET can_manage_inventory = CASE WHEN can_view_stock = 1 THEN 1 ELSE can_manage_inventory END
    `).run();
  }

  if (
    hasColumn(dbInstance, 'employees', 'can_view_stock') &&
    hasColumn(dbInstance, 'employees', 'can_view_history')
  ) {
    dbInstance.prepare(`
      UPDATE employees
      SET can_view_history = CASE WHEN can_view_stock = 1 THEN 1 ELSE can_view_history END
    `).run();
  }

  if (
    hasColumn(dbInstance, 'employees', 'can_manage_stock') &&
    hasColumn(dbInstance, 'employees', 'can_manage_archives')
  ) {
    dbInstance.prepare(`
      UPDATE employees
      SET can_manage_archives = CASE WHEN can_manage_stock = 1 THEN 1 ELSE can_manage_archives END
    `).run();
  }

  if (
    hasColumn(dbInstance, 'employees', 'role') &&
    hasColumn(dbInstance, 'employees', 'can_manage_all')
  ) {
    dbInstance.prepare(`
      UPDATE employees
      SET can_manage_all = CASE WHEN role IN ('admin', 'developer', 'owner') THEN 1 ELSE can_manage_all END
    `).run();
  }
};

const ensureAuthSecurityTables = (dbInstance) => {
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS auth_challenges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      purpose TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      attempts_count INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 5,
      created_at TEXT NOT NULL,
      requested_ip TEXT,
      requested_user_agent TEXT,
      FOREIGN KEY (user_id) REFERENCES employees(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS security_audit_log (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      event_type TEXT NOT NULL,
      email_attempted TEXT,
      success INTEGER NOT NULL,
      ip TEXT,
      user_agent TEXT,
      details TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES employees(id) ON DELETE SET NULL
    );
  `);

  addColumnIfMissing(dbInstance, 'auth_challenges', 'user_id TEXT', 'user_id');
  addColumnIfMissing(dbInstance, 'auth_challenges', 'purpose TEXT', 'purpose');
  addColumnIfMissing(dbInstance, 'auth_challenges', 'code_hash TEXT', 'code_hash');
  addColumnIfMissing(dbInstance, 'auth_challenges', 'expires_at TEXT', 'expires_at');
  addColumnIfMissing(dbInstance, 'auth_challenges', 'used_at TEXT', 'used_at');
  addColumnIfMissing(dbInstance, 'auth_challenges', 'attempts_count INTEGER NOT NULL DEFAULT 0', 'attempts_count');
  addColumnIfMissing(dbInstance, 'auth_challenges', 'max_attempts INTEGER NOT NULL DEFAULT 5', 'max_attempts');
  addColumnIfMissing(dbInstance, 'auth_challenges', 'created_at TEXT', 'created_at');
  addColumnIfMissing(dbInstance, 'auth_challenges', 'requested_ip TEXT', 'requested_ip');
  addColumnIfMissing(dbInstance, 'auth_challenges', 'requested_user_agent TEXT', 'requested_user_agent');

  addColumnIfMissing(dbInstance, 'security_audit_log', 'user_id TEXT', 'user_id');
  addColumnIfMissing(dbInstance, 'security_audit_log', 'event_type TEXT', 'event_type');
  addColumnIfMissing(dbInstance, 'security_audit_log', 'email_attempted TEXT', 'email_attempted');
  addColumnIfMissing(dbInstance, 'security_audit_log', 'success INTEGER NOT NULL DEFAULT 0', 'success');
  addColumnIfMissing(dbInstance, 'security_audit_log', 'ip TEXT', 'ip');
  addColumnIfMissing(dbInstance, 'security_audit_log', 'user_agent TEXT', 'user_agent');
  addColumnIfMissing(dbInstance, 'security_audit_log', 'details TEXT', 'details');
  addColumnIfMissing(dbInstance, 'security_audit_log', 'created_at TEXT', 'created_at');
};

const ensureUniqueEmployeeUsernames = (dbInstance) => {
  if (
    !hasTable(dbInstance, 'employees') ||
    !hasColumn(dbInstance, 'employees', 'username') ||
    !hasColumn(dbInstance, 'employees', 'created_at') ||
    !hasColumn(dbInstance, 'employees', 'updated_at')
  ) {
    return;
  }

  const duplicates = dbInstance.prepare(`
    SELECT username
    FROM employees
    WHERE username IS NOT NULL AND trim(username) <> ''
    GROUP BY username
    HAVING COUNT(*) > 1
  `).all();

  duplicates.forEach((entry) => {
    const users = dbInstance.prepare(`
      SELECT id, username
      FROM employees
      WHERE username = ?
      ORDER BY datetime(created_at) ASC
    `).all(entry.username);

    users.slice(1).forEach((user, index) => {
      dbInstance.prepare('UPDATE employees SET username = ?, updated_at = ? WHERE id = ?')
        .run(`${entry.username}_${index + 1}`, new Date().toISOString(), user.id);
    });
  });
};

const ensureNormalizedEmployeeEmails = (dbInstance) => {
  if (
    !hasTable(dbInstance, 'employees') ||
    !hasColumn(dbInstance, 'employees', 'email') ||
    !hasColumn(dbInstance, 'employees', 'email_normalized')
  ) {
    return;
  }

  dbInstance.prepare(`
    UPDATE employees
    SET email = NULL, email_normalized = NULL
    WHERE email IS NOT NULL
      AND trim(email) = ''
  `).run();

  dbInstance.prepare(`
    UPDATE employees
    SET email_normalized = lower(trim(email))
    WHERE email IS NOT NULL
      AND trim(email) <> ''
      AND (email_normalized IS NULL OR trim(email_normalized) = '')
  `).run();
};

const ensureUniqueEmployeeEmails = (dbInstance) => {
  if (
    !hasTable(dbInstance, 'employees') ||
    !hasColumn(dbInstance, 'employees', 'email_normalized') ||
    !hasColumn(dbInstance, 'employees', 'email') ||
    !hasColumn(dbInstance, 'employees', 'created_at') ||
    !hasColumn(dbInstance, 'employees', 'updated_at')
  ) {
    return;
  }

  const duplicates = dbInstance.prepare(`
    SELECT email_normalized
    FROM employees
    WHERE email_normalized IS NOT NULL AND trim(email_normalized) <> ''
    GROUP BY email_normalized
    HAVING COUNT(*) > 1
  `).all();

  duplicates.forEach((entry) => {
    const users = dbInstance.prepare(`
      SELECT id, email, email_normalized
      FROM employees
      WHERE email_normalized = ?
      ORDER BY datetime(created_at) ASC
    `).all(entry.email_normalized);

    users.slice(1).forEach((user, index) => {
      const fallbackEmail = `${entry.email_normalized.split('@')[0]}+dup${index + 1}@${entry.email_normalized.split('@')[1] || 'local'}`;
      dbInstance.prepare(`
        UPDATE employees
        SET email = ?, email_normalized = ?, updated_at = ?
        WHERE id = ?
      `).run(fallbackEmail, normalizeEmail(fallbackEmail), new Date().toISOString(), user.id);
    });
  });
};

const ensureUniqueEmployeeEmailIndex = (dbInstance) => {
  ensureIndexIfColumnsExist(dbInstance, 'idx_employees_email_unique', 'employees', ['email_normalized'], { unique: true });
};

const ensureProtectedAccounts = (dbInstance) => {
  const requiredColumns = [
    'id', 'nom', 'telephone', 'adresse', 'poste', 'salaire_base', 'date_embauche',
    'actif', 'is_active', 'username', 'email', 'email_normalized',
    'password_hash', 'role', 'is_protected_account', 'requires_email_2fa', 'must_setup_password',
    'can_view_stock', 'can_add_stock', 'can_remove_stock', 'can_adjust_stock', 'can_manage_stock',
    'can_manage_employees', 'can_manage_invoices', 'can_manage_quotes', 'can_manage_clients',
    'can_manage_estimations', 'can_manage_archives', 'can_manage_inventory', 'can_view_history',
    'can_manage_salary', 'can_manage_all',
    'created_at', 'updated_at'
  ];
  if (!hasTable(dbInstance, 'employees') || !hasColumns(dbInstance, 'employees', requiredColumns)) {
    return;
  }

  const now = new Date().toISOString();
  const insertStmt = dbInstance.prepare(`
    INSERT INTO employees (
      id, nom, telephone, adresse, poste, salaire_base, date_embauche,
      actif, is_active, username, email, email_normalized,
      password_hash, role, is_protected_account, requires_email_2fa, must_setup_password,
      can_view_stock, can_add_stock, can_remove_stock, can_adjust_stock, can_manage_stock,
      can_manage_employees, can_manage_invoices, can_manage_quotes, can_manage_clients,
      can_manage_estimations, can_manage_archives, can_manage_inventory, can_view_history,
      can_manage_salary, can_manage_all,
      created_at, updated_at
    ) VALUES (
      @id, @nom, @telephone, @adresse, @poste, @salaire_base, @date_embauche,
      @actif, @is_active, @username, @email, @email_normalized,
      @password_hash, @role, 1, 0, @must_setup_password,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      @created_at, @updated_at
    )
  `);

  PROTECTED_ACCOUNTS.forEach((account) => {
    const existing = dbInstance.prepare(`
      SELECT id, password_hash
      FROM employees
      WHERE email_normalized = @email
         OR username = @username
         OR id = @id
      LIMIT 1
    `).get({
      id: account.id,
      email: normalizeEmail(account.email),
      username: account.username
    });

    if (!existing) {
      insertStmt.run({
        id: account.id,
        nom: account.nom,
        telephone: '',
        adresse: '',
        poste: account.role === 'developer' ? 'Developpeur' : 'Direction',
        salaire_base: 0,
        date_embauche: null,
        actif: 1,
        is_active: 1,
        username: account.username,
        email: account.email,
        email_normalized: normalizeEmail(account.email),
        password_hash: null,
        role: account.role,
        must_setup_password: 1,
        created_at: now,
        updated_at: now
      });
      return;
    }

    dbInstance.prepare(`
      UPDATE employees
      SET
        nom = @nom,
        username = @username,
        email = @email,
        email_normalized = @email_normalized,
        role = @role,
        actif = 1,
        is_active = 1,
        is_protected_account = 1,
        requires_email_2fa = 0,
        must_setup_password = CASE
          WHEN password_hash IS NULL OR trim(password_hash) = '' THEN 1
          ELSE COALESCE(must_setup_password, 0)
        END,
        can_view_stock = 1,
        can_add_stock = 1,
        can_remove_stock = 1,
        can_adjust_stock = 1,
        can_manage_stock = 1,
        can_manage_employees = 1,
        can_manage_invoices = 1,
        can_manage_quotes = 1,
        can_manage_clients = 1,
        can_manage_estimations = 1,
        can_manage_archives = 1,
        can_manage_inventory = 1,
        can_view_history = 1,
        can_manage_salary = 1,
        can_manage_all = 1,
        updated_at = @updated_at
      WHERE id = @id
    `).run({
      id: existing.id,
      nom: account.nom,
      username: account.username,
      email: account.email,
      email_normalized: normalizeEmail(account.email),
      role: account.role,
      updated_at: now
    });
  });
};

const ensureDefaultAdminEmployee = (dbInstance) => {
  const requiredColumns = [
    'id', 'nom', 'telephone', 'adresse', 'poste', 'salaire_base', 'date_embauche', 'actif',
    'is_active', 'username', 'email', 'email_normalized', 'password_hash', 'role',
    'is_protected_account', 'requires_email_2fa', 'must_setup_password',
    'can_view_stock', 'can_add_stock', 'can_remove_stock', 'can_adjust_stock', 'can_manage_stock',
    'can_manage_employees', 'can_manage_invoices', 'can_manage_quotes', 'can_manage_clients',
    'can_manage_estimations', 'can_manage_archives', 'can_manage_inventory', 'can_view_history',
    'can_manage_salary', 'can_manage_all',
    'last_login_at', 'created_at', 'updated_at'
  ];
  if (!hasTable(dbInstance, 'employees') || !hasColumns(dbInstance, 'employees', requiredColumns)) {
    return;
  }

  const now = new Date().toISOString();
  const existingAdmin = dbInstance.prepare(`
    SELECT id, username, password_hash, role
    FROM employees
    WHERE role = 'admin'
    ORDER BY datetime(created_at) ASC
    LIMIT 1
  `).get();

  if (existingAdmin) {
    if (!existingAdmin.password_hash) {
      dbInstance.prepare('UPDATE employees SET password_hash = ?, updated_at = ? WHERE id = ?')
        .run(hashPassword('admin123'), now, existingAdmin.id);
    }
    return;
  }

  const existingAdminUsername = dbInstance.prepare(`
    SELECT id, role
    FROM employees
    WHERE username = 'admin'
    LIMIT 1
  `).get();

  if (existingAdminUsername) {
    dbInstance.prepare(`
      UPDATE employees
      SET
        role = 'admin',
        actif = 1,
        is_active = 1,
        is_protected_account = COALESCE(is_protected_account, 0),
        requires_email_2fa = COALESCE(requires_email_2fa, 0),
        must_setup_password = COALESCE(must_setup_password, 0),
        can_view_stock = 1,
        can_add_stock = 1,
        can_remove_stock = 1,
        can_adjust_stock = 1,
        can_manage_stock = 1,
        can_manage_employees = 1,
        can_manage_invoices = 1,
        can_manage_quotes = 1,
        can_manage_clients = 1,
        can_manage_estimations = 1,
        can_manage_archives = 1,
        can_manage_inventory = 1,
        can_view_history = 1,
        can_manage_salary = 1,
        can_manage_all = 1,
        password_hash = COALESCE(password_hash, ?),
        updated_at = ?
      WHERE id = ?
    `).run(hashPassword('admin123'), now, existingAdminUsername.id);
    return;
  }

  dbInstance.prepare(`
    INSERT INTO employees (
      id, nom, telephone, adresse, poste, salaire_base, date_embauche, actif,
      is_active, username, email, email_normalized, password_hash, role,
      is_protected_account, requires_email_2fa, must_setup_password,
      can_view_stock, can_add_stock, can_remove_stock, can_adjust_stock, can_manage_stock,
      can_manage_employees, can_manage_invoices, can_manage_quotes, can_manage_clients,
      can_manage_estimations, can_manage_archives, can_manage_inventory, can_view_history,
      can_manage_salary, can_manage_all,
      last_login_at, created_at, updated_at
    ) VALUES (
      @id, @nom, @telephone, @adresse, @poste, @salaire_base, @date_embauche, @actif,
      @is_active, @username, @email, @email_normalized, @password_hash, @role,
      @is_protected_account, @requires_email_2fa, @must_setup_password,
      @can_view_stock, @can_add_stock, @can_remove_stock, @can_adjust_stock, @can_manage_stock,
      @can_manage_employees, @can_manage_invoices, @can_manage_quotes, @can_manage_clients,
      @can_manage_estimations, @can_manage_archives, @can_manage_inventory, @can_view_history,
      @can_manage_salary, @can_manage_all,
      @last_login_at, @created_at, @updated_at
    )
  `).run({
    id: 'admin-user',
    nom: 'Administrateur',
    telephone: '',
    adresse: '',
    poste: 'Admin ERP',
    salaire_base: 0,
    date_embauche: null,
    actif: 1,
    is_active: 1,
    username: 'admin',
    email: null,
    email_normalized: null,
    password_hash: hashPassword('admin123'),
    role: 'admin',
    is_protected_account: 0,
    requires_email_2fa: 0,
    must_setup_password: 0,
    can_view_stock: 1,
    can_add_stock: 1,
    can_remove_stock: 1,
    can_adjust_stock: 1,
    can_manage_stock: 1,
    can_manage_employees: 1,
    can_manage_invoices: 1,
    can_manage_quotes: 1,
    can_manage_clients: 1,
    can_manage_estimations: 1,
    can_manage_archives: 1,
    can_manage_inventory: 1,
    can_view_history: 1,
    can_manage_salary: 1,
    can_manage_all: 1,
    last_login_at: null,
    created_at: now,
    updated_at: now
  });
};

const ensureProductVariantsSeed = (dbInstance) => {
  const tx = dbInstance.transaction(() => {
    dbInstance.prepare(`
      INSERT INTO product_variants (id, product_id, color, price, stock, updated_at)
      SELECT
        lower(hex(randomblob(16))),
        s.product_id,
        s.color,
        COALESCE(p.price_ttc, 0),
        COALESCE(s.qty, 0),
        COALESCE(p.last_updated, datetime('now'))
      FROM stock s
      INNER JOIN products p ON p.id = s.product_id
      ON CONFLICT(product_id, color) DO UPDATE SET
        stock = excluded.stock,
        updated_at = excluded.updated_at
    `).run();
  });

  tx();
};

const normalizeProductImageReferences = (dbInstance) => {
  if (
    !hasTable(dbInstance, 'products') ||
    !hasColumn(dbInstance, 'products', 'id') ||
    !hasColumn(dbInstance, 'products', 'image_url')
  ) {
    return;
  }

  const rows = dbInstance.prepare('SELECT id, reference, label, image_url FROM products').all();
  const updateStmt = dbInstance.prepare('UPDATE products SET image_url = ? WHERE id = ?');
  let updates = 0;
  rows.forEach((row) => {
    const preferredName = row.reference || row.label || row.id;
    const original = typeof row.image_url === 'string' ? row.image_url.trim() : '';
    const repairedOriginal = repairMojibakeText(original);
    const normalized = migrateLegacyProductImageRef(repairedOriginal || original, preferredName)
      || normalizeStoredProductImageRef(repairedOriginal || original);
    if (normalized && normalized !== original) {
      updateStmt.run(normalized, row.id);
      updates += 1;
      return;
    }

    if (!original) {
      updateStmt.run(PLACEHOLDER_IMAGE, row.id);
      updates += 1;
      return;
    }

    if (!normalized) {
      console.warn(`[db] unresolved product image ref for ${row.id}: ${original}`);
    }
  });
  if (updates > 0) {
    console.log(`[db] normalized product image refs: ${updates}`);
  }
};

const repairProductsTextEncoding = (dbInstance) => {
  if (!hasTable(dbInstance, 'products') || !hasColumn(dbInstance, 'products', 'id')) {
    return;
  }

  const fields = ['reference', 'label', 'description', 'category', 'serie', 'unit', 'image_url'];
  const existingFields = fields.filter((field) => hasColumn(dbInstance, 'products', field));
  if (!existingFields.length) {
    return;
  }

  const selectSql = `SELECT id, ${existingFields.join(', ')} FROM products`;
  const rows = dbInstance.prepare(selectSql).all();
  const updateColumns = existingFields.map((field) => `${field} = @${field}`).join(', ');
  const updateSql = `UPDATE products SET ${updateColumns} WHERE id = @id`;
  const updateStmt = dbInstance.prepare(updateSql);
  let updates = 0;

  rows.forEach((row) => {
    let changed = false;
    const payload = { id: row.id };

    existingFields.forEach((field) => {
      const original = row[field];
      const repaired = repairMojibakeText(original);
      payload[field] = repaired;
      if (repaired !== original) {
        changed = true;
      }
    });

    if (changed) {
      updateStmt.run(payload);
      updates += 1;
    }
  });
  if (updates > 0) {
    console.log(`[db] repaired mojibake product texts: ${updates}`);
  }
};

const repairProductsKnownCorruptedTokens = (dbInstance) => {
  if (!hasTable(dbInstance, 'products') || !hasColumn(dbInstance, 'products', 'id')) {
    return;
  }

  const fields = ['reference', 'label', 'description', 'image_url'];
  const existingFields = fields.filter((field) => hasColumn(dbInstance, 'products', field));
  if (!existingFields.length) {
    return;
  }

  let updates = 0;
  const applyReplacement = (field, from, to) => {
    const result = dbInstance.prepare(`
      UPDATE products
      SET ${field} = REPLACE(${field}, ?, ?)
      WHERE ${field} IS NOT NULL
        AND instr(${field}, ?) > 0
    `).run(from, to, from);
    updates += Number(result?.changes ?? 0);
  };

  existingFields.forEach((field) => {
    MOJIBAKE_REPLACEMENTS.forEach(([from, to]) => {
      applyReplacement(field, from, to);
    });
    applyReplacement(field, 'CrÃ©mone', 'Crémone');
    applyReplacement(field, 'EuropÃ©en', 'Européen');
    applyReplacement(field, 'Ã€ olive', 'À olive');
    applyReplacement(field, 'Ã  olive', 'à olive');
  });

  if (updates > 0) {
    console.log(`[db] repaired known corrupted product tokens: ${updates}`);
  }
};

const ensureCoreIndexes = (dbInstance) => {
  ensureIndexIfColumnsExist(dbInstance, 'idx_products_reference', 'products', ['reference']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_products_label', 'products', ['label']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_products_is_archived', 'products', ['is_archived']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_products_is_deleted', 'products', ['is_deleted']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_products_archive_deleted', 'products', ['is_archived', 'is_deleted']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_stock_product', 'stock', ['product_id']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_movements_product', 'movements', ['product_id']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_movements_at', 'movements', ['at']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_movements_employee_id', 'movements', ['employee_id']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_movements_username', 'movements', ['username']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_invoices_client_id', 'invoices', ['client_id']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_invoices_quote_id', 'invoices', ['quote_id']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_quotes_client_id', 'quotes', ['client_id']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_clients_nom', 'clients', ['nom']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_clients_telephone', 'clients', ['telephone']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_clients_email', 'clients', ['email']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_clients_mf', 'clients', ['mf']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_price_history_product_id', 'price_history', ['product_id']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_price_history_changed_at', 'price_history', ['changed_at']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_price_history_product_color', 'price_history', ['product_id', 'color']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_product_variants_product_color', 'product_variants', ['product_id', 'color']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_employees_username', 'employees', ['username']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_employees_username_unique', 'employees', ['username'], { unique: true });
  ensureIndexIfColumnsExist(dbInstance, 'idx_employees_email', 'employees', ['email_normalized']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_employees_role', 'employees', ['role']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_employees_manage_all', 'employees', ['can_manage_all']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_salary_advances_employee_id', 'salary_advances', ['employee_id']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_salary_advances_month_year', 'salary_advances', ['mois_reference', 'annee_reference']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_salary_bonuses_employee_id', 'salary_bonuses', ['employee_id']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_salary_bonuses_month_year', 'salary_bonuses', ['mois_reference', 'annee_reference']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_salary_overtimes_employee_id', 'salary_overtimes', ['employee_id']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_salary_overtimes_month_year', 'salary_overtimes', ['mois_reference', 'annee_reference']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_auth_challenges_user_id', 'auth_challenges', ['user_id']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_auth_challenges_purpose', 'auth_challenges', ['purpose']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_auth_challenges_expires_at', 'auth_challenges', ['expires_at']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_security_audit_user_id', 'security_audit_log', ['user_id']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_security_audit_event', 'security_audit_log', ['event_type']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_security_audit_created_at', 'security_audit_log', ['created_at']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_security_audit_email', 'security_audit_log', ['email_attempted']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_product_catalog_metadata_kind', 'product_catalog_metadata', ['kind']);
  ensureIndexIfColumnsExist(dbInstance, 'idx_product_catalog_metadata_value', 'product_catalog_metadata', ['value']);
};

const initDb = () => {
  if (db) {
    return db;
  }

  const filePath = dbFilePath();
  console.log(`[db] ${filePath}`);
  db = new Database(filePath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.pragma('busy_timeout = 5000');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      reference TEXT NOT NULL,
      label TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      serie TEXT NOT NULL,
      unit TEXT NOT NULL,
      image_url TEXT,
      is_archived INTEGER NOT NULL DEFAULT 0,
      archived_at TEXT,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      deleted_at TEXT,
      low_stock_threshold INTEGER NOT NULL DEFAULT 0,
      last_updated TEXT,
      price_ttc REAL
    );

    CREATE TABLE IF NOT EXISTS stock (
      product_id TEXT NOT NULL,
      color TEXT NOT NULL,
      qty REAL NOT NULL DEFAULT 0,
      PRIMARY KEY (product_id, color),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS movements (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      reference TEXT,
      label TEXT,
      category TEXT,
      serie TEXT,
      color TEXT NOT NULL,
      type TEXT NOT NULL,
      delta REAL NOT NULL,
      before REAL NOT NULL,
      after REAL NOT NULL,
      reason TEXT,
      actor TEXT,
      employee_id TEXT,
      employee_name TEXT,
      username TEXT,
      at TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
      quote_id TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL,
      telephone TEXT,
      adresse TEXT,
      mf TEXT,
      email TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL,
      telephone TEXT,
      adresse TEXT,
      poste TEXT,
      salaire_base REAL NOT NULL DEFAULT 0,
      date_embauche TEXT,
      actif INTEGER NOT NULL DEFAULT 1,
      is_active INTEGER NOT NULL DEFAULT 1,
      username TEXT UNIQUE,
      email TEXT,
      email_normalized TEXT,
      password_hash TEXT,
      role TEXT NOT NULL DEFAULT 'employee',
      is_protected_account INTEGER NOT NULL DEFAULT 0,
      requires_email_2fa INTEGER NOT NULL DEFAULT 0,
      must_setup_password INTEGER NOT NULL DEFAULT 0,
      can_view_stock INTEGER NOT NULL DEFAULT 0,
      can_add_stock INTEGER NOT NULL DEFAULT 0,
      can_remove_stock INTEGER NOT NULL DEFAULT 0,
      can_adjust_stock INTEGER NOT NULL DEFAULT 0,
      can_manage_stock INTEGER NOT NULL DEFAULT 0,
      can_manage_employees INTEGER NOT NULL DEFAULT 0,
      can_manage_invoices INTEGER NOT NULL DEFAULT 0,
      can_manage_quotes INTEGER NOT NULL DEFAULT 0,
      can_manage_clients INTEGER NOT NULL DEFAULT 0,
      can_manage_estimations INTEGER NOT NULL DEFAULT 0,
      can_manage_archives INTEGER NOT NULL DEFAULT 0,
      can_manage_inventory INTEGER NOT NULL DEFAULT 0,
      can_view_history INTEGER NOT NULL DEFAULT 0,
      can_manage_salary INTEGER NOT NULL DEFAULT 0,
      can_manage_all INTEGER NOT NULL DEFAULT 0,
      last_login_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS auth_challenges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      purpose TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      attempts_count INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 5,
      created_at TEXT NOT NULL,
      requested_ip TEXT,
      requested_user_agent TEXT,
      FOREIGN KEY (user_id) REFERENCES employees(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS security_audit_log (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      event_type TEXT NOT NULL,
      email_attempted TEXT,
      success INTEGER NOT NULL,
      ip TEXT,
      user_agent TEXT,
      details TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES employees(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS salary_advances (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      montant REAL NOT NULL,
      note TEXT,
      date_avance TEXT NOT NULL,
      mois_reference INTEGER NOT NULL,
      annee_reference INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS salary_bonuses (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      montant REAL NOT NULL,
      motif TEXT,
      date_prime TEXT NOT NULL,
      mois_reference INTEGER NOT NULL,
      annee_reference INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );

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
      created_at TEXT NOT NULL,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      color TEXT NOT NULL,
      old_price REAL NOT NULL,
      new_price REAL NOT NULL,
      changed_at TEXT NOT NULL,
      changed_by TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      color TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      stock REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      UNIQUE (product_id, color),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  ensureDocumentClientColumns(db);
  ensurePriceHistoryColumns(db);
  ensureProductColumns(db);
  ensureMovementsActorColumns(db);
  ensureProductCatalogMetadataTable(db);
  ensureEmployeeColumns(db);
  ensureAuthSecurityTables(db);
  ensureNormalizedEmployeeEmails(db);
  ensureUniqueEmployeeUsernames(db);
  ensureUniqueEmployeeEmails(db);
  ensureCoreIndexes(db);
  ensureUniqueEmployeeEmailIndex(db);
  ensureProtectedAccounts(db);
  ensureDefaultAdminEmployee(db);
  seedProductCatalogMetadataFromExisting(db);
  repairProductsTextEncoding(db);
  repairProductsKnownCorruptedTokens(db);
  normalizeProductImageReferences(db);

  seedProductsIfEmpty(db);
  ensureProductVariantsSeed(db);
  migrateJsonDocuments(db);
  backfillDocumentClientLinks(db, 'invoices');
  backfillDocumentClientLinks(db, 'quotes');
  syncCataloguePrices(db);

  return db;
};

const getDb = () => db ?? initDb();

const closeDb = () => {
  if (!db) return;
  db.close();
  db = null;
};

module.exports = { initDb, getDb, closeDb, dbFilePath };
