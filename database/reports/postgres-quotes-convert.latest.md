# PostgreSQL Quotes Convert Validation

- Status: `completed`
- Started at: `2026-03-25T17:54:07.753Z`
- Finished at: `2026-03-25T17:54:14.738Z`
- SQLite source kept: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- SQLite audit copy used by local runtime: `C:\Users\Ahmed Saadani\Desktop\spa-test\database\tmp\quotes-convert-audit.2026-03-25T17-54-07-295Z.sqlite`
- DB driver forced for audit: `postgres`
- Active PostgreSQL scopes: `clients, employees, salary, auth-security, quotes-read, quotes-write, quotes-convert-write, invoices-read, invoices-write, invoices-delete-write, products-read, stock-read, movements-read, price-history-read, products-metadata-write, products-core-write, products-structure-write, products-price-write, products-purge-write, stock-set-qty-write, stock-delta-write, movements-write, stock-apply-movement-write`
- Base URL: `http://127.0.0.1:58593`

## Validated

- `quotes:convertToInvoice` est compatible PostgreSQL sur le flux devis -> facture, avec la meme reponse metier que SQLite au premier appel puis au second appel `alreadyConverted`.
- La facture creee conserve a parite `payload`, `quote_id`, `sourceQuoteNumber`, la numerotation calculee et l etat converti du devis (`status`, `convertedInvoiceId`, `convertedAt`).
- Aucun effet inverse de type suppression/reouverture n est introduit ici; `invoices:delete` reste hors scope et aucun devis ou facture non cible n est modifie pendant l audit.

## HTTP Checks

- POST /api/auth/login: ok (token=2d35c84d...)
- POST /api/quotes: ok (quote=quotes-convert-audit-mn6cetjd)
- POST /api/quotes/:id/convert-to-invoice: ok (quote=quotes-convert-audit-mn6cetjd)
- POST /api/quotes/:id/convert-to-invoice (already converted): ok (quote=quotes-convert-audit-mn6cetjd)
- GET /api/quotes/:id: ok (quote=quotes-convert-audit-mn6cetjd)
- GET /api/invoices/:id: ok (invoice=35b6b33c-1efb-4f5b-97dd-ace0c7f5f601)

## Parity Checks

- first convert result parity: ok (quote=quotes-convert-audit-mn6cetjd)
- alreadyConverted result parity: ok (quote=quotes-convert-audit-mn6cetjd)
- quote state parity after conversion: ok (quote=quotes-convert-audit-mn6cetjd)
- invoice state parity after conversion: ok (invoice=<invoice-id>)
- stored quote row parity: ok (quote=quotes-convert-audit-mn6cetjd)
- stored invoice row parity: ok (quote_id and payload parity preserved)

## Scope Checks

- single invoice linked to quote after repeated convert: ok (count=1)
- unrelated quotes unchanged: ok (count=4)
- unrelated invoices unchanged: ok (count=6)

## Remaining Risks

- `invoices:delete` reste sur SQLite et porte toujours le couplage inverse facture -> devis.
- La validation finale du cycle devis/facture reste a faire une fois `invoices:delete` migre puis audite.
- Les flags `DB_ENABLE_POSTGRES_QUOTES_READ=0`, `DB_ENABLE_POSTGRES_QUOTES_WRITES=0`, `DB_ENABLE_POSTGRES_INVOICES_READ=0` et `DB_ENABLE_POSTGRES_INVOICES_WRITES=0` doivent rester les valeurs par defaut hors audit.

