# PostgreSQL Products Create Update Validation

- Status: `completed`
- Started at: `2026-03-23T14:56:08.841Z`
- Finished at: `2026-03-23T14:56:30.201Z`
- SQLite path kept: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- DB driver forced for audit: `postgres`
- Catalog read opt-in: `true`
- Product write opt-in: `true`
- Active PostgreSQL scopes: `clients, employees, salary, auth-security, products-read, stock-read, movements-read, price-history-read, products-metadata-write, products-core-write, products-structure-write`
- Base URL: `http://127.0.0.1:55530`

## Write Cartography

- `products:create` ecrit `products`, ajoute les metadata `category/serie/color`, puis cree les lignes `stock` a `qty=0` et `product_variants` a `stock=0` avec le `price_ttc` initial.
- `products:update` met a jour `products`, upsert les metadata `category/serie/color`, ajoute les couleurs nouvelles dans `stock` et `product_variants`, et supprime seulement les couleurs retirees quand `stock.qty` vaut encore `0`.
- Cette tranche ne doit pas creer de `movements` ni de `price_history`, et ne couvre toujours pas `updatePrice`, `restorePrice` ni les ecritures stock/movements completes.

## Validated

- `products:create` est compatible PostgreSQL pour les ecritures minimales necessaires sur `products`, `stock` et `product_variants`, avec parite validee contre une execution de reference SQLite.
- `products:update` est compatible PostgreSQL pour la mise a jour du produit, l ajout et le retrait de couleurs sans stock, et l upsert des metadata associees, avec parite validee contre SQLite.
- Les routes REST et handlers IPC restent inchanges; le routage PostgreSQL de cette tranche reste audit-only et exige `DB_DRIVER=postgres`, `DB_ENABLE_POSTGRES_CATALOG_READ=1` et `DB_ENABLE_POSTGRES_PRODUCT_WRITES=1`.

## HTTP Checks

- POST /api/auth/login: ok (owner audit session created)
- POST /api/products: ok (id=5552de4b-182f-4cb0-9d0e-63bc7da538a3)
- GET /api/products after create: ok (reference=PG-CREATE-MN3B68AW)
- GET /api/stock after create: ok (rows=2)
- GET /api/stock/items after create: ok (reference=PG-CREATE-MN3B68AW)
- PUT /api/products/:id: ok (added=pg-audit-color-c-mn3b68aw removed=pg-audit-color-a-mn3b68aw)
- GET /api/products after update: ok (reference=PG-UPDATE-MN3B68AW)
- GET /api/products/metadata after update: ok (generated metadata values visible)
- GET /api/stock after update: ok (rows=2)
- GET /api/stock/items after update: ok (reference=PG-UPDATE-MN3B68AW)

## Parity Checks

- create product parity: ok (reference=PG-CREATE-MN3B68AW)
- create stock rows parity: ok (colors=2)
- create product_variants parity: ok (colors=2)
- create metadata parity: ok (values=4)
- update product parity: ok (reference=PG-UPDATE-MN3B68AW)
- update stock rows parity: ok (rows=2)
- update product_variants parity: ok (rows=2)
- update metadata parity: ok (values=7)

## Minimal Side Effects

- price_history untouched: ok (count=0)
- movements untouched: ok (count=0)
- stock qty remains zero: ok (rows=2)

## SQLite Isolation Checks

- products unchanged in SQLite: ok (references absent)
- metadata unchanged in SQLite: ok (values=7)

## Remaining Risks

- `products:updatePrice` et `products:restorePrice` restent sur SQLite car ils ouvrent `price_history` et la gestion fine des prix par couleur.
- Les ecritures `stock` et `movements` completes restent sur SQLite; le domaine catalogue/stock ne doit donc toujours pas etre active en PostgreSQL en usage normal.
- Le comportement actuel conserve les prix existants des variantes deja presentes lors de `products:update`; seule une couleur nouvellement ajoutee prend le nouveau `priceTtc`. Cette parite SQLite est preservee mais devra etre revue avant la tranche prix.

