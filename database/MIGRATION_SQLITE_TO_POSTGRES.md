# Migration SQLite -> PostgreSQL

Ce document prepare la migration de la base SQLite actuelle vers PostgreSQL, sans modifier encore le runtime backend.

Scenario cible valide pour ce projet :

- source : SQLite locale actuelle
- cible : base PostgreSQL hosted distante via `DATABASE_URL`
- runtime final : backend Render connecte a cette base PostgreSQL hosted

Le workflow ne suppose pas PostgreSQL local comme environnement principal.

## Objectif

Passer de :

- base SQLite locale pilotee par `better-sqlite3`

a :

- base PostgreSQL distante, alimentee via `DATABASE_URL`

Sans changer la logique metier ni les routes REST.

## Ce qui est confirme

L'introspection SQLite reelle a ete executee le `2026-03-19` contre :

- `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`

Artefacts generes :

- [schema/sqlite-introspection.latest.md](c:\Users\Ahmed Saadani\Desktop\spa-test\database\schema\sqlite-introspection.latest.md)
- [schema/sqlite-introspection.latest.json](c:\Users\Ahmed Saadani\Desktop\spa-test\database\schema\sqlite-introspection.latest.json)
- [schema/sqlite-data-audit.latest.md](c:\Users\Ahmed Saadani\Desktop\spa-test\database\schema\sqlite-data-audit.latest.md)
- [schema/sqlite-data-audit.latest.json](c:\Users\Ahmed Saadani\Desktop\spa-test\database\schema\sqlite-data-audit.latest.json)

Tables vues dans le code backend :

- `employees`
- `clients`
- `quotes`
- `invoices`
- `products`
- `stock`
- `product_variants`
- `product_catalog_metadata`
- `price_history`
- `movements`
- `salary_advances`
- `salary_bonuses`
- `salary_overtimes`
- `auth_challenges`
- `security_audit_log`

L'introspection confirme que ces 15 tables existent bien dans la vraie base SQLite.

Relations confirmees par le code et la vraie base SQLite :

- `stock.product_id -> products.id`
- `product_variants.product_id -> products.id`
- `price_history.product_id -> products.id`
- `movements.product_id -> products.id`
- `salary_*.employee_id -> employees.id`
- `quotes.client_id -> clients.id`
- `invoices.client_id -> clients.id`
- `auth_challenges.user_id -> employees.id`
- `security_audit_log.user_id -> employees.id`

Points confirmes supplementaires :

- `auth_challenges.user_id` est `NOT NULL` avec `ON DELETE CASCADE`
- `quotes.client_id` et `invoices.client_id` sont en `ON DELETE SET NULL`
- `salary_advances.employee_id` et `salary_bonuses.employee_id` sont en `ON DELETE CASCADE`
- `salary_overtimes` ne porte pas de foreign key SQLite vers `employees`
- `movements` contient bien `employee_id`, `employee_name`, `username`, mais pas de foreign key SQLite vers `employees`
- `products` contient bien `description`, `is_archived`, `archived_at`, `is_deleted`, `deleted_at`
- `product_catalog_metadata.created_at` et `updated_at` sont `NOT NULL`
- `product_variants.updated_at` est `NOT NULL`
- `price_history.changed_by` est `NOT NULL`

## Ce qui etait a confirmer et est maintenant tranche

- toutes les tables du draft existent bien cote SQLite
- aucune table supplementaire n'a ete trouvee hors draft
- aucune table du draft n'est absente de la vraie base

## Compatibilite des donnees reelles

L'audit des donnees SQLite reelles a ete execute le `2026-03-19`.

Resultat actuel :

- aucun doublon actif detecte sur `products.reference` en normalisation `lower(trim(reference))`
- aucun orphelin detecte sur les references auditees :
  - `quotes.client_id`
  - `invoices.client_id`
  - `invoices.quote_id`
  - `stock.product_id`
  - `product_variants.product_id`
  - `price_history.product_id`
  - `salary_advances.employee_id`
  - `salary_bonuses.employee_id`
  - `salary_overtimes.employee_id`
  - `auth_challenges.user_id`
- aucun `NULL` detecte sur les colonnes actuellement marquees `NOT NULL` dans le draft PostgreSQL
- aucun format suspect detecte sur les dates/timestamps audites
- aucun stockage non numerique detecte dans les colonnes numeriques auditees
- aucune valeur booleenne hors `0/1` detectee dans les colonnes de flags auditees
- `quotes.payload` et `invoices.payload` sont valides en JSON sur toutes les lignes presentes

