# Structure du projet et qualité — FACAM ACADEMIA

Ce document décrit l’organisation des dossiers, les scripts npm, la configuration ESLint/Prettier et la gestion des migrations Prisma. Il sert de référence pour les développeurs et pour la maintenance du monorepo.

---

## 1. Organisation des dossiers

```
Code/
├── apps/
│   ├── web/                    # Frontend Next.js 15 (App Router)
│   │   ├── src/                # Pages, composants, styles
│   │   ├── public/
│   │   ├── .env.example
│   │   └── package.json
│   └── api/                    # Backend NestJS
│       ├── src/                # Modules, contrôleurs, services
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── migrations/     # Migrations versionnées
│       │   └── seed.ts
│       ├── scripts/            # Scripts de déploiement (ex. start-production.sh)
│       └── package.json
├── packages/
│   └── shared/                 # Types et utilitaires partagés (web + api)
│       ├── src/
│       └── package.json
├── docs/                       # Documentation projet
│   ├── DEVOPS-INFRASTRUCTURE-PLAN.md
│   ├── ENV.md
│   ├── STRUCTURE.md            # Ce fichier
│   └── (GIT-WORKFLOW.md si créé)
├── .github/
│   └── workflows/
│       ├── ci.yml              # CI (lint, format, build, tests)
│       └── deploy.yml         # CD (vérification build sur production)
├── .env.example               # Modèle variables (racine)
├── .prettierrc
├── .prettierignore
├── eslint.config.mjs           # ESLint racine (lint-staged)
├── turbo.json
├── vercel.json                 # Config build Vercel (monorepo)
├── render.yaml                 # Config Render (API)
├── DEPLOYMENT.md               # (si présent) procédure déploiement
└── package.json                # Workspaces + scripts racine
```

- **apps/** : applications déployables (web sur Vercel, api sur Render).
- **packages/** : librairies internes au monorepo (shared utilisé par web et api).
- **docs/** : toute la doc technique et DevOps.
- Fichiers à la racine : config partagée (ESLint, Prettier, Turbo, déploiement).

---

## 2. Scripts npm

### 2.1 À la racine (monorepo)

Exécuter depuis la racine du projet (`npm run <script>`).

| Script           | Commande                                          | Description                                      |
| ---------------- | ------------------------------------------------- | ------------------------------------------------ |
| `dev`            | `turbo run dev`                                   | Lance web et api en parallèle (mode watch).      |
| `build`          | `turbo run build`                                 | Build de tout le monorepo (shared → api, web).   |
| `vercel-build`   | `turbo run build --filter=web`                    | Build utilisé par Vercel (frontend uniquement).  |
| `lint`           | `turbo run lint`                                  | Lint ESLint sur toutes les apps.                 |
| `lint:fix`       | `turbo run lint:fix`                              | Lint + correction automatique.                   |
| `format`         | `prettier --write "**/*.{ts,tsx,js,jsx,json,md}"` | Formate tout le code avec Prettier.              |
| `format:check`   | `prettier --check "..."`                          | Vérifie le format (utilisé en CI).               |
| `test`           | `turbo run test`                                  | Lance les tests (toutes les apps).               |
| `test:unit`      | `turbo run test:unit`                             | Tests unitaires uniquement (CI).                 |
| `test:e2e`       | `turbo run test:e2e`                              | Tests end-to-end.                                |
| `prepush`        | `lint && build && test`                           | À lancer avant push (optionnel, ou via husky).   |
| `clean`          | `turbo run clean --force`                         | Supprime .next, dist, caches.                    |
| `prisma:migrate` | voir § 3                                          | Créer / appliquer les migrations en local (API). |
| `prisma:studio`  | voir § 3                                          | Ouvre Prisma Studio sur la base configurée.      |
| `db:seed`        | voir § 3                                          | Exécute le seed Prisma (API).                    |

### 2.2 Depuis `apps/web`

| Script               | Description                           |
| -------------------- | ------------------------------------- |
| `dev`                | `next dev`                            |
| `build`              | `next build`                          |
| `start`              | `next start` (après build)            |
| `lint` / `lint:fix`  | ESLint (config Next.js + TypeScript). |
| `test` / `test:unit` | Jest.                                 |

