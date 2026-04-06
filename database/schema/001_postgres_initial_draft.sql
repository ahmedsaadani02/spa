-- PostgreSQL initial draft schema
-- Statut: PREPARATOIRE
-- Ce fichier n'est pas encore branche au runtime.
--
-- Regles:
-- - "CONFIRME" = confirme par le code backend ET l'introspection SQLite du 2026-03-19
-- - "A AJUSTER" = cible PostgreSQL volontairement differente du stockage SQLite actuel
-- - "A CONFIRMER" = encore a verifier avant execution en production
--
-- Choix prudents:
-- - IDs en TEXT pour rester compatibles avec les IDs historiques applicatifs
-- - timestamps en TIMESTAMPTZ
-- - payload documents en JSONB
-- - booleens PostgreSQL explicites

BEGIN;

-- =========================================================
-- Employees
-- =========================================================
-- CONFIRME: table employees et la majorite des colonnes ci-dessous sont lues/ecrites par le code.
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  telephone TEXT,
  adresse TEXT,
  poste TEXT,
  salaire_base NUMERIC(12, 3) NOT NULL DEFAULT 0,
  date_embauche TEXT,
  actif BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  username TEXT,
  email TEXT,
  email_normalized TEXT,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'employee',
  is_protected_account BOOLEAN NOT NULL DEFAULT FALSE,
  requires_email_2fa BOOLEAN NOT NULL DEFAULT FALSE,
  must_setup_password BOOLEAN NOT NULL DEFAULT FALSE,
  can_view_stock BOOLEAN NOT NULL DEFAULT FALSE,
  can_add_stock BOOLEAN NOT NULL DEFAULT FALSE,
  can_remove_stock BOOLEAN NOT NULL DEFAULT FALSE,
  can_adjust_stock BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_stock BOOLEAN NOT NULL DEFAULT FALSE,
  can_edit_stock_product BOOLEAN NOT NULL DEFAULT FALSE,
  can_archive_stock_product BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_employees BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_invoices BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_quotes BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_clients BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_estimations BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_archives BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_inventory BOOLEAN NOT NULL DEFAULT FALSE,
  can_view_history BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_salary BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_tasks BOOLEAN NOT NULL DEFAULT FALSE,
  can_receive_tasks BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_all BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_username_unique
  ON employees (username)
  WHERE username IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_email_normalized_unique
  ON employees (email_normalized)
  WHERE email_normalized IS NOT NULL;

-- =========================================================
-- Clients
-- =========================================================
-- CONFIRME
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  telephone TEXT,
  adresse TEXT,
  mf TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clients_nom
  ON clients (nom);

CREATE INDEX IF NOT EXISTS idx_clients_telephone
  ON clients (telephone);

CREATE INDEX IF NOT EXISTS idx_clients_email
  ON clients (email);

CREATE INDEX IF NOT EXISTS idx_clients_mf
  ON clients (mf);

-- =========================================================
-- Products and stock
-- =========================================================
-- CONFIRME
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  serie TEXT NOT NULL,
  unit TEXT NOT NULL,
  image_url TEXT,
  low_stock_threshold INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ,
  price_ttc NUMERIC(12, 3),
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_reference_lower_unique
  ON products (lower(reference))
  WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS stock (
  product_id TEXT NOT NULL,
  color TEXT NOT NULL,
  qty NUMERIC(12, 3) NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, color),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_stock_product
  ON stock (product_id);

CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  color TEXT NOT NULL,
  price NUMERIC(12, 3) NOT NULL DEFAULT 0,
  stock NUMERIC(12, 3) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (product_id, color),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_color
  ON product_variants (product_id, color);

CREATE TABLE IF NOT EXISTS product_catalog_metadata (
  kind TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (kind, value)
);

CREATE INDEX IF NOT EXISTS idx_product_catalog_metadata_kind
  ON product_catalog_metadata (kind);

CREATE INDEX IF NOT EXISTS idx_product_catalog_metadata_value
  ON product_catalog_metadata (value);

