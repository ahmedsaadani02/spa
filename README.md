# SPA Web

Application web de gestion commerciale pour SPA, avec frontend Angular dans `frontend/` et backend Express dans `backend/`.

## Structure

```text
spa-test/
|-- frontend/         # application Angular
|-- backend/          # API Express + runtime actuel
|-- database/         # migrations, schema, seeds, scripts DB
|-- package.json      # scripts racine
|-- README.md
|-- README_DEV.md
`-- UPDATE_SETUP.md
```

Le dossier `database/` stocke uniquement les artefacts de base de donnees.
La base PostgreSQL de production restera externe au repo.

## Prerequis

- Node.js `22.x`
- npm `10+`
- Windows avec variable `APPDATA` disponible

## Installation locale

```powershell
npm.cmd install
npm.cmd run web:setup
Copy-Item .env.example .env
```

Variables attendues dans `.env` :

```env
DB_DRIVER=sqlite
DB_ENABLE_POSTGRES_QUOTES_READ=0
DB_ENABLE_POSTGRES_QUOTES_WRITES=0
DB_ENABLE_POSTGRES_INVOICES_READ=0
DB_ENABLE_POSTGRES_INVOICES_WRITES=0
DB_ENABLE_POSTGRES_CATALOG_READ=0
DB_ENABLE_POSTGRES_PRODUCT_WRITES=0
DB_ENABLE_POSTGRES_STOCK_WRITES=0
DATABASE_PATH=
DATABASE_URL=
POSTGRES_SSL=auto
RESEND_API_KEY=
RESEND_FROM_EMAIL=
RESEND_FROM_NAME=SPA Facturation
```

Notes :

- `DB_DRIVER=sqlite` reste la valeur par defaut et garde le runtime actuel
- `DB_ENABLE_POSTGRES_QUOTES_READ=0` garde les lectures `quotes` sur SQLite meme si `DB_DRIVER=postgres`; l opt-in PostgreSQL de cette lecture reste reserve aux audits controles
- `DB_ENABLE_POSTGRES_QUOTES_WRITES=0` garde les ecritures `quotes` sur SQLite meme si `DB_DRIVER=postgres`; l opt-in PostgreSQL de cette ecriture reste reserve aux audits controles et exige aussi `DB_ENABLE_POSTGRES_QUOTES_READ=1`
- `DB_ENABLE_POSTGRES_INVOICES_READ=0` garde les lectures `invoices` sur SQLite meme si `DB_DRIVER=postgres`; l opt-in PostgreSQL de cette lecture reste reserve aux audits controles
- `DB_ENABLE_POSTGRES_INVOICES_WRITES=0` garde `invoices:put` sur SQLite meme si `DB_DRIVER=postgres`; l opt-in PostgreSQL de cette ecriture reste reserve aux audits controles et exige aussi `DB_ENABLE_POSTGRES_INVOICES_READ=1`
- `DB_ENABLE_POSTGRES_CATALOG_READ=0` garde `products/stock/inventory` sur SQLite meme si `DB_DRIVER=postgres`, pour eviter une divergence lecture PostgreSQL / ecriture SQLite
- `DB_ENABLE_POSTGRES_PRODUCT_WRITES=0` garde les ecritures `products` sur SQLite meme si `DB_DRIVER=postgres`; l opt-in PostgreSQL de ces mutations reste reserve aux audits controles et exige aussi `DB_ENABLE_POSTGRES_CATALOG_READ=1`
- `DB_ENABLE_POSTGRES_STOCK_WRITES=0` garde les ecritures `stock` sur SQLite meme si `DB_DRIVER=postgres`; l opt-in PostgreSQL de cette tranche reste reserve aux audits controles et exige aussi `DB_ENABLE_POSTGRES_CATALOG_READ=1`
- `DATABASE_PATH` reste la source SQLite locale actuelle et ne doit pas etre supprimee pendant la transition
- `DATABASE_URL` sera utilise pour PostgreSQL quand la bascule runtime sera faite
- `POSTGRES_SSL=auto` laisse la couche PostgreSQL preparatoire activer SSL en production et le desactiver en local
- la cible PostgreSQL prevue est une base hosted distante (Render Postgres, Neon, etc.), pas un PostgreSQL local principal
- SQLite reste le runtime actif actuel tant que la migration backend n'est pas branchee

## Lancement

Tout lancer :

```powershell
npm.cmd run web:serve
```

Services separes :

```powershell
npm.cmd run backend:start
npm.cmd run frontend:start
```

Ports par defaut :

- frontend Angular : `http://127.0.0.1:4200`
- backend Express : `http://127.0.0.1:3000`

