# PostgreSQL Products Write Validation

- Status: `completed`
- Started at: `2026-03-23T14:16:16.473Z`
- Finished at: `2026-03-23T14:16:26.823Z`
- SQLite path kept: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- DB driver forced for audit: `postgres`
- Catalog read opt-in: `true`
- Product write opt-in: `true`
- Active PostgreSQL scopes: `clients, employees, salary, auth-security, products-read, stock-read, movements-read, price-history-read, products-metadata-write, products-core-write`
- Base URL: `http://127.0.0.1:57800`

## Mutation Inventory

### Routed To PostgreSQL In This Audit

- products:addMetadata: Ecriture `product_catalog_metadata` uniquement, audit-only via `DB_ENABLE_POSTGRES_PRODUCT_WRITES=1` et `DB_ENABLE_POSTGRES_CATALOG_READ=1`.
- products:upsert: Ecriture `products` uniquement, sans `stock`, `product_variants` ni `price_history`.
- products:delete: Alias archive, route vers PostgreSQL uniquement en audit.
- products:archive: Bascule `products.is_archived` et `archived_at` sur PostgreSQL uniquement en audit.
- products:restore: Restauration `products.is_archived` sur PostgreSQL uniquement en audit.

### Still On SQLite

- products:create: Reste sur SQLite car cree aussi `stock` et `product_variants`.
- products:update: Reste sur SQLite car peut ajouter/supprimer des couleurs et toucher `stock`/`product_variants`.
- products:purge: Reste sur SQLite car supprime `stock`, `product_variants` et `price_history`.
- products:updatePrice: Reste sur SQLite car ecrit `product_variants` et `price_history`.
- products:restorePrice: Reste sur SQLite car ecrit `product_variants` et `price_history`.

## Validated

- Les mutations `products:addMetadata`, `products:upsert`, `products:archive`, `products:restore` et `products:delete` sont compatibles PostgreSQL avec routes REST et handlers inchanges.
- Le routage PostgreSQL de ces mutations reste audit-only: il exige `DB_DRIVER=postgres`, `DB_ENABLE_POSTGRES_CATALOG_READ=1` et `DB_ENABLE_POSTGRES_PRODUCT_WRITES=1`.
- Les lectures catalogue PostgreSQL permettent de verifier visuellement les effets des mutations pendant l audit sans changer le mode normal de l application.

## HTTP Checks

- POST /api/auth/login: ok (owner audit session created)
- POST /api/products/metadata: ok (value=pg-audit-category-mn39qyc9)
- POST /api/products/metadata duplicate: ok (alreadyExists=true)
- GET /api/products/metadata: ok (new category visible through PostgreSQL read path)
- POST /api/products/upsert insert: ok (id=pg-products-write-audit-mn39qyc9)
- POST /api/products/upsert update: ok (same id updated in PostgreSQL)
- GET /api/products: ok (upserted PostgreSQL product visible through audit read path)
- POST /api/products/:id/archive: ok (id=pg-products-write-audit-mn39qyc9)
- GET /api/products/archived after archive: ok (archived PostgreSQL product visible)
- POST /api/products/:id/restore: ok (id=pg-products-write-audit-mn39qyc9)
- DELETE /api/products/:id: ok (archive alias routed to PostgreSQL)

## PostgreSQL Checks

- product_catalog_metadata insert: ok (value=pg-audit-category-mn39qyc9)
- products upsert persisted: ok (reference=PG-AUDIT-MN39QYC9)
- products archive persisted: ok (id=pg-products-write-audit-mn39qyc9)
- products restore persisted: ok (id=pg-products-write-audit-mn39qyc9)
- products delete alias persisted: ok (id=pg-products-write-audit-mn39qyc9)

## SQLite Isolation Checks

- metadata unchanged in SQLite: ok (row absent)
- product absent in SQLite: ok (id=pg-products-write-audit-mn39qyc9)

## Remaining Risks

- Les mutations `products:create`, `products:update`, `products:purge`, `products:updatePrice` et `products:restorePrice` restent sur SQLite car elles sont couplees a `stock`, `product_variants` ou `price_history`.
- Le domaine catalogue/stock ne doit pas etre active en mode PostgreSQL normal tant que les ecritures `stock / movements` n ont pas ete migrees et validees.
- Un produit cree via `products:upsert` n alimente pas `stock` ni `product_variants`; ce comportement est conserve et doit rester reserve aux usages deja existants de cette mutation.