CREATE TABLE IF NOT EXISTS price_history (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  color TEXT NOT NULL,
  old_price NUMERIC(12, 3) NOT NULL DEFAULT 0,
  new_price NUMERIC(12, 3) NOT NULL DEFAULT 0,
  changed_at TIMESTAMPTZ NOT NULL,
  changed_by TEXT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_price_history_product_id
  ON price_history (product_id);

CREATE INDEX IF NOT EXISTS idx_price_history_product_color
  ON price_history (product_id, color);

CREATE INDEX IF NOT EXISTS idx_price_history_changed_at
  ON price_history (changed_at DESC);

-- =========================================================
-- Movements
-- =========================================================
-- CONFIRME: employee_id / employee_name / username sont presents dans la vraie base SQLite.
CREATE TABLE IF NOT EXISTS movements (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  reference TEXT,
  label TEXT,
  category TEXT,
  serie TEXT,
  color TEXT NOT NULL,
  type TEXT NOT NULL,
  delta NUMERIC(12, 3) NOT NULL DEFAULT 0,
  before NUMERIC(12, 3) NOT NULL DEFAULT 0,
  after NUMERIC(12, 3) NOT NULL DEFAULT 0,
  reason TEXT,
  actor TEXT,
  employee_id TEXT,
  employee_name TEXT,
  username TEXT,
  at TIMESTAMPTZ NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_movements_product
  ON movements (product_id);

CREATE INDEX IF NOT EXISTS idx_movements_at
  ON movements (at DESC);

CREATE INDEX IF NOT EXISTS idx_movements_employee_id
  ON movements (employee_id);

CREATE INDEX IF NOT EXISTS idx_movements_username
  ON movements (username);

-- =========================================================
-- Quotes and invoices
-- =========================================================
-- CONFIRME: payload JSON texte actuel -> JSONB en PostgreSQL
CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ,
  client_id TEXT,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_quotes_client_id
  ON quotes (client_id);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ,
  client_id TEXT,
  quote_id TEXT,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_invoices_client_id
  ON invoices (client_id);

CREATE INDEX IF NOT EXISTS idx_invoices_quote_id
  ON invoices (quote_id);

-- =========================================================
-- Salary
-- =========================================================
-- CONFIRME
CREATE TABLE IF NOT EXISTS salary_advances (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  montant NUMERIC(12, 3) NOT NULL DEFAULT 0,
  note TEXT,
  date_avance TIMESTAMPTZ NOT NULL,
  mois_reference INTEGER NOT NULL,
  annee_reference INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS salary_bonuses (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  montant NUMERIC(12, 3) NOT NULL DEFAULT 0,
  motif TEXT,
  date_prime TIMESTAMPTZ NOT NULL,
  mois_reference INTEGER NOT NULL,
  annee_reference INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS salary_overtimes (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  hours NUMERIC(12, 3) NOT NULL,
  hourly_rate NUMERIC(12, 3) NOT NULL,
  amount NUMERIC(12, 3) NOT NULL,
  note TEXT,
  overtime_date TIMESTAMPTZ NOT NULL,
  mois_reference INTEGER NOT NULL,
  annee_reference INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_salary_advances_employee_id
  ON salary_advances (employee_id);

CREATE INDEX IF NOT EXISTS idx_salary_advances_month_year
  ON salary_advances (mois_reference, annee_reference);

CREATE INDEX IF NOT EXISTS idx_salary_bonuses_employee_id
  ON salary_bonuses (employee_id);

CREATE INDEX IF NOT EXISTS idx_salary_bonuses_month_year
  ON salary_bonuses (mois_reference, annee_reference);

CREATE INDEX IF NOT EXISTS idx_salary_overtimes_employee_id
  ON salary_overtimes (employee_id);

CREATE INDEX IF NOT EXISTS idx_salary_overtimes_month_year
  ON salary_overtimes (mois_reference, annee_reference);

-- =========================================================
-- Auth security
-- =========================================================
-- CONFIRME par le code et l'introspection SQLite.
CREATE TABLE IF NOT EXISTS auth_challenges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  purpose TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  attempts_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL,
  requested_ip TEXT,
  requested_user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_auth_challenges_user_id
  ON auth_challenges (user_id);

CREATE INDEX IF NOT EXISTS idx_auth_challenges_purpose
  ON auth_challenges (purpose);

CREATE INDEX IF NOT EXISTS idx_auth_challenges_expires_at
  ON auth_challenges (expires_at);

CREATE TABLE IF NOT EXISTS security_audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  event_type TEXT NOT NULL,
  email_attempted TEXT,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  ip TEXT,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL,
  FOREIGN KEY (user_id) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_security_audit_user_id
  ON security_audit_log (user_id);

CREATE INDEX IF NOT EXISTS idx_security_audit_event
  ON security_audit_log (event_type);

CREATE INDEX IF NOT EXISTS idx_security_audit_created_at
  ON security_audit_log (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_audit_email
  ON security_audit_log (email_attempted);

COMMIT;
