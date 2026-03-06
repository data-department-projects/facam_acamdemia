# Guide de contribution – FACAM ACADEMIA

Ce fichier décrit comment contribuer au projet et garantir la qualité du code (branches, commits, CI/CD).

## Branches

- `main` : production, déploiement automatique (Vercel).
- `develop` : intégration des features.
- `feature/*` : nouvelle fonctionnalité (ex. `feature/quiz-builder`).
- `bugfix/*` : correction de bug.
- `release/*` : préparation d’une release.

## Workflow

1. Créer une branche depuis `develop` ou `main` selon la règle de l’équipe.
2. Développer, committer (les hooks Husky exécutent lint-staged : ESLint + Prettier sur les fichiers modifiés).
3. Pousser et ouvrir une Pull Request vers `main` ou `develop`.
4. La CI (GitHub Actions) exécute : lint, format check, build, tests unitaires. Corriger les erreurs avant merge.
5. Après merge sur `main`, le CD déclenche le build pour déploiement Vercel.

## Commandes utiles

- `npm run dev` : lancer frontend + backend en parallèle.
- `npm run lint` / `npm run lint:fix` : vérifier / corriger le code (ESLint).
- `npm run format:check` / `npm run format` : vérifier / formater (Prettier).
- `npm run test:unit` : lancer les tests unitaires.
- `npm run build` : build complet du monorepo.

## Lien GitHub

Dépôt : **https://github.com/data-department-projects/facam_academia**

Après le premier push, configurer la branche par défaut et la protection de `main` (ex. exigence de PR, statut CI réussi) dans les paramètres du repo.
