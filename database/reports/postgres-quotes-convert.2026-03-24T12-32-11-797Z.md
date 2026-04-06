# PostgreSQL Quotes Convert Validation

- Status: `completed`
- Started at: `2026-03-24T12:32:02.914Z`
- Finished at: `2026-03-24T12:32:11.796Z`
- SQLite source kept: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- SQLite audit copy used by local runtime: `C:\Users\Ahmed Saadani\Desktop\spa-test\database\tmp\quotes-convert-audit.2026-03-24T12-32-02-293Z.sqlite`
- DB driver forced for audit: `postgres`
- Active PostgreSQL scopes: `clients, employees, salary, auth-security, quotes-read, quotes-write, quotes-convert-write, invoices-read, invoices-write`
- Base URL: `http://127.0.0.1:60636`

## Validated

- `quotes:convertToInvoice` est compatible PostgreSQL sur le flux devis -> facture, avec la meme reponse metier que SQLite au premier appel puis au second appel `alreadyConverted`.
- La facture creee conserve a parite `payload`, `quote_id`, `sourceQuoteNumber`, la numerotation calculee et l etat converti du devis (`status`, `convertedInvoiceId`, `convertedAt`).
- Aucun effet inverse de type suppression/reouverture n est introduit ici; `invoices:delete` reste hors scope et aucun devis ou facture non cible n est modifie pendant l audit.

## HTTP Checks

- POST /api/auth/login: ok (token=1ef59a2f...)
- POST /api/quotes: ok (quote=quotes-convert-audit-mn4lgrqa)
- POST /api/quotes/:id/convert-to-invoice: ok (quote=quotes-convert-audit-mn4lgrqa)
- POST /api/quotes/:id/convert-to-invoice (already converted): ok (quote=quotes-convert-audit-mn4lgrqa)
- GET /api/quotes/:id: ok (quote=quotes-convert-audit-mn4lgrqa)
- GET /api/invoices/:id: ok (invoice=9089e3ec-6dda-4c6c-93e0-f10c64a687ca)

## Parity Checks

- first convert result parity: ok (quote=quotes-convert-audit-mn4lgrqa)
- alreadyConverted result parity: ok (quote=quotes-convert-audit-mn4lgrqa)
- quote state parity after conversion: ok (quote=quotes-convert-audit-mn4lgrqa)
- invoice state parity after conversion: ok (invoice=<invoice-id>)
- stored quote row parity: ok (quote=quotes-convert-audit-mn4lgrqa)
- stored invoice row parity: ok (quote_id and payload parity preserved)

## Scope Checks

- single invoice linked to quote after repeated convert: ok (count=1)
- unrelated quotes unchanged: ok (count=4)
- unrelated invoices unchanged: ok (count=6)

## Remaining Risks

- `invoices:delete` reste sur SQLite et porte toujours le couplage inverse facture -> devis.
- La validation finale du cycle devis/facture reste a faire une fois `invoices:delete` migre puis audite.
- Les flags `DB_ENABLE_POSTGRES_QUOTES_READ=0`, `DB_ENABLE_POSTGRES_QUOTES_WRITES=0`, `DB_ENABLE_POSTGRES_INVOICES_READ=0` et `DB_ENABLE_POSTGRES_INVOICES_WRITES=0` doivent rester les valeurs par defaut hors audit.

