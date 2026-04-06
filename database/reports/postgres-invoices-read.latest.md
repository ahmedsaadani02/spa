# PostgreSQL Invoices Read Validation

- Status: `completed`
- Started at: `2026-03-24T13:42:57.669Z`
- Finished at: `2026-03-24T13:43:03.070Z`
- SQLite source kept: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- SQLite audit copy used by local runtime: `C:\Users\Ahmed Saadani\Desktop\spa-test\database\tmp\invoices-read-audit.2026-03-24T13-42-57-336Z.sqlite`
- DB driver forced for audit: `postgres`
- Active PostgreSQL scopes: `clients, employees, salary, auth-security, invoices-read`
- Base URL: `http://127.0.0.1:50710`

## Validated

- La lecture `invoices:list` et `invoices:getById` est compatible PostgreSQL et restitue la meme forme metier que SQLite sur les factures actuelles.
- Le chemin PostgreSQL ne reutilise pas `backfillDocumentClientLinks()` et ne provoque aucune ecriture sur `invoices`, `quotes` ou `clients` pendant la lecture.
- Le scope `invoices-read` reste audit-only et desactive par defaut tant que `invoices:put`, `invoices:delete` et `quotes:convertToInvoice` ne sont pas migres.

## HTTP Checks

- POST /api/auth/login: ok (token=4d6efd43...)
- GET /api/invoices: ok (count=6)
- GET /api/invoices/:id: ok (count=6)

## Parity Checks

- invoices list parity: ok (count=6)
- invoices getById parity: ok (count=6)

## Write-On-Read Checks

- invoices table unchanged during reads: ok (count=6)
- quotes table unchanged during reads: ok (count=4)
- clients table unchanged during reads: ok (count=8)

## Remaining Risks

- `invoices:put` reste sur SQLite et depend encore du couplage `clients`.
- `invoices:delete` reste sur SQLite et reecrit encore le devis lie.
- `quotes:convertToInvoice` reste sur SQLite; `DB_ENABLE_POSTGRES_INVOICES_READ=0` doit rester la valeur par defaut hors audit.