### 2.3 Depuis `apps/api`

| Script                            | Description                     |
| --------------------------------- | ------------------------------- |
| `dev`                             | `nest start --watch`            |
| `build`                           | `prisma generate && nest build` |
| `prisma:generate`                 | Génère le client Prisma.        |
| `prisma:migrate`                  | `prisma migrate dev` (local).   |
| `prisma:studio`                   | Ouvre Prisma Studio.            |
| `db:seed`                         | `prisma db seed`                |
| `lint` / `lint:fix`               | ESLint (NestJS + TypeScript).   |
| `test` / `test:unit` / `test:e2e` | Jest.                           |

---

## 3. Gestion des migrations Prisma

Les migrations sont dans **`apps/api/prisma/migrations/`** et sont versionnées dans Git.

### 3.1 En local (développement)

- **Créer une nouvelle migration** (après modification de `schema.prisma`) :

  ```bash
  cd apps/api && npx prisma migrate dev --name description_courte
  ```

  Ou depuis la racine : **`npm run prisma:migrate`** (si le script est configuré, voir ci‑dessous).

- **Appliquer les migrations** sur la base locale : `prisma migrate dev` les applique automatiquement.

- **Prisma Studio** (interface visuelle sur la base) :
  ```bash
  cd apps/api && npx prisma studio
  ```
  Ou depuis la racine : **`npm run prisma:studio`**.

### 3.2 En production

- Sur Render, préférer une commande **Pre-Deploy** : `prisma migrate deploy` (évite d’exécuter des migrations à chaque redémarrage).

### 3.3 Bonnes pratiques

- Toujours créer une migration après un changement de `schema.prisma` (`prisma migrate dev`).
- Ne pas modifier à la main les fichiers SQL déjà générés dans `migrations/` (sauf correction exceptionnelle et documentée).
- Pour les changements destructifs (suppression de colonnes, etc.) : backup de la base avant migration et tester en staging si possible.

Référence déploiement : **`DEPLOYMENT.md`** § 4.

---

## 4. ESLint

- **Racine** : `eslint.config.mjs` (format flat ESLint 9+). Utilisé par **lint-staged** lors des commits (fichiers .ts/.tsx/.js/.jsx).
- **apps/web** : `apps/web/eslint.config.mjs` (règles Next.js + TypeScript). C’est cette config qui est utilisée pour `npm run lint` dans web.
- **apps/api** : `apps/api/eslint.config.mjs` (NestJS + TypeScript). Utilisée pour `npm run lint` dans api.

À la racine, `npm run lint` exécute `turbo run lint`, qui lance le lint dans chaque app avec sa propre config. Le fichier racine assure une base commune pour lint-staged.

---

## 5. Prettier

- **Config** : `.prettierrc` à la racine (semi, singleQuote, tabWidth 2, trailingComma es5, printWidth 100).
- **Ignore** : `.prettierignore` (node_modules, .next, dist, coverage, .turbo, package-lock.json).

Toute l’équipe utilise la même config ; les fichiers sont formatés avec `npm run format`. La CI exécute `npm run format:check` pour refuser les commits non formatés.

---

## 6. Turborepo

- **Config** : `turbo.json` à la racine.
- **Tasks** : `build` (dépend de ^build), `dev`, `lint`, `test`, `clean`, etc.
- **Cache** : Turbo met en cache les sorties de build/lint/test pour accélérer les runs suivants.

Les variables d’environnement utilisées par Turbo sont listées dans `globalEnv` (ex. `NEXT_PUBLIC_API_URL`, `NODE_ENV`) pour invalidation correcte du cache.

---

## 7. Liens utiles

| Document                               | Contenu                                                  |
| -------------------------------------- | -------------------------------------------------------- |
| **README.md**                          | Présentation, prérequis, commandes de base, lien Git.    |
| **DEPLOYMENT.md**                      | Déploiement Vercel + Render, variables, rollback.        |
| **docs/ENV.md**                        | Variables d’environnement par environnement et sécurité. |
| **docs/DEVOPS-INFRASTRUCTURE-PLAN.md** | Stratégie branches, CI/CD, étapes réalisées.             |
