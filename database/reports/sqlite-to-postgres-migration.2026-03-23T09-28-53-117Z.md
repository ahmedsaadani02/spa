# SQLite to PostgreSQL Migration Report

- Status: `dry-run`
- Started at: `2026-03-23T09:28:40.856Z`
- Finished at: `2026-03-23T09:28:53.116Z`
- Mode: `dry-run`
- SQLite source: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- PostgreSQL target: `ep-fancy-voice-a4ucqvpf.us-east-1.aws.neon.tech / neondb`
- SSL: `enabled`

## Table Counts

| Table | SQLite source | Target before | Deleted | Inserted | Target after | Match |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| employees | 4 | 0 | - | - | - | - |
| clients | 4 | 0 | - | - | - | - |
| products | 69 | 0 | - | - | - | - |
| product_catalog_metadata | 18 | 0 | - | - | - | - |
| stock | 178 | 0 | - | - | - | - |
| product_variants | 178 | 0 | - | - | - | - |
| price_history | 16 | 0 | - | - | - | - |
| movements | 17 | 0 | - | - | - | - |
| quotes | 4 | 0 | - | - | - | - |
| invoices | 6 | 0 | - | - | - | - |
| salary_advances | 5 | 0 | - | - | - | - |
| salary_bonuses | 1 | 0 | - | - | - | - |
| salary_overtimes | 3 | 0 | - | - | - | - |
| auth_challenges | 4 | 0 | - | - | - | - |
| security_audit_log | 127 | 0 | - | - | - | - |

## Relation Checks

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
- security_audit_log.user_id -> employees.id: 0 orphan rows

## JSON Checks

- quotes.payload: source rows=4, source invalid=0, target rows=0, target null=0
- invoices.payload: source rows=6, source invalid=0, target rows=0, target null=0
- security_audit_log.details: source rows=127, source invalid=0, target rows=0, target null=0