## Verification

```powershell
npm.cmd run typecheck
npm.cmd run build
```

## Deploiement web

Build frontend :

```powershell
npm.cmd install
npm.cmd run web:setup
npm.cmd run build
```

Demarrage backend en production :

```powershell
$env:NODE_ENV="production"
npm.cmd run start --prefix backend
```

Le frontend est un build statique genere dans `dist/`. Il peut etre servi par Nginx, IIS, Apache ou tout hebergement statique, avec reverse proxy de `/api/*` vers le backend Express.

## Scripts racine utiles

- `npm run web:setup` : installe les dependances backend
- `npm run web:serve` : lance backend + frontend
- `npm run typecheck` : verifie TypeScript frontend
- `npm run build` : build Angular
- `npm run backend:start` : lance uniquement l'API Express
- `npm run frontend:start` : lance uniquement Angular
- `npm run db:pg:test` : teste la connexion PostgreSQL via `DATABASE_URL` sans changer le runtime
- `npm run db:pg:schema:apply` : applique le draft de schema PostgreSQL sur la base distante cible
- `npm run db:pg:tranche1:audit` : audite fonctionnellement la tranche 1 (`clients`, `employees`, `salary`, `auth-security`) en mode PostgreSQL et genere un rapport
- `npm run db:pg:tranche2:audit` : valide le flux `auth/session` en mode PostgreSQL (`login`, `session`, `permissions`, `reset-password`) et genere un rapport
- `npm run db:pg:tranche3:audit` : valide les lectures `products`, `stock` et `inventory` en mode PostgreSQL et genere un rapport
- `npm run db:pg:quotes-read:audit` : valide `quotes:list` et `quotes:getById` en mode PostgreSQL, avec controle explicite de l absence d ecriture pendant la lecture
- `npm run db:pg:quotes-write:audit` : valide `quotes:put` et `quotes:delete` en mode PostgreSQL, avec controle explicite de l absence de mutation sur `invoices`
- `npm run db:pg:quotes-convert:audit` : valide `quotes:convertToInvoice` en mode PostgreSQL, avec controle explicite de la parite devis -> facture, de la numerotation, de `quote_id` et de l etat converti du devis
- `npm run db:pg:invoices-read:audit` : valide `invoices:list` et `invoices:getById` en mode PostgreSQL, avec controle explicite de l absence d ecriture pendant la lecture
- `npm run db:pg:invoices-write:audit` : valide `invoices:put` en mode PostgreSQL, avec controle explicite de la parite `payload/client_id/quote_id`, de l effet annexe sur `clients` et de l absence de mutation sur `quotes`
- `npm run db:pg:invoices-delete:audit` : valide `invoices:delete` en mode PostgreSQL, avec controle explicite de la parite facture -> devis sur les cas reouverture du devis et redirection vers une autre facture restante
- `npm run db:pg:quotes-invoices-domain:audit` : valide le domaine quotes/invoices complet en mode PostgreSQL sur une sequence metier globale et genere la decision d activation controlee
- `npm run db:pg:backend-global:audit` : rejoue les audits PostgreSQL deja prepares par domaine puis lance une passe d integration transversale sous un meme runtime PostgreSQL, avant activation controlee
- `npm run db:pg:movements-read:audit` : valide `movements:list` en mode PostgreSQL et genere un rapport
- `npm run db:pg:price-history-read:audit` : valide `products:priceHistory` en mode PostgreSQL et genere un rapport
- `npm run db:pg:products-write:audit` : valide la sous-tranche sure des ecritures `products` en mode PostgreSQL et genere un rapport
- `npm run db:pg:products-create-update:audit` : valide `products:create` et `products:update` avec leurs effets minimaux sur `stock` et `product_variants` en mode PostgreSQL et genere un rapport
- `npm run db:pg:products-price-write:audit` : valide `products:updatePrice` et `products:restorePrice` avec `price_history` en mode PostgreSQL et genere un rapport
- `npm run db:pg:products-purge:audit` : valide `products:purge` en mode PostgreSQL et genere un rapport
- `npm run db:pg:stock-setqty:audit` : valide `stock:setQty` en mode PostgreSQL et genere un rapport
- `npm run db:pg:stock-delta:audit` : valide `stock:increment` et `stock:decrement` en mode PostgreSQL et genere un rapport
- `npm run db:pg:movements-write:audit` : valide `movements:add` en mode PostgreSQL et genere un rapport
- `npm run db:pg:stock-apply-movement:audit` : valide `stock:applyMovement` en mode PostgreSQL et genere un rapport
- `npm run db:pg:catalog-stock-domain:audit` : valide le domaine catalogue/stock complet en mode PostgreSQL sur une sequence metier globale et genere un rapport
- `npm run db:sqlite:introspect` : inspecte la vraie base SQLite et genere un rapport dans `database/schema/`
- `npm run db:sqlite:audit` : audite la compatibilite des donnees SQLite reelles avant migration PostgreSQL

