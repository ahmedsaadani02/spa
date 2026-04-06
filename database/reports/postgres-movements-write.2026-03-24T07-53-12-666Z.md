# PostgreSQL Movements Add Validation

- Status: `completed`
- Started at: `2026-03-24T07:53:05.058Z`
- Finished at: `2026-03-24T07:53:12.138Z`
- SQLite path kept: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- DB driver forced for audit: `postgres`
- Catalog read opt-in: `true`
- Product write opt-in: `true`
- Stock write opt-in: `true`
- Active PostgreSQL scopes: `clients, employees, salary, auth-security, products-read, stock-read, movements-read, price-history-read, products-metadata-write, products-core-write, products-structure-write, products-price-write, products-purge-write, stock-set-qty-write, stock-delta-write, movements-write`
- Base URL: `http://127.0.0.1:49678`

## Write Cartography

- `movements:add` ajoute uniquement une ligne dans `movements`.
- `movements:add` ne modifie pas `stock`, ne modifie pas `product_variants` et ne met pas a jour `products.last_updated`.
- Cette sous-etape ecrit l historique seul; la mutation combinee `stock:applyMovement` reste hors scope.

## Validated

- `movements:add` est compatible PostgreSQL pour l insertion d une ligne d historique `movements`, avec parite validee contre une execution de reference SQLite.
- `movements:add` ne modifie ni `stock`, ni `product_variants`, ni `products.last_updated`, conformement au comportement SQLite actuel.
- Cette sous-etape reste audit-only et exige `DB_DRIVER=postgres`, `DB_ENABLE_POSTGRES_CATALOG_READ=1`, `DB_ENABLE_POSTGRES_PRODUCT_WRITES=1` et `DB_ENABLE_POSTGRES_STOCK_WRITES=1`.

## HTTP Checks

- POST /api/auth/login: ok (owner audit session created)
- POST /api/products: ok (id=66aa9fee-43dd-4365-8509-dd4462ab5458)
- POST /api/movements: ok (id=68787c63-76e9-4f96-bbb2-9574232c4b22)
- GET /api/movements after add: ok (id=68787c63-76e9-4f96-bbb2-9574232c4b22)

## Parity Checks

- movements parity: ok (id=68787c63-76e9-4f96-bbb2-9574232c4b22)
- stock unchanged parity: ok (rows=2)
- product_variants unchanged parity: ok (rows=2)
- product semantic parity: ok (priceTtc=12.5)

## Side Effects

- stock untouched: ok (rows=2)
- product_variants untouched: ok (rows=2)
- products.last_updated untouched: ok (unchanged)
- movements inserted: ok (id=68787c63-76e9-4f96-bbb2-9574232c4b22)

## SQLite Isolation Checks

- products unchanged in SQLite: ok (reference=PG-MOVE-MN4BI0PS)
- metadata unchanged in SQLite: ok (values=4)

## Remaining Risks

- `stock:applyMovement` reste sur SQLite; la mutation combinee stock + historique n est donc pas encore coherente sur PostgreSQL.
- Le domaine catalogue/stock ne doit toujours pas etre active en PostgreSQL en usage normal tant que `stock:applyMovement` n est pas valide.

