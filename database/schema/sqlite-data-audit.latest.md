# SQLite Data Compatibility Audit

- Generated at: `2026-03-19T17:11:35.932Z`
- SQLite path: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- Tables detected: `15`

## Summary

- Duplicate active product references: 0
- Orphan reference checks with issues: 0
- Future NOT NULL violations: 0
- Suspicious date/timestamp checks: 0
- Suspicious numeric checks: 0
- Suspicious boolean checks: 0
- Invalid JSON payload sets: 0

## Constraints Safe To Apply Immediately

- Unique active products.reference (case-insensitive): No duplicate active references were found with lower(trim(reference)).
- quotes.client_id -> clients.id: No orphan rows were found.
- invoices.client_id -> clients.id: No orphan rows were found.
- invoices.quote_id -> quotes.id: No orphan rows were found. Data is clean, but the foreign key is still a business-rule decision because SQLite does not currently enforce it physically.
- stock.product_id -> products.id: No orphan rows were found.
- product_variants.product_id -> products.id: No orphan rows were found.
- price_history.product_id -> products.id: No orphan rows were found.
- salary_advances.employee_id -> employees.id: No orphan rows were found.
- salary_bonuses.employee_id -> employees.id: No orphan rows were found.
- salary_overtimes.employee_id -> employees.id: No orphan rows were found.
- auth_challenges.user_id -> employees.id: No orphan rows were found.
- quotes.payload as JSONB: All 4 rows parsed successfully as JSON.
- invoices.payload as JSONB: All 6 rows parsed successfully as JSON.
- Current draft NOT NULL constraints: No NULL values were found in the audited columns that the current PostgreSQL draft marks as NOT NULL.
- Timestamp casting to PostgreSQL TIMESTAMPTZ: No suspicious non-null date values were found in the audited date/timestamp columns.
- Numeric casting to PostgreSQL NUMERIC/INTEGER: No non-numeric SQLite storage classes were found in the audited numeric columns.
- BOOLEAN mapping for audited flag columns: All audited boolean-like values are compatible with PostgreSQL BOOLEAN conversion.

## Constraints To Defer

- None.

## Cleanup Needed Before Migration

- No blocking data cleanup was detected in the audited checks.

## Detailed Checks

### Orphan References

- quotes.client_id -> clients.id: 0 orphan rows
- invoices.client_id -> clients.id: 0 orphan rows
- invoices.quote_id -> quotes.id: 0 orphan rows
- stock.product_id -> products.id: 0 orphan rows
- product_variants.product_id -> products.id: 0 orphan rows
- price_history.product_id -> products.id: 0 orphan rows
- salary_advances.employee_id -> employees.id: 0 orphan rows
- salary_bonuses.employee_id -> employees.id: 0 orphan rows
- salary_overtimes.employee_id -> employees.id: 0 orphan rows
- auth_challenges.user_id -> employees.id: 0 orphan rows

### JSON Payload Validation

- quotes.payload: 0 invalid rows out of 4
- invoices.payload: 0 invalid rows out of 6

