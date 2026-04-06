# Invoices Domain Audit

- Generated at: `2026-03-24`
- Scope: preparation of the progressive PostgreSQL migration for `invoices`, before opening `quotes:convertToInvoice`
- SQLite kept: yes
- `DATABASE_PATH` kept: yes

## Current Data State

- Existing migrated rows in PostgreSQL:
  - `invoices`: 6 rows
  - `quotes`: 4 rows
- Current data audits already validated:
  - `invoices.client_id -> clients.id`: 0 orphan rows
  - `invoices.quote_id -> quotes.id`: 0 orphan rows
  - `invoices.payload`: 0 invalid JSON rows out of 6

References:

- `database/schema/sqlite-data-audit.latest.md`
- `database/reports/sqlite-to-postgres-migration.latest.md`
- `database/MIGRATION_SQLITE_TO_POSTGRES.md`

## Runtime Surface

### Invoices HTTP / service / handler flow

- REST routes:
  - `GET /api/invoices`
  - `GET /api/invoices/:id`
  - `POST /api/invoices`
  - `PUT /api/invoices/:id`
  - `DELETE /api/invoices/:id`
- Backend entry points:
  - `backend/src/routes/invoices.routes.js`
  - `backend/src/controllers/invoices.controller.js`
  - `backend/src/services/invoices.service.js`
  - `backend/src/legacy-ipc/invoices.handlers.js`

### Frontend paths currently depending on invoices

- `frontend/src/app/services/invoice-store.service.ts`
- `frontend/src/app/services/invoice-persistence.service.ts`
- `frontend/src/app/components/invoice-form/invoice-form.component.ts`
- `frontend/src/app/bridge/web-spa-api.ts`
- `frontend/src/app/models/invoice.ts`

## Exact Behavior Mapping

### invoices-read

- `listInvoices(db)`
  - calls `backfillDocumentClientLinks(db, 'invoices')`
  - reads `payload`, `client_id`, `quote_id`
  - reconstructs `clientId` from row `client_id` when missing in payload
  - reconstructs `quoteId` from row `quote_id` when missing in payload
- `getInvoiceById(db, id)`
  - same write-on-read helper
  - same in-memory payload enrichment

Important consequence:

- current invoice reads are not pure reads
- exactly like `quotes-read`, a PostgreSQL read tranche must avoid reusing `backfillDocumentClientLinks()` in migrated mode

### invoices-write

- `putInvoice(db, invoice)`
  - resolves or creates a client through `findOrCreateClient`
  - rewrites the payload with normalized embedded `client`
  - upserts:
    - `id`
    - `payload`
    - `updated_at`
    - `client_id`
    - `quote_id`

### invoices-delete

`deleteInvoice(db, id)` is not a simple delete:

1. it reads the invoice row
2. it derives the linked quote from:
   - row `quote_id`, or
   - payload `quoteId`
3. it deletes the invoice row
4. if a linked quote exists:
   - it looks for a replacement invoice with the same `quote_id`
   - it loads the quote row
   - it mutates the quote payload

Two possible cross-domain outcomes:

- if another invoice still points to the quote:
  - quote stays `status='invoiced'`
  - `convertedInvoiceId` is redirected to the replacement invoice
- otherwise:
  - quote goes back to `status='draft'`
  - `convertedInvoiceId` and `convertedAt` are removed

This makes `invoices:delete` a cross-domain mutation on `quotes`.

## Dependencies

### Dependencies to clients

- row column `invoices.client_id`
- payload field `invoice.clientId`
- payload object `invoice.client`
- helper `findOrCreateClient(db, input, preferredId)`
- helper `backfillDocumentClientLinks(db, 'invoices')`

### Dependencies to quotes

- row column `invoices.quote_id`
- payload field `invoice.quoteId`
- payload field `invoice.sourceQuoteNumber`
- `invoices:delete` rewrites the linked quote
- `quotes:convertToInvoice` creates an invoice row and then marks the quote as converted

## Tables And Fields Actually Involved

### Invoices

- table: `invoices`
- columns:
  - `id`
  - `payload`
  - `updated_at`
  - `client_id`
  - `quote_id`
- payload keys used by the app:
  - `id`
  - `numero`
  - `date`
  - `clientId`
  - `client`
  - `lignes`
  - `remiseType`
  - `remiseValue`
  - `remiseAvantTVA`
  - `notes`
  - `conditions`
  - `quoteId`
  - `sourceQuoteNumber`

