# SQLite Introspection

- Generated at: `2026-03-19T16:58:02.378Z`
- SQLite path: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- Tables found: `15`

## Draft Comparison

- Shared tables: 15
- Actual only: 0
- Draft only: 0

## Tables

### auth_challenges

```sql
CREATE TABLE auth_challenges (
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
    )
```

| Column | Type | Not Null | Default | PK |
| --- | --- | --- | --- | --- |
| `id` | `TEXT` | no | `` | `1` |
| `user_id` | `TEXT` | yes | `` | `0` |
| `purpose` | `TEXT` | yes | `` | `0` |
| `code_hash` | `TEXT` | yes | `` | `0` |
| `expires_at` | `TEXT` | yes | `` | `0` |
| `used_at` | `TEXT` | no | `` | `0` |
| `attempts_count` | `INTEGER` | yes | `0` | `0` |
| `max_attempts` | `INTEGER` | yes | `5` | `0` |
| `created_at` | `TEXT` | yes | `` | `0` |
| `requested_ip` | `TEXT` | no | `` | `0` |
| `requested_user_agent` | `TEXT` | no | `` | `0` |

Foreign keys:
- `user_id` -> `employees.id` (on update: NO ACTION, on delete: CASCADE)

Indexes:
- `idx_auth_challenges_expires_at` | unique=false | partial=false | origin=c | columns=[expires_at]
- `idx_auth_challenges_purpose` | unique=false | partial=false | origin=c | columns=[purpose]
- `idx_auth_challenges_user_id` | unique=false | partial=false | origin=c | columns=[user_id]
- `sqlite_autoindex_auth_challenges_1` | unique=true | partial=false | origin=pk | columns=[id]

### clients

```sql
CREATE TABLE clients (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL,
      telephone TEXT,
      adresse TEXT,
      mf TEXT,
      email TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
```

| Column | Type | Not Null | Default | PK |
| --- | --- | --- | --- | --- |
| `id` | `TEXT` | no | `` | `1` |
| `nom` | `TEXT` | yes | `` | `0` |
| `telephone` | `TEXT` | no | `` | `0` |
| `adresse` | `TEXT` | no | `` | `0` |
| `mf` | `TEXT` | no | `` | `0` |
| `email` | `TEXT` | no | `` | `0` |
| `created_at` | `TEXT` | yes | `` | `0` |
| `updated_at` | `TEXT` | yes | `` | `0` |

Indexes:
- `idx_clients_mf` | unique=false | partial=false | origin=c | columns=[mf]
- `idx_clients_email` | unique=false | partial=false | origin=c | columns=[email]
- `idx_clients_telephone` | unique=false | partial=false | origin=c | columns=[telephone]
- `idx_clients_nom` | unique=false | partial=false | origin=c | columns=[nom]
- `sqlite_autoindex_clients_1` | unique=true | partial=false | origin=pk | columns=[id]

### employees

```sql
CREATE TABLE employees (
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
      can_manage_stock INTEGER NOT NULL DEFAULT 0,
      can_manage_employees INTEGER NOT NULL DEFAULT 0,
      can_manage_invoices INTEGER NOT NULL DEFAULT 0,
      can_manage_quotes INTEGER NOT NULL DEFAULT 0,
      can_manage_clients INTEGER NOT NULL DEFAULT 0,
      can_manage_salary INTEGER NOT NULL DEFAULT 0,
      last_login_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    , can_add_stock INTEGER NOT NULL DEFAULT 0, can_remove_stock INTEGER NOT NULL DEFAULT 0, can_adjust_stock INTEGER NOT NULL DEFAULT 0, can_manage_estimations INTEGER NOT NULL DEFAULT 0, can_manage_archives INTEGER NOT NULL DEFAULT 0, can_manage_inventory INTEGER NOT NULL DEFAULT 0, can_view_history INTEGER NOT NULL DEFAULT 0, can_manage_all INTEGER NOT NULL DEFAULT 0, can_edit_stock_product INTEGER NOT NULL DEFAULT 0, can_archive_stock_product INTEGER NOT NULL DEFAULT 0)
```

