# PostgreSQL Quotes Invoices Domain Validation

- Status: `failed`
- Started at: `2026-03-24T13:19:44.329Z`
- Finished at: `2026-03-24T13:19:55.044Z`
- SQLite source kept: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- SQLite audit copy used by local runtime: `C:\Users\Ahmed Saadani\Desktop\spa-test\database\tmp\quotes-invoices-domain-audit.2026-03-24T13-19-43-919Z.sqlite`
- DB driver forced for audit: `postgres`
- Active PostgreSQL scopes: `clients, employees, salary, auth-security, quotes-read, quotes-write, quotes-convert-write, invoices-read, invoices-write, invoices-delete-write`
- Activation decision: `not-activable`
- Base URL: `http://127.0.0.1:62336`

## Validated

- None.

## Sequence Checks

- auth login: ok (owner audit session created)
- create quote for delete scenario: ok (id=qid-delete-mn4n63m1)
- update quote: ok (id=qid-delete-mn4n63m1)
- create cycle quotes: ok (ids=qid-reopen-mn4n63m1, qid-redirect-mn4n63m1)
- create standalone invoice: ok (id=iid-standalone-mn4n63m1)
- update standalone invoice: ok (id=iid-standalone-mn4n63m1)

## Parity Checks


## Activation Plan

- None.

## Remaining Risks

- Global audit failed before full validation: quotes-read parity mismatch after setup.

