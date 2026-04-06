# Database Workspace

Ce dossier ne contient pas une base de donnees executee localement.

Il sert uniquement a stocker les artefacts de persistence du projet :

- `migrations/` : scripts SQL versionnes pour creer ou faire evoluer le schema PostgreSQL
- `schema/` : schema de reference ou snapshots SQL
- `seeds/` : jeux de donnees volontaires pour environnement local/test
- `scripts/` : scripts utilitaires, par exemple migration SQLite -> PostgreSQL ou test de connexion

Flux applicatif cible :

`Frontend Angular -> Backend Express -> PostgreSQL`

## Regles de structure

- le frontend ne parle jamais directement a PostgreSQL
- le backend consomme les variables d'environnement base de donnees
- ce dossier ne doit pas contenir de logique metier runtime de l'API
- tant que la migration PostgreSQL n'est pas branchee, le runtime SQLite actuel reste dans `backend/`

## Etat actuel

- `backend/database.js` reste la source runtime SQLite actuelle
- aucun runtime backend ne consomme encore ce dossier
- les fichiers presents ici sont preparatoires et documentaires

## Convention de travail

- tout element marque `CONFIRME` vient du code backend actuel
- tout element marque `A CONFIRMER` devra etre valide par introspection de la vraie base SQLite
- aucun schema PostgreSQL ne doit etre branche en production avant validation de la structure SQLite reelle

## Fichiers clefs ajoutes pour la transition PostgreSQL

- [schema/001_postgres_initial_draft.sql](c:\Users\Ahmed Saadani\Desktop\spa-test\database\schema\001_postgres_initial_draft.sql)
  schema PostgreSQL de travail, documente et volontairement prudent
- [MIGRATION_SQLITE_TO_POSTGRES.md](c:\Users\Ahmed Saadani\Desktop\spa-test\database\MIGRATION_SQLITE_TO_POSTGRES.md)
  plan de migration des donnees SQLite vers PostgreSQL
- [scripts/migrate-sqlite-to-postgres.js](c:\Users\Ahmed Saadani\Desktop\spa-test\database\scripts\migrate-sqlite-to-postgres.js)
  squelette du futur script de migration