## Bascule Progressive SQLite -> PostgreSQL

Le backend dispose maintenant d'un routage de driver explicite via :

```env
DB_DRIVER=sqlite|postgres
```

Comportement actuel :

- `DB_DRIVER=sqlite` : tout le backend continue d'utiliser SQLite comme aujourd'hui
- `DB_DRIVER=postgres` : la bascule reste progressive, pas globale
- scopes PostgreSQL deja prets : `clients`, `employees`, `salary`, `auth-security`, `products-read`, `stock-read`, `movements-read`, `price-history-read`
- scope PostgreSQL deja pret en audit pour `quotes` lecture seule : `quotes-read`
- scope PostgreSQL deja pret en audit pour `quotes` ecriture limitee : `quotes-write`
- scope PostgreSQL deja pret en audit pour le flux cross-domain `quotes:convertToInvoice` : `quotes-convert-write`
- scope PostgreSQL deja pret en audit pour `invoices` lecture seule : `invoices-read`
- scope PostgreSQL deja pret en audit pour `invoices:put` : `invoices-write`
- scope PostgreSQL deja pret en audit pour le flux cross-domain `invoices:delete` : `invoices-delete-write`
- le domaine quotes/invoices complet a maintenant passe un audit global bout en bout sur PostgreSQL: lectures `quotes/invoices`, mutations `quotes:put`, `quotes:delete`, `invoices:put`, `quotes:convertToInvoice` et `invoices:delete`
- scopes PostgreSQL deja prets en audit pour ecritures `products` : `products-metadata-write`, `products-core-write`, `products-structure-write`, `products-price-write`, `products-purge-write`
- scopes PostgreSQL deja prets en audit pour ecritures `stock/movements` : `stock-set-qty-write`, `stock-delta-write`, `movements-write`, `stock-apply-movement-write`
- auth/session employees est maintenant compatible PostgreSQL pour `login`, `session`, `permissions` et `reset-password`
- le domaine catalogue/stock complet a ete valide globalement en mode PostgreSQL sur une sequence metier realiste: lectures `products/stock/inventory/movements/priceHistory`, mutations `products`, historique prix, mutations `stock`, `movements:add` et `stock:applyMovement`
- le domaine catalogue/stock est maintenant activable sur PostgreSQL en environnement controle, mais reste desactive par defaut tant qu aucune bascule explicite n a ete decidee
- les routes REST restent inchangees
- SQLite et `DATABASE_PATH` restent obligatoirement conserves pendant cette phase

Limites volontaires a ce stade :

