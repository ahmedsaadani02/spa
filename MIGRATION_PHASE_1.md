# Migration Phase 1

## But

Cartographier l'etat actuel avant de remplacer Electron et le bridge IPC par une API REST, sans casser l'application web deja stable.

## Topologie actuelle

### Frontend

- Angular consomme une abstraction commune `SpaApi`.
- `src/app/bridge/spa-bridge.ts` choisit entre le bridge Electron (`window.spa`) et l'implementation web.
- `src/app/bridge/web-spa-api.ts` transforme les appels frontend en requetes HTTP vers `/api/ipc/invoke`.
- `src/app/services/ipc.service.ts` centralise la quasi-totalite des appels metier frontend.
- `src/app/services/electron.service.ts` reste utilise pour impression et export PDF.

### Backend web actuel

- `server/server.js` expose aujourd'hui:
  - `GET /api/ping`
  - `POST /api/ipc/invoke`
  - `POST /api/uploads/product-image`
- Le serveur Express web ne contient pas encore de services metier propres.
- Il reconstruit un faux `ipcMain` puis rebranche les handlers de `electron/main-process/ipc/*`.

### Coeur metier actuel

- La logique metier utile est encore majoritairement dans `electron/main-process`.
- La persistance actuelle repose sur SQLite via `better-sqlite3`.
- Le backend web depend encore directement des modules Electron/main-process suivants:
  - auth/session
  - auth/service
  - db/employees
  - ipc/auth
  - ipc/clients
  - ipc/invoices
  - ipc/quotes
  - ipc/products
  - ipc/stock
  - ipc/movements
  - ipc/inventory
  - ipc/employees
  - ipc/salary
  - product-images

## Points de dependance a Electron

### Frontend

- `src/app/bridge/spa-bridge.ts`
  - detection runtime Electron
  - fallback web vers `getWebSpaApi()`
- `src/app/bridge/web-spa-api.ts`
  - garde la surface `SpaApi`
  - mappe encore tout vers `/api/ipc/invoke`
- `src/app/services/ipc.service.ts`
  - depend de `getSpaApi()`
  - expose tous les appels metier Angular
- `src/app/services/electron.service.ts`
  - toujours utilise par les ecrans devis/factures pour print et PDF
- `src/app/repositories/repository.providers.ts`
  - choisit encore les repositories IPC selon `shouldUseIpcRepositories()`

### Ecrans/services Angular encore couples au bridge

- Auth:
  - `src/app/repositories/auth.repository.ts`
  - `src/app/services/auth.service.ts`
  - `src/app/components/login/login.component.ts`
- Repositories via `IpcService`:
  - `src/app/repositories/ipc/clients-ipc.repository.ts`
  - `src/app/repositories/ipc/invoices-ipc.repository.ts`
  - `src/app/repositories/ipc/quotes-ipc.repository.ts`
  - `src/app/repositories/ipc/stock-ipc.repository.ts`
  - `src/app/repositories/employees.repository.ts`
  - `src/app/repositories/salary-advances.repository.ts`
  - `src/app/repositories/salary-bonuses.repository.ts`
  - `src/app/repositories/salary-overtimes.repository.ts`
- Services/composants hors repositories:
  - `src/app/services/salary-summary.service.ts`
  - `src/app/settings/settings.component.ts`
  - `src/app/components/invoice-list/invoice-list.component.ts`
  - `src/app/components/invoice-preview/invoice-preview.component.ts`
  - `src/app/components/quote-list/quote-list.component.ts`
  - `src/app/components/quote-preview/quote-preview.component.ts`

## Fichiers metier utiles a preserver

### Auth et permissions

- `electron/main-process/auth/service.js`
  - login
  - setup password
  - rate limiting runtime
  - hash/verify password
  - reset password
- `electron/main-process/auth/session.js`
  - user courant
  - permission checks
  - mapping vers `AppUser`
- `electron/main-process/auth/protected-accounts.js`

### Donnees et persistance SQLite

- `electron/main-process/db/index.js`
  - initialisation SQLite
  - migrations schema
  - seed
- `electron/main-process/db/clients.js`
- `electron/main-process/db/employees.js`
- `electron/main-process/db/salary.js`
- `electron/main-process/db/auth-security.js`
- `electron/main-process/db/catalogue-sync.js`
- `electron/main-process/db/json-migration.js`
- `electron/main-process/db/backup.js`

### Orchestration metier exposee par IPC

- `electron/main-process/ipc/auth.js`
- `electron/main-process/ipc/clients.js`
- `electron/main-process/ipc/invoices.js`
- `electron/main-process/ipc/quotes.js`
- `electron/main-process/ipc/products.js`
- `electron/main-process/ipc/stock.js`
- `electron/main-process/ipc/movements.js`
- `electron/main-process/ipc/inventory.js`
- `electron/main-process/ipc/employees.js`
- `electron/main-process/ipc/salary.js`

## Flux metier critiques a proteger pendant la migration

1. Authentification
   - `beginLogin`
   - `setupProtectedPassword`
   - `login`
   - `logout`
   - `getCurrentUser`
   - `hasPermission`
   - `resetPassword`
2. Clients
   - liste
   - recherche
   - CRUD
   - `findOrCreate`
3. Factures
   - liste
   - lecture detail
   - creation/modification
   - suppression
   - impression/export PDF
4. Devis
   - liste
   - lecture detail
   - creation/modification
   - suppression
   - conversion en facture
   - impression/export PDF
5. Produits et stock
   - liste active/archivee
   - metadata catalogue
   - creation/modification/archive/restauration/purge
   - mouvements
   - quantites
   - historique prix
   - upload image
6. Inventaire
   - lecture consolidee
7. Employes et salaires
   - CRUD employes
   - activation/desactivation
   - primes, avances, heures supp
   - resume salaire

## Carte de dependances

```text
Angular UI
  -> repositories/services Angular
  -> IpcService / ElectronService
  -> spa-bridge
  -> web-spa-api
  -> POST /api/ipc/invoke
  -> server/server.js faux ipc bridge
  -> electron/main-process/ipc/*
  -> electron/main-process/auth/* + db/*
  -> SQLite
```

## Ordre de migration recommande

### Etape 2 la plus sure

Creer une structure backend propre en parallele, sans remplacer encore les usages:

- `backend/src/routes`
- `backend/src/controllers`
- `backend/src/services`
- `backend/src/repositories`
- `backend/src/middleware`
- `backend/src/config`

### Premiere extraction recommandee

Commencer par `auth`, car le flux est deja bien isole et critique:

- creer des services backend auth qui appellent d'abord la logique existante
- exposer des endpoints REST en parallele de `/api/ipc/invoke`
- garder l'ancien chemin tant que le frontend n'a pas bascule

### Strategie de bascule

- etape A: ajouter un endpoint REST sans supprimer l'IPC
- etape B: faire consommer ce nouvel endpoint par un seul service Angular
- etape C: valider login et session
- etape D: etendre module par module

## Risques a eviter

- supprimer `electron/main-process` trop tot
- casser `SpaApi` avant d'avoir des services HTTP Angular equivalents
- migrer auth + clients + factures en meme temps
- changer persistence et surface API dans la meme etape
- retirer `/api/ipc/invoke` avant que tous les ecrans soient migres

## Definition de succes pour la prochaine etape

- l'application demarre toujours via `npm run web:serve`
- le login web continue de fonctionner
- les routes Angular principales chargent encore
- un premier endpoint REST explicite existe en parallele, sans regression
