# PostgreSQL Tranche 1 Validation

- Status: `failed`
- Started at: `2026-03-23T10:29:08.586Z`
- Finished at: `2026-03-23T10:29:12.594Z`
- SQLite path kept: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- DB driver forced for audit: `postgres`
- Active PostgreSQL scopes: `clients, employees, salary, auth-security`

## Validated

- None.

## Service Results

- clients.service.list: ok (count=4)
- clients.service.upsert: ok (id=10d1a429-bc54-4c80-b646-1b2e67d88ad1)
- clients.service.getById: ok (id=10d1a429-bc54-4c80-b646-1b2e67d88ad1)
- clients.service.search: ok (matches=1)
- clients.service.update: ok
- clients.service.findOrCreate: ok

## Handler Results


## Runtime Paths

- clients service + clients handlers: clients.service/clients.handlers -> clients.runtime.repository -> postgres/clients.repository when DB_DRIVER=postgres
- employees service + employees handlers: employees.service/employees.handlers -> employees.runtime.repository -> postgres/employees.repository when DB_DRIVER=postgres
- salary service + salary handlers: salary.service/salary.handlers -> salary.runtime.repository -> postgres/salary.repository when DB_DRIVER=postgres
- auth-security via auth flow: auth.handlers -> auth-core.service -> employees.repository (SQLite read path) + auth-security.runtime.repository (PostgreSQL write path)

## Remaining Risks

- Audit failed before full validation: null value in column "id" of relation "employees" violates not-null constraint

## Not In Scope

- quotes
- invoices
- products
- stock
- movements
- inventory

