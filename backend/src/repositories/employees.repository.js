const crypto = require('crypto');
const { normalizeEmail, isProtectedEmail } = require('../services/auth-protected-accounts.service');

const nowIso = () => new Date().toISOString();
const createId = () => crypto.randomUUID?.() ?? `emp_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizeUsername = (value) => normalizeText(value).toLowerCase();
const toIntBool = (value, fallback = 0) => (value ? 1 : fallback);
const toMoney = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeRole = (value) => {
  const role = normalizeText(value).toLowerCase();
  if (role === 'developer' || role === 'owner' || role === 'admin') return role;
  return 'employee';
};

const ensureEmployeeTaskPermissionColumns = (db) => {
  const columns = db.prepare('PRAGMA table_info(employees)').all();
  const names = new Set(columns.map((column) => String(column.name)));

  if (!names.has('can_manage_tasks')) {
    db.prepare('ALTER TABLE employees ADD COLUMN can_manage_tasks INTEGER NOT NULL DEFAULT 0').run();
  }

  if (!names.has('can_receive_tasks')) {
    db.prepare('ALTER TABLE employees ADD COLUMN can_receive_tasks INTEGER NOT NULL DEFAULT 0').run();
  }
};

const rowToEmployee = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    nom: row.nom,
    telephone: row.telephone ?? '',
    adresse: row.adresse ?? '',
    poste: row.poste ?? '',
    salaireBase: Number(row.salaire_base ?? 0) || 0,
    dateEmbauche: row.date_embauche ?? null,
    actif: Number(row.actif) === 1,
    isActive: Number(row.is_active) === 1,
    username: row.username ?? '',
    email: row.email ?? '',
    role: normalizeRole(row.role),
    isProtectedAccount: Number(row.is_protected_account) === 1,
    requiresEmail2fa: Number(row.requires_email_2fa) === 1,
    mustSetupPassword: Number(row.must_setup_password) === 1,
    canViewStock: Number(row.can_view_stock) === 1,
    canAddStock: Number(row.can_add_stock) === 1 || Number(row.can_manage_stock) === 1,
    canRemoveStock: Number(row.can_remove_stock) === 1 || Number(row.can_manage_stock) === 1,
    canAdjustStock: Number(row.can_adjust_stock) === 1 || Number(row.can_manage_stock) === 1,
    canManageStock: Number(row.can_manage_stock) === 1,
    canEditStockProduct: Number(row.can_edit_stock_product) === 1 || Number(row.can_manage_stock) === 1,
    canArchiveStockProduct: Number(row.can_archive_stock_product) === 1 || Number(row.can_manage_stock) === 1,
    canManageEmployees: Number(row.can_manage_employees) === 1,
    canManageInvoices: Number(row.can_manage_invoices) === 1,
    canManageQuotes: Number(row.can_manage_quotes) === 1,
    canManageClients: Number(row.can_manage_clients) === 1,
    canManageEstimations: Number(row.can_manage_estimations) === 1 || Number(row.can_manage_quotes) === 1,
    canManageArchives: Number(row.can_manage_archives) === 1 || Number(row.can_manage_stock) === 1,
    canManageInventory: Number(row.can_manage_inventory) === 1,
    canViewHistory: Number(row.can_view_history) === 1,
    canManageSalary: Number(row.can_manage_salary) === 1,
    canManageTasks: Number(row.can_manage_tasks) === 1,
    canReceiveTasks: Number(row.can_receive_tasks) === 1,
    canManageAll: Number(row.can_manage_all) === 1,
    lastLoginAt: row.last_login_at ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null
  };
};

const applyPermissionParams = (payload = {}) => ({
  can_view_stock: toIntBool(payload.canViewStock),
  can_add_stock: toIntBool(payload.canAddStock),
  can_remove_stock: toIntBool(payload.canRemoveStock),
  can_adjust_stock: toIntBool(payload.canAdjustStock),
  can_manage_stock: toIntBool(payload.canManageStock),
  can_edit_stock_product: toIntBool(payload.canEditStockProduct),
  can_archive_stock_product: toIntBool(payload.canArchiveStockProduct),
  can_manage_employees: toIntBool(payload.canManageEmployees),
  can_manage_invoices: toIntBool(payload.canManageInvoices),
  can_manage_quotes: toIntBool(payload.canManageQuotes),
  can_manage_clients: toIntBool(payload.canManageClients),
  can_manage_estimations: toIntBool(payload.canManageEstimations),
  can_manage_archives: toIntBool(payload.canManageArchives),
  can_manage_inventory: toIntBool(payload.canManageInventory),
  can_view_history: toIntBool(payload.canViewHistory),
  can_manage_salary: toIntBool(payload.canManageSalary),
  can_manage_tasks: toIntBool(payload.canManageTasks),
  can_receive_tasks: toIntBool(payload.canReceiveTasks),
  can_manage_all: toIntBool(payload.canManageAll)
});

const mapPayloadForUpsert = (payload, isCreate = false) => {
  const username = normalizeUsername(payload.username);
  const normalizedEmail = normalizeEmail(payload.email);
  const role = normalizeRole(payload.role);
  const isProtectedFromPayload = isProtectedEmail(normalizedEmail);
  const requiresEmail2fa = false;
  const mustSetupPassword = typeof payload.mustSetupPassword === 'boolean'
    ? payload.mustSetupPassword
    : (isCreate && !normalizeText(payload.passwordHash));

  return {
    id: payload.id || createId(),
    nom: normalizeText(payload.nom),
    telephone: normalizeText(payload.telephone),
    adresse: normalizeText(payload.adresse),
    poste: normalizeText(payload.poste),
    salaire_base: toMoney(payload.salaireBase),
    date_embauche: normalizeText(payload.dateEmbauche) || null,
    actif: typeof payload.actif === 'boolean' ? toIntBool(payload.actif) : isCreate ? 1 : null,
    is_active: typeof payload.isActive === 'boolean'
      ? toIntBool(payload.isActive)
      : (typeof payload.actif === 'boolean' ? toIntBool(payload.actif) : (isCreate ? 1 : null)),
    username: username || null,
    email: normalizedEmail || null,
    email_normalized: normalizedEmail || null,
    password_hash: normalizeText(payload.passwordHash) || null,
    role,
    is_protected_account: toIntBool(isProtectedFromPayload),
    requires_email_2fa: toIntBool(requiresEmail2fa),
    must_setup_password: toIntBool(mustSetupPassword),
    ...applyPermissionParams(payload),
    created_at: nowIso(),
    updated_at: nowIso()
  };
};

const baseSelect = `
  SELECT
    id,
    nom,
    telephone,
    adresse,
    poste,
    salaire_base,
    date_embauche,
    actif,
    is_active,
    username,
    email,
    email_normalized,
    role,
    is_protected_account,
    requires_email_2fa,
    must_setup_password,
    can_view_stock,
    can_add_stock,
    can_remove_stock,
    can_adjust_stock,
    can_manage_stock,
    can_edit_stock_product,
    can_archive_stock_product,
    can_manage_employees,
    can_manage_invoices,
    can_manage_quotes,
    can_manage_clients,
    can_manage_estimations,
    can_manage_archives,
    can_manage_inventory,
    can_view_history,
    can_manage_salary,
    can_manage_tasks,
    can_receive_tasks,
    can_manage_all,
    last_login_at,
    created_at,
    updated_at
  FROM employees
