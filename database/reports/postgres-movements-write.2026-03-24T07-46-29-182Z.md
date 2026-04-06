# PostgreSQL Movements Add Validation

- Status: `failed`
- Started at: `2026-03-24T07:46:18.583Z`
- Finished at: `2026-03-24T07:46:28.628Z`
- SQLite path kept: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- DB driver forced for audit: `postgres`
- Catalog read opt-in: `true`
- Product write opt-in: `true`
- Stock write opt-in: `true`
- Active PostgreSQL scopes: `clients, employees, salary, auth-security, products-read, stock-read, movements-read, price-history-read, products-metadata-write, products-core-write, products-structure-write, products-price-write, products-purge-write, stock-set-qty-write, stock-delta-write, movements-write`
- Base URL: `http://127.0.0.1:57794`

## Write Cartography

- `movements:add` ajoute uniquement une ligne dans `movements`.
- `movements:add` ne modifie pas `stock`, ne modifie pas `product_variants` et ne met pas a jour `products.last_updated`.
- Cette sous-etape ecrit l historique seul; la mutation combinee `stock:applyMovement` reste hors scope.

## Validated

- None.

## HTTP Checks

- POST /api/auth/login: ok (owner audit session created)
- POST /api/products: ok (id=c627cbd6-84d3-4cf8-a648-638b17ca83ef)
- POST /api/movements: ok (id=2a6430e8-8122-4506-a4b9-3e6498d1f2e7)
- GET /api/movements after add: ok (id=2a6430e8-8122-4506-a4b9-3e6498d1f2e7)

## Parity Checks

- movements parity: ok (id=2a6430e8-8122-4506-a4b9-3e6498d1f2e7)
- stock unchanged parity: ok (rows=2)
- product_variants unchanged parity: ok (rows=2)
- product semantic parity: ok (priceTtc=12.5)

## Side Effects

- stock untouched: ok (rows=2)
- product_variants untouched: ok (rows=2)

## SQLite Isolation Checks


## Remaining Risks

- movements:add should not update products.last_updated.

