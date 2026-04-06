# PostgreSQL Catalog Stock Domain Validation

- Status: `failed`
- Started at: `2026-03-24T09:35:44.957Z`
- Finished at: `2026-03-24T09:35:59.080Z`
- SQLite path kept: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- DB driver forced for audit: `postgres`
- Active PostgreSQL scopes: `clients, employees, salary, auth-security, products-read, stock-read, movements-read, price-history-read, products-metadata-write, products-core-write, products-structure-write, products-price-write, products-purge-write, stock-set-qty-write, stock-delta-write, movements-write, stock-apply-movement-write`
- Activation decision: `not-activable-yet`
- Base URL: `http://127.0.0.1:59590`

## Validated

- None.

## Sequence Checks

- auth login: ok (owner audit session created)
- create product: ok (id=27287427-665d-4208-aaf8-b88144db82a7)

## Parity Checks

- after create active product: ok (matched SQLite reference)
- after create archived product: ok (matched SQLite reference)
- after create metadata: ok (matched SQLite reference)

## Activation Plan

- No activation plan recorded.

## Remaining Risks

- after create parity mismatch for stock rows.

