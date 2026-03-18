# UPDATE_SETUP

Pense-bete de deploiement pour la version web-only.

## 1. Preparer le build frontend

```powershell
npm.cmd install
npm.cmd run web:setup
npm.cmd run build
```

Le build Angular est genere dans `dist/`.

## 2. Preparer le backend

```powershell
npm.cmd run backend:install
```

Configurer ensuite les variables d'environnement du backend :

```env
RESEND_API_KEY=...
RESEND_FROM_EMAIL=no-reply@votredomaine.com
RESEND_FROM_NAME=SPA Facturation
```

## 3. Lancer l'API en production

```powershell
$env:NODE_ENV="production"
npm.cmd run start --prefix backend
```

## 4. Publier le frontend

Servir le contenu de `dist/` depuis votre hebergement statique, puis configurer un reverse proxy pour router `/api/*` vers l'API Express.

## 5. Verification rapide

- ouvrir l'application web
- tester login
- tester quelques modules metier
- verifier que `/api/ping` repond
