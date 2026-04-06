# SQLite to PostgreSQL Migration Report

- Status: `completed`
- Started at: `2026-03-23T09:35:10.956Z`
- Finished at: `2026-03-23T09:35:28.738Z`
- Mode: `execute`
- SQLite source: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- PostgreSQL target: `ep-fancy-voice-a4ucqvpf.us-east-1.aws.neon.tech / neondb`
- SSL: `enabled`

## Table Counts

| Table | SQLite source | Target before | Deleted | Inserted | Target after | Match |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| employees | 4 | 0 | 0 | 4 | 4 | yes |
| clients | 4 | 0 | 0 | 4 | 4 | yes |
| products | 69 | 0 | 0 | 69 | 69 | yes |
| product_catalog_metadata | 18 | 0 | 0 | 18 | 18 | yes |
| stock | 178 | 0 | 0 | 178 | 178 | yes |
| product_variants | 178 | 0 | 0 | 178 | 178 | yes |
| price_history | 16 | 0 | 0 | 16 | 16 | yes |
| movements | 17 | 0 | 0 | 17 | 17 | yes |
| quotes | 4 | 0 | 0 | 4 | 4 | yes |
| invoices | 6 | 0 | 0 | 6 | 6 | yes |
| salary_advances | 5 | 0 | 0 | 5 | 5 | yes |
| salary_bonuses | 1 | 0 | 0 | 1 | 1 | yes |
| salary_overtimes | 3 | 0 | 0 | 3 | 3 | yes |
| auth_challenges | 4 | 0 | 0 | 4 | 4 | yes |
| security_audit_log | 127 | 0 | 0 | 127 | 127 | yes |

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

- quotes.payload: source rows=4, source invalid=0, target rows=4, target null=0
- invoices.payload: source rows=6, source invalid=0, target rows=6, target null=0
- security_audit_log.details: source rows=127, source invalid=0, target rows=127, target null=84

