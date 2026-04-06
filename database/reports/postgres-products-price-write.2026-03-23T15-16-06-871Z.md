# PostgreSQL Products Price Write Validation

- Status: `completed`
- Started at: `2026-03-23T15:15:55.509Z`
- Finished at: `2026-03-23T15:16:06.218Z`
- SQLite path kept: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- DB driver forced for audit: `postgres`
- Catalog read opt-in: `true`
- Product write opt-in: `true`
- Active PostgreSQL scopes: `clients, employees, salary, auth-security, products-read, stock-read, movements-read, price-history-read, products-metadata-write, products-core-write, products-structure-write, products-price-write`
- Base URL: `http://127.0.0.1:55849`

## Write Cartography

- `products:updatePrice` garantit une ligne `product_variants` pour la couleur cible, met a jour son prix, ajoute une entree `price_history`, puis recalcule `products.price_ttc` comme moyenne des prix de variantes non nuls.
- `products:restorePrice` repasse par la meme logique, mais accepte un prix cible a zero pour rejouer un prix historise sans bloquer la validation.
- Cette tranche ne doit pas modifier `stock.qty`, ne doit pas creer de `movements`, et ne migre toujours pas les ecritures `stock/movements` completes.

## Validated

- `products:updatePrice` est compatible PostgreSQL pour `product_variants`, `price_history` et le recalcul de `products.price_ttc`, avec parite validee contre une execution de reference SQLite.
- `products:restorePrice` est compatible PostgreSQL sur le meme chemin metier, y compris le cas `allowZero`, avec parite validee contre SQLite.
- Les routes REST et handlers IPC restent inchanges; le routage PostgreSQL de cette tranche reste audit-only et exige `DB_DRIVER=postgres`, `DB_ENABLE_POSTGRES_CATALOG_READ=1` et `DB_ENABLE_POSTGRES_PRODUCT_WRITES=1`.

## HTTP Checks

- POST /api/auth/login: ok (owner audit session created)
- POST /api/products: ok (id=f939071a-47c4-49e4-b8df-2d96f4a6884f)
- PATCH /api/products/:id/price: ok (color=pg-audit-price-color-a-mn3bvnxx newPrice=18.75)
- GET /api/products/:id/price-history after updatePrice: ok (entries=1)
- POST /api/products/:id/restore-price: ok (color=pg-audit-price-color-a-mn3bvnxx targetPrice=0)
- GET /api/products/:id/price-history after restorePrice: ok (entries=2)

## Parity Checks

- updatePrice product parity: ok (priceTtc=15.625)
- updatePrice product_variants parity: ok (rows=2)
- updatePrice stock parity: ok (rows=2)
- updatePrice price_history parity: ok (entries=1)
- restorePrice product parity: ok (priceTtc=12.5)
- restorePrice product_variants parity: ok (rows=2)
- restorePrice stock parity: ok (rows=2)
- restorePrice price_history parity: ok (entries=2)

## Minimal Side Effects

- stock qty untouched: ok (rows=2)
- movements untouched: ok (count=0)

## SQLite Isolation Checks

- products unchanged in SQLite: ok (reference=PG-PRICE-MN3BVNXX)
- metadata unchanged in SQLite: ok (values=4)

## Remaining Risks

- Les ecritures `stock` et `movements` completes restent sur SQLite; le domaine catalogue/stock ne doit donc toujours pas etre active en PostgreSQL en usage normal.
- Le comportement `ensureVariantRow` est maintenant compatible PostgreSQL, mais il n a ete audite ici que sur un produit et des couleurs deja creees dans la meme session de test.
- `products:purge` reste sur SQLite; il faudra encore aligner sa gestion de `price_history`, `stock` et `product_variants` avant une bascule complete du domaine.