- le domaine catalogue/stock reste sur SQLite par defaut tant que les opt-ins PostgreSQL ne sont pas explicitement actives
- `quotes` et `invoices` restent sur SQLite en usage normal tant que leurs opt-ins PostgreSQL restent a `0`
- le domaine quotes/invoices est maintenant coherent sur PostgreSQL en audit, mais reste desactive par defaut en usage normal tant que ses opt-ins restent a `0`
- les liens internes `quotes/invoices <-> clients` restent sur SQLite
- tant que `DB_ENABLE_POSTGRES_CATALOG_READ=0`, le domaine catalogue/stock/historique/prix reste fonctionnellement coherent sur SQLite par defaut
- la session reste stockee en memoire du process Node; elle n'est pas encore externalisee
- le runtime reste hybride tant que les domaines hors scope n'ont pas leur propre couche PostgreSQL

Autrement dit : le mode `postgres` actuel valide deja un socle employees/auth/session coherent, le domaine catalogue/stock a passe un audit global bout en bout sur PostgreSQL, et le domaine quotes/invoices a maintenant passe lui aussi son audit global final. Ces domaines peuvent donc etre actives en environnement controle, tout en gardant les opt-ins a `0` par defaut tant que la decision d activation n est pas prise.

## Invoice Payload Extensions

Le payload `invoice` accepte maintenant aussi :

- `paymentStatus`: `unpaid | paid | partial`
- `paidAt`: date ISO optionnelle
- `paymentMethod`: texte optionnel
- `purchaseOrderNumber`: texte optionnel
- `customInvoiceNumber`: texte optionnel

Comportement par defaut :

- une facture sans `paymentStatus` est normalisee en `unpaid`
- `customInvoiceNumber` vide laisse l interface afficher `numero`
- `purchaseOrderNumber` vide s affiche comme `—`
- ces champs restent stockes dans le payload JSON pour limiter le risque et conserver la compatibilite SQLite/PostgreSQL

## Tester En SQLite

```powershell
$env:DB_DRIVER="sqlite"
npm.cmd run backend:start
```

Attendu :

- comportement identique au runtime actuel
- aucune dependance au `DATABASE_URL`

## Tester En PostgreSQL

Prerequis :

- `DATABASE_PATH` reste renseigne
- `DATABASE_URL` pointe vers la base PostgreSQL cible
- le schema PostgreSQL est deja applique
- les donnees SQLite ont deja ete migrees et validees
- laisser `DB_ENABLE_POSTGRES_CATALOG_READ=0`, `DB_ENABLE_POSTGRES_PRODUCT_WRITES=0` et `DB_ENABLE_POSTGRES_STOCK_WRITES=0` si vous voulez conserver le mode SQLite par defaut tant qu aucune activation controlee n est decidee
- laisser aussi `DB_ENABLE_POSTGRES_QUOTES_READ=0` tant que la validation `quotes` lecture seule n est pas explicitement demandee
- laisser aussi `DB_ENABLE_POSTGRES_QUOTES_WRITES=0` tant que la validation `quotes` ecriture n est pas explicitement demandee
- laisser aussi `DB_ENABLE_POSTGRES_INVOICES_READ=0` tant que la validation `invoices` lecture seule n est pas explicitement demandee
- laisser aussi `DB_ENABLE_POSTGRES_INVOICES_WRITES=0` tant que la validation `invoices:put` n est pas explicitement demandee
- pour une activation controlee du domaine quotes/invoices, ces quatre opt-ins peuvent maintenant etre passes a `1` en environnement dedie PostgreSQL
- pour une activation controlee conjointe catalogue/stock + quotes/invoices, conserver SQLite et `DATABASE_PATH` pendant la premiere activation pour garder un rollback simple

Lancer :

```powershell
$env:DB_DRIVER="postgres"
npm.cmd run backend:start
```

Au demarrage, le serveur journalise :

- le driver configure
- les scopes compatibles PostgreSQL
- les scopes effectivement routes vers PostgreSQL

Verification recommandee :

