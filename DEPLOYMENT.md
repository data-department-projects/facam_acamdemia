# Déploiement FACAM ACADEMIA

Ce document décrit la mise en place et le déploiement du projet : **frontend sur Vercel**, **backend sur Railway**. La configuration est définie dans le repo (**config as code**) : `vercel.json`, `railway.toml`.

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

| Paramètre          | Valeur                                                                      |
| ------------------ | --------------------------------------------------------------------------- |
| **Root Directory** | **Laisser VIDE** (obligatoire pour un monorepo avec Turbo)                  |
| **Build Command**  | Surchargé par `railway.toml` : `npm ci && npx turbo run build --filter=api` |
| **Start Command**  | Surchargé par `railway.toml` : `cd apps/api && node dist/main.js`           |

> **Critique — Root Directory**  
> Si tu mets **Root Directory** = `apps/api`, Railway exécute tout depuis ce sous-dossier : il n’y a plus de Turbo ni de workspaces, le build ne produit pas `dist/` au bon endroit et au démarrage tu obtiens **`Cannot find module '.../dist/main'`**. Il faut absolument laisser **Root Directory vide** et laisser le `railway.toml` à la racine piloter build et start.

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

- **Deploy** (ou push sur la branche connectée). Railway exécute l’install + build (définis dans `railway.toml`) puis la **Start Command**.
- Une fois le déploiement vert, ouvre l’onglet **Settings** → **Networking** (ou **Generate Domain**) et note l’URL publique (ex. `https://ton-api.up.railway.app`).
- L’API expose **GET /health** pour les health checks Railway (déjà configuré dans `railway.toml`).

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

### 2.2 Où trouver Root Directory, Build Command et Output Directory

Ces réglages ne sont **pas** dans la page « General » (Project Name, Project ID) ni dans Vercel Toolbar / Transfer / Delete Project.

- Dans la **barre latérale gauche**, ouvre **Settings** du projet.
- Clique sur **Build and Deployment** (ou **Build and development**, selon l’interface).
- Dans cette page, **défile vers le bas** : tu y trouveras **Root Directory**, **Framework Preset**, **Build Command**, **Output Directory**, **Install Command**.

Référence : [Configure a build (Vercel)](https://vercel.com/docs/deployments/configure-a-build#root-directory).

### 2.3 Configuration pour ne déployer que le frontend (recommandé)

Pour que **seul le frontend** soit construit et déployé (le backend reste sur Railway), utilise **la racine du repo** et laisse le `vercel.json` du repo piloter le build :

| Paramètre            | Valeur                                                                    |
| -------------------- | ------------------------------------------------------------------------- |
| **Root Directory**   | _(laisser vide)_                                                          |
| **Framework Preset** | Next.js                                                                   |
| **Build Command**    | Activer **Override** et mettre : `npx turbo run build --filter=web`       |
| **Output Directory** | Activer **Override** et mettre : `apps/web/.next`                         |
| **Install Command**  | _(pas besoin d’Override ; le `vercel.json` utilise `npm ci` à la racine)_ |

Avec **Root Directory** vide, le build tourne à la racine du monorepo, ne construit que l’app `web` grâce à `--filter=web`, et Vercel sert le résultat depuis `apps/web/.next`. L’API (NestJS) n’est ni construite ni déployée sur Vercel.

**Si tu avais mis Root Directory = `apps/web`** : dans ce cas il faut **Output Directory** = `.next` (et **Install Command** = `cd ../.. && npm ci`). Sinon Vercel cherche `apps/web/apps/web/.next` et le déploiement échoue.

### 2.4 (Optionnel) Configuration avec Root Directory = apps/web

Si tu préfères que la « racine projet » Vercel soit `apps/web` :

| Paramètre            | Valeur                          |
| -------------------- | ------------------------------- |
| **Root Directory**   | `apps/web`                      |
| **Build Command**    | Override : `npm run build`      |
| **Output Directory** | Override : `.next`              |
| **Install Command**  | Override : `cd ../.. && npm ci` |

### 2.5 Variables d’environnement (Vercel)

Dans **Settings** → **Environment Variables** du projet Vercel :

| Variable              | Valeur                             | Environnement                      |
| --------------------- | ---------------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_API_URL` | URL de ton API Railway (étape 1.4) | Production (et Preview si tu veux) |

Exemple : `https://ton-api.up.railway.app` (sans slash final).

### 2.6 Déploiement

- **Deploy** (ou push sur la branche liée). Vercel build depuis `apps/web` et déploie.
- Note l’URL du site (ex. `https://facam-academia.vercel.app`).

### 2.7 Revenir sur Railway (CORS)

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
- **Build Railway échoué** : vérifier que les variables (notamment `DATABASE_URL`) sont définies et que **Root Directory** est vide.
- **`Cannot find module '.../dist/main'` ou `.../dist/main.js`** : cela signifie que le build ne s’est pas fait depuis la racine du repo (souvent parce que **Root Directory** est réglé sur `apps/api`). Il faut **laisser Root Directory vide** dans les paramètres du service Railway. Le `railway.toml` à la racine impose alors build et start depuis la racine ; le dossier `apps/api/dist` est bien créé et le start `cd apps/api && node dist/main.js` fonctionne.
- **Build Vercel échoué** : avec Root Directory vide, activer les Override **Build Command** = `npx turbo run build --filter=web` et **Output Directory** = `apps/web/.next` (voir section 2.3).

---

## Config as code (fichiers dans le repo)

| Fichier                 | Rôle                                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------- |
| `vercel.json`           | Build, install et output pour le frontend (déploiement depuis la racine).                                 |
| `railway.toml`          | Build, start, health check et watch patterns pour l’API sur Railway. **Root Directory** doit rester vide. |
| `apps/api/.env.example` | Liste des variables d’environnement attendues par l’API.                                                  |
| `.nvmrc`                | Version Node (20) pour cohérence locale et sur les plateformes qui le lisent.                             |

---

## CI/CD

- **`.github/workflows/ci.yml`** : à chaque push/PR sur `main`, `master` ou `develop` — `npm ci`, lint, format check, build, tests unitaires. Valide que le monorepo reste déployable.
- **`.github/workflows/cd.yml`** : à chaque push sur `main` ou `master` — build complet pour valider avant que Vercel/Railway ne déploient (les déploiements réels sont déclenchés par les intégrations GitHub de Vercel et Railway).

Une fois les étapes ci-dessus faites, le projet est prêt pour un déploiement stable ; en cas de régression, la CI et les health checks aident à détecter les problèmes tôt.
