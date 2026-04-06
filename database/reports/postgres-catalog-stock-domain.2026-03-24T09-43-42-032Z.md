# PostgreSQL Catalog Stock Domain Validation

- Status: `failed`
- Started at: `2026-03-24T09:43:17.354Z`
- Finished at: `2026-03-24T09:43:41.519Z`
- SQLite path kept: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- DB driver forced for audit: `postgres`
- Active PostgreSQL scopes: `clients, employees, salary, auth-security, products-read, stock-read, movements-read, price-history-read, products-metadata-write, products-core-write, products-structure-write, products-price-write, products-purge-write, stock-set-qty-write, stock-delta-write, movements-write, stock-apply-movement-write`
- Activation decision: `not-activable-yet`
- Base URL: `http://127.0.0.1:61934`

## Validated

- None.

## Sequence Checks

- auth login: ok (owner audit session created)
- create product: ok (id=6ecb8901-97f4-4a98-8412-f03e7acf4508)
- update product: ok (id=6ecb8901-97f4-4a98-8412-f03e7acf4508)
- update price: ok (color=pg-audit-csd-color-a-mn4ffqsp)
- restore price: ok (color=pg-audit-csd-color-a-mn4ffqsp)

## Parity Checks

- after create active product: ok (matched SQLite reference)
- after create archived product: ok (matched SQLite reference)
- after create metadata: ok (matched SQLite reference)
- after create stock rows: ok (matched SQLite reference)
- after create stock item: ok (matched SQLite reference)
- after create inventory item: ok (matched SQLite reference)
- after create inventory total value: ok (matched SQLite reference)
- after create price history: ok (matched SQLite reference)
- after create movements: ok (matched SQLite reference)
- after create direct product: ok (matched SQLite reference)
- after create direct lifecycle: ok (matched SQLite reference)
- after create direct variants: ok (matched SQLite reference)
- after create direct metadata rows: ok (matched SQLite reference)
- after create direct stock count: ok (matched SQLite reference)
- after create direct price history count: ok (matched SQLite reference)
- after create direct movement count: ok (matched SQLite reference)
- after update active product: ok (matched SQLite reference)
- after update archived product: ok (matched SQLite reference)
- after update metadata: ok (matched SQLite reference)
- after update stock rows: ok (matched SQLite reference)
- after update stock item: ok (matched SQLite reference)
- after update inventory item: ok (matched SQLite reference)
- after update inventory total value: ok (matched SQLite reference)
- after update price history: ok (matched SQLite reference)
- after update movements: ok (matched SQLite reference)
- after update direct product: ok (matched SQLite reference)
- after update direct lifecycle: ok (matched SQLite reference)
- after update direct variants: ok (matched SQLite reference)
- after update direct metadata rows: ok (matched SQLite reference)
- after update direct stock count: ok (matched SQLite reference)
- after update direct price history count: ok (matched SQLite reference)
- after update direct movement count: ok (matched SQLite reference)
- after price writes active product: ok (matched SQLite reference)
- after price writes archived product: ok (matched SQLite reference)
- after price writes metadata: ok (matched SQLite reference)
- after price writes stock rows: ok (matched SQLite reference)
- after price writes stock item: ok (matched SQLite reference)
- after price writes inventory item: ok (matched SQLite reference)
- after price writes inventory total value: ok (matched SQLite reference)

## Activation Plan

- No activation plan recorded.

## Remaining Risks

- after price writes parity mismatch for price history.

