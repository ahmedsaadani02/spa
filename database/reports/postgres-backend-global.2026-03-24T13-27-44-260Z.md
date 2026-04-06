# PostgreSQL Backend Global Validation

- Status: `failed`
- Started at: `2026-03-24T13:26:27.398Z`
- Finished at: `2026-03-24T13:27:44.259Z`
- Activation decision: `not-activable`
- Base URL: `n/a`

## Child Audits

- Tranche 1 clients/employees/salary: ok (exit=0; report=completed)
  report: C:\Users\Ahmed Saadani\Desktop\spa-test\database\reports\postgres-tranche1-validation.latest.json
- Tranche 2 auth/session: ok (exit=0; report=completed)
  report: C:\Users\Ahmed Saadani\Desktop\spa-test\database\reports\postgres-tranche2-auth-session.latest.json
- Domaine catalogue/stock: ok (exit=0; report=completed)
  report: C:\Users\Ahmed Saadani\Desktop\spa-test\database\reports\postgres-catalog-stock-domain.latest.json
- Quotes read: ok (exit=0; report=completed)
  report: C:\Users\Ahmed Saadani\Desktop\spa-test\database\reports\postgres-quotes-read.latest.json
- Quotes write: failed (exit=1; rd libpq semantics, which have weaker security guarantees.

To prepare for this change:
- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'

See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.
(Use `node --trace-warnings ...` to show where the warning was created)
[quotes-write-audit] Validation failed: Clients count parity mismatch after quotes put/delete.)
  report: C:\Users\Ahmed Saadani\Desktop\spa-test\database\reports\postgres-quotes-write.latest.json

## Integration Checks

- None.

## Validated

- None.

## Activation Plan

- None.

## Remaining Risks

- Quotes write failed: exit=1; rd libpq semantics, which have weaker security guarantees.

To prepare for this change:
- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'

See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.
(Use `node --trace-warnings ...` to show where the warning was created)
[quotes-write-audit] Validation failed: Clients count parity mismatch after quotes put/delete.

## Cleanup Recommendations

- None.