| Column | Type | Not Null | Default | PK |
| --- | --- | --- | --- | --- |
| `id` | `TEXT` | no | `` | `1` |
| `nom` | `TEXT` | yes | `` | `0` |
| `telephone` | `TEXT` | no | `` | `0` |
| `adresse` | `TEXT` | no | `` | `0` |
| `poste` | `TEXT` | no | `` | `0` |
| `salaire_base` | `REAL` | yes | `0` | `0` |
| `date_embauche` | `TEXT` | no | `` | `0` |
| `actif` | `INTEGER` | yes | `1` | `0` |
| `is_active` | `INTEGER` | yes | `1` | `0` |
| `username` | `TEXT` | no | `` | `0` |
| `email` | `TEXT` | no | `` | `0` |
| `email_normalized` | `TEXT` | no | `` | `0` |
| `password_hash` | `TEXT` | no | `` | `0` |
| `role` | `TEXT` | yes | `'employee'` | `0` |
| `is_protected_account` | `INTEGER` | yes | `0` | `0` |
| `requires_email_2fa` | `INTEGER` | yes | `0` | `0` |
| `must_setup_password` | `INTEGER` | yes | `0` | `0` |
| `can_view_stock` | `INTEGER` | yes | `0` | `0` |
| `can_manage_stock` | `INTEGER` | yes | `0` | `0` |
| `can_manage_employees` | `INTEGER` | yes | `0` | `0` |
| `can_manage_invoices` | `INTEGER` | yes | `0` | `0` |
| `can_manage_quotes` | `INTEGER` | yes | `0` | `0` |
| `can_manage_clients` | `INTEGER` | yes | `0` | `0` |
| `can_manage_salary` | `INTEGER` | yes | `0` | `0` |
| `last_login_at` | `TEXT` | no | `` | `0` |
| `created_at` | `TEXT` | yes | `` | `0` |
| `updated_at` | `TEXT` | yes | `` | `0` |
| `can_add_stock` | `INTEGER` | yes | `0` | `0` |
| `can_remove_stock` | `INTEGER` | yes | `0` | `0` |
| `can_adjust_stock` | `INTEGER` | yes | `0` | `0` |
| `can_manage_estimations` | `INTEGER` | yes | `0` | `0` |
| `can_manage_archives` | `INTEGER` | yes | `0` | `0` |
| `can_manage_inventory` | `INTEGER` | yes | `0` | `0` |
| `can_view_history` | `INTEGER` | yes | `0` | `0` |
| `can_manage_all` | `INTEGER` | yes | `0` | `0` |
| `can_edit_stock_product` | `INTEGER` | yes | `0` | `0` |
| `can_archive_stock_product` | `INTEGER` | yes | `0` | `0` |

Indexes:
- `idx_employees_email_unique` | unique=true | partial=false | origin=c | columns=[email_normalized]
- `idx_employees_email` | unique=false | partial=false | origin=c | columns=[email_normalized]
- `idx_employees_username_unique` | unique=true | partial=false | origin=c | columns=[username]
- `idx_employees_username` | unique=false | partial=false | origin=c | columns=[username]
- `sqlite_autoindex_employees_2` | unique=true | partial=false | origin=u | columns=[username]
- `sqlite_autoindex_employees_1` | unique=true | partial=false | origin=pk | columns=[id]

### invoices

```sql
CREATE TABLE invoices (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
      updated_at TEXT
    , quote_id TEXT)
```

| Column | Type | Not Null | Default | PK |
| --- | --- | --- | --- | --- |
| `id` | `TEXT` | no | `` | `1` |
| `payload` | `TEXT` | yes | `` | `0` |
| `client_id` | `TEXT` | no | `` | `0` |
| `updated_at` | `TEXT` | no | `` | `0` |
| `quote_id` | `TEXT` | no | `` | `0` |

Foreign keys:
- `client_id` -> `clients.id` (on update: NO ACTION, on delete: SET NULL)

Indexes:
- `idx_invoices_quote_id` | unique=false | partial=false | origin=c | columns=[quote_id]
- `idx_invoices_client_id` | unique=false | partial=false | origin=c | columns=[client_id]
- `sqlite_autoindex_invoices_1` | unique=true | partial=false | origin=pk | columns=[id]

### movements

```sql
CREATE TABLE movements (
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
      at TEXT NOT NULL, employee_id TEXT, employee_name TEXT, username TEXT,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
```

