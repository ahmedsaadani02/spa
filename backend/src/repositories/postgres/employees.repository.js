const crypto = require('crypto');
const { normalizeEmail, isProtectedEmail } = require('../../services/auth-protected-accounts.service');
const { rowToEmployee } = require('../employees.repository');
const { one, many, exec } = require('./shared');

const nowIso = () => new Date().toISOString();
const createId = () => crypto.randomUUID?.() ?? `emp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizeUsername = (value) => normalizeText(value).toLowerCase();
const toBool = (value, fallback = false) => (typeof value === 'boolean' ? value : fallback);
const toMoney = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeRole = (value) => {
  const role = normalizeText(value).toLowerCase();
  if (role === 'developer' || role === 'owner' || role === 'admin') return role;
  return 'employee';
};

let ensureEmployeeTaskPermissionColumnsPromise = null;

const ensureEmployeeTaskPermissionColumns = async () => {
  if (!ensureEmployeeTaskPermissionColumnsPromise) {
    ensureEmployeeTaskPermissionColumnsPromise = exec(`
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS can_manage_tasks BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS can_receive_tasks BOOLEAN NOT NULL DEFAULT FALSE;
    `).catch((error) => {
      ensureEmployeeTaskPermissionColumnsPromise = null;
      throw error;
    });
  }
  return ensureEmployeeTaskPermissionColumnsPromise;
};

const applyPermissionParams = (payload = {}) => ({
  can_view_stock: !!payload.canViewStock,
  can_add_stock: !!payload.canAddStock,
  can_remove_stock: !!payload.canRemoveStock,
  can_adjust_stock: !!payload.canAdjustStock,
  can_manage_stock: !!payload.canManageStock,
  can_edit_stock_product: !!payload.canEditStockProduct,
  can_archive_stock_product: !!payload.canArchiveStockProduct,
  can_manage_employees: !!payload.canManageEmployees,
  can_manage_invoices: !!payload.canManageInvoices,
  can_manage_quotes: !!payload.canManageQuotes,
  can_manage_clients: !!payload.canManageClients,
  can_manage_estimations: !!payload.canManageEstimations,
  can_manage_archives: !!payload.canManageArchives,
  can_manage_inventory: !!payload.canManageInventory,
  can_view_history: !!payload.canViewHistory,
  can_manage_salary: !!payload.canManageSalary,
  can_manage_tasks: !!payload.canManageTasks,
  can_receive_tasks: !!payload.canReceiveTasks,
  can_manage_all: !!payload.canManageAll
});

const mapPayloadForUpsert = (payload, isCreate = false, existing = null) => {
  const username = normalizeUsername(payload.username);
  const normalizedEmail = normalizeEmail(payload.email);
  const role = normalizeRole(payload.role);
  const isProtectedFromPayload = isProtectedEmail(normalizedEmail);
  const requiresEmail2fa = false;
  const hasPasswordHash = !!normalizeText(payload.passwordHash);
  const mustSetupPassword = typeof payload.mustSetupPassword === 'boolean'
    ? payload.mustSetupPassword
    : (existing ? existing.must_setup_password === true : (isCreate && !hasPasswordHash));

  return {
    id: payload.id || existing?.id || createId(),
    nom: normalizeText(payload.nom),
    telephone: normalizeText(payload.telephone),
    adresse: normalizeText(payload.adresse),
    poste: normalizeText(payload.poste),
    salaire_base: toMoney(payload.salaireBase),
    date_embauche: normalizeText(payload.dateEmbauche) || null,
    actif: typeof payload.actif === 'boolean' ? payload.actif : (isCreate ? true : null),
    is_active: typeof payload.isActive === 'boolean'
      ? payload.isActive
      : (typeof payload.actif === 'boolean' ? payload.actif : (isCreate ? true : null)),
    username: username || null,
    email: normalizedEmail || null,
    email_normalized: normalizedEmail || null,
    password_hash: hasPasswordHash ? normalizeText(payload.passwordHash) : (existing?.password_hash ?? null),
    role,
    is_protected_account: isProtectedFromPayload,
    requires_email_2fa: requiresEmail2fa,
    must_setup_password: !!mustSetupPassword,
    ...applyPermissionParams(payload),
    created_at: existing?.created_at ?? nowIso(),
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

const listEmployees = async () => {
  await ensureEmployeeTaskPermissionColumns();
  const rows = await many(`${baseSelect} ORDER BY created_at DESC`);
  return rows.map(rowToEmployee);
};

const searchEmployees = async (_db, queryText = '') => {
  await ensureEmployeeTaskPermissionColumns();
  const q = `%${normalizeText(queryText).toLowerCase()}%`;
  const rows = await many(
    `
      ${baseSelect}
      WHERE LOWER(nom) LIKE $1
         OR LOWER(COALESCE(telephone, '')) LIKE $1
         OR LOWER(COALESCE(username, '')) LIKE $1
         OR LOWER(COALESCE(email_normalized, '')) LIKE $1
         OR LOWER(COALESCE(poste, '')) LIKE $1
      ORDER BY created_at DESC
    `,
    [q]
  );
  return rows.map(rowToEmployee);
};

const getEmployeeById = async (_db, id) => {
  await ensureEmployeeTaskPermissionColumns();
  if (!id) return null;
  const row = await one(`${baseSelect} WHERE id = $1 LIMIT 1`, [id]);
  return rowToEmployee(row);
};

const getEmployeeByEmailNormalized = async (_db, email) => {
  await ensureEmployeeTaskPermissionColumns();
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const row = await one(`${baseSelect} WHERE email_normalized = $1 LIMIT 1`, [normalized]);
  return rowToEmployee(row);
};

const createEmployee = async (_db, payload) => {
  await ensureEmployeeTaskPermissionColumns();
  const mapped = mapPayloadForUpsert(payload, true);
  if (!mapped.nom) {
    throw new Error('Le nom est obligatoire.');
  }

  await exec(
    `
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
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14,
        $15, $16, $17,
        $18, $19, $20, $21, $22,
        $23, $24,
        $25, $26, $27, $28,
        $29, $30, $31, $32,
        $33, $34, $35, $36,
        $37, $38
      )
    `,
    [
      mapped.id,
      mapped.nom,
      mapped.telephone,
      mapped.adresse,
      mapped.poste,
      mapped.salaire_base,
      mapped.date_embauche,
      mapped.actif,
      mapped.is_active,
      mapped.username,
      mapped.email,
      mapped.email_normalized,
      mapped.password_hash,
      mapped.role,
      mapped.is_protected_account,
      mapped.requires_email_2fa,
      mapped.must_setup_password,
      mapped.can_view_stock,
      mapped.can_add_stock,
      mapped.can_remove_stock,
      mapped.can_adjust_stock,
      mapped.can_manage_stock,
      mapped.can_edit_stock_product,
      mapped.can_archive_stock_product,
      mapped.can_manage_employees,
      mapped.can_manage_invoices,
      mapped.can_manage_quotes,
      mapped.can_manage_clients,
      mapped.can_manage_estimations,
      mapped.can_manage_archives,
      mapped.can_manage_inventory,
      mapped.can_view_history,
      mapped.can_manage_salary,
      mapped.can_manage_tasks,
      mapped.can_receive_tasks,
      mapped.can_manage_all,
      mapped.created_at,
      mapped.updated_at
    ]
  );

  return getEmployeeById(null, mapped.id);
};

const updateEmployee = async (_db, id, payload) => {
  await ensureEmployeeTaskPermissionColumns();
  if (!id) return null;

  const existing = await one(
    `
      SELECT
        id, password_hash, is_protected_account, requires_email_2fa, must_setup_password,
        email, email_normalized, created_at
      FROM employees
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  if (!existing) return null;

  const mapped = mapPayloadForUpsert({ ...payload, id }, false, existing);
  if (!mapped.nom) {
    throw new Error('Le nom est obligatoire.');
  }

  await exec(
    `
      UPDATE employees
      SET
        nom = $1,
        telephone = $2,
        adresse = $3,
        poste = $4,
        salaire_base = $5,
        date_embauche = $6,
        actif = COALESCE($7, actif),
        is_active = COALESCE($8, is_active),
        username = $9,
        email = $10,
        email_normalized = $11,
        password_hash = $12,
        role = $13,
        is_protected_account = $14,
        requires_email_2fa = $15,
        must_setup_password = $16,
        can_view_stock = $17,
        can_add_stock = $18,
        can_remove_stock = $19,
        can_adjust_stock = $20,
        can_manage_stock = $21,
        can_edit_stock_product = $22,
        can_archive_stock_product = $23,
        can_manage_employees = $24,
        can_manage_invoices = $25,
        can_manage_quotes = $26,
        can_manage_clients = $27,
        can_manage_estimations = $28,
        can_manage_archives = $29,
        can_manage_inventory = $30,
        can_view_history = $31,
        can_manage_salary = $32,
        can_manage_tasks = $33,
        can_receive_tasks = $34,
        can_manage_all = $35,
        updated_at = $36
      WHERE id = $37
    `,
    [
      mapped.nom,
      mapped.telephone,
      mapped.adresse,
      mapped.poste,
      mapped.salaire_base,
      mapped.date_embauche,
      mapped.actif,
      mapped.is_active,
      mapped.username,
      mapped.email,
      mapped.email_normalized,
      mapped.password_hash,
      mapped.role,
      mapped.is_protected_account,
      mapped.requires_email_2fa,
      mapped.must_setup_password,
      mapped.can_view_stock,
      mapped.can_add_stock,
      mapped.can_remove_stock,
      mapped.can_adjust_stock,
      mapped.can_manage_stock,
      mapped.can_edit_stock_product,
      mapped.can_archive_stock_product,
      mapped.can_manage_employees,
      mapped.can_manage_invoices,
      mapped.can_manage_quotes,
      mapped.can_manage_clients,
      mapped.can_manage_estimations,
      mapped.can_manage_archives,
      mapped.can_manage_inventory,
      mapped.can_view_history,
      mapped.can_manage_salary,
      mapped.can_manage_tasks,
      mapped.can_receive_tasks,
      mapped.can_manage_all,
      mapped.updated_at,
      id
    ]
  );

  return getEmployeeById(null, id);
};