Conclusion de compatibilite :

- la base SQLite actuelle est compatible avec le draft PostgreSQL pour les contraintes auditees
- aucun nettoyage de donnees bloquant n'est requis avant une premiere migration vers PostgreSQL de test
- les contraintes plus strictes restent toutefois a confirmer comme decisions metier quand SQLite ne les enforce pas physiquement aujourd'hui

## Ecarts detectes entre SQLite reel et draft PostgreSQL

Ecarts maintenant corriges dans le draft :

- `employees.created_at` et `employees.updated_at` sont `NOT NULL`
- `clients.created_at` et `clients.updated_at` sont `NOT NULL`
- `products.category`, `products.serie` et `products.unit` sont `NOT NULL`
- `auth_challenges.user_id` est `NOT NULL` avec `ON DELETE CASCADE`
- `quotes.client_id` et `invoices.client_id` utilisent `ON DELETE SET NULL`
- `salary_advances` et `salary_bonuses` utilisent `ON DELETE CASCADE`
- `salary_overtimes` n'a pas de foreign key employee en SQLite
- `movements` n'a pas de foreign key employee en SQLite
- les index SQLite reels ont ete repercutes quand ils sont clairement utiles a conserver

Ecarts volontairement gardes comme choix cible PostgreSQL :

- `quotes.payload` et `invoices.payload` restent en `JSONB` dans PostgreSQL, meme si SQLite stocke aujourd'hui du `TEXT`
- `security_audit_log.details` reste en `JSONB` dans PostgreSQL, meme si SQLite stocke aujourd'hui du `TEXT`
- les booleens PostgreSQL restent typés `BOOLEAN`, meme si SQLite stocke aujourd'hui des `INTEGER`

Ecarts encore a arbitrer avant bascule runtime :

- `invoices.quote_id` existe bien en SQLite et est indexe, mais n'a pas de foreign key physique SQLite vers `quotes`
- `products.reference` a aujourd'hui un simple index SQLite; le draft PostgreSQL garde un index unique cible plus strict sur `lower(reference)` pour mieux proteger l'unicite fonctionnelle

## Ce qui reste encore a confirmer par introspection metier

- valider si l'absence de foreign key `invoices.quote_id -> quotes.id` est intentionnelle ou seulement historique
- valider si le futur index unique PostgreSQL sur `products.reference` doit etre conserve tel quel ou assoupli pour coller strictement a SQLite
- verifier le volume et la qualite reelle des donnees avant import PostgreSQL

## Strategie recommandee

1. introspecter la vraie base SQLite
2. figer le draft PostgreSQL a partir de cette introspection
3. confirmer les arbitrages restants (`invoices.quote_id`, unicite `products.reference`)
4. creer un script de migration de donnees dedie
5. valider sur une base PostgreSQL de test
6. seulement ensuite brancher le runtime backend sur PostgreSQL

## Ordre conseille pour la migration des donnees

1. `employees`
2. `clients`
3. `products`
4. `product_catalog_metadata`
5. `stock`
6. `product_variants`
7. `price_history`
8. `movements`
9. `quotes`
10. `invoices`
11. `salary_advances`
12. `salary_bonuses`
13. `salary_overtimes`
14. `auth_challenges`
15. `security_audit_log`

## Regles de securite pour le futur script

- ne jamais ecrire dans PostgreSQL sans transaction par lot
- journaliser le nombre de lignes exportees et importees par table
- garder un mode `dry-run`
- rendre la migration relancable ou au minimum clairement destructrice/documentee
- ne pas supprimer SQLite tant que PostgreSQL n'est pas valide

## Variables d'environnement cible

Backend uniquement :

```env
DATABASE_URL=
NODE_ENV=
POSTGRES_SSL=auto
```

Le frontend Angular ne doit pas recevoir `DATABASE_URL`.

## Workflow recommande pour une base PostgreSQL hosted

1. renseigner `DATABASE_URL` avec la base PostgreSQL distante cible
2. laisser `POSTGRES_SSL=auto` ou forcer `true` si l'hebergeur l'exige
3. tester la connexion distante :
   - `npm run db:pg:test`
4. appliquer le schema preparatoire sur la base distante :
   - `npm run db:pg:schema:apply`
5. seulement ensuite preparer et executer la migration SQLite -> PostgreSQL
6. verifier les donnees migrees avant toute bascule runtime du backend

Ce workflow garde SQLite comme source tant que PostgreSQL hosted n'est pas validee.
