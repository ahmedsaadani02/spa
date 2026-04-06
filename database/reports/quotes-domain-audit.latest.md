# Quotes Domain Audit

- Generated at: `2026-03-24`
- Scope: preparation of the progressive PostgreSQL migration for `quotes`, with `invoices` intentionally left for a later validation step
- SQLite kept: yes
- `DATABASE_PATH` kept: yes

## Current Data State

- Existing migrated rows in PostgreSQL:
  - `quotes`: 4 rows
  - `invoices`: 6 rows
- Current data audits already validated:
  - `quotes.client_id -> clients.id`: 0 orphan rows
  - `invoices.client_id -> clients.id`: 0 orphan rows
  - `invoices.quote_id -> quotes.id`: 0 orphan rows
  - `quotes.payload`: 0 invalid JSON rows out of 4
  - `invoices.payload`: 0 invalid JSON rows out of 6

References:

- `database/schema/sqlite-data-audit.latest.md`
- `database/reports/sqlite-to-postgres-migration.latest.md`
- `database/MIGRATION_SQLITE_TO_POSTGRES.md`

## Runtime Surface

### Quotes HTTP / service / handler flow

- REST routes:
  - `GET /api/quotes`
  - `GET /api/quotes/:id`
  - `POST /api/quotes`
  - `PUT /api/quotes/:id`
  - `DELETE /api/quotes/:id`
  - `POST /api/quotes/:id/convert-to-invoice`
- Backend entry points:
  - `backend/src/routes/quotes.routes.js`
  - `backend/src/controllers/quotes.controller.js`
  - `backend/src/services/quotes.service.js`
  - `backend/src/legacy-ipc/quotes.handlers.js`

### Invoices coupling already used by quotes

- `quotes:list` and `quotes:getById` derive conversion state from `invoices.quote_id`
- `quotes:convertToInvoice` creates an invoice row and updates the quote payload/status in the same operation
- `invoices:delete` can mutate the linked quote back to `draft` or point it to a replacement invoice

This means `quotes` is not a fully isolated document domain today. It already shares state with `invoices`.

## Exact Behavior Mapping For Quotes

### Reads

Current read path is not pure read-only:

- `listQuotes(db)`
  - calls `backfillDocumentClientLinks(db, 'quotes')`
  - scans `invoices` to build quote -> invoice conversion links
  - parses `quotes.payload`
  - injects `clientId` from row `client_id` when missing in payload
  - injects `status='invoiced'` and `convertedInvoiceId` when a linked invoice exists
- `getQuoteById(db, id)`
  - calls `backfillDocumentClientLinks(db, 'quotes')`
  - reads one quote row
  - reads `invoices` to detect an existing conversion
  - patches returned payload with conversion state

### Writes

- `putQuote(db, quote)`
  - requires `quote.id`
  - resolves or creates a client through `findOrCreateClient`
  - rewrites payload JSON with normalized `client`
  - upserts `quotes(id, payload, updated_at, client_id)`
- `deleteQuote(db, id)`
  - deletes the quote row only
- `convertQuoteToInvoice(db, quoteId)`
  - reads the quote
  - checks if an invoice already exists for the quote
  - may repair `invoices.quote_id` if quote payload already stores `convertedInvoiceId`
  - generates next invoice number from `invoices.payload.numero`
  - inserts a new invoice row
  - updates quote payload to `status='invoiced'`, `convertedInvoiceId`, `convertedAt`

## Client Link And JSON Coupling

The main coupling is not the table shape. It is the helper behavior:

- `findOrCreateClient(db, input, preferredId)`
  - may read, create, or patch `clients`
- `backfillDocumentClientLinks(db, tableName)`
  - supports only `quotes` and `invoices`
  - parses payload JSON
  - resolves client links
  - updates document payload and `client_id`
  - updates `updated_at`

Important consequence:

- today, a quote read can trigger writes to `quotes` and `clients`
- simply routing current `quotes:list` to PostgreSQL would not be a harmless read migration

## Tables And Fields Actually Involved

### Quotes

- table: `quotes`
- columns:
  - `id`
  - `payload`
  - `updated_at`
  - `client_id`
- payload keys used by the app:
  - `id`
  - `numero`
  - `date`
  - `clientId`
  - `client`
  - `lignes`
  - `remiseType`
  - `remiseValue`
  - `notes`
  - `conditions`
  - `status`
  - `convertedInvoiceId`
  - `convertedAt`

### Quotes external dependencies

- `clients.id`
  - through row column `quotes.client_id`
  - through duplicated payload field `quote.clientId`
  - through duplicated embedded object `quote.client`
- `invoices.quote_id`
  - used to infer whether a quote has been converted

### Invoices fields that already affect quotes

- table: `invoices`
- columns directly relevant to `quotes` migration:
  - `id`
  - `payload`
  - `updated_at`
  - `client_id`
  - `quote_id`