- tester `auth/login`, `auth/me`, `auth/permissions` et `auth/reset-password`
- tester ensuite les endpoints REST `clients`, `employees`, `salary`
- si vous restez en mode par defaut, `products`, `stock`, `inventory`, `movements:list`, `products:priceHistory` et leurs ecritures restent sur SQLite
- si vous activez le domaine catalogue/stock de facon controlee, ces chemins peuvent maintenant basculer ensemble vers PostgreSQL sans divergence metier visible, tandis que `quotes` et `invoices` restent sur SQLite
- verifier que les lectures/ecritures attendues apparaissent bien dans PostgreSQL
- garder les domaines non migres sur SQLite tant qu'ils n'ont pas leur propre couche de routage

Audit cible de la tranche 1 :

```powershell
$env:DB_DRIVER="postgres"
npm.cmd run db:pg:tranche1:audit
```

Rapports generes :

- `database/reports/postgres-tranche1-validation.latest.md`
- `database/reports/postgres-tranche1-validation.latest.json`

Audit cible de la tranche 2 auth/session :

```powershell
$env:DB_DRIVER="postgres"
npm.cmd run db:pg:tranche2:audit
```

Rapports generes :

- `database/reports/postgres-tranche2-auth-session.latest.md`
- `database/reports/postgres-tranche2-auth-session.latest.json`

Audit cible de la tranche 3 lecture catalogue/inventaire :

```powershell
$env:DB_DRIVER="postgres"
$env:DB_ENABLE_POSTGRES_CATALOG_READ="1"
npm.cmd run db:pg:tranche3:audit
```

Rapports generes :

- `database/reports/postgres-tranche3-catalog-read.latest.md`
- `database/reports/postgres-tranche3-catalog-read.latest.json`

Audit cible `quotes:list` et `quotes:getById` :

```powershell
$env:DB_DRIVER="postgres"
$env:DB_ENABLE_POSTGRES_QUOTES_READ="1"
npm.cmd run db:pg:quotes-read:audit
```

Rapports generes :

- `database/reports/postgres-quotes-read.latest.md`
- `database/reports/postgres-quotes-read.latest.json`

Audit cible `quotes:put` et `quotes:delete` :

```powershell
$env:DB_DRIVER="postgres"
$env:DB_ENABLE_POSTGRES_QUOTES_READ="1"
$env:DB_ENABLE_POSTGRES_QUOTES_WRITES="1"
npm.cmd run db:pg:quotes-write:audit
```

Rapports generes :

- `database/reports/postgres-quotes-write.latest.md`
- `database/reports/postgres-quotes-write.latest.json`

Audit cible `quotes:convertToInvoice` :

```powershell
$env:DB_DRIVER="postgres"
$env:DB_ENABLE_POSTGRES_QUOTES_READ="1"
$env:DB_ENABLE_POSTGRES_QUOTES_WRITES="1"
$env:DB_ENABLE_POSTGRES_INVOICES_READ="1"
$env:DB_ENABLE_POSTGRES_INVOICES_WRITES="1"
npm.cmd run db:pg:quotes-convert:audit
```

Rapports generes :

- `database/reports/postgres-quotes-convert.latest.md`
- `database/reports/postgres-quotes-convert.latest.json`

Audit cible `invoices:list` et `invoices:getById` :

```powershell
$env:DB_DRIVER="postgres"
$env:DB_ENABLE_POSTGRES_INVOICES_READ="1"
npm.cmd run db:pg:invoices-read:audit
```

Rapports generes :

- `database/reports/postgres-invoices-read.latest.md`
- `database/reports/postgres-invoices-read.latest.json`

Audit cible `invoices:put` :

```powershell
$env:DB_DRIVER="postgres"
$env:DB_ENABLE_POSTGRES_INVOICES_READ="1"
$env:DB_ENABLE_POSTGRES_INVOICES_WRITES="1"
npm.cmd run db:pg:invoices-write:audit
```

Rapports generes :

- `database/reports/postgres-invoices-write.latest.md`
- `database/reports/postgres-invoices-write.latest.json`

Audit cible `invoices:delete` :

