# PostgreSQL Movements Read Validation

- Status: `completed`
- Started at: `2026-03-23T13:20:58.986Z`
- Finished at: `2026-03-23T13:21:02.185Z`
- SQLite path kept: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- DB driver forced for audit: `postgres`
- Active PostgreSQL scopes: `clients, employees, salary, auth-security, products-read, stock-read, movements-read`
- Base URL: `http://127.0.0.1:60532`

## Validated

- La lecture `movements:list` est compatible PostgreSQL et restitue le meme historique que SQLite.
- Le chemin REST `/api/movements` et le handler IPC conservent le meme contrat, avec un routage PostgreSQL lecture seule seulement sous opt-in audit.

## HTTP Checks

- POST /api/auth/login: ok (token=f1347d21...)
- GET /api/movements: ok (count=17)

## Parity Checks

- movements list parity: ok (count=17)
- movements count parity: ok (count=17)

## Remaining Risks

- Les ecritures `movements:add` et `stock:applyMovement` restent sur SQLite; `movements:list` PostgreSQL doit donc rester desactive en usage normal tant que ces mutations ne sont pas migrees.
- Le domaine catalogue/stock doit continuer a utiliser `DB_ENABLE_POSTGRES_CATALOG_READ=0` par defaut pour eviter une divergence visible.

