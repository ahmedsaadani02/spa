# PostgreSQL Products Purge Validation

- Status: `completed`
- Started at: `2026-03-23T15:31:17.423Z`
- Finished at: `2026-03-23T15:31:29.593Z`
- SQLite path kept: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- DB driver forced for audit: `postgres`
- Catalog read opt-in: `true`
- Product write opt-in: `true`
- Active PostgreSQL scopes: `clients, employees, salary, auth-security, products-read, stock-read, movements-read, price-history-read, products-metadata-write, products-core-write, products-structure-write, products-price-write, products-purge-write`
- Base URL: `http://127.0.0.1:57251`

## Write Cartography

- `products:purge` ne supprime pas la ligne `products`; il la marque `is_deleted=1`, conserve `is_archived=1`, renseigne `deleted_at` et conserve `archived_at`.
- `products:purge` supprime `stock`, `product_variants` et `price_history` pour le produit cible.
- `products:purge` ne supprime pas `product_catalog_metadata` et doit conserver l historique `movements` tant que la ligne `products` physique reste presente.

## Validated

- `products:purge` est compatible PostgreSQL avec la meme semantique que SQLite: suppression de `stock`, `product_variants` et `price_history`, mais conservation de la ligne `products` marquee `is_deleted=1`.
- `products:purge` conserve `product_catalog_metadata` et l historique `movements`; la ligne produit reste donc presente en base pour referencer cet historique.
- Les routes REST et handlers IPC restent inchanges; le routage PostgreSQL de cette tranche reste audit-only et exige `DB_DRIVER=postgres`, `DB_ENABLE_POSTGRES_CATALOG_READ=1` et `DB_ENABLE_POSTGRES_PRODUCT_WRITES=1`.

## HTTP Checks

- POST /api/auth/login: ok (owner audit session created)
- POST /api/products: ok (id=4e7f0b2b-e6ac-4eb9-a907-2822a4836746)
- PATCH /api/products/:id/price: ok (color=pg-audit-purge-color-a-mn3cffal)
- POST /api/products/:id/archive: ok (id=4e7f0b2b-e6ac-4eb9-a907-2822a4836746)
- DELETE /api/products/:id/purge: ok (id=4e7f0b2b-e6ac-4eb9-a907-2822a4836746)
- GET /api/products after purge: ok (purged product hidden)
- GET /api/products/archived after purge: ok (purged product hidden)
- GET /api/stock after purge: ok (stock rows removed)
- GET /api/movements after purge: ok (count=1)

## Parity Checks

- products purge parity: ok (deleted=true)
- stock purge parity: ok (count=0)
- product_variants purge parity: ok (count=0)
- price_history purge parity: ok (count=0)
- metadata preservation parity: ok (count=4)
- movements preservation parity: ok (count=1)

## Preservation Checks

- products row kept: ok (row marked deleted, not physically removed)
- product_catalog_metadata kept: ok (count=4)
- movements kept: ok (count=1)

## SQLite Isolation Checks

- products unchanged in SQLite: ok (reference=PG-PURGE-MN3CFFAL)
- metadata unchanged in SQLite: ok (values=4)

## Remaining Risks

- Les ecritures `stock` et `movements` completes restent sur SQLite; le domaine catalogue/stock ne doit donc toujours pas etre active en PostgreSQL en usage normal.
- La prochaine tranche devra aligner `stock:setQty`, `stock:increment`, `stock:decrement`, `stock:applyMovement` et `movements:add`, car ce sont elles qui pilotent vraiment les quantites et l historique metier.
- Le produit purgé reste physiquement present dans `products` avec `is_deleted=1`; cette semantique est preservee, mais elle suppose que les lectures continuent a filtrer correctement `is_deleted`.

