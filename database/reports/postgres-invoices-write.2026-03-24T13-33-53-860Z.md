# PostgreSQL Invoices Write Validation

- Status: `completed`
- Started at: `2026-03-24T13:33:48.235Z`
- Finished at: `2026-03-24T13:33:53.859Z`
- SQLite source kept: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- SQLite audit copy used by local runtime: `C:\Users\Ahmed Saadani\Desktop\spa-test\database\tmp\invoices-write-audit.2026-03-24T13-33-47-931Z.sqlite`
- DB driver forced for audit: `postgres`
- Active PostgreSQL scopes: `clients, employees, salary, auth-security, invoices-read, invoices-write`
- Base URL: `http://127.0.0.1:54952`

## Validated

- `invoices:put` est compatible PostgreSQL sur creation puis mise a jour, avec la meme forme metier que SQLite apres relecture.
- Le payload, `client_id` et `quote_id` sont stockes a parite avec SQLite, y compris l effet annexe attendu sur `clients`.
- Aucune mutation cross-domain sur `quotes` n est introduite par cette tranche; `quotes:convertToInvoice` et `invoices:delete` restent hors scope.

## HTTP Checks

- POST /api/auth/login: ok (token=5dfb5826...)
- POST /api/invoices: ok (invoice=invoices-write-audit-mn4no6ru)
- PUT /api/invoices/:id: ok (invoice=invoices-write-audit-mn4no6ru)
- GET /api/invoices/:id: ok (invoice=invoices-write-audit-mn4no6ru)
- GET /api/invoices: ok (count=7)

## Parity Checks

- invoice getById parity after create/update: ok (invoice=invoices-write-audit-mn4no6ru)
- invoices list parity after create/update: ok (count=7)
- stored invoices row parity: ok (invoice=invoices-write-audit-mn4no6ru)
- clients side effect parity: ok (client=<client-id>)

## Scope Checks

- quotes table unchanged during invoices:put: ok (count=4)
- quote_id stored without cross-domain rewrite: ok (quote=39bae71d-a031-4f44-a80d-c670d3a5636c)

## Remaining Risks

- `quotes:convertToInvoice` reste sur SQLite et ouvrira la premiere transaction devis -> facture cross-domain.
- `invoices:delete` reste sur SQLite et reecrit encore le devis lie.
- `DB_ENABLE_POSTGRES_INVOICES_READ=0` et `DB_ENABLE_POSTGRES_INVOICES_WRITES=0` doivent rester les valeurs par defaut hors audit.

