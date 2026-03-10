#!/bin/sh
# Démarrage production (Railway/Docker) : migrations Prisma puis lancement de l'API.
# À exécuter depuis la racine du monorepo (/app) avec le CWD du script = apps/api.

set -e
cd "$(dirname "$0")/.."
echo "[start] Applying Prisma migrations..."
npx prisma migrate deploy
echo "[start] Starting API..."
exec node dist/main.js
