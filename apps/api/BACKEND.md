# Backend FACAM ACADEMIA — Vérification et démarrage

## Prérequis

- Node.js 18+
- Fichier `apps/api/.env` avec `DATABASE_URL`, `DIRECT_URL` (voir `CONNECTION-SUPABASE.md`)

## 1. Installer les dépendances (depuis la racine du monorepo)

```bash
cd Code
npm install
```

## 2. Générer le client Prisma

```bash
cd apps/api
npx prisma generate
```

## 3. Lancer les migrations (si pas déjà fait)

```bash
npx prisma migrate dev
```

## 4. Créer les utilisateurs de test (seed)

La base doit contenir au moins un utilisateur pour se connecter. Exécuter le seed :

```bash
cd apps/api
npm run db:seed
```

Cela crée :

- **admin@facam.com** / **admin123** (rôle admin)
- **etudiant@facam.com** / **demo123** (rôle student)

À modifier en production.

## 5. Démarrer l’API

```bash
cd apps/api
npm run dev
```

L’API écoute sur **http://localhost:3001**.

Si le port 3001 est déjà utilisé : arrêter l’autre processus ou définir `PORT=3002` dans `.env`.

## 6. Vérifier que tout fonctionne

- **Santé** : `GET http://localhost:3001/health` → `{ "status": "ok" }`
- **Login** : `POST http://localhost:3001/auth/login` avec body `{ "email": "admin@facam.com", "password": "admin123" }` → retourne `accessToken` et `user`
- **Formations** (avec JWT) : `GET http://localhost:3001/formations` avec header `Authorization: Bearer <accessToken>`

## Variables d’environnement utiles

| Variable       | Obligatoire | Description                                |
| -------------- | ----------- | ------------------------------------------ |
| DATABASE_URL   | Oui         | Connexion PostgreSQL (pooler 6543)         |
| DIRECT_URL     | Oui         | Connexion pour migrations (5432)           |
| JWT_SECRET     | Non         | Secret JWT (défaut : cle-secret-facam-dev) |
| PORT           | Non         | Port du serveur (défaut : 3001)            |
| RESEND_API_KEY | Non         | Envoi d’emails (OTP mot de passe)          |

## Routes principales

Voir `ENDPOINTS.md` pour la liste complète. Résumé :

- `GET /health` — santé
- `POST /auth/login` — connexion
- `GET /auth/me` — profil (JWT)
- `GET /formations` — liste des modules (JWT)
- `GET /formations/:id` — détail d’un module (JWT)
- `POST /users` — créer un utilisateur (admin, JWT)
- `GET /chapitres/module/:moduleId` — chapitres d’un module (JWT)
