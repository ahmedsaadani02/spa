# PostgreSQL Quotes Read Validation

- Status: `completed`
- Started at: `2026-03-24T13:27:32.155Z`
- Finished at: `2026-03-24T13:27:37.021Z`
- SQLite source kept: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- SQLite audit copy used by local runtime: `C:\Users\Ahmed Saadani\Desktop\spa-test\database\tmp\quotes-read-audit.2026-03-24T13-27-31-888Z.sqlite`
- DB driver forced for audit: `postgres`
- Active PostgreSQL scopes: `clients, employees, salary, auth-security, quotes-read`
- Base URL: `http://127.0.0.1:62935`

## Validated

- La lecture `quotes:list` et `quotes:getById` est compatible PostgreSQL et restitue la meme forme metier que SQLite sur les devis actuels.
- Le chemin PostgreSQL ne reutilise pas `backfillDocumentClientLinks()` et ne provoque aucune ecriture sur `quotes`, `invoices` ou `clients` pendant la lecture.
- Le scope `quotes-read` reste audit-only et desactive par defaut tant que les ecritures `quotes` et le cycle `quotes -> invoices` ne sont pas migres.

## HTTP Checks

- POST /api/auth/login: ok (token=89bcb67c...)
- GET /api/quotes: ok (count=4)
- GET /api/quotes/:id: ok (count=4)

## Parity Checks

- quotes list parity: ok (count=4)
- quotes getById parity: ok (count=4)

## Write-On-Read Checks

- quotes table unchanged during reads: ok (count=4)
- invoices table unchanged during reads: ok (count=6)
- clients table unchanged during reads: ok (count=8)

## Remaining Risks

- Les ecritures `quotes:put` et `quotes:delete` restent sur SQLite.
- `quotes:convertToInvoice` reste sur SQLite et depend encore du domaine `invoices`.
- Le domaine `invoices` reste entierement sur SQLite a ce stade; `DB_ENABLE_POSTGRES_QUOTES_READ=0` doit rester la valeur par defaut hors audit.

