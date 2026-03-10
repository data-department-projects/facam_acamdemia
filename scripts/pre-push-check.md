# Checklist avant push / déploiement production

Exécuter ces commandes à la racine du monorepo (`Code/`) avant chaque push important.

## 1. Lint (tout le monorepo)

```bash
npm run lint
```

- **Shared** : `tsc --noEmit`
- **API** : ESLint sur `src`
- **Web** : ESLint avec `--max-warnings 0`

## 2. Build (tout le monorepo)

```bash
npm run build
```

- **Shared** : `tsc`
- **API** : `prisma generate && nest build`
- **Web** : `next build`

## 3. Tests

```bash
# API
cd apps/api && npm run test

# Web
cd apps/web && npm run test
```

## 4. Prisma (optionnel si pas de changement de schéma)

```bash
cd apps/api && npx prisma validate
```

## 5. Variables d'environnement production

- **API** : `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, etc. (voir `CONFIGURATION.md`)
- **Web** : `NEXT_PUBLIC_API_URL` pointant vers l’API (ex. Railway)

## Résumé des corrections effectuées (session actuelle)

- **Lint** : Dépendance `loadModules` dans `useEffect` (admin/users) ; imports inutilisés supprimés (Award, Clock) ; `chapterId` renommé en `_chapterId` dans ChapterVideoAndQuiz.
- **Tests API** : Mock de `PrismaService` ajouté dans `app.controller.spec.ts` pour résoudre l’injection de dépendances.
- **Build Web** : Tous les builds passent (24 pages générées).
