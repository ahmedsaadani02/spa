# PostgreSQL Quotes Convert Validation

- Status: `completed`
- Started at: `2026-03-24T13:33:54.400Z`
- Finished at: `2026-03-24T13:34:01.769Z`
- SQLite source kept: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- SQLite audit copy used by local runtime: `C:\Users\Ahmed Saadani\Desktop\spa-test\database\tmp\quotes-convert-audit.2026-03-24T13-33-54-107Z.sqlite`
- DB driver forced for audit: `postgres`
- Active PostgreSQL scopes: `clients, employees, salary, auth-security, quotes-read, quotes-write, quotes-convert-write, invoices-read, invoices-write, invoices-delete-write`
- Base URL: `http://127.0.0.1:54956`

## Validated

- `quotes:convertToInvoice` est compatible PostgreSQL sur le flux devis -> facture, avec la meme reponse metier que SQLite au premier appel puis au second appel `alreadyConverted`.
- La facture creee conserve a parite `payload`, `quote_id`, `sourceQuoteNumber`, la numerotation calculee et l etat converti du devis (`status`, `convertedInvoiceId`, `convertedAt`).
- Aucun effet inverse de type suppression/reouverture n est introduit ici; `invoices:delete` reste hors scope et aucun devis ou facture non cible n est modifie pendant l audit.

## HTTP Checks

- POST /api/auth/login: ok (token=08085749...)
- POST /api/quotes: ok (quote=quotes-convert-audit-mn4nobj4)
- POST /api/quotes/:id/convert-to-invoice: ok (quote=quotes-convert-audit-mn4nobj4)
- POST /api/quotes/:id/convert-to-invoice (already converted): ok (quote=quotes-convert-audit-mn4nobj4)
- GET /api/quotes/:id: ok (quote=quotes-convert-audit-mn4nobj4)
- GET /api/invoices/:id: ok (invoice=988d005f-43f9-4a44-a83d-df007647ee6c)

## Parity Checks

- first convert result parity: ok (quote=quotes-convert-audit-mn4nobj4)
- alreadyConverted result parity: ok (quote=quotes-convert-audit-mn4nobj4)
- quote state parity after conversion: ok (quote=quotes-convert-audit-mn4nobj4)
- invoice state parity after conversion: ok (invoice=<invoice-id>)
- stored quote row parity: ok (quote=quotes-convert-audit-mn4nobj4)
- stored invoice row parity: ok (quote_id and payload parity preserved)

## Scope Checks

- single invoice linked to quote after repeated convert: ok (count=1)
- unrelated quotes unchanged: ok (count=4)
- unrelated invoices unchanged: ok (count=6)

## Remaining Risks

- `invoices:delete` reste sur SQLite et porte toujours le couplage inverse facture -> devis.
- La validation finale du cycle devis/facture reste a faire une fois `invoices:delete` migre puis audite.
- Les flags `DB_ENABLE_POSTGRES_QUOTES_READ=0`, `DB_ENABLE_POSTGRES_QUOTES_WRITES=0`, `DB_ENABLE_POSTGRES_INVOICES_READ=0` et `DB_ENABLE_POSTGRES_INVOICES_WRITES=0` doivent rester les valeurs par defaut hors audit.

