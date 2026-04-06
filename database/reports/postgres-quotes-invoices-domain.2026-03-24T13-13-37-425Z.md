# PostgreSQL Quotes Invoices Domain Validation

- Status: `completed`
- Started at: `2026-03-24T13:13:12.077Z`
- Finished at: `2026-03-24T13:13:37.425Z`
- SQLite source kept: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- SQLite audit copy used by local runtime: `C:\Users\Ahmed Saadani\Desktop\spa-test\database\tmp\quotes-invoices-domain-audit.2026-03-24T13-13-11-730Z.sqlite`
- DB driver forced for audit: `postgres`
- Active PostgreSQL scopes: `clients, employees, salary, auth-security, quotes-read, quotes-write, quotes-convert-write, invoices-read, invoices-write, invoices-delete-write`
- Activation decision: `activable-in-controlled-environment`
- Base URL: `http://127.0.0.1:62333`

## Validated

- Le domaine quotes/invoices complet est coherent sur PostgreSQL en audit: lectures `quotes`/`invoices`, mutations `quotes:put`, `quotes:delete`, `invoices:put`, `quotes:convertToInvoice` et `invoices:delete` sont valides sur une meme sequence metier.
- Les relectures finales apres mutations correspondent a la reference SQLite, y compris la suppression d un devis, la creation/mise a jour d une facture standalone, la conversion devis -> facture, la reouverture du devis en `draft` et la redirection vers une autre facture restante.
- Le domaine peut maintenant etre active sur PostgreSQL en environnement controle sans divergence metier visible, sous reserve de garder les flags a `0` par defaut dans le depot et de conserver SQLite en secours pendant l activation initiale.

## Sequence Checks

- auth login: ok (owner audit session created)
- create quote for delete scenario: ok (id=qid-delete-mn4mxoy5)
- update quote: ok (id=qid-delete-mn4mxoy5)
- create cycle quotes: ok (ids=qid-reopen-mn4mxoy5, qid-redirect-mn4mxoy5)
- create standalone invoice: ok (id=iid-standalone-mn4mxoy5)
- update standalone invoice: ok (id=iid-standalone-mn4mxoy5)
- quotes-read after setup: ok (count=3)
- invoices-read after setup: ok (count=1)
- delete quote: ok (id=qid-delete-mn4mxoy5)
- convert quote to invoice (reopen cycle): ok (quote=qid-reopen-mn4mxoy5)
- convert quote to invoice (redirect cycle): ok (quote=qid-redirect-mn4mxoy5)
- create replacement invoice for redirect cycle: ok (id=iid-redirect-extra-mn4mxoy5)
- delete invoice to reopen quote: ok (quote=qid-reopen-mn4mxoy5)
- delete invoice and redirect quote to remaining invoice: ok (quote=qid-redirect-mn4mxoy5)
- final quotes reread: ok (count=2)
- final invoices reread: ok (count=2)

## Parity Checks

- quotes list parity after setup: ok (count=3)
- invoices list parity after setup: ok (count=1)
- quote getById parity after setup: ok (id=qid-delete-mn4mxoy5)
- invoice getById parity after setup: ok (id=iid-standalone-mn4mxoy5)
- quotes list parity after quote delete: ok (count=2)
- quote delete state parity: ok (id=qid-delete-mn4mxoy5)
- quotes list parity after convert flow: ok (count=2)
- invoices list parity after convert flow: ok (count=4)
- converted invoice parity (reopen cycle): ok (quote=qid-reopen-mn4mxoy5)
- final quotes list parity: ok (count=2)
- final invoices list parity: ok (count=2)
- final quote getById parity after invoice deletes: ok (quotes=qid-reopen-mn4mxoy5, qid-redirect-mn4mxoy5)
- final invoice getById parity after all mutations: ok (ids=iid-standalone-mn4mxoy5, iid-redirect-extra-mn4mxoy5)
- stored quotes row parity: ok (delete + reopen + redirect scenarios)
- stored invoices row parity: ok (standalone + redirect replacement invoices)
- unrelated documents unchanged: ok (quotes=4, invoices=6)

## Activation Plan

- Sur un environnement controle, definir `DB_DRIVER=postgres`, `DB_ENABLE_POSTGRES_QUOTES_READ=1`, `DB_ENABLE_POSTGRES_QUOTES_WRITES=1`, `DB_ENABLE_POSTGRES_INVOICES_READ=1` et `DB_ENABLE_POSTGRES_INVOICES_WRITES=1`.
- Conserver SQLite et `DATABASE_PATH` en place pendant la premiere activation controlee pour garder un rollback simple.
- Activer d abord sur une instance backend dediee ou un environnement de validation, puis rejouer cet audit global avant d ouvrir le trafic utilisateur normal.
- Une fois ce domaine active en environnement controle, la prochaine etape logique vers la bascule finale est un audit global transversal backend complet, puis une activation progressive de tous les domaines PostgreSQL valides.

## Remaining Risks

- Les flags `DB_ENABLE_POSTGRES_QUOTES_READ=0`, `DB_ENABLE_POSTGRES_QUOTES_WRITES=0`, `DB_ENABLE_POSTGRES_INVOICES_READ=0` et `DB_ENABLE_POSTGRES_INVOICES_WRITES=0` doivent rester les valeurs par defaut dans le depot.
- SQLite reste la reference de secours tant que l activation controlee n a pas ete revalidee sur votre environnement cible.
- La prochaine etape ne doit plus etre une migration metier `quotes/invoices`, mais une validation finale transversale avant bascule applicative plus large.