- payload keys relevant to quote conversion:
  - `id`
  - `numero`
  - `quoteId`
  - `sourceQuoteNumber`
  - `clientId`
  - `client`
  - `lignes`

## Impacted Files

### Primary backend files

- `backend/src/routes/quotes.routes.js`
- `backend/src/controllers/quotes.controller.js`
- `backend/src/services/quotes.service.js`
- `backend/src/legacy-ipc/quotes.handlers.js`
- `backend/src/repositories/clients.repository.js`
- `backend/src/config/database.js`

### Quotes-adjacent backend files

- `backend/src/routes/invoices.routes.js`
- `backend/src/controllers/invoices.controller.js`
- `backend/src/services/invoices.service.js`
- `backend/src/legacy-ipc/invoices.handlers.js`
- `backend/src/repositories/clients.runtime.repository.js`
- `backend/src/repositories/postgres/clients.repository.js`

### Frontend files that depend on current behavior

- `frontend/src/app/services/quote-store.service.ts`
- `frontend/src/app/services/quote-persistence.service.ts`
- `frontend/src/app/repositories/ipc/quotes-ipc.repository.ts`
- `frontend/src/app/components/quote-form/quote-form.component.ts`
- `frontend/src/app/components/quote-list/quote-list.component.ts`
- `frontend/src/app/components/quote-preview/quote-preview.component.ts`
- `frontend/src/app/services/invoice-store.service.ts`
- `frontend/src/app/components/invoice-form/invoice-form.component.ts`
- `frontend/src/app/bridge/web-spa-api.ts`

## Main Risks

### Risk 1: read paths currently write

`backfillDocumentClientLinks()` makes the current quote and invoice reads stateful. A naive PostgreSQL read migration would silently introduce writes on read into PostgreSQL too.

### Risk 2: client normalization is shared and still SQLite-shaped

`quotes` and `invoices` both depend on `findOrCreateClient()` and `toDocumentClient()`. The SQLite helper is synchronous; the PostgreSQL helper is async. Reusing the current legacy handlers as-is would create async mismatch pressure immediately.

### Risk 3: quote conversion is a cross-domain transaction

`quotes:convertToInvoice` is not only a quote mutation. It spans:

- `quotes`
- `invoices`
- invoice numbering
- quote conversion markers

This should not be part of the first `quotes` tranche.

### Risk 4: invoice delete also mutates quote state

Even if `quotes` moves first, `invoices:delete` still rewrites the linked quote payload/status. That coupling must be accounted for before declaring `quotes` fully independent.

### Risk 5: duplicate source of truth for client link

The same client relation exists in:

- row column `client_id`
- payload field `clientId`
- payload object `client`

PostgreSQL migration must preserve current behavior first, then simplify later if desired.

## Recommended Migration Order

### Quotes first

1. Introduce a `quotes-read` runtime repository
   - `list`
   - `getById`
   - keep it audit-only first
   - remove write-on-read from the migrated PostgreSQL path
2. Validate PostgreSQL parity for `quotes` reads
   - including converted state inferred from `invoices.quote_id`
   - including payload/client normalization in returned API shape
3. Introduce a `quotes-write` runtime repository
   - `put`
   - `delete`
   - still exclude `convertToInvoice`
4. Validate quote create/update/delete against PostgreSQL
   - including `client_id`
   - including normalized embedded `client`
5. Only then open the cross-domain tranche
   - `quotes:convertToInvoice`
   - prepared together with the first `invoices` write support

### Invoices after quotes validation

6. Introduce `invoices-read`
7. Introduce `invoices-write`
8. Validate `invoices:delete` because it mutates quote state
9. Finish the quote/invoice conversion lifecycle end-to-end

## Safest First Step To Implement

The safest first implementation is:

- create a PostgreSQL `quotes-read` repository for:
  - `listQuotes`
  - `getQuoteById`
- expose it behind a dedicated scope such as `quotes-read`
- keep it disabled by default
- keep `quotes:put`, `quotes:delete`, `quotes:convertToInvoice`, and all `invoices` paths on SQLite

Why this is the safest first step:

- it avoids opening cross-table writes with `invoices`
- it lets us validate JSONB payload read/parsing on real quote data
- it lets us validate `client_id` and conversion marker rendering without yet moving quote mutations
- it keeps the runtime reversible with one opt-in scope

Important constraint for this first step:

- the PostgreSQL read path should not reuse `backfillDocumentClientLinks()` as a write-on-read side effect
- instead, it should reconstruct the HTTP payload shape in memory only

## Explicit Recommendation

Do not start with `quotes:convertToInvoice`.

Start with a minimal, audit-only `quotes-read` tranche that:

- returns the same payload shape as SQLite
- derives conversion state from `invoices.quote_id`
- does not mutate documents during reads
- leaves all quote and invoice writes on SQLite

That is the smallest coherent move toward `quotes`, and it keeps `invoices` safely deferred until `quotes` read parity is proven.
