# Déploiement FACAM ACADEMIA — Railway (API) + Vercel (Web)

Ce document décrit la mise en production complète : API sur Railway, frontend sur Vercel, base PostgreSQL (Supabase).

---

## 1. Prérequis

- Compte [Railway](https://railway.app) et [Vercel](https://vercel.com)
- Base PostgreSQL (ex. [Supabase](https://supabase.com)) avec les migrations Prisma appliquées
- Dépôt Git connecté à Railway et Vercel

---

## 2. API (NestJS) sur Railway

### 2.1 Créer le projet Railway

1. Nouveau projet → **Deploy from GitHub repo** → sélectionner le dépôt.
2. **Root Directory** : laisser **vide** (racine du monorepo, où se trouve le `Dockerfile`).
3. Railway détecte le **Dockerfile** et l’utilise pour le build (plus de Nixpacks).

### 2.2 Build et démarrage (Dockerfile)

- **Build** : `COPY` du code → `npm ci` → `npx turbo run build --filter=api` → création de `apps/api/dist`.
- **Démarrage** : `apps/api/scripts/start-production.sh` qui exécute :
  - `npx prisma migrate deploy` (mise à jour du schéma en production),
  - puis `node dist/main.js`.

Aucune configuration supplémentaire à faire dans Railway pour le build si le Dockerfile est à la racine.

### 2.3 Variables d’environnement (Railway)

Dans le service API → **Variables** → ajouter :

| Variable       | Obligatoire | Description                                                                                |
| -------------- | ----------- | ------------------------------------------------------------------------------------------ |
| `DATABASE_URL` | Oui         | URL PostgreSQL (pooler, ex. Supabase port 6543, avec `?pgbouncer=true&connection_limit=1`) |
| `DIRECT_URL`   | Oui         | URL PostgreSQL directe (port 5432) pour les migrations Prisma                              |
| `JWT_SECRET`   | Oui         | Secret pour signer les JWT (min. 32 caractères, aléatoire)                                 |
| `PORT`         | Non         | Railway le définit automatiquement                                                         |
| `CORS_ORIGIN`  | Recommandé  | Origine(s) du frontend, ex. `https://ton-app.vercel.app` (ou `*` en dev)                   |
| `SMTP_HOST`    | Si emails   | Ex. `smtp.gmail.com`                                                                       |
| `SMTP_PORT`    | Si emails   | Ex. `587`                                                                                  |
| `SMTP_USER`    | Si emails   | Adresse email (Gmail : utiliser un mot de passe d’application)                             |
| `SMTP_PASS`    | Si emails   | Mot de passe SMTP                                                                          |

Référence complète : `apps/api/.env.example`.

### 2.4 Health check

- Dans Railway, configurer le **Health Check** avec le chemin : **`/health`**.
- L’API expose `GET /health` (et `GET /health/db` pour la base).

### 2.5 Domaine et URL

- Noter l’URL publique du service (ex. `https://xxx.railway.app`) pour la config CORS et le frontend (`NEXT_PUBLIC_API_URL`).

---

## 3. Frontend (Next.js) sur Vercel

### 3.1 Créer le projet Vercel

1. **Import** du même dépôt Git.
2. **Root Directory** : laisser **vide** (racine du monorepo).
3. Vercel utilise le **`vercel.json`** à la racine :
   - `installCommand` : `npm ci`
   - `buildCommand` : `npm ci && npx turbo run build --filter=web`
   - `outputDirectory` : `apps/web/.next`
   - `framework` : `nextjs`

Si tu préfères définir le root dans l’UI : **Root Directory** = `apps/web`, puis **Override** :

- **Build Command** : `cd ../.. && npm ci && npx turbo run build --filter=web`
- **Output Directory** : `.next`

### 3.2 Variables d’environnement (Vercel)

Dans le projet → **Settings** → **Environment Variables** :

| Variable              | Valeur                                               |
| --------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | URL de l’API Railway (ex. `https://xxx.railway.app`) |

Référence : `apps/web/.env.example`.

### 3.3 Redéploiement

À chaque push sur la branche connectée, Vercel rebuild et redéploie le frontend.

---

## 4. Base de données (Supabase / PostgreSQL)

### 4.1 Migrations

- En **local** : `cd apps/api && npx prisma migrate dev` pour créer les migrations.
- En **production** : les migrations sont appliquées au **démarrage** de l’API sur Railway via `start-production.sh` (`prisma migrate deploy`). Aucune action manuelle nécessaire à chaque déploiement.

### 4.2 Première mise en place

Si la base de production est vide :

1. Créer le projet Supabase (ou autre PostgreSQL).
2. Renseigner `DATABASE_URL` et `DIRECT_URL` dans Railway.
3. Au premier déploiement, le script de démarrage exécute `prisma migrate deploy` et crée les tables.

### 4.3 Seed (optionnel)

Pour insérer des données initiales (ex. admin) :

- En local, avec `DATABASE_URL` pointant vers la base de prod :  
  `cd apps/api && npx prisma db seed`
- Ou exécuter le seed une fois depuis une machine de confiance avec les mêmes variables.

---

## 5. Récapitulatif des fichiers de déploiement

| Fichier / Dossier                      | Rôle                                                 |
| -------------------------------------- | ---------------------------------------------------- |
| `Dockerfile`                           | Build et image Docker de l’API pour Railway          |
| `.dockerignore`                        | Réduit le contexte Docker et évite d’écraser `dist`  |
| `apps/api/scripts/start-production.sh` | Migrations Prisma + démarrage de l’API en production |
| `apps/api/.env.example`                | Liste des variables d’environnement API              |
| `apps/web/.env.example`                | Variable(s) d’environnement frontend                 |
| `vercel.json` (racine)                 | Config build Vercel pour le monorepo (app `web`)     |

---

## 6. Ordre de déploiement recommandé

1. Créer la base PostgreSQL (Supabase) et noter `DATABASE_URL` / `DIRECT_URL`.
2. Déployer l’**API** sur Railway avec ces variables + `JWT_SECRET` (+ SMTP si besoin).
3. Noter l’URL publique de l’API.
4. Déployer le **frontend** sur Vercel avec `NEXT_PUBLIC_API_URL` = URL de l’API.
5. Dans Railway, définir `CORS_ORIGIN` = URL du frontend Vercel (ex. `https://ton-app.vercel.app`).
6. Tester : connexion, appels API, health check `/health` et `/health/db`.

---

## 7. Dépannage

- **API ne démarre pas (Cannot find module dist/main.js)** : le build Docker doit bien produire `apps/api/dist`. Vérifier que le Dockerfile est à la racine et qu’aucune étape n’écrase le dossier `dist` (pas de second `COPY` après le build).
- **Health check failed** : vérifier que le **port** utilisé par l’API est bien celui fourni par Railway (`PORT`) et que le path est `/health`.
- **Frontend ne joint pas l’API** : vérifier `NEXT_PUBLIC_API_URL` sur Vercel et `CORS_ORIGIN` sur Railway (origine exacte du frontend).
- **Erreurs Prisma en prod** : vérifier `DATABASE_URL` (pooler) et `DIRECT_URL` (connexion directe pour les migrations).

Pour la config locale et les mails, voir aussi `CONFIGURATION.md`.
