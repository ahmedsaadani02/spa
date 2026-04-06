# PostgreSQL Tranche 1 Validation

- Status: `failed`
- Started at: `2026-03-23T10:26:43.068Z`
- Finished at: `2026-03-23T10:26:44.753Z`
- SQLite path kept: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- DB driver forced for audit: `postgres`
- Active PostgreSQL scopes: `clients, employees, salary, auth-security`

## Validated

- None.

## Service Results

- clients.service.list: ok (count=4)

## Handler Results


## Runtime Paths

- clients service + clients handlers: clients.service/clients.handlers -> clients.runtime.repository -> postgres/clients.repository when DB_DRIVER=postgres
- employees service + employees handlers: employees.service/employees.handlers -> employees.runtime.repository -> postgres/employees.repository when DB_DRIVER=postgres
- salary service + salary handlers: salary.service/salary.handlers -> salary.runtime.repository -> postgres/salary.repository when DB_DRIVER=postgres
- auth-security via auth flow: auth.handlers -> auth-core.service -> employees.repository (SQLite read path) + auth-security.runtime.repository (PostgreSQL write path)

## Remaining Risks

- Audit failed before full validation: clients.service.upsert did not create a client.

## Not In Scope

- quotes
- invoices
- products
- stock
- movements
- inventory