| Column | Type | Not Null | Default | PK |
| --- | --- | --- | --- | --- |
| `id` | `TEXT` | no | `` | `1` |
| `product_id` | `TEXT` | yes | `` | `0` |
| `reference` | `TEXT` | no | `` | `0` |
| `label` | `TEXT` | no | `` | `0` |
| `category` | `TEXT` | no | `` | `0` |
| `serie` | `TEXT` | no | `` | `0` |
| `color` | `TEXT` | yes | `` | `0` |
| `type` | `TEXT` | yes | `` | `0` |
| `delta` | `REAL` | yes | `` | `0` |
| `before` | `REAL` | yes | `` | `0` |
| `after` | `REAL` | yes | `` | `0` |
| `reason` | `TEXT` | no | `` | `0` |
| `actor` | `TEXT` | no | `` | `0` |
| `at` | `TEXT` | yes | `` | `0` |
| `employee_id` | `TEXT` | no | `` | `0` |
| `employee_name` | `TEXT` | no | `` | `0` |
| `username` | `TEXT` | no | `` | `0` |

Foreign keys:
- `product_id` -> `products.id` (on update: NO ACTION, on delete: CASCADE)

Indexes:
- `idx_movements_username` | unique=false | partial=false | origin=c | columns=[username]
- `idx_movements_employee_id` | unique=false | partial=false | origin=c | columns=[employee_id]
- `idx_movements_at` | unique=false | partial=false | origin=c | columns=[at]
- `idx_movements_product` | unique=false | partial=false | origin=c | columns=[product_id]
- `sqlite_autoindex_movements_1` | unique=true | partial=false | origin=pk | columns=[id]

### price_history

```sql
CREATE TABLE price_history (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      color TEXT NOT NULL,
      old_price REAL NOT NULL,
      new_price REAL NOT NULL,
      changed_at TEXT NOT NULL,
      changed_by TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
```

| Column | Type | Not Null | Default | PK |
| --- | --- | --- | --- | --- |
| `id` | `TEXT` | no | `` | `1` |
| `product_id` | `TEXT` | yes | `` | `0` |
| `color` | `TEXT` | yes | `` | `0` |
| `old_price` | `REAL` | yes | `` | `0` |
| `new_price` | `REAL` | yes | `` | `0` |
| `changed_at` | `TEXT` | yes | `` | `0` |
| `changed_by` | `TEXT` | yes | `` | `0` |

Foreign keys:
- `product_id` -> `products.id` (on update: NO ACTION, on delete: CASCADE)

Indexes:
- `idx_price_history_product_color` | unique=false | partial=false | origin=c | columns=[product_id, color]
- `idx_price_history_changed_at` | unique=false | partial=false | origin=c | columns=[changed_at]
- `idx_price_history_product_id` | unique=false | partial=false | origin=c | columns=[product_id]
- `sqlite_autoindex_price_history_1` | unique=true | partial=false | origin=pk | columns=[id]

### product_catalog_metadata

```sql
CREATE TABLE product_catalog_metadata (
      kind TEXT NOT NULL,
      value TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (kind, value)
    )
```

| Column | Type | Not Null | Default | PK |
| --- | --- | --- | --- | --- |
| `kind` | `TEXT` | yes | `` | `1` |
| `value` | `TEXT` | yes | `` | `2` |
| `created_at` | `TEXT` | yes | `` | `0` |
| `updated_at` | `TEXT` | yes | `` | `0` |

Indexes:
- `idx_product_catalog_metadata_value` | unique=false | partial=false | origin=c | columns=[value]
- `idx_product_catalog_metadata_kind` | unique=false | partial=false | origin=c | columns=[kind]
- `sqlite_autoindex_product_catalog_metadata_1` | unique=true | partial=false | origin=pk | columns=[kind, value]

### product_variants

```sql
CREATE TABLE product_variants (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      color TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      stock REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      UNIQUE (product_id, color),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
```

| Column | Type | Not Null | Default | PK |
| --- | --- | --- | --- | --- |
| `id` | `TEXT` | no | `` | `1` |
| `product_id` | `TEXT` | yes | `` | `0` |
| `color` | `TEXT` | yes | `` | `0` |
| `price` | `REAL` | yes | `0` | `0` |
| `stock` | `REAL` | yes | `0` | `0` |
| `updated_at` | `TEXT` | yes | `` | `0` |

Foreign keys:
- `product_id` -> `products.id` (on update: NO ACTION, on delete: CASCADE)

Indexes:
- `idx_product_variants_product_color` | unique=false | partial=false | origin=c | columns=[product_id, color]
- `sqlite_autoindex_product_variants_2` | unique=true | partial=false | origin=u | columns=[product_id, color]
- `sqlite_autoindex_product_variants_1` | unique=true | partial=false | origin=pk | columns=[id]

