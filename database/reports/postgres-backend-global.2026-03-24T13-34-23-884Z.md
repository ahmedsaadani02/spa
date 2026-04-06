# PostgreSQL Backend Global Validation

- Status: `completed`
- Started at: `2026-03-24T13:31:40.124Z`
- Finished at: `2026-03-24T13:34:23.884Z`
- Activation decision: `activable-in-controlled-environment`
- Base URL: `http://127.0.0.1:56798`
- DB driver forced for integration sweep: `postgres`
- Active PostgreSQL scopes during integration sweep: `clients, employees, salary, auth-security, quotes-read, quotes-write, quotes-convert-write, invoices-read, invoices-write, invoices-delete-write, products-read, stock-read, movements-read, price-history-read, products-metadata-write, products-core-write, products-structure-write, products-price-write, products-purge-write, stock-set-qty-write, stock-delta-write, movements-write, stock-apply-movement-write`

## Child Audits

- Tranche 1 clients/employees/salary: ok (exit=0; report=completed)
  report: C:\Users\Ahmed Saadani\Desktop\spa-test\database\reports\postgres-tranche1-validation.latest.json
- Tranche 2 auth/session: ok (exit=0; report=completed)
  report: C:\Users\Ahmed Saadani\Desktop\spa-test\database\reports\postgres-tranche2-auth-session.latest.json
- Domaine catalogue/stock: ok (exit=0; report=completed)
  report: C:\Users\Ahmed Saadani\Desktop\spa-test\database\reports\postgres-catalog-stock-domain.latest.json
- Quotes read: ok (exit=0; report=completed)
  report: C:\Users\Ahmed Saadani\Desktop\spa-test\database\reports\postgres-quotes-read.latest.json
- Quotes write: ok (exit=0; report=completed)
  report: C:\Users\Ahmed Saadani\Desktop\spa-test\database\reports\postgres-quotes-write.latest.json
- Invoices read: ok (exit=0; report=completed)
  report: C:\Users\Ahmed Saadani\Desktop\spa-test\database\reports\postgres-invoices-read.latest.json
- Invoices write: ok (exit=0; report=completed)
  report: C:\Users\Ahmed Saadani\Desktop\spa-test\database\reports\postgres-invoices-write.latest.json
- Quotes convertToInvoice: ok (exit=0; report=completed)
  report: C:\Users\Ahmed Saadani\Desktop\spa-test\database\reports\postgres-quotes-convert.latest.json
- Invoices delete: ok (exit=0; report=completed)
  report: C:\Users\Ahmed Saadani\Desktop\spa-test\database\reports\postgres-invoices-delete.latest.json

## Integration Checks

- auth login: ok (token=d1bb2614...)
- GET /api/auth/me: ok (id=backend-global-owner-mn4norvx)
- GET /api/auth/permissions/manageInvoices: ok (result=true)
- GET /api/clients: ok (count=8)
- GET /api/employees: ok (count=5)
- GET /api/salary/summary: ok (object)
- GET /api/products: ok (count=61)
- GET /api/products/archived: ok (count=3)
- GET /api/products/metadata: ok (object)
- GET /api/stock: ok (count=178)
- GET /api/stock/items: ok (count=61)
- GET /api/inventory: ok (items=61)
- GET /api/movements: ok (count=17)
- GET /api/quotes: ok (count=4)
- GET /api/invoices: ok (count=6)

## Validated

- Les audits profonds PostgreSQL deja disponibles ont tous repasse avec succes avant la synthese globale: auth/session, clients/employees/salary, catalogue/stock, puis quotes/invoices via les sous-flux prepares.
- Sous un meme runtime `DB_DRIVER=postgres` avec tous les opt-ins domaines actives, une session autentifiee peut traverser sans erreur `auth/session`, `clients`, `employees`, `salary`, `products`, `stock`, `inventory`, `movements`, `quotes` et `invoices`.
- Les sequences metier realistes restent couvertes par les audits de domaine specialises, et la passe d integration globale confirme qu elles coexistent correctement sous le meme backend PostgreSQL de validation.

## Activation Plan

- En environnement de validation, definir `DB_DRIVER=postgres`, `DB_ENABLE_POSTGRES_CATALOG_READ=1`, `DB_ENABLE_POSTGRES_PRODUCT_WRITES=1`, `DB_ENABLE_POSTGRES_STOCK_WRITES=1`, `DB_ENABLE_POSTGRES_QUOTES_READ=1`, `DB_ENABLE_POSTGRES_QUOTES_WRITES=1`, `DB_ENABLE_POSTGRES_INVOICES_READ=1` et `DB_ENABLE_POSTGRES_INVOICES_WRITES=1`.
- Conserver SQLite et `DATABASE_PATH` pendant la premiere activation controlee pour garder un rollback simple vers le runtime historique.
- Activer d abord sur une instance backend dediee de validation, rejouer `npm run db:pg:backend-global:audit`, puis seulement ouvrir les tests applicatifs ou utilisateurs cibles.
- Surveiller en parallele les lectures/ecritures PostgreSQL, les journaux d auth/session et les flux documentaires pendant la premiere fenetre de validation avant toute bascule plus large.

## Remaining Risks

- Les valeurs par defaut du depot restent volontairement sur SQLite ou opt-in a `0`; l activation PostgreSQL doit rester une decision d environnement, pas une bascule code par defaut.
- SQLite reste le plan de retour arriere le plus simple tant que la validation controlee n a pas ete observee dans votre environnement cible.
- La session applicative reste stockee en memoire du process Node; cela reste a traiter a part si vous prevoyez plusieurs instances backend actives en meme temps.

## Cleanup Recommendations

- Ne supprimer aucun chemin SQLite ni `DATABASE_PATH` avant au moins une periode de burn-in en environnement controle avec PostgreSQL actif.
- Quand la validation controlee sera stable, le nettoyage le plus sur sera d abord documentaire: retirer les mentions de mode audit-only devenues obsoletes, puis seulement ensuite envisager la simplification des branches SQLite devenues inutiles.
- Conserver les scripts d audit globaux et de domaine meme apres activation; ils servent de filet de securite avant toute bascule finale ou refactor de nettoyage.

