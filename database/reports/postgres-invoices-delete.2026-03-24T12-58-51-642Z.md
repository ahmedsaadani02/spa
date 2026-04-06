# PostgreSQL Invoices Delete Validation

- Status: `completed`
- Started at: `2026-03-24T12:58:33.726Z`
- Finished at: `2026-03-24T12:58:51.642Z`
- SQLite source kept: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- SQLite audit copy used by local runtime: `C:\Users\Ahmed Saadani\Desktop\spa-test\database\tmp\invoices-delete-audit.2026-03-24T12-58-33-337Z.sqlite`
- DB driver forced for audit: `postgres`
- Active PostgreSQL scopes: `clients, employees, salary, auth-security, quotes-read, quotes-write, quotes-convert-write, invoices-read, invoices-write, invoices-delete-write`
- Base URL: `http://127.0.0.1:63407`

## Validated

- `invoices:delete` est compatible PostgreSQL sur la suppression simple facture -> reouverture du devis en `draft`, avec suppression de `convertedInvoiceId` et `convertedAt` comme en SQLite.
- Quand plusieurs factures sont liees au meme devis, la suppression redirige correctement le devis vers la facture restante en conservant l etat `invoiced` et en mettant a jour `convertedInvoiceId` a parite avec SQLite.
- Aucun ecart metier n a ete observe sur `invoices`, le devis lie ou les documents non cibles; la suppression inverse reste localisee au seul couple facture/devis concerne.

## HTTP Checks

- POST /api/auth/login: ok (token=c90252d6...)
- POST /api/quotes: ok (scenario A + B created)
- POST /api/invoices: ok (extra invoice linked to scenario B quote)
- DELETE /api/invoices/:id: ok (scenario A single linked invoice deleted)
- DELETE /api/invoices/:id (replacement remains): ok (scenario B converted invoice deleted, replacement kept)

## Parity Checks

- scenario A delete result parity: ok (quote=invoices-delete-quote-a-mn4mev7i)
- scenario A quote reopened to draft parity: ok (quote=invoices-delete-quote-a-mn4mev7i)
- scenario B delete result parity: ok (quote=invoices-delete-quote-b-mn4mev7i)
- scenario B quote redirected to replacement invoice parity: ok (quote=invoices-delete-quote-b-mn4mev7i)

## Scope Checks

- scenario A linked invoice removed: ok (count=0 after delete)
- scenario B remaining invoice preserved: ok (invoice=invoices-delete-extra-mn4mev7i)
- unrelated quotes unchanged: ok (count=4)
- unrelated invoices unchanged: ok (count=6)

## Remaining Risks

- Le dernier point restant est un audit global final du cycle complet `quote -> convertToInvoice -> delete invoice -> state quote` une fois cette tranche confirmee.
- Les flags `DB_ENABLE_POSTGRES_QUOTES_READ=0`, `DB_ENABLE_POSTGRES_QUOTES_WRITES=0`, `DB_ENABLE_POSTGRES_INVOICES_READ=0` et `DB_ENABLE_POSTGRES_INVOICES_WRITES=0` doivent rester les valeurs par defaut hors audit.
- SQLite reste la reference de secours tant que le cycle devis/facture complet n a pas ete revalide bout en bout en environnement controle.

