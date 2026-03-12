# Déploiement FACAM ACADEMIA — Railway (API) + Vercel (Web)

Ce document décrit la mise en production complète : API sur Railway, frontend sur Vercel, base PostgreSQL (Supabase).

---

## 0. Branche de déploiement (DevOps)

Le déploiement automatique se fait **uniquement** depuis la branche **`production`** :

- **Vercel** (frontend) et **Railway** (API) doivent être configurés pour déployer sur chaque push vers **`production`**.
- Ne pas déployer depuis `main` ni `dev` pour la production.
- Workflow GitHub Actions : `.github/workflows/deploy.yml` (vérification du build sur chaque push vers `production`).

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
3. **Branche à déployer** : configurer sur **`production`** (Settings du service → Branch = `production`).
4. Railway détecte le **Dockerfile** et l’utilise pour le build (plus de Nixpacks).

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

Référence complète : `.env.example` à la racine et `docs/ENV.md`.

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

### 3.3 Branche de production et redéploiement

- Dans **Settings** → **Git** : définir **Production Branch** sur **`production`**.
- À chaque push (ou merge) sur **`production`**, Vercel rebuild et redéploie le frontend en production.

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

| Fichier / Dossier                      | Rôle                                                    |
| -------------------------------------- | ------------------------------------------------------- |
| `Dockerfile`                           | Build et image Docker de l’API pour Railway             |
| `.dockerignore`                        | Réduit le contexte Docker et évite d’écraser `dist`     |
| `apps/api/scripts/start-production.sh` | Migrations Prisma + démarrage de l’API en production    |
| `apps/api/.env.example`                | Liste des variables d’environnement API                 |
| `apps/web/.env.example`                | Variable(s) d’environnement frontend                    |
| `vercel.json` (racine)                 | Config build Vercel pour le monorepo (app `web`)        |
| `docs/ENV.md`                          | Variables d’environnement par environnement et sécurité |

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

---

## 8. Rollback (retour en arrière)

En cas de problème après un déploiement, voici comment revenir à un état stable.

### 8.1 Rollback du code (Git)

Pour remettre la branche `production` à un commit ou un tag connu (ex. le tag créé avant la migration DevOps) :

```bash
# En local, sur la branche production
git fetch origin
git checkout production
git reset --hard <commit-hash>   # ou : git reset --hard pre-devops-migration
git push origin production --force
```

**Attention** : `--force` réécrit l’historique distant. À utiliser seulement après accord (ex. équipe / mainteneur). Après le push, Vercel et Railway déclencheront un nouveau déploiement à partir de ce commit.

### 8.2 Rollback du frontend (Vercel)

1. Vercel → projet → onglet **Deployments**.
2. Trouver un déploiement **réussi** antérieur (état vert).
3. Cliquer sur les **trois points (⋯)** de ce déploiement → **Promote to Production** (ou équivalent).
4. Ce déploiement devient la version servie en production, sans changer la branche Git.

### 8.3 Rollback de l’API (Railway)

1. Railway → projet → service API → onglet **Deployments** (ou **History**).
2. Choisir un **déploiement antérieur** qui fonctionnait.
3. Utiliser l’option **Redeploy** ou **Rollback** pour redéployer cette version (selon l’interface Railway).

### 8.4 Ordre recommandé en cas d’incident

1. Si seul le frontend pose problème : rollback Vercel (§ 8.2).
2. Si seule l’API pose problème : rollback Railway (§ 8.3).
3. Si le problème vient du code (bug, mauvaise release) : corriger sur `dev` → PR vers `main` → PR vers `production`, ou en urgence utiliser le rollback Git (§ 8.1) puis corriger proprement via une nouvelle PR.
