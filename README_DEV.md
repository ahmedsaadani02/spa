# README_DEV

Notes de developpement et de depannage pour la version web-only.

## Versions cibles

- Node.js `22.x`
- npm `10+`
- Angular `21.x`

## Installation propre

```powershell
Set-Location "c:\Users\Ahmed Saadani\Desktop\spa-test"

Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force backend\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force out-tsc -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .angular -ErrorAction SilentlyContinue

npm.cmd cache verify
npm.cmd install
npm.cmd run web:setup
```

## Variables d'environnement

```env
RESEND_API_KEY=...
RESEND_FROM_EMAIL=no-reply@votredomaine.com
RESEND_FROM_NAME=SPA Facturation
```

Ne jamais exposer ces variables cote frontend.

## Commandes utiles

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd run web:serve
```

Services separes :

```powershell
npm.cmd run backend:start
npm.cmd run frontend:start
```

## Depannage rapide

- Si PowerShell bloque `npm.ps1`, utiliser `npm.cmd`.
- Si `npm run web:serve` echoue avec `EADDRINUSE`, liberer le port `3000` ou `4201` puis relancer.
- Si `better-sqlite3` ne charge pas, relancer `npm.cmd run web:setup`.
