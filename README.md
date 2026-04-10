# FACAM ACADEMIA

Plateforme e-learning dédié aux jeunes diplômés pour les formations industrielles (maintenane, production, QHSE, logistique)

## Stack

- **Monorepo** : npm workspaces + Turborep
- **Frontend** : Next.js 15 (App Router), React 19, Tailwind CSS
- **Backend** : Nest.js, Prisma (Supabase)
- **CI/CD** : GitHub Actions ; déploiement Vercel (web) + Render 
## Prérequis

- Node.js 20+ (LTS)
- npm 9+ (livré avec Node.js)

```bash
npm install
```

## Développement

```bash
npm run dev            # Lance web + api en parallèle (Turborepo)
npm run build          # Build de tout le monorepo
npm run lint           # Lint (ESLint)
npm run lint:fix       # Lint + correction auto
npm run format         # Formater le code (Prettier)
npm run format:check   # Vérification format (CI)
npm run test:unit      # Tests unitaires
npm run prisma:migrate # Migrations Prisma (depuis apps/api)
npm run prisma:studio  # Prisma Studio (depuis apps/api)
npm run db:seed        # Seed base (depuis apps/api)
```

Détail des scripts et structure : **`docs/STRUCTURE.md`**.

## Structure

```
apps/
  web/     # Next.js (interface étudiants, responsables, admin)
  api/     # Nest.js (API REST, auth, modules, quiz, certifications)
packages/
  shared/  # Types et utilitaires partagés
docs/      # Documentation (structure, env, déploiement, DevOps)
.github/workflows/  # CI (lint, test, build) et CD (deploy production)
```

Vue complète : **`docs/STRUCTURE.md`**.

## Branches et workflow Git

- **dev** : développement au quotidien
- **main** : intégration / staging
- **production** : déploiement automatique (Vercel + Render)

Travail sur `dev` → PR vers `main` → PR vers `production` pour déployer. Détail : **`docs/DEVOPS-INFRASTRUCTURE-PLAN.md`**.

## Dépôt GitHub

**https://github.com/data-department-projects/facam_academia**

- Cloner : `git clone https://github.com/data-department-projects/facam_academia.git`
- Développement : travailler sur la branche **`dev`**, puis ouvrir des PR selon le workflow ci‑dessus.

## Déploiement

- **Frontend** : Vercel (déploiement automatique sur chaque push vers la branche **`production`**).
- **Backend** : Render (idem, branche **`production`**).

Variables d'environnement, rollback et procédure complète : **`DEPLOYMENT.md`** et **`docs/ENV.md`**.

## Documentation

| Document                               | Contenu                                          |
| -------------------------------------- | ------------------------------------------------ |
| **docs/STRUCTURE.md**                  | Structure, scripts npm, ESLint, Prettier, Prisma |
| **docs/ENV.md**                        | Variables d'environnement et sécurité            |
| **DEPLOYMENT.md**                      | Déploiement Vercel + Render, rollback            |
| **docs/DEVOPS-INFRASTRUCTURE-PLAN.md** | Stratégie branches, CI/CD                        |

## Licence

Propriétaire – FACAM.
