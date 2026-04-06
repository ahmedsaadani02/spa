# PostgreSQL Catalog Stock Domain Validation

- Status: `failed`
- Started at: `2026-03-24T08:53:44.002Z`
- Finished at: `2026-03-24T08:53:58.485Z`
- SQLite path kept: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- DB driver forced for audit: `postgres`
- Active PostgreSQL scopes: `clients, employees, salary, auth-security, products-read, stock-read, movements-read, price-history-read, products-metadata-write, products-core-write, products-structure-write, products-price-write, products-purge-write, stock-set-qty-write, stock-delta-write, movements-write, stock-apply-movement-write`
- Activation decision: `not-activable-yet`
- Base URL: `http://127.0.0.1:51322`

## Validated

- None.

## Sequence Checks

- auth login: ok (owner audit session created)
- create product: ok (id=f2437dd4-5c44-4e7c-8e56-82e5b9528e02)

## Parity Checks


## Activation Plan

- No activation plan recorded.

## Remaining Risks

- Global catalog/stock audit HTTP check #3 failed with status 500.

