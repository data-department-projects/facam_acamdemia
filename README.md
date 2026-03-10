# FACAM ACADEMIA

Plateforme e-learning dédiée aux jeunes diplômés pour les formations industrielles (maintenane, production, QHSE, logistique).

## Stack

- **Monorepo** : npm workspaces + Turborepo
- **Frontend** : Next.js 15 (App Router), React 19, Tailwind CSS
- **Backend** : Nest.js, Prisma (Supabase)
- **CI/CD** : GitHub Actions, déploiement Vercel

## Prérequis

- Node.js 20+ (LTS)
- npm 9+ (livré avec Node.js)

```bash
npm install
```

## Développement

```bash
npm run dev          # Lance web + api en parallèle (Turborepo)
npm run build        # Build de tout le monorepo
npm run lint         # Lint (ESLint)
npm run format:check # Vérification Prettier
npm run test:unit    # Tests unitaires
```

## Structure

```
apps/
  web/     # Next.js (interface étudiants, responsables, admin)
  api/     # Nest.js (API REST, auth, modules, quiz, certifications)
packages/
  shared/  # Types et utilitaires partagés
.github/workflows/  # CI (lint, test, build) et CD (build pour deploy)
```

## Lien avec le dépôt GitHub

Le projet est relié au dépôt :  
**https://github.com/data-department-projects/facam_academia**

- Cloner : `git clone https://github.com/data-department-projects/facam_academia.git`
- Après modification : `git add .` → `git commit -m "..."` → `git push origin main`

## Déploiement (Vercel)

1. Connecter le repo GitHub à Vercel (Vercel GitHub App).
2. Configurer les variables d’environnement (voir `.env.example`).
3. Les pushes sur `main` déclenchent le déploiement automatique.

## Licence

Propriétaire – FACAM.
