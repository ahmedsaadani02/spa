# PostgreSQL Stock Increment Decrement Validation

- Status: `completed`
- Started at: `2026-03-23T16:00:35.594Z`
- Finished at: `2026-03-23T16:00:52.296Z`
- SQLite path kept: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- DB driver forced for audit: `postgres`
- Catalog read opt-in: `true`
- Product write opt-in: `true`
- Stock write opt-in: `true`
- Active PostgreSQL scopes: `clients, employees, salary, auth-security, products-read, stock-read, movements-read, price-history-read, products-metadata-write, products-core-write, products-structure-write, products-price-write, products-purge-write, stock-set-qty-write, stock-delta-write`
- Base URL: `http://127.0.0.1:61775`

## Write Cartography

- `stock:increment` calcule le nouveau `stock.qty` a partir de la valeur courante puis applique un upsert sur `stock`.
- `stock:decrement` reutilise la meme logique avec un delta negatif, clamp a `0`, puis synchronise `product_variants.stock`.
- Cette sous-etape met a jour `products.last_updated` et laisse `movements` strictement inchange.

## Validated

- `stock:increment` et `stock:decrement` sont compatibles PostgreSQL pour le recalcul de `stock.qty`, la synchronisation de `product_variants.stock` et la mise a jour de `products.last_updated`, avec parite validee contre une execution de reference SQLite.
- `stock:decrement` preserve bien le clamp a `0`, conformement au comportement SQLite actuel.
- Cette sous-etape ne cree aucune entree `movements`; elle reste audit-only et exige `DB_DRIVER=postgres`, `DB_ENABLE_POSTGRES_CATALOG_READ=1`, `DB_ENABLE_POSTGRES_PRODUCT_WRITES=1` et `DB_ENABLE_POSTGRES_STOCK_WRITES=1`.

## HTTP Checks

- POST /api/auth/login: ok (owner audit session created)
- POST /api/products: ok (id=e763e013-7106-469a-a3b0-0f7509a8293b)
- PATCH /api/stock/:productId/:color/set-qty: ok (setup qty=2)
- PATCH /api/stock/:productId/:color/increment: ok (delta=3.5)
- PATCH /api/stock/:productId/:color/decrement: ok (delta=9)
- GET /api/stock after decrement: ok (rows=2)
- GET /api/stock/items after decrement: ok (reference=PG-STOCK-DELTA-MN3DH3WQ)
- GET /api/movements after increment/decrement: ok (count=0)

## Parity Checks

- stock rows parity after increment: ok (qty=5.5)
- product_variants parity after increment: ok (rows=2)
- stock rows parity after decrement: ok (qty=0)
- product_variants parity after decrement: ok (rows=2)
- product semantic parity after decrement: ok (priceTtc=12.5)

## Side Effects

- products.last_updated updated: ok (changed after increment and after decrement)
- movements untouched: ok (count=0)
- product_variants.stock synchronized: ok (color=pg-audit-stock-delta-color-a-mn3dh3wq increment=5.5 decrement=0)
- stock clamp preserved: ok (color=pg-audit-stock-delta-color-a-mn3dh3wq qty=0 after decrement)

## SQLite Isolation Checks

- products unchanged in SQLite: ok (reference=PG-STOCK-DELTA-MN3DH3WQ)
- metadata unchanged in SQLite: ok (values=4)

## Remaining Risks

- `movements:add` reste sur SQLite; l historique de mouvements n est donc pas encore migre.
- `stock:applyMovement` reste sur SQLite; la mutation combinee stock + historique n est pas encore coherente sur PostgreSQL.
- Le domaine catalogue/stock ne doit toujours pas etre active en PostgreSQL en usage normal tant que ces deux sous-etapes ne sont pas validees.

