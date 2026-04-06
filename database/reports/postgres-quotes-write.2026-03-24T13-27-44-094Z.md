# PostgreSQL Quotes Write Validation

- Status: `failed`
- Started at: `2026-03-24T13:27:37.557Z`
- Finished at: `2026-03-24T13:27:44.093Z`
- SQLite source kept: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- SQLite audit copy used by local runtime: `C:\Users\Ahmed Saadani\Desktop\spa-test\database\tmp\quotes-write-audit.2026-03-24T13-27-37-247Z.sqlite`
- DB driver forced for audit: `postgres`
- Active PostgreSQL scopes: `clients, employees, salary, auth-security, quotes-read, quotes-write`
- Base URL: `http://127.0.0.1:57650`

## Validated

- None.

## HTTP Checks

- POST /api/auth/login: ok (token=4cff209c...)
- PUT /api/quotes/:id (create): ok (id=quotes-write-audit-mn4ng8r9)
- PUT /api/quotes/:id (update): ok (id=quotes-write-audit-mn4ng8r9)
- GET /api/quotes (after update): ok (count=5)
- DELETE /api/quotes/:id: ok (id=quotes-write-audit-mn4ng8r9)

## Parity Checks

- quotes put(create) parity: ok (id=quotes-write-audit-mn4ng8r9)
- client backfill parity on create: ok (email=quotes-write-mn4ng8r9@example.test)
- quotes put(update) parity: ok (id=quotes-write-audit-mn4ng8r9)
- quotes list parity after update: ok (count=5)
- quotes delete parity: ok (id=quotes-write-audit-mn4ng8r9)

## Scope Checks

- quote client_id set on create: ok (non-null in SQLite and PostgreSQL)
- invoices unchanged during quotes put/delete: ok (count=6)
- quotes count restored after delete: ok (count=4)

## Remaining Risks

- Audit failed before full validation: Clients count parity mismatch after quotes put/delete.

