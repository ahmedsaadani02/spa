# PostgreSQL Tranche 1 Validation

- Status: `completed`
- Started at: `2026-03-23T10:29:53.388Z`
- Finished at: `2026-03-23T10:30:03.102Z`
- SQLite path kept: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- DB driver forced for audit: `postgres`
- Active PostgreSQL scopes: `clients, employees, salary, auth-security`

## Validated

- Clients service and IPC handler read/write paths hit PostgreSQL successfully.
- Employees service and IPC handler read/write paths hit PostgreSQL successfully.
- Salary service and IPC handler read/write paths hit PostgreSQL successfully.
- Auth-security repository lifecycle works on PostgreSQL, and auth:beginLogin writes audit events to PostgreSQL.

## Service Results

- clients.service.list: ok (count=4)
- clients.service.upsert: ok (id=f9d2a406-d96b-43d3-9ba8-8bd3d0e8b064)
- clients.service.getById: ok (id=f9d2a406-d96b-43d3-9ba8-8bd3d0e8b064)
- clients.service.search: ok (matches=1)
- clients.service.update: ok
- clients.service.findOrCreate: ok
- employees.service.create: ok (id=d25242ac-7f3b-41bc-83f0-9222b50ea581)
- employees.service.list: ok (count=5)
- employees.service.search: ok (matches=1)
- employees.service.getById: ok
- employees.service.update: ok
- employees.service.setActive: ok
- salary.service.create: ok (advance=232b1d3f-8dae-403e-b0d6-497ae07690da, bonus=68255b98-8443-4e91-bd49-ec23eca4e0ad, overtime=dd81d0ac-fa09-4d5b-8a92-7538cb847ace)
- salary.service.list: ok (advances=1, bonuses=1, overtimes=1)
- salary.service.summary: ok (resteAPayer=2376)
- salary.service.delete: ok
- employees.service.delete: ok
- clients.service.delete: ok

## Handler Results

- clients handler list: ok (count=5)
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

