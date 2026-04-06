# PostgreSQL Tranche 3 Catalog Read Validation

- Status: `completed`
- Started at: `2026-03-23T11:07:18.186Z`
- Finished at: `2026-03-23T11:07:24.820Z`
- SQLite path kept: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- DB driver forced for audit: `postgres`
- Active PostgreSQL scopes: `clients, employees, salary, auth-security, products-read, stock-read`
- Base URL: `http://127.0.0.1:58012`

## Validated

- La lecture catalogue `products` est compatible PostgreSQL et restitue le meme resultat que SQLite pour la liste active, les archives et les metadonnees.
- La lecture `stock` est compatible PostgreSQL en mode read-only pour les lignes brutes et la vue enrichie `/api/stock/items`.
- La lecture `inventory` est compatible PostgreSQL en mode read-only avec la meme valorisation et les memes quantites que SQLite.
- Les routes REST et les handlers IPC restent inchanges cote contrat, avec un routage PostgreSQL uniquement sur les lectures tranche 3.

## HTTP Checks

- POST /api/auth/login: ok (token=04da4f94...)
- GET /api/products: ok (count=61)
- GET /api/products/archived: ok (count=3)
- GET /api/products/metadata: ok (categories=6, series=8, colors=4)
- GET /api/stock: ok (count=178)
- GET /api/stock/items: ok (count=61)
- GET /api/inventory: ok (items=61)

## Parity Checks

- products list parity: ok (count=61)
- products archived parity: ok (count=3)
- products metadata parity: ok
- stock rows parity: ok (count=178)
- stock items parity: ok (count=61)
- inventory parity: ok (totalValue=3505)

## PostgreSQL Counts

- active products count: ok (count=61)
- archived products count: ok (count=3)
- stock rows count: ok (count=178)

## Runtime Paths

- products read: products.service/products.handlers -> catalog-read.runtime.repository -> postgres/catalog-read.repository when scope products-read is active
- stock read: stock.service/stock.handlers -> catalog-read.runtime.repository -> postgres/catalog-read.repository when scope stock-read is active
- inventory read: inventory.service/inventory.handlers -> catalog-read.runtime.repository -> postgres/catalog-read.repository when scope stock-read is active

## Remaining Risks

- Les ecritures `products`, `stock` et `movements` restent volontairement sur SQLite; la tranche 3 ne couvre pas ces mutations.
- Le backend reste hybride: `products-read` et `stock-read` peuvent lire PostgreSQL, tandis que les mutations catalogue/stock et les documents metier restent sur SQLite.
- Les domaines `quotes` et `invoices` ne sont pas touches par cette tranche et restent entierement sur SQLite.
- Cette validation prouve la parite de lecture, mais pas encore les scenarios de concurrence ou de double-ecriture entre SQLite et PostgreSQL.

## Not In Scope

- products create/update/archive/restore/purge
- stock setQty/increment/decrement/applyMovement
- movements writes
- quotes
- invoices

