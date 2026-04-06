# PostgreSQL Tranche 1 Validation

- Status: `completed`
- Started at: `2026-03-24T13:31:40.383Z`
- Finished at: `2026-03-24T13:31:59.882Z`
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
- clients.service.upsert: ok (id=79795392-9baa-4893-b17d-e3b54daae970)
- clients.service.getById: ok (id=79795392-9baa-4893-b17d-e3b54daae970)
- clients.service.search: ok (matches=1)
- clients.service.update: ok
- clients.service.findOrCreate: ok
- employees.service.create: ok (id=68114038-9023-4f0f-b7ea-c730fa3eb478)
- employees.service.list: ok (count=5)
- employees.service.search: ok (matches=1)
- employees.service.getById: ok
- employees.service.update: ok
- employees.service.setActive: ok
- salary.service.create: ok (advance=3b3fd663-4869-4dfd-8358-3b80800f981c, bonus=21fab6d9-5c1f-483d-8d1c-aeda13f32d74, overtime=f004bd2f-b835-4df0-a2ec-984b8d72a81e)
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