const deleteEmployee = async (_db, id) => {
  await ensureEmployeeTaskPermissionColumns();
  if (!id) return false;
  const result = await exec('DELETE FROM employees WHERE id = $1', [id]);
  return Number(result.rowCount ?? 0) > 0;
};

const setEmployeeActive = async (_db, id, actif) => {
  await ensureEmployeeTaskPermissionColumns();
  if (!id) return false;
  const result = await exec(
    'UPDATE employees SET actif = $1, is_active = $1, updated_at = $2 WHERE id = $3',
    [toBool(actif), nowIso(), id]
  );
  return Number(result.rowCount ?? 0) > 0;
};

const authSelect = `
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
`;

const findEmployeeForAuthIdentity = async (_db, identity) => {
  await ensureEmployeeTaskPermissionColumns();
  const normalizedUsername = normalizeUsername(identity);
  const normalizedEmail = normalizeEmail(identity);
  if (!normalizedUsername && !normalizedEmail) return null;

  return one(
    `
      ${authSelect}
      WHERE username = $1
         OR email_normalized = $2
      LIMIT 1
    `,
    [normalizedUsername, normalizedEmail]
  );
};

const findEmployeeForAuthByUsername = async (_db, username) => findEmployeeForAuthIdentity(null, username);

const getEmployeeAuthRowById = async (_db, id) => {
  await ensureEmployeeTaskPermissionColumns();
  if (!id) return null;
  return one(
    `
      ${authSelect}
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );
};

const updateEmployeeLastLogin = async (_db, employeeId, loggedAt) => {
  await ensureEmployeeTaskPermissionColumns();
  await exec(
    'UPDATE employees SET last_login_at = $1, updated_at = $2 WHERE id = $3',
    [loggedAt, nowIso(), employeeId]
  );
};

const updateEmployeePasswordHash = async (_db, employeeId, passwordHash, options = {}) => {
  await ensureEmployeeTaskPermissionColumns();
  if (!employeeId) return false;
  const mustSetupPassword = typeof options.mustSetupPassword === 'boolean' ? options.mustSetupPassword : false;
  const result = await exec(
    `
      UPDATE employees
      SET
        password_hash = $1,
        must_setup_password = $2,
        updated_at = $3
      WHERE id = $4
    `,
    [passwordHash, mustSetupPassword, nowIso(), employeeId]
  );
  return Number(result.rowCount ?? 0) > 0;
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
  updateEmployeePasswordHash
};
