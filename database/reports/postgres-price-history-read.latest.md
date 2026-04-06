# PostgreSQL Price History Read Validation

- Status: `completed`
- Started at: `2026-03-23T13:56:29.147Z`
- Finished at: `2026-03-23T13:56:33.252Z`
- SQLite path kept: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- DB driver forced for audit: `postgres`
- Active PostgreSQL scopes: `clients, employees, salary, auth-security, products-read, stock-read, movements-read, price-history-read`
- Base URL: `http://127.0.0.1:64449`

## Validated

- La lecture `products:priceHistory` est compatible PostgreSQL et restitue le meme historique de prix que SQLite pour tous les couples produit/couleur audites.
- Le chemin REST `/api/products/:id/price-history` et le handler IPC conservent le meme contrat, avec un routage PostgreSQL lecture seule seulement sous opt-in audit.

## HTTP Checks

- POST /api/auth/login: ok (token=543efeb8...)
- GET /api/products/:id/price-history: ok (pairs=4)

## Parity Checks

- price history parity: ok (pairs=4)
- price_history rows count parity: ok (count=16)

## Remaining Risks

- Les ecritures de prix produit restent sur SQLite; `products:priceHistory` PostgreSQL doit donc rester desactive en usage normal tant que les ecritures `products` ne sont pas migrees.
- Le domaine catalogue/stock doit continuer a utiliser `DB_ENABLE_POSTGRES_CATALOG_READ=0` par defaut pour eviter une divergence visible.

