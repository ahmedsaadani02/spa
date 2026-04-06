# PostgreSQL Stock SetQty Validation

- Status: `completed`
- Started at: `2026-03-23T15:47:17.939Z`
- Finished at: `2026-03-23T15:47:29.348Z`
- SQLite path kept: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- DB driver forced for audit: `postgres`
- Catalog read opt-in: `true`
- Product write opt-in: `true`
- Stock write opt-in: `true`
- Active PostgreSQL scopes: `clients, employees, salary, auth-security, products-read, stock-read, movements-read, price-history-read, products-metadata-write, products-core-write, products-structure-write, products-price-write, products-purge-write, stock-set-qty-write`
- Base URL: `http://127.0.0.1:50332`

## Write Cartography

- `stock:setQty` upsert `stock.qty` pour le produit/couleur cible.
- `stock:setQty` synchronise `product_variants.stock` sans toucher au prix existant; si la variante n existe pas encore, elle prend comme fallback le prix courant du produit.
- `stock:setQty` met a jour `products.last_updated` et ne cree pas d entree `movements`.

## Validated

- `stock:setQty` est compatible PostgreSQL pour l upsert de `stock.qty`, la synchronisation de `product_variants.stock` et la mise a jour de `products.last_updated`, avec parite validee contre une execution de reference SQLite.
- `stock:setQty` ne cree pas d entree `movements`, conformement au comportement SQLite actuel.
- Les routes REST et handlers IPC restent inchanges; le routage PostgreSQL de cette sous-etape reste audit-only et exige `DB_DRIVER=postgres`, `DB_ENABLE_POSTGRES_CATALOG_READ=1`, `DB_ENABLE_POSTGRES_PRODUCT_WRITES=1` et `DB_ENABLE_POSTGRES_STOCK_WRITES=1`.

## HTTP Checks

- POST /api/auth/login: ok (owner audit session created)
- POST /api/products: ok (id=11074e81-5342-4c31-b647-af0a401dcea5)
- PATCH /api/stock/:productId/:color/set-qty: ok (qty=7.25)
- GET /api/stock after setQty: ok (rows=2)
- GET /api/stock/items after setQty: ok (reference=PG-STOCK-MN3D00FN)
- GET /api/movements after setQty: ok (count=0)

## Parity Checks

- stock rows parity: ok (rows=2)
- product_variants parity: ok (rows=2)
- product semantic parity: ok (priceTtc=12.5)

## Side Effects

- products.last_updated updated: ok (changed after setQty)
- movements untouched: ok (count=0)
- product_variants.stock synchronized: ok (color=pg-audit-stock-color-a-mn3d00fn stock=7.25)

## SQLite Isolation Checks

- products unchanged in SQLite: ok (reference=PG-STOCK-MN3D00FN)
- metadata unchanged in SQLite: ok (values=4)

## Remaining Risks

- `stock:increment` et `stock:decrement` restent sur SQLite; ils partagent une grande partie de la logique de `setQty` mais ajoutent le calcul du nouveau stock a partir de la valeur courante.
- `movements:add` et `stock:applyMovement` restent sur SQLite; le domaine catalogue/stock ne doit donc toujours pas etre active en PostgreSQL en usage normal.
- Le cas de rejet sur produit archive/supprime et le clamp des quantites negatives restent a auditer dans une sous-etape dediee si on veut couvrir tout le spectre comportemental.

