# PostgreSQL Tranche 1 Validation

- Status: `completed`
- Started at: `2026-03-24T13:41:30.044Z`
- Finished at: `2026-03-24T13:41:42.612Z`
- SQLite path kept: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- DB driver forced for audit: `postgres`
- Active PostgreSQL scopes: `clients, employees, salary, auth-security`

## Validated

- Clients service and IPC handler read/write paths hit PostgreSQL successfully.
- Employees service and IPC handler read/write paths hit PostgreSQL successfully.
- Salary service and IPC handler read/write paths hit PostgreSQL successfully.
- Auth-security repository lifecycle works on PostgreSQL, and auth:beginLogin writes audit events to PostgreSQL.

## Service Results

- clients.service.list: ok (count=8)
- clients.service.upsert: ok (id=715b4af9-436f-4cef-91c8-913986d5f1eb)
- clients.service.getById: ok (id=715b4af9-436f-4cef-91c8-913986d5f1eb)
- clients.service.search: ok (matches=1)
- clients.service.update: ok
- clients.service.findOrCreate: ok
- employees.service.create: ok (id=46b972b2-d952-4df3-a702-0849709ec3cd)
- employees.service.list: ok (count=5)
- employees.service.search: ok (matches=1)
- employees.service.getById: ok
- employees.service.update: ok
- employees.service.setActive: ok
- salary.service.create: ok (advance=38298014-4681-4683-9c4c-5c2f402d26bf, bonus=f0806a71-446d-4d8d-bb10-654e7133eaa1, overtime=332fdbd2-0670-4c0e-a248-84211c7d687f)
- salary.service.list: ok (advances=1, bonuses=1, overtimes=1)
- salary.service.summary: ok (resteAPayer=2376)
- salary.service.delete: ok
- employees.service.delete: ok
- clients.service.delete: ok

## Handler Results

- clients handler list: ok (count=9)
- employees handler getById: ok
- salary handler summary: ok
- auth-security repository challenge lifecycle: ok
- auth handler -> auth-security audit write: ok (events=1)

## Runtime Paths

- clients service + clients handlers: clients.service/clients.handlers -> clients.runtime.repository -> postgres/clients.repository when DB_DRIVER=postgres
- employees service + employees handlers: employees.service/employees.handlers -> employees.runtime.repository -> postgres/employees.repository when DB_DRIVER=postgres
- salary service + salary handlers: salary.service/salary.handlers -> salary.runtime.repository -> postgres/salary.repository when DB_DRIVER=postgres
- auth-security via auth flow: auth.handlers -> auth-core.service -> employees.repository (SQLite read path) + auth-security.runtime.repository (PostgreSQL write path)

## Remaining Risks

- Session resolution still reads employee auth rows from SQLite in server.js via getEmployeeAuthRowById.
- auth-core.service still reads employee identities and password data from SQLite through employees.repository.
- quotes/invoices still depend on SQLite client-link backfill helpers and are intentionally excluded from tranche 1.
- This audit validates services and IPC handlers directly, not a full end-to-end HTTP session lifecycle with DB_DRIVER=postgres.

## Not In Scope

- quotes
- invoices
- products
- stock
- movements
- inventory

