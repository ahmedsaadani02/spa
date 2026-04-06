# PostgreSQL Stock ApplyMovement Validation

- Status: `completed`
- Started at: `2026-03-24T08:22:18.652Z`
- Finished at: `2026-03-24T08:22:31.197Z`
- SQLite path kept: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- DB driver forced for audit: `postgres`
- Catalog read opt-in: `true`
- Product write opt-in: `true`
- Stock write opt-in: `true`
- Active PostgreSQL scopes: `clients, employees, salary, auth-security, products-read, stock-read, movements-read, price-history-read, products-metadata-write, products-core-write, products-structure-write, products-price-write, products-purge-write, stock-set-qty-write, stock-delta-write, movements-write, stock-apply-movement-write`
- Base URL: `http://127.0.0.1:54910`

## Write Cartography

- `stock:applyMovement` calcule `before` depuis le stock courant, derive `after` apres application du delta signe et clamp a `0` si necessaire.
- `stock:applyMovement` met a jour `stock.qty`, synchronise `product_variants.stock`, met a jour `products.last_updated`, puis ecrit une ligne `movements` dans le meme flux logique.
- La ligne `movements` conserve `reason`, `actor`, `employee_id`, `username` et les metadonnees produit (`reference`, `label`, `category`, `serie`) avec fallback sur le produit si elles ne sont pas fournies.

## Validated

- `stock:applyMovement` est compatible PostgreSQL pour la mutation combinee stock + historique, avec parite validee contre une execution de reference SQLite.
- Les effets sur `stock`, `product_variants`, `products.last_updated`, `movements`, `before`, `after` et `delta applique` sont conformes a SQLite pour un mouvement positif puis un mouvement negatif avec clamp a `0`.
- La `reason`, l `actor`, `employee_id`, `username` et les metadonnees produit (`reference`, `label`, `category`, `serie`) sont preserves comme en SQLite.
- Cette sous-etape reste audit-only et exige `DB_DRIVER=postgres`, `DB_ENABLE_POSTGRES_CATALOG_READ=1`, `DB_ENABLE_POSTGRES_PRODUCT_WRITES=1` et `DB_ENABLE_POSTGRES_STOCK_WRITES=1`.

## HTTP Checks

- POST /api/auth/login: ok (owner audit session created)
- POST /api/products: ok (id=147a36e9-3d41-47d4-9738-6d2507d7e140)
- PATCH /api/stock/:productId/:color/set-qty: ok (setup qty=2)
- POST /api/stock/movements positive: ok (id=a3a65027-4435-478b-952f-c9ba6a501378)
- POST /api/stock/movements negative: ok (id=8f135ce8-19ab-4501-a4f0-095a50f66ef2)
- GET /api/stock after movement sequence: ok (rows=2)
- GET /api/stock/items after movement sequence: ok (reference=PG-APPLY-MN4CJLSP)
- GET /api/movements after movement sequence: ok (count=2)

## Parity Checks

- stock parity after positive movement: ok (qty=6)
- product_variants parity after positive movement: ok (rows=2)
- movements parity after positive movement: ok (id=a3a65027-4435-478b-952f-c9ba6a501378)
- stock parity after negative movement: ok (qty=0)
- product_variants parity after negative movement: ok (rows=2)
- movements parity after negative movement: ok (count=2)
- product semantic parity after movement sequence: ok (priceTtc=12.5)

## Side Effects

- products.last_updated updated: ok (changed after positive and negative movements)
- product_variants.stock synchronized: ok (color=pg-audit-apply-color-a-mn4cjlsp positive=6 negative=0)
- stock clamp preserved: ok (color=pg-audit-apply-color-a-mn4cjlsp qty=0 after negative movement)
- before/after and applied delta preserved: ok (positive=2->6 delta=4; negative=6->0 delta=-6)
- reason, actor and metadata preserved: ok (actor=Stock ApplyMovement Audit)

## SQLite Isolation Checks

- products unchanged in SQLite: ok (reference=PG-APPLY-MN4CJLSP)
- metadata unchanged in SQLite: ok (values=4)

## Remaining Risks

- None identified.

