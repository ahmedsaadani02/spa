# README_DEV

Guide de stabilisation toolchain/runtime pour Angular + Electron + better-sqlite3 sous Windows.

## Versions cibles

- `electron`: `37.10.3`
- `better-sqlite3`: `11.10.0`
- `@electron/rebuild`: `4.0.3`
- Node recommande: `22.x` (LTS)
- npm recommande: `10+`

## Prerequis Windows

- Visual Studio Build Tools 2022 (workload **Desktop development with C++**)
- Python 3.x accessible dans le PATH (requis par node-gyp)

## Installation propre (PowerShell)

```powershell
Set-Location "c:\Users\Ahmed Saadani\Desktop\spa-test"

# Utiliser Node 22.x avant de continuer (nvm/volta/asdf selon votre environnement)
node -v

Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force release -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force server\node_modules -ErrorAction SilentlyContinue

if (Test-Path "$env:USERPROFILE\.electron-gyp") {
  Remove-Item -Recurse -Force "$env:USERPROFILE\.electron-gyp"
}

# Optionnel: regenerer le lock si vous venez d'une branche avec Electron 41
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

npm.cmd cache verify
npm.cmd install
```

## Configuration emails (Resend)

L'authentification (2FA / reset / setup) utilise Resend cote Electron main process.

1. Creer `.env` a la racine du projet (vous pouvez copier `.env.example`).
2. Renseigner:

```env
RESEND_API_KEY=...
RESEND_FROM_EMAIL=no-reply@votredomaine.com
RESEND_FROM_NAME=SPA Facturation
```

Important: ne jamais exposer ces variables cote frontend Angular.

## Rebuild natif explicite

```powershell
npm.cmd run rebuild:native
```

Ce script force le rebuild de `better-sqlite3` pour la version d'Electron declaree dans `package.json`.

## Lancement developpement Electron

```powershell
npm.cmd run electron:serve
```

Le script declenche d'abord `rebuild:native`, puis demarre Angular + Electron.
Il supprime aussi automatiquement `ELECTRON_RUN_AS_NODE` pour eviter un demarrage d'Electron en mode Node.

## Lancement mode web-first (navigateur)

```powershell
npm.cmd run start
```

Ce mode demarre:
- backend HTTP Node (`server/server.js`) sur `http://localhost:3000`
- frontend Angular sur `http://localhost:4200`

Le frontend utilise `proxy.conf.json` pour router `/api/*` vers le backend.

Avant le premier lancement web (ou apres un nettoyage), installer les deps serveur:

```powershell
npm.cmd run web:setup
```

Cela installe un `better-sqlite3` compatible ABI Node dans `server/node_modules` (independant du rebuild Electron).

## Build installable Windows

```powershell
npm.cmd run electron:build
```

## Depannage rapide

- Si `npm` est bloque par PowerShell (`npm.ps1`): utilisez `npm.cmd ...`.
- Si `ELECTRON_RUN_AS_NODE=1` existe sur la machine, `electron:serve` le neutralise automatiquement.
- Si le rebuild natif echoue en postinstall, l'installation continue avec un message clair.
  Relancez ensuite: `npm.cmd run rebuild:native`.
- Si vous voyez une ABI incorrecte de `better-sqlite3`, refaites le cycle "Installation propre" ci-dessus.