```powershell
$env:DB_DRIVER="postgres"
$env:DB_ENABLE_POSTGRES_QUOTES_READ="1"
$env:DB_ENABLE_POSTGRES_QUOTES_WRITES="1"
$env:DB_ENABLE_POSTGRES_INVOICES_READ="1"
$env:DB_ENABLE_POSTGRES_INVOICES_WRITES="1"
npm.cmd run db:pg:invoices-delete:audit
```

Rapports generes :

- `database/reports/postgres-invoices-delete.latest.md`
- `database/reports/postgres-invoices-delete.latest.json`

Audit global final du domaine `quotes/invoices` :

```powershell
$env:DB_DRIVER="postgres"
$env:DB_ENABLE_POSTGRES_QUOTES_READ="1"
$env:DB_ENABLE_POSTGRES_QUOTES_WRITES="1"
$env:DB_ENABLE_POSTGRES_INVOICES_READ="1"
$env:DB_ENABLE_POSTGRES_INVOICES_WRITES="1"
npm.cmd run db:pg:quotes-invoices-domain:audit
```

Rapports generes :

- `database/reports/postgres-quotes-invoices-domain.latest.md`
- `database/reports/postgres-quotes-invoices-domain.latest.json`

Audit global transversal du backend PostgreSQL :

```powershell
$env:DB_DRIVER="postgres"
$env:DB_ENABLE_POSTGRES_CATALOG_READ="1"
$env:DB_ENABLE_POSTGRES_PRODUCT_WRITES="1"
$env:DB_ENABLE_POSTGRES_STOCK_WRITES="1"
$env:DB_ENABLE_POSTGRES_QUOTES_READ="1"
$env:DB_ENABLE_POSTGRES_QUOTES_WRITES="1"
$env:DB_ENABLE_POSTGRES_INVOICES_READ="1"
$env:DB_ENABLE_POSTGRES_INVOICES_WRITES="1"
npm.cmd run db:pg:backend-global:audit
```

Rapports generes :

- `database/reports/postgres-backend-global.latest.md`
- `database/reports/postgres-backend-global.latest.json`

Audit cible `movements:list` :

```powershell
$env:DB_DRIVER="postgres"
$env:DB_ENABLE_POSTGRES_CATALOG_READ="1"
npm.cmd run db:pg:movements-read:audit
```

Rapports generes :

- `database/reports/postgres-movements-read.latest.md`
- `database/reports/postgres-movements-read.latest.json`

Audit cible `products:priceHistory` :

```powershell
$env:DB_DRIVER="postgres"
$env:DB_ENABLE_POSTGRES_CATALOG_READ="1"
npm.cmd run db:pg:price-history-read:audit
```

Rapports generes :

- `database/reports/postgres-price-history-read.latest.md`
- `database/reports/postgres-price-history-read.latest.json`

Audit cible sous-tranche sure des ecritures `products` :

```powershell
$env:DB_DRIVER="postgres"
$env:DB_ENABLE_POSTGRES_CATALOG_READ="1"
$env:DB_ENABLE_POSTGRES_PRODUCT_WRITES="1"
npm.cmd run db:pg:products-write:audit
```

Rapports generes :

- `database/reports/postgres-products-write.latest.md`
- `database/reports/postgres-products-write.latest.json`

Audit cible `products:create` et `products:update` avec effets minimaux `stock/product_variants` :

```powershell
$env:DB_DRIVER="postgres"
$env:DB_ENABLE_POSTGRES_CATALOG_READ="1"
$env:DB_ENABLE_POSTGRES_PRODUCT_WRITES="1"
npm.cmd run db:pg:products-create-update:audit
```

Rapports generes :

- `database/reports/postgres-products-create-update.latest.md`
- `database/reports/postgres-products-create-update.latest.json`

Audit cible `products:updatePrice` et `products:restorePrice` avec `price_history` :

```powershell
$env:DB_DRIVER="postgres"
$env:DB_ENABLE_POSTGRES_CATALOG_READ="1"
$env:DB_ENABLE_POSTGRES_PRODUCT_WRITES="1"
npm.cmd run db:pg:products-price-write:audit
```

Rapports generes :

- `database/reports/postgres-products-price-write.latest.md`
- `database/reports/postgres-products-price-write.latest.json`

