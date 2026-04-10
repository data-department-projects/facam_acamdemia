#!/bin/sh
# Démarrage production (legacy Docker) : migrations Prisma puis lancement de l'API.
# Render : préférer une commande "Pre-Deploy" (prisma migrate deploy) et démarrer sans migrations.
# Ce script est conservé uniquement pour compatibilité d'anciens déploiements Docker.

set -e
cd "$(dirname "$0")/.."
echo "[start] Applying Prisma migrations..."
npx prisma migrate deploy
echo "[start] Starting API..."
exec node dist/src/main.js