`;

const listEmployees = (db) => {
  ensureEmployeeTaskPermissionColumns(db);
  return db.prepare(`${baseSelect} ORDER BY datetime(created_at) DESC`).all().map(rowToEmployee);
};

const searchEmployees = (db, query = '') => {
  ensureEmployeeTaskPermissionColumns(db);
  const q = `%${normalizeText(query).toLowerCase()}%`;
  return db.prepare(`
    ${baseSelect}
    WHERE
      lower(nom) LIKE @q
      OR lower(COALESCE(telephone, '')) LIKE @q
      OR lower(COALESCE(username, '')) LIKE @q
      OR lower(COALESCE(email_normalized, '')) LIKE @q
      OR lower(COALESCE(poste, '')) LIKE @q
    ORDER BY datetime(created_at) DESC
  `).all({ q }).map(rowToEmployee);
};

const getEmployeeById = (db, id) => {
  ensureEmployeeTaskPermissionColumns(db);
  if (!id) return null;
  return rowToEmployee(db.prepare(`${baseSelect} WHERE id = ? LIMIT 1`).get(id));
};

const getEmployeeByEmailNormalized = (db, email) => {
  ensureEmployeeTaskPermissionColumns(db);
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  return rowToEmployee(db.prepare(`${baseSelect} WHERE email_normalized = ? LIMIT 1`).get(normalized));
};

const createEmployee = (db, payload) => {
  ensureEmployeeTaskPermissionColumns(db);
  const mapped = mapPayloadForUpsert(payload, true);
  if (!mapped.nom) {
    throw new Error('Le nom est obligatoire.');
  }

  db.prepare(`
    INSERT INTO employees (
      id, nom, telephone, adresse, poste, salaire_base, date_embauche, actif, is_active,
      username, email, email_normalized, password_hash, role,
      is_protected_account, requires_email_2fa, must_setup_password,
      can_view_stock, can_add_stock, can_remove_stock, can_adjust_stock, can_manage_stock,
      can_edit_stock_product, can_archive_stock_product,
      can_manage_employees, can_manage_invoices, can_manage_quotes, can_manage_clients,
      can_manage_estimations, can_manage_archives, can_manage_inventory, can_view_history,
      can_manage_salary, can_manage_tasks, can_receive_tasks, can_manage_all,
      created_at, updated_at
    ) VALUES (
      @id, @nom, @telephone, @adresse, @poste, @salaire_base, @date_embauche, @actif, @is_active,
      @username, @email, @email_normalized, @password_hash, @role,
      @is_protected_account, @requires_email_2fa, @must_setup_password,
      @can_view_stock, @can_add_stock, @can_remove_stock, @can_adjust_stock, @can_manage_stock,
      @can_edit_stock_product, @can_archive_stock_product,
      @can_manage_employees, @can_manage_invoices, @can_manage_quotes, @can_manage_clients,
      @can_manage_estimations, @can_manage_archives, @can_manage_inventory, @can_view_history,
      @can_manage_salary, @can_manage_tasks, @can_receive_tasks, @can_manage_all,
      @created_at, @updated_at
    )
  `).run(mapped);

  return getEmployeeById(db, mapped.id);
};

const updateEmployee = (db, id, payload) => {
  ensureEmployeeTaskPermissionColumns(db);
  if (!id) return null;

  const existing = db.prepare(`
    SELECT
      id, password_hash, is_protected_account, requires_email_2fa, must_setup_password,
      email, email_normalized
    FROM employees
    WHERE id = ?
    LIMIT 1
  `).get(id);

  if (!existing) return null;

  const mapped = mapPayloadForUpsert({
    ...payload,
    id,
    passwordHash: payload.passwordHash ?? existing.password_hash,
    isProtectedAccount: typeof payload.isProtectedAccount === 'boolean'
      ? payload.isProtectedAccount
      : Number(existing.is_protected_account) === 1,
    requiresEmail2fa: typeof payload.requiresEmail2fa === 'boolean'
      ? payload.requiresEmail2fa
      : Number(existing.requires_email_2fa) === 1,
    mustSetupPassword: typeof payload.mustSetupPassword === 'boolean'
      ? payload.mustSetupPassword
      : Number(existing.must_setup_password) === 1,
    email: payload.email ?? existing.email
  });

  if (!mapped.nom) {
    throw new Error('Le nom est obligatoire.');
  }

  db.prepare(`
    UPDATE employees
    SET
      nom = @nom,
      telephone = @telephone,
      adresse = @adresse,
      poste = @poste,
      salaire_base = @salaire_base,
      date_embauche = @date_embauche,
      actif = COALESCE(@actif, actif),
      is_active = COALESCE(@is_active, is_active),
      username = @username,
      email = @email,
      email_normalized = @email_normalized,
      password_hash = @password_hash,
      role = @role,
      is_protected_account = @is_protected_account,
      requires_email_2fa = @requires_email_2fa,
      must_setup_password = @must_setup_password,
      can_view_stock = @can_view_stock,
      can_add_stock = @can_add_stock,
      can_remove_stock = @can_remove_stock,
      can_adjust_stock = @can_adjust_stock,
      can_manage_stock = @can_manage_stock,
      can_edit_stock_product = @can_edit_stock_product,
      can_archive_stock_product = @can_archive_stock_product,
      can_manage_employees = @can_manage_employees,
      can_manage_invoices = @can_manage_invoices,
      can_manage_quotes = @can_manage_quotes,
      can_manage_clients = @can_manage_clients,
      can_manage_estimations = @can_manage_estimations,
      can_manage_archives = @can_manage_archives,
      can_manage_inventory = @can_manage_inventory,
      can_view_history = @can_view_history,
      can_manage_salary = @can_manage_salary,
      can_manage_tasks = @can_manage_tasks,
      can_receive_tasks = @can_receive_tasks,
      can_manage_all = @can_manage_all,
      updated_at = @updated_at
    WHERE id = @id
  `).run(mapped);

  return getEmployeeById(db, id);
};

const deleteEmployee = (db, id) => {
  ensureEmployeeTaskPermissionColumns(db);
  if (!id) return false;
  const result = db.prepare('DELETE FROM employees WHERE id = ?').run(id);
  return result.changes > 0;
};

const setEmployeeActive = (db, id, actif) => {
  ensureEmployeeTaskPermissionColumns(db);
  if (!id) return false;
  const activeFlag = toIntBool(!!actif);
  const result = db.prepare('UPDATE employees SET actif = ?, is_active = ?, updated_at = ? WHERE id = ?')
    .run(activeFlag, activeFlag, nowIso(), id);
  return result.changes > 0;
};

const findEmployeeForAuthIdentity = (db, identity) => {
  ensureEmployeeTaskPermissionColumns(db);
  const normalizedUsername = normalizeUsername(identity);
  const normalizedEmail = normalizeEmail(identity);
  if (!normalizedUsername && !normalizedEmail) return null;

  return db.prepare(`
    SELECT
      id,
      nom,
      username,
      email,
      email_normalized,
      password_hash,
      role,
      actif,
      is_active,
      is_protected_account,
      requires_email_2fa,
      must_setup_password,
      can_view_stock,
      can_add_stock,
      can_remove_stock,
      can_adjust_stock,
      can_manage_stock,
      can_edit_stock_product,
      can_archive_stock_product,
      can_manage_employees,
      can_manage_invoices,
      can_manage_quotes,
      can_manage_clients,
      can_manage_estimations,
      can_manage_archives,
      can_manage_inventory,
      can_view_history,
      can_manage_salary,
      can_manage_tasks,
      can_receive_tasks,
      can_manage_all
    FROM employees
    WHERE username = @username
       OR email_normalized = @email
    LIMIT 1
  `).get({
    username: normalizedUsername,
    email: normalizedEmail
  });
};

const findEmployeeForAuthByUsername = (db, username) => findEmployeeForAuthIdentity(db, username);

const getEmployeeAuthRowById = (db, id) => {
  ensureEmployeeTaskPermissionColumns(db);
  if (!id) return null;
  return db.prepare(`
    SELECT
      id,
      nom,
      username,
      email,
      email_normalized,
      password_hash,
      role,
      actif,
      is_active,
      is_protected_account,
      requires_email_2fa,
      must_setup_password,
      can_view_stock,
      can_add_stock,
      can_remove_stock,
      can_adjust_stock,
      can_manage_stock,
      can_edit_stock_product,
      can_archive_stock_product,
      can_manage_employees,
      can_manage_invoices,
      can_manage_quotes,
      can_manage_clients,
      can_manage_estimations,
      can_manage_archives,
      can_manage_inventory,
      can_view_history,
      can_manage_salary,
      can_manage_tasks,
      can_receive_tasks,
      can_manage_all
    FROM employees
    WHERE id = ?
    LIMIT 1
  `).get(id);
};

const updateEmployeeLastLogin = (db, employeeId, loggedAt) => {
  db.prepare('UPDATE employees SET last_login_at = ?, updated_at = ? WHERE id = ?')
    .run(loggedAt, nowIso(), employeeId);
};

const updateEmployeePasswordHash = (db, employeeId, passwordHash, options = {}) => {
  if (!employeeId) return false;
  const mustSetupPassword = typeof options.mustSetupPassword === 'boolean' ? toIntBool(options.mustSetupPassword) : 0;
  const result = db.prepare(`
    UPDATE employees
    SET
      password_hash = ?,
      must_setup_password = ?,
      updated_at = ?
    WHERE id = ?
  `).run(passwordHash, mustSetupPassword, nowIso(), employeeId);
  return result.changes > 0;
};

module.exports = {
  listEmployees,
  searchEmployees,
  getEmployeeById,
  getEmployeeByEmailNormalized,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  setEmployeeActive,
  findEmployeeForAuthIdentity,
  findEmployeeForAuthByUsername,
  getEmployeeAuthRowById,
  updateEmployeeLastLogin,
  updateEmployeePasswordHash,
  rowToEmployee
};