### products

```sql
CREATE TABLE products (
      id TEXT PRIMARY KEY,
      reference TEXT NOT NULL,
      label TEXT NOT NULL,
      category TEXT NOT NULL,
      serie TEXT NOT NULL,
      unit TEXT NOT NULL,
      image_url TEXT,
      low_stock_threshold INTEGER NOT NULL DEFAULT 0,
      last_updated TEXT,
      price_ttc REAL
    , description TEXT, is_archived INTEGER NOT NULL DEFAULT 0, archived_at TEXT, is_deleted INTEGER NOT NULL DEFAULT 0, deleted_at TEXT)
```

| Column | Type | Not Null | Default | PK |
| --- | --- | --- | --- | --- |
| `id` | `TEXT` | no | `` | `1` |
| `reference` | `TEXT` | yes | `` | `0` |
| `label` | `TEXT` | yes | `` | `0` |
| `category` | `TEXT` | yes | `` | `0` |
| `serie` | `TEXT` | yes | `` | `0` |
| `unit` | `TEXT` | yes | `` | `0` |
| `image_url` | `TEXT` | no | `` | `0` |
| `low_stock_threshold` | `INTEGER` | yes | `0` | `0` |
| `last_updated` | `TEXT` | no | `` | `0` |
| `price_ttc` | `REAL` | no | `` | `0` |
| `description` | `TEXT` | no | `` | `0` |
| `is_archived` | `INTEGER` | yes | `0` | `0` |
| `archived_at` | `TEXT` | no | `` | `0` |
| `is_deleted` | `INTEGER` | yes | `0` | `0` |
| `deleted_at` | `TEXT` | no | `` | `0` |

Indexes:
- `idx_products_is_archived` | unique=false | partial=false | origin=c | columns=[is_archived]
- `idx_products_label` | unique=false | partial=false | origin=c | columns=[label]
- `idx_products_reference` | unique=false | partial=false | origin=c | columns=[reference]
- `sqlite_autoindex_products_1` | unique=true | partial=false | origin=pk | columns=[id]

### quotes

```sql
CREATE TABLE quotes (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
      updated_at TEXT
    )
```

| Column | Type | Not Null | Default | PK |
| --- | --- | --- | --- | --- |
| `id` | `TEXT` | no | `` | `1` |
| `payload` | `TEXT` | yes | `` | `0` |
| `client_id` | `TEXT` | no | `` | `0` |
| `updated_at` | `TEXT` | no | `` | `0` |

Foreign keys:
- `client_id` -> `clients.id` (on update: NO ACTION, on delete: SET NULL)

Indexes:
- `idx_quotes_client_id` | unique=false | partial=false | origin=c | columns=[client_id]
- `sqlite_autoindex_quotes_1` | unique=true | partial=false | origin=pk | columns=[id]

### salary_advances

```sql
CREATE TABLE salary_advances (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      montant REAL NOT NULL,
      note TEXT,
      date_avance TEXT NOT NULL,
      mois_reference INTEGER NOT NULL,
      annee_reference INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    )
```

| Column | Type | Not Null | Default | PK |
| --- | --- | --- | --- | --- |
| `id` | `TEXT` | no | `` | `1` |
| `employee_id` | `TEXT` | yes | `` | `0` |
| `montant` | `REAL` | yes | `` | `0` |
| `note` | `TEXT` | no | `` | `0` |
| `date_avance` | `TEXT` | yes | `` | `0` |
| `mois_reference` | `INTEGER` | yes | `` | `0` |
| `annee_reference` | `INTEGER` | yes | `` | `0` |
| `created_at` | `TEXT` | yes | `` | `0` |

Foreign keys:
- `employee_id` -> `employees.id` (on update: NO ACTION, on delete: CASCADE)

Indexes:
- `idx_salary_advances_month_year` | unique=false | partial=false | origin=c | columns=[mois_reference, annee_reference]
- `idx_salary_advances_employee_id` | unique=false | partial=false | origin=c | columns=[employee_id]
- `sqlite_autoindex_salary_advances_1` | unique=true | partial=false | origin=pk | columns=[id]

### salary_bonuses

```sql
CREATE TABLE salary_bonuses (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      montant REAL NOT NULL,
      motif TEXT,
      date_prime TEXT NOT NULL,
      mois_reference INTEGER NOT NULL,
      annee_reference INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    )
```

