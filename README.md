# SPA — Société d’Aluminium | Application de facturation

Application desktop Angular + Electron pour créer, modifier, imprimer et exporter des factures pour SPA (vente et fabrication d’aluminium).

## Fonctionnalités clés
- CRUD complet des factures (stockage IndexedDB)
- Calculs automatiques HT / TVA / TTC + remise avant/après TVA
- Aperçu facture au format A4 prêt à imprimer
- Impression via `window.print()`
- Export PDF (Electron)

## Lancer l’application
1. Installer les dépendances
```
npm install
```

2. Démarrer en mode desktop (Electron)
```
npm run electron:serve
```

3. Construire l’application desktop
```
npm run electron:build
```

## Notes
- Le logo est attendu dans `src/assets/logo.png` (un placeholder est inclus). Si le fichier est remplacé ou supprimé, l’aperçu affiche “SPA”.
- Une facture d’exemple “SPA — Aluminium” est injectée au premier lancement si la base est vide.

## Structure
- `src/app/models` : modèles TypeScript
- `src/app/services` : calculs, stockage IndexedDB, numérotation
- `src/app/components` : liste, formulaire, aperçu/print
- `electron/` : main process + preload

```
spa-test
├─ .nvmrc
├─ angular.json
├─ build
│  ├─ icon.ico
│  └─ icon.png
├─ electron
│  ├─ assets
│  │  ├─ icon.ico
│  │  └─ icon.png
│  ├─ main-process
│  │  ├─ auth
│  │  │  ├─ mail-service.js
│  │  │  ├─ protected-accounts.js
│  │  │  ├─ service.js
│  │  │  └─ session.js
│  │  ├─ config
│  │  │  └─ env.js
│  │  ├─ db
│  │  │  ├─ auth-security.js
│  │  │  ├─ backup.js
│  │  │  ├─ catalogue-sync.js
│  │  │  ├─ clients.js
│  │  │  ├─ employees.js
│  │  │  ├─ index.js
│  │  │  ├─ json-migration.js
│  │  │  ├─ salary.js
│  │  │  └─ seed.js
│  │  ├─ ipc
│  │  │  ├─ auth.js
│  │  │  ├─ clients.js
│  │  │  ├─ database.js
│  │  │  ├─ employees.js
│  │  │  ├─ export.js
│  │  │  ├─ index.js
│  │  │  ├─ inventory.js
│  │  │  ├─ invoices.js
│  │  │  ├─ movements.js
│  │  │  ├─ products.js
│  │  │  ├─ quotes.js
│  │  │  ├─ salary.js
│  │  │  └─ stock.js
│  │  ├─ product-images.js
│  │  ├─ updater.js
│  │  └─ window.js
│  ├─ main.js
│  └─ preload.js
├─ out-tsc
│  └─ app
│     ├─ app
│     │  ├─ app.component.js
│     │  ├─ app.config.js
│     │  ├─ app.routes.js
│     │  ├─ bridge
│     │  │  └─ spa-bridge.js
│     │  ├─ components
│     │  │  ├─ access-denied
│     │  │  │  └─ access-denied.component.js
│     │  │  ├─ client-autocomplete
│     │  │  │  └─ client-autocomplete.component.js
│     │  │  ├─ clients
│     │  │  │  └─ clients.component.js
│     │  │  ├─ employees
│     │  │  │  ├─ employee-detail.component.js
│     │  │  │  ├─ employee-form.component.js
│     │  │  │  └─ employee-list.component.js
│     │  │  ├─ estimation
│     │  │  │  └─ estimation.component.js
│     │  │  ├─ inventaire
│     │  │  │  └─ inventaire.component.js
│     │  │  ├─ invoice-form
│     │  │  │  └─ invoice-form.component.js
│     │  │  ├─ invoice-list
│     │  │  │  └─ invoice-list.component.js
│     │  │  ├─ invoice-preview
│     │  │  │  └─ invoice-preview.component.js
│     │  │  ├─ login
│     │  │  │  └─ login.component.js
│     │  │  ├─ quote-form
│     │  │  │  └─ quote-form.component.js
│     │  │  ├─ quote-list
│     │  │  │  └─ quote-list.component.js
│     │  │  ├─ quote-preview
│     │  │  │  └─ quote-preview.component.js
│     │  │  ├─ stock
│     │  │  │  ├─ stock-i18n.js
│     │  │  │  └─ stock.component.js
│     │  │  └─ stock-history
│     │  │     └─ stock-history.component.js
│     │  ├─ guards
│     │  │  ├─ auth.guard.js
│     │  │  └─ role.guard.js
│     │  ├─ models
│     │  │  ├─ auth.models.js
│     │  │  ├─ client.js
│     │  │  ├─ employee.models.js
│     │  │  ├─ invoice-line.js
│     │  │  ├─ invoice.js
│     │  │  ├─ quote.js
│     │  │  ├─ stock-item.js
│     │  │  └─ stock-movement.js
│     │  ├─ repositories
│     │  │  ├─ auth.repository.js
│     │  │  ├─ clients.repository.js
│     │  │  ├─ employees.repository.js
│     │  │  ├─ indexeddb
│     │  │  │  ├─ clients-indexeddb.repository.js
│     │  │  │  ├─ invoices-indexeddb.repository.js
│     │  │  │  ├─ quotes-indexeddb.repository.js
│     │  │  │  └─ stock-indexeddb.repository.js
│     │  │  ├─ invoices.repository.js
│     │  │  ├─ ipc
│     │  │  │  ├─ clients-ipc.repository.js
│     │  │  │  ├─ invoices-ipc.repository.js
│     │  │  │  ├─ quotes-ipc.repository.js
│     │  │  │  └─ stock-ipc.repository.js
│     │  │  ├─ quotes.repository.js
│     │  │  ├─ repository.providers.js
│     │  │  ├─ salary-advances.repository.js
│     │  │  ├─ salary-bonuses.repository.js
│     │  │  └─ stock.repository.js
│     │  ├─ services
│     │  │  ├─ auth.service.js
│     │  │  ├─ client-persistence.service.js
│     │  │  ├─ client-storage.service.js
│     │  │  ├─ client-store.service.js
│     │  │  ├─ electron.service.js
│     │  │  ├─ invoice-calc.service.js
│     │  │  ├─ invoice-persistence.service.js
│     │  │  ├─ invoice-storage.service.js
│     │  │  ├─ invoice-store.service.js
│     │  │  ├─ ipc.service.js
│     │  │  ├─ quote-calc.service.js
│     │  │  ├─ quote-persistence.service.js
│     │  │  ├─ quote-storage.service.js
│     │  │  ├─ quote-store.service.js
│     │  │  ├─ salary-summary.service.js
│     │  │  ├─ stock-storage.service.js
│     │  │  └─ stock-store.service.js
│     │  └─ settings
│     │     └─ settings.component.js
│     └─ main.js
├─ package-lock.json
├─ package.json
├─ proxy.conf.json
├─ README.md
├─ README_DEV.md
├─ scripts
│  ├─ generate-app-icons.js
│  ├─ postinstall.js
│  ├─ rebuild-native.js
│  └─ run-electron-dev.js
├─ server
│  ├─ database.js
│  ├─ package-lock.json
│  ├─ package.json
│  └─ server.js
├─ src
│  ├─ app
│  │  ├─ app.component.css
│  │  ├─ app.component.html
│  │  ├─ app.component.ts
│  │  ├─ app.config.ts
│  │  ├─ app.routes.ts
│  │  ├─ bridge
│  │  │  ├─ spa-bridge.ts
│  │  │  └─ web-spa-api.ts
│  │  ├─ components
│  │  │  ├─ access-denied
│  │  │  │  ├─ access-denied.component.css
│  │  │  │  ├─ access-denied.component.html
│  │  │  │  └─ access-denied.component.ts
│  │  │  ├─ client-autocomplete
│  │  │  │  ├─ client-autocomplete.component.css
│  │  │  │  ├─ client-autocomplete.component.html
│  │  │  │  └─ client-autocomplete.component.ts
│  │  │  ├─ clients
│  │  │  │  ├─ clients.component.css
│  │  │  │  ├─ clients.component.html
│  │  │  │  └─ clients.component.ts
│  │  │  ├─ employees
│  │  │  │  ├─ employee-detail.component.css
│  │  │  │  ├─ employee-detail.component.html
│  │  │  │  ├─ employee-detail.component.ts
│  │  │  │  ├─ employee-form.component.css
│  │  │  │  ├─ employee-form.component.html
│  │  │  │  ├─ employee-form.component.ts
│  │  │  │  ├─ employee-list.component.css
│  │  │  │  ├─ employee-list.component.html
│  │  │  │  └─ employee-list.component.ts
│  │  │  ├─ estimation
│  │  │  │  ├─ estimation.component.css
│  │  │  │  ├─ estimation.component.html
│  │  │  │  └─ estimation.component.ts
│  │  │  ├─ inventaire
│  │  │  │  ├─ inventaire.component.css
│  │  │  │  ├─ inventaire.component.html
│  │  │  │  └─ inventaire.component.ts
│  │  │  ├─ invoice-form
│  │  │  │  ├─ invoice-form.component.css
│  │  │  │  ├─ invoice-form.component.html
│  │  │  │  └─ invoice-form.component.ts
│  │  │  ├─ invoice-list
│  │  │  │  ├─ invoice-list.component.css
│  │  │  │  ├─ invoice-list.component.html
│  │  │  │  └─ invoice-list.component.ts
│  │  │  ├─ invoice-preview
│  │  │  │  ├─ invoice-preview.component.css
│  │  │  │  ├─ invoice-preview.component.html
│  │  │  │  └─ invoice-preview.component.ts
│  │  │  ├─ login
│  │  │  │  ├─ login.component.css
│  │  │  │  ├─ login.component.html
│  │  │  │  └─ login.component.ts
│  │  │  ├─ quote-form
│  │  │  │  ├─ quote-form.component.css
│  │  │  │  ├─ quote-form.component.html
│  │  │  │  └─ quote-form.component.ts
│  │  │  ├─ quote-list
│  │  │  │  ├─ quote-list.component.css
│  │  │  │  ├─ quote-list.component.html
│  │  │  │  └─ quote-list.component.ts
│  │  │  ├─ quote-preview
│  │  │  │  ├─ quote-preview.component.css
│  │  │  │  ├─ quote-preview.component.html
│  │  │  │  └─ quote-preview.component.ts
│  │  │  ├─ stock
│  │  │  │  ├─ stock-i18n.ts
│  │  │  │  ├─ stock.component.css
│  │  │  │  ├─ stock.component.html
│  │  │  │  └─ stock.component.ts
│  │  │  ├─ stock-archives
│  │  │  │  ├─ stock-archives.component.css
│  │  │  │  ├─ stock-archives.component.html
│  │  │  │  └─ stock-archives.component.ts
│  │  │  └─ stock-history
│  │  │     ├─ stock-history.component.css
│  │  │     ├─ stock-history.component.html
│  │  │     └─ stock-history.component.ts
│  │  ├─ guards
│  │  │  ├─ auth.guard.ts
│  │  │  └─ role.guard.ts
│  │  ├─ models
│  │  │  ├─ auth.models.ts
│  │  │  ├─ client.ts
│  │  │  ├─ employee.models.ts
│  │  │  ├─ invoice-line.ts
│  │  │  ├─ invoice.ts
│  │  │  ├─ quote.ts
│  │  │  ├─ stock-item.ts
│  │  │  └─ stock-movement.ts
│  │  ├─ repositories
│  │  │  ├─ auth.repository.ts
│  │  │  ├─ clients.repository.ts
│  │  │  ├─ employees.repository.ts
│  │  │  ├─ indexeddb
│  │  │  │  ├─ clients-indexeddb.repository.ts
│  │  │  │  ├─ invoices-indexeddb.repository.ts
│  │  │  │  ├─ quotes-indexeddb.repository.ts
│  │  │  │  └─ stock-indexeddb.repository.ts
│  │  │  ├─ invoices.repository.ts
│  │  │  ├─ ipc
│  │  │  │  ├─ clients-ipc.repository.ts
│  │  │  │  ├─ invoices-ipc.repository.ts
│  │  │  │  ├─ quotes-ipc.repository.ts
│  │  │  │  └─ stock-ipc.repository.ts
│  │  │  ├─ quotes.repository.ts
│  │  │  ├─ repository.providers.ts
│  │  │  ├─ salary-advances.repository.ts
│  │  │  ├─ salary-bonuses.repository.ts
│  │  │  ├─ salary-overtimes.repository.ts
│  │  │  └─ stock.repository.ts
│  │  ├─ services
│  │  │  ├─ auth.service.ts
│  │  │  ├─ client-persistence.service.ts
│  │  │  ├─ client-storage.service.ts
│  │  │  ├─ client-store.service.ts
│  │  │  ├─ electron.service.ts
│  │  │  ├─ invoice-calc.service.ts
│  │  │  ├─ invoice-persistence.service.ts
│  │  │  ├─ invoice-storage.service.ts
│  │  │  ├─ invoice-store.service.ts
│  │  │  ├─ ipc.service.ts
│  │  │  ├─ quote-calc.service.ts
│  │  │  ├─ quote-persistence.service.ts
│  │  │  ├─ quote-storage.service.ts
│  │  │  ├─ quote-store.service.ts
│  │  │  ├─ salary-summary.service.ts
│  │  │  ├─ stock-storage.service.ts
│  │  │  └─ stock-store.service.ts
│  │  ├─ settings
│  │  │  ├─ settings.component.css
│  │  │  ├─ settings.component.html
│  │  │  └─ settings.component.ts
│  │  ├─ types
│  │  │  └─ electron.d.ts
│  │  └─ utils
│  │     └─ master-document-render.ts
│  ├─ assets
│  │  ├─ 111111.png
│  │  ├─ 111111_upscayl_4x_upscayl-standard-4x.png
│  │  ├─ 118 40 Equerre d'alignement dormant.png
│  │  ├─ 40 100.png
│  │  ├─ 40 102.png
│  │  ├─ 40 103.png
│  │  ├─ 40 104.png
│  │  ├─ 40 107.png
│  │  ├─ 40 108.png
│  │  ├─ 40 110.png
│  │  ├─ 40 112.png
│  │  ├─ 40 121.png
│  │  ├─ 40 128.png
│  │  ├─ 40 139.png
│  │  ├─ 40 148.png
│  │  ├─ 40 150.png
│  │  ├─ 40 151.png
│  │  ├─ 40 153.png
│  │  ├─ 40 154.png
│  │  ├─ 40 155.png
│  │  ├─ 40 156.png
│  │  ├─ 40 161.png
│  │  ├─ 40 164.png
│  │  ├─ 40 166.png
│  │  ├─ 40 401.png
│  │  ├─ 40 402.png
│  │  ├─ 67 101.png
│  │  ├─ 67 102.png
│  │  ├─ 67 103.png
│  │  ├─ 67 104.png
│  │  ├─ 67 105.png
│  │  ├─ 67 106.png
│  │  ├─ 67 107.png
│  │  ├─ 67 108.png
│  │  ├─ 67 114.png
│  │  ├─ Angle pour parcloses arrondies.png
│  │  ├─ Busette anti-vent.png
│  │  ├─ busette antivent.png
│  │  ├─ Béquille Luna.png
│  │  ├─ camion SPA.jpg
│  │  ├─ catalogue_prix_norm.json
│  │  ├─ Compas d'arrêt pour souet.png
│  │  ├─ Crémone Luna.png
│  │  ├─ Cylindre 60 mm Européen 30
│  │  ├─ Cylindre 60 mm Européen 30 30.png
│  │  ├─ Cylindre 70 mm à olive 30 40.png
│  │  ├─ Embout battement central.png
│  │  ├─ Equerre a visser dormant.png
│  │  ├─ Equerre à pion.png
│  │  ├─ Equerre à sertir en Alu.png
│  │  ├─ EX45 A114 Equerre d'alignement dormant.png
│  │  ├─ Ferme porte.png
│  │  ├─ Fermeture encastree fenetre fermeture automatique.png
│  │  ├─ Fermeture encastree porte-fenetre fermeture avec boutin de debloquage.png
│  │  ├─ Gâche pour serrure verticale en PVC.png
│  │  ├─ Joint brosse 8mm.png
│  │  ├─ joint brosse(fin seal) 6 mm.png
│  │  ├─ Joint de battement.png
│  │  ├─ joint de bourrage 2mm.png
│  │  ├─ joint U de vitarge 6 mm.png
│  │  ├─ Joint vitrage 3mm.png
│  │  ├─ Kit coulissant.png
│  │  ├─ Kit crémone.png
│  │  ├─ Kit semi fixe.png
│  │  ├─ logospa.png
│  │  ├─ Loqueteau pour souet.png
│  │  ├─ placeholder.png
│  │  ├─ Serrure horizontale (Pêne dormant et demi tour).png
│  │  ├─ Serrure verticale sans cylindre (Pêne dormant et demi tour).png
│  │  ├─ Serrure verticale sans cylindre (pêne dormant et rouleau).png
│  │  └─ signature-cachet.png
│  ├─ index.html
│  ├─ main.ts
│  ├─ styles.css
│  └─ types
│     └─ html2pdf.d.ts
├─ tsconfig.app.json
├─ tsconfig.json
├─ UPDATE_SETUP.md
└─ web

```
``