# Déploiement FACAM ACADEMIA

Ce document décrit la mise en place et le déploiement du projet : **frontend sur Vercel**, **backend sur Railway**.

---

## Vue d’ensemble

| Composant                     | Plateforme | Rôle                                         |
| ----------------------------- | ---------- | -------------------------------------------- |
| **Frontend** (Next.js)        | Vercel     | App web, auth, appels API                    |
| **Backend** (NestJS + Prisma) | Railway    | API REST, base PostgreSQL (Supabase), emails |

Ordre recommandé : **1) Backend (Railway)** puis **2) Frontend (Vercel)** pour pouvoir configurer l’URL de l’API dans le frontend.

---

## Prérequis

- Compte [Vercel](https://vercel.com)
- Compte [Railway](https://railway.app)
- Projet poussé sur GitHub (ex. `data-department-projects/facam_acamdemia`)
- Base PostgreSQL déjà créée (ex. Supabase) avec `DATABASE_URL` et `DIRECT_URL`

---

## Étape 1 — Backend sur Railway

### 1.1 Créer un projet Railway

1. Va sur [railway.app](https://railway.app) et connecte-toi (GitHub).
2. **New Project** → **Deploy from GitHub repo**.
3. Choisis le dépôt `facam_acamdemia` (ou le nom de ton repo).
4. Railway crée un premier “service”. On va le configurer pour l’API.

### 1.2 Configurer le service (monorepo)

Dans le projet Railway, ouvre le service créé, puis **Settings** :

| Paramètre          | Valeur                                                                              |
| ------------------ | ----------------------------------------------------------------------------------- |
| **Root Directory** | _(laisser vide pour utiliser la racine du repo)_                                    |
| **Build Command**  | `npx turbo run build --filter=api`                                                  |
| **Start Command**  | `cd apps/api && npm run start:prod`                                                 |
| **Watch Paths**    | `apps/api/**` (optionnel, pour ne déclencher un déploiement que quand l’API change) |

Si Railway ne propose pas “Root Directory” et exécute tout depuis la racine, **Build** et **Start** ci-dessus suffisent.

### 1.3 Variables d’environnement (Railway)

Dans le même service : **Variables** (ou **Environment**) et ajoute :

| Variable          | Description                                                                          | Exemple                                              |
| ----------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `DATABASE_URL`    | URL PostgreSQL (Supabase, pooler si besoin)                                          | `postgresql://user:pass@host:6543/db?pgbouncer=true` |
| `DIRECT_URL`      | URL directe (migrations)                                                             | `postgresql://user:pass@host:5432/db`                |
| `PORT`            | Port (Railway l’injecte souvent ; tu peux ne pas le mettre)                          | `3001` ou laisser Railway                            |
| `JWT_SECRET`      | Secret pour les JWT                                                                  | Une longue chaîne aléatoire                          |
| `CORS_ORIGIN`     | Origine(s) autorisée(s) — ton frontend Vercel (plusieurs : séparer par des virgules) | `https://ton-app.vercel.app`                         |
| `SMTP_HOST`       | Serveur SMTP                                                                         | `smtp.gmail.com`                                     |
| `SMTP_PORT`       | Port SMTP                                                                            | `587`                                                |
| `SMTP_USER`       | Email Gmail                                                                          | ton-email@gmail.com                                  |
| `SMTP_PASS`       | Mot de passe d’application Gmail                                                     | xxx xxx xxx xxx                                      |
| `EMAIL_FROM_NAME` | Nom expéditeur                                                                       | `facam_academia`                                     |

- Tu ne connais pas encore l’URL du frontend : mets `CORS_ORIGIN` après avoir déployé sur Vercel (étape 2), ou mets `*` temporairement (moins sécurisé).
- Après le premier déploiement, lance les migrations depuis ta machine (voir 1.5) ou via une commande Railway si tu la configures.

### 1.4 Déployer

- **Deploy** (ou push sur la branche connectée). Railway exécute la **Build Command** puis la **Start Command**.
- Une fois le déploiement vert, ouvre l’onglet **Settings** → **Networking** (ou **Generate Domain**) et note l’URL publique (ex. `https://ton-api.up.railway.app`).

### 1.5 Migrations Prisma

En local (une seule fois ou à chaque nouvelle migration) :

```bash
cd Code
# Remplacer par ta DATABASE_URL de production si besoin
export DATABASE_URL="postgresql://..."   # ou définir dans .env
cd apps/api
npx prisma migrate deploy
```

Optionnel : sur Railway, tu peux ajouter une variable ou un “one-off” qui exécute `cd apps/api && npx prisma migrate deploy` au démarrage (selon la doc Railway).

---

## Étape 2 — Frontend sur Vercel

### 2.1 Importer le projet

1. Va sur [vercel.com](https://vercel.com) et connecte-toi (GitHub).
2. **Add New** → **Project** → importe le repo `facam_acamdemia`.

### 2.2 Configuration du projet (monorepo)

Lors de l’import (ou dans **Settings** du projet) :

| Paramètre            | Valeur                                                |
| -------------------- | ----------------------------------------------------- |
| **Framework Preset** | Next.js                                               |
| **Root Directory**   | `apps/web`                                            |
| **Build Command**    | `npm run build`                                       |
| **Output Directory** | _(laisser vide ; Next.js utilise `.next` par défaut)_ |
| **Install Command**  | `cd ../.. && npm ci`                                  |

L’**Install Command** installe les dépendances à la racine du monorepo pour que le workspace `@facam-academia/shared` soit disponible dans `apps/web`.

**Alternative (déploiement depuis la racine du repo)** : laisser **Root Directory** vide et ne pas modifier Build/Install. Le `vercel.json` à la racine du repo configure alors le build (`turbo run build --filter=web`) et l’output `apps/web/.next`. Utilise cette option si tu préfères tout gérer depuis la racine.

### 2.3 Variables d’environnement (Vercel)

Dans **Settings** → **Environment Variables** du projet Vercel :

| Variable              | Valeur                             | Environnement                      |
| --------------------- | ---------------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_API_URL` | URL de ton API Railway (étape 1.4) | Production (et Preview si tu veux) |

Exemple : `https://ton-api.up.railway.app` (sans slash final).

### 2.4 Déploiement

- **Deploy** (ou push sur la branche liée). Vercel build depuis `apps/web` et déploie.
- Note l’URL du site (ex. `https://facam-academia.vercel.app`).

### 2.5 Revenir sur Railway (CORS)

Dans Railway, dans les variables du service API, mets à jour :

- `CORS_ORIGIN` = `https://facam-academia.vercel.app` (ou ton domaine Vercel exact).

Redéploie le service API si besoin. Désormais le navigateur autorise les appels du frontend Vercel vers l’API Railway.

---

## Récapitulatif des URLs

À la fin tu dois avoir :

- **Frontend** : `https://ton-projet.vercel.app` (configuré dans `NEXT_PUBLIC_API_URL` côté Vercel).
- **Backend** : `https://ton-api.up.railway.app` (configuré dans `CORS_ORIGIN` côté Railway et utilisé par le frontend pour les appels API).

---

## Dépannage

- **CORS / requêtes bloquées** : vérifier que `CORS_ORIGIN` sur Railway correspond exactement à l’URL du frontend (protocole + domaine, sans slash final).
- **404 sur l’API** : vérifier que `NEXT_PUBLIC_API_URL` n’a pas de slash final et que les routes backend sont bien exposées (ex. `/auth/login`, etc.).
- **Build Railway échoué** : vérifier que **Build Command** et **Start Command** sont bien ceux de l’étape 1.2 et que les variables (notamment `DATABASE_URL`) sont définies.
- **Build Vercel échoué** : vérifier que **Root Directory** = `apps/web` et **Install Command** = `cd ../.. && npm ci`.

---

## Fichiers utiles dans le repo

- `vercel.json` : options de build Vercel (si déploiement depuis la racine).
- `railway.toml` (optionnel) : configuration Railway pour build/start.
- `apps/api/.env.example` : liste des variables attendues par l’API.

Une fois ces étapes faites, le projet est “en place” et déployé ; tu pourras ensuite t’assurer que tout est bon (tests, smoke tests sur les URLs, etc.).
