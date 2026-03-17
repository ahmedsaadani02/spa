# UPDATE_SETUP

## 1) Build une nouvelle version
1. Mettre a jour `version` dans `package.json` (ex: `1.0.1`).
2. Lancer:
```bash
npm run electron:build
```
3. Les artefacts sont generes dans `dist/`.

## 2) Fichiers a publier sur le serveur HTTP updates
Deposer dans le dossier serveur `http://192.168.10.13:8080/updates/`:
- `SPA Facturation Setup <version>.exe`
- `latest.yml`
- `SPA Facturation Setup <version>.exe.blockmap`

Le fichier `latest.yml` reference le setup et permet a `electron-updater` de detecter la nouvelle version.

## 3) Test de l'auto-update cote client
1. Installer une version plus ancienne de l'application sur le PC admin.
2. Publier les artefacts de la nouvelle version dans `/updates/`.
3. Ouvrir l'application admin:
- au demarrage, l'app verifie les mises a jour
- si update disponible: message + telechargement auto
- quand telechargement termine: proposition `Installer maintenant` / `Plus tard`

## 4) Verification rapide
- Ouvrir DevTools/console Electron et verifier les logs `[auto-update]`.
- Aller dans la page `Parametres` et cliquer `Verifier les mises a jour`.
- Verifier le statut:
  - `a jour`
  - `recherche...`
  - `telechargement...`
  - `pret a installer`
  - `erreur`

## 5) Notes importantes
- Les mises a jour automatiques ne sont actives qu'en mode package (`app.isPackaged = true`).
- Le serveur local Node + SQLite continue de demarrer via `electron/main.js`.