| Column | Type | Not Null | Default | PK |
| --- | --- | --- | --- | --- |
| `id` | `TEXT` | no | `` | `1` |
| `employee_id` | `TEXT` | yes | `` | `0` |
| `montant` | `REAL` | yes | `` | `0` |
| `motif` | `TEXT` | no | `` | `0` |
| `date_prime` | `TEXT` | yes | `` | `0` |
| `mois_reference` | `INTEGER` | yes | `` | `0` |
| `annee_reference` | `INTEGER` | yes | `` | `0` |
| `created_at` | `TEXT` | yes | `` | `0` |

Foreign keys:
- `employee_id` -> `employees.id` (on update: NO ACTION, on delete: CASCADE)

Indexes:
- `idx_salary_bonuses_month_year` | unique=false | partial=false | origin=c | columns=[mois_reference, annee_reference]
- `idx_salary_bonuses_employee_id` | unique=false | partial=false | origin=c | columns=[employee_id]
- `sqlite_autoindex_salary_bonuses_1` | unique=true | partial=false | origin=pk | columns=[id]

### salary_overtimes

```sql
CREATE TABLE salary_overtimes (
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
  )
```

| Column | Type | Not Null | Default | PK |
| --- | --- | --- | --- | --- |
| `id` | `TEXT` | no | `` | `1` |
| `employee_id` | `TEXT` | yes | `` | `0` |
| `hours` | `REAL` | yes | `` | `0` |
| `hourly_rate` | `REAL` | yes | `` | `0` |
| `amount` | `REAL` | yes | `` | `0` |
| `note` | `TEXT` | no | `` | `0` |
| `overtime_date` | `TEXT` | yes | `` | `0` |
| `mois_reference` | `INTEGER` | yes | `` | `0` |
| `annee_reference` | `INTEGER` | yes | `` | `0` |
| `created_at` | `TEXT` | yes | `` | `0` |

Indexes:
- `idx_salary_overtimes_month_year` | unique=false | partial=false | origin=c | columns=[mois_reference, annee_reference]
- `idx_salary_overtimes_employee_id` | unique=false | partial=false | origin=c | columns=[employee_id]
- `sqlite_autoindex_salary_overtimes_1` | unique=true | partial=false | origin=pk | columns=[id]

### security_audit_log

```sql
CREATE TABLE security_audit_log (
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
    )
```

| Column | Type | Not Null | Default | PK |
| --- | --- | --- | --- | --- |
| `id` | `TEXT` | no | `` | `1` |
| `user_id` | `TEXT` | no | `` | `0` |
| `event_type` | `TEXT` | yes | `` | `0` |
| `email_attempted` | `TEXT` | no | `` | `0` |
| `success` | `INTEGER` | yes | `` | `0` |
| `ip` | `TEXT` | no | `` | `0` |
| `user_agent` | `TEXT` | no | `` | `0` |
| `details` | `TEXT` | no | `` | `0` |
| `created_at` | `TEXT` | yes | `` | `0` |

Foreign keys:
- `user_id` -> `employees.id` (on update: NO ACTION, on delete: SET NULL)

Indexes:
- `idx_security_audit_email` | unique=false | partial=false | origin=c | columns=[email_attempted]
- `idx_security_audit_created_at` | unique=false | partial=false | origin=c | columns=[created_at]
- `idx_security_audit_event` | unique=false | partial=false | origin=c | columns=[event_type]
- `idx_security_audit_user_id` | unique=false | partial=false | origin=c | columns=[user_id]
- `sqlite_autoindex_security_audit_log_1` | unique=true | partial=false | origin=pk | columns=[id]

### stock

```sql
CREATE TABLE stock (
      product_id TEXT NOT NULL,
      color TEXT NOT NULL,
      qty REAL NOT NULL DEFAULT 0,
      PRIMARY KEY (product_id, color),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
```

| Column | Type | Not Null | Default | PK |
| --- | --- | --- | --- | --- |
| `product_id` | `TEXT` | yes | `` | `1` |
| `color` | `TEXT` | yes | `` | `2` |
| `qty` | `REAL` | yes | `0` | `0` |

Foreign keys:
- `product_id` -> `products.id` (on update: NO ACTION, on delete: CASCADE)

Indexes:
- `idx_stock_product` | unique=false | partial=false | origin=c | columns=[product_id]
- `sqlite_autoindex_stock_1` | unique=true | partial=false | origin=pk | columns=[product_id, color]

