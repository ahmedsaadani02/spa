# SPA Web

Application web de gestion commerciale pour SPA, avec frontend Angular dans `frontend/` et backend Express dans `backend/`.

## Structure

```text
spa-test/
├── frontend/         # application Angular
├── backend/          # API Express + acces base locale
├── package.json      # scripts racine
├── README.md
├── README_DEV.md
└── UPDATE_SETUP.md
```

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
RESEND_API_KEY=
RESEND_FROM_EMAIL=
RESEND_FROM_NAME=SPA Facturation
```

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

## Notes

- `README_DEV.md` contient les notes de dev et de depannage.
- `UPDATE_SETUP.md` contient le pense-bete de deploiement web.