Audit cible `products:purge` :

```powershell
$env:DB_DRIVER="postgres"
$env:DB_ENABLE_POSTGRES_CATALOG_READ="1"
$env:DB_ENABLE_POSTGRES_PRODUCT_WRITES="1"
npm.cmd run db:pg:products-purge:audit
```

Rapports generes :

- `database/reports/postgres-products-purge.latest.md`
- `database/reports/postgres-products-purge.latest.json`

Audit cible `stock:setQty` :

```powershell
$env:DB_DRIVER="postgres"
$env:DB_ENABLE_POSTGRES_CATALOG_READ="1"
$env:DB_ENABLE_POSTGRES_PRODUCT_WRITES="1"
$env:DB_ENABLE_POSTGRES_STOCK_WRITES="1"
npm.cmd run db:pg:stock-setqty:audit
```

Rapports generes :

- `database/reports/postgres-stock-setqty.latest.md`
- `database/reports/postgres-stock-setqty.latest.json`

Audit cible `stock:increment` et `stock:decrement` :

```powershell
$env:DB_DRIVER="postgres"
$env:DB_ENABLE_POSTGRES_CATALOG_READ="1"
$env:DB_ENABLE_POSTGRES_PRODUCT_WRITES="1"
$env:DB_ENABLE_POSTGRES_STOCK_WRITES="1"
npm.cmd run db:pg:stock-delta:audit
```

Rapports generes :

- `database/reports/postgres-stock-delta.latest.md`
- `database/reports/postgres-stock-delta.latest.json`

Audit cible `movements:add` :

```powershell
$env:DB_DRIVER="postgres"
$env:DB_ENABLE_POSTGRES_CATALOG_READ="1"
$env:DB_ENABLE_POSTGRES_PRODUCT_WRITES="1"
$env:DB_ENABLE_POSTGRES_STOCK_WRITES="1"
npm.cmd run db:pg:movements-write:audit
```

Rapports generes :

- `database/reports/postgres-movements-write.latest.md`
- `database/reports/postgres-movements-write.latest.json`

Audit cible `stock:applyMovement` :

```powershell
$env:DB_DRIVER="postgres"
$env:DB_ENABLE_POSTGRES_CATALOG_READ="1"
$env:DB_ENABLE_POSTGRES_PRODUCT_WRITES="1"
$env:DB_ENABLE_POSTGRES_STOCK_WRITES="1"
npm.cmd run db:pg:stock-apply-movement:audit
```

Rapports generes :

- `database/reports/postgres-stock-apply-movement.latest.md`
- `database/reports/postgres-stock-apply-movement.latest.json`

Audit global du domaine `catalogue/stock` :

```powershell
$env:DB_DRIVER="postgres"
$env:DB_ENABLE_POSTGRES_CATALOG_READ="1"
$env:DB_ENABLE_POSTGRES_PRODUCT_WRITES="1"
$env:DB_ENABLE_POSTGRES_STOCK_WRITES="1"
npm.cmd run db:pg:catalog-stock-domain:audit
```

Rapports generes :

- `database/reports/postgres-catalog-stock-domain.latest.md`
- `database/reports/postgres-catalog-stock-domain.latest.json`

## Notes

- `README_DEV.md` contient les notes de dev et de depannage.
- `UPDATE_SETUP.md` contient le pense-bete de deploiement web.
- `database/README.md` explique la separation entre runtime backend et artefacts de base de donnees.

## Tasks

Le module `Tasks` est separe en 2 interfaces :

- `GET/POST/PUT/DELETE /api/tasks` : interface administrative.
- `GET/GET by id/PATCH /api/my-tasks` : interface employe limitee a ses propres taches.

Droits appliques :

- vue admin `Tasks` : utilisateur avec `manageTasks`
- vue employe `Mes taches` : utilisateur avec `receiveTasks` et sans `manageTasks`

Restrictions employe :

- lecture uniquement des taches assignees a `req.authUser.id`
- mise a jour limitee a `status`, `progress` et `employeeNote`
- aucune creation, suppression, reaffectation, ni acces aux taches d'un autre employe