### Quotes fields touched indirectly by invoices

- table: `quotes`
- columns indirectly touched by `invoices:delete`:
  - `payload`
  - `updated_at`
  - `client_id`
- payload keys indirectly touched:
  - `status`
  - `convertedInvoiceId`
  - `convertedAt`
  - `clientId`

## Impacted Files

### Primary backend files

- `backend/src/routes/invoices.routes.js`
- `backend/src/controllers/invoices.controller.js`
- `backend/src/services/invoices.service.js`
- `backend/src/legacy-ipc/invoices.handlers.js`
- `backend/src/config/database.js`

### Shared backend dependencies

- `backend/src/repositories/clients.repository.js`
- `backend/src/repositories/clients.runtime.repository.js`
- `backend/src/repositories/postgres/clients.repository.js`
- `backend/src/legacy-ipc/quotes.handlers.js`
- `backend/src/services/quotes.service.js`

### Frontend files impacted by parity expectations

- `frontend/src/app/services/invoice-store.service.ts`
- `frontend/src/app/services/invoice-persistence.service.ts`
- `frontend/src/app/components/invoice-form/invoice-form.component.ts`
- `frontend/src/app/bridge/web-spa-api.ts`
- `frontend/src/app/models/invoice.ts`

## Main Risks

### Risk 1: invoice reads currently write

`backfillDocumentClientLinks()` is used on invoice reads today. A naive PostgreSQL `invoices-read` migration would silently reintroduce write-on-read.

### Risk 2: invoice delete is cross-domain

`invoices:delete` rewrites `quotes`. This is the main reason not to migrate the whole invoices domain in one step.

### Risk 3: quote link is duplicated

The invoice/quote relation exists both in:

- row `quote_id`
- payload `quoteId`

The migrated PostgreSQL path must preserve the current merged response shape first.

### Risk 4: quote conversion depends on invoice numbering

`quotes:convertToInvoice` creates invoice numbers by scanning existing invoices. Before migrating that flow, invoice reads and invoice writes must preserve numbering expectations.

### Risk 5: clients coupling remains active on put

`invoices:put` can create or patch `clients` through `findOrCreateClient`. This is expected parity with SQLite, but it must remain explicit and tested.

## Recommended Migration Order

1. `invoices-read`
   - `list`
   - `getById`
   - audit-only
   - no write-on-read in PostgreSQL path
2. `invoices-write` limited to `put`
   - audit-only
   - preserve `payload`, `client_id`, `quote_id`, client normalization
3. `quotes:convertToInvoice`
   - only after `quotes-read`, `quotes-write`, `invoices-read`, and `invoices-write(put)` are ready
   - still keep `invoices:delete` out of scope
4. `invoices:delete`
   - last
   - because it mutates the linked quote state

## First Minimal Recommended Tranche

The first minimal safe tranche for `invoices` is:

- `invoices-read` only
  - `listInvoices`
  - `getInvoiceById`
  - behind a dedicated opt-in scope
  - disabled by default
  - no reuse of `backfillDocumentClientLinks()` on PostgreSQL path

Why this is the safest first move:

- it mirrors the already validated `quotes-read` strategy
- it validates JSONB invoice payload reads on real data
- it validates `client_id` and `quote_id` reconstruction without opening any write path
- it keeps `quotes` untouched during this first tranche

## How It Articulates With `quotes:convertToInvoice`

`quotes:convertToInvoice` needs three building blocks to be safe on PostgreSQL:

1. `quotes-write`
   - already prepared for quote status updates
2. `invoices-read`
   - needed to preserve invoice lookup and numbering expectations
3. `invoices-write` limited to `put`
   - needed for invoice creation/upsert without yet opening delete-side quote rewrites

That means the clean path is:

- first `invoices-read`
- then `invoices-write` limited to `put`
- then `quotes:convertToInvoice`
- only after that `invoices:delete`

This sequencing keeps the first quote->invoice cross-domain migration smaller:

- create invoice row
- update quote as converted

without yet having to solve the reverse cleanup path where invoice deletion reopens the quote.

## Explicit Recommendation

Do not start `invoices` with `delete`.

Start with `invoices-read` audit-only, then `invoices-write` limited to `put`.

Once those two sub-tranches are validated, `quotes:convertToInvoice` becomes the next safe cross-domain step, while `invoices:delete` remains intentionally deferred because it mutates `quotes`.
