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
